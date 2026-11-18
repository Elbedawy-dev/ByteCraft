const Inquiry = require('../models/Inquiry');
const Project = require('../models/Project');
const ServicePlan = require('../models/ServicePlan');
const emailService = require('./email.service');
const { sanitizeText } = require('../utils/sanitize');
const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../config/constants');

/**
 * Inquiry Service
 * 
 * WHY:
 * 1. Spam Defense: Employs honeypot field detection to trap automated spam bots silently.
 * 2. Input Sanitization: Strips control characters and prepares safe text before persistence.
 * 3. Asynchronous Notification: Notifies the owner via email without blocking client response.
 * 4. Administrative Workflow: Allows the owner to track lead lifecycle states (new, in_progress, resolved).
 */

class InquiryService {
  /**
   * Submit a new customer inquiry (Public)
   */
  async createInquiry(data) {
    const {
      name,
      email,
      phone,
      subject,
      message,
      projectSlug,
      servicePlanId,
      locale = 'ar',
      hp,
      _hp,
      website,
    } = data;

    // 1. Honeypot check: Bots usually populate hidden inputs automatically
    if (hp || _hp || website) {
      console.warn(`🤖 [HONEYPOT] Spam bot trapped and silently ignored for email: ${email}`);
      return {
        id: 'bot_trapped',
        name,
        email,
        status: 'new',
        createdAt: new Date(),
      };
    }

    // 2. Sanitize user input
    const cleanName = sanitizeText(name);
    const cleanEmail = sanitizeText(email).toLowerCase();
    const cleanPhone = sanitizeText(phone || '');
    const cleanSubject = sanitizeText(subject);
    const cleanMessage = sanitizeText(message);

    // 3. Resolve optional project or service plan references
    let projectId = null;
    if (projectSlug) {
      const project = await Project.findOne({ slug: projectSlug.trim() });
      if (project) {
        projectId = project._id;
      }
    }

    let resolvedPlanId = null;
    if (servicePlanId) {
      const plan = await ServicePlan.findById(servicePlanId);
      if (plan) {
        resolvedPlanId = plan._id;
      }
    }

    // 4. Create inquiry record
    const inquiry = new Inquiry({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      subject: cleanSubject,
      message: cleanMessage,
      project: projectId,
      servicePlan: resolvedPlanId,
      locale,
      status: 'new',
    });

    await inquiry.save();

    // 5. Asynchronously notify the owner
    emailService.sendInquiryOwner(inquiry).catch((err) => {
      console.error(`⚠️ Failed to notify owner of inquiry: ${err.message}`);
    });

    return inquiry;
  }

  /**
   * List inquiries for Owner
   */
  async getOwnerInquiries({ page = 1, limit = 20, status, search } = {}) {
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
        { subject: { $regex: escaped, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [inquiries, total] = await Promise.all([
      Inquiry.find(filter)
        .populate('project', 'title slug')
        .populate('servicePlan', 'title deliveryDays')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Inquiry.countDocuments(filter),
    ]);

    return {
      inquiries,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get single inquiry by ID
   */
  async getOwnerInquiryById(id) {
    const inquiry = await Inquiry.findById(id)
      .populate('project', 'title slug')
      .populate('servicePlan', 'title deliveryDays');

    if (!inquiry) {
      throw AppError.notFound(`Inquiry "${id}" not found.`, ERROR_CODES.NOT_FOUND);
    }

    // Auto-mark as read if it was new
    if (inquiry.status === 'new') {
      inquiry.status = 'read';
      await inquiry.save();
    }

    return inquiry;
  }

  /**
   * Update inquiry status and administrative notes
   */
  async updateInquiry(id, { status, ownerNotes }) {
    const inquiry = await Inquiry.findById(id);
    if (!inquiry) {
      throw AppError.notFound(`Inquiry "${id}" not found.`, ERROR_CODES.NOT_FOUND);
    }

    if (status) inquiry.status = status;
    if (ownerNotes !== undefined) inquiry.ownerNotes = sanitizeText(ownerNotes);

    await inquiry.save();
    return inquiry;
  }

  /**
   * Delete inquiry
   */
  async deleteInquiry(id) {
    const inquiry = await Inquiry.findByIdAndDelete(id);
    if (!inquiry) {
      throw AppError.notFound(`Inquiry "${id}" not found.`, ERROR_CODES.NOT_FOUND);
    }
    return { id: inquiry._id };
  }
}

module.exports = new InquiryService();
