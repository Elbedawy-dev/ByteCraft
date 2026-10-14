/**
 * Phase 1 End-to-End Verification Test Script
 * 
 * Tests all Phase 1 endpoints against the running server on http://localhost:5000:
 * 1. Health check
 * 2. Owner login (failure case)
 * 3. Owner login (success case, cookie verification)
 * 4. Owner me (unauthenticated check)
 * 5. Owner me (authenticated check)
 * 6. Settings get
 * 7. Settings update (VAT & Vodafone Cash)
 * 8. Owner change password (wrong current password)
 * 9. Owner change password (success)
 * 10. Login with new password
 * 11. Owner logout (cookie clearing)
 * 12. Owner me after logout (blocked)
 * 13. 404 Route handling envelope
 * 14. CSRF protection verification
 * 15. Zod input validation failure envelope
 */

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Phase 1 API Verification Tests...\n');
  let passed = 0;
  let failed = 0;
  let cookieHeader = '';

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

  function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
  }

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
      body: JSON.stringify({ email: 'owner@bytecraft.dev', password: 'WrongPassword999!' }),
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
      body: JSON.stringify({ email: 'owner@bytecraft.dev', password: 'SuperSecretPassword123!' }),
    });
    const json = await res.json();
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(json.success === true, 'Expected success: true');
    assert(json.data.owner.email === 'owner@bytecraft.dev', 'Owner email mismatch');

    const setCookie = res.headers.get('set-cookie');
    assert(setCookie && setCookie.includes('bc_owner='), 'Expected set-cookie header with bc_owner');
    assert(setCookie.includes('HttpOnly'), 'Expected HttpOnly flag in cookie');

    // Extract cookie value for subsequent authenticated calls
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
    assert(json.data.owner.email === 'owner@bytecraft.dev', 'Profile email mismatch');
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
    assert(json.data.settings.vatRate === 14, 'Expected default VAT rate 14');
  });

  // 8. PATCH Settings
  await test('PATCH /api/owner/settings updates settings and returns updated document', async () => {
    const updatePayload = {
      vatRate: 15,
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
    assert(json.data.settings.vatRate === 15, 'VAT rate should be updated to 15');
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

  // 10. Change Password (Success)
  await test('PATCH /api/owner/password with correct current password returns 200', async () => {
    const res = await fetch(`${BASE_URL}/owner/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        currentPassword: 'SuperSecretPassword123!',
        newPassword: 'BrandNewSecurePassword456!',
      }),
    });
    const json = await res.json();
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(json.success === true, 'Expected success: true');
    assert(json.data.message === 'Password updated successfully', 'Expected success message');
  });

  // 11. Verify Login with New Password
  await test('POST /api/owner/login succeeds with newly changed password', async () => {
    const res = await fetch(`${BASE_URL}/owner/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'owner@bytecraft.dev',
        password: 'BrandNewSecurePassword456!',
      }),
    });
    const json = await res.json();
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(json.success === true, 'Expected success: true');

    const setCookie = res.headers.get('set-cookie');
    cookieHeader = setCookie.split(';')[0];
  });

  // 12. Owner Logout
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

  // 13. Blocked after Logout
  await test('GET /api/owner/me without cookie is now rejected with 401', async () => {
    const res = await fetch(`${BASE_URL}/owner/me`);
    const json = await res.json();
    assert(res.status === 401, `Expected 401, got ${res.status}`);
    assert(json.success === false, 'Expected success: false');
  });

  // 14. 404 Route Handling
  await test('GET /api/nonexistent-route returns 404 with standard envelope', async () => {
    const res = await fetch(`${BASE_URL}/nonexistent-route`);
    const json = await res.json();
    assert(res.status === 404, `Expected 404, got ${res.status}`);
    assert(json.success === false, 'Expected success: false');
    assert(json.error.code === 'NOT_FOUND', `Expected NOT_FOUND, got ${json.error.code}`);
  });

  // 15. CSRF Protection Check
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

  console.log(`\n========================================`);
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
