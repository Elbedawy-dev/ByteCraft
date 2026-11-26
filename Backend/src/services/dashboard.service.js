const Order = require('../models/Order');
const Inquiry = require('../models/Inquiry');
const Project = require('../models/Project');
const Review = require('../models/Review');

/**
 * Dashboard Service
 * 
 * WHY:
 * 1. High-Performance Aggregations: Computes operational overview metrics on the server
 *    using MongoDB aggregation pipelines.
 * 2. Financial Accuracy: All revenue figures are strictly calculated in integer piasters,
 *    aggregating ONLY 'paid' and 'delivered' orders and excluding refunded or cancelled orders.
 * 3. Trend Analysis: Generates 12-month historical revenue and volume timeline.
 */

class DashboardService {
  async getDashboardMetrics() {
    // 1. Calculate Revenue from Paid & Delivered Orders (excluding refunded)
    const revenueAggregation = await Order.aggregate([
      {
        $match: {
          status: { $in: ['paid', 'delivered'] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.total' },
        },
      },
    ]);
    const revenue = revenueAggregation[0]?.totalRevenue || 0;

    // 2. Counts and Totals in Parallel
    const [
      ordersCount,
      paidOrders,
      pendingProofs,
      newInquiries,
      pendingReviews,
      publishedProjects,
    ] = await Promise.all([
      Order.countDocuments({}),
      Order.countDocuments({ status: { $in: ['paid', 'delivered'] } }),
      Order.countDocuments({ status: 'awaiting_review' }),
      Inquiry.countDocuments({ status: 'new' }),
      Review.countDocuments({ isPublished: false }),
      Project.countDocuments({ status: 'published' }),
    ]);

    // 3. 12-Month Historical Revenue Trend
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const revenueByMonth = await Order.aggregate([
      {
        $match: {
          status: { $in: ['paid', 'delivered'] },
          createdAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$pricing.total' }, // in piasters
          ordersCount: { $sum: 1 },
        },
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
        },
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          revenue: 1,
          ordersCount: 1,
        },
      },
    ]);

    // 4. Orders Distribution by Status
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1,
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // 5. Top 5 Projects by Purchases
    const topProjects = await Project.find({ status: { $ne: 'archived' } })
      .select('title slug thumbnail stats.purchases stats.views category')
      .populate('category', 'name key')
      .sort({ 'stats.purchases': -1, createdAt: -1 })
      .limit(5)
      .lean();

    // 6. Recent 8 Orders
    const recentOrders = await Order.find({})
      .select(
        'orderNumber snapshot.title customer.fullName customer.email pricing.total paymentMethod status createdAt isFreeOrder'
      )
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    // 7. Recent 8 Inquiries
    const recentInquiries = await Inquiry.find({})
      .select('name email subject projectType budgetRange timeline status createdAt')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    return {
      totals: {
        revenue, // Integer piasters
        ordersCount,
        paidOrders,
        pendingProofs,
        newInquiries,
        pendingReviews,
        publishedProjects,
      },
      revenueByMonth,
      ordersByStatus,
      topProjects,
      recentOrders,
      recentInquiries,
    };
  }
}

module.exports = new DashboardService();
