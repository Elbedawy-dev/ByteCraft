const mongoose = require('mongoose');
const env = require('./env');

/**
 * MongoDB Connection Handler
 * 
 * WHY: 
 * Encapsulates Mongoose database connection lifecycle, event logging,
 * and clean disconnection utilities for graceful server shutdowns.
 */

async function connectDB() {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: env.NODE_ENV !== 'production', // Build indexes automatically in dev; disable in large production
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
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
