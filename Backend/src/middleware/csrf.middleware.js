const AppError = require('../utils/AppError');
const env = require('../config/env');
const { ERROR_CODES } = require('../config/constants');

/**
 * CSRF Hardening Middleware
 *
 * 1. Origin Validation: On mutating requests (`POST`, `PATCH`, `PUT`, `DELETE`),
 *    if the `Origin` header is present, it must exactly match one of the configured
 *    `CLIENT_URL` origins; otherwise returns `403 FORBIDDEN`.
 * 2. Content-Type Enforcement: Mutating requests with a non-empty body must specify
 *    `Content-Type: application/json` or `multipart/form-data`, otherwise `415 UNSUPPORTED_MEDIA_TYPE`.
 */

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

function getAllowedOrigins() {
  return env.CLIENT_URL.split(',')
    .map((url) => url.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

function csrfProtection(req, res, next) {
  if (!MUTATING_METHODS.has(req.method)) {
    return next();
  }

  // 1. Check Origin header when present
  const originHeader = req.headers.origin;
  if (originHeader !== undefined && String(originHeader).trim() !== '') {
    const normalizedOrigin = String(originHeader).trim().replace(/\/+$/, '');
    const allowedOrigins = getAllowedOrigins();
    if (!allowedOrigins.includes(normalizedOrigin)) {
      return next(
        AppError.forbidden(
          'Cross-origin request rejected: Origin is not allowed.',
          ERROR_CODES.FORBIDDEN
        )
      );
    }
  }

  // 2. Enforce JSON or multipart Content-Type when body is present
  const contentLength = req.headers['content-length'];
  const hasBody = contentLength !== undefined && contentLength !== '0';
  const isChunked = req.headers['transfer-encoding'] === 'chunked';

  if (!hasBody && !isChunked) {
    return next();
  }

  const isJson = req.is('application/json');
  const isMultipart = req.is('multipart/form-data');

  if (!isJson && !isMultipart) {
    return next(
      new AppError(
        'Mutating requests must specify Content-Type: application/json or multipart/form-data',
        415,
        ERROR_CODES.UNSUPPORTED_MEDIA_TYPE
      )
    );
  }

  return next();
}

module.exports = csrfProtection;
