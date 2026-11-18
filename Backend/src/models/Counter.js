const mongoose = require('mongoose');

/**
 * Counter Model
 * 
 * WHY:
 * 1. Concurrency Safety: Multiple concurrent checkout requests must never generate
 *    duplicate order numbers.
 * 2. MongoDB Atomic Increments: MongoDB's `findOneAndUpdate` with `$inc` is atomic and isolated,
 *    guaranteeing unique, strictly sequential order numbers even under high concurrency.
 */

const counterSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter;
