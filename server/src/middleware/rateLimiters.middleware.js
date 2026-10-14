const { rateLimit } = require('express-rate-limit');
const { ERROR_CODES } = require('../config/constants');

/**
 * Rate Limiting Middleware
 * 
 * WHY:
 * 1. Global Limiter: Prevents DDoS or brute-force scraping against general API routes.
 * 2. Login Limiter: Strictly restricts password guessing attempts against the Owner login
 *    (5 attempts per 15 minutes per IP address).
 * 3. Standard Envelope: If a limit is exceeded, responds with the unified error format
 *    instead of express-rate-limit's default plain text.
 */

// Helper to create uniform rate-limit responses
function createRateLimitHandler(message) {
  return (req, res /* , next, options */) => {
    res.status(429).json({
      success: false,
      error: {
        code: ERROR_CODES.TOO_MANY_REQUESTS,
        message,
        details: [],
      },
    });
  };
}

// General API rate limiter (15 minutes, 200 requests per IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many requests from this IP, please try again after 15 minutes.'),
});

// Strict limiter for Owner Login (15 minutes, 5 attempts per IP)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only failed/repeated attempts count towards lockout
  handler: createRateLimitHandler('Too many login attempts. Please try again after 15 minutes.'),
});

module.exports = {
  globalLimiter,
  loginLimiter,
};
