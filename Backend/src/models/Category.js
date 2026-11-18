const mongoose = require('mongoose');

/**
 * Category Model
 * 
 * WHY:
 * 1. Groups projects into logical domains (e.g. ecommerce, education, portfolio).
 * 2. Uses a clean unique `key` slug for human-friendly URLs and filtering queries.
 * 3. Bilingual `name { ar, en }` supports both Arabic and English visitors.
 */

const bilingualStringSchema = new mongoose.Schema(
  {
    ar: { type: String, required: [true, 'Arabic category name is required'], trim: true },
    en: { type: String, required: [true, 'English category name is required'], trim: true },
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'Category key (slug) is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: bilingualStringSchema,
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
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

// Indexes
categorySchema.index({ order: 1, createdAt: 1 });
categorySchema.index({ isActive: 1 });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
