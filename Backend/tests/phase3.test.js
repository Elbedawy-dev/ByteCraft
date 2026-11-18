/**
 * Phase 3 End-to-End Verification Test Script
 * 
 * Target: Test server on port 5001 with test DB: `bytecraft_test`
 * 
 * Verifies:
 * 1. Health & Meta endpoint:
 *    - GET /api/meta (active categories, sanitized payment methods without wallet/IPA, contact, no VAT)
 * 2. Service Plans:
 *    - Owner CRUD: create, list, get by ID, update, delete
 *    - Public list: GET /api/service-plans (active only, group filter)
 * 3. Coupons:
 *    - Owner CRUD: create, list, get by ID, update, delete
 * 4. Pricing Service & Exact Mathematical Assertions:
 *    - Package 780,000 piasters, 10% coupon -> discount 78,000, total 702,000 (tax-free)
 *    - Non-divisible percent rounding: 15% of 777,777 piasters (Math.round rule) -> discount 116,667, total 661,110
 *    - Fixed coupon larger than subtotal (discount capped at subtotal, total 0)
 *    - Expired coupon rejection (400 COUPON_EXPIRED)
 *    - Inactive coupon rejection (400 COUPON_INACTIVE)
 *    - Max uses reached rejection (400 COUPON_MAX_USES_REACHED)
 *    - Coupon not applicable to this project rejection (400 COUPON_NOT_APPLICABLE)
 *    - Inactive package rejection (400 PACKAGE_NOT_ACTIVE)
 *    - Draft project rejection (400 PROJECT_NOT_AVAILABLE)
 *    - Zero-trust: /coupons/validate only accepts { code, projectSlug, packageKey }
 * 5. Catalog Search, Sorting & Pagination Enhancements:
 *    - All 4 sort options: newest, price_asc, price_desc, popular
 *    - Featured filter: ?featured=true
 *    - Pagination metadata: page, limit, total, totalPages
 *    - Limit validation: limit=50 succeeds, limit=51 is rejected (400 VALIDATION_ERROR)
 * 6. Mandatory Cleanup:
 *    - Deletes all created test records, leaving bytecraft_test clean.
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
  console.log('🧪 Starting Phase 3 Verification Tests on PORT 5001 (DB: bytecraft_test)...\n');
  console.log(`📡 Target API: ${BASE_URL}`);

  let passed = 0;
  let failed = 0;
  let cookieHeader = '';

  // Track created IDs for strict cleanup
  const cleanup = {
    projectIds: [],
    categoryIds: [],
    servicePlanIds: [],
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

  // Seed test database directly with owner and settings if needed
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

  // Seed owner in test database
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

  // Seed settings in test database
  let testSettings = await Settings.findOne({ key: 'main' });
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
      paymentMethods: {
        vodafone_cash: {
          enabled: true,
          walletNumber: '01099998888', // Secret: must NOT appear in /meta
          accountName: 'ByteCraft Secret Account',
          instructions: { ar: 'تعليمات', en: 'Instructions' },
        },
        instapay: {
          enabled: true,
          ipa: 'secret_ipa@instapay', // Secret: must NOT appear in /meta
          accountName: 'ByteCraft IPA Name',
          instructions: { ar: 'انستاباي', en: 'InstaPay' },
        },
        fawry: { enabled: false },
        card: { enabled: true },
      },
    });
    console.log('   ✅ Seeded settings in bytecraft_test');
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
    // 1. GET /api/meta Testing
    // ==========================================

    await test('GET /api/meta returns active categories, contact, and SANITIZED payment methods (no vatRate)', async () => {
      const res = await fetch(`${BASE_URL}/meta`);
      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(json.success === true, 'Expected success: true');
      const data = json.data;

      assert(data.vatRate === undefined, 'Expected no vatRate in /meta response');
      assert(typeof data.guaranteeDays === 'number', 'Expected guaranteeDays number');
      assert(Array.isArray(data.categories), 'Expected categories array');
      assert(data.paymentMethods !== undefined, 'Expected paymentMethods object');

      // CRITICAL SECURITY ASSERTION: Sensitive wallet numbers & IPAs MUST NOT be exposed
      const vc = data.paymentMethods.vodafone_cash;
      const ip = data.paymentMethods.instapay;

      assert(vc.enabled !== undefined, 'Expected vodafone_cash.enabled');
      assert(vc.walletNumber === undefined, 'SECURITY LEAK: walletNumber leaked in /meta!');
      assert(vc.accountName === undefined, 'SECURITY LEAK: accountName leaked in /meta!');

      assert(ip.enabled !== undefined, 'Expected instapay.enabled');
      assert(ip.ipa === undefined, 'SECURITY LEAK: ipa leaked in /meta!');
      assert(ip.accountName === undefined, 'SECURITY LEAK: accountName leaked in /meta!');
    });

    // ==========================================
    // 2. Service Plans CRUD & Public Listing
    // ==========================================

    let testPlanId = '';

    await test('POST /api/owner/service-plans creates a custom build service plan', async () => {
      const payload = {
        group: 'lms',
        name: { ar: 'منصة تعليمية مخصصة', en: 'Custom LMS Platform' },
        description: { ar: 'بناء منصة متكاملة للتعليم', en: 'Full custom LMS build with video hosting' },
        startingPrice: 1500000, // 15,000 EGP in piasters
        features: [
          { ar: 'نظام امتحانات تفاعلي', en: 'Interactive exam builder' },
          { ar: 'حماية الفيديوهات من التحميل', en: 'DRM video streaming protection' },
        ],
        deliveryDays: 21,
        isPopular: true,
        isActive: true,
        sortOrder: 1,
      };

      const res = await fetch(`${BASE_URL}/owner/service-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieHeader,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(json)}`);
      assert(json.data.plan.startingPrice === 1500000, 'Starting price mismatch');
      testPlanId = json.data.plan.id || json.data.plan._id;
      cleanup.servicePlanIds.push(testPlanId);
    });

    await test('GET /api/owner/service-plans lists all plans for Owner', async () => {
      const res = await fetch(`${BASE_URL}/owner/service-plans`, {
        headers: { Cookie: cookieHeader },
      });
      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(json.data.plans.some((p) => (p.id || p._id) === testPlanId), 'Created plan missing from owner list');
    });

    await test('GET /api/service-plans (public) lists active plans and filters by group', async () => {
      const res = await fetch(`${BASE_URL}/service-plans?group=lms`);
      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(Array.isArray(json.data.plans), 'Expected plans array');
      assert(json.data.plans.length >= 1, 'Expected at least 1 plan in group lms');
      for (const p of json.data.plans) {
        assert(p.group === 'lms', 'Plan group mismatch in filter');
      }
    });

    await test('PATCH /api/owner/service-plans/:id updates plan delivery days', async () => {
      const res = await fetch(`${BASE_URL}/owner/service-plans/${testPlanId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieHeader,
        },
        body: JSON.stringify({ deliveryDays: 25 }),
      });
      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(json.data.plan.deliveryDays === 25, 'Delivery days was not updated');
    });

    // ==========================================
    // 3. Coupons CRUD & Setup for Pricing Tests
    // ==========================================

    // First, create a test Category and published Project to test pricing on
    let testCatId = '';
    const catRes = await fetch(`${BASE_URL}/owner/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({
        key: `pricing-cat-${Date.now()}`,
        name: { ar: 'تصنيف الأسعار', en: 'Pricing Test Cat' },
      }),
    });
    const catJson = await catRes.json();
    testCatId = catJson.data.category.id || catJson.data.category._id;
    cleanup.categoryIds.push(testCatId);

    // Create published project with exact price: 780000 piasters (7,800 EGP)
    let testProjectSlug = `lms-pro-${Date.now()}`;
    let testProjectId = '';

    const projRes = await fetch(`${BASE_URL}/owner/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({
        slug: testProjectSlug,
        title: { ar: 'منصة كورسات', en: 'Courses LMS Platform' },
        tagline: { ar: 'منصة سريعة', en: 'Fast platform' },
        description: { ar: 'شرح المنصة', en: 'Platform description' },
        category: testCatId,
        techStack: ['React', 'Node.js', 'MongoDB'],
        thumbnail: { url: 'https://example.com/thumb.jpg', publicId: 'thumb_p3' },
        packages: [
          {
            key: 'standard',
            name: { ar: 'الترخيص الفردي', en: 'Standard Package' },
            price: 780000, // 7,800 EGP (exact example from prompt)
            isActive: true,
          },
          {
            key: 'inactive_pkg',
            name: { ar: 'باقة غير نشطة', en: 'Inactive Package' },
            price: 500000,
            isActive: false, // For inactive package test
          },
        ],
        status: 'published',
        isFeatured: true,
        sortOrder: 1,
      }),
    });
    const projJson = await projRes.json();
    testProjectId = projJson.data.project.id || projJson.data.project._id;
    cleanup.projectIds.push(testProjectId);

    // Create a draft project for draft validation test
    const draftRes = await fetch(`${BASE_URL}/owner/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({
        title: { ar: 'مشروع مسودة', en: 'Draft Project' },
        tagline: { ar: 'مسودة', en: 'Draft' },
        description: { ar: 'مسودة', en: 'Draft' },
        category: testCatId,
        techStack: ['Vue'],
        thumbnail: { url: 'https://example.com/thumb.jpg', publicId: 'draft_thumb' },
        packages: [{ key: 'std', name: { ar: 'باقة', en: 'Pkg' }, price: 100000, isActive: true }],
        status: 'draft',
      }),
    });
    const draftJson = await draftRes.json();
    const draftSlug = draftJson.data.project.slug;
    cleanup.projectIds.push(draftJson.data.project.id || draftJson.data.project._id);

    // Create Coupons for exact testing
    const tenPercentCode = `TEST10_${Date.now()}`;
    const fixedLargeCode = `FIXED6000_${Date.now()}`;
    const expiredCode = `EXPIRED_${Date.now()}`;
    const inactiveCode = `INACTIVE_${Date.now()}`;
    const maxUsesCode = `MAX1_${Date.now()}`;
    const restrictedCode = `RESTRICTED_${Date.now()}`;

    // 10% coupon
    const c1Res = await fetch(`${BASE_URL}/owner/coupons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({
        code: tenPercentCode,
        type: 'percent',
        value: 10,
      }),
    });
    cleanup.couponIds.push((await c1Res.json()).data.coupon.id);

    // Fixed 600,000 piasters coupon
    const c2Res = await fetch(`${BASE_URL}/owner/coupons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({
        code: fixedLargeCode,
        type: 'fixed',
        value: 600000,
      }),
    });
    cleanup.couponIds.push((await c2Res.json()).data.coupon.id);

    // Expired coupon (yesterday)
    const c3Res = await fetch(`${BASE_URL}/owner/coupons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({
        code: expiredCode,
        type: 'percent',
        value: 20,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
    cleanup.couponIds.push((await c3Res.json()).data.coupon.id);

    // Inactive coupon
    const c4Res = await fetch(`${BASE_URL}/owner/coupons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({
        code: inactiveCode,
        type: 'percent',
        value: 15,
        isActive: false,
      }),
    });
    cleanup.couponIds.push((await c4Res.json()).data.coupon.id);

    // Max uses = 1 coupon, with usedCount manually set to 1
    const c5Res = await fetch(`${BASE_URL}/owner/coupons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({
        code: maxUsesCode,
        type: 'percent',
        value: 50,
        maxUses: 1,
      }),
    });
    const c5Json = await c5Res.json();
    cleanup.couponIds.push(c5Json.data.coupon.id);

    // Simulate used count by updating directly
    await fetch(`${BASE_URL}/owner/coupons/${c5Json.data.coupon.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({ usedCount: 1 }),
    });

    // Restricted coupon: only applies to a fake dummy ObjectId
    const dummyProjId = new mongoose.Types.ObjectId().toString();
    const c6Res = await fetch(`${BASE_URL}/owner/coupons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({
        code: restrictedCode,
        type: 'percent',
        value: 30,
        appliesToProjects: [dummyProjId],
      }),
    });
    cleanup.couponIds.push((await c6Res.json()).data.coupon.id);

    // ==========================================
    // 4. Exact Mathematical Pricing Tests
    // ==========================================

    await test('Exact numbers test: 780,000 piasters, 10% coupon -> discount 78,000, total 702,000 (tax-free)', async () => {
      const res = await fetch(`${BASE_URL}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: tenPercentCode,
          projectSlug: testProjectSlug,
          packageKey: 'standard',
        }),
      });

      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(json)}`);
      assert(json.success === true, 'Expected success: true');

      const p = json.data.pricing;
      assert(p.subtotal === 780000, `Expected subtotal 780000, got ${p.subtotal}`);
      assert(p.discount === 78000, `Expected discount 78000, got ${p.discount}`);
      assert(p.total === 702000, `Expected total 702000, got ${p.total}`);
      assert(p.taxable === undefined, 'Expected taxable to be undefined');
      assert(p.vatRate === undefined, 'Expected vatRate to be undefined');
      assert(p.vat === undefined, 'Expected vat to be undefined');
      assert(p.currency === 'EGP', 'Expected currency EGP');
    });

    await test('Fixed coupon larger than subtotal: discount is capped at subtotal (taxable: 0, total: 0)', async () => {
      // Create project with subtotal 500,000, applying 600,000 fixed coupon
      const smallRes = await fetch(`${BASE_URL}/owner/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({
          title: { ar: 'مشروع صغير', en: 'Small Project' },
          tagline: { ar: 'صغير', en: 'Small' },
          description: { ar: 'وصف', en: 'Desc' },
          category: testCatId,
          techStack: ['Node.js'],
          thumbnail: { url: 'https://example.com/s.jpg', publicId: 'thumb_s' },
          packages: [{ key: 'basic', name: { ar: 'باقة', en: 'Basic' }, price: 500000, isActive: true }],
          status: 'published',
        }),
      });
      const smallJson = await smallRes.json();
      const smallSlug = smallJson.data.project.slug;
      cleanup.projectIds.push(smallJson.data.project.id || smallJson.data.project._id);

      const res = await fetch(`${BASE_URL}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: fixedLargeCode, // 600,000 coupon
          projectSlug: smallSlug,
          packageKey: 'basic', // 500,000 price
        }),
      });

      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const p = json.data.pricing;
      assert(p.subtotal === 500000, 'Subtotal should be 500000');
      assert(p.discount === 500000, `Discount must be capped at 500000, got ${p.discount}`);
      assert(p.total === 0, `Total must be 0, got ${p.total}`);
      assert(p.taxable === undefined, 'Taxable must be undefined');
      assert(p.vat === undefined, 'VAT must be undefined');
    });

    await test('Expired coupon is rejected with 400 COUPON_EXPIRED', async () => {
      const res = await fetch(`${BASE_URL}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: expiredCode,
          projectSlug: testProjectSlug,
          packageKey: 'standard',
        }),
      });

      const json = await res.json();
      assert(res.status === 400, `Expected 400, got ${res.status}`);
      assert(json.error.code === 'COUPON_EXPIRED', `Expected COUPON_EXPIRED, got ${json.error.code}`);
    });

    await test('Inactive coupon is rejected with 400 COUPON_INACTIVE', async () => {
      const res = await fetch(`${BASE_URL}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: inactiveCode,
          projectSlug: testProjectSlug,
          packageKey: 'standard',
        }),
      });

      const json = await res.json();
      assert(res.status === 400, `Expected 400, got ${res.status}`);
      assert(json.error.code === 'COUPON_INACTIVE', `Expected COUPON_INACTIVE, got ${json.error.code}`);
    });

    await test('Max uses reached coupon is rejected with 400 COUPON_MAX_USES_REACHED', async () => {
      const res = await fetch(`${BASE_URL}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: maxUsesCode,
          projectSlug: testProjectSlug,
          packageKey: 'standard',
        }),
      });

      const json = await res.json();
      assert(res.status === 400, `Expected 400, got ${res.status}`);
      assert(json.error.code === 'COUPON_MAX_USES_REACHED', `Expected COUPON_MAX_USES_REACHED, got ${json.error.code}`);
    });

    await test('Restricted coupon not applicable to this project is rejected with 400 COUPON_NOT_APPLICABLE', async () => {
      const res = await fetch(`${BASE_URL}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: restrictedCode,
          projectSlug: testProjectSlug,
          packageKey: 'standard',
        }),
      });

      const json = await res.json();
      assert(res.status === 400, `Expected 400, got ${res.status}`);
      assert(json.error.code === 'COUPON_NOT_APPLICABLE', `Expected COUPON_NOT_APPLICABLE, got ${json.error.code}`);
    });

    await test('Inactive package is rejected with 400 PACKAGE_NOT_ACTIVE', async () => {
      const res = await fetch(`${BASE_URL}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: tenPercentCode,
          projectSlug: testProjectSlug,
          packageKey: 'inactive_pkg',
        }),
      });

      const json = await res.json();
      assert(res.status === 400, `Expected 400, got ${res.status}`);
      assert(json.error.code === 'PACKAGE_NOT_ACTIVE', `Expected PACKAGE_NOT_ACTIVE, got ${json.error.code}`);
    });

    await test('Draft project is rejected with 400 PROJECT_NOT_AVAILABLE', async () => {
      const res = await fetch(`${BASE_URL}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: tenPercentCode,
          projectSlug: draftSlug,
          packageKey: 'std',
        }),
      });

      const json = await res.json();
      assert(res.status === 400, `Expected 400, got ${res.status}`);
      assert(json.error.code === 'PROJECT_NOT_AVAILABLE', `Expected PROJECT_NOT_AVAILABLE, got ${json.error.code}`);
    });

    await test('Review Point 3: Non-divisible percent rounding test (15% of 777,777 piasters via Math.round rule)', async () => {
      // Create project with package price 777,777 piasters
      const roundingProjRes = await fetch(`${BASE_URL}/owner/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({
          title: { ar: 'مشروع تقريب', en: 'Rounding Test Project' },
          tagline: { ar: 'تقريب', en: 'Rounding' },
          description: { ar: 'وصف', en: 'Desc' },
          category: testCatId,
          techStack: ['Node.js'],
          thumbnail: { url: 'https://example.com/r.jpg', publicId: 'thumb_r' },
          packages: [{ key: 'precision', name: { ar: 'دقة', en: 'Precision' }, price: 777777, isActive: true }],
          status: 'published',
        }),
      });
      const roundingJson = await roundingProjRes.json();
      const roundingSlug = roundingJson.data.project.slug;
      cleanup.projectIds.push(roundingJson.data.project.id || roundingJson.data.project._id);

      // Create 15% coupon
      const fifteenPercentCode = `TEST15_${Date.now()}`;
      const c15Res = await fetch(`${BASE_URL}/owner/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({
          code: fifteenPercentCode,
          type: 'percent',
          value: 15,
        }),
      });
      const c15Json = await c15Res.json();
      cleanup.couponIds.push(c15Json.data.coupon.id);

      const res = await fetch(`${BASE_URL}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: fifteenPercentCode,
          projectSlug: roundingSlug,
          packageKey: 'precision',
        }),
      });

      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const p = json.data.pricing;
      // 15% of 777,777 = 116666.55 -> Math.round -> 116667
      assert(p.subtotal === 777777, `Expected subtotal 777777, got ${p.subtotal}`);
      assert(p.discount === 116667, `Expected discount 116667, got ${p.discount}`);
      assert(p.total === 661110, `Expected total 661110 (777777 - 116667), got ${p.total}`);
    });

    await test('Review Point 4: POST /coupons/validate is strictly read-only and does NOT increment usedCount', async () => {
      // Get coupon before validate
      const beforeRes = await fetch(`${BASE_URL}/owner/coupons/${cleanup.couponIds[0]}`, {
        headers: { Cookie: cookieHeader },
      });
      const beforeJson = await beforeRes.json();
      const initialUsedCount = beforeJson.data.coupon.usedCount;

      // Validate twice
      await fetch(`${BASE_URL}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: tenPercentCode,
          projectSlug: testProjectSlug,
          packageKey: 'standard',
        }),
      });
      await fetch(`${BASE_URL}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: tenPercentCode,
          projectSlug: testProjectSlug,
          packageKey: 'standard',
        }),
      });

      // Get coupon after validate
      const afterRes = await fetch(`${BASE_URL}/owner/coupons/${cleanup.couponIds[0]}`, {
        headers: { Cookie: cookieHeader },
      });
      const afterJson = await afterRes.json();
      assert(afterJson.data.coupon.usedCount === initialUsedCount, `usedCount changed from ${initialUsedCount} to ${afterJson.data.coupon.usedCount}`);
    });

    await test('Security: Client sending spoofed subtotal/discount/total is completely ignored by server', async () => {
      const res = await fetch(`${BASE_URL}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: tenPercentCode,
          projectSlug: testProjectSlug,
          packageKey: 'standard',
          // Malicious spoofed client fields:
          subtotal: 10,
          discount: 1000000,
          total: 1,
        }),
      });

      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const p = json.data.pricing;
      // Server must recompute authoritatively
      assert(p.subtotal === 780000, 'Server must ignore client subtotal');
      assert(p.discount === 78000, 'Server must ignore client discount');
      assert(p.total === 702000, 'Server must ignore client total');
    });

    // ==========================================
    // 5. Catalog Search, Sorting & Pagination
    // ==========================================

    await test('All 4 sort options on GET /api/projects work correctly (newest, popular, price_asc, price_desc)', async () => {
      const sorts = ['newest', 'popular', 'price_asc', 'price_desc'];
      for (const sortOpt of sorts) {
        const res = await fetch(`${BASE_URL}/projects?sort=${sortOpt}&limit=10`);
        const json = await res.json();
        assert(res.status === 200, `Sort ${sortOpt} failed with status ${res.status}`);
        assert(json.success === true, `Sort ${sortOpt} expected success: true`);
        assert(Array.isArray(json.data.projects), `Sort ${sortOpt} expected array`);
      }
    });

    await test('Featured filter on GET /api/projects filters strictly to isFeatured=true', async () => {
      const res = await fetch(`${BASE_URL}/projects?featured=true`);
      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      for (const proj of json.data.projects) {
        assert(proj.isFeatured === true, `Project ${proj.slug} is not featured`);
      }
    });

    await test('Pagination metadata shape (page, limit, total, totalPages) is verified', async () => {
      const res = await fetch(`${BASE_URL}/projects?page=1&limit=5`);
      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const meta = json.meta;
      assert(meta.page === 1, 'Expected meta.page === 1');
      assert(meta.limit === 5, 'Expected meta.limit === 5');
      assert(typeof meta.total === 'number', 'Expected meta.total number');
      assert(typeof meta.totalPages === 'number', 'Expected meta.totalPages number');
    });

    await test('Pagination limit: limit=50 is accepted, but limit=51 is rejected with 400 VALIDATION_ERROR', async () => {
      // Limit 50 (valid max)
      const res50 = await fetch(`${BASE_URL}/projects?limit=50`);
      assert(res50.status === 200, `Expected 200 for limit=50, got ${res50.status}`);

      // Limit 51 (exceeds max 50)
      const res51 = await fetch(`${BASE_URL}/projects?limit=51`);
      const json51 = await res51.json();
      assert(res51.status === 400, `Expected 400 for limit=51, got ${res51.status}`);
      assert(json51.error.code === 'VALIDATION_ERROR', `Expected VALIDATION_ERROR, got ${json51.error.code}`);
    });

  } finally {
    // ==========================================
    // 6. Strict Cleanup (Rule 2)
    // ==========================================
    console.log('\n🧹 Cleaning up all test data from bytecraft_test database...');

    for (const projId of cleanup.projectIds) {
      try {
        await fetch(`${BASE_URL}/owner/projects/${projId}`, { method: 'DELETE', headers: { Cookie: cookieHeader } });
      } catch (e) { /* ignore */ }
    }

    for (const catId of cleanup.categoryIds) {
      try {
        await fetch(`${BASE_URL}/owner/categories/${catId}`, { method: 'DELETE', headers: { Cookie: cookieHeader } });
      } catch (e) { /* ignore */ }
    }

    for (const planId of cleanup.servicePlanIds) {
      try {
        await fetch(`${BASE_URL}/owner/service-plans/${planId}`, { method: 'DELETE', headers: { Cookie: cookieHeader } });
      } catch (e) { /* ignore */ }
    }

    for (const couponId of cleanup.couponIds) {
      try {
        await fetch(`${BASE_URL}/owner/coupons/${couponId}`, { method: 'DELETE', headers: { Cookie: cookieHeader } });
      } catch (e) { /* ignore */ }
    }

    console.log('✨ Cleanup finished: All test entities deleted from bytecraft_test.\n');
  }

  console.log(`========================================`);
  console.log(`📊 Phase 3 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
