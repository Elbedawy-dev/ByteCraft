const { ZodError } = require('zod');
const AppError = require('../utils/AppError');
const env = require('../config/env');
const { ERROR_CODES } = require('../config/constants');

/**
 * Central Error Handler Middleware
 * 
 * WHY:
 * 1. Guarantees 100% adherence to the unified API error envelope:
 *    { "success": false, "error": { "code": "...", "message": "...", "details": [] } }
 * 2. Catches various error formats (Zod validation, Mongoose validation, Mongo 11000 duplicate keys,
 *    JWT authentication issues, CastError for invalid ObjectIDs) and translates them into uniform AppErrors.
 * 3. Never leaks stack traces in production to prevent exposing server internals.
 */

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let code = err.code || ERROR_CODES.INTERNAL_ERROR;
  let message = err.message || 'An unexpected internal error occurred';
  let details = err.details || [];

  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    statusCode = 400;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = 'Validation failed';
    details = err.issues.map((issue) => ({
      field: issue.path.join('.').replace(/^(body|query|params)\.?/, ''),
      message: issue.message,
    }));
  }

  // 2. Mongoose Validation Errors
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = 'Database validation failed';
    details = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // 3. Mongoose Cast Error (e.g. invalid MongoDB ObjectId)
  else if (err.name === 'CastError') {
    statusCode = 400;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = `Invalid value for parameter: ${err.path}`;
    details = [{ field: err.path, message: `Expected valid ${err.kind}` }];
  }

  // 4. MongoDB Duplicate Key Error (E11000)
  else if (err.code === 11000) {
    statusCode = 409;
    code = ERROR_CODES.CONFLICT;
    const duplicatedFields = Object.keys(err.keyPattern || err.keyValue || {});
    message = `Duplicate value for field: ${duplicatedFields.join(', ')}`;
    details = duplicatedFields.map((field) => ({
      field,
      message: `The value for "${field}" is already in use`,
    }));
  }

  // 5. JSON Web Token Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = ERROR_CODES.UNAUTHORIZED;
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = ERROR_CODES.UNAUTHORIZED;
    message = 'Authentication token has expired, please log in again';
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
      message = 'File size exceeds maximum allowed limit of 5MB';
    } else {
      code = ERROR_CODES.VALIDATION_ERROR;
      message = `Upload error: ${err.message}`;
    }
    details = [{ field: err.field || 'images', message }];
  }

  // In development, log the error stack for debugging
  if (env.NODE_ENV === 'development' && statusCode === 500) {
    console.error('🔥 [Unhandled Error]:', err);
  }

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
