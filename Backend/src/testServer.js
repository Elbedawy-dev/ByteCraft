const path = require('path');
const dotenv = require('dotenv');

/**
 * Test Server Launcher
 * 
 * WHY:
 * 1. Enforces strict isolation: runs on port 5001 and redirects the database connection
 *    to `bytecraft_test` rather than the production/development database `ByteCraft`.
 * 2. Works seamlessly cross-platform on Windows, macOS, and Linux without bash-only scripts.
 */

// 1. Preload environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 2. Force test port 5001
process.env.PORT = '5001';

// 3. Override MONGODB_URI to target bytecraft_test database
if (process.env.MONGODB_URI) {
  let uri = process.env.MONGODB_URI.trim();
  if (uri.includes('.mongodb.net/')) {
    uri = uri.replace(/\.mongodb\.net\/([^?]+)/, '.mongodb.net/bytecraft_test');
  } else {
    uri = uri.replace(/\/([^/?]+)(\?|$)/, '/bytecraft_test$2');
  }
  process.env.MONGODB_URI = uri;
}

console.log('🧪 Starting Nexus Test Server on port 5001...');
console.log(`🧪 Test Database Target: bytecraft_test`);

// 4. Delegate to standard server entrypoint
require('./server');
