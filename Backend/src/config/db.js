const mongoose = require('mongoose');
const env = require('./env');

/**
 * MongoDB Connection Handler
 * 
 * WHY:
 * Encapsulates Mongoose database connection lifecycle, event logging,
 * and clean disconnection utilities for graceful server shutdowns.
 * In test mode (PORT 5001), falls back to local test DB if Atlas IP is not whitelisted.
 */

async function connectDB() {
  try {
    const isTestServer = String(process.env.PORT) === '5001';
    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: env.NODE_ENV !== 'production',
      serverSelectionTimeoutMS: isTestServer ? 2000 : 5000, // Fail fast in test mode (2s)
      connectTimeoutMS: isTestServer ? 2000 : 5000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    // Strict Test Fallback:
    // Automatic local fallback is ONLY permitted for the test server (PORT 5001) targeting bytecraft_test.
    // It parses the exact database name from the URI and will NEVER activate for the main ByteCraft database or any other DB.
    const isTestServer = String(process.env.PORT) === '5001';
    let exactDbName = '';
    try {
      const normalizedUri = env.MONGODB_URI.replace(/^mongodb(?:\+srv)?:\/\//, 'http://');
      const parsedUrl = new URL(normalizedUri);
      exactDbName = parsedUrl.pathname.replace(/^\//, '').split('?')[0].trim();
    } catch {
      exactDbName = '';
    }

    const isExactTestDb = exactDbName === 'bytecraft_test';

    if (isTestServer && isExactTestDb && !env.MONGODB_URI.includes('127.0.0.1')) {
      console.warn('\n*******************************************************************************');
      console.warn(`⚠️  WARNING: Cloud MongoDB Atlas connection failed (${error.message})`);
      console.warn('⚠️  AUTOMATIC LOCAL FALLBACK IS ACTIVE FOR TEST DATABASE ONLY:');
      console.warn('⚠️  Target: mongodb://127.0.0.1:27017/bytecraft_test');
      console.warn('⚠️  CRITICAL: This fallback is strictly DISABLED for the main ByteCraft database.');
      console.warn('*******************************************************************************\n');
      try {
        const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/bytecraft_test', {
          autoIndex: true,
        });
        console.log(`✅ MongoDB Connected (Local Test DB): ${localConn.connection.host}/${localConn.connection.name}`);
        return localConn;
      } catch (localErr) {
        console.error(`❌ Local MongoDB Test DB Error: ${localErr.message}`);
      }
    }

    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
}

async function disconnectDB() {
  try {
    await mongoose.connection.close(false);
    console.log('🔌 MongoDB connection closed gracefully.');
  } catch (error) {
    console.error(`❌ Error during MongoDB disconnection: ${error.message}`);
  }
}

// Connection event listeners for runtime monitoring
mongoose.connection.on('error', (err) => {
  console.error(`⚠️ MongoDB runtime error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected from server');
});

module.exports = {
  connectDB,
  disconnectDB,
};
