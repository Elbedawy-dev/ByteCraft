const couponService = require('../services/coupon.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Coupon Controller
 * 
 * WHY:
 * 1. Handles Owner CRUD for coupons.
 * 2. Exposes public `validateCoupon` endpoint computing exact discounts via PricingService.
 */

const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await couponService.listCoupons();

  res.status(200).json({
    success: true,
    data: {
      coupons,
    },
  });
});

const getCouponById = asyncHandler(async (req, res) => {
  const coupon = await couponService.getCouponById(req.params.id);

  res.status(200).json({
    success: true,
    data: {
      coupon,
    },
  });
});

const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.createCoupon(req.body);

  res.status(201).json({
    success: true,
    data: {
      coupon,
    },
  });
});

const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.updateCoupon(req.params.id, req.body);

  res.status(200).json({
    success: true,
    data: {
      coupon,
    },
  });
});

const deleteCoupon = asyncHandler(async (req, res) => {
  await couponService.deleteCoupon(req.params.id);

  res.status(200).json({
    success: true,
    data: {
      message: 'Coupon deleted successfully',
    },
  });
});

const validateCoupon = asyncHandler(async (req, res) => {
  const { code, projectSlug, packageKey } = req.body;
  const pricing = await couponService.validateCoupon({ code, projectSlug, packageKey });

  res.status(200).json({
    success: true,
    data: {
      pricing,
    },
  });
});

module.exports = {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
};
