const app = require('../src/app');
const { connectDB } = require('../src/config/db');

/**
 * Vercel Serverless Function Handler
 * 
 * WHY:
 * 1. Exports the Express application as the entrypoint for Vercel Serverless Functions.
 * 2. Ensures the cached Mongoose connection is ready before delegating request handling.
 * 3. Never calls process.exit; returns a clean JSON 503 if the database is unreachable.
 */
module.exports = async (req, res) => {
  try {
    await connectDB({ exitOnError: false });
  } catch (error) {
    console.error('❌ Serverless Database Connection Failure:', error.message);
    return res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Database connection failed. Please try again shortly.',
        details: [],
      },
    });
  }

  return app(req, res);
};
