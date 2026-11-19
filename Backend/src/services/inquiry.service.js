const mongoose = require('mongoose');
const Inquiry = require('../models/Inquiry');
const Project = require('../models/Project');
const ServicePlan = require('../models/ServicePlan');
const emailService = require('./email.service');
const uploadService = require('./upload.service');
const {
  validateMagicBytes,
  ALLOWED_ATTACHMENT_MIMES,
  MAX_INQUIRY_ATTACHMENTS,
} = require('../middleware/upload.middleware');
const { sanitizeText } = require('../utils/sanitize');
const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../config/constants');

const INQUIRY_ATTACHMENTS_FOLDER = 'bytecraft/inquiries';

const PROJECT_TYPE_SUBJECTS = {
  lms: { ar: 'استفسار عن منصة تعليمية (LMS)', en: 'LMS Platform Inquiry' },
  ecommerce: { ar: 'استفسار عن متجر إلكتروني', en: 'E-Commerce Store Inquiry' },
  custom_mern: { ar: 'استفسار عن تطبيق ويب مخصص (MERN)', en: 'Custom MERN Web App Inquiry' },
  consulting: { ar: 'استفسار عن استشارة تقنية', en: 'Technical Consulting Inquiry' },
  other: { ar: 'استفسار عام عن مشروع', en: 'General Project Inquiry' },
};

/**
 * Inquiry Service
 * 
 * WHY:
 * 1. Spam Defense: Employs honeypot field detection to trap automated spam bots silently
 *    (checked before uploading attachments so bots cannot waste storage/bandwidth).
 * 2. Input Sanitization: Strips control characters and prepares safe text before persistence.
 * 3. Attachment Security: Validates real file magic bytes (JPEG, PNG, WebP, PDF) for every
 *    uploaded file before streaming to Cloudinary under a dedicated folder (`bytecraft/inquiries`).
 * 4. Asynchronous Notification: Notifies the owner via HTML-escaped email without blocking response.
 * 5. Administrative Workflow: Allows the owner to track lead lifecycle states (new, read, in_progress, resolved, archived).
 */

class InquiryService {
  /**
   * Auto-generates a human-readable subject from projectType when omitted by client
   */
  _generateDefaultSubject(projectType = 'other', locale = 'ar') {
    const labels = PROJECT_TYPE_SUBJECTS[projectType] || PROJECT_TYPE_SUBJECTS.other;
    return labels[locale] || labels.en;
  }

  /**
   * Submit a new customer inquiry (Public — supports JSON or multipart/form-data with up to 3 attachments)
   */
  async createInquiry(data, files = []) {
    const {
      name,
      email,
      phone,
      projectType = 'other',
      budgetRange = 'undecided',
      timeline = 'standard',
      subject,
      message,
      projectSlug,
      servicePlanId,
      locale = 'ar',
      hp,
      _hp,
      website,
    } = data;

    // 1. Honeypot check FIRST: Bots usually populate hidden inputs automatically.
    // Checking before file uploads prevents spam bots from consuming upload storage.
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

    // 2. Validate ALL attachments via magic bytes BEFORE uploading any of them
    const fileList = Array.isArray(files) ? files : [];
    if (fileList.length > MAX_INQUIRY_ATTACHMENTS) {
      throw AppError.badRequest(
        `Maximum of ${MAX_INQUIRY_ATTACHMENTS} attachment files are allowed.`,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const validatedFiles = fileList.map((file) => {
      const detectedMime = validateMagicBytes(file.buffer, ALLOWED_ATTACHMENT_MIMES);
      if (!detectedMime) {
        throw AppError.badRequest(
          'Invalid file type. File signature does not match an allowed image (JPEG, PNG, WebP) or PDF document.',
          ERROR_CODES.INVALID_FILE_TYPE
        );
      }
      return { file, detectedMime };
    });

    // 3. Upload validated attachments to dedicated Cloudinary folder (`bytecraft/inquiries`)
    const attachments = [];
    try {
      for (const { file, detectedMime } of validatedFiles) {
        const uploadRes = await uploadService.uploadImage(
          file.buffer,
          INQUIRY_ATTACHMENTS_FOLDER,
          file.originalname
        );
        attachments.push({
          url: uploadRes.url,
          publicId: uploadRes.publicId,
          originalName: sanitizeText(file.originalname || 'attachment'),
          mimeType: detectedMime,
          size: file.size || file.buffer.length,
        });
      }
    } catch (uploadErr) {
      // Best-effort rollback of any files already uploaded before the error
      for (const uploaded of attachments) {
        uploadService.deleteImage(uploaded.publicId);
      }
      throw uploadErr;
    }

    // 4. Sanitize user input & auto-generate subject from projectType if omitted
    const cleanName = sanitizeText(name);
    const cleanEmail = sanitizeText(email).toLowerCase();
    const cleanPhone = sanitizeText(phone || '');
    const cleanSubject = subject && subject.trim()
      ? sanitizeText(subject)
      : this._generateDefaultSubject(projectType, locale);
    const cleanMessage = sanitizeText(message);

    // 5. Resolve optional project or service plan references
    let projectId = null;
    if (projectSlug) {
      const project = await Project.findOne({ slug: projectSlug.trim() });
      if (project) {
        projectId = project._id;
      }
    }

    let resolvedPlanId = null;
    if (servicePlanId && mongoose.Types.ObjectId.isValid(servicePlanId)) {
      const plan = await ServicePlan.findById(servicePlanId);
      if (plan) {
        resolvedPlanId = plan._id;
      }
    }

    // 6. Create inquiry record
    const inquiry = new Inquiry({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      projectType,
      budgetRange,
      timeline,
      subject: cleanSubject,
      message: cleanMessage,
      attachments,
      project: projectId,
      servicePlan: resolvedPlanId,
      locale,
      status: 'new',
    });

    await inquiry.save();

    // 7. Asynchronously notify the owner
    emailService.sendInquiryOwner(inquiry).catch((err) => {
      console.error(`⚠️ Failed to notify owner of inquiry: ${err.message}`);
    });

    return inquiry;
  }

  /**
   * List inquiries for Owner
   */
  async getOwnerInquiries({ page = 1, limit = 20, status, projectType, search } = {}) {
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (projectType) {
      filter.projectType = projectType;
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
        .populate('servicePlan', 'name group deliveryDays')
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
      .populate('servicePlan', 'name group deliveryDays');

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
   * Delete inquiry (and best-effort cleanup of uploaded attachments)
   */
  async deleteInquiry(id) {
    const inquiry = await Inquiry.findByIdAndDelete(id);
    if (!inquiry) {
      throw AppError.notFound(`Inquiry "${id}" not found.`, ERROR_CODES.NOT_FOUND);
    }

    if (Array.isArray(inquiry.attachments)) {
      inquiry.attachments.forEach((att) => {
        if (att.publicId) {
          uploadService.deleteImage(att.publicId);
        }
      });
    }

    return { id: inquiry._id };
  }
}

module.exports = new InquiryService();
