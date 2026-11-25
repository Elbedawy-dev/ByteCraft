const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, USER_STATUSES } = require('../config/constants');
const { DUMMY_BCRYPT_HASH } = require('../utils/password');

/**
 * User Model
 *
 * Replaces the legacy single-document `Owner` model with a full multi-user account model:
 * - Roles: `customer` (public registration) and `admin` (created by migration, seed, or another admin)
 * - Security: `passwordHash` (bcrypt cost 12, `select: false`), `tokenVersion` for global session revocation,
 *   5-attempt / 15-minute lockout (`failedLoginCount`, `lockUntil`), SHA-256 hashed single-use tokens
 *   for email verification (24h) and password reset / admin invite (1h / 24h).
 */

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      default: null,
      select: false,
    },
    role: {
      type: String,
      enum: [ROLES.CUSTOMER, ROLES.ADMIN],
      default: ROLES.CUSTOMER,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    gitProvider: {
      type: String,
      enum: ['github', 'gitlab', null],
      default: null,
    },
    gitUsername: {
      type: String,
      trim: true,
      default: '',
    },
    locale: {
      type: String,
      enum: ['ar', 'en'],
      default: 'ar',
    },
    status: {
      type: String,
      enum: [USER_STATUSES.ACTIVE, USER_STATUSES.DISABLED],
      default: USER_STATUSES.ACTIVE,
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    tokenVersion: {
      type: Number,
      default: 0,
      min: 0,
    },
    failedLoginCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    emailVerificationTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    emailVerificationExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },
    passwordResetTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    passwordResetExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        delete ret.tokenVersion;
        delete ret.failedLoginCount;
        delete ret.lockUntil;
        delete ret.emailVerificationTokenHash;
        delete ret.emailVerificationExpiresAt;
        delete ret.passwordResetTokenHash;
        delete ret.passwordResetExpiresAt;
        return ret;
      },
    },
  }
);

userSchema.index({ emailVerificationTokenHash: 1 }, { sparse: true });
userSchema.index({ passwordResetTokenHash: 1 }, { sparse: true });

/**
 * Verifies a candidate password against stored bcrypt hash.
 * Runs a dummy compare if `passwordHash` is unset (e.g. pending admin invite) to prevent timing leaks.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) {
    await bcrypt.compare(String(candidatePassword || ''), DUMMY_BCRYPT_HASH);
    return false;
  }
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

/**
 * Returns a sanitized plain object safe for API responses.
 */
userSchema.methods.toSafeObject = function () {
  return {
    id: String(this._id),
    name: this.name,
    email: this.email,
    role: this.role,
    phone: this.phone || '',
    gitProvider: this.gitProvider || null,
    gitUsername: this.gitUsername || '',
    locale: this.locale || 'ar',
    status: this.status || USER_STATUSES.ACTIVE,
    emailVerified: Boolean(this.emailVerified),
    emailVerifiedAt: this.emailVerifiedAt || null,
    lastLoginAt: this.lastLoginAt || null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

/**
 * Hashes a raw password with bcrypt cost 12.
 */
userSchema.statics.hashPassword = async function (rawPassword) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(rawPassword, salt);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
