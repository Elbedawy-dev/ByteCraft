const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../config/constants');

/**
 * Basic CSRF Hardening Middleware
 * 
 * WHY:
 * Because authentication relies on HTTP-only cookies, malicious third-party websites
 * could theoretically submit standard HTML forms (<form method="POST">) targeting the API.
 * Standard HTML forms can only produce `application/x-www-form-urlencoded`, `multipart/form-data`,
 * or `text/plain`. They CANNOT produce `application/json` without a browser CORS preflight check.
 * 
 * By restricting mutating requests (POST, PATCH, PUT, DELETE) with bodies to `application/json`
 * (or `multipart/form-data` for file uploads), we block cross-site form submission exploits.
 */

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

function csrfProtection(req, res, next) {
  if (!MUTATING_METHODS.has(req.method)) {
    return next();
  }

  const contentLength = req.headers['content-length'];
  const hasBody = contentLength !== undefined && contentLength !== '0';
  const isChunked = req.headers['transfer-encoding'] === 'chunked';

  // Requests without a body (e.g. POST /logout, DELETE /item/1) are safe from body-based form submission attacks
  if (!hasBody && !isChunked) {
    return next();
  }

  // Must be either JSON or multipart (for file uploads)
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
