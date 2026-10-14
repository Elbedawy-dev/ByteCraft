/**
 * Global Application Constants
 * 
 * WHY:
 * Centralizing string keys, cookie names, and common error codes avoids typo bugs
 * and makes future updates (e.g. cookie name or header changes) painless.
 */

module.exports = {
  // Cookie name for Owner HTTP-only authentication
  AUTH_COOKIE_NAME: 'bc_owner',

  // Standardized error codes matching the API response specification
  ERROR_CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    INVALID_STATE: 'INVALID_STATE',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    INVALID_CURRENT_PASSWORD: 'INVALID_CURRENT_PASSWORD',
    TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
    UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
  },

  // Supported locales for the bilingual platform
  LOCALES: ['ar', 'en'],

  // Default VAT rate in Egypt
  DEFAULT_VAT_RATE: 14,

  // Default Guarantee period in days
  DEFAULT_GUARANTEE_DAYS: 30,
};
