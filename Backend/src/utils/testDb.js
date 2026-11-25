const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

/**
 * CLI Test Database Isolation Helper
 *
 * Ensures maintenance/seed/migration scripts invoked with `--test`
 * strictly target `bytecraft_test` and refuse to run against any other database.
 */

function rewriteUriToTestDb(rawUri) {
  const uri = (rawUri || 'mongodb://127.0.0.1:27017/bytecraft_test').trim();
  if (uri.includes('.mongodb.net/')) {
    return uri.replace(/\.mongodb\.net\/([^?]*)/, '.mongodb.net/bytecraft_test');
  }
  return uri.replace(/\/([^/?]*)(\?|$)/, '/bytecraft_test$2');
}

function applyTestDatabaseEnvIfFlagged(argv = process.argv) {
  const isTestMode = argv.includes('--test');
  if (isTestMode) {
    dotenv.config({ path: path.resolve(__dirname, '../../.env') });
    process.env.PORT = '5001';
    process.env.MONGODB_URI = rewriteUriToTestDb(process.env.MONGODB_URI);
  }
  return isTestMode;
}

function assertTestDatabaseIfFlagged(isTestMode) {
  if (isTestMode && mongoose.connection.name !== 'bytecraft_test') {
    throw new Error(
      `Refusing to run --test script on database "${mongoose.connection.name}" (expected "bytecraft_test").`
    );
  }
}

module.exports = {
  rewriteUriToTestDb,
  applyTestDatabaseEnvIfFlagged,
  assertTestDatabaseIfFlagged,
};
