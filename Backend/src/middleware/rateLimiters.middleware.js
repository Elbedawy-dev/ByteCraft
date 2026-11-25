const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { ERROR_CODES } = require('../config/constants');

/**
 * Rate Limiting Middleware
 *
 * Uses unified JSON error envelope (`429 TOO_MANY_REQUESTS`) and supports
 * `X-Test-IP` header strictly on the local test server (non-production, PORT 5001)
 * so integration test suites can isolate rate-limit buckets cleanly.
 */

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

// Login limiter (15 minutes, 10 failed attempts per IP)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: clientIpKeyGenerator,
  validate: { trustProxy: false },
  handler: createRateLimitHandler('Too many login attempts. Please try again after 15 minutes.'),
});

// Registration limiter (1 hour, 5 registrations per IP)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: clientIpKeyGenerator,
  validate: { trustProxy: false },
  handler: createRateLimitHandler('Too many registration attempts from this IP. Please try again after an hour.'),
});

// Forgot-password IP limiter (1 hour, 3 requests per IP)
const forgotPasswordIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: clientIpKeyGenerator,
  validate: { trustProxy: false },
  handler: createRateLimitHandler('Too many password reset requests from this IP. Please try again after an hour.'),
});

// Forgot-password per-email limiter (1 hour, 3 requests per normalized email)
const forgotPasswordEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = req.body && typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    return email ? `email:${email}` : clientIpKeyGenerator(req);
  },
  validate: { trustProxy: false, keyGeneratorIpFallback: false },
  handler: createRateLimitHandler('Too many password reset requests for this email. Please try again after an hour.'),
});

// Resend-verification limiter (1 hour, 3 requests per IP)
const resendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: clientIpKeyGenerator,
  validate: { trustProxy: false },
  handler: createRateLimitHandler('Too many verification email requests. Please try again after an hour.'),
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

// Strict limiter for public coupon validation (15 minutes, 30 requests per IP)
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
  skipSuccessfulRequests: true,
  keyGenerator: clientIpKeyGenerator,
  validate: { trustProxy: false },
  handler: createRateLimitHandler('Too many access attempts. Please try again after 15 minutes.'),
});

module.exports = {
  globalLimiter,
  loginLimiter,
  registerLimiter,
  forgotPasswordIpLimiter,
  forgotPasswordEmailLimiter,
  resendVerificationLimiter,
  previewViewLimiter,
  couponValidateLimiter,
  orderCreateLimiter,
  proofUploadLimiter,
  inquiryLimiter,
  reviewLimiter,
  tokenGuessLimiter,
};
