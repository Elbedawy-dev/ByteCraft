const reviewService = require('../services/review.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Review Controller
 */

// POST /api/orders/:orderNumber/reviews?token= (Buyer with paid order)
const createReview = asyncHandler(async (req, res) => {
  const { orderNumber } = req.params;
  const { token } = req.query;
  const review = await reviewService.createReview(orderNumber, token, req.body);
  res.status(201).json({
    success: true,
    data: { review },
  });
});

// POST /api/account/orders/:orderNumber/reviews (Authenticated order owner)
const createAccountReview = asyncHandler(async (req, res) => {
  const review = await reviewService.createAccountReview(
    req.params.orderNumber,
    req.user._id,
    req.body
  );
  res.status(201).json({
    success: true,
    data: { review },
  });
});

// GET /api/reviews/latest?limit=6 (Public)
const getLatestReviews = asyncHandler(async (req, res) => {
  const reviews = await reviewService.getLatestReviews(req.query);
  res.status(200).json({
    success: true,
    data: { reviews },
  });
});

// GET /api/projects/:slug/reviews (Public)
const getProjectReviews = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { reviews, meta } = await reviewService.getProjectReviews(slug, req.query);
  res.status(200).json({
    success: true,
    data: { reviews },
    meta,
  });
});

// GET /api/owner/reviews (Owner)
const getOwnerReviews = asyncHandler(async (req, res) => {
  const { reviews, meta } = await reviewService.getOwnerReviews(req.query);
  res.status(200).json({
    success: true,
    data: { reviews },
    meta,
  });
});

// PATCH /api/owner/reviews/:id (Owner)
const moderateReview = asyncHandler(async (req, res) => {
  const review = await reviewService.moderateReview(req.params.id, req.body);
  res.status(200).json({
    success: true,
    data: { review },
  });
});

// DELETE /api/owner/reviews/:id (Owner)
const deleteReview = asyncHandler(async (req, res) => {
  const result = await reviewService.deleteReview(req.params.id);
  res.status(200).json({
    success: true,
    data: result,
  });
});

module.exports = {
  createReview,
  createAccountReview,
  getLatestReviews,
  getProjectReviews,
  getOwnerReviews,
  moderateReview,
  deleteReview,
};
