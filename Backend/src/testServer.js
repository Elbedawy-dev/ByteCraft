const path = require('path');
const dotenv = require('dotenv');

/**
 * Test Server Launcher
 * 
 * WHY:
 * 1. Enforces strict isolation: runs on port 5001 and redirects the database connection
 *    to `bytecraft_test` rather than the production database `nexus`.
 * 2. Works seamlessly cross-platform on Windows, macOS, and Linux without bash-only scripts.
 * 3. Includes local Vite dev/preview origins in CLIENT_URL so CSRF Origin checks pass in E2E runs.
 */

// 1. Preload environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 2. Force test port 5001
process.env.PORT = '5001';

// 2b. Ensure local Vite dev & preview origins are allowed on the isolated test server
const localTestOrigins = [
  'http://localhost:5173',
  'http://localhost:5171',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:5173',
];
const configuredOrigins = String(process.env.CLIENT_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
process.env.CLIENT_URL = Array.from(new Set([...configuredOrigins, ...localTestOrigins])).join(',');

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
