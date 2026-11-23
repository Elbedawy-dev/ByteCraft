const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
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
 * 4. Real Client IP Extraction: Correctly extracts the client IP address according to Express
 *    `trust proxy` settings, supporting multi-hop proxy chains (e.g. Browser -> Vercel FE -> Vercel BE).
 */

// Helper to determine the real client IP
function getClientIp(req) {
  if (
    process.env.NODE_ENV !== 'production' &&
    String(process.env.PORT) === '5001' &&
    req.headers['x-test-ip']
  ) {
    return String(req.headers['x-test-ip']);
  }
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
}

function clientIpKeyGenerator(req) {
  return ipKeyGenerator(getClientIp(req));
}

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
  keyGenerator: clientIpKeyGenerator,
  validate: { trustProxy: false },
  handler: createRateLimitHandler('Too many requests from this IP, please try again after 15 minutes.'),
});

// Strict limiter for Owner Login (15 minutes, 5 attempts per IP)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only failed/repeated attempts count towards lockout
  keyGenerator: clientIpKeyGenerator,
  validate: { trustProxy: false },
  handler: createRateLimitHandler('Too many login attempts. Please try again after 15 minutes.'),
});

// Rate limiter for Project preview view increments (15 minutes, 60 requests per IP)
const previewViewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: clientIpKeyGenerator,
  validate: { trustProxy: false },
  handler: createRateLimitHandler('Too many preview view requests from this IP.'),
});

// Strict limiter for public coupon validation to prevent code guessing / brute-forcing (15 minutes, 30 requests per IP)
const couponValidateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: clientIpKeyGenerator,
  validate: { trustProxy: false },
  handler: createRateLimitHandler('Too many coupon validation attempts. Please try again after 15 minutes.'),
});

// Rate limiter for Order creation (1 hour, 15 orders per IP)
const orderCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: clientIpKeyGenerator,
  validate: { trustProxy: false },
  handler: createRateLimitHandler('Too many order creation attempts from this IP. Please try again after an hour.'),
});

// Rate limiter for Payment Proof uploads (15 minutes, 10 uploads per IP)
const proofUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: clientIpKeyGenerator,
  validate: { trustProxy: false },
  handler: createRateLimitHandler('Too many payment proof upload attempts from this IP.'),
});

// Rate limiter for Contact Inquiries (15 minutes, 5 inquiries per IP)
const inquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: clientIpKeyGenerator,
  validate: { trustProxy: false },
  handler: createRateLimitHandler('Too many contact inquiries from this IP. Please try again after 15 minutes.'),
});

// Rate limiter for Reviews (15 minutes, 10 reviews per IP)
const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: clientIpKeyGenerator,
  validate: { trustProxy: false },
  handler: createRateLimitHandler('Too many review submissions from this IP.'),
});

// Rate limiter for token guessing on public order & review endpoints (15 minutes, 20 failed requests per IP)
const tokenGuessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Legitimate requests with valid tokens do not count towards lockout
  keyGenerator: clientIpKeyGenerator,
  validate: { trustProxy: false },
  handler: createRateLimitHandler('Too many access attempts. Please try again after 15 minutes.'),
});

module.exports = {
  globalLimiter,
  loginLimiter,
  previewViewLimiter,
  couponValidateLimiter,
  orderCreateLimiter,
  proofUploadLimiter,
  inquiryLimiter,
  reviewLimiter,
  tokenGuessLimiter,
};
