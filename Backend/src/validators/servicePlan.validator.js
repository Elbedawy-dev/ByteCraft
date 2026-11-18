const { z } = require('zod');

/**
 * ServicePlan Validation Schemas
 * 
 * WHY:
 * Validates custom build pricing packages before reaching the database.
 */

const bilingualStringSchema = z.object({
  ar: z.string().trim().min(1, 'Arabic text is required'),
  en: z.string().trim().min(1, 'English text is required'),
});

const createServicePlanSchema = z.object({
  body: z.object({
    group: z.string().trim().min(1, 'Group is required (e.g. lms, ecommerce, custom)').toLowerCase(),
    name: bilingualStringSchema,
    description: bilingualStringSchema,
    startingPrice: z.number().int('Starting price must be an integer in piasters').min(0, 'Starting price cannot be negative'),
    features: z.array(bilingualStringSchema).optional().default([]),
    deliveryDays: z.number().int().min(1, 'Delivery days must be at least 1 day'),
    isPopular: z.boolean().optional().default(false),
    isActive: z.boolean().optional().default(true),
    sortOrder: z.number().int().optional().default(0),
  }),
});

const updateServicePlanSchema = z.object({
  body: z.object({
    group: z.string().trim().min(1).toLowerCase().optional(),
    name: bilingualStringSchema.partial().optional(),
    description: bilingualStringSchema.partial().optional(),
    startingPrice: z.number().int().min(0).optional(),
    features: z.array(bilingualStringSchema).optional(),
    deliveryDays: z.number().int().min(1).optional(),
    isPopular: z.boolean().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  }),
});

const publicServicePlanQuerySchema = z.object({
  query: z.object({
    group: z.string().trim().toLowerCase().optional(),
  }),
});

module.exports = {
  createServicePlanSchema,
  updateServicePlanSchema,
  publicServicePlanQuerySchema,
};
