const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const accountRoutes = require('./account.routes');
const ownerRoutes = require('./owner.routes');
const publicRoutes = require('./public.routes');
const cronRoutes = require('./cron.routes');

const router = express.Router();

/**
 * Central API Router (/api)
 *
 * - /api/health
 * - /api/cron/...
 * - /api/auth/...
 * - /api/account/...
 * - /api/owner/...
 * - /api/... (public catalog, orders, reviews, inquiries)
 */

router.use('/health', healthRoutes);
router.use('/cron', cronRoutes);
router.use('/auth', authRoutes);
router.use('/account', accountRoutes);
router.use('/owner', ownerRoutes);
router.use('/', publicRoutes);

module.exports = router;
