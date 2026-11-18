/**
 * Async Route Handler Wrapper
 * 
 * WHY:
 * In Express 4.x, rejected promises inside async route handlers or middleware
 * are NOT automatically passed to the next(err) error-handling middleware.
 * Wrapping async controllers with this helper catches any thrown exceptions or
 * rejections and forwards them to next(err) without repetitive try/catch blocks.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
