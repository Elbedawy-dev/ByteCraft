const { z } = require('zod');

/**
 * Category Validation Schemas
 * 
 * WHY:
 * Validates category creation and update payloads before reaching the service layer.
 */

const bilingualNameSchema = z.object({
  ar: z.string().trim().min(2, 'Arabic name must be at least 2 characters'),
  en: z.string().trim().min(2, 'English name must be at least 2 characters'),
});

const createCategorySchema = z.object({
  body: z.object({
    key: z
      .string()
      .trim()
      .min(2, 'Category key must be at least 2 characters')
      .regex(/^[a-z0-9-]+$/, 'Category key must contain only lowercase letters, numbers, and dashes')
      .optional(),
    name: bilingualNameSchema,
    order: z.number().int().optional().default(0),
    isActive: z.boolean().optional().default(true),
  }),
});

const updateCategorySchema = z.object({
  body: z.object({
    key: z
      .string()
      .trim()
      .min(2, 'Category key must be at least 2 characters')
      .regex(/^[a-z0-9-]+$/, 'Category key must contain only lowercase letters, numbers, and dashes')
      .optional(),
    name: bilingualNameSchema.partial().optional(),
    order: z.number().int().optional(),
    isActive: z.boolean().optional(),
  }),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
};
