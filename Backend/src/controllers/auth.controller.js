const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');
const { AUTH_COOKIE_NAME } = require('../config/constants');

/**
 * Authentication Controller
 * 
 * WHY:
 * Handles HTTP cookie management, response formats, and delegates business logic
 * (credential checking, token generation, password hashing) to AuthService.
 * If COOKIE_SAMESITE is 'none', forces secure: true so modern browsers do not reject it.
 */

// Helper to determine cookie max-age in milliseconds (defaults to 7 days)
function getCookieMaxAge() {
  const expiresIn = env.JWT_EXPIRES_IN;
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;

  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'm':
      return value * 60 * 1000;
    case 's':
      return value * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
}

function resolveCookieSecurity() {
  return env.NODE_ENV === 'production' || env.COOKIE_SAMESITE === 'none';
}

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);

  // Set the JWT inside an HTTP-only secure cookie
  res.cookie(AUTH_COOKIE_NAME, result.token, {
    httpOnly: true, // Prevents JavaScript (XSS) from reading the token
    secure: resolveCookieSecurity(), // Secure in production or when SameSite=None
    sameSite: env.COOKIE_SAMESITE, // CSRF protection policy ('lax', 'none', or 'strict')
    maxAge: getCookieMaxAge(),
  });

  res.status(200).json({
    success: true,
    data: {
      owner: result.owner,
      token: result.token, // Also provided in data for API testing flexibility
    },
  });
});

const logout = asyncHandler(async (req, res) => {
  // Clear the authentication cookie
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: resolveCookieSecurity(),
    sameSite: env.COOKIE_SAMESITE,
  });

  res.status(200).json({
    success: true,
    data: {
      message: 'Logged out successfully',
    },
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      owner: {
        id: req.owner._id,
        name: req.owner.name,
        email: req.owner.email,
        lastLoginAt: req.owner.lastLoginAt,
      },
    },
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.owner._id, currentPassword, newPassword);

  res.status(200).json({
    success: true,
    data: {
      message: 'Password updated successfully',
    },
  });
});

module.exports = {
  login,
  logout,
  getMe,
  changePassword,
};
