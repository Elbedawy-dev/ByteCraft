/**
 * Phase 1 Verification Tests
 * Target: http://localhost:5001/api (Database: bytecraft_test)
 */

const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = 5001;
const BASE_URL = `http://localhost:${PORT}/api`;
const OWNER_EMAIL = (process.env.OWNER_EMAIL || 'moaazelbedawy@gmail.com').trim();
const OWNER_PASSWORD = (process.env.OWNER_PASSWORD || 'SuperSecretPassword123!').trim();

// Target test database
let testMongoUri = (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bytecraft_test').trim();
if (testMongoUri.includes('.mongodb.net/')) {
  testMongoUri = testMongoUri.replace(/\.mongodb\.net\/([^?]+)/, '.mongodb.net/bytecraft_test');
} else {
  testMongoUri = testMongoUri.replace(/\/([^/?]+)(\?|$)/, '/bytecraft_test$2');
}

async function runTests() {
  console.log('🧪 Starting Phase 1 API Verification Tests on PORT 5001 (DB: bytecraft_test)...\n');
  let passed = 0;
  let failed = 0;
  let cookieHeader = '';

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

  // 0. Seed test owner & tax-free settings in bytecraft_test
  console.log('🌱 Ensuring test owner & settings in bytecraft_test...');
  let conn;
  try {
    conn = await mongoose.connect(testMongoUri, { serverSelectionTimeoutMS: 4000 });
  } catch (err) {
    conn = await mongoose.connect('mongodb://127.0.0.1:27017/bytecraft_test');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(OWNER_PASSWORD, salt);

  const Owner = conn.models.Owner || conn.model('Owner', new mongoose.Schema({
    key: { type: String, default: 'owner', unique: true },
    email: { type: String, unique: true },
    passwordHash: { type: String, select: false },
    name: String,
    lastLoginAt: Date,
  }, { timestamps: true }));

  const Settings = conn.models.Settings || conn.model('Settings', new mongoose.Schema({
    key: { type: String, default: 'main', unique: true },
    siteName: { type: String, default: 'ByteCraft' },
    guaranteeDays: { type: Number, default: 30 },
    contact: mongoose.Schema.Types.Mixed,
    paymentMethods: mongoose.Schema.Types.Mixed,
  }, { timestamps: true }));

  await Owner.findOneAndUpdate(
    { key: 'owner' },
    { email: OWNER_EMAIL.toLowerCase(), passwordHash, name: 'ByteCraft Owner' },
    { upsert: true }
  );

  await Settings.collection.updateMany({}, { $unset: { vatRate: '' } });
  await Settings.findOneAndUpdate(
    { key: 'main' },
    {
      $set: {
        siteName: 'ByteCraft',
        guaranteeDays: 30,
        paymentMethods: {
          vodafone_cash: { enabled: true, walletNumber: '01012345678', accountName: 'ByteCraft' },
          instapay: { enabled: true, ipa: 'bytecraft@instapay', accountName: 'ByteCraft' },
        },
      },
    },
    { upsert: true }
  );

  // 1. Health Check
  await test('GET /api/health returns status 200 and healthy DB connection', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const json = await res.json();
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(json.success === true, 'Expected success: true');
    assert(json.data.status === 'ok', 'Expected status: ok');
    assert(json.data.database === 'connected', 'Expected database: connected');
  });

  // 2. Owner Login (Invalid credentials)
  await test('POST /api/owner/login with invalid credentials returns 401 with standard envelope', async () => {
    const res = await fetch(`${BASE_URL}/owner/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: OWNER_EMAIL, password: 'WrongPassword999!' }),
    });
    const json = await res.json();
    assert(res.status === 401, `Expected 401, got ${res.status}`);
    assert(json.success === false, 'Expected success: false');
    assert(json.error.code === 'INVALID_CREDENTIALS', `Expected code INVALID_CREDENTIALS, got ${json.error.code}`);
  });

  // 3. Validation failure
  await test('POST /api/owner/login with malformed email triggers Zod validation error envelope', async () => {
    const res = await fetch(`${BASE_URL}/owner/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: 'Short' }),
    });
    const json = await res.json();
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(json.success === false, 'Expected success: false');
    assert(json.error.code === 'VALIDATION_ERROR', `Expected VALIDATION_ERROR, got ${json.error.code}`);
    assert(Array.isArray(json.error.details) && json.error.details.length > 0, 'Expected validation error details array');
  });

  // 4. Owner Login (Success)
  await test('POST /api/owner/login with valid credentials returns 200 and sets httpOnly cookie', async () => {
    const res = await fetch(`${BASE_URL}/owner/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: OWNER_EMAIL, password: OWNER_PASSWORD }),
    });
    const json = await res.json();
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(json.success === true, 'Expected success: true');
    assert(json.data.owner.email.toLowerCase() === OWNER_EMAIL.toLowerCase(), 'Owner email mismatch');

    const setCookie = res.headers.get('set-cookie');
    assert(setCookie && setCookie.includes('bc_owner='), 'Expected set-cookie header with bc_owner');
    assert(setCookie.includes('HttpOnly'), 'Expected HttpOnly flag in cookie');

    cookieHeader = setCookie.split(';')[0];
  });

  // 5. Owner /me unauthenticated
  await test('GET /api/owner/me without cookie returns 401 UNAUTHORIZED', async () => {
    const res = await fetch(`${BASE_URL}/owner/me`);
    const json = await res.json();
    assert(res.status === 401, `Expected 401, got ${res.status}`);
    assert(json.success === false, 'Expected success: false');
    assert(json.error.code === 'UNAUTHORIZED', 'Expected UNAUTHORIZED');
  });

  // 6. Owner /me authenticated
  await test('GET /api/owner/me with cookie returns 200 and owner profile', async () => {
    const res = await fetch(`${BASE_URL}/owner/me`, {
      headers: { Cookie: cookieHeader },
    });
    const json = await res.json();
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(json.success === true, 'Expected success: true');
    assert(json.data.owner.email.toLowerCase() === OWNER_EMAIL.toLowerCase(), 'Profile email mismatch');
    assert(json.data.owner.lastLoginAt !== null, 'lastLoginAt should be populated');
  });

  // 7. GET Settings
  await test('GET /api/owner/settings returns 200 and singleton site settings', async () => {
    const res = await fetch(`${BASE_URL}/owner/settings`, {
      headers: { Cookie: cookieHeader },
    });
    const json = await res.json();
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(json.success === true, 'Expected success: true');
    assert(json.data.settings.key === 'main', 'Expected settings key "main"');
    assert(json.data.settings.vatRate === undefined, 'VAT rate should be completely removed');
  });

  // 8. PATCH Settings
  await test('PATCH /api/owner/settings updates settings and returns updated document', async () => {
    const updatePayload = {
      siteName: 'ByteCraft Studio',
      paymentMethods: {
        vodafone_cash: {
          enabled: true,
          walletNumber: '01012345678',
          accountName: 'ByteCraft Tech',
        },
      },
    };

    const res = await fetch(`${BASE_URL}/owner/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify(updatePayload),
    });
    const json = await res.json();
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(json.success === true, 'Expected success: true');
    assert(json.data.settings.siteName === 'ByteCraft Studio', 'Site name should be updated');
    assert(json.data.settings.paymentMethods.vodafone_cash.enabled === true, 'Vodafone Cash should be enabled');
    assert(json.data.settings.paymentMethods.vodafone_cash.walletNumber === '01012345678', 'Wallet number updated');
  });

  // 9. Change Password (Wrong current password)
  await test('PATCH /api/owner/password with wrong current password returns 400', async () => {
    const res = await fetch(`${BASE_URL}/owner/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        currentPassword: 'IncorrectOldPassword123!',
        newPassword: 'BrandNewSecurePassword456!',
      }),
    });
    const json = await res.json();
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(json.success === false, 'Expected success: false');
    assert(json.error.code === 'INVALID_CURRENT_PASSWORD', `Expected INVALID_CURRENT_PASSWORD, got ${json.error.code}`);
  });

  // 10. Change Password (Success) and Reset back
  await test('PATCH /api/owner/password updates password and can be reset back', async () => {
    const res = await fetch(`${BASE_URL}/owner/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        currentPassword: OWNER_PASSWORD,
        newPassword: 'BrandNewSecurePassword456!',
      }),
    });
    const json = await res.json();
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(json.success === true, 'Expected success: true');

    // Reset password back so subsequent suites can log in with OWNER_PASSWORD
    const resetRes = await fetch(`${BASE_URL}/owner/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        currentPassword: 'BrandNewSecurePassword456!',
        newPassword: OWNER_PASSWORD,
      }),
    });
    const resetJson = await resetRes.json();
    assert(resetRes.status === 200, `Expected 200 on reset, got ${resetRes.status}`);
    assert(resetJson.success === true, 'Expected success on password reset');
  });

  // 11. Owner Logout
  await test('POST /api/owner/logout clears authentication cookie', async () => {
    const res = await fetch(`${BASE_URL}/owner/logout`, {
      method: 'POST',
      headers: { Cookie: cookieHeader },
    });
    const json = await res.json();
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(json.success === true, 'Expected success: true');

    const setCookie = res.headers.get('set-cookie');
    assert(setCookie && (setCookie.includes('bc_owner=;') || setCookie.includes('Max-Age=0') || setCookie.includes('Expires=Thu, 01 Jan 1970')), 'Expected cookie clear attributes');
  });

  // 12. Blocked after Logout
  await test('GET /api/owner/me without cookie is now rejected with 401', async () => {
    const res = await fetch(`${BASE_URL}/owner/me`);
    const json = await res.json();
    assert(res.status === 401, `Expected 401, got ${res.status}`);
    assert(json.success === false, 'Expected success: false');
  });

  // 13. 404 Route Handling
  await test('GET /api/nonexistent-route returns 404 with standard envelope', async () => {
    const res = await fetch(`${BASE_URL}/nonexistent-route`);
    const json = await res.json();
    assert(res.status === 404, `Expected 404, got ${res.status}`);
    assert(json.success === false, 'Expected success: false');
    assert(json.error.code === 'NOT_FOUND', `Expected NOT_FOUND, got ${json.error.code}`);
  });

  // 14. CSRF Protection Check
  await test('Mutating request with non-JSON Content-Type is rejected with 415', async () => {
    const res = await fetch(`${BASE_URL}/owner/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'email=owner@bytecraft.dev',
    });
    const json = await res.json();
    assert(res.status === 415, `Expected 415, got ${res.status}`);
    assert(json.success === false, 'Expected success: false');
    assert(json.error.code === 'UNSUPPORTED_MEDIA_TYPE', `Expected UNSUPPORTED_MEDIA_TYPE, got ${json.error.code}`);
  });

  await mongoose.disconnect();

  console.log(`\n========================================`);
  console.log(`📊 Phase 1 Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error in Phase 1:', err);
  process.exit(1);
});
