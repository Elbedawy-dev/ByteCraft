const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Health Check Controller
 * 
 * WHY:
 * Provides an unauthenticated monitoring endpoint for pinging server status,
 * uptime, and database connectivity.
 */

const getHealth = asyncHandler(async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: dbStatus,
    },
  });
});

module.exports = {
  getHealth,
};
