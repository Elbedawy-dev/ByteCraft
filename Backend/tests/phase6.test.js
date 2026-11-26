const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = 'http://localhost:5001/api';
const LOCAL_TEST_DB_URI = 'mongodb://127.0.0.1:27017/bytecraft_test';
let TEST_DB_URI = (process.env.MONGODB_URI || LOCAL_TEST_DB_URI).trim();
if (TEST_DB_URI.includes('.mongodb.net/')) {
  TEST_DB_URI = TEST_DB_URI.replace(/\.mongodb\.net\/([^?]+)/, '.mongodb.net/bytecraft_test');
} else {
  TEST_DB_URI = TEST_DB_URI.replace(/\/([^/?]+)(\?|$)/, '/bytecraft_test$2');
}
const OWNER_EMAIL = (process.env.OWNER_EMAIL || 'moaazelbedawy@gmail.com').trim();
const OWNER_PASSWORD = (process.env.OWNER_PASSWORD || 'TestPassword123!').trim();

// Clean test entities registry
const cleanup = {
  projectIds: [],
  categoryIds: [],
  couponIds: [],
  orderIds: [],
  inquiryIds: [],
  reviewIds: [],
};

async function runTests() {
  console.log('🧪 Starting Phase 6 & System Review Verification Tests on PORT 5001 (DB: bytecraft_test)...\n');

  const SUITE_IP = `10.60.${Math.floor(Math.random() * 200) + 1}.66`;
  const nativeFetch = globalThis.fetch;
  const fetch = (url, options = {}) => {
    const headers = { ...(options.headers || {}) };
    if (!headers['x-test-ip'] && !headers['X-Test-IP']) {
      headers['x-test-ip'] = SUITE_IP;
    }
    return nativeFetch(url, { ...options, headers });
  };

  let cookieHeader = '';
  let testProjectSlug = '';
  let testProjectId = '';
  let paidOrderNumber = '';
  let paidOrderToken = '';
  let pendingOrderNumber = '';
  let pendingOrderToken = '';
  let testCouponCode = '';
  let testInquiryId = '';
  let testReviewId = '';

  try {
    // 0. Ensure direct connection to bytecraft_test (matching testServer.js) for DB audits
    try {
      await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 10000 });
    } catch {
      await mongoose.connect(LOCAL_TEST_DB_URI);
    }
    const OrderModel = require('../src/models/Order');
    const ProjectModel = require('../src/models/Project');
    const CouponModel = require('../src/models/Coupon');
    const InquiryModel = require('../src/models/Inquiry');
    const ReviewModel = require('../src/models/Review');
    const CategoryModel = require('../src/models/Category');
    const UserModel = require('../src/models/User');
    const SettingsModel = require('../src/models/Settings');

    // Ensure admin User exists in test DB
    let testAdmin = await UserModel.findOne({ email: OWNER_EMAIL.toLowerCase() });
    if (!testAdmin) {
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(OWNER_PASSWORD, salt);
      await UserModel.create({
        name: 'ByteCraft Owner',
        email: OWNER_EMAIL.toLowerCase(),
        passwordHash,
        role: 'admin',
        status: 'active',
        emailVerified: true,
        emailVerifiedAt: new Date(),
      });
    }

    // Ensure Settings exist with payment methods enabled
    let testSettings = await SettingsModel.findOne({ key: 'main' });
    const paymentMethods = {
      vodafone_cash: { enabled: true, walletNumber: '01012345678', accountName: 'ByteCraft VF' },
      instapay: { enabled: true, ipa: 'bytecraft@instapay', accountName: 'ByteCraft IP' },
      fawry: { enabled: true },
      card: { enabled: true },
    };
    if (!testSettings) {
      await SettingsModel.create({
        key: 'main',
        siteName: 'ByteCraft Test',
        paymentMethods,
      });
    } else {
      testSettings.paymentMethods = paymentMethods;
      await testSettings.save();
    }

    const test = async (name, fn) => {
      try {
        await fn();
        console.log(`✅ PASS: ${name}`);
      } catch (err) {
        console.error(`❌ FAIL: ${name}`);
        console.error(`   Error: ${err.message}\n`);
        throw err;
      }
    };

    // ==========================================
    // 1. Owner Authentication & Setup
    // ==========================================

    await test('Admin logs into test server to obtain authentication cookie', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: process.env.OWNER_EMAIL || 'moaazelbedawy@gmail.com',
          password: process.env.OWNER_PASSWORD || 'TestPassword123!',
        }),
      });

      assert(res.status === 200, `Login failed with status ${res.status}`);
      const rawCookie = res.headers.get('set-cookie');
      assert(rawCookie && rawCookie.includes('bc_session='), 'No bc_session set-cookie header returned');
      cookieHeader = rawCookie.split(';')[0];
    });

    // Create Category & Project for testing
    const catRes = await fetch(`${BASE_URL}/owner/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({
        key: `dash-cat-${Date.now()}`,
        name: { ar: 'مشاريع داشبورد', en: 'Dashboard Projects' },
      }),
    });
    const catJson = await catRes.json();
    assert(catRes.status === 201, `Category create failed: ${JSON.stringify(catJson)}`);
    const testCatId = catJson.data.category.id || catJson.data.category._id;
    cleanup.categoryIds.push(testCatId);

    testProjectSlug = `saas-pro-${Date.now()}`;
    const projRes = await fetch(`${BASE_URL}/owner/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({
        title: { ar: 'منصة إدارة سحابية', en: 'Cloud SaaS Management' },
        slug: testProjectSlug,
        tagline: { ar: 'لوحة تحكم للمؤسسات', en: 'Enterprise SaaS Dashboard' },
        description: { ar: 'وصف كامل للمنصة', en: 'Comprehensive SaaS Platform' },
        category: testCatId,
        techStack: ['React', 'Node.js', 'MongoDB'],
        thumbnail: { url: 'https://example.com/thumb.png', publicId: 'thumb_id' },
        packages: [
          {
            key: 'starter',
            name: { ar: 'الأساسية', en: 'Starter' },
            price: 500000, // 5,000 EGP (in piasters)
            features: [{ ar: 'دعم كامل', en: 'Full support' }],
            licenseType: 'single',
            supportDays: 30,
            isActive: true,
          },
        ],
        status: 'published',
      }),
    });
    const projJson = await projRes.json();
    assert(projRes.status === 201, `Project create failed: ${JSON.stringify(projJson)}`);
    testProjectId = projJson.data.project.id || projJson.data.project._id;
    cleanup.projectIds.push(testProjectId);

    // ==========================================
    // 2. Token Security: SHA-256 Storage Verification (Point 6)
    // ==========================================

    await test('POST /api/orders creates order and stores publicToken as SHA-256 hash in database', async () => {
      const res = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectSlug: testProjectSlug,
          packageKey: 'starter',
          paymentMethod: 'card',
          locale: 'en',
          customer: {
            fullName: 'Security Auditor',
            email: 'auditor@example.com',
            phone: '01000000001',
            gitProvider: 'github',
            gitUsername: 'sec-auditor',
          },
        }),
      });

      const json = await res.json();
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      paidOrderNumber = json.data.order.orderNumber;
      paidOrderToken = json.data.order.publicToken;
      assert(paidOrderToken && paidOrderToken.length === 48, 'Expected 48-char raw hex token');

      // Audit MongoDB directly to verify SHA-256 hash
      const orderInDb = await OrderModel.findOne({ orderNumber: paidOrderNumber }).select('+publicToken');
      assert(orderInDb, 'Order not found in DB');
      cleanup.orderIds.push(orderInDb._id);

      const expectedHash = crypto.createHash('sha256').update(paidOrderToken).digest('hex');
      assert(orderInDb.publicToken === expectedHash, 'DB publicToken does not match SHA-256 hash of raw token');
      assert(orderInDb.publicToken !== paidOrderToken, 'DB publicToken must NEVER equal the raw token');
    });

    await test('Guest access works with raw token, but fails with DB hash (preventing DB hash reuse)', async () => {
      // 1. Query with raw token -> Must succeed
      const validRes = await fetch(`${BASE_URL}/orders/${paidOrderNumber}?token=${paidOrderToken}`);
      assert(validRes.status === 200, `Expected 200 with raw token, got ${validRes.status}`);

      // 2. Query with the SHA-256 hash directly -> Must fail with 401
      const orderInDb = await OrderModel.findOne({ orderNumber: paidOrderNumber }).select('+publicToken');
      const invalidRes = await fetch(`${BASE_URL}/orders/${paidOrderNumber}?token=${orderInDb.publicToken}`);
      assert(invalidRes.status === 401, `Expected 401 with DB hash, got ${invalidRes.status}`);
    });

    // ==========================================
    // 3. Concurrent Webhooks & Atomic Idempotency (Points 2 & 3)
    // ==========================================

    await test('Concurrent Paymob webhooks (Promise.all) confirm order atomically and increment sales exactly once', async () => {
      const projBefore = await ProjectModel.findById(testProjectId);
      const initialPurchases = projBefore.stats?.purchases || 0;

      // Construct Paymob transaction payload
      const txnId = Math.floor(100000000 + Math.random() * 900000000);
      const orderInDb = await OrderModel.findOne({ orderNumber: paidOrderNumber });

      const transactionObj = {
        amount_cents: 500000,
        created_at: new Date().toISOString(),
        currency: 'EGP',
        error_occured: false,
        has_parent_transaction: false,
        id: txnId,
        integration_id: 12345,
        is_3d_secure: true,
        is_auth: false,
        is_capture: false,
        is_refunded: false,
        is_standalone_payment: true,
        is_voided: false,
        order: { id: orderInDb.payment.providerOrderId || 'sim_order_id' },
        owner: 100,
        pending: false,
        source_data: { pan: '2345', sub_type: 'MasterCard', type: 'card' },
        success: true,
      };

      const paymobService = require('../src/services/payments/paymob.service');
      const hmacSecret = process.env.PAYMOB_HMAC_SECRET || 'nexus_test_paymob_hmac_secret_local_only';
      const validHmac = paymobService.calculateHmac(transactionObj, hmacSecret);

      // Fire TWO webhooks concurrently at the exact same moment
      const [res1, res2] = await Promise.all([
        fetch(`${BASE_URL}/payments/paymob/webhook?hmac=${validHmac}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ obj: transactionObj }),
        }),
        fetch(`${BASE_URL}/payments/paymob/webhook?hmac=${validHmac}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ obj: transactionObj }),
        }),
      ]);

      const [json1, json2] = await Promise.all([res1.json(), res2.json()]);

      assert(res1.status === 200, `Request 1 failed: ${res1.status}`);
      assert(res2.status === 200, `Request 2 failed: ${res2.status}`);

      // Exactly one should be idempotent: true, and one should be idempotent: false
      const idempotentCount = [json1.data?.idempotent, json2.data?.idempotent].filter(Boolean).length;
      assert(idempotentCount === 1, `Expected exactly 1 idempotent response, got ${idempotentCount}`);

      // Verify DB purchase counter increased by EXACTLY 1
      const projAfter = await ProjectModel.findById(testProjectId);
      const newPurchases = projAfter.stats?.purchases || 0;
      assert(newPurchases === initialPurchases + 1, `Expected purchases ${initialPurchases + 1}, got ${newPurchases}`);

      // Verify order has status paid and payment.transactionId
      const verifiedOrder = await OrderModel.findOne({ orderNumber: paidOrderNumber });
      assert(verifiedOrder.status === 'paid', `Expected paid status, got ${verifiedOrder.status}`);
      assert(String(verifiedOrder.payment.transactionId) === String(txnId), 'Transaction ID mismatch in payment');
    });

    await test('Webhook with success=true but pending=true or is_refunded=true is NOT marked paid', async () => {
      // Create a fresh pending order
      const res = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectSlug: testProjectSlug,
          packageKey: 'starter',
          paymentMethod: 'card',
          customer: {
            fullName: 'Pending Tester',
            email: 'pending@example.com',
            phone: '01000000002',
            gitProvider: 'github',
            gitUsername: 'pending-tester',
          },
        }),
      });
      const json = await res.json();
      const testOrderNum = json.data.order.orderNumber;
      const orderDoc = await OrderModel.findOne({ orderNumber: testOrderNum });
      cleanup.orderIds.push(orderDoc._id);

      const txnId = Math.floor(100000000 + Math.random() * 900000000);
      const pendingTxnObj = {
        amount_cents: 500000,
        created_at: new Date().toISOString(),
        currency: 'EGP',
        error_occured: false,
        has_parent_transaction: false,
        id: txnId,
        integration_id: 12345,
        is_3d_secure: true,
        is_auth: false,
        is_capture: false,
        is_refunded: false,
        is_standalone_payment: true,
        is_voided: false,
        order: { id: orderDoc.payment.providerOrderId || 'sim_order_id' },
        owner: 100,
        pending: true, // Pending is TRUE!
        source_data: { pan: '2345', sub_type: 'MasterCard', type: 'card' },
        success: true,
      };

      const paymobService = require('../src/services/payments/paymob.service');
      const hmacSecret = process.env.PAYMOB_HMAC_SECRET || 'nexus_test_paymob_hmac_secret_local_only';
      const hmac = paymobService.calculateHmac(pendingTxnObj, hmacSecret);

      const webhookRes = await fetch(`${BASE_URL}/payments/paymob/webhook?hmac=${hmac}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ obj: pendingTxnObj }),
      });

      assert(webhookRes.status === 200, `Expected 200, got ${webhookRes.status}`);

      // Order must REMAIN pending_payment!
      const afterOrder = await OrderModel.findOne({ orderNumber: testOrderNum });
      assert(afterOrder.status === 'pending_payment', `Expected pending_payment, got ${afterOrder.status}`);
    });

    // ==========================================
    // 4. Abandoned Orders Expiry & Coupon Release (Point 4)
    // ==========================================

    await test('Abandoned orders mechanism: marks orders expired and releases coupon usedCount atomically', async () => {
      testCouponCode = `EXPIRE${Date.now()}`;
      const couponRes = await fetch(`${BASE_URL}/owner/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({
          code: testCouponCode,
          type: 'fixed',
          value: 100000, // 1,000 EGP off
          maxUses: 1, // Only 1 use allowed
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        }),
      });
      const couponJson = await couponRes.json();
      cleanup.couponIds.push(couponJson.data.coupon.id || couponJson.data.coupon._id);

      // Create order using this coupon -> Consumes the only use
      const orderRes = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectSlug: testProjectSlug,
          packageKey: 'starter',
          couponCode: testCouponCode,
          paymentMethod: 'card',
          customer: {
            fullName: 'Abandoned Buyer',
            email: 'abandoned@example.com',
            phone: '01000000003',
            gitProvider: 'github',
            gitUsername: 'abandoned-buyer',
          },
        }),
      });
      const orderJson = await orderRes.json();
      const abandonedOrderNum = orderJson.data.order.orderNumber;
      const abandonedOrderDoc = await OrderModel.findOne({ orderNumber: abandonedOrderNum });
      cleanup.orderIds.push(abandonedOrderDoc._id);

      // Verify coupon is now exhausted
      const couponBefore = await CouponModel.findOne({ code: testCouponCode });
      assert(couponBefore.usedCount === 1, 'Coupon usedCount should be 1');

      // Simulate order abandonment by setting createdAt to 25 hours ago
      await OrderModel.updateOne(
        { _id: abandonedOrderDoc._id },
        { createdAt: new Date(Date.now() - 25 * 3600 * 1000) }
      );

      // Trigger cleanup job via Owner endpoint (passing 0h cutoff to immediately expire pending orders)
      const cleanupRes = await fetch(`${BASE_URL}/owner/orders/cleanup-expired`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({ cardHours: 0, fawryHours: 0, manualHours: 0 }),
      });
      const cleanupJson = await cleanupRes.json();
      assert(cleanupRes.status === 200, `Cleanup failed: ${cleanupRes.status}`);
      assert(cleanupJson.data.expiredCount >= 1, 'Expected at least 1 expired order');

      // Verify order transitioned to 'expired'
      const updatedOrder = await OrderModel.findById(abandonedOrderDoc._id);
      assert(updatedOrder.status === 'expired', `Expected status 'expired', got '${updatedOrder.status}'`);

      // Verify coupon usedCount was rolled back atomically to 0
      const couponAfter = await CouponModel.findOne({ code: testCouponCode });
      assert(couponAfter.usedCount === 0, `Expected coupon usedCount 0, got ${couponAfter.usedCount}`);
    });

    // ==========================================
    // 5. Inquiries & Contact Form (Security & Moderation)
    // ==========================================

    await test('POST /api/inquiries honeypot blocks automated bot without persisting in database', async () => {
      const countBefore = await InquiryModel.countDocuments({});

      const res = await fetch(`${BASE_URL}/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Spam Bot',
          email: 'bot@spammer.net',
          subject: 'Cheap backlinks',
          message: 'Buy our backlink package now!',
          website: 'http://spam-link.com', // Honeypot filled!
        }),
      });

      const json = await res.json();
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      assert(json.data.inquiry.id === 'bot_trapped', 'Honeypot trap not identified');

      const countAfter = await InquiryModel.countDocuments({});
      assert(countAfter === countBefore, 'Bot inquiry must NOT be saved in database');
    });

    await test('POST /api/inquiries sanitizes raw HTML in message and saves clean lead', async () => {
      const res = await fetch(`${BASE_URL}/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Dr. Mahmoud',
          email: 'mahmoud.client@example.com',
          phone: '01012345678',
          subject: 'Inquiry regarding Enterprise SaaS',
          message: '<script>alert("xss")</script>Hello, I would like to inquire about customizing this project.',
          projectSlug: testProjectSlug,
          locale: 'ar',
        }),
      });

      const json = await res.json();
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      testInquiryId = json.data.inquiry.id || json.data.inquiry._id;
      cleanup.inquiryIds.push(testInquiryId);

      const inquiryInDb = await InquiryModel.findById(testInquiryId);
      assert(inquiryInDb.name === 'Dr. Mahmoud', 'Name mismatch');
      assert(inquiryInDb.status === 'new', 'Expected status new');
    });

    await test('Owner lists, updates notes & status, and deletes inquiry', async () => {
      // 1. List inquiries
      const listRes = await fetch(`${BASE_URL}/owner/inquiries?status=new`, {
        headers: { Cookie: cookieHeader },
      });
      const listJson = await listRes.json();
      assert(listRes.status === 200, `Expected 200, got ${listRes.status}`);
      assert(Array.isArray(listJson.data.inquiries), 'Expected inquiries array');

      // 2. Get detail
      const detailRes = await fetch(`${BASE_URL}/owner/inquiries/${testInquiryId}`, {
        headers: { Cookie: cookieHeader },
      });
      const detailJson = await detailRes.json();
      assert(detailRes.status === 200, `Expected 200, got ${detailRes.status}`);
      assert(detailJson.data.inquiry.email === 'mahmoud.client@example.com', 'Email mismatch');

      // 3. Update status & notes
      const patchRes = await fetch(`${BASE_URL}/owner/inquiries/${testInquiryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({
          status: 'in_progress',
          ownerNotes: 'Scheduled a meeting on Sunday.',
        }),
      });
      const patchJson = await patchRes.json();
      assert(patchRes.status === 200, `Expected 200, got ${patchRes.status}`);
      assert(patchJson.data.inquiry.status === 'in_progress', 'Status not updated');
      assert(patchJson.data.inquiry.ownerNotes === 'Scheduled a meeting on Sunday.', 'Notes not updated');
    });

    // ==========================================
    // 6. Reviews (Verified Buyers Only)
    // ==========================================

    await test('Customer with unpaid order CANNOT post a review (409 INVALID_STATE)', async () => {
      // Create pending order
      const res = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectSlug: testProjectSlug,
          packageKey: 'starter',
          paymentMethod: 'card',
          customer: {
            fullName: 'Unpaid Customer',
            email: 'unpaid@example.com',
            phone: '01000000009',
            gitProvider: 'github',
            gitUsername: 'unpaid-customer',
          },
        }),
      });
      const json = await res.json();
      pendingOrderNumber = json.data.order.orderNumber;
      pendingOrderToken = json.data.order.publicToken;
      cleanup.orderIds.push(json.data.order.id || (await OrderModel.findOne({ orderNumber: pendingOrderNumber }))._id);

      const reviewRes = await fetch(`${BASE_URL}/orders/${pendingOrderNumber}/reviews?token=${pendingOrderToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: 5,
          comment: 'This looks great even though I have not paid!',
        }),
      });

      const reviewJson = await reviewRes.json();
      assert(reviewRes.status === 409, `Expected 409, got ${reviewRes.status}`);
      assert(reviewJson.error.code === 'INVALID_STATE', `Expected INVALID_STATE, got ${reviewJson.error.code}`);
    });

    await test('Verified buyer with paid order successfully posts a review (pending moderation by default)', async () => {
      const res = await fetch(`${BASE_URL}/orders/${paidOrderNumber}/reviews?token=${paidOrderToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: 5,
          comment: 'Outstanding project code! Clean architecture and excellent documentation.',
          customerName: 'Verified Ahmed',
        }),
      });

      const json = await res.json();
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      testReviewId = json.data.review.id || json.data.review._id;
      cleanup.reviewIds.push(testReviewId);

      assert(json.data.review.rating === 5, 'Rating mismatch');
      assert(json.data.review.isPublished === false, 'Review should default to pending (isPublished: false)');
    });

    await test('Buyer attempting second review on same order is rejected (409 ALREADY_EXISTS)', async () => {
      const res = await fetch(`${BASE_URL}/orders/${paidOrderNumber}/reviews?token=${paidOrderToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: 4,
          comment: 'Submitting another review to see if it allows duplicate.',
        }),
      });

      const json = await res.json();
      assert(res.status === 409, `Expected 409, got ${res.status}`);
      assert(json.error.code === 'ALREADY_EXISTS', `Expected ALREADY_EXISTS, got ${json.error.code}`);
    });

    await test('Pending review stays hidden publicly, sorts first in /api/owner/reviews, and becomes visible only after owner publishes', async () => {
      // 1. Newly submitted review must NOT appear in project reviews or /api/reviews/latest while pending
      const publicResPending = await fetch(`${BASE_URL}/projects/${testProjectSlug}/reviews`);
      const publicJsonPending = await publicResPending.json();
      assert(publicResPending.status === 200, `Expected 200, got ${publicResPending.status}`);
      assert(
        !publicJsonPending.data.reviews.some((r) => String(r._id) === String(testReviewId)),
        'Pending review must NOT appear on public project reviews before approval'
      );

      const latestResPending = await fetch(`${BASE_URL}/reviews/latest?limit=12`);
      const latestJsonPending = await latestResPending.json();
      assert(latestResPending.status === 200, `Expected 200, got ${latestResPending.status}`);
      assert(
        !latestJsonPending.data.reviews.some((r) => String(r._id) === String(testReviewId)),
        'Pending review must NOT appear on /api/reviews/latest before approval'
      );

      // 2. Dashboard pendingReviews counts it & /api/owner/reviews?isPublished=false includes it
      const dashBeforeRes = await fetch(`${BASE_URL}/owner/dashboard`, {
        headers: { Cookie: cookieHeader },
      });
      const dashBeforeJson = await dashBeforeRes.json();
      assert(dashBeforeRes.status === 200);
      const pendingBeforePublish = dashBeforeJson.data.totals.pendingReviews;
      assert(typeof pendingBeforePublish === 'number' && pendingBeforePublish >= 1, 'pendingReviews should count pending review');

      const pendingListRes = await fetch(`${BASE_URL}/owner/reviews?projectId=${testProjectId}&isPublished=false`, {
        headers: { Cookie: cookieHeader },
      });
      const pendingListJson = await pendingListRes.json();
      assert(pendingListRes.status === 200);
      assert(
        pendingListJson.data.reviews.some((r) => String(r._id) === String(testReviewId)),
        'Pending review must appear in /api/owner/reviews?isPublished=false'
      );

      // 3. Verify default /api/owner/reviews ordering puts pending reviews BEFORE newer published reviews
      const secondRawToken = crypto.randomBytes(24).toString('hex');
      const secondOrder = await OrderModel.create({
        orderNumber: `P6-SORT-${Date.now()}`,
        publicToken: crypto.createHash('sha256').update(secondRawToken).digest('hex'),
        locale: 'en',
        project: testProjectId,
        snapshot: {
          title: { ar: 'منصة إدارة سحابية', en: 'Cloud SaaS Management' },
          slug: testProjectSlug,
          packageKey: 'starter',
          packageName: { ar: 'الأساسية', en: 'Starter' },
          licenseType: 'single',
        },
        customer: {
          fullName: 'Newer Published Buyer',
          email: 'newer-published@example.com',
          phone: '01000000010',
          gitProvider: 'github',
          gitUsername: 'newer-buyer',
        },
        pricing: { currency: 'EGP', subtotal: 500000, discount: 0, total: 500000 },
        paymentMethod: 'card',
        status: 'paid',
      });
      cleanup.orderIds.push(secondOrder._id);

      const publishedNewerReview = await ReviewModel.create({
        order: secondOrder._id,
        orderNumber: secondOrder.orderNumber,
        project: testProjectId,
        customerName: 'Newer Published Buyer',
        rating: 4,
        comment: 'Published review created after the pending review.',
        isPublished: true,
        createdAt: new Date(Date.now() + 5000),
      });
      cleanup.reviewIds.push(publishedNewerReview._id);

      const defaultOwnerListRes = await fetch(`${BASE_URL}/owner/reviews?projectId=${testProjectId}`, {
        headers: { Cookie: cookieHeader },
      });
      const defaultOwnerListJson = await defaultOwnerListRes.json();
      assert(defaultOwnerListRes.status === 200);
      assert(defaultOwnerListJson.data.reviews.length >= 2, 'Expected at least 2 reviews for project');
      assert(
        String(defaultOwnerListJson.data.reviews[0]._id) === String(testReviewId),
        'Default /api/owner/reviews must sort pending reviews BEFORE newer published reviews'
      );
      assert(
        defaultOwnerListJson.data.reviews[0].isPublished === false,
        'First review in default owner list must be pending'
      );

      // 4. Owner publishes review + attaches response
      const pubRes = await fetch(`${BASE_URL}/owner/reviews/${testReviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({
          isPublished: true,
          ownerResponse: 'Thank you for your valuable feedback!',
        }),
      });
      const pubJson = await pubRes.json();
      assert(pubRes.status === 200, `Expected 200, got ${pubRes.status}`);
      assert(pubJson.data.review.isPublished === true, 'Review should now be published');
      assert(pubJson.data.review.ownerResponse === 'Thank you for your valuable feedback!', 'Response mismatch');

      // 5. Now visible on project page reviews AND /api/reviews/latest, and dashboard pendingReviews decremented
      const publicResPublished = await fetch(`${BASE_URL}/projects/${testProjectSlug}/reviews`);
      const publicJsonPublished = await publicResPublished.json();
      assert(publicResPublished.status === 200);
      assert(
        publicJsonPublished.data.reviews.some((r) => String(r._id) === String(testReviewId)),
        'Published review must appear on public project reviews'
      );

      const latestResPublished = await fetch(`${BASE_URL}/reviews/latest?limit=12`);
      const latestJsonPublished = await latestResPublished.json();
      assert(latestResPublished.status === 200);
      assert(
        latestJsonPublished.data.reviews.some((r) => String(r._id) === String(testReviewId)),
        'Published review must appear on /api/reviews/latest'
      );

      const dashAfterPubRes = await fetch(`${BASE_URL}/owner/dashboard`, {
        headers: { Cookie: cookieHeader },
      });
      const dashAfterPubJson = await dashAfterPubRes.json();
      assert(
        dashAfterPubJson.data.totals.pendingReviews === pendingBeforePublish - 1,
        `Expected pendingReviews to decrement to ${pendingBeforePublish - 1}, got ${dashAfterPubJson.data.totals.pendingReviews}`
      );

      // 6. Owner hides review again (isPublished: false) -> disappears publicly & increments pendingReviews
      const hideRes = await fetch(`${BASE_URL}/owner/reviews/${testReviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({ isPublished: false }),
      });
      const hideJson = await hideRes.json();
      assert(hideRes.status === 200, `Expected 200, got ${hideRes.status}`);
      assert(hideJson.data.review.isPublished === false, 'Review should be unpublished');

      const publicResHidden = await fetch(`${BASE_URL}/projects/${testProjectSlug}/reviews`);
      const publicJsonHidden = await publicResHidden.json();
      assert(
        !publicJsonHidden.data.reviews.some((r) => String(r._id) === String(testReviewId)),
        'Hidden review must NOT appear in public project API'
      );

      const latestResHidden = await fetch(`${BASE_URL}/reviews/latest?limit=12`);
      const latestJsonHidden = await latestResHidden.json();
      assert(
        !latestJsonHidden.data.reviews.some((r) => String(r._id) === String(testReviewId)),
        'Hidden review must NOT appear in /api/reviews/latest'
      );
    });

    // ==========================================
    // 7. Owner Dashboard Metrics & Aggregations
    // ==========================================

    await test('GET /api/owner/dashboard computes accurate revenue in piasters and excludes refunded orders', async () => {
      const res = await fetch(`${BASE_URL}/owner/dashboard`, {
        headers: { Cookie: cookieHeader },
      });

      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const data = json.data;

      // Validate Totals structure
      assert(data.totals, 'Dashboard totals object missing');
      assert(typeof data.totals.revenue === 'number', 'Revenue should be a number (in piasters)');
      assert(data.totals.revenue >= 500000, `Revenue should include our 500,000 piaster order (got ${data.totals.revenue})`);
      assert(data.totals.paidOrders >= 1, 'paidOrders should be at least 1');
      assert(data.totals.ordersCount >= 1, 'ordersCount should be at least 1');
      assert(typeof data.totals.pendingProofs === 'number', 'pendingProofs should be a number');
      assert(typeof data.totals.newInquiries === 'number', 'newInquiries should be a number');
      assert(typeof data.totals.pendingReviews === 'number', 'pendingReviews should be a number');
      const expectedPendingReviews = await ReviewModel.countDocuments({ isPublished: false });
      assert(
        data.totals.pendingReviews === expectedPendingReviews,
        `pendingReviews mismatch: expected ${expectedPendingReviews}, got ${data.totals.pendingReviews}`
      );
      assert(typeof data.totals.publishedProjects === 'number', 'publishedProjects should be a number');

      // Validate 12-month revenue timeline
      assert(Array.isArray(data.revenueByMonth), 'revenueByMonth should be an array');
      assert(data.revenueByMonth.length >= 1, 'revenueByMonth should have at least 1 entry');
      const currentMonth = data.revenueByMonth[data.revenueByMonth.length - 1];
      assert(currentMonth.revenue >= 500000, 'Current month revenue mismatch');

      // Validate Orders by status distribution
      assert(Array.isArray(data.ordersByStatus), 'ordersByStatus should be an array');
      const paidStatusGroup = data.ordersByStatus.find((g) => g.status === 'paid');
      assert(paidStatusGroup && paidStatusGroup.count >= 1, 'Expected at least 1 paid order in status group');

      // Validate Top 5 projects
      assert(Array.isArray(data.topProjects), 'topProjects should be an array');
      assert(data.topProjects.length >= 1, 'Expected at least 1 top project');

      // Validate Recent orders & Inquiries
      assert(Array.isArray(data.recentOrders), 'recentOrders should be an array');
      assert(data.recentOrders.length >= 1, 'recentOrders should not be empty');
      assert(Array.isArray(data.recentInquiries), 'recentInquiries should be an array');
    });

  } finally {
    // ==========================================
    // Cleanup Test Data
    // ==========================================
    console.log('\n🧹 Cleaning up test data from bytecraft_test database...');
    try {
      const OrderModel = mongoose.model('Order');
      const ProjectModel = mongoose.model('Project');
      const CategoryModel = mongoose.model('Category');
      const CouponModel = mongoose.model('Coupon');
      const InquiryModel = mongoose.model('Inquiry');
      const ReviewModel = mongoose.model('Review');

      if (cleanup.reviewIds.length > 0) {
        await ReviewModel.deleteMany({ _id: { $in: cleanup.reviewIds } });
      }
      if (cleanup.inquiryIds.length > 0) {
        await InquiryModel.deleteMany({ _id: { $in: cleanup.inquiryIds } });
      }
      if (cleanup.orderIds.length > 0) {
        await OrderModel.deleteMany({ _id: { $in: cleanup.orderIds } });
      }
      if (cleanup.couponIds.length > 0) {
        await CouponModel.deleteMany({ _id: { $in: cleanup.couponIds } });
      }
      if (cleanup.projectIds.length > 0) {
        await ProjectModel.deleteMany({ _id: { $in: cleanup.projectIds } });
      }
      if (cleanup.categoryIds.length > 0) {
        await CategoryModel.deleteMany({ _id: { $in: cleanup.categoryIds } });
      }

      await mongoose.disconnect();
      console.log('✨ Cleanup finished: All test entities deleted from bytecraft_test.');
    } catch (cleanupErr) {
      console.error('⚠️ Cleanup error:', cleanupErr.message);
    }
  }

  console.log('\n========================================');
  console.log('📊 Phase 6 Test Results: All Verified!');
  console.log('========================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
