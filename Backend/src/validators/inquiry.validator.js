const { z } = require('zod');

/**
 * Inquiry Validation Schemas
 *
 * WHY:
 * Supports both `application/json` and `multipart/form-data` submissions on `POST /api/inquiries`.
 * Empty strings from HTML multipart forms are normalized to `undefined` for optional/defaulted fields.
 */

const INQUIRY_PROJECT_TYPES = ['lms', 'ecommerce', 'custom_mern', 'consulting', 'other'];
const INQUIRY_BUDGET_RANGES = ['5k_10k', '10k_20k', '20k_plus', 'undecided'];
const INQUIRY_TIMELINES = ['urgent', 'standard', 'flexible'];

const emptyToUndefined = (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val);

const createInquirySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().trim().email('Valid email address is required'),
    phone: z.string().trim().max(30, 'Phone number is too long').optional().default(''),
    projectType: z.preprocess(emptyToUndefined, z.enum(INQUIRY_PROJECT_TYPES).default('other')),
    budgetRange: z.preprocess(emptyToUndefined, z.enum(INQUIRY_BUDGET_RANGES).default('undecided')),
    timeline: z.preprocess(emptyToUndefined, z.enum(INQUIRY_TIMELINES).default('standard')),
    subject: z.preprocess(
      emptyToUndefined,
      z.string().trim().min(3, 'Subject must be at least 3 characters').max(200).optional()
    ),
    message: z.string().trim().min(10, 'Message must be at least 10 characters').max(5000),
    projectSlug: z.preprocess(emptyToUndefined, z.string().trim().optional()),
    servicePlanId: z.preprocess(
      emptyToUndefined,
      z.string().trim().regex(/^[0-9a-fA-F]{24}$/, 'Invalid service plan ID format').optional()
    ),
    locale: z.preprocess(emptyToUndefined, z.enum(['ar', 'en']).default('ar')),
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
    projectType: z.enum(INQUIRY_PROJECT_TYPES).optional(),
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
  INQUIRY_PROJECT_TYPES,
  INQUIRY_BUDGET_RANGES,
  INQUIRY_TIMELINES,
  createInquirySchema,
  ownerInquiriesQuerySchema,
  inquiryIdParamSchema,
  updateInquirySchema,
};
