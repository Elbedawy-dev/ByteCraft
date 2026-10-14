const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { AUTH_COOKIE_NAME, ERROR_CODES } = require('../config/constants');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const Owner = require('../models/Owner');

/**
 * Owner Authentication Middleware
 * 
 * WHY:
 * 1. Reads the JWT from the secure HTTP-only cookie `bc_owner` (with Authorization header fallback).
 * 2. Verifies signature against `JWT_SECRET`.
 * 3. Fetches the active Owner document to verify existence and attaches it to `req.owner`.
 * 4. Ensures that protected dashboard/settings routes can only be accessed by the verified Owner.
 */

const authOwner = asyncHandler(async (req, res, next) => {
  let token = null;

  // 1. Try reading the token from the HTTP-only cookie
  if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
    token = req.cookies[AUTH_COOKIE_NAME];
  }
  // 2. Fallback: check Authorization Bearer header (helpful for automated tests and Postman)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw AppError.unauthorized('Authentication required. Please log in.', ERROR_CODES.UNAUTHORIZED);
  }

  // Verify JWT payload
  const decoded = jwt.verify(token, env.JWT_SECRET);

  // Load the Owner from the database
  const owner = await Owner.findById(decoded.id);
  if (!owner) {
    throw AppError.unauthorized('Owner account no longer exists.', ERROR_CODES.UNAUTHORIZED);
  }

  // Attach verified owner document to request
  req.owner = owner;
  next();
});

module.exports = {
  authOwner,
};
