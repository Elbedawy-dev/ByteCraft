const express = require('express');
const healthRoutes = require('./health.routes');
const ownerRoutes = require('./owner.routes');
const publicRoutes = require('./public.routes');
const cronRoutes = require('./cron.routes');

const router = express.Router();

/**
 * Central API Router (/api)
 * 
 * WHY:
 * Centralizes all submodule routers into a clean hierarchy.
 * Health check: /api/health
 * Owner routes: /api/owner/...
 * Public catalog routes: /api/projects, /api/categories
 * Cron jobs: /api/cron/...
 */

router.use('/health', healthRoutes);
router.use('/cron', cronRoutes);
router.use('/owner', ownerRoutes);
router.use('/', publicRoutes);

module.exports = router;
