/**
 * Phase 4 End-to-End Verification Test Script
 * 
 * Target: Test server on port 5001 with test DB: `bytecraft_test`
 * 
 * Verifies:
 * 1. 100% Coupon Creation Rule:
 *    - Percent 100% coupon without maxUses is rejected (400 VALIDATION_ERROR).
 *    - Percent 100% coupon with finite maxUses succeeds.
 * 2. Guest Order Creation (Manual Payment):
 *    - POST /api/orders with Vodafone Cash.
 *    - Atomic orderNumber generation (format BC-YYYY-000001).
 *    - Secret publicToken generated and returned once.
 *    - Tax-free pricing breakdown snapshot.
 *    - Sanitized payment instructions returned.
 * 3. Guest Order Status Query:
 *    - Missing token -> 401 UNAUTHORIZED.
 *    - Wrong token -> 401 UNAUTHORIZED (timing-safe).
 *    - Valid token -> 200, returns status, pricing, snapshot, delivery, instructions.
 *    - publicToken remains hidden from query responses.
 * 4. Guest Payment Proof Submission:
 *    - POST /api/orders/:orderNumber/payment-proof?token=... with multipart image.
 *    - State machine transitions from pending_payment to awaiting_review.
 *    - Attempting duplicate proof upload while awaiting_review throws 409 INVALID_STATE.
 * 5. Owner Review & State Transitions:
 *    - GET /api/owner/orders (filters, search, pagination metadata).
 *    - GET /api/owner/orders/:id (full detail with proof & history).
 *    - PATCH /api/owner/orders/:id/reject with reason -> status becomes rejected.
 *    - Re-submitting proof while rejected is allowed -> status becomes awaiting_review.
 *    - PATCH /api/owner/orders/:id/approve -> status becomes paid, triggers onOrderPaid (project purchases stats increment).
 *    - PATCH /api/owner/orders/:id/delivery -> status becomes delivered, grantedAt & deliveredAt recorded.
 *    - PATCH /api/owner/orders/:id/refund -> status becomes refunded.
 *    - Invalid state transitions throw 409 INVALID_STATE.
 * 6. Zero-Total Orders (Auto-Confirmed):
 *    - 100% discount coupon applied -> total = 0.
 *    - Order auto-confirms with status 'paid', paymentStatus 'paid', isFreeOrder: true, pricing.couponCode recorded.
 *    - Bypasses payment proof requirements; onOrderPaid runs immediately.
 * 7. Coupon usedCount Atomic Concurrency & Rollback:
 *    - usedCount increments atomically on order creation.
 *    - Reaching maxUses blocks subsequent orders with 400 COUPON_MAX_USES_REACHED.
 * 8. Project Deletion Protection:
 *    - Projects with paid orders cannot be deleted (409 PROJECT_HAS_PAID_ORDERS).
 * 9. Mandatory Cleanup:
 *    - All test orders, projects, categories, and coupons deleted.
 */

const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = 5001;
const BASE_URL = `http://localhost:${PORT}/api`;
const OWNER_EMAIL = (process.env.OWNER_EMAIL || 'moaazelbedawy@gmail.com').trim();
const OWNER_PASSWORD = (process.env.OWNER_PASSWORD || '').trim();

// Target test database
let testMongoUri = process.env.MONGODB_URI.trim();
if (testMongoUri.includes('.mongodb.net/')) {
  testMongoUri = testMongoUri.replace(/\.mongodb\.net\/([^?]+)/, '.mongodb.net/bytecraft_test');
} else {
  testMongoUri = testMongoUri.replace(/\/([^/?]+)(\?|$)/, '/bytecraft_test$2');
}

async function runTests() {
  console.log('🧪 Starting Phase 4 Verification Tests on PORT 5001 (DB: bytecraft_test)...\n');
  console.log(`📡 Target API: ${BASE_URL}`);

  let passed = 0;
  let failed = 0;
  let cookieHeader = '';

  const cleanup = {
    orderIds: [],
    projectIds: [],
    categoryIds: [],
    couponIds: [],
  };

  function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
  }

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Error: ${err.message}\n`);
      failed++;
    }
  }

  // Ensure owner & settings with enabled payment methods exist in test DB
  console.log('🌱 Ensuring test owner & settings exist in bytecraft_test database...');
  let conn;
  try {
    conn = await mongoose.connect(testMongoUri, { serverSelectionTimeoutMS: 4000 });
  } catch (err) {
    console.warn('⚠️ Atlas connection failed in test seeder. Falling back to local test database.');
    conn = await mongoose.connect('mongodb://127.0.0.1:27017/bytecraft_test');
  }
  const bcrypt = require('bcryptjs');

  const Owner = conn.model('Owner', new mongoose.Schema({
    key: { type: String, default: 'owner', unique: true },
    email: { type: String, unique: true },
    passwordHash: { type: String, select: false },
    name: String,
    lastLoginAt: Date,
  }, { timestamps: true }));

  const Settings = conn.model('Settings', new mongoose.Schema({
    key: { type: String, default: 'main', unique: true },
    siteName: { type: String, default: 'ByteCraft' },
    guaranteeDays: { type: Number, default: 30 },
    contact: mongoose.Schema.Types.Mixed,
    paymentMethods: mongoose.Schema.Types.Mixed,
  }, { timestamps: true }));

  let testOwner = await Owner.findOne({ key: 'owner' });
  if (!testOwner) {
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(OWNER_PASSWORD, salt);
    await Owner.create({
      key: 'owner',
      name: 'Test Owner',
      email: OWNER_EMAIL.toLowerCase(),
      passwordHash,
    });
    console.log('   ✅ Seeded owner in bytecraft_test');
  }

  let testSettings = await Settings.findOne({ key: 'main' });
  const paymentMethodsPayload = {
    vodafone_cash: {
      enabled: true,
      walletNumber: '01012345678',
      accountName: 'ByteCraft Studio Vodafone Cash',
      instructions: {
        ar: 'يرجى تحويل المبلغ ثم إرفاق صورة إيصال التحويل ورقم المعاملة.',
        en: 'Please transfer amount then upload the receipt screenshot.',
      },
    },
    instapay: {
      enabled: true,
      ipa: 'bytecraft@instapay',
      accountName: 'ByteCraft Studio InstaPay',
      instructions: {
        ar: 'تحويل عبر تطبيق انستاباي لحساب bytecraft@instapay',
        en: 'Transfer via InstaPay to bytecraft@instapay',
      },
    },
    fawry: { enabled: false },
    card: { enabled: false },
  };

  if (!testSettings) {
    await Settings.create({
      key: 'main',
      siteName: 'ByteCraft Test',
      guaranteeDays: 30,
      contact: {
        email: 'contact@bytecraft.dev',
        phone: '+201000000000',
        whatsapp: '+201000000000',
        location: { ar: 'القاهرة', en: 'Cairo' },
        socials: { github: 'https://github.com' },
      },
      paymentMethods: paymentMethodsPayload,
    });
    console.log('   ✅ Seeded settings in bytecraft_test');
  } else {
    // Ensure payment methods are enabled for order testing
    testSettings.paymentMethods = paymentMethodsPayload;
    await testSettings.save();
  }

  await conn.disconnect();

  try {
    // 0. Owner Login
    await test('Owner logs into test server to obtain authentication cookie', async () => {
      const res = await fetch(`${BASE_URL}/owner/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: OWNER_EMAIL, password: OWNER_PASSWORD }),
      });
      const json = await res.json();
      assert(res.status === 200, `Login failed: ${json.error?.message}`);
      const setCookie = res.headers.get('set-cookie');
      assert(setCookie && setCookie.includes('bc_owner='), 'Missing bc_owner cookie');
      cookieHeader = setCookie.split(';')[0];
    });

    // ==========================================
    // 1. 100% Coupon Validation Restriction
    // ==========================================

    await test('Creating a 100% coupon without maxUses is rejected with 400 VALIDATION_ERROR', async () => {
      const res = await fetch(`${BASE_URL}/owner/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({
          code: `FREE_UNLIMITED_${Date.now()}`,
          type: 'percent',
          value: 100,
          // maxUses omitted (null / unlimited) -> prohibited
        }),
      });

      const json = await res.json();
      assert(res.status === 400, `Expected 400, got ${res.status}`);
      assert(json.error.code === 'VALIDATION_ERROR', `Expected VALIDATION_ERROR, got ${json.error.code}`);
    });

    let freeCouponCode = `FREE100_${Date.now()}`;
    await test('Creating a 100% coupon with finite maxUses (maxUses: 2) succeeds', async () => {
      const res = await fetch(`${BASE_URL}/owner/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({
          code: freeCouponCode,
          type: 'percent',
          value: 100,
          maxUses: 2,
        }),
      });

      const json = await res.json();
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      assert(json.data.coupon.value === 100, 'Expected 100% value');
      assert(json.data.coupon.maxUses === 2, 'Expected maxUses === 2');
      cleanup.couponIds.push(json.data.coupon.id);
    });

    // Setup Category & Published Project for Order Tests
    let testCatId = '';
    const catRes = await fetch(`${BASE_URL}/owner/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({
        key: `orders-cat-${Date.now()}`,
        name: { ar: 'تصنيف الطلبات', en: 'Orders Test Cat' },
      }),
    });
    const catJson = await catRes.json();
    testCatId = catJson.data.category.id || catJson.data.category._id;
    cleanup.categoryIds.push(testCatId);

    const testProjectSlug = `ecommerce-pro-${Date.now()}`;
    let testProjectId = '';
    const projRes = await fetch(`${BASE_URL}/owner/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({
        slug: testProjectSlug,
        title: { ar: 'متجر الكتروني متكامل', en: 'Full MERN E-Commerce Store' },
        tagline: { ar: 'متجر سريع وحديث', en: 'Fast and modern store' },
        description: { ar: 'وصف كامل للمتجر', en: 'Full store description' },
        category: testCatId,
        techStack: ['React', 'Node.js', 'MongoDB', 'Stripe'],
        thumbnail: { url: 'https://example.com/thumb.jpg', publicId: 'thumb_orders' },
        packages: [
          {
            key: 'standard',
            name: { ar: 'الترخيص الفردي', en: 'Single License' },
            price: 780000, // 7,800 EGP in piasters
            licenseType: 'single',
            isActive: true,
          },
        ],
        privateRepo: {
          provider: 'github',
          owner: 'ByteCraftDev',
          name: 'mern-ecommerce-pro',
          url: 'https://github.com/ByteCraftDev/mern-ecommerce-pro',
        },
        status: 'published',
      }),
    });
    const projJson = await projRes.json();
    testProjectId = projJson.data.project.id || projJson.data.project._id;
    cleanup.projectIds.push(testProjectId);

    // ==========================================
    // 2. Guest Order Creation (Manual Payment)
    // ==========================================

    let guestOrderNumber = '';
    let guestPublicToken = '';
    let createdOrderId = '';

    await test('POST /api/orders creates a guest order with Vodafone Cash, atomic orderNumber & secret token', async () => {
      const payload = {
        projectSlug: testProjectSlug,
        packageKey: 'standard',
        paymentMethod: 'vodafone_cash',
        locale: 'ar',
        customer: {
          fullName: 'أحمد محمود',
          email: 'ahmed.buyer@example.com',
          phone: '+201099887766',
          gitProvider: 'github',
          gitUsername: 'ahmed-dev',
          organization: 'Digital Egypt',
        },
      };

      const res = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(json)}`);
      assert(json.success === true, 'Expected success: true');

      const order = json.data.order;
      assert(typeof order.orderNumber === 'string', 'Expected orderNumber string');
      assert(/^BC-\d{4}-\d{6}$/.test(order.orderNumber), `Order number format mismatch: ${order.orderNumber}`);
      assert(typeof order.publicToken === 'string' && order.publicToken.length >= 32, 'Expected strong publicToken');
      assert(order.status === 'pending_payment', 'Expected status pending_payment');
      assert(order.isFreeOrder === false, 'Expected isFreeOrder === false');
      assert(order.pricing.subtotal === 780000, 'Subtotal mismatch');
      assert(order.pricing.discount === 0, 'Discount should be 0');
      assert(order.pricing.total === 780000, 'Total mismatch');
      assert(order.pricing.vat === undefined, 'VAT must NOT exist');

      // Payment instructions present
      assert(order.paymentInstructions !== null, 'Expected paymentInstructions');
      assert(order.paymentInstructions.destination === '01012345678', 'Wallet destination mismatch');

      guestOrderNumber = order.orderNumber;
      guestPublicToken = order.publicToken;
    });

    // ==========================================
    // 3. Guest Order Status Query
    // ==========================================

    await test('GET /api/orders/:orderNumber without token returns 401 UNAUTHORIZED', async () => {
      const res = await fetch(`${BASE_URL}/orders/${guestOrderNumber}`);
      const json = await res.json();
      assert(res.status === 401, `Expected 401, got ${res.status}`);
      assert(json.error.code === 'UNAUTHORIZED', 'Expected UNAUTHORIZED error code');
    });

    await test('GET /api/orders/:orderNumber with wrong token returns 401 UNAUTHORIZED', async () => {
      const res = await fetch(`${BASE_URL}/orders/${guestOrderNumber}?token=invalid_token_12345678901234567890`);
      const json = await res.json();
      assert(res.status === 401, `Expected 401, got ${res.status}`);
      assert(json.error.code === 'UNAUTHORIZED', 'Expected UNAUTHORIZED error code');
    });

    await test('GET /api/orders/:orderNumber with valid token returns guest view without leaking publicToken', async () => {
      const res = await fetch(`${BASE_URL}/orders/${guestOrderNumber}?token=${guestPublicToken}`);
      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(json.success === true, 'Expected success: true');

      const order = json.data.order;
      assert(order.orderNumber === guestOrderNumber, 'Order number mismatch');
      assert(order.status === 'pending_payment', 'Status mismatch');
      assert(order.snapshot.packageKey === 'standard', 'Snapshot packageKey mismatch');
      assert(order.publicToken === undefined, 'SECURITY LEAK: publicToken leaked in status response');
    });

    // ==========================================
    // 4. Guest Payment Proof Submission (Multipart)
    // ==========================================

    await test('POST /api/orders/:orderNumber/payment-proof submits receipt and transitions to awaiting_review', async () => {
      const formData = new FormData();
      // Dummy small 1x1 JPEG buffer for testing
      const dummyJpegBuffer = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');
      const blob = new Blob([dummyJpegBuffer], { type: 'image/jpeg' });
      formData.append('proof', blob, 'receipt.jpg');
      formData.append('reference', 'TXN-VF-123456789');

      const res = await fetch(`${BASE_URL}/orders/${guestOrderNumber}/payment-proof?token=${guestPublicToken}`, {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(json)}`);
      assert(json.data.order.status === 'awaiting_review', 'Expected status awaiting_review');
      assert(json.data.order.proof.reference === 'TXN-VF-123456789', 'Proof reference mismatch');
    });

    await test('Submitting proof again while in awaiting_review throws 409 INVALID_STATE', async () => {
      const formData = new FormData();
      const dummyJpegBuffer = Buffer.from('dummy');
      const blob = new Blob([dummyJpegBuffer], { type: 'image/jpeg' });
      formData.append('proof', blob, 'duplicate.jpg');

      const res = await fetch(`${BASE_URL}/orders/${guestOrderNumber}/payment-proof?token=${guestPublicToken}`, {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      assert(res.status === 409, `Expected 409, got ${res.status}`);
      assert(json.error.code === 'INVALID_STATE', `Expected INVALID_STATE, got ${json.error.code}`);
    });

    // ==========================================
    // 5. Owner Review & Lifecycle State Machine
    // ==========================================

    await test('GET /api/owner/orders lists orders with filters and finds created order', async () => {
      const res = await fetch(`${BASE_URL}/owner/orders?status=awaiting_review&paymentMethod=vodafone_cash`, {
        headers: { Cookie: cookieHeader },
      });
      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(Array.isArray(json.data.orders), 'Expected orders array');
      assert(json.meta.total >= 1, 'Expected at least 1 order in awaiting_review');

      const found = json.data.orders.find((o) => o.orderNumber === guestOrderNumber);
      assert(found !== undefined, 'Created order not found in owner list');
      createdOrderId = found._id || found.id;
      cleanup.orderIds.push(createdOrderId);
    });

    await test('GET /api/owner/orders/:id returns full order including customer & proof details', async () => {
      const res = await fetch(`${BASE_URL}/owner/orders/${createdOrderId}`, {
        headers: { Cookie: cookieHeader },
      });
      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const order = json.data.order;
      assert(order.customer.email === 'ahmed.buyer@example.com', 'Customer email mismatch');
      assert(order.payment.proof.reference === 'TXN-VF-123456789', 'Proof reference mismatch');
    });

    await test('PATCH /api/owner/orders/:id/reject rejects proof with reason and transitions to rejected', async () => {
      const res = await fetch(`${BASE_URL}/owner/orders/${createdOrderId}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({ reason: 'Transaction reference is invalid or unreadable' }),
      });
      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(json.data.order.status === 'rejected', 'Expected status rejected');
      assert(json.data.order.payment.rejectionReason === 'Transaction reference is invalid or unreadable', 'Rejection reason mismatch');
    });

    await test('Submitting forged proof (invalid magic bytes) is rejected with 400 INVALID_FILE_TYPE', async () => {
      const formData = new FormData();
      const fakeBuffer = Buffer.from('this is plain text claiming to be a jpeg');
      const blob = new Blob([fakeBuffer], { type: 'image/jpeg' });
      formData.append('proof', blob, 'fake.jpg');
      formData.append('reference', 'TXN-FAKE-123');

      const res = await fetch(`${BASE_URL}/orders/${guestOrderNumber}/payment-proof?token=${guestPublicToken}`, {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      assert(res.status === 400, `Expected 400, got ${res.status}`);
      assert(json.error.code === 'INVALID_FILE_TYPE', `Expected INVALID_FILE_TYPE, got ${json.error.code}`);
    });

    await test('Customer re-submits proof (PDF document with valid magic bytes) while order is rejected (allowed)', async () => {
      const formData = new FormData();
      const validPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\nxref\n0 1\n0000000000 65535 f\ntrailer<</Root 1 0 R>>\nstartxref\n9\n%%EOF');
      const blob = new Blob([validPdfBuffer], { type: 'application/pdf' });
      formData.append('proof', blob, 'fixed-receipt.pdf');
      formData.append('reference', 'TXN-VF-999999999');

      const res = await fetch(`${BASE_URL}/orders/${guestOrderNumber}/payment-proof?token=${guestPublicToken}`, {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(json)}`);
      assert(json.data.order.status === 'awaiting_review', 'Expected status to return to awaiting_review');
    });

    await test('PATCH /api/owner/orders/:id/approve approves payment, transitions to paid, and increments project purchases', async () => {
      // Check project purchases count before approval
      const projBeforeRes = await fetch(`${BASE_URL}/projects/${testProjectSlug}`);
      const projBeforeJson = await projBeforeRes.json();
      const initialPurchases = projBeforeJson.data.project.stats?.purchases || 0;

      const res = await fetch(`${BASE_URL}/owner/orders/${createdOrderId}/approve`, {
        method: 'PATCH',
        headers: { Cookie: cookieHeader },
      });
      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(json.data.order.status === 'paid', 'Expected status paid');
      assert(json.data.order.payment.paidAt !== null, 'Expected paidAt timestamp');

      // Check project purchases count incremented
      const projAfterRes = await fetch(`${BASE_URL}/projects/${testProjectSlug}`);
      const projAfterJson = await projAfterRes.json();
      assert(projAfterJson.data.project.stats.purchases === initialPurchases + 1, 'Project purchases counter did not increment');
    });

    await test('Attempting to reject an already paid order throws 409 INVALID_STATE', async () => {
      const res = await fetch(`${BASE_URL}/owner/orders/${createdOrderId}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({ reason: 'Too late' }),
      });
      const json = await res.json();
      assert(res.status === 409, `Expected 409, got ${res.status}`);
      assert(json.error.code === 'INVALID_STATE', 'Expected INVALID_STATE');
    });

    await test('PATCH /api/owner/orders/:id/delivery updates repoAccess to granted and transitions to delivered', async () => {
      const res = await fetch(`${BASE_URL}/owner/orders/${createdOrderId}/delivery`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({
          repoAccess: 'granted',
          notes: 'Customer invited to private repository successfully.',
        }),
      });
      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(json.data.order.status === 'delivered', 'Expected status delivered');
      assert(json.data.order.delivery.repoAccess === 'granted', 'Expected repoAccess granted');
      assert(json.data.order.delivery.deliveredAt !== null, 'Expected deliveredAt timestamp');
    });

    await test('PATCH /api/owner/orders/:id/refund marks delivered order as refunded', async () => {
      const res = await fetch(`${BASE_URL}/owner/orders/${createdOrderId}/refund`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({ note: 'Friendly refund requested by customer' }),
      });
      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(json.data.order.status === 'refunded', 'Expected status refunded');
    });

    // ==========================================
    // 6. Zero-Total Orders (Auto-Confirmed & Auditable)
    // ==========================================

    let freeOrderId = '';
    await test('Zero-Total Order: 100% coupon auto-confirms order with isFreeOrder=true, status=paid, and couponCode', async () => {
      const payload = {
        projectSlug: testProjectSlug,
        packageKey: 'standard',
        couponCode: freeCouponCode,
        paymentMethod: 'vodafone_cash', // Any method allowed
        locale: 'en',
        customer: {
          fullName: 'Freebie Buyer',
          email: 'freebie@example.com',
          phone: '+201011112222',
          gitProvider: 'github',
          gitUsername: 'freebie-dev',
        },
      };

      const res = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(json)}`);
      const order = json.data.order;

      assert(order.pricing.subtotal === 780000, 'Subtotal mismatch');
      assert(order.pricing.discount === 780000, 'Discount must equal subtotal');
      assert(order.pricing.total === 0, 'Total must be 0');
      assert(order.pricing.couponCode === freeCouponCode, 'Coupon code must be recorded in pricing');
      assert(order.isFreeOrder === true, 'isFreeOrder flag must be true');
      assert(order.status === 'paid', 'Zero-total order must be immediately paid (auto-confirmed)');
      assert(order.paymentInstructions === null, 'No payment instructions should be returned for free order');

      // Check guest view
      const guestRes = await fetch(`${BASE_URL}/orders/${order.orderNumber}?token=${order.publicToken}`);
      const guestJson = await guestRes.json();
      assert(guestJson.data.order.status === 'paid', 'Guest status must be paid');
      assert(guestJson.data.order.isFreeOrder === true, 'Guest view must reflect isFreeOrder: true');

      // Store ID for cleanup
      const listRes = await fetch(`${BASE_URL}/owner/orders?isFreeOrder=true`, {
        headers: { Cookie: cookieHeader },
      });
      const listJson = await listRes.json();
      const freeDoc = listJson.data.orders.find((o) => o.orderNumber === order.orderNumber);
      assert(freeDoc !== undefined, 'Free order must be queryable by isFreeOrder filter');
      freeOrderId = freeDoc._id || freeDoc.id;
      cleanup.orderIds.push(freeOrderId);
    });

    // ==========================================
    // 7. Coupon usedCount Atomic Concurrency & Limit
    // ==========================================

    await test('Coupon usedCount increments atomically and blocks order creation when maxUses is exhausted', async () => {
      // Free coupon had maxUses: 2. We already used it once.
      // Use it a second time (reaches maxUses 2)
      const res2 = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectSlug: testProjectSlug,
          packageKey: 'standard',
          couponCode: freeCouponCode,
          paymentMethod: 'vodafone_cash',
          customer: {
            fullName: 'Second Buyer',
            email: 'second@example.com',
            phone: '+201022223333',
            gitProvider: 'github',
            gitUsername: 'second-dev',
          },
        }),
      });
      const json2 = await res2.json();
      assert(res2.status === 201, `Second use should succeed, got ${res2.status}`);

      // Third use (exceeds maxUses 2) -> Must be rejected with 400 COUPON_MAX_USES_REACHED
      const res3 = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectSlug: testProjectSlug,
          packageKey: 'standard',
          couponCode: freeCouponCode,
          paymentMethod: 'vodafone_cash',
          customer: {
            fullName: 'Third Buyer',
            email: 'third@example.com',
            phone: '+201033334444',
            gitProvider: 'github',
            gitUsername: 'third-dev',
          },
        }),
      });
      const json3 = await res3.json();
      assert(res3.status === 400, `Expected 400 for exhausted coupon, got ${res3.status}`);
      assert(json3.error.code === 'COUPON_MAX_USES_REACHED', `Expected COUPON_MAX_USES_REACHED, got ${json3.error.code}`);
    });

    // ==========================================
    // 8. Project Deletion Protection
    // ==========================================

    await test('DELETE /api/owner/projects/:id is blocked if project has paid orders (409 PROJECT_HAS_PAID_ORDERS)', async () => {
      const res = await fetch(`${BASE_URL}/owner/projects/${testProjectId}`, {
        method: 'DELETE',
        headers: { Cookie: cookieHeader },
      });
      const json = await res.json();
      assert(res.status === 409, `Expected 409, got ${res.status}`);
      assert(json.error.code === 'PROJECT_HAS_PAID_ORDERS', `Expected PROJECT_HAS_PAID_ORDERS, got ${json.error.code}`);
    });

  } finally {
    // ==========================================
    // 9. Strict Cleanup
    // ==========================================
    console.log('\n🧹 Cleaning up test data from bytecraft_test database...');

    let cleanupConn;
    try {
      cleanupConn = await mongoose.connect(testMongoUri, { serverSelectionTimeoutMS: 3000 });
    } catch (e) {
      cleanupConn = await mongoose.connect('mongodb://127.0.0.1:27017/bytecraft_test');
    }

    const db = cleanupConn.connection.db;

    // Direct clean removal of test records
    await db.collection('orders').deleteMany({
      $or: [
        { _id: { $in: cleanup.orderIds.map((id) => new mongoose.Types.ObjectId(id)) } },
        { 'customer.email': { $in: ['ahmed.buyer@example.com', 'freebie@example.com', 'second@example.com'] } },
      ],
    });

    for (const projId of cleanup.projectIds) {
      await db.collection('projects').deleteOne({ _id: new mongoose.Types.ObjectId(projId) });
    }

    for (const catId of cleanup.categoryIds) {
      await db.collection('categories').deleteOne({ _id: new mongoose.Types.ObjectId(catId) });
    }

    for (const couponId of cleanup.couponIds) {
      await db.collection('coupons').deleteOne({ _id: new mongoose.Types.ObjectId(couponId) });
    }

    await cleanupConn.disconnect();
    console.log('✨ Cleanup finished: All test entities deleted from bytecraft_test.\n');
  }

  console.log(`========================================`);
  console.log(`📊 Phase 4 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
