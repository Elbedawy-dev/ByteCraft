const { z } = require('zod');

/**
 * Coupon Validation Schemas
 * 
 * WHY:
 * 1. Validates coupon creation and update payloads for the Owner.
 * 2. Crucial Security Rule: `/api/coupons/validate` only accepts { code, projectSlug, packageKey }.
 *    No client prices or totals are ever accepted.
 */

const createCouponSchema = z.object({
  body: z.object({
    code: z
      .string()
      .trim()
      .min(2, 'Coupon code must be at least 2 characters')
      .toUpperCase()
      .regex(/^[A-Z0-9_-]+$/, 'Coupon code must contain only uppercase letters, numbers, dashes, and underscores'),
    type: z.enum(['percent', 'fixed']),
    value: z.number().int('Value must be an integer').min(1, 'Value must be positive'),
    maxUses: z.number().int().min(1).nullable().optional().default(null),
    expiresAt: z.string().datetime().nullable().optional().default(null),
    isActive: z.boolean().optional().default(true),
    appliesToProjects: z
      .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Project ObjectId'))
      .optional()
      .default([]),
  }).refine(
    (data) => {
      if (data.type === 'percent') {
        return data.value >= 1 && data.value <= 100;
      }
      return data.value > 0;
    },
    {
      message: 'Percentage coupons must have a value between 1 and 100',
      path: ['value'],
    }
  ).refine(
    (data) => {
      // Free coupon protection: 100% discount coupons must have a finite maxUses limit
      if (data.type === 'percent' && data.value === 100) {
        return typeof data.maxUses === 'number' && data.maxUses > 0;
      }
      return true;
    },
    {
      message: 'A 100% discount coupon must specify a finite maxUses limit (unlimited 100% coupons are prohibited)',
      path: ['maxUses'],
    }
  ),
});

const updateCouponSchema = z.object({
  body: z.object({
    code: z
      .string()
      .trim()
      .min(2)
      .toUpperCase()
      .regex(/^[A-Z0-9_-]+$/)
      .optional(),
    type: z.enum(['percent', 'fixed']).optional(),
    value: z.number().int().min(1).optional(),
    maxUses: z.number().int().min(1).nullable().optional(),
    usedCount: z.number().int().min(0).optional(),
    expiresAt: z.string().datetime().nullable().optional(),
    isActive: z.boolean().optional(),
    appliesToProjects: z
      .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Project ObjectId'))
      .optional(),
  }).refine(
    (data) => {
      if (data.type === 'percent' && data.value !== undefined) {
        return data.value >= 1 && data.value <= 100;
      }
      return true;
    },
    {
      message: 'Percentage coupons must have a value between 1 and 100',
      path: ['value'],
    }
  ),
});

const validateCouponSchema = z.object({
  body: z.object({
    code: z.string().trim().min(1, 'Coupon code is required'),
    projectSlug: z.string().trim().min(1, 'Project slug is required'),
    packageKey: z.string().trim().min(1, 'Package key is required'),
  }),
});

module.exports = {
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
};
