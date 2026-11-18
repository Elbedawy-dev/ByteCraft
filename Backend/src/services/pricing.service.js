const mongoose = require('mongoose');
const Project = require('../models/Project');
const Coupon = require('../models/Coupon');
const AppError = require('../utils/AppError');
const { applyPercent } = require('../utils/money');
const { ERROR_CODES } = require('../config/constants');

/**
 * Pricing Service (Single Source of Truth)
 * 
 * WHY:
 * 1. Security: Never trust client-provided prices, totals, or discounts. All monetary
 *    computations are strictly executed on the server.
 * 2. Precision: Operates exclusively on integer piasters (1 EGP = 100 piasters), preventing
 *    floating point rounding errors.
 * 3. Centralized: Used identically by `/api/coupons/validate` and order creation in Phase 4.
 */

class PricingService {
  /**
   * Computes authoritative pricing for a project package with optional coupon
   * @param {object} params
   * @param {string} [params.projectId]
   * @param {string} [params.projectSlug]
   * @param {string} params.packageKey
   * @param {string} [params.couponCode]
   * @returns {Promise<object>} Unified pricing breakdown
   */
  async calculatePricing({ projectId, projectSlug, packageKey, couponCode }) {
    if (!packageKey) {
      throw AppError.badRequest('Package key is required.', ERROR_CODES.VALIDATION_ERROR);
    }

    // 1. Load project (must be published)
    let project = null;
    if (projectId) {
      project = await Project.findById(projectId);
    } else if (projectSlug) {
      project = await Project.findOne({ slug: projectSlug.toLowerCase() });
    } else {
      throw AppError.badRequest('Either projectId or projectSlug must be provided.', ERROR_CODES.VALIDATION_ERROR);
    }

    if (!project || project.status !== 'published') {
      throw AppError.badRequest(
        'Project not found or not currently available for purchase.',
        ERROR_CODES.PROJECT_NOT_AVAILABLE
      );
    }

    // 2. Load active package
    const pkg = project.packages.find((p) => p.key.toLowerCase() === packageKey.toLowerCase());
    if (!pkg) {
      throw AppError.notFound(`Package "${packageKey}" not found in this project.`, ERROR_CODES.NOT_FOUND);
    }

    if (pkg.isActive === false) {
      throw AppError.badRequest(
        `Package "${packageKey}" is currently inactive and cannot be purchased.`,
        ERROR_CODES.PACKAGE_NOT_ACTIVE
      );
    }

    const subtotal = pkg.price;
    let discount = 0;
    let appliedCoupon = null;

    // 3. Validate coupon if provided
    if (couponCode && typeof couponCode === 'string' && couponCode.trim() !== '') {
      const normalizedCode = couponCode.trim().toUpperCase();
      const coupon = await Coupon.findOne({ code: normalizedCode });

      if (!coupon) {
        throw AppError.badRequest(`Coupon code "${normalizedCode}" is invalid.`, ERROR_CODES.INVALID_COUPON);
      }

      if (coupon.isActive === false) {
        throw AppError.badRequest(`Coupon code "${normalizedCode}" is inactive.`, ERROR_CODES.COUPON_INACTIVE);
      }

      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        throw AppError.badRequest(`Coupon code "${normalizedCode}" has expired.`, ERROR_CODES.COUPON_EXPIRED);
      }

      if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
        throw AppError.badRequest(
          `Coupon code "${normalizedCode}" has reached its maximum usage limit.`,
          ERROR_CODES.COUPON_MAX_USES_REACHED
        );
      }

      if (Array.isArray(coupon.appliesToProjects) && coupon.appliesToProjects.length > 0) {
        const isApplicable = coupon.appliesToProjects.some(
          (projId) => projId.toString() === project._id.toString()
        );
        if (!isApplicable) {
          throw AppError.badRequest(
            `Coupon code "${normalizedCode}" is not applicable to this project.`,
            ERROR_CODES.COUPON_NOT_APPLICABLE
          );
        }
      }

      // Calculate discount (percent or fixed, capped at subtotal)
      if (coupon.type === 'percent') {
        discount = applyPercent(subtotal, coupon.value);
      } else {
        discount = Math.min(coupon.value, subtotal);
      }

      appliedCoupon = coupon;
    }

    // 4. Calculate Total (Clamped at 0: No tax/VAT)
    const total = Math.max(0, subtotal - discount);

    return {
      currency: 'EGP',
      subtotal,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      discount,
      total,
      project: {
        id: project._id,
        slug: project.slug,
        title: project.title,
      },
      package: {
        key: pkg.key,
        name: pkg.name,
        licenseType: pkg.licenseType,
      },
    };
  }
}

module.exports = new PricingService();
