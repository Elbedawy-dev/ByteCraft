const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');
const { AUTH_COOKIE_NAME } = require('../config/constants');

/**
 * Authentication Controller
 *
 * Manages HTTP-only `bc_session` cookies and delegates auth business logic to AuthService.
 */

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

function setSessionCookie(res, token) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: resolveCookieSecurity(),
    sameSite: env.COOKIE_SAMESITE,
    path: '/',
    maxAge: getCookieMaxAge(),
  });
}

function clearSessionCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: resolveCookieSecurity(),
    sameSite: env.COOKIE_SAMESITE,
    path: '/',
  });
}

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  setSessionCookie(res, result.token);

  res.status(201).json({
    success: true,
    data: {
      user: result.user,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  setSessionCookie(res, result.token);

  res.status(200).json({
    success: true,
    data: {
      user: result.user,
    },
  });
});

const logout = asyncHandler(async (req, res) => {
  clearSessionCookie(res);

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
      user: req.user.toSafeObject(),
    },
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmail(req.body.token);

  res.status(200).json({
    success: true,
    data: result,
  });
});

const resendVerification = asyncHandler(async (req, res) => {
  const result = await authService.resendVerification({
    currentUser: req.user || null,
    email: req.body?.email || '',
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);

  res.status(200).json({
    success: true,
    data: result,
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const result = await authService.resetPassword(token, password);

  res.status(200).json({
    success: true,
    data: result,
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await authService.changePassword(req.user._id, currentPassword, newPassword);

  // Re-issue cookie with the bumped tokenVersion so current session stays valid while others die
  setSessionCookie(res, result.token);

  res.status(200).json({
    success: true,
    data: {
      message: 'Password updated successfully',
    },
  });
});

// ==========================================
// Deprecated `/api/owner/*` Auth Aliases
// ==========================================

const deprecatedOwnerLogin = asyncHandler(async (req, res) => {
  res.set('Deprecation', 'true');
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  setSessionCookie(res, result.token);

  res.status(200).json({
    success: true,
    data: {
      user: result.user,
      owner: result.user,
      token: result.token,
    },
  });
});

const deprecatedOwnerLogout = asyncHandler(async (req, res) => {
  res.set('Deprecation', 'true');
  clearSessionCookie(res);

  res.status(200).json({
    success: true,
    data: {
      message: 'Logged out successfully',
    },
  });
});

const deprecatedOwnerMe = asyncHandler(async (req, res) => {
  res.set('Deprecation', 'true');
  const safeUser = req.user.toSafeObject();

  res.status(200).json({
    success: true,
    data: {
      user: safeUser,
      owner: safeUser,
    },
  });
});

const deprecatedOwnerChangePassword = asyncHandler(async (req, res) => {
  res.set('Deprecation', 'true');
  const { currentPassword, newPassword } = req.body;
  const result = await authService.changePassword(req.user._id, currentPassword, newPassword);
  setSessionCookie(res, result.token);

  res.status(200).json({
    success: true,
    data: {
      message: 'Password updated successfully',
    },
  });
});

module.exports = {
  setSessionCookie,
  clearSessionCookie,
  register,
  login,
  logout,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  deprecatedOwnerLogin,
  deprecatedOwnerLogout,
  deprecatedOwnerMe,
  deprecatedOwnerChangePassword,
};
