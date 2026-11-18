const mongoose = require('mongoose');

/**
 * Coupon Model
 * 
 * WHY:
 * 1. Promotional discount codes applied during guest checkout.
 * 2. `code` is stored in uppercase and trimmed to eliminate case sensitivity issues.
 * 3. Supports two types:
 *    - 'percent': value is 1 to 100
 *    - 'fixed': value is integer piasters
 * 4. `appliesToProjects`: empty array means applicable to all projects; if populated, restricts
 *    usage exclusively to those project ObjectIds.
 */

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Coupon type is required'],
      enum: ['percent', 'fixed'],
    },
    value: {
      type: Number,
      required: [true, 'Coupon value is required'],
      min: [1, 'Coupon value must be greater than 0'],
      validate: {
        validator(val) {
          if (this.type === 'percent') {
            return Number.isInteger(val) && val >= 1 && val <= 100;
          }
          return Number.isInteger(val) && val > 0;
        },
        message: 'Percent coupon value must be an integer between 1 and 100; fixed value must be positive integer piasters.',
      },
    },
    maxUses: {
      type: Number,
      default: null, // null represents unlimited uses
      validate: {
        validator(val) {
          return val === null || (Number.isInteger(val) && val > 0);
        },
        message: 'maxUses must be null (unlimited) or a positive integer.',
      },
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    appliesToProjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
