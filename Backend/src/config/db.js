const mongoose = require('mongoose');
const env = require('./env');

/**
 * MongoDB Connection Handler
 * 
 * WHY:
 * 1. Encapsulates Mongoose database connection lifecycle, event logging,
 *    and clean disconnection utilities for graceful server shutdowns.
 * 2. Caches connection on globalThis for serverless environments (Vercel) to reuse
 *    the active database connection across warm function invocations.
 * 3. Never calls process.exit when running on Vercel or when exitOnError is false.
 * 4. In test mode (PORT 5001), falls back to local test DB if Atlas IP is not whitelisted.
 */

let cached = globalThis.__mongooseCached;
if (!cached) {
  cached = globalThis.__mongooseCached = { conn: null, promise: null };
}

async function connectDB(options = {}) {
  // If already connected, reuse existing active connection
  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose;
    return mongoose;
  }

  if (cached.conn && cached.conn.connection && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  const isTestServer = String(process.env.PORT) === '5001';

  if (!cached.promise) {
    const opts = {
      autoIndex: env.NODE_ENV !== 'production',
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    };

    cached.promise = mongoose
      .connect(env.MONGODB_URI, opts)
      .then((conn) => {
        console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
        cached.conn = conn;
        return conn;
      })
      .catch(async (error) => {
        cached.promise = null;
        cached.conn = null;

        // Strict Test Fallback: ONLY permitted for test server (PORT 5001) targeting bytecraft_test
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
          console.warn('⚠️  CRITICAL: This fallback is strictly DISABLED for the main Nexus database.');
          console.warn('*******************************************************************************\n');
          try {
            const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/bytecraft_test', {
              autoIndex: true,
            });
            console.log(`✅ MongoDB Connected (Local Test DB): ${localConn.connection.host}/${localConn.connection.name}`);
            cached.conn = localConn;
            return localConn;
          } catch (localErr) {
            console.error(`❌ Local MongoDB Test DB Error: ${localErr.message}`);
          }
        }

        console.error(`❌ MongoDB Connection Error: ${error.message}`);

        // In serverless (Vercel) or when exitOnError is false, throw error so handler can return 503
        const isServerless = Boolean(process.env.VERCEL) || options.exitOnError === false;
        if (!isServerless && !isTestServer) {
          process.exit(1);
        }

        throw error;
      });
  }

  try {
    const conn = await cached.promise;
    return conn;
  } catch (err) {
    cached.promise = null;
    cached.conn = null;
    throw err;
  }
}

async function disconnectDB() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(false);
      console.log('🔌 MongoDB connection closed gracefully.');
    }
    cached.conn = null;
    cached.promise = null;
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
