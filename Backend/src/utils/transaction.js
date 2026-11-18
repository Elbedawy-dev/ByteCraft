const mongoose = require('mongoose');

/**
 * Transaction & Compensating Rollback Utility
 * 
 * WHY:
 * 1. ACID Guarantees on Replica Sets: When running against MongoDB Atlas or any replica set,
 *    order creation and coupon `usedCount` increment execute inside a single MongoDB transaction.
 *    If an error occurs, MongoDB automatically rolls back all changes atomically.
 * 2. Standalone / Local Fallback Compatibility: Default local MongoDB instances run as standalone
 *    servers (`type === 'Single'`) which do not support multi-document transactions.
 *    In that mode, this runner detects standalone mode and executes a compensating rollback
 *    (e.g., decrementing coupon usedCount) if order creation fails, ensuring consistency across environments.
 */

function isTransactionSupported() {
  try {
    const client = mongoose.connection.getClient();
    const topologyType = client?.topology?.description?.type;
    // Transactions require ReplicaSetWithPrimary or Sharded. 'Single' does not support them.
    return topologyType === 'ReplicaSetWithPrimary' || topologyType === 'Sharded';
  } catch (err) {
    return false;
  }
}

/**
 * Runs a block of work inside a transaction if supported, or with compensating rollback if standalone.
 * 
 * @param {Function} workFn - async ({ session }) => any
 * @param {Function} [compensateFn] - async (error) => void
 * @returns {Promise<any>}
 */
async function runWithTransaction(workFn, compensateFn) {
  if (isTransactionSupported()) {
    const session = await mongoose.startSession();
    try {
      let result;
      await session.withTransaction(async () => {
        result = await workFn({ session });
      });
      return result;
    } finally {
      await session.endSession();
    }
  } else {
    // Standalone deployment fallback (e.g., local MongoDB bytecraft_test):
    // Execute without session, and if work fails, run compensating rollback
    try {
      return await workFn({ session: null });
    } catch (workErr) {
      if (typeof compensateFn === 'function') {
        try {
          await compensateFn(workErr);
        } catch (compensateErr) {
          console.error('❌ Compensating rollback failed:', compensateErr.message);
        }
      }
      throw workErr;
    }
  }
}

module.exports = {
  isTransactionSupported,
  runWithTransaction,
};
