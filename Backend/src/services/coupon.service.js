const Coupon = require('../models/Coupon');
const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../config/constants');
const pricingService = require('./pricing.service');

/**
 * Coupon Service
 * 
 * WHY:
 * 1. Handles Owner coupon CRUD operations and code uniqueness.
 * 2. Delegates public validation directly to the authoritative PricingService.
 */

class CouponService {
  /**
   * Lists all coupons for Owner
   */
  async listCoupons() {
    return Coupon.find()
      .populate('appliesToProjects', 'slug title')
      .sort({ createdAt: -1 });
  }

  /**
   * Retrieves single coupon by ID
   * @param {string} id
   */
  async getCouponById(id) {
    const coupon = await Coupon.findById(id).populate('appliesToProjects', 'slug title');
    if (!coupon) {
      throw AppError.notFound('Coupon not found', ERROR_CODES.NOT_FOUND);
    }
    return coupon;
  }

  /**
   * Creates a new coupon
   * @param {object} data
   */
  async createCoupon(data) {
    const code = data.code.trim().toUpperCase();
    const existing = await Coupon.findOne({ code });
    if (existing) {
      throw AppError.conflict(`Coupon code "${code}" already exists`, ERROR_CODES.CONFLICT);
    }

    return Coupon.create({
      ...data,
      code,
    });
  }

  /**
   * Updates an existing coupon
   * @param {string} id
   * @param {object} data
   */
  async updateCoupon(id, data) {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw AppError.notFound('Coupon not found', ERROR_CODES.NOT_FOUND);
    }

    if (data.code) {
      const code = data.code.trim().toUpperCase();
      if (code !== coupon.code) {
        const duplicate = await Coupon.findOne({ code, _id: { $ne: id } });
        if (duplicate) {
          throw AppError.conflict(`Coupon code "${code}" already exists`, ERROR_CODES.CONFLICT);
        }
        data.code = code;
      }
    }

    Object.assign(coupon, data);
    await coupon.save();

    return Coupon.findById(id).populate('appliesToProjects', 'slug title');
  }

  /**
   * Deletes a coupon
   * @param {string} id
   */
  async deleteCoupon(id) {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw AppError.notFound('Coupon not found', ERROR_CODES.NOT_FOUND);
    }

    await Coupon.findByIdAndDelete(id);
    return true;
  }

  /**
   * Public validation of a coupon on a specific project & package
   * Delegates directly to pricingService for single-source-of-truth accuracy.
   */
  async validateCoupon({ code, projectSlug, packageKey }) {
    return pricingService.calculatePricing({
      projectSlug,
      packageKey,
      couponCode: code,
    });
  }
}

module.exports = new CouponService();
