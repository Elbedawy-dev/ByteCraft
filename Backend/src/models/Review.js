const mongoose = require('mongoose');

/**
 * Review Model
 * 
 * WHY:
 * 1. Verified Buyer Feedback: Only buyers with a paid or delivered order can post a review.
 * 2. Uniqueness: Strictly enforced one review per order (unique index on `order`).
 * 3. Moderation: Owner can toggle `isPublished` to hide spam or offensive reviews,
 *    and attach a public `ownerResponse`.
 * 4. Project Rating Sync: Project average rating and review count are updated on publish/moderation.
 */

const reviewSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true, // One review per order
    },
    orderNumber: {
      type: String,
      required: true,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 2000,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    ownerResponse: {
      type: String,
      trim: true,
      default: '',
    },
    moderatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ project: 1, isPublished: 1, createdAt: -1 });
reviewSchema.index({ isPublished: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
