const { z } = require('zod');

/**
 * Inquiry Validation Schemas
 */

const createInquirySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Valid email address is required'),
    phone: z.string().optional().default(''),
    subject: z.string().min(3, 'Subject must be at least 3 characters').max(200),
    message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
    projectSlug: z.string().optional(),
    servicePlanId: z.string().optional(),
    locale: z.enum(['ar', 'en']).default('ar'),
    // Honeypot fields to silently catch automated spam bots
    hp: z.string().optional(),
    _hp: z.string().optional(),
    website: z.string().optional(),
  }),
});

const ownerInquiriesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    status: z.enum(['new', 'read', 'in_progress', 'resolved', 'archived']).optional(),
    search: z.string().optional(),
  }),
});

const inquiryIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid inquiry ID format'),
  }),
});

const updateInquirySchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid inquiry ID format'),
  }),
  body: z.object({
    status: z.enum(['new', 'read', 'in_progress', 'resolved', 'archived']).optional(),
    ownerNotes: z.string().max(2000).optional(),
  }),
});

module.exports = {
  createInquirySchema,
  ownerInquiriesQuerySchema,
  inquiryIdParamSchema,
  updateInquirySchema,
};
