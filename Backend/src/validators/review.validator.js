const { z } = require('zod');

/**
 * Review Validation Schemas
 */

const createReviewSchema = z.object({
  params: z.object({
    orderNumber: z.string().min(1, 'Order number is required'),
  }),
  query: z.object({
    token: z.string().min(16, 'Valid access token is required'),
  }),
  body: z.object({
    rating: z.coerce.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
    comment: z.string().min(5, 'Review comment must be at least 5 characters').max(2000),
    customerName: z.string().min(2, 'Customer name must be at least 2 characters').max(100).optional(),
  }),
});

const getProjectReviewsQuerySchema = z.object({
  params: z.object({
    slug: z.string().min(1, 'Project slug is required'),
  }),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
});

const ownerReviewsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    projectId: z.string().optional(),
    isPublished: z.preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional()),
    rating: z.coerce.number().int().min(1).max(5).optional(),
  }),
});

const reviewIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid review ID format'),
  }),
});

const moderateReviewSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid review ID format'),
  }),
  body: z.object({
    isPublished: z.boolean().optional(),
    ownerResponse: z.string().max(2000).optional(),
  }),
});

module.exports = {
  createReviewSchema,
  getProjectReviewsQuerySchema,
  ownerReviewsQuerySchema,
  reviewIdParamSchema,
  moderateReviewSchema,
};
