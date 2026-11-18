const { z } = require('zod');

/**
 * Project Validation Schemas
 * 
 * WHY:
 * 1. Guarantees prices are integer piasters (no floats).
 * 2. Validates bilingual strings { ar, en } and package structures.
 * 3. Sanitizes public query parameters (page, limit, sort, filters).
 */

const bilingualStringSchema = z.object({
  ar: z.string().trim().min(1, 'Arabic text is required'),
  en: z.string().trim().min(1, 'English text is required'),
});

const imageAssetSchema = z.object({
  url: z.string().trim().url('Image url must be a valid URL or path').or(z.string().startsWith('/')),
  publicId: z.string().trim().min(1, 'publicId is required'),
});

const packageSchema = z.object({
  key: z.string().trim().min(1, 'Package key is required').toLowerCase(),
  name: bilingualStringSchema,
  price: z.number().int('Price must be an integer in piasters').min(0, 'Price cannot be negative'),
  compareAtPrice: z.number().int().min(0).nullable().optional(),
  features: z.array(bilingualStringSchema).optional().default([]),
  licenseType: z.enum(['single', 'multi']).optional().default('single'),
  supportDays: z.number().int().min(0).optional().default(30),
  isPopular: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

const previewSchema = z.object({
  url: z.string().trim().url().or(z.literal('')).optional().default(''),
  mode: z.enum(['iframe', 'external']).optional().default('iframe'),
  demoNote: z.object({ ar: z.string().optional(), en: z.string().optional() }).optional(),
  demoCredentials: z
    .object({
      label: z.string().optional().default('Demo Account'),
      email: z.string().optional().default(''),
      password: z.string().optional().default(''),
    })
    .optional(),
});

const privateRepoSchema = z.object({
  provider: z.enum(['github', 'gitlab', 'other']).optional().default('github'),
  owner: z.string().trim().optional().default(''),
  name: z.string().trim().optional().default(''),
  url: z.string().trim().optional().default(''),
});

const createProjectSchema = z.object({
  body: z.object({
    slug: z.string().trim().optional(),
    title: bilingualStringSchema,
    tagline: bilingualStringSchema,
    description: bilingualStringSchema,
    category: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Category must be a valid MongoDB ObjectId'),
    techStack: z.array(z.string().trim()).min(1, 'At least one tech stack item is required'),
    features: z.array(bilingualStringSchema).optional().default([]),
    thumbnail: imageAssetSchema,
    gallery: z.array(imageAssetSchema).optional().default([]),
    preview: previewSchema.optional().default(() => ({})),
    packages: z.array(packageSchema).min(1, 'At least one package is required'),
    privateRepo: privateRepoSchema.optional().default(() => ({})),
    status: z.enum(['draft', 'published', 'archived']).optional().default('draft'),
    isFeatured: z.boolean().optional().default(false),
    sortOrder: z.number().int().optional().default(0),
  }),
});

const updateProjectSchema = z.object({
  body: z.object({
    slug: z.string().trim().optional(),
    title: bilingualStringSchema.partial().optional(),
    tagline: bilingualStringSchema.partial().optional(),
    description: bilingualStringSchema.partial().optional(),
    category: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Category must be a valid MongoDB ObjectId').optional(),
    techStack: z.array(z.string().trim()).optional(),
    features: z.array(bilingualStringSchema).optional(),
    thumbnail: imageAssetSchema.optional(),
    gallery: z.array(imageAssetSchema).optional(),
    preview: previewSchema.optional(),
    packages: z.array(packageSchema).min(1).optional(),
    privateRepo: privateRepoSchema.optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    isFeatured: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  }),
});

const updateProjectStatusSchema = z.object({
  body: z.object({
    status: z.enum(['draft', 'published', 'archived']),
  }),
});

const publicProjectQuerySchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    category: z.string().trim().optional(),
    tech: z.string().trim().optional(),
    minPrice: z.coerce.number().int().min(0).optional(),
    maxPrice: z.coerce.number().int().min(0).optional(),
    sort: z.enum(['newest', 'price_asc', 'price_desc', 'popular']).optional().default('newest'),
    featured: z
      .preprocess((val) => {
        if (val === 'true' || val === true) return true;
        if (val === 'false' || val === false) return false;
        return undefined;
      }, z.boolean().optional())
      .optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(12),
  }),
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  updateProjectStatusSchema,
  publicProjectQuerySchema,
};
