# Nexus — Full-Stack Software Marketplace & Engineering Studio

**Nexus** is a bilingual (Arabic RTL / English LTR), dual-theme (Light default / Dark) MERN-stack software marketplace, custom project inquiry portal, customer order portal, and admin console.

---

## Repository Structure

```text
.
├── Backend/                 # Express 4 + Mongoose 8 REST API & Vercel Serverless entrypoint (api/index.js)
├── Frontend/                # React 18 + Vite 6 + Tailwind CSS v3.4 SPA
├── docs/                    # Technical documentation & pre-deployment reports
│   ├── API.md               # Complete REST API contract (public, auth, account, owner, webhooks, cron)
│   ├── DEPLOYMENT.md        # Step-by-step two-project Vercel + MongoDB Atlas deployment guide
│   ├── frontend-contract.md # Shared Front End architecture, routes, design tokens, and motion contract
│   ├── design-conformance.md# Visual, responsive, RTL/LTR, theme, and A11Y conformance matrix
│   └── FINAL-REPORT.md      # Pre-deployment QA summary, known limitations, and manual launch checklist
└── README.md                # This file
```

---

## Core Capabilities

- **Public Storefront**: Home (real-time projects, stats, and published reviews), Marketplace (search, category, tech stack, price range, sort, pagination), Project Details (gallery lightbox, live iframe/external preview, tiered license packages), Pricing & Services, About, and Contact Inquiry form with PNG/JPG/WebP/PDF attachments (up to 3 files, 4 MB each).
- **Checkout & Payments**: Tax-free EGP pricing stored as integer piasters (`1 EGP = 100 piasters`), percentage/fixed coupons (including 100% free-order auto-confirmation), guest checkout with SHA-256 hashed 256-bit tracking tokens, manual payments (`vodafone_cash` and `instapay` receipt upload & owner review — work completely standalone without Paymob), and optional online payments via **Paymob Accept** (`card` + `fawry`) with canonical 20-field HMAC-SHA512 webhook verification. Paymob keys are optional and all-or-nothing: leave all `PAYMOB_*` unset to keep `card`/`fawry` automatically disabled and hidden, or set all four core keys (`PAYMOB_API_KEY`, `PAYMOB_HMAC_SECRET`, `PAYMOB_CARD_INTEGRATION_ID`, `PAYMOB_IFRAME_ID`) plus optional `PAYMOB_FAWRY_INTEGRATION_ID`.
- **Unified Accounts & RBAC**: Single `User` collection (`customer` & `admin`) using `httpOnly` JWT cookie (`bc_session`) with token-version session revocation (`tv`), email verification, password reset, brute-force lockout (`423 ACCOUNT_LOCKED`), customer order history, guest-order claiming, and verified-buyer reviews.
- **Admin Console (`/owner/*`)**: Revenue & status analytics dashboard (`recharts`), Categories, Projects (multi-package + Cloudinary media + private GitHub repo metadata), Orders (approve/reject/delivery/refund), Inquiries, Reviews moderation & replies, Coupons, Service Plans, Customers, Admins (invite flow), and Platform Settings (including registration toggle and payment method configuration).
- **Production Hardening**: Vercel Serverless backend (`Backend/api/index.js`) with daily Cron expiry (`GET /api/cron/expire-orders` protected by `CRON_SECRET`), Helmet headers, CORS & Origin/Content-Type CSRF protection, NoSQL key sanitization, magic-byte file inspection, and multi-hop proxy rate limiting (`TRUST_PROXY`).

---

## Quick Start (Local Development)

### Prerequisites
- **Node.js** v18+ LTS (v20+ recommended) & **npm** v9+
- **MongoDB** (Atlas cluster or local MongoDB 6+)

### 1. Back End Setup
```powershell
cd Backend
npm install
Copy-Item .env.example .env
# Edit Backend/.env with your MongoDB URI (database: nexus), JWT_SECRET, CRON_SECRET, Cloudinary, and SMTP keys (Paymob keys are optional)

# Initialize indexes, initial admin account, and platform settings
npm run db:indexes
npm run seed:owner
npm run seed:settings

# Start development server (port 5000)
npm run dev

# Or start isolated test server (port 5001, targets bytecraft_test ONLY)
npm run dev:test
```

### 2. Front End Setup
```powershell
cd Frontend
npm install
Copy-Item .env.example .env.local

# Start development server (port 5173, proxies /api -> http://localhost:5000)
npm run dev

# Or point dev/preview proxy to the isolated test backend (port 5001)
$env:VITE_DEV_API_TARGET="http://localhost:5001"; npm run dev
```

---

## Verification & Quality Scripts

```powershell
# Back End: run all Phase 1–10 + Vercel Serverless integration tests against bytecraft_test
cd Backend
npm test

# Front End: lint (0 errors, 0 warnings) and production build
cd Frontend
npm run lint
npm run build

# Front End: preview production build proxied to test backend
$env:VITE_DEV_API_TARGET="http://localhost:5001"; npm run preview
```

---

## Documentation Index

- [Backend/README.md](Backend/README.md) — Back End architecture, scripts, environment variables, and security checklist
- [Frontend/README.md](Frontend/README.md) — Front End stack, tokens, themes, motion system, and commands
- [docs/API.md](docs/API.md) — Full REST API specification
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Two-project Vercel deployment guide
- [docs/frontend-contract.md](docs/frontend-contract.md) — Shared Front End architectural & design contract
- [docs/design-conformance.md](docs/design-conformance.md) — Route-by-route visual, responsive, theme & A11Y conformance
- [docs/FINAL-REPORT.md](docs/FINAL-REPORT.md) — Pre-deployment readiness report, limitations, and launch checklist
