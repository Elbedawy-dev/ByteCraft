const express = require('express');
const projectController = require('../controllers/project.controller');
const categoryController = require('../controllers/category.controller');
const servicePlanController = require('../controllers/servicePlan.controller');
const couponController = require('../controllers/coupon.controller');
const metaController = require('../controllers/meta.controller');
const orderController = require('../controllers/order.controller');
const paymentController = require('../controllers/payment.controller');
const inquiryController = require('../controllers/inquiry.controller');
const reviewController = require('../controllers/review.controller');

const validate = require('../middleware/validate.middleware');
const {
  previewViewLimiter,
  couponValidateLimiter,
  orderCreateLimiter,
  proofUploadLimiter,
  inquiryLimiter,
  reviewLimiter,
  tokenGuessLimiter,
} = require('../middleware/rateLimiters.middleware');
const { uploadSingleProof, uploadInquiryAttachments } = require('../middleware/upload.middleware');
const { publicProjectQuerySchema } = require('../validators/project.validator');
const { publicServicePlanQuerySchema } = require('../validators/servicePlan.validator');
const { validateCouponSchema } = require('../validators/coupon.validator');
const {
  createOrderSchema,
  guestOrderQuerySchema,
  submitProofSchema,
} = require('../validators/order.validator');
const { createInquirySchema } = require('../validators/inquiry.validator');
const {
  createReviewSchema,
  getProjectReviewsQuerySchema,
} = require('../validators/review.validator');

const router = express.Router();

/**
 * Public Routes
 * 
 * WHY:
 * Accessible to guests and visitors without authentication.
 * All queries are strictly scoped to published and active content.
 */

// ==========================================
// 1. Platform Metadata
// ==========================================

// GET /api/meta - Returns site settings, contact, active categories & enabled payment methods (without secrets)
router.get('/meta', metaController.getMeta);

// ==========================================
// 2. Categories (Active Only)
// ==========================================

// GET /api/categories - Lists active categories for filters
router.get('/categories', categoryController.getCategories);

// ==========================================
// 3. Projects (Published Only)
// ==========================================

// GET /api/projects - Public catalog list with search, filter, sort, pagination
router.get('/projects', validate(publicProjectQuerySchema), projectController.getPublicProjects);

// GET /api/projects/:slug - Public project details
router.get('/projects/:slug', projectController.getPublicProjectBySlug);

// POST /api/projects/:slug/preview-view - Increment live preview counter
router.post('/projects/:slug/preview-view', previewViewLimiter, projectController.recordPreviewView);

// ==========================================
// 4. Service Plans (Active Only)
// ==========================================

// GET /api/service-plans - Lists active custom build plans with optional group filter
router.get('/service-plans', validate(publicServicePlanQuerySchema), servicePlanController.getServicePlans);

// ==========================================
// 5. Coupons (Validation & Discount Calculation)
// ==========================================

// POST /api/coupons/validate - Validates code and calculates discount preview via PricingService
router.post(
  '/coupons/validate',
  couponValidateLimiter,
  validate(validateCouponSchema),
  couponController.validateCoupon
);

// ==========================================
// 6. Orders (Guest Checkout & Status)
// ==========================================

// POST /api/orders - Creates new order (manual or online)
router.post('/orders', orderCreateLimiter, validate(createOrderSchema), orderController.createOrder);

// GET /api/orders/:orderNumber?token= - Checks order status for guest
router.get(
  '/orders/:orderNumber',
  tokenGuessLimiter,
  validate(guestOrderQuerySchema),
  orderController.getGuestOrder
);

// POST /api/orders/:orderNumber/payment-proof - Uploads proof receipt image
router.post(
  '/orders/:orderNumber/payment-proof',
  tokenGuessLimiter,
  proofUploadLimiter,
  uploadSingleProof,
  validate(submitProofSchema),
  orderController.submitPaymentProof
);

// ==========================================
// 7. Online Payments (Paymob Webhooks)
// ==========================================

// POST /api/payments/paymob/webhook - Paymob server-to-server transaction callback
router.post('/payments/paymob/webhook', paymentController.handlePaymobWebhook);

// ==========================================
// 8. Contact Inquiries (Public Leads)
// ==========================================

// POST /api/inquiries - Submit inquiry / contact request (supports JSON or multipart/form-data with up to 3 attachments)
router.post(
  '/inquiries',
  inquiryLimiter,
  uploadInquiryAttachments,
  validate(createInquirySchema),
  inquiryController.createInquiry
);

// ==========================================
// 9. Customer Reviews (Verified Buyers)
// ==========================================

// POST /api/orders/:orderNumber/reviews?token= - Post review for paid/delivered order
router.post(
  '/orders/:orderNumber/reviews',
  tokenGuessLimiter,
  reviewLimiter,
  validate(createReviewSchema),
  reviewController.createReview
);

// GET /api/projects/:slug/reviews - Public list of published reviews for a project
router.get(
  '/projects/:slug/reviews',
  validate(getProjectReviewsQuerySchema),
  reviewController.getProjectReviews
);

module.exports = router;
