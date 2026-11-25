const statsService = require('../services/stats.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Public Stats Controller
 */

// GET /api/stats/public (Public, cached for 5 minutes)
const getPublicStats = asyncHandler(async (req, res) => {
  const bypassCache =
    process.env.NODE_ENV !== 'production' &&
    String(process.env.PORT) === '5001' &&
    req.headers['x-test-bypass-cache'] === 'true';

  const stats = await statsService.getPublicStats({ bypassCache });

  res.set('Cache-Control', 'public, max-age=300, s-maxage=300');
  res.status(200).json({
    success: true,
    data: stats,
  });
});

module.exports = {
  getPublicStats,
};
