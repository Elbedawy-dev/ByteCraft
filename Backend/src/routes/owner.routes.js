const express = require('express');
const authController = require('../controllers/auth.controller');
const settingsController = require('../controllers/settings.controller');
const categoryController = require('../controllers/category.controller');
const projectController = require('../controllers/project.controller');
const uploadController = require('../controllers/upload.controller');
const servicePlanController = require('../controllers/servicePlan.controller');
const couponController = require('../controllers/coupon.controller');
const orderController = require('../controllers/order.controller');
const inquiryController = require('../controllers/inquiry.controller');
const reviewController = require('../controllers/review.controller');
const dashboardController = require('../controllers/dashboard.controller');

const { authOwner } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { loginLimiter } = require('../middleware/rateLimiters.middleware');
const { uploadImages } = require('../middleware/upload.middleware');

const { loginSchema, changePasswordSchema } = require('../validators/auth.validator');
const { updateSettingsSchema } = require('../validators/settings.validator');
const { createCategorySchema, updateCategorySchema } = require('../validators/category.validator');
const {
  createProjectSchema,
  updateProjectSchema,
  updateProjectStatusSchema,
} = require('../validators/project.validator');
const {
  createServicePlanSchema,
  updateServicePlanSchema,
} = require('../validators/servicePlan.validator');
const {
  createCouponSchema,
  updateCouponSchema,
} = require('../validators/coupon.validator');
const {
  ownerOrdersQuerySchema,
  orderIdParamSchema,
  rejectOrderSchema,
  deliveryOrderSchema,
  refundOrderSchema,
} = require('../validators/order.validator');
const {
  ownerInquiriesQuerySchema,
  inquiryIdParamSchema,
  updateInquirySchema,
} = require('../validators/inquiry.validator');
const {
  ownerReviewsQuerySchema,
  reviewIdParamSchema,
  moderateReviewSchema,
} = require('../validators/review.validator');

const router = express.Router();

/**
 * Owner Routes (/api/owner)
 * 
 * WHY:
 * All administrative endpoints are grouped under /api/owner.
 * Mutating endpoints require validation, authentication (except /login),
 * and security controls (rate limiting on login, authOwner on private routes).
 */

// ==========================================
// 1. Authentication Endpoints
// ==========================================

// POST /api/owner/login - Authenticate owner and set HTTP-only cookie
router.post('/login', loginLimiter, validate(loginSchema), authController.login);

// POST /api/owner/logout - Clear HTTP-only cookie
router.post('/logout', authOwner, authController.logout);

// GET /api/owner/me - Get current logged-in owner profile
router.get('/me', authOwner, authController.getMe);

// PATCH /api/owner/password - Change owner password (requires current password)
router.patch('/password', authOwner, validate(changePasswordSchema), authController.changePassword);

// ==========================================
// 2. Settings Endpoints
// ==========================================

// GET /api/owner/settings - Retrieve global site settings
router.get('/settings', authOwner, settingsController.getSettings);

// PATCH /api/owner/settings - Update site settings
router.patch('/settings', authOwner, validate(updateSettingsSchema), settingsController.updateSettings);

// ==========================================
// 3. Category Endpoints (Full CRUD)
// ==========================================

router.get('/categories', authOwner, categoryController.getCategories);
router.get('/categories/:id', authOwner, categoryController.getCategoryById);
router.post('/categories', authOwner, validate(createCategorySchema), categoryController.createCategory);
router.patch('/categories/:id', authOwner, validate(updateCategorySchema), categoryController.updateCategory);
router.delete('/categories/:id', authOwner, categoryController.deleteCategory);

// ==========================================
// 4. Project Endpoints (Full CRUD + Status)
// ==========================================

router.get('/projects', authOwner, projectController.getOwnerProjects);
router.get('/projects/:id', authOwner, projectController.getOwnerProjectById);
router.post('/projects', authOwner, validate(createProjectSchema), projectController.createProject);
router.patch('/projects/:id', authOwner, validate(updateProjectSchema), projectController.updateProject);
router.patch('/projects/:id/status', authOwner, validate(updateProjectStatusSchema), projectController.updateProjectStatus);
router.delete('/projects/:id', authOwner, projectController.deleteProject);

// ==========================================
// 5. Uploads Endpoints
// ==========================================

// POST /api/owner/uploads/images - Multipart upload (up to 10 images)
router.post('/uploads/images', authOwner, uploadImages, uploadController.uploadImages);

// DELETE /api/owner/uploads - Delete image by publicId
router.delete('/uploads', authOwner, uploadController.deleteImage);

// ==========================================
// 6. Service Plans Endpoints (Full CRUD)
// ==========================================

router.get('/service-plans', authOwner, servicePlanController.getServicePlans);
router.get('/service-plans/:id', authOwner, servicePlanController.getServicePlanById);
router.post('/service-plans', authOwner, validate(createServicePlanSchema), servicePlanController.createServicePlan);
router.patch('/service-plans/:id', authOwner, validate(updateServicePlanSchema), servicePlanController.updateServicePlan);
router.delete('/service-plans/:id', authOwner, servicePlanController.deleteServicePlan);

// ==========================================
// 7. Coupons Endpoints (Full CRUD)
// ==========================================

router.get('/coupons', authOwner, couponController.getCoupons);
router.get('/coupons/:id', authOwner, couponController.getCouponById);
router.post('/coupons', authOwner, validate(createCouponSchema), couponController.createCoupon);
router.patch('/coupons/:id', authOwner, validate(updateCouponSchema), couponController.updateCoupon);
router.delete('/coupons/:id', authOwner, couponController.deleteCoupon);

// ==========================================
// 8. Orders Endpoints (Owner Review & Delivery)
// ==========================================

router.get('/orders', authOwner, validate(ownerOrdersQuerySchema), orderController.getOwnerOrders);
router.get('/orders/:id', authOwner, validate(orderIdParamSchema), orderController.getOwnerOrderById);
router.patch('/orders/:id/approve', authOwner, validate(orderIdParamSchema), orderController.approveOrder);
router.patch('/orders/:id/reject', authOwner, validate(rejectOrderSchema), orderController.rejectOrder);
router.patch('/orders/:id/delivery', authOwner, validate(deliveryOrderSchema), orderController.updateDelivery);
router.patch('/orders/:id/refund', authOwner, validate(refundOrderSchema), orderController.refundOrder);
router.post('/orders/cleanup-expired', authOwner, orderController.cleanupExpiredOrders);

// ==========================================
// 9. Inquiries Endpoints (Owner Lead Management)
// ==========================================

router.get('/inquiries', authOwner, validate(ownerInquiriesQuerySchema), inquiryController.getOwnerInquiries);
router.get('/inquiries/:id', authOwner, validate(inquiryIdParamSchema), inquiryController.getOwnerInquiryById);
router.patch('/inquiries/:id', authOwner, validate(updateInquirySchema), inquiryController.updateInquiry);
router.delete('/inquiries/:id', authOwner, validate(inquiryIdParamSchema), inquiryController.deleteInquiry);

// ==========================================
// 10. Reviews Endpoints (Owner Moderation)
// ==========================================

router.get('/reviews', authOwner, validate(ownerReviewsQuerySchema), reviewController.getOwnerReviews);
router.patch('/reviews/:id', authOwner, validate(moderateReviewSchema), reviewController.moderateReview);
router.delete('/reviews/:id', authOwner, validate(reviewIdParamSchema), reviewController.deleteReview);

// ==========================================
// 11. Dashboard Overview & Analytics
// ==========================================

router.get('/dashboard', authOwner, dashboardController.getDashboard);

module.exports = router;
