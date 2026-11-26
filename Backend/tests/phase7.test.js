/**
 * Phase 7 Verification Tests: Hardening & Architectural Guarantees
 * 
 * Verifies:
 * 1. Paymob Webhook Non-Payable Allow-list:
 *    - Orders in 'refunded', 'cancelled', 'rejected', 'paid', 'delivered' stay unchanged
 *    - Returns 200 idempotent with warning logged.
 * 2. Expired Order Webhook Handling & Atomic Coupon Re-consumption:
 *    - Expired order transitioning to paid re-consumes coupon usedCount.
 *    - If coupon is exhausted in the interim (usedCount >= maxUses), order is still marked paid
 *      and an audit note is appended to statusHistory.
 * 3. Public Reviews Privacy Hardening:
 *    - Public review responses never leak orderNumber, email, phone, or token.
 *    - Reviewer name is masked to "Firstname L." format (e.g. "Mohamed A.").
 *    - Confirms isPublished default is true.
 * 4. Token Guess Limiter:
 *    - Rate limiter blocks requests to public token endpoints after 20 attempts.
 * 5. Production Environment Hardening (NODE_ENV=production):
 *    - Authorization: Bearer fallback is disabled in production (cookie-only).
 *    - Local disk upload fallback is disabled in production (throws explicit error).
 * 6. Mandatory Cleanup:
 *    - All test orders, coupons, reviews, and projects deleted.
 */

const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const crypto = require('crypto');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = 5001;
const BASE_URL = `http://localhost:${PORT}/api`;
const LOCAL_TEST_DB_URI = 'mongodb://127.0.0.1:27017/bytecraft_test';
let TEST_DB_URI = (process.env.MONGODB_URI || LOCAL_TEST_DB_URI).trim();
if (TEST_DB_URI.includes('.mongodb.net/')) {
  TEST_DB_URI = TEST_DB_URI.replace(/\.mongodb\.net\/([^?]+)/, '.mongodb.net/bytecraft_test');
} else {
  TEST_DB_URI = TEST_DB_URI.replace(/\/([^/?]+)(\?|$)/, '/bytecraft_test$2');
}
const PAYMOB_HMAC_SECRET = (
  process.env.PAYMOB_HMAC_SECRET || 'nexus_test_paymob_hmac_secret_local_only'
).trim();

// Calculate Paymob HMAC
function calculatePaymobHmac(obj, secret = PAYMOB_HMAC_SECRET) {
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

  const concatenatedString = values.map((val) => String(val)).join('');
  return crypto.createHmac('sha512', secret).update(concatenatedString).digest('hex');
}

// Clean test entities registry
const cleanup = {
  projectIds: [],
  categoryIds: [],
  couponIds: [],
  orderIds: [],
  reviewIds: [],
};

async function runTests() {
  console.log('🧪 Starting Phase 7 Hardening Verification Tests on PORT 5001 (DB: bytecraft_test)...\n');

  const SUITE_IP = `10.70.${Math.floor(Math.random() * 200) + 1}.77`;
  const nativeFetch = globalThis.fetch;
  const fetch = (url, options = {}) => {
    const headers = { ...(options.headers || {}) };
    if (!headers['x-test-ip'] && !headers['X-Test-IP']) {
      headers['x-test-ip'] = SUITE_IP;
    }
    return nativeFetch(url, { ...options, headers });
  };

  let passed = 0;
  let failed = 0;

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

  // Connect to DB directly (matching testServer.js) for model fixtures and assertions
  try {
    await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 3000 });
  } catch {
    await mongoose.connect(LOCAL_TEST_DB_URI);
  }
  const OrderModel = require('../src/models/Order');
  const ProjectModel = require('../src/models/Project');
  const CouponModel = require('../src/models/Coupon');
  const ReviewModel = require('../src/models/Review');
  const CategoryModel = require('../src/models/Category');

  // Seed baseline project
  const cat = await CategoryModel.create({
    name: { ar: 'تصنيف اختبار 7', en: 'Test Cat 7' },
    key: `test-cat-7-${Date.now()}`,
    isActive: true,
  });
  cleanup.categoryIds.push(cat._id);

  const proj = await ProjectModel.create({
    title: { ar: 'مشروع 7', en: 'Project 7' },
    tagline: { ar: 'شعار متقدم', en: 'Advanced tagline' },
    description: { ar: 'شرح المنصة', en: 'Platform description' },
    slug: `proj-7-${Date.now()}`,
    category: cat._id,
    techStack: ['Node.js', 'Express'],
    thumbnail: { url: 'https://example.com/thumb.jpg', publicId: 'thumb_7' },
    packages: [
      {
        key: 'starter',
        name: { ar: 'أساسي', en: 'Starter' },
        price: 50000,
        licenseType: 'single',
        isActive: true,
      },
    ],
    status: 'published',
  });
  cleanup.projectIds.push(proj._id);

  // ========================================================
  // 1. Non-payable Webhook Statuses Allow-list
  // ========================================================
  const nonPayableStatuses = ['refunded', 'cancelled', 'rejected', 'paid', 'delivered'];

  for (const status of nonPayableStatuses) {
    await test(`Paymob webhook ignores transition for order with non-payable status: "${status}"`, async () => {
      const orderNum = `ORD-7-NOPAY-${status.toUpperCase()}-${Date.now()}`;
      const paymobOrderId = `PM-NOPAY-${status}-${Date.now()}`;
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const testOrder = await OrderModel.create({
        orderNumber: orderNum,
        publicToken: tokenHash,
        locale: 'ar',
        project: proj._id,
        snapshot: {
          title: { ar: 'مشروع 7', en: 'Project 7' },
          slug: proj.slug,
          packageKey: 'starter',
          packageName: { ar: 'أساسي', en: 'Starter' },
          licenseType: 'single',
        },
        customer: {
          fullName: 'Ahmed Test',
          email: 'ahmed@test.com',
          phone: '01000000000',
          gitProvider: 'github',
          gitUsername: 'ahmed-test',
        },
        pricing: {
          currency: 'EGP',
          subtotal: 50000,
          discount: 0,
          total: 50000,
        },
        paymentMethod: 'card',
        status,
        payment: {
          provider: 'paymob',
          providerOrderId: paymobOrderId,
        },
        statusHistory: [{ status, at: new Date(), note: `Initial status ${status}` }],
      });
      cleanup.orderIds.push(testOrder._id);

      const txnId = Math.floor(Math.random() * 1000000) + 1000;
      const payloadObj = {
        id: txnId,
        amount_cents: 50000,
        success: true,
        pending: false,
        is_refunded: false,
        is_voided: false,
        currency: 'EGP',
        order: { id: paymobOrderId, merchant_order_id: orderNum },
        created_at: new Date().toISOString(),
      };

      const hmac = calculatePaymobHmac(payloadObj);

      const res = await fetch(`${BASE_URL}/payments/paymob/webhook?hmac=${hmac}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'TRANSACTION', obj: payloadObj }),
      });

      const json = await res.json();
      assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
      assert.strictEqual(json.data.idempotent, true, 'Expected idempotent: true');
      assert.strictEqual(json.data.status, status, `Status must remain ${status}`);

      // Verify DB entity remains untouched
      const dbOrder = await OrderModel.findById(testOrder._id);
      assert.strictEqual(dbOrder.status, status, `DB status must remain ${status}`);
    });
  }

  // ========================================================
  // 2. Expired Order Webhook Handling & Coupon Re-consumption
  // ========================================================

  await test('Expired order becomes paid and re-consumes available coupon atomically', async () => {
    const couponCode = `EXP-RECON-${Date.now()}`;
    const coupon = await CouponModel.create({
      code: couponCode,
      type: 'fixed',
      value: 10000,
      minSpend: 0,
      maxUses: 5,
      usedCount: 2, // 2 used out of 5
      isActive: true,
    });
    cleanup.couponIds.push(coupon._id);

    const orderNum = `ORD-7-EXP-AVAIL-${Date.now()}`;
    const paymobOrderId = `PM-EXP-AVAIL-${Date.now()}`;
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const expiredOrder = await OrderModel.create({
      orderNumber: orderNum,
      publicToken: tokenHash,
      locale: 'ar',
      project: proj._id,
      snapshot: {
        title: { ar: 'مشروع 7', en: 'Project 7' },
        slug: proj.slug,
        packageKey: 'starter',
        packageName: { ar: 'أساسي', en: 'Starter' },
        licenseType: 'single',
      },
      customer: {
        fullName: 'Khaled Test',
        email: 'khaled@test.com',
        phone: '01011111111',
        gitProvider: 'github',
        gitUsername: 'khaled-test',
      },
      pricing: {
        currency: 'EGP',
        subtotal: 50000,
        couponCode,
        discount: 10000,
        total: 40000,
      },
      paymentMethod: 'card',
      status: 'expired',
      payment: {
        provider: 'paymob',
        providerOrderId: paymobOrderId,
      },
      statusHistory: [{ status: 'expired', at: new Date(), note: 'Order expired' }],
    });
    cleanup.orderIds.push(expiredOrder._id);

    const txnId = Math.floor(Math.random() * 1000000) + 2000;
    const payloadObj = {
      id: txnId,
      amount_cents: 40000,
      success: true,
      pending: false,
      is_refunded: false,
      is_voided: false,
      currency: 'EGP',
      order: { id: paymobOrderId, merchant_order_id: orderNum },
      created_at: new Date().toISOString(),
    };

    const hmac = calculatePaymobHmac(payloadObj);

    const res = await fetch(`${BASE_URL}/payments/paymob/webhook?hmac=${hmac}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'TRANSACTION', obj: payloadObj }),
    });

    const json = await res.json();
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert.strictEqual(json.data.status, 'paid', 'Expired order must become paid');

    // Verify coupon usedCount was incremented from 2 to 3
    const updatedCoupon = await CouponModel.findById(coupon._id);
    assert.strictEqual(updatedCoupon.usedCount, 3, 'Coupon usedCount must increment to 3');

    // Verify DB order status is paid
    const updatedOrder = await OrderModel.findById(expiredOrder._id);
    assert.strictEqual(updatedOrder.status, 'paid');
  });

  await test('Expired order becomes paid when coupon exhausted, notes exhaustion without breaking payment', async () => {
    const couponCode = `EXP-EXHAUST-${Date.now()}`;
    const coupon = await CouponModel.create({
      code: couponCode,
      type: 'fixed',
      value: 10000,
      minSpend: 0,
      maxUses: 2,
      usedCount: 2, // 2 out of 2 used: EXHAUSTED!
      isActive: true,
    });
    cleanup.couponIds.push(coupon._id);

    const orderNum = `ORD-7-EXP-EXHAUST-${Date.now()}`;
    const paymobOrderId = `PM-EXP-EXHAUST-${Date.now()}`;
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const expiredOrder = await OrderModel.create({
      orderNumber: orderNum,
      publicToken: tokenHash,
      locale: 'ar',
      project: proj._id,
      snapshot: {
        title: { ar: 'مشروع 7', en: 'Project 7' },
        slug: proj.slug,
        packageKey: 'starter',
        packageName: { ar: 'أساسي', en: 'Starter' },
        licenseType: 'single',
      },
      customer: {
        fullName: 'Mona Test',
        email: 'mona@test.com',
        phone: '01022222222',
        gitProvider: 'github',
        gitUsername: 'mona-test',
      },
      pricing: {
        currency: 'EGP',
        subtotal: 50000,
        couponCode,
        discount: 10000,
        total: 40000,
      },
      paymentMethod: 'card',
      status: 'expired',
      payment: {
        provider: 'paymob',
        providerOrderId: paymobOrderId,
      },
      statusHistory: [{ status: 'expired', at: new Date(), note: 'Order expired' }],
    });
    cleanup.orderIds.push(expiredOrder._id);

    const txnId = Math.floor(Math.random() * 1000000) + 3000;
    const payloadObj = {
      id: txnId,
      amount_cents: 40000,
      success: true,
      pending: false,
      is_refunded: false,
      is_voided: false,
      currency: 'EGP',
      order: { id: paymobOrderId, merchant_order_id: orderNum },
      created_at: new Date().toISOString(),
    };

    const hmac = calculatePaymobHmac(payloadObj);

    const res = await fetch(`${BASE_URL}/payments/paymob/webhook?hmac=${hmac}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'TRANSACTION', obj: payloadObj }),
    });

    const json = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.data.status, 'paid', 'Order must still be honored as paid');

    // Coupon usedCount should remain 2 (not exceeding maxUses)
    const updatedCoupon = await CouponModel.findById(coupon._id);
    assert.strictEqual(updatedCoupon.usedCount, 2, 'Coupon usedCount must remain 2');

    // Check statusHistory has recorded the notice
    const updatedOrder = await OrderModel.findById(expiredOrder._id);
    const lastNote = updatedOrder.statusHistory[updatedOrder.statusHistory.length - 1].note;
    assert.ok(
      lastNote.includes('exhausted in the interim'),
      `statusHistory must note coupon exhaustion: ${lastNote}`
    );
  });

  // ========================================================
  // 3. Public Reviews Privacy Hardening
  // ========================================================

  await test('Public review submission formats name as "Firstname L." and hides orderNumber/token', async () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const orderNum = `ORD-7-REV-${Date.now()}`;

    const paidOrder = await OrderModel.create({
      orderNumber: orderNum,
      publicToken: tokenHash,
      locale: 'ar',
      project: proj._id,
      snapshot: {
        title: { ar: 'مشروع 7', en: 'Project 7' },
        slug: proj.slug,
        packageKey: 'starter',
        packageName: { ar: 'أساسي', en: 'Starter' },
        licenseType: 'single',
      },
      customer: {
        fullName: 'Omar Abdelrahman Farouk',
        email: 'omar.farouk@test.com',
        phone: '01033333333',
        gitProvider: 'github',
        gitUsername: 'omar-test',
      },
      pricing: { currency: 'EGP', subtotal: 50000, discount: 0, total: 50000 },
      paymentMethod: 'card',
      status: 'paid',
    });
    cleanup.orderIds.push(paidOrder._id);

    // POST review
    const res = await fetch(`${BASE_URL}/orders/${orderNum}/reviews?token=${rawToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: 5,
        comment: 'Excellent production-grade template, very clean code!',
        customerName: 'Omar Abdelrahman Farouk',
      }),
    });

    const json = await res.json();
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
    cleanup.reviewIds.push(json.data.review._id);

    // Verify privacy projection
    assert.strictEqual(json.data.review.customerName, 'Omar F.', 'Reviewer name must be masked to Firstname L.');
    assert.strictEqual(json.data.review.orderNumber, undefined, 'orderNumber must not be returned');
    assert.strictEqual(json.data.review.email, undefined, 'email must not be returned');
    assert.strictEqual(json.data.review.phone, undefined, 'phone must not be returned');
    assert.strictEqual(json.data.review.token, undefined, 'token must not be returned');
    assert.strictEqual(json.data.review.isPublished, true, 'isPublished default must be true');

    // Fetch public list
    const listRes = await fetch(`${BASE_URL}/projects/${proj.slug}/reviews`);
    const listJson = await listRes.json();
    assert.strictEqual(listRes.status, 200);
    assert.ok(listJson.data.reviews.length >= 1);

    const publicReview = listJson.data.reviews.find((r) => r._id === json.data.review._id);
    assert.ok(publicReview, 'Review must be present in public list');
    assert.strictEqual(publicReview.customerName, 'Omar F.');
    assert.strictEqual(publicReview.orderNumber, undefined);
    assert.strictEqual(publicReview.email, undefined);
    assert.strictEqual(publicReview.phone, undefined);
  });

  // ========================================================
  // 4. Token Guess Limiter (Brute-force protection)
  // ========================================================

  await test('Token guess limiter blocks after 20 attempts on order token endpoints', async () => {
    const testIp = `10.0.0.${Date.now() % 250}`;
    // Send 20 failed guesses to trigger limiter on this test IP
    for (let i = 0; i < 20; i++) {
      await fetch(`${BASE_URL}/orders/ORD-NONEXISTENT-${i}?token=fake_token_guess`, {
        headers: { 'x-test-ip': testIp },
      });
    }

    // 21st attempt must be blocked with 429
    const blockedRes = await fetch(`${BASE_URL}/orders/ORD-NONEXISTENT-BLOCKED?token=fake_token_guess`, {
      headers: { 'x-test-ip': testIp },
    });
    const blockedJson = await blockedRes.json();

    assert.strictEqual(blockedRes.status, 429, `Expected 429 TOO_MANY_REQUESTS, got ${blockedRes.status}`);
    assert.strictEqual(blockedJson.error.code, 'TOO_MANY_REQUESTS');
  });

  // ========================================================
  // 5. Production Environment Hardening Checks
  // ========================================================

  await test('Authorization: Bearer fallback is disabled when NODE_ENV=production', async () => {
    const authMiddleware = require('../src/middleware/auth.middleware');
    const envConfig = require('../src/config/env');

    const originalEnv = envConfig.NODE_ENV;
    envConfig.NODE_ENV = 'production';

    let errorThrown = null;
    const mockReq = {
      cookies: {},
      headers: { authorization: 'Bearer some_test_jwt_token' },
    };
    const mockRes = {};
    const mockNext = (err) => {
      if (err) errorThrown = err;
    };

    try {
      await authMiddleware.requireAuth(mockReq, mockRes, mockNext);
    } catch (err) {
      errorThrown = err;
    } finally {
      envConfig.NODE_ENV = originalEnv;
    }

    assert.ok(errorThrown, 'requireAuth must reject Bearer token in production');
    assert.strictEqual(errorThrown.statusCode, 401);
    assert.strictEqual(errorThrown.code, 'UNAUTHORIZED');
  });

  await test('Local disk upload fallback is disabled when NODE_ENV=production', async () => {
    const uploadService = require('../src/services/upload.service');
    const cloudinaryConfig = require('../src/config/cloudinary');
    const envConfig = require('../src/config/env');

    const originalEnv = envConfig.NODE_ENV;
    const originalConfigured = cloudinaryConfig.isConfigured;

    envConfig.NODE_ENV = 'production';
    cloudinaryConfig.isConfigured = false; // Simulate unconfigured or failing Cloudinary in production

    let uploadError = null;
    try {
      await uploadService.uploadImage(Buffer.from('fake image content'), 'bytecraft/tests', 'test.png');
    } catch (err) {
      uploadError = err;
    } finally {
      envConfig.NODE_ENV = originalEnv;
      cloudinaryConfig.isConfigured = originalConfigured;
    }

    assert.ok(uploadError, 'uploadImage must throw an error in production when Cloudinary fails');
    assert.ok(
      uploadError.message.includes('Local disk storage fallback is disabled in production'),
      `Expected production disabled message, got: ${uploadError.message}`
    );
  });

  // ========================================================
  // 6. Cleanup
  // ========================================================
  console.log('\n🧹 Cleaning up test fixtures...');
  for (const id of cleanup.reviewIds) await ReviewModel.findByIdAndDelete(id);
  for (const id of cleanup.orderIds) await OrderModel.findByIdAndDelete(id);
  for (const id of cleanup.couponIds) await CouponModel.findByIdAndDelete(id);
  for (const id of cleanup.projectIds) await ProjectModel.findByIdAndDelete(id);
  for (const id of cleanup.categoryIds) await CategoryModel.findByIdAndDelete(id);
  await mongoose.disconnect();
  console.log('✨ Cleanup complete.\n');

  console.log(`========================================`);
  console.log(`📊 Phase 7 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error in Phase 7:', err);
  process.exit(1);
});
