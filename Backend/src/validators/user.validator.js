const { z } = require('zod');

/**
 * User Account & Admin Management Validation Schemas
 */

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
    phone: z.string().trim().max(30).optional(),
    gitProvider: z.enum(['github', 'gitlab', '']).nullable().optional(),
    gitUsername: z.string().trim().max(100).optional(),
    locale: z.enum(['ar', 'en']).optional(),
  }),
});

const deleteAccountSchema = z.object({
  body: z.object({
    password: z.string().min(1, 'Password confirmation is required'),
  }),
});

const accountOrdersQuerySchema = z.object({
  query: z.object({
    status: z
      .enum([
        'pending_payment',
        'awaiting_review',
        'paid',
        'delivered',
        'rejected',
        'cancelled',
        'refunded',
        'expired',
      ])
      .optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  }),
});

const ownerUsersQuerySchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    status: z.enum(['active', 'disabled']).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  }),
});

const updateUserStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid User ObjectId'),
  }),
  body: z.object({
    status: z.enum(['active', 'disabled']),
  }),
});

const createAdminSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().trim().email('A valid email address is required').transform((v) => v.toLowerCase()),
    locale: z.enum(['ar', 'en']).optional().default('ar'),
  }),
});

const adminIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Admin ObjectId'),
  }),
});

module.exports = {
  updateProfileSchema,
  deleteAccountSchema,
  accountOrdersQuerySchema,
  ownerUsersQuerySchema,
  updateUserStatusSchema,
  createAdminSchema,
  adminIdParamSchema,
};
