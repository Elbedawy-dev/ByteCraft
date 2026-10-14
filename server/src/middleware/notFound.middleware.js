const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../config/constants');

/**
 * 404 Not Found Middleware
 * 
 * WHY:
 * Catches any incoming HTTP request that does not match any registered route,
 * returning a clean, standardized 404 response through the central error handler.
 */
function notFound(req, res, next) {
  next(
    new AppError(
      `Cannot find endpoint ${req.method} ${req.originalUrl} on this server`,
      404,
      ERROR_CODES.NOT_FOUND
    )
  );
}

module.exports = notFound;
