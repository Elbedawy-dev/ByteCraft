const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { AUTH_COOKIE_NAME, ERROR_CODES, USER_STATUSES } = require('../config/constants');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');

/**
 * Session Authentication & Authorization Middleware
 *
 * - Reads JWT exclusively from the `bc_session` httpOnly cookie
 *   (with `Authorization: Bearer <token>` fallback allowed ONLY in non-production).
 * - Rejects legacy `bc_owner` cookies and tokens missing `{ sub, role, tv }`.
 * - Loads the `User` from MongoDB, rejects disabled accounts, and rejects tokens
 *   whose `tv` differs from `user.tokenVersion`.
 */

function extractSessionToken(req) {
  if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
    return req.cookies[AUTH_COOKIE_NAME];
  }

  if (
    env.NODE_ENV !== 'production' &&
    req.headers &&
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    return req.headers.authorization.split(' ')[1];
  }

  return null;
}

async function resolveSessionUser(req) {
  const token = extractSessionToken(req);
  if (!token) {
    return { user: null, reason: 'NO_TOKEN' };
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch {
    return { user: null, reason: 'INVALID_JWT' };
  }

  if (
    !decoded ||
    typeof decoded.sub !== 'string' ||
    typeof decoded.tv !== 'number' ||
    !decoded.role
  ) {
    return { user: null, reason: 'INVALID_PAYLOAD' };
  }

  const user = await User.findById(decoded.sub);
  if (!user) {
    return { user: null, reason: 'USER_NOT_FOUND' };
  }

  if (user.status !== USER_STATUSES.ACTIVE) {
    return { user: null, reason: 'ACCOUNT_DISABLED' };
  }

  if (decoded.tv !== user.tokenVersion) {
    return { user: null, reason: 'TOKEN_REVOKED' };
  }

  return { user, reason: null };
}

/**
 * Optional authentication: attaches `req.user` when a valid active session exists;
 * otherwise sets `req.user = null` and continues without failing.
 */
const authOptional = asyncHandler(async (req, res, next) => {
  try {
    const { user } = await resolveSessionUser(req);
    req.user = user || null;
  } catch {
    req.user = null;
  }
  next();
});

/**
 * Mandatory authentication: verifies `bc_session` cookie/JWT, loads active user,
 * checks `tokenVersion`, and attaches `req.user`.
 */
const requireAuth = asyncHandler(async (req, res, next) => {
  const { user, reason } = await resolveSessionUser(req);

  if (reason === 'ACCOUNT_DISABLED') {
    throw AppError.forbidden('Your account has been disabled.', ERROR_CODES.FORBIDDEN);
  }

  if (!user) {
    throw AppError.unauthorized('Authentication required. Please log in.', ERROR_CODES.UNAUTHORIZED);
  }

  req.user = user;
  next();
});

/**
 * Role-based authorization guard (must be used after `requireAuth`).
 * Rejects authenticated users whose role is not in `allowedRoles` with 403 FORBIDDEN.
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        AppError.unauthorized('Authentication required. Please log in.', ERROR_CODES.UNAUTHORIZED)
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          'You do not have permission to access this resource.',
          ERROR_CODES.FORBIDDEN
        )
      );
    }

    return next();
  };
}

module.exports = {
  authOptional,
  requireAuth,
  requireRole,
};
