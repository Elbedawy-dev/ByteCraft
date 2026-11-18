/**
 * Custom AppError Class
 * 
 * WHY:
 * 1. Distinguishes known operational errors (like invalid input, unauthorized access)
 *    from unexpected programmer/system bugs (syntax errors, database disconnections).
 * 2. Carries HTTP status code, standard error code string, and optional details array
 *    directly to the central error-handling middleware.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = []) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Flag indicating this is a trusted, predicted error

    // Captures the call stack while excluding the constructor call itself
    Error.captureStackTrace(this, this.constructor);
  }

  // Convenient static helpers for common HTTP error cases
  static badRequest(message = 'Bad request', code = 'BAD_REQUEST', details = []) {
    return new AppError(message, 400, code, details);
  }

  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED', details = []) {
    return new AppError(message, 401, code, details);
  }

  static forbidden(message = 'Forbidden', code = 'FORBIDDEN', details = []) {
    return new AppError(message, 403, code, details);
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND', details = []) {
    return new AppError(message, 404, code, details);
  }

  static conflict(message = 'Conflict detected', code = 'CONFLICT', details = []) {
    return new AppError(message, 409, code, details);
  }

  static tooManyRequests(message = 'Too many requests, please try again later', code = 'TOO_MANY_REQUESTS', details = []) {
    return new AppError(message, 429, code, details);
  }

  static internal(message = 'Internal server error', code = 'INTERNAL_ERROR', details = []) {
    return new AppError(message, 500, code, details);
  }
}

module.exports = AppError;
