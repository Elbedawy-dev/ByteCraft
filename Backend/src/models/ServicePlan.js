const mongoose = require('mongoose');

/**
 * ServicePlan Model
 * 
 * WHY:
 * 1. Represents custom software build tiers shown on the Pricing page (e.g. LMS, E-Commerce, Custom).
 * 2. Prices are stored in integer piasters (`startingPrice`) to ensure monetary precision.
 * 3. These plans are informational and lead directly to the project inquiry form rather than instant checkout.
 */

const bilingualStringSchema = new mongoose.Schema(
  {
    ar: { type: String, required: true, trim: true },
    en: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const servicePlanSchema = new mongoose.Schema(
  {
    group: {
      type: String,
      required: [true, 'Plan group is required (e.g. lms, ecommerce, custom)'],
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: bilingualStringSchema,
      required: true,
    },
    description: {
      type: bilingualStringSchema,
      required: true,
    },
    startingPrice: {
      type: Number,
      required: [true, 'Starting price in piasters is required'],
      min: [0, 'Starting price must be a non-negative integer in piasters'],
    },
    features: [
      {
        type: bilingualStringSchema,
      },
    ],
    deliveryDays: {
      type: Number,
      required: [true, 'Estimated delivery days is required'],
      min: [1, 'Delivery days must be at least 1'],
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
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

servicePlanSchema.index({ group: 1, sortOrder: 1, createdAt: 1 });

const ServicePlan = mongoose.model('ServicePlan', servicePlanSchema);

module.exports = ServicePlan;
