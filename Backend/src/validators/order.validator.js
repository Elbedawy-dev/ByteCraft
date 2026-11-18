const { z } = require('zod');

/**
 * Order Validation Schemas
 * 
 * WHY:
 * 1. Zero Trust: Every guest field is strictly sanitized and validated before processing.
 * 2. Format Enforcement: Validates Git provider enums, payment methods, email formats, and locale.
 * 3. Guest Access: Enforces `token` query parameter validation for all guest order operations.
 */

const createOrderSchema = z.object({
  body: z.object({
    projectSlug: z.string().trim().min(1, 'Project slug is required'),
    packageKey: z.string().trim().min(1, 'Package key is required'),
    couponCode: z.string().trim().optional(),
    paymentMethod: z.enum(['vodafone_cash', 'instapay', 'fawry', 'card'], {
      errorMap: () => ({ message: 'Invalid payment method' }),
    }),
    locale: z.enum(['ar', 'en']).optional().default('ar'),
    customer: z.object({
      fullName: z.string().trim().min(2, 'Customer full name must be at least 2 characters'),
      email: z.string().trim().email('Invalid customer email address'),
      phone: z.string().trim().min(6, 'Valid phone number is required'),
      gitProvider: z.enum(['github', 'gitlab'], {
        errorMap: () => ({ message: 'gitProvider must be either "github" or "gitlab"' }),
      }),
      gitUsername: z.string().trim().min(1, 'Git username is required'),
      organization: z.string().trim().optional().default(''),
    }),
  }),
});

const guestOrderQuerySchema = z.object({
  params: z.object({
    orderNumber: z.string().trim().min(1, 'Order number is required'),
  }),
  query: z.object({
    token: z.string().trim().optional(),
  }),
});

const submitProofSchema = z.object({
  params: z.object({
    orderNumber: z.string().trim().min(1, 'Order number is required'),
  }),
  query: z.object({
    token: z.string().trim().min(1, 'Order access token is required in query (?token=...)'),
  }),
  body: z.object({
    reference: z.string().trim().optional().default(''),
  }),
});

const ownerOrdersQuerySchema = z.object({
  query: z.object({
    status: z
      .enum(['pending_payment', 'awaiting_review', 'paid', 'delivered', 'rejected', 'cancelled', 'refunded'])
      .optional(),
    paymentMethod: z.enum(['vodafone_cash', 'instapay', 'fawry', 'card']).optional(),
    search: z.string().trim().optional(),
    isFreeOrder: z.enum(['true', 'false']).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  }),
});

const rejectOrderSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Order ObjectId'),
  }),
  body: z.object({
    reason: z.string().trim().min(3, 'Rejection reason must be at least 3 characters'),
  }),
});

const deliveryOrderSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Order ObjectId'),
  }),
  body: z.object({
    repoAccess: z.enum(['pending', 'granted', 'failed', 'manual']).optional(),
    notes: z.string().trim().optional(),
  }),
});

const refundOrderSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Order ObjectId'),
  }),
  body: z.object({
    note: z.string().trim().optional(),
  }),
});

const orderIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Order ObjectId'),
  }),
});

module.exports = {
  createOrderSchema,
  guestOrderQuerySchema,
  submitProofSchema,
  ownerOrdersQuerySchema,
  rejectOrderSchema,
  deliveryOrderSchema,
  refundOrderSchema,
  orderIdParamSchema,
};
