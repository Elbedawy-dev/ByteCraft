const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const env = require('./config/env');
const routes = require('./routes');
const notFound = require('./middleware/notFound.middleware');
const errorHandler = require('./middleware/errorHandler.middleware');
const sanitizeInput = require('./middleware/sanitize.middleware');
const csrfProtection = require('./middleware/csrf.middleware');
const { globalLimiter } = require('./middleware/rateLimiters.middleware');

/**
 * Express Application Configuration
 * 
 * WHY:
 * Assembles security middlewares, parsers, logging, routes, and error handling
 * in the strict, correct execution order.
 */

const app = express();

// 1. Trust proxy configuration (supports number of reverse proxy hops; default 1)
if (env.TRUST_PROXY > 0) {
  app.set('trust proxy', env.TRUST_PROXY);
} else {
  app.set('trust proxy', false);
}

// 2. HTTP Security Headers with Helmet
app.use(helmet());

// 3. Strict CORS Configuration
// Supports multiple comma-separated origins with exact matching
const allowedOrigins = env.CLIENT_URL.split(',')
  .map((url) => url.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    credentials: true, // Allows sending HTTP-only cookies cross-origin
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Test-IP'],
  })
);

// 4. Global Rate Limiter
app.use('/api', globalLimiter);

// 5. Body Parsers with size limits (100kb to mitigate payload flooding)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// 6. Cookie Parser for reading the `bc_owner` HTTP-only auth token
app.use(cookieParser());

// 7. HTTP Request Logger
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// 8. Custom Security Middlewares
app.use(sanitizeInput); // NoSQL injection protection (scrubs $ and . keys)
app.use('/api', csrfProtection); // Enforces Content-Type on mutating requests

// 9. Static uploads directory for local development fallback
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// 10. API Routes
app.use('/api', routes);

// 11. 404 Route Catch-all
app.use(notFound);

// 12. Centralized Error Handler (Unified JSON Envelope)
app.use(errorHandler);

module.exports = app;
