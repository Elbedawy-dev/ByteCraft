const { ZodError } = require('zod');
const mongoose = require('mongoose');
const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../config/constants');
const env = require('../config/env');

/**
 * Centralized Error Handling Middleware
 * 
 * WHY:
 * 1. Single source of truth for all API errors across the system.
 * 2. Unifies all errors into the consistent JSON error envelope:
 *    {
 *      "success": false,
 *      "error": {
 *        "code": "...",
 *        "message": "...",
 *        "details": [...]
 *      }
 *    }
 * 3. Maps diverse error types (Mongoose, Zod, Multer, JWT, custom AppError)
 *    into clean client-safe formats while preventing sensitive stack traces in production.
 */

// Format Zod schema validation errors into readable field/message pairs
function formatZodDetails(zodError) {
  return zodError.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

// Format Mongoose model validation errors into field/message pairs
function formatMongooseDetails(mongooseError) {
  return Object.values(mongooseError.errors).map((err) => ({
    field: err.path,
    message: err.message,
  }));
}

function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let code = ERROR_CODES.INTERNAL_ERROR;
  let message = 'An unexpected internal server error occurred.';
  let details = [];

  // 1. Custom Operational Application Errors (AppError)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details || [];
    if (err.retryAfterSeconds) {
      res.set('Retry-After', String(err.retryAfterSeconds));
    }
  }

  // 2. JWT Authentication Errors
  else if (
    err.name === 'JsonWebTokenError' ||
    err.name === 'TokenExpiredError' ||
    err.name === 'NotBeforeError'
  ) {
    statusCode = 401;
    code = ERROR_CODES.UNAUTHORIZED;
    message = err.name === 'TokenExpiredError' ? 'Session expired. Please log in again.' : 'Invalid authentication session.';
  }

  // 3. Zod Request Payload / Query / Params Validation Errors
  else if (err instanceof ZodError) {
    statusCode = 400;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = 'Validation failed';
    details = formatZodDetails(err);
  }

  // 4. Mongoose Schema Validation Errors
  else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = 'Invalid data provided';
    details = formatMongooseDetails(err);
  }

  // 5. Mongoose Duplicate Key Error (Unique constraint violation)
  else if (err.code === 11000) {
    statusCode = 409;
    code = ERROR_CODES.CONFLICT;
    const duplicatedKeys = Object.keys(err.keyPattern || err.keyValue || {});
    const fieldName = duplicatedKeys[0] || 'field';
    message = `A resource with the specified ${fieldName} already exists.`;
    details = [{ field: fieldName, message: `Duplicate value for "${fieldName}"` }];
  }

  // 6. Mongoose Cast Error (Invalid ObjectId or Type)
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = `Invalid ${err.kind} format for parameter "${err.path}"`;
    details = [{ field: err.path, message: `Cannot cast value "${err.value}" to ${err.kind}` }];
  }

  // 6. JSON Syntax Error (Malformed JSON payload from client)
  else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = 'Malformed JSON payload in request body';
  }

  // 7. Multer File Upload Errors
  else if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      code = ERROR_CODES.FILE_TOO_LARGE;
      message = 'File size exceeds maximum allowed limit of 4MB';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      code = ERROR_CODES.VALIDATION_ERROR;
      message = 'Too many files uploaded. Maximum allowed file count exceeded.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      code = ERROR_CODES.VALIDATION_ERROR;
      message = `Unexpected file field or file count limit exceeded${err.field ? ` (${err.field})` : ''}`;
    } else {
      code = ERROR_CODES.VALIDATION_ERROR;
      message = `Upload error: ${err.message}`;
    }
    details = [{ field: err.field || 'files', message }];
  }

  // In development, log the error stack for debugging
  if (env.NODE_ENV === 'development' && statusCode === 500) {
    console.error('🔥 [Unhandled Error]:', err);
  }

  // Unified Response Envelope
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
}

module.exports = errorHandler;
