const jwt = require('jsonwebtoken');
const Owner = require('../models/Owner');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../config/constants');

/**
 * Owner Authentication Service
 * 
 * WHY:
 * Encapsulates credential verification, password hashing, and token signing.
 * Keeps controllers strictly focused on HTTP transport concerns (cookies, status codes).
 */

class AuthService {
  /**
   * Authenticates Owner by email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ token: string, owner: object }>}
   */
  async login(email, password) {
    // 1. Explicitly select '+passwordHash' because it is hidden (select: false) by default
    const owner = await Owner.findOne({ email: email.toLowerCase() }).select('+passwordHash');

    // 2. Generic error message prevents username enumeration / account discovery attacks
    if (!owner) {
      throw AppError.unauthorized('Invalid credentials', ERROR_CODES.INVALID_CREDENTIALS);
    }

    const isMatch = await owner.comparePassword(password);
    if (!isMatch) {
      throw AppError.unauthorized('Invalid credentials', ERROR_CODES.INVALID_CREDENTIALS);
    }

    // 3. Update last login timestamp
    owner.lastLoginAt = new Date();
    await owner.save();

    // 4. Generate signed JWT token
    const token = jwt.sign(
      {
        id: owner._id,
        email: owner.email,
      },
      env.JWT_SECRET,
      {
        expiresIn: env.JWT_EXPIRES_IN,
      }
    );

    return {
      token,
      owner: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        lastLoginAt: owner.lastLoginAt,
      },
    };
  }

  /**
   * Updates Owner's password after verifying the current one
   * @param {string} ownerId
   * @param {string} currentPassword
   * @param {string} newPassword
   * @returns {Promise<boolean>}
   */
  async changePassword(ownerId, currentPassword, newPassword) {
    const owner = await Owner.findById(ownerId).select('+passwordHash');
    if (!owner) {
      throw AppError.unauthorized('Owner account not found', ERROR_CODES.UNAUTHORIZED);
    }

    // Verify current password
    const isCurrentValid = await owner.comparePassword(currentPassword);
    if (!isCurrentValid) {
      throw AppError.badRequest('Current password is incorrect', ERROR_CODES.INVALID_CURRENT_PASSWORD);
    }

    // Hash and store the new password
    owner.passwordHash = await Owner.hashPassword(newPassword);
    await owner.save();

    return true;
  }
}

module.exports = new AuthService();
