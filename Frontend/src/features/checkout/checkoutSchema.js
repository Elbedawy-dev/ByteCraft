import { z } from 'zod';
import { ApiError, getApiErrorMessage } from '@/api/client';

/**
 * Fixed order in which payment methods are displayed.
 */
export const PAYMENT_METHOD_ORDER = ['vodafone_cash', 'instapay', 'fawry', 'card'];

/**
 * Maps backend Zod error paths (`customer.*`) to flat react-hook-form field names.
 */
export const CHECKOUT_FIELD_MAP = {
  'customer.fullName': 'fullName',
  'customer.email': 'email',
  'customer.phone': 'phone',
  'customer.gitProvider': 'gitProvider',
  'customer.gitUsername': 'gitUsername',
  'customer.organization': 'organization',
  paymentMethod: 'paymentMethod',
};

/**
 * Builds the Zod validation schema mirroring `Backend/src/validators/order.validator.js`.
 */
export function createCheckoutSchema(t) {
  return z.object({
    fullName: z
      .string()
      .trim()
      .min(1, t('checkout:validation.fullNameRequired'))
      .min(2, t('checkout:validation.fullNameMin')),
    email: z
      .string()
      .trim()
      .min(1, t('checkout:validation.emailRequired'))
      .email(t('checkout:validation.emailInvalid')),
    phone: z
      .string()
      .trim()
      .min(1, t('checkout:validation.phoneRequired'))
      .min(6, t('checkout:validation.phoneMin')),
    gitProvider: z.enum(['github', 'gitlab'], {
      errorMap: () => ({ message: t('checkout:validation.gitProviderRequired') }),
    }),
    gitUsername: z
      .string()
      .trim()
      .transform((val) => val.replace(/^@+/, ''))
      .refine((val) => val.length >= 1, {
        message: t('checkout:validation.gitUsernameRequired'),
      }),
    organization: z.string().trim().optional().default(''),
    paymentMethod: z.enum(['vodafone_cash', 'instapay', 'fawry', 'card'], {
      errorMap: () => ({ message: t('checkout:validation.paymentMethodRequired') }),
    }),
    website: z.string().optional().default(''),
  });
}

const KNOWN_COUPON_ERROR_CODES = new Set([
  'INVALID_COUPON',
  'COUPON_INACTIVE',
  'COUPON_EXPIRED',
  'COUPON_MAX_USES_REACHED',
  'COUPON_NOT_APPLICABLE',
  'PROJECT_NOT_AVAILABLE',
  'PACKAGE_NOT_ACTIVE',
  'NOT_FOUND',
  'TOO_MANY_REQUESTS',
  'VALIDATION_ERROR',
]);

/**
 * Maps `/api/coupons/validate` server error codes to friendly localized strings.
 */
export function getCouponErrorMessage(error, t) {
  if (!error) return t('checkout:coupon.errors.GENERIC');

  if (error instanceof ApiError) {
    if (error.isRateLimited || error.code === 'TOO_MANY_REQUESTS') {
      return t('checkout:coupon.errors.TOO_MANY_REQUESTS');
    }
    if (error.code && KNOWN_COUPON_ERROR_CODES.has(error.code)) {
      return t(`checkout:coupon.errors.${error.code}`);
    }
    return getApiErrorMessage(error, t);
  }

  return error.message || t('checkout:coupon.errors.GENERIC');
}

/**
 * Normalizes a phone/WhatsApp string into a `https://wa.me/<digits>` URL.
 */
export function buildWhatsAppUrl(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string') return null;
  const digits = rawPhone.replace(/[^\d]/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}
