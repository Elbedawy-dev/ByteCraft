/**
 * NoSQL Injection Sanitizer Middleware
 * 
 * WHY:
 * MongoDB interprets object keys beginning with `$` (such as `$gt`, `$ne`, `$regex`)
 * or containing dots (`.`) as operators or field paths. Malicious clients can inject
 * these operators in JSON payloads to bypass queries or extract private data.
 * This middleware recursively scrubs any keys starting with `$` or containing `.`
 * without breaking Express 4 request objects.
 */

function sanitizeObject(target) {
  if (!target || typeof target !== 'object') {
    return target;
  }

  if (Array.isArray(target)) {
    return target.map(sanitizeObject);
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(target)) {
    // Drop keys starting with '$' or containing '.'
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }

    if (value !== null && typeof value === 'object') {
      cleaned[key] = sanitizeObject(value);
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  next();
}

module.exports = sanitizeInput;
