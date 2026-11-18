const dashboardService = require('../services/dashboard.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Dashboard Controller
 */

// GET /api/owner/dashboard (Owner)
const getDashboard = asyncHandler(async (req, res) => {
  const metrics = await dashboardService.getDashboardMetrics();
  res.status(200).json({
    success: true,
    data: metrics,
  });
});

module.exports = {
  getDashboard,
};
