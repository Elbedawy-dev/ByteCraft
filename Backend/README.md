# 🚀 ByteCraft Dev Studio — Backend API Server

Production-ready, highly hardened, monolithic Node.js & Express RESTful API backend for **ByteCraft** — an online dev studio selling turnkey source code templates, digital SaaS starters, and custom software development services.

---

## 📋 Table of Contents
1. [Architecture Overview](#-architecture-overview)
2. [Prerequisites & Getting Started](#-prerequisites--getting-started)
3. [NPM Scripts](#-npm-scripts)
4. [Environment Variables Reference](#-environment-variables-reference)
5. [Directory & Project Structure](#-directory--project-structure)
6. [Key Architectural Decisions & Assumptions](#-key-architectural-decisions--assumptions)
7. [Security & Hardening Checklist](#-security--hardening-checklist)
8. [Production Deployment Guide](#-production-deployment-guide)

---

## 🏗 Architecture Overview

- **Runtime**: Node.js (v18+ LTS / v20+ / v22+)
- **Framework**: Express.js 4 (Modular routing, layered architecture)
- **Database**: MongoDB with Mongoose 8 (Strict schemas, indexed queries, zero client pollution)
- **Authentication**: Owner access via single verified administrator account with signed JWT stored in secure `httpOnly` cookie (`bc_owner`). In production (`NODE_ENV=production`), Authorization header fallbacks are strictly disabled to defend against token exfiltration.
- **Guest Access**: Zero customer account friction. Customers check out with contact info and receive an authoritative `orderNumber` and an unguessable 256-bit cryptographically secure `publicToken` (stored as a one-way SHA-256 hash in the database, with `select: false`).
- **Financial Arithmetic**: Tax-free billing using integer piasters (1 EGP = 100 piasters) to prevent IEEE-754 floating-point inaccuracies.
- **Online Payments**: Paymob Accept gateway (Credit/Debit Card via secure iframe/redirect + Fawry kiosk reference numbers) with canonical 20-field HMAC-SHA512 verification and atomic webhook idempotency.
- **Manual Payments**: Vodafone Cash & InstaPay with receipt proof upload (magic-byte validated for JPEG/PNG/WebP/PDF), owner approval/rejection state machine, and customer notifications.
- **Automated Delivery**: Optional GitHub read-only collaborator invitation via GitHub REST API upon confirmed payment (`AUTO_GITHUB_INVITE=true`).

---

## ⚡ Prerequisites & Getting Started

### 1. Requirements
- **Node.js**: v18.0.0 or higher (`node -v`)
- **npm**: v9.0.0 or higher (`npm -v`)
- **MongoDB**: MongoDB 6+ local instance (default `mongodb://127.0.0.1:27017`) or MongoDB Atlas cluster.

### 2. Installation
Clone the repository and install dependencies inside the `Backend` directory:
```bash
cd Backend
npm install
```

### 3. Environment Configuration
Create a `.env` file in `Backend/.env` based on `.env.example`:
```bash
cp .env.example .env
```
Fill in the required values (see [Environment Variables Reference](#-environment-variables-reference) below).

### 4. Database Seeding
Initialize the singleton owner account and tax-free site settings:
```bash
# Seed owner account (uses OWNER_EMAIL, OWNER_PASSWORD from .env)
npm run seed:owner

# Seed platform settings (guarantee period, payment methods default state)
npm run seed:settings
```

### 5. Running the Application
```bash
# Development mode with hot-reloading (nodemon) on port 5000:
npm run dev

# Dedicated test server on port 5001 (targets bytecraft_test):
npm run dev:test

# Run complete end-to-end verification test suite:
npm test

# Production start:
npm start
```

---

## 📜 NPM Scripts

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `nodemon src/server.js` | Runs development server on `PORT` (default 5000) with hot reloading |
| `npm run dev:test` | `node src/testServer.js` | Starts isolated test server on port 5001 targeting `bytecraft_test` |
| `npm test` | `node tests/run-all.js` | Spawns test server (if not up), executes Phase 1–8 suites, and shuts down |
| `npm run seed:owner` | `node src/seed/seedOwner.js` | Seeds single owner account into database safely |
| `npm run seed:settings` | `node src/seed/seedSettings.js` | Initializes singleton settings with tax-free schema and contact defaults |
| `npm start` | `node src/server.js` | Starts production HTTP server |

---

## ⚙️ Environment Variables Reference

| Variable | Required | Default | Example | Description |
|---|---|---|---|---|
| `NODE_ENV` | Yes | `development` | `production` | Environment mode (`development`, `production`, `test`) |
| `PORT` | No | `5000` | `5000` | HTTP port for the API server |
| `CLIENT_URL` | Yes | — | `https://bytecraft.dev` | Frontend origin for CORS and cookie origin validation |
| `MONGODB_URI` | Yes | — | `mongodb+srv://...` | MongoDB connection string (Atlas or local) |
| `JWT_SECRET` | Yes | — | `64_char_hex_random` | Secret key for signing owner JWTs |
| `JWT_EXPIRES_IN` | No | `7d` | `7d` | Lifetime of owner login token |
| `COOKIE_SAMESITE` | No | `lax` | `none` (for cross-site) | SameSite attribute for `bc_owner` cookie (`lax` or `none`) |
| `TRUST_PROXY` | No | `false` | `true` | Enable `app.set('trust proxy', 1)` behind reverse proxies (Render/Railway/Nginx) |
| `OWNER_NAME` | No | `ByteCraft Owner` | `Moaaz Elbedawy` | Owner display name |
| `OWNER_EMAIL` | Yes | — | `owner@bytecraft.dev` | Email address for owner authentication and alerts |
| `OWNER_PASSWORD` | Yes (seed) | — | `SuperSecret123!` | Initial password used only by `seedOwner.js` |
| `CLOUDINARY_CLOUD_NAME`| Yes (prod) | — | `h0arrkpf` | Cloudinary cloud account name |
| `CLOUDINARY_API_KEY` | Yes (prod) | — | `467933555336432` | Cloudinary API Key |
| `CLOUDINARY_API_SECRET`| Yes (prod) | — | `ohuOnYeyX...` | Cloudinary API Secret |
| `SMTP_HOST` | No | — | `smtp.resend.com` | Outgoing SMTP email host |
| `SMTP_PORT` | No | `587` | `587` or `465` | SMTP port |
| `SMTP_USER` | No | — | `apikey` | SMTP username |
| `SMTP_PASS` | No | — | `re_...` | SMTP password / API token |
| `MAIL_FROM` | No | — | `"ByteCraft" <noreply@...>` | Outgoing email `From:` header |
| `OWNER_NOTIFY_EMAIL` | No | — | `owner@bytecraft.dev` | Fallback notification recipient for order alerts |
| `PAYMOB_MODE` | No | `sandbox` | `live` | Paymob mode (`sandbox` or `live`) |
| `PAYMOB_API_KEY` | Yes (prod) | — | `ZXlKaGJHY2...` | Paymob API Key from Dashboard |
| `PAYMOB_HMAC_SECRET` | Yes (prod) | — | `D8756...` | Paymob HMAC Secret from Dashboard settings |
| `PAYMOB_CARD_INTEGRATION_ID` | Yes (prod) | — | `452391` | Paymob Card Payment Integration ID |
| `PAYMOB_FAWRY_INTEGRATION_ID` | Yes (prod) | — | `452392` | Paymob Fawry Kiosk Payment Integration ID |
| `PAYMOB_IFRAME_ID` | Yes (prod) | — | `812345` | Paymob Iframe ID for Card Checkout |
| `AUTO_GITHUB_INVITE` | No | `false` | `true` | If true, automatically invites buyer to repo on payment |
| `GITHUB_TOKEN` | If invite=true | — | `ghp_...` | GitHub Personal Access Token (classic with `repo` scope) |

---

## 📂 Directory & Project Structure

```
Backend/
├── public/
│   └── uploads/                 # Local dev fallback storage (gitignored)
├── src/
│   ├── config/
│   │   ├── constants.js         # Error codes, order statuses, payment methods
│   │   ├── db.js                # MongoDB connection handler & test fallback
│   │   ├── env.js               # Zod environment schema validation
│   │   └── cloudinary.js        # Cloudinary SDK initialization
│   ├── controllers/             # Express request/response handlers
│   │   ├── auth.controller.js
│   │   ├── category.controller.js
│   │   ├── project.controller.js
│   │   ├── servicePlan.controller.js
│   │   ├── coupon.controller.js
│   │   ├── order.controller.js
│   │   ├── payment.controller.js
│   │   ├── inquiry.controller.js
│   │   ├── review.controller.js
│   │   └── meta.controller.js
│   ├── middleware/              # Security and pipeline middlewares
│   │   ├── auth.middleware.js          # Owner JWT authentication
│   │   ├── csrf.middleware.js          # Mutating Content-Type verification
│   │   ├── errorHandler.middleware.js  # Centralized JSON error envelope
│   │   ├── notFound.middleware.js      # 404 handler
│   │   ├── rateLimiters.middleware.js  # Brute-force & token guess limiters
│   │   ├── sanitize.middleware.js      # NoSQL injection protection ($ and .)
│   │   ├── upload.middleware.js        # Multer memory storage & magic bytes
│   │   └── validate.middleware.js      # Zod request validator
│   ├── models/                  # Mongoose domain models
│   │   ├── Owner.js
│   │   ├── Settings.js
│   │   ├── Category.js
│   │   ├── Project.js
│   │   ├── ServicePlan.js
│   │   ├── Coupon.js
│   │   ├── Order.js
│   │   ├── Inquiry.js
│   │   └── Review.js
│   ├── routes/                  # Express route trees
│   │   ├── health.routes.js
│   │   ├── public.routes.js
│   │   ├── owner.routes.js
│   │   └── index.js
│   ├── seed/                    # Database seeder scripts
│   │   ├── seedOwner.js
│   │   └── seedSettings.js
│   ├── services/                # Business logic layer
│   │   ├── order.service.js
│   │   ├── pricing.service.js
│   │   ├── review.service.js
│   │   ├── upload.service.js
│   │   ├── email.service.js
│   │   ├── github.service.js
│   │   └── payments/
│   │       ├── paymentProvider.interface.js
│   │       └── paymob.service.js
│   ├── utils/                   # Reusable utility helpers
│   │   ├── AppError.js
│   │   ├── asyncHandler.js
│   │   ├── money.js
│   │   ├── orderNumber.js
│   │   ├── sanitize.js
│   │   └── transaction.js
│   ├── app.js                   # Express application setup
│   ├── server.js                # HTTP listener & graceful shutdown
│   └── testServer.js            # Isolated test server launcher (port 5001)
├── tests/                       # Automated test suites
│   ├── phase1.test.js           # Foundation, auth, settings
│   ├── phase2.test.js           # Images, categories, projects
│   ├── phase3.test.js           # Service plans, pricing, coupons
│   ├── phase4.test.js           # Orders, manual payments, transactions
│   ├── phase5.test.js           # Paymob gateway & webhooks
│   ├── phase6.test.js           # Reviews, inquiries, dashboard
│   ├── phase7.test.js           # Hardening, allow-lists, privacy
│   ├── phase8.test.js           # Public projects computed fields & extended inquiries
│   └── run-all.js               # Master runner (`npm test`)
├── postman/                     # API Postman Collections
│   └── ByteCraft.postman_collection.json
├── package.json
└── README.md
```

---

## 🧠 Key Architectural Decisions & Assumptions

1. **Tax-Free Financial Model**:
   - The platform charges zero tax/VAT. Formula: `total = max(0, subtotal - discount)`.
   - All amounts are stored as integers in **piasters** (`1 EGP = 100 piasters`) to guarantee zero floating point drift.

2. **Zero-Account Checkout with Unguessable Tokens**:
   - Customers checkout without passwords.
   - Upon order creation, a cryptographically secure 256-bit token is generated.
   - The server stores only its **SHA-256 hash** (`select: false`).
   - The raw token is returned **only once** in the order creation response.
   - Guest queries require the raw token; comparison is performed using constant-time `crypto.timingSafeEqual` against the stored hash.

3. **Rate Limiting on Token Guessing (`tokenGuessLimiter`)**:
   - To stop automated brute-forcing of public order tokens, endpoints accepting tokens (`GET /api/orders/:orderNumber`, `POST /api/orders/:orderNumber/payment-proof`, and `POST /api/orders/:orderNumber/reviews`) are restricted to **20 attempts per 15 minutes per IP**.
   - `skipSuccessfulRequests: true` ensures that legitimate customers accessing valid orders never exhaust this limit.

4. **Webhook Idempotency & Status Transition Allow-List**:
   - Paymob server-to-server callbacks are verified with a 20-field canonical HMAC-SHA512.
   - Only orders with statuses in `['pending_payment', 'awaiting_review', 'expired']` may transition to `paid`.
   - Orders in `['refunded', 'cancelled', 'rejected', 'paid', 'delivered']` remain completely unchanged and return `200 { idempotent: true }` with a logged warning.
   - If an `expired` order transitions to `paid` (e.g. late Fawry cash deposit), its coupon use is atomically re-consumed respecting `maxUses`. If the coupon was exhausted in the interim, the order is still honored as `paid`, and an explanatory notice is recorded in `statusHistory`.

5. **Customer Privacy in Public Reviews**:
   - Public review responses never return `orderNumber`, `order`, `email`, `phone`, or access tokens.
   - Reviewer names are automatically sanitized and masked to `Firstname L.` format (e.g., "Mohamed A.").
   - Default visibility `isPublished: true`.

6. **Anti-Spam Honeypot**:
   - Inquiries and checkout endpoints inspect honeypot fields (`hp`, `_hp`, `website`). If populated by automated spambots, the request returns a dummy 200/201 success without saving or processing the spam.

7. **Production Environment Hardening**:
   - When `NODE_ENV=production`:
     - `Authorization: Bearer` fallback is disabled (only secure `httpOnly` cookie accepted).
     - Local disk upload fallback is disabled (throws explicit error if Cloudinary is not configured).
     - Email body simulation in terminal logs is completely suppressed.

8. **Strict Database Isolation for Tests**:
   - The test server launcher (`src/testServer.js`) runs strictly on port `5001`.
   - It redirects the MongoDB connection to `bytecraft_test` database.
   - Local MongoDB fallback is strictly allowed **only** when `PORT === 5001` and targeting `bytecraft_test`. It can never activate for the production `ByteCraft` database.

---

## 🛡 Security & Hardening Checklist

| Feature | Implementation | Status |
|---|---|---|
| HTTP Headers | `helmet()` with default security headers | ✅ DONE |
| CORS Policy | Exact match against `CLIENT_URL`, `credentials: true` | ✅ DONE |
| Rate Limiting | Global limiter + targeted limiters (login, order creation, coupon validation, proof upload, token guessing, reviews) | ✅ DONE |
| NoSQL Injection | Custom middleware strips `$*` and dotted `*.*` keys from user inputs | ✅ DONE |
| CSRF Defense | Rejects mutating requests (`POST`/`PATCH`/`PUT`/`DELETE`) with invalid `Content-Type` | ✅ DONE |
| Sensitive Fields | `select: false` on `Owner.passwordHash`, `Order.publicToken`, `Project.privateRepo` | ✅ DONE |
| Startup Validation | Zod schema validates all required environment variables on startup | ✅ DONE |
| Graceful Shutdown | Intercepts `SIGTERM` and `SIGINT`, drains HTTP requests, and closes MongoDB connection | ✅ DONE |
| Magic-Bytes Validation | Validates real binary signatures of uploaded image and PDF files | ✅ DONE |
| Dependencies Audit | `multer` 2.x, `mongoose`, `nodemailer`, `body-parser`, `qs` patched; remaining: `zod` 3.x→4.x (breaking migration, mitigated by 100kb body limit) & `minimatch` (dev-only via `nodemon`) | ⚠️ TRACKED |

---

## 🚀 Production Deployment Guide

### 1. Cloud Hosting (Render / Railway / Fly.io / VPS)
- **Node Environment**: Set `NODE_ENV=production`.
- **Build Command**: `npm install --omit=dev`
- **Start Command**: `npm start`
- **Port**: Host sets `PORT` automatically; Express binds to `process.env.PORT`.
- **Trust Proxy**: Set `TRUST_PROXY=true` in environment variables when deployed behind load balancers or Cloudflare so rate limiters track real client IPs instead of the reverse proxy IP.

### 2. MongoDB Atlas Configuration
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com).
2. Go to **Network Access** → **IP Access List**.
3. Add your production server's outbound static IP address. (If using ephemeral PaaS like Render or Railway without static IPs, add `0.0.0.0/0` with strong database user credentials).
4. Go to **Database Access** → create an application user with read/write access to the `ByteCraft` database.
5. Set `MONGODB_URI` in your production environment.

### 3. Cross-Site Cookies (Frontend & Backend on Different Domains)
If your frontend is on `https://bytecraft.dev` and backend is on `https://api.bytecraft.dev` (or Render/Railway URL):
- Set `COOKIE_SAMESITE=none` in `.env`.
- Ensure `CLIENT_URL` matches the exact frontend origin (e.g. `https://bytecraft.dev`, no trailing slash).
- Modern browsers require `Secure=true` whenever `SameSite=None` is used (handled automatically when `NODE_ENV=production`).

### 4. Paymob Accept Gateway Setup
1. Log in to [Paymob Dashboard](https://accept.paymob.com).
2. Set up **Cards Integration**:
   - Note the **Integration ID** → save as `PAYMOB_CARD_INTEGRATION_ID`.
   - Note your **Iframe ID** → save as `PAYMOB_IFRAME_ID`.
3. Set up **Fawry Integration**:
   - Note the **Integration ID** → save as `PAYMOB_FAWRY_INTEGRATION_ID`.
4. Configure **Transaction Callback**:
   - Go to **Settings** → **Account Settings** → **Integration**.
   - Note the **HMAC Secret** → save as `PAYMOB_HMAC_SECRET`.
   - Set **Transaction Processed Callback** to:
     `https://<your-api-domain>/api/payments/paymob/webhook`
   - Set **Transaction Response Callback** (Client Redirect) to your frontend payment return page:
     `https://<your-frontend-domain>/payment/result`
5. Switch `PAYMOB_MODE=live` and populate `PAYMOB_API_KEY` with your production key.

### 5. Cloudinary Production Configuration
1. Create a free or paid Cloudinary account at [cloudinary.com](https://cloudinary.com).
2. From the Cloudinary Dashboard, copy:
   - **Cloud Name** → `CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET`
3. Media assets are automatically uploaded to `bytecraft/projects`, `bytecraft/proofs`, and `bytecraft/inquiries` folders.

### 6. SMTP Email Delivery
1. Use an SMTP provider like **Resend**, **SendGrid**, or **Postmark**.
2. Configure:
   - `SMTP_HOST=smtp.resend.com`
   - `SMTP_PORT=465` (secure) or `587`
   - `SMTP_USER=resend`
   - `SMTP_PASS=re_your_api_key`
   - `MAIL_FROM="ByteCraft" <orders@yourdomain.com>`
   - `OWNER_NOTIFY_EMAIL=owner@yourdomain.com`

---

## 📄 License
Proprietary — ByteCraft Dev Studio. All rights reserved.
