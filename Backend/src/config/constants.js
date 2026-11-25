/**
 * Global Application Constants
 * 
 * WHY:
 * Centralizing string keys, cookie names, and common error codes avoids typo bugs
 * and makes future updates (e.g. cookie name or header changes) painless.
 */

module.exports = {
  // Cookie name for User HTTP-only session authentication (customer & admin)
  AUTH_COOKIE_NAME: 'bc_session',

  // User roles & statuses
  ROLES: {
    CUSTOMER: 'customer',
    ADMIN: 'admin',
  },
  USER_STATUSES: {
    ACTIVE: 'active',
    DISABLED: 'disabled',
  },

  // Standardized error codes matching the API response specification
  ERROR_CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    ALREADY_EXISTS: 'ALREADY_EXISTS',
    INVALID_STATE: 'INVALID_STATE',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    INVALID_CURRENT_PASSWORD: 'INVALID_CURRENT_PASSWORD',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
    ALREADY_VERIFIED: 'ALREADY_VERIFIED',
    TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
    UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
    NO_FILES_PROVIDED: 'NO_FILES_PROVIDED',
    PROJECT_HAS_PAID_ORDERS: 'PROJECT_HAS_PAID_ORDERS',
    CATEGORY_IN_USE: 'CATEGORY_IN_USE',
    PROJECT_NOT_AVAILABLE: 'PROJECT_NOT_AVAILABLE',
    PACKAGE_NOT_ACTIVE: 'PACKAGE_NOT_ACTIVE',
    INVALID_COUPON: 'INVALID_COUPON',
    COUPON_INACTIVE: 'COUPON_INACTIVE',
    COUPON_EXPIRED: 'COUPON_EXPIRED',
    COUPON_MAX_USES_REACHED: 'COUPON_MAX_USES_REACHED',
    COUPON_NOT_APPLICABLE: 'COUPON_NOT_APPLICABLE',
    INVALID_HMAC: 'INVALID_HMAC',
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
  },

  // Supported locales for the bilingual platform
  LOCALES: ['ar', 'en'],

  // Default Guarantee period in days
  DEFAULT_GUARANTEE_DAYS: 30,
};
