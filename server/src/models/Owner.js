const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Owner Model
 * 
 * WHY:
 * 1. Single-document guarantee: The `key: 'owner'` field with a unique constraint
 *    and enum of ['owner'] mathematically guarantees at the database level that no more
 *    than ONE owner document can ever exist in the database.
 * 2. `select: false` on passwordHash prevents accidental leaks in queries or JSON serialization.
 * 3. Bcrypt comparison helper encapsulates password verification logic within the model.
 */

const ownerSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      enum: ['owner'],
      default: 'owner',
      immutable: true, // Prevents modifying the singleton key
    },
    email: {
      type: String,
      required: [true, 'Owner email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Never included in query results unless explicitly requested via .select('+passwordHash')
    },
    name: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

// Method to verify candidate password against stored bcrypt hash
ownerSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static helper to hash a raw password using bcrypt
ownerSchema.statics.hashPassword = async function (rawPassword) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(rawPassword, salt);
};

const Owner = mongoose.model('Owner', ownerSchema);

module.exports = Owner;
