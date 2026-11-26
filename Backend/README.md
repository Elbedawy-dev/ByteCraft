# Nexus — Backend API Server

Production-ready, hardened Node.js & Express RESTful API backend for **Nexus** — deployable both as a standard Node server (`src/server.js`) and as a **Vercel Serverless Function** (`api/index.js`).

---

## Architecture Overview

- **Runtime**: Node.js v18+ LTS (v20+ / v22+ recommended)
- **Framework**: Express.js 4 (modular routing, layered controllers/services/validators)
- **Database**: MongoDB + Mongoose 8 (strict schemas, indexed queries, serverless cached connection in `src/config/db.js`)
- **Unified Authentication (`bc_session`)**: Single `User` collection (`role: 'customer' | 'admin'`) backed by signed JWTs in an `httpOnly` cookie (`bc_session`) carrying `{ sub, role, tv }`. Token version (`tv`) enables instant session revocation on password reset, password change, or account disable. In production (`NODE_ENV=production`), `Authorization: Bearer` fallbacks are disabled. Legacy `/api/owner/{login,me,password,logout}` routes remain as thin deprecated aliases (`Deprecation: true`).
- **Guest & Account Checkout**: Customers can buy as guests (receiving a one-time 256-bit `publicToken` stored only as a SHA-256 hash with `select: false`) or while signed in (orders auto-linked to `Order.user` and accessible in `/account/orders` without a token; verified customers can also claim earlier guest orders by email).
- **Financial Arithmetic**: Tax-free EGP billing stored as integer **piasters** (`1 EGP = 100 piasters`), eliminating floating-point drift.
- **Online & Manual Payments**: Manual `vodafone_cash` & `instapay` transfers with receipt upload (magic-byte validated for JPEG/PNG/WebP/PDF, max 4 MB) and admin review work standalone without any Paymob keys. Optional **Paymob Accept** integration (`card` iframe/redirect + `fawry` Kiosk reference) uses canonical 20-field HMAC-SHA512 webhook verification and idempotent state transitions. Paymob uses an all-or-nothing config rule: leave all `PAYMOB_*` unset to keep `card` and `fawry` automatically disabled/hidden (and webhooks returning `401`), or set all 4 core keys (`PAYMOB_API_KEY`, `PAYMOB_HMAC_SECRET`, `PAYMOB_CARD_INTEGRATION_ID`, `PAYMOB_IFRAME_ID`) plus optional `PAYMOB_FAWRY_INTEGRATION_ID`.
- **Automated Delivery & Cron**: Optional GitHub read-only collaborator invite upon confirmed payment (`AUTO_GITHUB_INVITE=true`) and daily abandoned-order expiry via Vercel Cron (`GET /api/cron/expire-orders` secured by constant-time `CRON_SECRET` Bearer comparison; also runs via `setInterval` in long-running server mode).

---

## Prerequisites & Getting Started

### 1. Install Dependencies
```powershell
cd Backend
npm install
```

### 2. Configure Environment Variables
```powershell
Copy-Item .env.example .env
```
Populate `Backend/.env` using the reference table below (never commit `.env` or real secrets).

### 3. Database Indexes, Migration & Seeding
```powershell
# Synchronize Mongoose indexes
npm run db:indexes

# (Optional — only when upgrading an older database with a legacy `owners` collection)
npm run migrate:owner-to-user -- --dry-run
npm run migrate:owner-to-user

# Seed initial admin user from OWNER_NAME, OWNER_EMAIL, OWNER_PASSWORD
npm run seed:owner

# Seed singleton Settings document
npm run seed:settings

# Idempotent partial updaters on existing databases:
npm run seed:contact   # Updates contact info only
npm run seed:brand     # Updates Settings.siteName to "Nexus" only
```

### 4. Running Locally & Testing
```powershell
# Development server with nodemon on PORT (default 5000)
npm run dev

# Isolated test server on port 5001 targeting bytecraft_test ONLY
npm run dev:test

# Full automated test suite (Phases 1–10 + Vercel Serverless & Multi-Hop Proxy suite)
npm test

# Production start (long-running Node server)
npm start
```

---

## NPM Scripts

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `nodemon src/server.js` | Development server on `PORT` (default `5000`) |
| `npm run dev:test` | `node src/testServer.js` | Isolated test server on port `5001` targeting `bytecraft_test` |
| `npm test` | `node tests/run-all.js` | Runs Phases 1–10 + `vercel-serverless.test.js` against `bytecraft_test` |
| `npm run db:indexes` | `node src/scripts/syncIndexes.js` | Synchronizes all Mongoose collection indexes |
| `npm run migrate:owner-to-user` | `node src/scripts/migrateOwnerToUser.js` | Idempotently migrates legacy `owners` doc to `users` (`role: 'admin'`) |
| `npm run seed:owner` | `node src/seed/seedOwner.js` | Seeds or updates the initial admin account from `.env` |
| `npm run seed:settings` | `node src/seed/seedSettings.js` | Seeds singleton tax-free platform settings |
| `npm run seed:contact` | `node src/seed/seedContact.js` | Idempotently updates contact fields in `Settings` |
| `npm run seed:brand` | `node src/seed/seedBrand.js` | Idempotently sets `Settings.siteName = "Nexus"` |
| `npm start` | `node src/server.js` | Production HTTP server with graceful shutdown |

---

## Environment Variables Reference

| Variable | Required | Default | Example | Description |
|---|---|---|---|---|
| `NODE_ENV` | Yes | `development` | `production` | Runtime environment (`development`, `production`, `test`) |
| `PORT` | No | `5000` | `5000` | HTTP port for `src/server.js` (ignored on Vercel) |
| `CLIENT_URL` | Yes | — | `https://nexusbytes.vercel.app` | Comma-separated allowed frontend origin(s) for CORS & CSRF `Origin` checks (use `https://` in production) |
| `MONGODB_URI` | Yes | — | `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/nexus` | MongoDB connection string (production database: `nexus`, case-sensitive) |
| `JWT_SECRET` | Yes | — | `<64-char-hex>` | Secret for signing `bc_session` JWTs (min 32 chars) |
| `JWT_EXPIRES_IN` | No | `7d` | `7d` | Lifetime of `bc_session` JWT and cookie |
| `COOKIE_SAMESITE` | No | `lax` | `lax` or `none` | Cookie `SameSite` policy (`lax` when using Vercel `/api/*` rewrite; `none` for cross-site) |
| `TRUST_PROXY` | No | `false` | `2` (Vercel FE→BE) or `1` | Express `trust proxy` hop count for accurate client IP rate limiting |
| `CRON_SECRET` | Yes (prod) | — | `<64-char-hex>` | Bearer secret protecting `GET /api/cron/expire-orders` |
| `OWNER_NAME` | No | `Nexus Owner` | `Admin Name` | Initial admin display name for `seedOwner.js` |
| `OWNER_EMAIL` | Yes | — | `admin@yourdomain.com` | Initial admin email & default owner notification address |
| `OWNER_PASSWORD` | Yes (seed) | — | `<strong-password>` | Initial admin password used by `seedOwner.js` |
| `CLOUDINARY_CLOUD_NAME` | Yes (prod) | — | `your_cloud_name` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes (prod) | — | `your_api_key` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes (prod) | — | `your_api_secret` | Cloudinary API secret |
| `SMTP_HOST` | No | — | `smtp-relay.brevo.com` | SMTP server host |
| `SMTP_PORT` | No | `587` | `587` or `465` | SMTP server port |
| `SMTP_USER` | No | — | `your_smtp_user` | SMTP username |
| `SMTP_PASS` | No | — | `your_smtp_password` | SMTP password / API key |
| `MAIL_FROM` | No | — | `"Nexus <noreply@yourdomain.com>"` | Outgoing `From:` header (bare email inherits `Settings.siteName`) |
| `OWNER_NOTIFY_EMAIL` | No | `OWNER_EMAIL` | `alerts@yourdomain.com` | Optional override for admin email notifications |
| `PAYMOB_MODE` | No (optional) | `sandbox` | `live` | Optional Paymob mode (`sandbox` or `live`); `vodafone_cash` and `instapay` work without Paymob |
| `PAYMOB_API_KEY` | No (all-or-nothing) | — | `your_paymob_api_key` | Optional Paymob Accept API key (must be set together with HMAC secret, Card ID, and Iframe ID) |
| `PAYMOB_HMAC_SECRET` | No (all-or-nothing) | — | `your_paymob_hmac_secret` | Optional Paymob HMAC-SHA512 secret (webhooks always return `401` when empty) |
| `PAYMOB_CARD_INTEGRATION_ID` | No (all-or-nothing) | — | `400000` | Optional Paymob Card integration ID |
| `PAYMOB_IFRAME_ID` | No (all-or-nothing) | — | `800000` | Optional Paymob Card iframe ID |
| `PAYMOB_FAWRY_INTEGRATION_ID` | No (optional) | — | `400001` | Optional Paymob Fawry integration ID (requires the 4 core keys above to enable Fawry) |
| `AUTO_GITHUB_INVITE` | No | `false` | `false` | Automatically invite customer GitHub handle on confirmed payment |
| `GITHUB_TOKEN` | If invite=true | — | `ghp_...` | GitHub PAT with repository collaborator invite permission |

---

## Directory Structure

```text
Backend/
├── api/
│   └── index.js                 # Vercel Serverless Function handler (lazy DB connect + Express app)
├── vercel.json                  # Vercel rewrites, 30s function timeout, daily Cron schedule
├── public/uploads/              # Local dev upload fallback (gitignored; disabled in production)
├── src/
│   ├── config/                  # constants.js, db.js, env.js (Zod), cloudinary.js
│   ├── controllers/             # auth, account, adminUsers, category, project, servicePlan, coupon, order, payment, inquiry, review, meta, stats, cron
│   ├── middleware/              # auth (requireAuth/requireRole/authOptional), csrf, errorHandler, notFound, rateLimiters, sanitize, upload (4 MB + magic bytes), validate
│   ├── models/                  # User, Settings, Category, Project, ServicePlan, Coupon, Order, Inquiry, Review, Counter
│   ├── routes/                  # index, health, cron, public, auth, account, owner
│   ├── scripts/                 # syncIndexes.js, migrateOwnerToUser.js
│   ├── seed/                    # seedOwner.js, seedSettings.js, seedContact.js, seedBrand.js
│   ├── services/                # auth, order, pricing, project, review, stats, settings, upload, email, github, payments/paymob
│   ├── utils/                   # AppError, asyncHandler, money, orderNumber, password, sanitize, slug, testDb, transaction
│   ├── validators/              # Zod request schemas
│   ├── app.js                   # Express app composition
│   ├── server.js                # Long-running Node listener + interval expiry + graceful shutdown
│   └── testServer.js            # Isolated test server (port 5001, bytecraft_test)
├── tests/
│   ├── phase1.test.js .. phase10.test.js
│   ├── vercel-serverless.test.js # Direct api/index.js HTTP, 4 MB boundary, CRON_SECRET, 2-hop proxy IP test
│   └── run-all.js               # Master suite runner (`npm test`)
└── package.json
```

---

## Security & Hardening Summary

| Feature | Implementation |
|---|---|
| HTTP Headers | `helmet()` security headers |
| CORS & CSRF | Exact origin allow-list from `CLIENT_URL` (`credentials: true`) + Origin & Content-Type (`application/json` / `multipart/form-data`) verification on mutating requests |
| Auth & Lockout | `httpOnly` `bc_session` JWT cookie, bcrypt (12 rounds), dummy compare anti-enumeration, 5-failure 15-min lockout (`423 ACCOUNT_LOCKED`), token version (`tv`) revocation |
| Rate Limiting | Global + targeted limiters for login, register, forgot-password (per-IP & per-email), resend-verification, checkout, coupon validation, proof upload, token guessing, reviews, and inquiries |
| Input & Upload Safety | Zod validation, NoSQL key sanitizer (`$` / `.`), HTML escaping in emails, Multer memory storage (4 MB cap) + binary magic-byte validation |
| Sensitive Fields | `select: false` on `User.passwordHash`, token hashes, `Order.publicToken`, `Project.privateRepo` |
| Public Stats Cache | 5-minute in-memory cache with in-flight coalescing, automatically invalidated on project, order, and review mutations |

For full deployment steps on Vercel + MongoDB Atlas, see [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md) and [`../docs/API.md`](../docs/API.md).
