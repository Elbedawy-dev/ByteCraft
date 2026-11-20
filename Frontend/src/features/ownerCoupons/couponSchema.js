import { z } from 'zod';
import { egpToPiasters, piastersToEgp } from '@/lib/money';

const CODE_REGEX = /^[A-Z0-9_-]+$/;

/**
 * Mirrors Backend/src/validators/coupon.validator.js rules:
 * - code: trimmed, uppercase, min 2, /^[A-Z0-9_-]+$/
 * - type: 'percent' | 'fixed'
 * - value: integer 1..100 for percent; positive EGP (> 0 -> >= 1 piaster) for fixed
 * - maxUses: empty/null (unlimited) or integer >= 1; REQUIRED >= 1 if type==='percent' && value===100
 * - expiresAt: empty/null or valid datetime string
 * - isActive: boolean
 * - appliesToProjects: array of 24-char hex ObjectId strings
 */
export function buildCouponSchema(t) {
  return z
    .object({
      code: z
        .string()
        .trim()
        .min(1, t('ownerCoupons:modal.validation.codeRequired'))
        .min(2, t('ownerCoupons:modal.validation.codeMin'))
        .transform((v) => v.toUpperCase())
        .refine((v) => CODE_REGEX.test(v), {
          message: t('ownerCoupons:modal.validation.codePattern'),
        }),
      type: z.enum(['percent', 'fixed']),
      value: z.string().trim().min(1, t('ownerCoupons:modal.validation.valueRequired')),
      maxUses: z.string().trim().optional().default(''),
      expiresAt: z.string().trim().optional().default(''),
      isActive: z.boolean().default(true),
      appliesToProjects: z.array(z.string()).optional().default([]),
    })
    .superRefine((data, ctx) => {
      const numericValue = Number(data.value);

      if (data.type === 'percent') {
        if (
          !Number.isFinite(numericValue) ||
          !Number.isInteger(numericValue) ||
          numericValue < 1 ||
          numericValue > 100
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['value'],
            message: t('ownerCoupons:modal.validation.percentRange'),
          });
        }
      } else {
        const piasters = egpToPiasters(data.value);
        if (!Number.isFinite(numericValue) || numericValue <= 0 || piasters < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['value'],
            message: t('ownerCoupons:modal.validation.fixedPositive'),
          });
        }
      }

      // maxUses validation
      let parsedMaxUses = null;
      if (data.maxUses !== '') {
        const numMax = Number(data.maxUses);
        if (!Number.isFinite(numMax) || !Number.isInteger(numMax) || numMax < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['maxUses'],
            message: t('ownerCoupons:modal.validation.maxUsesPositive'),
          });
        } else {
          parsedMaxUses = numMax;
        }
      }

      // Free coupon protection: 100% discount MUST have finite maxUses >= 1
      if (data.type === 'percent' && numericValue === 100 && (!parsedMaxUses || parsedMaxUses < 1)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['maxUses'],
          message: t('ownerCoupons:modal.validation.freeCouponMaxUsesRequired'),
        });
      }

      // expiresAt validation
      if (data.expiresAt !== '') {
        const d = new Date(data.expiresAt);
        if (Number.isNaN(d.getTime())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['expiresAt'],
            message: t('ownerCoupons:modal.validation.invalidDate'),
          });
        }
      }
    });
}

export function toDatetimeLocalValue(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export function couponToFormValues(coupon) {
  if (!coupon) {
    return {
      code: '',
      type: 'percent',
      value: '',
      maxUses: '',
      expiresAt: '',
      isActive: true,
      appliesToProjects: [],
    };
  }

  const projectIds = Array.isArray(coupon.appliesToProjects)
    ? coupon.appliesToProjects
        .map((item) => (typeof item === 'string' ? item : item?.id || item?._id))
        .filter(Boolean)
    : [];

  return {
    code: coupon.code || '',
    type: coupon.type === 'fixed' ? 'fixed' : 'percent',
    value:
      coupon.type === 'fixed'
        ? String(piastersToEgp(coupon.value))
        : String(coupon.value ?? ''),
    maxUses: coupon.maxUses != null ? String(coupon.maxUses) : '',
    expiresAt: toDatetimeLocalValue(coupon.expiresAt),
    isActive: coupon.isActive !== false,
    appliesToProjects: projectIds,
  };
}

export function formValuesToCouponPayload(values) {
  const value =
    values.type === 'fixed'
      ? egpToPiasters(values.value)
      : Math.round(Number(values.value));

  const maxUses = values.maxUses !== '' ? Number.parseInt(values.maxUses, 10) : null;

  let expiresAt = null;
  if (values.expiresAt !== '') {
    const parsed = new Date(values.expiresAt);
    if (!Number.isNaN(parsed.getTime())) {
      expiresAt = parsed.toISOString();
    }
  }

  return {
    code: values.code.trim().toUpperCase(),
    type: values.type,
    value,
    maxUses,
    expiresAt,
    isActive: Boolean(values.isActive),
    appliesToProjects: Array.isArray(values.appliesToProjects) ? values.appliesToProjects : [],
  };
}
