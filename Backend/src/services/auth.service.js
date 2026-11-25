const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const settingsService = require('./settings.service');
const emailService = require('./email.service');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const { ERROR_CODES, ROLES, USER_STATUSES } = require('../config/constants');
const { DUMMY_BCRYPT_HASH, getPasswordValidationErrors } = require('../utils/password');

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
const LOCKOUT_MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function hashToken(rawToken) {
  if (!rawToken) return '';
  return crypto.createHash('sha256').update(String(rawToken)).digest('hex');
}

function timingSafeEqualStrings(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length === 0 || bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function generateSecureToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  return { rawToken, tokenHash };
}

function signSessionToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      role: user.role,
      tv: user.tokenVersion || 0,
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN,
    }
  );
}

/**
 * Authentication Service
 *
 * Handles registration, login (with timing-safe dummy compare & 5-attempt lockout),
 * email verification, password reset, and password updates with tokenVersion bumps.
 */
class AuthService {
  hashToken(rawToken) {
    return hashToken(rawToken);
  }

  signSessionToken(user) {
    return signSessionToken(user);
  }

  /**
   * Public customer registration.
   * Always creates a `customer` user, signs session token, and sends verification email.
   */
  async register({ name, email, password, phone = '', locale = 'ar' }) {
    const settings = await settingsService.getSettings();
    if (settings.registrationEnabled === false) {
      throw AppError.forbidden(
        'Public registration is currently disabled.',
        ERROR_CODES.FORBIDDEN
      );
    }

    const normalizedEmail = String(email || '').trim().toLowerCase();
    const pwdErrors = getPasswordValidationErrors(password, normalizedEmail);
    if (pwdErrors.length > 0) {
      throw AppError.badRequest(
        pwdErrors[0],
        ERROR_CODES.VALIDATION_ERROR,
        pwdErrors.map((msg) => ({ field: 'password', message: msg }))
      );
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      throw AppError.conflict(
        'An account with this email already exists.',
        ERROR_CODES.CONFLICT
      );
    }

    const passwordHash = await User.hashPassword(password);
    const { rawToken, tokenHash } = generateSecureToken();

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      role: ROLES.CUSTOMER,
      phone: phone ? String(phone).trim() : '',
      locale: locale === 'en' ? 'en' : 'ar',
      status: USER_STATUSES.ACTIVE,
      emailVerified: false,
      emailVerifiedAt: null,
      tokenVersion: 0,
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
    });

    const token = signSessionToken(user);

    emailService.sendVerifyEmail(user, rawToken).catch((err) => {
      console.error('Failed to send verification email:', err.message);
    });

    return {
      token,
      user: user.toSafeObject(),
    };
  }

  /**
   * Unified login for both `customer` and `admin`.
   * - Dummy bcrypt compare for unknown emails (prevents timing enumeration)
   * - Locks account for 15 min after 5 failed attempts (returns 423 with remaining time)
   * - Resets failedLoginCount on success
   */
  async login(email, password) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

    if (!user) {
      await bcrypt.compare(String(password || ''), DUMMY_BCRYPT_HASH);
      throw AppError.unauthorized('Invalid email or password.', ERROR_CODES.INVALID_CREDENTIALS);
    }

    const now = new Date();
    if (user.lockUntil && user.lockUntil > now) {
      const remainingSeconds = Math.max(1, Math.ceil((user.lockUntil.getTime() - now.getTime()) / 1000));
      const remainingMinutes = Math.ceil(remainingSeconds / 60);
      const lockedErr = new AppError(
        `Account is temporarily locked due to too many failed login attempts. Try again in ${remainingMinutes} minute(s) (${remainingSeconds}s).`,
        423,
        ERROR_CODES.ACCOUNT_LOCKED,
        [
          { field: 'remainingSeconds', message: String(remainingSeconds) },
          { field: 'lockUntil', message: user.lockUntil.toISOString() },
        ]
      );
      lockedErr.retryAfterSeconds = remainingSeconds;
      throw lockedErr;
    }

    if (user.lockUntil && user.lockUntil <= now) {
      user.failedLoginCount = 0;
      user.lockUntil = null;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginCount = (user.failedLoginCount || 0) + 1;
      if (user.failedLoginCount >= LOCKOUT_MAX_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      }
      await user.save();
      throw AppError.unauthorized('Invalid email or password.', ERROR_CODES.INVALID_CREDENTIALS);
    }

    if (user.status !== USER_STATUSES.ACTIVE) {
      throw AppError.forbidden('Your account has been disabled.', ERROR_CODES.FORBIDDEN);
    }

    user.failedLoginCount = 0;
    user.lockUntil = null;
    user.lastLoginAt = new Date();
    await user.save();

    const token = signSessionToken(user);

    return {
      token,
      user: user.toSafeObject(),
    };
  }

  /**
   * Verifies email using single-use 32-byte token (stored as SHA-256 hash, 24h TTL).
   */
  async verifyEmail(rawToken) {
    const tokenHash = hashToken(rawToken);
    if (!tokenHash) {
      throw AppError.badRequest('Invalid or expired verification token.', ERROR_CODES.INVALID_TOKEN);
    }

    const user = await User.findOne({ emailVerificationTokenHash: tokenHash }).select(
      '+emailVerificationTokenHash +emailVerificationExpiresAt'
    );

    if (
      !user ||
      !user.emailVerificationTokenHash ||
      !timingSafeEqualStrings(user.emailVerificationTokenHash, tokenHash)
    ) {
      throw AppError.badRequest('Invalid or expired verification token.', ERROR_CODES.INVALID_TOKEN);
    }

    if (!user.emailVerificationExpiresAt || user.emailVerificationExpiresAt <= new Date()) {
      user.emailVerificationTokenHash = null;
      user.emailVerificationExpiresAt = null;
      await user.save();
      throw AppError.badRequest(
        'Verification token has expired. Please request a new one.',
        ERROR_CODES.INVALID_TOKEN
      );
    }

    const updated = await User.findOneAndUpdate(
      { _id: user._id, emailVerificationTokenHash: tokenHash },
      {
        $set: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
          emailVerificationTokenHash: null,
          emailVerificationExpiresAt: null,
        },
      },
      { new: true }
    );

    if (!updated) {
      throw AppError.badRequest('Invalid or expired verification token.', ERROR_CODES.INVALID_TOKEN);
    }

    emailService.sendWelcome(updated).catch((err) => {
      console.error('Failed to send welcome email:', err.message);
    });

    return {
      user: updated.toSafeObject(),
    };
  }

  /**
   * Resends verification email for an authenticated unverified user or by email (generic response).
   */
  async resendVerification({ currentUser = null, email = '' }) {
    if (currentUser) {
      if (currentUser.emailVerified) {
        throw AppError.badRequest('Your email address is already verified.', ERROR_CODES.ALREADY_VERIFIED);
      }

      const { rawToken, tokenHash } = generateSecureToken();
      currentUser.emailVerificationTokenHash = tokenHash;
      currentUser.emailVerificationExpiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);
      await currentUser.save();

      emailService.sendVerifyEmail(currentUser, rawToken).catch((err) => {
        console.error('Failed to resend verification email:', err.message);
      });

      return {
        message: 'Verification email sent.',
      };
    }

    if (!email) {
      throw AppError.badRequest('Email or active session is required.', ERROR_CODES.VALIDATION_ERROR);
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (user && user.status === USER_STATUSES.ACTIVE && !user.emailVerified) {
      const { rawToken, tokenHash } = generateSecureToken();
      user.emailVerificationTokenHash = tokenHash;
      user.emailVerificationExpiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);
      await user.save();

      emailService.sendVerifyEmail(user, rawToken).catch((err) => {
        console.error('Failed to resend verification email:', err.message);
      });
    }

    return {
      message: 'If your account exists and is not yet verified, a verification email has been sent.',
    };
  }

  /**
   * Initiates password reset. Always resolves with identical generic message
   * so callers cannot determine whether an email exists.
   */
  async forgotPassword(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (user && user.status === USER_STATUSES.ACTIVE) {
      const { rawToken, tokenHash } = generateSecureToken();
      user.passwordResetTokenHash = tokenHash;
      user.passwordResetExpiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
      await user.save();

      emailService.sendResetPassword(user, rawToken).catch((err) => {
        console.error('Failed to send reset password email:', err.message);
      });
    }

    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
  }

  /**
   * Completes password reset (or admin-invite password setup),
   * consumes single-use token, and bumps `tokenVersion` to revoke all existing sessions.
   */
  async resetPassword(rawToken, newPassword) {
    const tokenHash = hashToken(rawToken);
    if (!tokenHash) {
      throw AppError.badRequest('Invalid or expired password reset token.', ERROR_CODES.INVALID_TOKEN);
    }

    const user = await User.findOne({ passwordResetTokenHash: tokenHash }).select(
      '+passwordResetTokenHash +passwordResetExpiresAt +passwordHash'
    );

    if (
      !user ||
      !user.passwordResetTokenHash ||
      !timingSafeEqualStrings(user.passwordResetTokenHash, tokenHash)
    ) {
      throw AppError.badRequest('Invalid or expired password reset token.', ERROR_CODES.INVALID_TOKEN);
    }

    if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt <= new Date()) {
      user.passwordResetTokenHash = null;
      user.passwordResetExpiresAt = null;
      await user.save();
      throw AppError.badRequest(
        'Password reset token has expired.',
        ERROR_CODES.INVALID_TOKEN
      );
    }

    if (user.status !== USER_STATUSES.ACTIVE) {
      throw AppError.forbidden('Your account has been disabled.', ERROR_CODES.FORBIDDEN);
    }

    const pwdErrors = getPasswordValidationErrors(newPassword, user.email);
    if (pwdErrors.length > 0) {
      throw AppError.badRequest(
        pwdErrors[0],
        ERROR_CODES.VALIDATION_ERROR,
        pwdErrors.map((msg) => ({ field: 'password', message: msg }))
      );
    }

    const passwordHash = await User.hashPassword(newPassword);

    const setPayload = {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      failedLoginCount: 0,
      lockUntil: null,
    };

    if (user.role === ROLES.ADMIN && !user.emailVerified) {
      setPayload.emailVerified = true;
      setPayload.emailVerifiedAt = new Date();
    }

    const updated = await User.findOneAndUpdate(
      { _id: user._id, passwordResetTokenHash: tokenHash, status: USER_STATUSES.ACTIVE },
      {
        $set: setPayload,
        $inc: { tokenVersion: 1 },
      },
      { new: true }
    );

    if (!updated) {
      throw AppError.badRequest('Invalid or expired password reset token.', ERROR_CODES.INVALID_TOKEN);
    }

    emailService.sendPasswordChanged(updated).catch((err) => {
      console.error('Failed to send password changed notice:', err.message);
    });

    return {
      message: 'Password has been reset successfully.',
    };
  }

  /**
   * Changes password for authenticated user, bumps `tokenVersion`, and returns fresh session token.
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      throw AppError.unauthorized('Account not found.', ERROR_CODES.UNAUTHORIZED);
    }

    const isCurrentValid = await user.comparePassword(currentPassword);
    if (!isCurrentValid) {
      throw AppError.badRequest('Current password is incorrect', ERROR_CODES.INVALID_CURRENT_PASSWORD);
    }

    const pwdErrors = getPasswordValidationErrors(newPassword, user.email);
    if (pwdErrors.length > 0) {
      throw AppError.badRequest(
        pwdErrors[0],
        ERROR_CODES.VALIDATION_ERROR,
        pwdErrors.map((msg) => ({ field: 'newPassword', message: msg }))
      );
    }

    user.passwordHash = await User.hashPassword(newPassword);
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    const token = signSessionToken(user);

    emailService.sendPasswordChanged(user).catch((err) => {
      console.error('Failed to send password changed notice:', err.message);
    });

    return {
      token,
      user: user.toSafeObject(),
    };
  }
}

module.exports = new AuthService();
