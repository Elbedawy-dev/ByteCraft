const express = require('express');
const authController = require('../controllers/auth.controller');
const userController = require('../controllers/user.controller');
const orderController = require('../controllers/order.controller');
const reviewController = require('../controllers/review.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { proofUploadLimiter, reviewLimiter } = require('../middleware/rateLimiters.middleware');
const { uploadSingleProof } = require('../middleware/upload.middleware');
const { changePasswordSchema } = require('../validators/auth.validator');
const {
  updateProfileSchema,
  deleteAccountSchema,
  accountOrdersQuerySchema,
} = require('../validators/user.validator');
const {
  accountOrderNumberParamSchema,
  accountSubmitProofSchema,
} = require('../validators/order.validator');
const { accountCreateReviewSchema } = require('../validators/review.validator');

const router = express.Router();

/**
 * Authenticated Customer Account Routes (/api/account)
 *
 * Every endpoint here requires a valid active session (`requireAuth`).
 */
router.use(requireAuth);

router.patch('/profile', validate(updateProfileSchema), userController.updateProfile);
router.patch('/password', validate(changePasswordSchema), authController.changePassword);
router.delete('/', validate(deleteAccountSchema), userController.deleteAccount);

router.get('/orders', validate(accountOrdersQuerySchema), orderController.getAccountOrders);
router.get('/orders/:orderNumber', validate(accountOrderNumberParamSchema), orderController.getAccountOrder);
router.post(
  '/orders/:orderNumber/payment-proof',
  proofUploadLimiter,
  uploadSingleProof,
  validate(accountSubmitProofSchema),
  orderController.submitAccountPaymentProof
);
router.post(
  '/orders/:orderNumber/reviews',
  reviewLimiter,
  validate(accountCreateReviewSchema),
  reviewController.createAccountReview
);
router.post('/claim-orders', orderController.claimGuestOrders);

module.exports = router;
