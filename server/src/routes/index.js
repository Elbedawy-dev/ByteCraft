const express = require('express');
const healthRoutes = require('./health.routes');
const ownerRoutes = require('./owner.routes');

const router = express.Router();

/**
 * Central API Router (/api)
 * 
 * WHY:
 * Centralizes all submodule routers into a clean hierarchy.
 * In later phases, public routes (/projects, /orders, /inquiries) will mount here.
 */

router.use('/health', healthRoutes);
router.use('/owner', ownerRoutes);

module.exports = router;
