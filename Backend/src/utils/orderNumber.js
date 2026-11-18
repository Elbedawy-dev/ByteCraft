const Counter = require('../models/Counter');

/**
 * Atomic Order Number Generator
 * 
 * WHY:
 * 1. Format: `BC-YYYY-000123` (e.g., BC-2026-000001).
 * 2. Uniqueness & Reset: Counters are scoped annually (`order_counter_${year}`).
 * 3. Atomicity: Uses MongoDB `findOneAndUpdate` with `$inc: { seq: 1 }` and `upsert: true`.
 * 4. Transaction Awareness: Supports passing a Mongoose `session` if running within an ACID transaction.
 * 
 * @param {object} [options]
 * @param {import('mongoose').ClientSession} [options.session]
 * @returns {Promise<string>} e.g. "BC-2026-000001"
 */
async function generateOrderNumber(options = {}) {
  const currentYear = new Date().getFullYear();
  const counterKey = `order_counter_${currentYear}`;

  const queryOptions = {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  };

  if (options.session) {
    queryOptions.session = options.session;
  }

  const counter = await Counter.findOneAndUpdate(
    { key: counterKey },
    { $inc: { seq: 1 } },
    queryOptions
  );

  const sequentialString = String(counter.seq).padStart(6, '0');
  return `BC-${currentYear}-${sequentialString}`;
}

module.exports = {
  generateOrderNumber,
};
