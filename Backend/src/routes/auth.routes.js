const express = require('express');
const authController = require('../controllers/auth.controller');
const { authOptional, requireAuth } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  loginLimiter,
  registerLimiter,
  forgotPasswordIpLimiter,
  forgotPasswordEmailLimiter,
  resendVerificationLimiter,
} = require('../middleware/rateLimiters.middleware');
const {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validators/auth.validator');

const router = express.Router();

/**
 * Public Authentication Routes (/api/auth)
 */

router.post('/register', registerLimiter, validate(registerSchema), authController.register);
router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.getMe);
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);
router.post(
  '/resend-verification',
  authOptional,
  resendVerificationLimiter,
  validate(resendVerificationSchema),
  authController.resendVerification
);
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  forgotPasswordIpLimiter,
  forgotPasswordEmailLimiter,
  authController.forgotPassword
);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;
