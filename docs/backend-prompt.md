# ByteCraft — Back End Build Prompt (Node.js / Express / MongoDB)

You are a senior back-end engineer. Build the **complete Back End** (REST API) for **ByteCraft**, a bilingual (Arabic/English) marketing + marketplace website owned by a single MERN developer. The Front End is built separately afterwards and will consume this API directly (no mock data), so the API contract must be exactly as specified here.

Work in **phases** (see "Build Phases"). After each phase: run the server, test the new endpoints, fix problems, and write a short summary of what you verified. Do not move on with failing code.

---

## 1. Product context

ByteCraft is the owner's personal studio site. It:

1. Presents his skills and services (static content, handled by the Front End — **not** by this API).
2. Lists **ready-made MERN projects for sale** (education platforms, e-commerce stores, etc.), each with several price packages, a gallery, tech stack, and a **live preview** (an embedded demo of the real deployed project).
3. Lets a visitor **buy a project license** through a guest checkout (no customer accounts). After payment, the owner delivers the source code (private Git repo access).
4. Lets a visitor send a **"start your project" inquiry** (custom work request).
5. Gives the owner a private dashboard to manage everything.

### IMPORTANT — Access model (no Admin system)
- There is **NO admin role, NO user management, NO registration, NO customer accounts**.
- There is exactly **one Owner** (the site owner). He logs in with email + password to manage the site. Name everything "owner", never "admin".
- Customers are **guests**: they never log in. They get an order number + a secret `publicToken` to check their order status and upload payment proof.
- The Owner account is created **only** by a seed script from `.env` (no public endpoint can create it).

---

## 2. Tech stack & rules

- Node.js 20+, **Express 4.x**, **CommonJS** (`require`), Mongoose 8, MongoDB (Atlas or local).
- Packages (suggested): `express`, `mongoose`, `dotenv`, `zod`, `bcryptjs`, `jsonwebtoken`, `cookie-parser`, `cors`, `helmet`, `express-rate-limit`, `multer`, `cloudinary`, `nodemailer`, `morgan`, `slugify`, `nanoid`, `axios`. Use `nodemon` for dev.
- Everything must run on **Windows, macOS and Linux** (no bash-only npm scripts).
- Code style: clean, small functions, **controllers are thin; business logic lives in `services/`**. Add short comments explaining the *why* of non-obvious parts (the owner is learning from this code). No over-engineering, no unused abstractions.
- All request bodies/queries/params are validated with **zod** in `validators/`.
- **Never** trust prices, totals or discounts sent by the client — always recompute on the server.
- **Money**: stored and returned as **integers in piasters** (1 EGP = 100 piasters). Currency is always `EGP`. Never use floats for money. Provide `utils/money.js` with `egpToPiasters`, `piastersToEgp`, `applyPercent` (round half up).
- Bilingual text fields use the shape `{ ar: String, en: String }`.
- Consistent response envelope:
  ```json
  { "success": true, "data": {}, "meta": {} }
  { "success": false, "error": { "code": "VALIDATION_ERROR", "message": "…", "details": [] } }
  ```
  Use a custom `AppError` class + one central error handler (no stack traces in production). Handle Mongoose validation/duplicate-key/cast errors and zod errors there.
- Paginated lists return `data: [...]` and `meta: { page, limit, total, totalPages }`.

### Folder structure
```
server/
  src/
    config/        env.js (zod-validated env, fail fast), db.js, cloudinary.js, constants.js
    models/        Owner, Project, Category, ServicePlan, Order, Coupon, Inquiry, Settings, Counter
    validators/
    controllers/
    services/      pricing, orders, payments/paymob, email, upload, github, dashboard
    routes/        public.routes.js, owner.routes.js, index.js
    middleware/    auth (owner), validate, errorHandler, notFound, rateLimiters, upload
    utils/         AppError, asyncHandler, money, slug, orderNumber
    seed/          seedOwner.js, seedSettings.js
    app.js
    server.js
  .env.example
  README.md
  postman/ByteCraft.postman_collection.json
```

---

## 3. Data models (Mongoose)

All models use `timestamps: true`. Add sensible indexes.

### Owner (single document)
`key: 'owner'` (unique, fixed — guarantees only one), `email` (unique, lowercase), `passwordHash`, `name`, `lastLoginAt`.

### Category
`key` (unique slug, e.g. `education`, `ecommerce`), `name {ar,en}`, `order` (Number), `isActive` (Boolean).

### Project
- `slug` (unique, auto-generated from `title.en`, editable by owner, always unique)
- `title {ar,en}`, `tagline {ar,en}` (one-liner), `description {ar,en}` (long)
- `category` → ref `Category`
- `techStack: [String]` (e.g. `React`, `Node.js`, `MongoDB`, `Express`, `Socket.io`)
- `features: [{ ar, en }]` (key features / technical specs list)
- `thumbnail: { url, publicId }`, `gallery: [{ url, publicId }]`
- `preview: { url: String, mode: 'iframe' | 'external', demoNote {ar,en}, demoCredentials: { label, email, password } }` — `demoCredentials` is shown to visitors so they can log into the live demo; it is **demo-only data** and may be public.
- `packages: [ { key ('standard'|'pro'|'enterprise' or any slug), name {ar,en}, price (piasters), compareAtPrice (piasters, optional, for strikethrough), features [{ar,en}], licenseType ('single'|'multi'), supportDays (Number), isPopular (Boolean), isActive } ]` — at least one active package is required for a published project.
- `privateRepo: { provider: 'github'|'gitlab'|'other', owner, name, url }` — **`select: false`**, never exposed by any public endpoint.
- `status: 'draft' | 'published' | 'archived'`, `isFeatured`, `sortOrder`
- `stats: { views, previewViews, purchases }` (Numbers, default 0)
- Text index on `title.ar`, `title.en`, `tagline.*`, `techStack`.

### ServicePlan (custom-build pricing shown on the Pricing page)
`group` (String, e.g. `lms`, `ecommerce`, `custom`), `name {ar,en}`, `description {ar,en}`, `startingPrice` (piasters), `features [{ar,en}]`, `deliveryDays` (Number), `isPopular`, `isActive`, `sortOrder`. These lead to the **inquiry form** (not a direct purchase).

### Coupon
`code` (unique, uppercase), `type: 'percent'|'fixed'`, `value` (percent 1–100, or piasters), `maxUses` (null = unlimited), `usedCount`, `expiresAt` (optional), `isActive`, `appliesToProjects: [ObjectId]` (empty = all).

### Order
- `orderNumber` (unique, format `BC-YYYY-000123`, generated atomically with a `Counter` collection using `findOneAndUpdate` + `$inc`)
- `publicToken` (random 32+ chars via `nanoid`, **`select: false`** on normal queries; returned **once** at creation)
- `locale: 'ar'|'en'` (used to pick the email language)
- `project` (ref) + **snapshot** `{ title {ar,en}, slug, packageKey, packageName {ar,en}, licenseType }`
- `customer: { fullName, email, phone, gitProvider ('github'|'gitlab'), gitUsername, organization }`
- `pricing: { currency:'EGP', subtotal, couponCode, discount, vatRate (percent, snapshot), vat, total }` (all piasters)
- `paymentMethod: 'vodafone_cash'|'instapay'|'fawry'|'card'`
- `status: 'pending_payment' | 'awaiting_review' | 'paid' | 'delivered' | 'rejected' | 'cancelled' | 'refunded'`
- `payment: { provider ('manual'|'paymob'), providerOrderId (unique sparse), providerTransactionId, fawryReference, proof: { url, publicId, reference, submittedAt }, rejectionReason, paidAt }`
- `delivery: { repoAccess: 'pending'|'granted'|'failed'|'manual', grantedAt, deliveredAt, notes }`
- `statusHistory: [{ status, at, note }]` (append on every status change)

### Inquiry (the "Start your project" form)
`fullName`, `email`, `phone`, `projectType` (String), `servicePlan` (ref, optional), `budgetRange` (String), `description`, `preferredContact` ('whatsapp'|'email'|'call'), `locale`, `status: 'new'|'contacted'|'closed'`, `ownerNotes`.

### Settings (singleton, key `'main'`)
- `vatRate` (percent, default 14)
- `contact: { email, whatsapp, phone, location {ar,en}, socials: { github, linkedin, … } }`
- `paymentMethods`:
  - `vodafone_cash: { enabled, walletNumber, accountName, instructions {ar,en} }` (manual)
  - `instapay: { enabled, ipa, accountName, instructions {ar,en} }` (manual)
  - `fawry: { enabled }` (online via Paymob)
  - `card: { enabled }` (online via Paymob)
- `guaranteeDays` (default 30), `siteName`.

---

## 4. API specification

Base path: `/api`. JSON everywhere (except multipart uploads).

### 4.1 Public endpoints (no auth)

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/meta` | Active categories, enabled payment methods (**without** wallet numbers/IPA — those come with order creation), VAT rate, guarantee days, public contact info |
| GET | `/projects` | Published projects. Query: `search`, `category` (key), `tech` (comma list), `minPrice`, `maxPrice` (compared with the cheapest active package), `sort` (`newest`\|`price_asc`\|`price_desc`\|`popular`), `featured`, `page`, `limit` (max 50) |
| GET | `/projects/:slug` | Project details (packages = active only). Increments `stats.views` (don't count owner views) |
| POST | `/projects/:slug/preview-view` | Increments `stats.previewViews` (rate-limited, fire-and-forget) |
| GET | `/service-plans` | Active plans, optional `group` filter |
| POST | `/coupons/validate` | Body `{ code, projectSlug, packageKey }` → returns discount preview computed by the pricing service |
| POST | `/orders` | Create an order (see 5.1) |
| GET | `/orders/:orderNumber?token=` | Order status for the guest (token required, constant-time compare). Returns only safe fields |
| POST | `/orders/:orderNumber/payment-proof` | Multipart (`proof` image + body `reference`) + `?token=`. Allowed only for manual methods while status is `pending_payment` or `rejected`. Sets status `awaiting_review`, notifies owner |
| POST | `/payments/paymob/webhook` | Paymob server-to-server callback (see 5.3) |
| POST | `/inquiries` | Create inquiry, notify owner by email |

### 4.2 Owner endpoints (cookie auth; all under `/api/owner`)

| Area | Endpoints |
|---|---|
| Auth | `POST /login`, `POST /logout`, `GET /me`, `PATCH /password` (needs current password) |
| Dashboard | `GET /dashboard` → see 5.5 |
| Projects | `GET /projects` (all statuses, incl. `privateRepo`), `GET /projects/:id`, `POST /projects`, `PATCH /projects/:id`, `DELETE /projects/:id` (block deletion if the project has paid orders → archive instead), `PATCH /projects/:id/status` |
| Categories | full CRUD |
| Service plans | full CRUD |
| Coupons | full CRUD |
| Orders | `GET /orders` (filters: `status`, `paymentMethod`, `search` on orderNumber/customer name/email, date range, pagination), `GET /orders/:id` (includes proof image + history), `PATCH /orders/:id/approve`, `PATCH /orders/:id/reject` (body `reason`), `PATCH /orders/:id/delivery` (mark delivered / add notes), `PATCH /orders/:id/refund` (status only — no real gateway refund) |
| Inquiries | `GET /inquiries`, `GET /inquiries/:id`, `PATCH /inquiries/:id` (status, ownerNotes), `DELETE /inquiries/:id` |
| Uploads | `POST /uploads/images` (multipart field `images`, up to 10 files) → `[{ url, publicId, width, height }]`; `DELETE /uploads` body `{ publicId }` |
| Settings | `GET /settings`, `PATCH /settings` |

### 4.3 Owner auth details
- `POST /login` validates email+password with bcrypt, then sets a **JWT in an httpOnly cookie** (`bc_owner`), `Secure` in production, `SameSite` configurable by env (`COOKIE_SAMESITE=lax|none`), `maxAge` from env.
- `authOwner` middleware reads the cookie, verifies the JWT, loads the Owner, attaches `req.owner`.
- Login is strictly rate-limited (e.g. 5 attempts / 15 min / IP) and uses a generic error ("Invalid credentials") for both wrong email and wrong password.
- CORS: `origin: CLIENT_URL` (exact match, `credentials: true`). Because cookies are used, reject mutating requests (`POST/PATCH/PUT/DELETE`) whose `Content-Type` is not `application/json` or `multipart/form-data` (basic CSRF hardening), and document the CSRF notes in the README.

---

## 5. Business logic

### 5.1 Pricing service (`services/pricing.service.js`) — single source of truth
Input: `projectId`, `packageKey`, `couponCode?`. Steps:
1. Load project (must be `published`) and the active package → `subtotal = package.price`.
2. If a coupon is given: validate (active, not expired, `usedCount < maxUses`, applies to this project). `discount = percent ? applyPercent(subtotal, value) : min(value, subtotal)`.
3. `taxable = subtotal - discount`; `vat = applyPercent(taxable, settings.vatRate)`; `total = taxable + vat`.
4. Return the full `pricing` object. This same function is used by `/coupons/validate` and by order creation.

### 5.2 Order creation — `POST /orders`
Body: `{ projectSlug, packageKey, couponCode?, paymentMethod, locale, customer: { fullName, email, phone, gitProvider, gitUsername, organization? } }`.
1. Validate; ensure the chosen `paymentMethod` is enabled in settings.
2. Compute pricing with the pricing service. Build the project/package **snapshot** on the order.
3. Generate `orderNumber` and `publicToken`. Increment coupon `usedCount` **atomically** (and roll back if order creation fails).
4. Depending on the method:
   - **Manual** (`vodafone_cash`, `instapay`): status `pending_payment`; response includes `paymentInstructions` taken from settings (`walletNumber`/`ipa`, account name, instructions) and the exact `total`.
   - **Online** (`card`, `fawry`): create the Paymob payment (5.3) and return `paymentUrl` (card iframe/redirect) or `fawryReference` (kiosk). Status `pending_payment`.
5. Response: `{ orderNumber, publicToken, pricing, status, paymentMethod, paymentInstructions | paymentUrl | fawryReference }`. The `publicToken` is returned **only here**.
6. Email the customer (order received + how to pay) and the owner (new order). Email failures must **never** fail the request — log them.

### 5.3 Paymob (cards + Fawry) — `services/payments/paymob.service.js`
- Put it behind a small provider interface (`createPayment(order)`, `verifyWebhook(req)`) so another gateway can be added later.
- Use Paymob Accept's **current official integration flow** (read the latest Paymob developer docs yourself; if the newer "Intention"/unified checkout API is the recommended one, use it, otherwise the classic auth → order → payment key flow). Amounts are sent in piasters (matches our money format). Use env values for API key, HMAC secret, integration IDs, iframe ID.
- **Webhook** (`POST /payments/paymob/webhook`):
  - Verify the **HMAC** exactly as Paymob documents (constant-time comparison). Reject invalid signatures with 401 and log.
  - Find the order by `payment.providerOrderId`; verify that the paid **amount equals `pricing.total`** and currency is EGP; never trust the browser redirect.
  - **Idempotent**: if the order is already `paid`, return 200 and do nothing.
  - On success: set `paid`, `paidAt`, store `providerTransactionId`, push history, call `onOrderPaid(order)` (5.4). On failure: keep `pending_payment` (allow retry) and record a history note.
- Sandbox/live selected by env.

### 5.4 `onOrderPaid(order)` — runs for both manual approval and Paymob success
1. Increment `project.stats.purchases`.
2. If `AUTO_GITHUB_INVITE=true`, `gitProvider==='github'`, and the project has `privateRepo`: call GitHub API to add the customer as a **read-only collaborator** (`PUT /repos/{owner}/{repo}/collaborators/{username}` with `permission: 'pull'`) using `GITHUB_TOKEN`. Set `delivery.repoAccess` to `granted` or `failed` (store the error text in `delivery.notes`). If not applicable → `manual`.
3. Email the customer (payment confirmed + what happens next, in their `locale`) and the owner.

### 5.5 Owner dashboard — `GET /owner/dashboard`
Return: totals (revenue from `paid`+`delivered` orders, orders count, paid orders, pending proofs to review, new inquiries, published projects), revenue per month for the last 12 months, orders by status, top 5 projects by purchases, last 8 orders, last 8 inquiries. Use aggregation pipelines.

### 5.6 Manual payment review
- `approve`: allowed from `awaiting_review` (or `pending_payment` if the owner confirmed outside the site) → `paid` → `onOrderPaid`.
- `reject`: requires a reason → status `rejected`; customer is emailed and may upload new proof.
- Every transition is validated by a small state machine (`services/orders.service.js`) — invalid transitions return `409 INVALID_STATE`.

### 5.7 Uploads
- Multer **memory** storage → upload to Cloudinary via `upload_stream` (folder `bytecraft/projects` or `bytecraft/proofs`).
- Only `image/jpeg`, `image/png`, `image/webp`; max 5 MB per file; reject others with a clear error.
- Payment proofs: stored in a separate Cloudinary folder; accepted only through the token-protected order endpoint.
- When a project image is removed/replaced or a project is deleted, delete the old asset from Cloudinary (best effort, never block the request).

### 5.8 Emails (`services/email.service.js`)
- Nodemailer with SMTP env config. Simple, clean HTML templates in **Arabic (RTL) and English**, chosen by `order.locale` / `inquiry.locale`.
- Events: order created, proof submitted (owner), payment confirmed, payment rejected, new inquiry (owner).
- If SMTP is not configured, log the email to the console instead of failing (useful in development).

---

## 6. Security & robustness checklist
- `helmet`, strict CORS, `express-rate-limit` (global + stricter limiters for: login, order creation, coupon validation, proof upload, inquiries, preview-view).
- Strip `$`-prefixed keys / dotted keys from user input (write a small sanitizer middleware — do **not** use packages that break on Express 4 request objects).
- Limit JSON body size (e.g. 100kb). Trust proxy setting via env for deployment behind a proxy.
- Never log passwords, tokens, HMAC secrets or full payment payloads.
- Env validation at startup with zod (fail fast with a readable message).
- Graceful shutdown (close server + Mongo connection).
- `select: false` for `passwordHash`, `publicToken`, `privateRepo`.
- Use MongoDB transactions **only if** the deployment supports them; otherwise rely on atomic operators (`$inc`, conditional `findOneAndUpdate`) — pick one and document it.

---

## 7. Environment variables (`.env.example`, with comments)
```
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=7d
COOKIE_SAMESITE=lax
TRUST_PROXY=false

OWNER_NAME=
OWNER_EMAIL=
OWNER_PASSWORD=            # used only by the seed script

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
MAIL_FROM=
OWNER_NOTIFY_EMAIL=

PAYMOB_MODE=sandbox        # sandbox | live
PAYMOB_API_KEY=
PAYMOB_HMAC_SECRET=
PAYMOB_CARD_INTEGRATION_ID=
PAYMOB_FAWRY_INTEGRATION_ID=
PAYMOB_IFRAME_ID=

AUTO_GITHUB_INVITE=false
GITHUB_TOKEN=
```

---

## 8. Seeds (no fake data)
- `npm run seed:owner` → creates the single Owner from env (refuses to create a second one; if it exists, updates nothing unless `--reset-password` is passed).
- `npm run seed:settings` → creates the Settings singleton with safe defaults (VAT 14, all payment methods **disabled** until the owner enables and fills them).
- **Do not** seed projects, orders or any demo content — the owner adds real content from the dashboard.

---

## 9. Build phases (stop and verify after each)

1. **Foundation**: project setup, env validation, DB connection, `AppError`/error handler, validation middleware, rate limiters, health route, Owner model + login/logout/me/password, seeds, Settings get/update.
2. **Catalog**: Cloudinary uploads, Categories, Projects (owner CRUD + public list/detail with filters, search, sorting, pagination, stats counters).
3. **Pricing content**: Service plans CRUD + public list, Coupons CRUD + validation endpoint, pricing service.
4. **Orders & manual payments**: Counter/orderNumber, order creation, guest order status, proof upload, owner review (approve/reject/delivery/refund), state machine, `onOrderPaid`, emails.
5. **Online payments**: Paymob service (card + Fawry), webhook with HMAC + amount check + idempotency.
6. **Inquiries & dashboard**: inquiries (public create + owner management), dashboard aggregations.
7. **Hardening & docs**: security checklist review, README, `.env.example`, Postman collection with every endpoint (variables for base URL, order number, token), and a "Decisions & assumptions" section in the README.

## 10. Definition of done
- Server starts with `npm run dev` on Windows/macOS/Linux with a valid `.env`.
- Every endpoint in section 4 exists, validated, and returns the response envelope.
- A full happy path works end-to-end in Postman: owner login → create category → create project with images → public list/detail → create order (manual) → upload proof → owner approve → emails logged/sent; and Paymob sandbox: create order (card) → webhook → paid.
- No secrets committed; `.gitignore` covers `.env`, `node_modules`.
- README explains setup, scripts, env vars, folder structure, and the API overview.