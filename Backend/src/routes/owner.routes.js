const express = require('express');
const authController = require('../controllers/auth.controller');
const userController = require('../controllers/user.controller');
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

const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { loginLimiter } = require('../middleware/rateLimiters.middleware');
const { uploadImages } = require('../middleware/upload.middleware');
const { ROLES } = require('../config/constants');

const { loginSchema, changePasswordSchema } = require('../validators/auth.validator');
const {
  ownerUsersQuerySchema,
  updateUserStatusSchema,
  createAdminSchema,
  adminIdParamSchema,
} = require('../validators/user.validator');
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
 * Admin / Owner Routes (/api/owner)
 *
 * Keeps the `/api/owner/*` prefix for backwards compatibility.
 * All protected endpoints require BOTH an active session (`requireAuth`)
 * AND `role === 'admin'` (`requireRole('admin')`).
 */

// ==========================================
// 1. Deprecated Owner Auth Aliases (Use /api/auth/* instead)
// ==========================================

router.post('/login', loginLimiter, validate(loginSchema), authController.deprecatedOwnerLogin);

// Enforce admin role for every remaining `/api/owner/*` route
router.use(requireAuth, requireRole(ROLES.ADMIN));

router.post('/logout', authController.deprecatedOwnerLogout);
router.get('/me', authController.deprecatedOwnerMe);
router.patch('/password', validate(changePasswordSchema), authController.deprecatedOwnerChangePassword);

// ==========================================
// 2. Users & Admins Management Endpoints
// ==========================================

router.get('/users', validate(ownerUsersQuerySchema), userController.listCustomers);
router.patch('/users/:id', validate(updateUserStatusSchema), userController.updateUserStatus);
router.get('/admins', userController.listAdmins);
router.post('/admins', validate(createAdminSchema), userController.createAdmin);
router.delete('/admins/:id', validate(adminIdParamSchema), userController.deleteAdmin);

// ==========================================
// 3. Settings Endpoints
// ==========================================

router.get('/settings', settingsController.getSettings);
router.patch('/settings', validate(updateSettingsSchema), settingsController.updateSettings);

// ==========================================
// 4. Category Endpoints (Full CRUD)
// ==========================================

router.get('/categories', categoryController.getCategories);
router.get('/categories/:id', categoryController.getCategoryById);
router.post('/categories', validate(createCategorySchema), categoryController.createCategory);
router.patch('/categories/:id', validate(updateCategorySchema), categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// ==========================================
// 5. Project Endpoints (Full CRUD + Status)
// ==========================================

router.get('/projects', projectController.getOwnerProjects);
router.get('/projects/:id', projectController.getOwnerProjectById);
router.post('/projects', validate(createProjectSchema), projectController.createProject);
router.patch('/projects/:id', validate(updateProjectSchema), projectController.updateProject);
router.patch('/projects/:id/status', validate(updateProjectStatusSchema), projectController.updateProjectStatus);
router.delete('/projects/:id', projectController.deleteProject);

// ==========================================
// 6. Uploads Endpoints
// ==========================================

router.post('/uploads/images', uploadImages, uploadController.uploadImages);
router.delete('/uploads', uploadController.deleteImage);

// ==========================================
// 7. Service Plans Endpoints (Full CRUD)
// ==========================================

router.get('/service-plans', servicePlanController.getServicePlans);
router.get('/service-plans/:id', servicePlanController.getServicePlanById);
router.post('/service-plans', validate(createServicePlanSchema), servicePlanController.createServicePlan);
router.patch('/service-plans/:id', validate(updateServicePlanSchema), servicePlanController.updateServicePlan);
router.delete('/service-plans/:id', servicePlanController.deleteServicePlan);

// ==========================================
// 8. Coupons Endpoints (Full CRUD)
// ==========================================

router.get('/coupons', couponController.getCoupons);
router.get('/coupons/:id', couponController.getCouponById);
router.post('/coupons', validate(createCouponSchema), couponController.createCoupon);
router.patch('/coupons/:id', validate(updateCouponSchema), couponController.updateCoupon);
router.delete('/coupons/:id', couponController.deleteCoupon);

// ==========================================
// 9. Orders Endpoints (Admin Review & Delivery)
// ==========================================

router.get('/orders', validate(ownerOrdersQuerySchema), orderController.getOwnerOrders);
router.get('/orders/:id', validate(orderIdParamSchema), orderController.getOwnerOrderById);
router.patch('/orders/:id/approve', validate(orderIdParamSchema), orderController.approveOrder);
router.patch('/orders/:id/reject', validate(rejectOrderSchema), orderController.rejectOrder);
router.patch('/orders/:id/delivery', validate(deliveryOrderSchema), orderController.updateDelivery);
router.patch('/orders/:id/refund', validate(refundOrderSchema), orderController.refundOrder);
router.post('/orders/cleanup-expired', orderController.cleanupExpiredOrders);

// ==========================================
// 10. Inquiries Endpoints (Admin Lead Management)
// ==========================================

router.get('/inquiries', validate(ownerInquiriesQuerySchema), inquiryController.getOwnerInquiries);
router.get('/inquiries/:id', validate(inquiryIdParamSchema), inquiryController.getOwnerInquiryById);
router.patch('/inquiries/:id', validate(updateInquirySchema), inquiryController.updateInquiry);
router.delete('/inquiries/:id', validate(inquiryIdParamSchema), inquiryController.deleteInquiry);

// ==========================================
// 11. Reviews Endpoints (Admin Moderation)
// ==========================================

router.get('/reviews', validate(ownerReviewsQuerySchema), reviewController.getOwnerReviews);
router.patch('/reviews/:id', validate(moderateReviewSchema), reviewController.moderateReview);
router.delete('/reviews/:id', validate(reviewIdParamSchema), reviewController.deleteReview);

// ==========================================
// 12. Dashboard Overview & Analytics
// ==========================================

router.get('/dashboard', dashboardController.getDashboard);

module.exports = router;
