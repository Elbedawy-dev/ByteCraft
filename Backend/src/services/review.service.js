const crypto = require('crypto');
const Review = require('../models/Review');
const Order = require('../models/Order');
const Project = require('../models/Project');
const { sanitizeText } = require('../utils/sanitize');
const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../config/constants');
const statsService = require('./stats.service');

function hashToken(rawToken) {
  if (!rawToken) return '';
  return crypto.createHash('sha256').update(String(rawToken)).digest('hex');
}

function formatPublicReviewerName(fullName) {
  if (!fullName || typeof fullName !== 'string') return 'Customer';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0];
  }
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${firstName} ${lastInitial}.`;
}

function trimReviewComment(comment, maxLength = 240) {
  if (!comment || typeof comment !== 'string') return '';
  const cleaned = comment.trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 1).trimEnd()}…`;
}

/**
 * Review Service
 * 
 * WHY:
 * 1. Verified Buyers Only: Restricts review authoring strictly to customers whose order status
 *    is 'paid' or 'delivered'.
 * 2. Strict Access Control: Validates guest identity via secret SHA-256 order publicToken.
 * 3. Idempotency / Single Review Rule: Enforces exactly one review per order.
 * 4. Moderation Workflow: New reviews default to pending (`isPublished: false`) and only appear
 *    publicly after an admin approves/publishes them (optionally with an `ownerResponse`).
 */

class ReviewService {
  /**
   * Shared review creation logic once order authorization has been verified.
   */
  async _createReviewForOrder(order, { rating, comment, customerName }) {
    if (!['paid', 'delivered'].includes(order.status)) {
      throw AppError.conflict(
        `Reviews can only be submitted for paid or delivered orders (current status: "${order.status}").`,
        ERROR_CODES.INVALID_STATE
      );
    }

    const existing = await Review.findOne({ order: order._id });
    if (existing) {
      throw AppError.conflict(
        'A review has already been submitted for this order.',
        ERROR_CODES.ALREADY_EXISTS
      );
    }

    const cleanCustomerName = sanitizeText(customerName || order.customer.fullName);
    const cleanComment = sanitizeText(comment);

    const review = new Review({
      order: order._id,
      orderNumber: order.orderNumber,
      project: order.project,
      customerName: cleanCustomerName,
      rating: Number(rating),
      comment: cleanComment,
      isPublished: false,
    });

    await review.save();
    statsService.clearCache();
    return {
      _id: review._id,
      customerName: formatPublicReviewerName(review.customerName),
      rating: review.rating,
      comment: review.comment,
      isPublished: review.isPublished,
      ownerResponse: review.ownerResponse || '',
      createdAt: review.createdAt,
    };
  }

  /**
   * Post a customer review for a purchased project (guest token auth)
   */
  async createReview(orderNumber, token, data) {
    if (!token) {
      throw AppError.unauthorized('Order access token is required.', ERROR_CODES.UNAUTHORIZED);
    }

    const order = await Order.findOne({ orderNumber }).select('+publicToken');
    if (!order) {
      throw AppError.notFound(`Order "${orderNumber}" not found.`, ERROR_CODES.NOT_FOUND);
    }

    const hashedProvided = hashToken(token);
    const bufferA = Buffer.from(order.publicToken, 'utf8');
    const bufferB = Buffer.from(hashedProvided, 'utf8');

    if (bufferA.length !== bufferB.length || !crypto.timingSafeEqual(bufferA, bufferB)) {
      throw AppError.unauthorized('Invalid order access token.', ERROR_CODES.UNAUTHORIZED);
    }

    return this._createReviewForOrder(order, data);
  }

  /**
   * Post a review for an authenticated user's own order (no token needed)
   */
  async createAccountReview(orderNumber, userId, data) {
    const order = await Order.findOne({ orderNumber });
    if (!order) {
      throw AppError.notFound(`Order "${orderNumber}" not found.`, ERROR_CODES.NOT_FOUND);
    }

    if (!order.user || String(order.user) !== String(userId)) {
      throw AppError.forbidden('You do not have access to this order.', ERROR_CODES.FORBIDDEN);
    }

    return this._createReviewForOrder(order, data);
  }

  /**
   * Public: List published reviews for a specific project
   */
  async getProjectReviews(projectSlug, { page = 1, limit = 10 } = {}) {
    const project = await Project.findOne({ slug: projectSlug.trim() });
    if (!project) {
      throw AppError.notFound(`Project "${projectSlug}" not found.`, ERROR_CODES.NOT_FOUND);
    }

    const filter = {
      project: project._id,
      isPublished: true,
    };

    const skip = (page - 1) * limit;

    const [rawReviews, total] = await Promise.all([
      Review.find(filter)
        .select('customerName rating comment ownerResponse createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    const reviews = rawReviews.map((r) => ({
      _id: r._id,
      customerName: formatPublicReviewerName(r.customerName),
      rating: r.rating,
      comment: r.comment,
      ownerResponse: r.ownerResponse || '',
      createdAt: r.createdAt,
    }));

    return {
      reviews,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Public: Latest published reviews across all projects (Home Page)
   * Anonymizes customer names (first name + last initial only), trims comments to 240 chars,
   * never exposes PII/order info, and never filters by rating (moderation is strictly `isPublished`).
   */
  async getLatestReviews({ limit = 6 } = {}) {
    const safeLimit = Math.min(12, Math.max(1, parseInt(limit, 10) || 6));

    const rawReviews = await Review.find({ isPublished: true })
      .select('customerName rating comment project createdAt')
      .populate('project', 'title slug')
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .lean();

    return rawReviews.map((r) => ({
      _id: r._id,
      customerName: formatPublicReviewerName(r.customerName),
      rating: r.rating,
      comment: trimReviewComment(r.comment, 240),
      projectTitle: {
        ar: r.project?.title?.ar || '',
        en: r.project?.title?.en || '',
      },
      projectSlug: r.project?.slug || '',
      createdAt: r.createdAt,
    }));
  }

  /**
   * Owner: List all reviews with moderation filters (pending reviews sorted first by default)
   */
  async getOwnerReviews({ page = 1, limit = 20, projectId, isPublished, rating } = {}) {
    const filter = {};

    if (projectId) filter.project = projectId;
    if (typeof isPublished === 'boolean') filter.isPublished = isPublished;
    if (rating) filter.rating = Number(rating);

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('project', 'title slug')
        .populate('order', 'orderNumber status customer')
        .sort({ isPublished: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    return {
      reviews,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Owner: Moderate review (toggle isPublished, add ownerResponse)
   */
  async moderateReview(id, { isPublished, ownerResponse }) {
    const review = await Review.findById(id);
    if (!review) {
      throw AppError.notFound(`Review "${id}" not found.`, ERROR_CODES.NOT_FOUND);
    }

    if (typeof isPublished === 'boolean') {
      review.isPublished = isPublished;
    }

    if (ownerResponse !== undefined) {
      review.ownerResponse = sanitizeText(ownerResponse);
    }

    review.moderatedAt = new Date();
    await review.save();
    statsService.clearCache();

    return review;
  }

  /**
   * Owner: Delete review
   */
  async deleteReview(id) {
    const review = await Review.findByIdAndDelete(id);
    if (!review) {
      throw AppError.notFound(`Review "${id}" not found.`, ERROR_CODES.NOT_FOUND);
    }
    statsService.clearCache();
    return { id: review._id };
  }
}

module.exports = new ReviewService();
