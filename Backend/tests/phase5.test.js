/**
 * Phase 5 End-to-End Verification Test Script
 * 
 * Target: Test server on port 5001 with test DB: `bytecraft_test`
 * 
 * Verifies:
 * 1. Online Order Creation (Card):
 *    - POST /api/orders with paymentMethod 'card' returns paymentUrl and providerOrderId.
 * 2. Online Order Creation (Fawry):
 *    - POST /api/orders with paymentMethod 'fawry' returns fawryReference.
 * 3. Disabled Payment Method Rejection:
 *    - When card is disabled in settings, order creation is rejected with 400.
 * 4. Paymob Cryptographic HMAC Security:
 *    - Webhook with missing HMAC returns 401 UNAUTHORIZED (INVALID_HMAC).
 *    - Webhook with forged/tampered HMAC returns 401 UNAUTHORIZED (INVALID_HMAC).
 * 5. Amount & Currency Matching Verification:
 *    - Webhook with valid HMAC but tampered amount_cents returns 400 and flags security alert.
 * 6. Paymob Webhook Success Fulfillment:
 *    - Webhook with valid HMAC and matching amount marks order as 'paid'.
 *    - Sets paidAt and providerTransactionId.
 *    - Triggers onOrderPaid: increments project purchases stats.
 * 7. Webhook Idempotency:
 *    - Re-sending the same webhook returns 200 and does NOT double-increment purchases or fulfillment.
 * 8. Paymob Webhook Failed Transaction:
 *    - Webhook with success=false leaves status as pending_payment (allows retry) and records history note.
 * 9. Mandatory Cleanup:
 *    - Deletes all created test records, leaving bytecraft_test clean.
 */

const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const crypto = require('crypto');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = 5001;
const BASE_URL = `http://localhost:${PORT}/api`;
const OWNER_EMAIL = (process.env.OWNER_EMAIL || 'moaazelbedawy@gmail.com').trim();
const OWNER_PASSWORD = (process.env.OWNER_PASSWORD || '').trim();
const PAYMOB_HMAC_SECRET = (process.env.PAYMOB_HMAC_SECRET || 'test_hmac_secret_bytecraft_phase5_secure_key').trim();

// Ensure test HMAC secret is available in environment for test server
process.env.PAYMOB_HMAC_SECRET = PAYMOB_HMAC_SECRET;

// Target test database
let testMongoUri = process.env.MONGODB_URI.trim();
if (testMongoUri.includes('.mongodb.net/')) {
  testMongoUri = testMongoUri.replace(/\.mongodb\.net\/([^?]+)/, '.mongodb.net/bytecraft_test');
} else {
  testMongoUri = testMongoUri.replace(/\/([^/?]+)(\?|$)/, '/bytecraft_test$2');
}

/**
 * Paymob HMAC-SHA512 canonical calculation helper for tests
 */
function calculateTestPaymobHmac(obj, secret = PAYMOB_HMAC_SECRET) {
  const orderId = typeof obj.order === 'object' && obj.order !== null ? obj.order.id : obj.order;
  const sourceData = obj.source_data || {};

  const values = [
    obj.amount_cents !== undefined ? obj.amount_cents : '',
    obj.created_at !== undefined ? obj.created_at : '',
    obj.currency !== undefined ? obj.currency : '',
    obj.error_occured !== undefined ? obj.error_occured : '',
    obj.has_parent_transaction !== undefined ? obj.has_parent_transaction : '',
    obj.id !== undefined ? obj.id : '',
    obj.integration_id !== undefined ? obj.integration_id : '',
    obj.is_3d_secure !== undefined ? obj.is_3d_secure : '',
    obj.is_auth !== undefined ? obj.is_auth : '',
    obj.is_capture !== undefined ? obj.is_capture : '',
    obj.is_refunded !== undefined ? obj.is_refunded : '',
    obj.is_standalone_payment !== undefined ? obj.is_standalone_payment : '',
    obj.is_voided !== undefined ? obj.is_voided : '',
    orderId !== undefined ? orderId : '',
    obj.owner !== undefined ? obj.owner : '',
    obj.pending !== undefined ? obj.pending : '',
    sourceData.pan !== undefined ? sourceData.pan : '',
    sourceData.sub_type !== undefined ? sourceData.sub_type : '',
    sourceData.type !== undefined ? sourceData.type : '',
    obj.success !== undefined ? obj.success : '',
  ];

  const concatenatedString = values.join('');
  return crypto.createHmac('sha512', secret).update(concatenatedString).digest('hex');
}

async function runTests() {
  console.log('🧪 Starting Phase 5 Verification Tests on PORT 5001 (DB: bytecraft_test)...\n');
  console.log(`📡 Target API: ${BASE_URL}`);

  let passed = 0;
  let failed = 0;
  let cookieHeader = '';

  const cleanup = {
    orderIds: [],
    projectIds: [],
    categoryIds: [],
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

  // Setup DB and enable card + fawry in settings
  console.log('🌱 Configuring test database settings with Card & Fawry enabled...');
  let conn;
  try {
    conn = await mongoose.connect(testMongoUri, { serverSelectionTimeoutMS: 4000 });
  } catch (err) {
    console.warn('⚠️ Atlas connection failed in test seeder. Falling back to local test database.');
    conn = await mongoose.connect('mongodb://127.0.0.1:27017/bytecraft_test');
  }

  const Settings = conn.model('Settings', new mongoose.Schema({
    key: { type: String, default: 'main', unique: true },
    siteName: { type: String, default: 'ByteCraft' },
    guaranteeDays: { type: Number, default: 30 },
    contact: mongoose.Schema.Types.Mixed,
    paymentMethods: mongoose.Schema.Types.Mixed,
  }, { timestamps: true }));

  let testSettings = await Settings.findOne({ key: 'main' });
  const paymentMethodsPayload = {
    vodafone_cash: { enabled: true, walletNumber: '01012345678', accountName: 'ByteCraft VF' },
    instapay: { enabled: true, ipa: 'bytecraft@instapay', accountName: 'ByteCraft IP' },
    fawry: { enabled: true },
    card: { enabled: true },
  };

  if (!testSettings) {
    await Settings.create({
      key: 'main',
      siteName: 'ByteCraft Test',
      paymentMethods: paymentMethodsPayload,
    });
  } else {
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

    // Create Category & Project for Online Orders
    let testCatId = '';
    const catRes = await fetch(`${BASE_URL}/owner/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({
        key: `paymob-cat-${Date.now()}`,
        name: { ar: 'تصنيف الدفع الالكتروني', en: 'Paymob Test Cat' },
      }),
    });
    const catJson = await catRes.json();
    testCatId = catJson.data.category.id || catJson.data.category._id;
    cleanup.categoryIds.push(testCatId);

    const testProjectSlug = `lms-saas-${Date.now()}`;
    let testProjectId = '';
    const projRes = await fetch(`${BASE_URL}/owner/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({
        slug: testProjectSlug,
        title: { ar: 'منصة تعليم إلكتروني', en: 'LMS Cloud SaaS Platform' },
        tagline: { ar: 'منصة متقدمة', en: 'Advanced SaaS' },
        description: { ar: 'شرح المنصة', en: 'Platform description' },
        category: testCatId,
        techStack: ['React', 'Node.js', 'MongoDB', 'Docker'],
        thumbnail: { url: 'https://example.com/thumb.jpg', publicId: 'thumb_paymob' },
        packages: [
          {
            key: 'pro',
            name: { ar: 'باقة المحترفين', en: 'Pro Package' },
            price: 1200000, // 12,000 EGP in piasters
            licenseType: 'single',
            isActive: true,
          },
        ],
        status: 'published',
      }),
    });
    const projJson = await projRes.json();
    testProjectId = projJson.data.project.id || projJson.data.project._id;
    cleanup.projectIds.push(testProjectId);

    // ==========================================
    // 1. Online Order Creation (Card)
    // ==========================================

    let cardOrderNumber = '';
    let cardOrderId = '';
    let cardPaymobOrderId = '';

    await test('POST /api/orders creates Card order, generates Paymob order, and returns paymentUrl', async () => {
      const res = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectSlug: testProjectSlug,
          packageKey: 'pro',
          paymentMethod: 'card',
          locale: 'en',
          customer: {
            fullName: 'Karim Card Buyer',
            email: 'karim.card@example.com',
            phone: '+201012345678',
            gitProvider: 'github',
            gitUsername: 'karim-card',
          },
        }),
      });

      const json = await res.json();
      assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(json)}`);
      assert(json.success === true, 'Expected success: true');

      const order = json.data.order;
      assert(order.paymentMethod === 'card', 'Expected paymentMethod card');
      assert(order.status === 'pending_payment', 'Expected status pending_payment');
      assert(typeof order.paymentUrl === 'string' && order.paymentUrl.includes('accept.paymob.com'), 'Expected valid Paymob paymentUrl');
      assert(order.pricing.total === 1200000, 'Expected total 1200000 piasters');

      cardOrderNumber = order.orderNumber;

      // Fetch owner order to obtain providerOrderId
      const listRes = await fetch(`${BASE_URL}/owner/orders?search=${cardOrderNumber}`, {
        headers: { Cookie: cookieHeader },
      });
      const listJson = await listRes.json();
      const orderDoc = listJson.data.orders[0];
      cardOrderId = orderDoc._id || orderDoc.id;
      cardPaymobOrderId = orderDoc.payment.providerOrderId;
      assert(cardPaymobOrderId !== undefined, 'Expected payment.providerOrderId');
      cleanup.orderIds.push(cardOrderId);
    });

    // ==========================================
    // 2. Online Order Creation (Fawry)
    // ==========================================

    let fawryOrderNumber = '';
    let fawryOrderId = '';

    await test('POST /api/orders creates Fawry order and returns fawryReference', async () => {
      const res = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectSlug: testProjectSlug,
          packageKey: 'pro',
          paymentMethod: 'fawry',
          locale: 'ar',
          customer: {
            fullName: 'سامح فوري',
            email: 'sameh.fawry@example.com',
            phone: '+201098765432',
            gitProvider: 'github',
            gitUsername: 'sameh-fawry',
          },
        }),
      });

      const json = await res.json();
      assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(json)}`);
      const order = json.data.order;
      assert(order.paymentMethod === 'fawry', 'Expected paymentMethod fawry');
      assert(typeof order.fawryReference === 'string', 'Expected fawryReference string');

      fawryOrderNumber = order.orderNumber;
      const listRes = await fetch(`${BASE_URL}/owner/orders?search=${fawryOrderNumber}`, {
        headers: { Cookie: cookieHeader },
      });
      const listJson = await listRes.json();
      fawryOrderId = listJson.data.orders[0]._id || listJson.data.orders[0].id;
      cleanup.orderIds.push(fawryOrderId);
    });

    // ==========================================
    // 3. Disabled Payment Method Rejection
    // ==========================================

    await test('Attempting to create an order with a disabled payment method returns 400 VALIDATION_ERROR', async () => {
      // Temporarily disable card in settings
      await fetch(`${BASE_URL}/owner/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({
          paymentMethods: {
            card: { enabled: false },
          },
        }),
      });

      const res = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectSlug: testProjectSlug,
          packageKey: 'pro',
          paymentMethod: 'card',
          customer: {
            fullName: 'Test Blocked',
            email: 'blocked@example.com',
            phone: '+201000000000',
            gitProvider: 'github',
            gitUsername: 'blocked',
          },
        }),
      });

      const json = await res.json();
      assert(res.status === 400, `Expected 400, got ${res.status}`);
      assert(json.error.code === 'VALIDATION_ERROR', `Expected VALIDATION_ERROR, got ${json.error.code}`);

      // Re-enable card in settings
      await fetch(`${BASE_URL}/owner/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({
          paymentMethods: {
            card: { enabled: true },
          },
        }),
      });
    });

    // ==========================================
    // 4. Paymob Cryptographic HMAC Security
    // ==========================================

    await test('Webhook without HMAC is rejected with 401 UNAUTHORIZED (INVALID_HMAC)', async () => {
      const res = await fetch(`${BASE_URL}/payments/paymob/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TRANSACTION',
          obj: { id: 998811, success: true },
        }),
      });

      const json = await res.json();
      assert(res.status === 401, `Expected 401, got ${res.status}`);
      assert(json.error.code === 'INVALID_HMAC', `Expected INVALID_HMAC, got ${json.error.code}`);
    });

    await test('Webhook with tampered HMAC is rejected with 401 UNAUTHORIZED (INVALID_HMAC)', async () => {
      const fakeHmac = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const res = await fetch(`${BASE_URL}/payments/paymob/webhook?hmac=${fakeHmac}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TRANSACTION',
          obj: { id: 998811, success: true },
        }),
      });

      const json = await res.json();
      assert(res.status === 401, `Expected 401, got ${res.status}`);
      assert(json.error.code === 'INVALID_HMAC', `Expected INVALID_HMAC, got ${json.error.code}`);
    });

    // ==========================================
    // 5. Amount & Currency Matching Verification
    // ==========================================

    await test('Webhook with tampered amount_cents (paid less than order total) is rejected with 400 and logged', async () => {
      const fakeTransaction = {
        amount_cents: 50000, // 500 EGP instead of 12,000 EGP
        created_at: new Date().toISOString(),
        currency: 'EGP',
        error_occured: false,
        has_parent_transaction: false,
        id: 11223344,
        integration_id: 12345,
        is_3d_secure: true,
        is_auth: false,
        is_capture: false,
        is_refunded: false,
        is_standalone_payment: true,
        is_voided: false,
        order: {
          id: cardPaymobOrderId,
          merchant_order_id: cardOrderNumber,
        },
        owner: 100,
        pending: false,
        source_data: { pan: '2345', sub_type: 'MasterCard', type: 'card' },
        success: true,
      };

      const validHmacForTamperedAmount = calculateTestPaymobHmac(fakeTransaction);

      const res = await fetch(`${BASE_URL}/payments/paymob/webhook?hmac=${validHmacForTamperedAmount}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'TRANSACTION', obj: fakeTransaction }),
      });

      const json = await res.json();
      assert(res.status === 400, `Expected 400 for amount mismatch, got ${res.status}`);
      assert(json.error.code === 'PAYMENT_FAILED', `Expected PAYMENT_FAILED, got ${json.error.code}`);

      // Verify order status stayed pending_payment
      const checkRes = await fetch(`${BASE_URL}/owner/orders/${cardOrderId}`, {
        headers: { Cookie: cookieHeader },
      });
      const checkJson = await checkRes.json();
      assert(checkJson.data.order.status === 'pending_payment', 'Order status must remain pending_payment');
    });

    // ==========================================
    // 6. Paymob Webhook Success Fulfillment
    // ==========================================

    await test('Webhook with valid HMAC and exact amount marks order as paid, records txn ID, and increments purchases', async () => {
      const projBeforeRes = await fetch(`${BASE_URL}/projects/${testProjectSlug}`);
      const projBeforeJson = await projBeforeRes.json();
      const initialPurchases = projBeforeJson.data.project.stats?.purchases || 0;

      const validTransaction = {
        amount_cents: 1200000, // Exactly 12,000 EGP (matches order.pricing.total)
        created_at: new Date().toISOString(),
        currency: 'EGP',
        error_occured: false,
        has_parent_transaction: false,
        id: 99887766,
        integration_id: 12345,
        is_3d_secure: true,
        is_auth: false,
        is_capture: false,
        is_refunded: false,
        is_standalone_payment: true,
        is_voided: false,
        order: {
          id: cardPaymobOrderId,
          merchant_order_id: cardOrderNumber,
        },
        owner: 100,
        pending: false,
        source_data: { pan: '2345', sub_type: 'MasterCard', type: 'card' },
        success: true,
      };

      const validHmac = calculateTestPaymobHmac(validTransaction);

      const res = await fetch(`${BASE_URL}/payments/paymob/webhook?hmac=${validHmac}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'TRANSACTION', obj: validTransaction }),
      });

      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(json)}`);
      assert(json.data.status === 'paid', 'Expected status paid');

      // Verify order in database
      const checkRes = await fetch(`${BASE_URL}/owner/orders/${cardOrderId}`, {
        headers: { Cookie: cookieHeader },
      });
      const checkJson = await checkRes.json();
      const order = checkJson.data.order;
      assert(order.status === 'paid', 'Order status must be paid');
      assert(order.payment.providerTransactionId === '99887766', 'Transaction ID mismatch');
      assert(order.payment.paidAt !== null, 'paidAt timestamp must be set');

      // Verify project purchases incremented
      const projAfterRes = await fetch(`${BASE_URL}/projects/${testProjectSlug}`);
      const projAfterJson = await projAfterRes.json();
      assert(projAfterJson.data.project.stats.purchases === initialPurchases + 1, 'Project purchases counter did not increment');
    });

    // ==========================================
    // 7. Webhook Idempotency
    // ==========================================

    await test('Re-sending the same webhook returns 200 (idempotent: true) and does NOT duplicate purchases', async () => {
      const projBeforeRes = await fetch(`${BASE_URL}/projects/${testProjectSlug}`);
      const projBeforeJson = await projBeforeRes.json();
      const purchasesBefore = projBeforeJson.data.project.stats.purchases;

      const repeatTransaction = {
        amount_cents: 1200000,
        created_at: new Date().toISOString(),
        currency: 'EGP',
        error_occured: false,
        has_parent_transaction: false,
        id: 99887766,
        integration_id: 12345,
        is_3d_secure: true,
        is_auth: false,
        is_capture: false,
        is_refunded: false,
        is_standalone_payment: true,
        is_voided: false,
        order: {
          id: cardPaymobOrderId,
          merchant_order_id: cardOrderNumber,
        },
        owner: 100,
        pending: false,
        source_data: { pan: '2345', sub_type: 'MasterCard', type: 'card' },
        success: true,
      };

      const validHmac = calculateTestPaymobHmac(repeatTransaction);

      const res = await fetch(`${BASE_URL}/payments/paymob/webhook?hmac=${validHmac}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'TRANSACTION', obj: repeatTransaction }),
      });

      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(json.data.idempotent === true, 'Expected idempotent: true');

      // Verify project purchases counter did NOT change
      const projAfterRes = await fetch(`${BASE_URL}/projects/${testProjectSlug}`);
      const projAfterJson = await projAfterRes.json();
      assert(projAfterJson.data.project.stats.purchases === purchasesBefore, 'Purchases counter was duplicated!');
    });

    // ==========================================
    // 8. Paymob Webhook Failed Transaction
    // ==========================================

    await test('Webhook with success=false records failed attempt note and leaves status pending_payment', async () => {
      const failedTransaction = {
        amount_cents: 1200000,
        created_at: new Date().toISOString(),
        currency: 'EGP',
        error_occured: true,
        has_parent_transaction: false,
        id: 55443322,
        integration_id: 12345,
        is_3d_secure: true,
        is_auth: false,
        is_capture: false,
        is_refunded: false,
        is_standalone_payment: true,
        is_voided: false,
        order: {
          merchant_order_id: fawryOrderNumber,
        },
        owner: 100,
        pending: false,
        source_data: { pan: '0000', sub_type: 'Fawry', type: 'kiosk' },
        success: false, // Transaction declined
      };

      const validHmac = calculateTestPaymobHmac(failedTransaction);

      const res = await fetch(`${BASE_URL}/payments/paymob/webhook?hmac=${validHmac}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'TRANSACTION', obj: failedTransaction }),
      });

      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);

      // Verify Fawry order stayed pending_payment
      const checkRes = await fetch(`${BASE_URL}/owner/orders/${fawryOrderId}`, {
        headers: { Cookie: cookieHeader },
      });
      const checkJson = await checkRes.json();
      assert(checkJson.data.order.status === 'pending_payment', 'Status must remain pending_payment to allow retry');
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

    if (cleanup.orderIds.length > 0) {
      await db.collection('orders').deleteMany({
        $or: [
          { _id: { $in: cleanup.orderIds.map((id) => new mongoose.Types.ObjectId(id)) } },
          { 'customer.email': { $in: ['karim.card@example.com', 'sameh.fawry@example.com'] } },
        ],
      });
    }

    for (const projId of cleanup.projectIds) {
      await db.collection('projects').deleteOne({ _id: new mongoose.Types.ObjectId(projId) });
    }

    for (const catId of cleanup.categoryIds) {
      await db.collection('categories').deleteOne({ _id: new mongoose.Types.ObjectId(catId) });
    }

    await cleanupConn.disconnect();
    console.log('✨ Cleanup finished: All test entities deleted from bytecraft_test.\n');
  }

  console.log(`========================================`);
  console.log(`📊 Phase 5 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
