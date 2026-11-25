const Project = require('../models/Project');
const Order = require('../models/Order');
const Review = require('../models/Review');

const PUBLIC_STATS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Public Stats Service
 *
 * WHY:
 * Computes real platform statistics for the public home page directly from MongoDB:
 * - publishedProjects: count of projects with status === 'published'
 * - deliveredOrders: count of orders with status in ['paid', 'delivered']
 * - reviewsCount: count of reviews with isPublished === true
 * - reviewsAverage: average rating of published reviews rounded to 1 decimal (0 if none)
 *
 * Strict Honesty Rule: No invented numbers and no minimums (real zeros are returned as 0).
 * Performance: Cached in memory for 5 minutes with in-flight request coalescing.
 */

class StatsService {
  constructor() {
    this._cache = {
      data: null,
      expiresAt: 0,
    };
    this._inFlight = null;
  }

  clearCache() {
    this._cache = { data: null, expiresAt: 0 };
    this._inFlight = null;
  }

  async _computePublicStats() {
    const [publishedProjects, deliveredOrders, reviewAgg] = await Promise.all([
      Project.countDocuments({ status: 'published' }),
      Order.countDocuments({ status: { $in: ['paid', 'delivered'] } }),
      Review.aggregate([
        { $match: { isPublished: true } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            average: { $avg: '$rating' },
          },
        },
      ]),
    ]);

    const reviewsCount = reviewAgg[0]?.count || 0;
    const reviewsAverage =
      reviewsCount > 0 ? Math.round(reviewAgg[0].average * 10) / 10 : 0;

    return {
      publishedProjects,
      deliveredOrders,
      reviewsCount,
      reviewsAverage,
    };
  }

  async getPublicStats({ bypassCache = false, ttlMs = PUBLIC_STATS_CACHE_TTL_MS } = {}) {
    const now = Date.now();
    if (!bypassCache && this._cache.data && now < this._cache.expiresAt) {
      return { ...this._cache.data };
    }

    if (!bypassCache && this._inFlight) {
      const shared = await this._inFlight;
      return { ...shared };
    }

    const fetchPromise = this._computePublicStats()
      .then((stats) => {
        this._cache = {
          data: stats,
          expiresAt: Date.now() + ttlMs,
        };
        return stats;
      })
      .finally(() => {
        if (this._inFlight === fetchPromise) {
          this._inFlight = null;
        }
      });

    if (!bypassCache) {
      this._inFlight = fetchPromise;
    }

    const result = await fetchPromise;
    return { ...result };
  }
}

const statsService = new StatsService();
statsService.PUBLIC_STATS_CACHE_TTL_MS = PUBLIC_STATS_CACHE_TTL_MS;

module.exports = statsService;
