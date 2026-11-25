const { z } = require('zod');

/**
 * Settings Zod Validation Schemas
 * 
 * WHY:
 * Protects site settings updates. Supports partial updates via deep optional objects,
 * while enforcing data rules (positive guarantee days, valid URLs/emails).
 */

const bilingualStringSchema = z.object({
  ar: z.string().trim().optional(),
  en: z.string().trim().optional(),
});

const updateSettingsSchema = z.object({
  body: z.object({
    siteName: z.string().trim().min(1, 'Site name cannot be empty').optional(),
    guaranteeDays: z.number().int().min(0, 'Guarantee days must be a non-negative integer').optional(),
    registrationEnabled: z.boolean().optional(),
    contact: z
      .object({
        email: z.string().trim().email('Invalid contact email').or(z.literal('')).optional(),
        whatsapp: z.string().trim().optional(),
        phone: z.string().trim().optional(),
        location: bilingualStringSchema.optional(),
        socials: z
          .object({
            github: z.string().trim().url('Invalid GitHub URL').or(z.literal('')).optional(),
            linkedin: z.string().trim().url('Invalid LinkedIn URL').or(z.literal('')).optional(),
            twitter: z.string().trim().url('Invalid Twitter/X URL').or(z.literal('')).optional(),
            facebook: z.string().trim().url('Invalid Facebook URL').or(z.literal('')).optional(),
          })
          .optional(),
      })
      .optional(),
    paymentMethods: z
      .object({
        vodafone_cash: z
          .object({
            enabled: z.boolean().optional(),
            walletNumber: z.string().trim().optional(),
            accountName: z.string().trim().optional(),
            instructions: bilingualStringSchema.optional(),
          })
          .optional(),
        instapay: z
          .object({
            enabled: z.boolean().optional(),
            ipa: z.string().trim().optional(),
            accountName: z.string().trim().optional(),
            instructions: bilingualStringSchema.optional(),
          })
          .optional(),
        fawry: z
          .object({
            enabled: z.boolean().optional(),
          })
          .optional(),
        card: z
          .object({
            enabled: z.boolean().optional(),
          })
          .optional(),
      })
      .optional(),
  }),
});

module.exports = {
  updateSettingsSchema,
};
