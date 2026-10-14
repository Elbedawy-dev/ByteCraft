const express = require('express');
const authController = require('../controllers/auth.controller');
const settingsController = require('../controllers/settings.controller');
const { authOwner } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { loginLimiter } = require('../middleware/rateLimiters.middleware');
const { loginSchema, changePasswordSchema } = require('../validators/auth.validator');
const { updateSettingsSchema } = require('../validators/settings.validator');

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

module.exports = router;
