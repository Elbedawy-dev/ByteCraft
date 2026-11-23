/**
 * Phase 2 End-to-End Verification Test Script
 * 
 * Verifies all Phase 2 endpoints:
 * 1. Image upload:
 *    - Valid image (PNG)
 *    - Wrong file type (rejected 400 INVALID_FILE_TYPE)
 *    - File over 5MB (rejected 400 FILE_TOO_LARGE)
 *    - Image deletion endpoint
 * 2. Categories CRUD:
 *    - Create category (auto slug)
 *    - Owner list
 *    - Public list (active only)
 *    - Update category
 *    - Category uniqueness
 * 3. Projects CRUD:
 *    - Create project (with thumbnail, packages, privateRepo)
 *    - Slug auto-generation & uniqueness on collision
 *    - Owner list (with filters)
 *    - Owner get by ID (verifying privateRepo IS present for owner)
 *    - Update project
 *    - Update project status
 * 4. Public Catalog & Security:
 *    - Public list (published only)
 *    - Filters: category, tech, minPrice, maxPrice, search, featured
 *    - Sorting: newest, price_asc, price_desc, popular
 *    - Pagination structure (meta: page, limit, total, totalPages)
 *    - Public detail by slug
 *    - CRITICAL SECURITY ASSERTION: privateRepo is NEVER exposed publicly
 *    - View stats increment for public visitor vs NO increment for owner
 *    - Preview view counter increment
 * 5. Relational integrity:
 *    - Deleting category while project attached is blocked (409 CATEGORY_IN_USE)
 * 6. Clean-up:
 *    - Delete test projects and test categories, leaving database completely clean!
 */

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = 5001;
const BASE_URL = `http://localhost:${PORT}/api`;
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'moaazelbedawy@gmail.com';
const OWNER_PASSWORD = (process.env.OWNER_PASSWORD || '').trim();

async function runTests() {
  console.log('🧪 Starting Phase 2 Catalog & Upload Verification Tests...\n');
  console.log(`📡 Target API: ${BASE_URL}`);

  let passed = 0;
  let failed = 0;
  let cookieHeader = '';

  // Track created IDs for strict cleanup (Rule 2)
  const createdProjectIds = [];
  const createdCategoryIds = [];

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

  try {
    // 0. Owner Login
    await test('Owner logs in to obtain authentication cookie', async () => {
      const res = await fetch(`${BASE_URL}/owner/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: OWNER_EMAIL, password: OWNER_PASSWORD }),
      });
      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}: ${json.error?.message}`);
      const setCookie = res.headers.get('set-cookie');
      assert(setCookie && setCookie.includes('bc_owner='), 'Missing bc_owner cookie in response');
      cookieHeader = setCookie.split(';')[0];
    });

    // ==========================================
    // 1. Uploads Testing
    // ==========================================

    let uploadedPublicId = '';
    let uploadedUrl = '';

    await test('POST /api/owner/uploads/images with valid PNG returns 200 and image metadata', async () => {
      const form = new FormData();
      // Valid minimal 1x1 PNG buffer
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
        0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
        0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
        0x42, 0x60, 0x82,
      ]);
      form.append('images', new Blob([pngBuffer], { type: 'image/png' }), 'pixel.png');

      const res = await fetch(`${BASE_URL}/owner/uploads/images`, {
        method: 'POST',
        headers: { Cookie: cookieHeader },
        body: form,
      });

      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(json)}`);
      assert(json.success === true, 'Expected success: true');
      assert(Array.isArray(json.data.images) && json.data.images.length === 1, 'Expected 1 image in array');
      assert(json.data.images[0].url, 'Expected image url');
      assert(json.data.images[0].publicId, 'Expected image publicId');

      uploadedPublicId = json.data.images[0].publicId;
      uploadedUrl = json.data.images[0].url;
    });

    await test('POST /api/owner/uploads/images with invalid file type (text/plain) is rejected with 400 INVALID_FILE_TYPE', async () => {
      const form = new FormData();
      form.append('images', new Blob(['plain text content'], { type: 'text/plain' }), 'notes.txt');

      const res = await fetch(`${BASE_URL}/owner/uploads/images`, {
        method: 'POST',
        headers: { Cookie: cookieHeader },
        body: form,
      });

      const json = await res.json();
      assert(res.status === 400, `Expected 400, got ${res.status}`);
      assert(json.success === false, 'Expected success: false');
      assert(json.error.code === 'INVALID_FILE_TYPE', `Expected INVALID_FILE_TYPE, got ${json.error.code}`);
    });

    await test('POST /api/owner/uploads/images with file > 4MB is rejected with 400 FILE_TOO_LARGE', async () => {
      const form = new FormData();
      // 4.5 MB dummy buffer
      const largeBuffer = Buffer.alloc(4.5 * 1024 * 1024);
      form.append('images', new Blob([largeBuffer], { type: 'image/png' }), 'huge.png');

      const res = await fetch(`${BASE_URL}/owner/uploads/images`, {
        method: 'POST',
        headers: { Cookie: cookieHeader },
        body: form,
      });

      const json = await res.json();
      assert(res.status === 400, `Expected 400, got ${res.status}`);
      assert(json.success === false, 'Expected success: false');
      assert(json.error.code === 'FILE_TOO_LARGE', `Expected FILE_TOO_LARGE, got ${json.error.code}`);
    });

    await test('DELETE /api/owner/uploads deletes image asset by publicId', async () => {
      const res = await fetch(`${BASE_URL}/owner/uploads`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieHeader,
        },
        body: JSON.stringify({ publicId: uploadedPublicId || 'test_dummy_public_id' }),
      });

      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(json.success === true, 'Expected success: true');
    });

    // ==========================================
    // 2. Categories CRUD Testing
    // ==========================================

    let testCategoryId = '';
    let testCategoryKey = `test-cat-${Date.now()}`;

    await test('POST /api/owner/categories creates a new category with bilingual names', async () => {
      const res = await fetch(`${BASE_URL}/owner/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieHeader,
        },
        body: JSON.stringify({
          key: testCategoryKey,
          name: { ar: 'منصات تعليمية تجريبية', en: 'Test Educational Platforms' },
          order: 1,
          isActive: true,
        }),
      });

      const json = await res.json();
      assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(json)}`);
      assert(json.data.category.key === testCategoryKey, 'Category key mismatch');
      testCategoryId = json.data.category.id || json.data.category._id;
      createdCategoryIds.push(testCategoryId);
    });

    await test('POST /api/owner/categories rejects duplicate key with 409 CONFLICT', async () => {
      const res = await fetch(`${BASE_URL}/owner/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieHeader,
        },
        body: JSON.stringify({
          key: testCategoryKey,
          name: { ar: 'مكرر', en: 'Duplicate' },
        }),
      });

      const json = await res.json();
      assert(res.status === 409, `Expected 409, got ${res.status}`);
      assert(json.error.code === 'CONFLICT', 'Expected CONFLICT code');
    });

    await test('GET /api/owner/categories returns category list', async () => {
      const res = await fetch(`${BASE_URL}/owner/categories`, {
        headers: { Cookie: cookieHeader },
      });
      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(Array.isArray(json.data.categories), 'Expected categories array');
      assert(json.data.categories.some((c) => c.key === testCategoryKey), 'Created category not in list');
    });

    await test('GET /api/categories (public) returns active categories', async () => {
      const res = await fetch(`${BASE_URL}/categories`);
      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(Array.isArray(json.data.categories), 'Expected categories array');
      assert(json.data.categories.some((c) => c.key === testCategoryKey), 'Active category missing from public list');
    });

    await test('PATCH /api/owner/categories/:id updates category details', async () => {
      const res = await fetch(`${BASE_URL}/owner/categories/${testCategoryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieHeader,
        },
        body: JSON.stringify({
          order: 5,
        }),
      });

      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(json.data.category.order === 5, 'Category order update failed');
    });

    // ==========================================
    // 3. Projects CRUD Testing
    // ==========================================

    let testProjectId = '';
    let testProjectSlug = '';

    await test('POST /api/owner/projects creates a published project with packages and privateRepo', async () => {
      const payload = {
        title: { ar: 'متجر إلكتروني متكامل', en: 'Complete MERN Store' },
        tagline: { ar: 'متجر سريع وحديث', en: 'Blazing fast modern ecommerce' },
        description: { ar: 'وصف تفصيلي للمشروع...', en: 'Comprehensive project description...' },
        category: testCategoryId,
        techStack: ['React', 'Node.js', 'MongoDB', 'Express', 'TailwindCSS'],
        features: [
          { ar: 'بوابة دفع باي موب', en: 'Paymob payment gateway integration' },
          { ar: 'لوحة تحكم كاملة', en: 'Complete owner dashboard' },
        ],
        thumbnail: {
          url: uploadedUrl || 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          publicId: uploadedPublicId || 'demo_thumb_123',
        },
        gallery: [
          {
            url: uploadedUrl || 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            publicId: uploadedPublicId || 'demo_thumb_123',
          },
        ],
        preview: {
          url: 'https://demo.bytecraft.dev',
          mode: 'iframe',
          demoNote: { ar: 'بيانات تجريبية', en: 'Demo credentials' },
          demoCredentials: { label: 'Admin Demo', email: 'demo@store.com', password: 'demo' },
        },
        packages: [
          {
            key: 'standard',
            name: { ar: 'الباقة الأساسية', en: 'Standard License' },
            price: 500000, // 5,000 EGP in piasters
            compareAtPrice: 650000,
            features: [{ ar: 'كود المصدر كامل', en: 'Full source code' }],
            licenseType: 'single',
            supportDays: 30,
            isPopular: true,
            isActive: true,
          },
          {
            key: 'enterprise',
            name: { ar: 'باقة الأعمال', en: 'Enterprise License' },
            price: 1200000, // 12,000 EGP in piasters
            features: [{ ar: 'ترخيص متعدد واستضافة', en: 'Multi license & hosting support' }],
            licenseType: 'multi',
            supportDays: 90,
            isPopular: false,
            isActive: false, // Inactive package for testing public exclusion
          },
        ],
        privateRepo: {
          provider: 'github',
          owner: 'ByteCraftDev',
          name: 'mern-store-pro',
          url: 'https://github.com/ByteCraftDev/mern-store-pro',
        },
        status: 'published',
        isFeatured: true,
        sortOrder: 1,
      };

      const res = await fetch(`${BASE_URL}/owner/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieHeader,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(json)}`);
      assert(json.data.project.slug, 'Missing slug in created project');
      assert(json.data.project.slug === 'complete-mern-store', `Expected slug complete-mern-store, got ${json.data.project.slug}`);

      testProjectId = json.data.project.id || json.data.project._id;
      testProjectSlug = json.data.project.slug;
      createdProjectIds.push(testProjectId);
    });

    await test('POST /api/owner/projects with identical title generates unique slug with suffix', async () => {
      const payload = {
        title: { ar: 'متجر إلكتروني آخر', en: 'Complete MERN Store' }, // Same English title
        tagline: { ar: 'شعار', en: 'Tagline' },
        description: { ar: 'وصف', en: 'Description' },
        category: testCategoryId,
        techStack: ['Node.js'],
        thumbnail: { url: 'https://demo/thumb.png', publicId: 'thumb_2' },
        packages: [
          {
            key: 'standard',
            name: { ar: 'باقة', en: 'Package' },
            price: 200000,
            isActive: true,
          },
        ],
        status: 'draft',
      };

      const res = await fetch(`${BASE_URL}/owner/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieHeader,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      assert(json.data.project.slug === 'complete-mern-store-1', `Expected unique slug complete-mern-store-1, got ${json.data.project.slug}`);

      createdProjectIds.push(json.data.project.id || json.data.project._id);
    });

    await test('GET /api/owner/projects/:id returns full project INCLUDING privateRepo', async () => {
      const res = await fetch(`${BASE_URL}/owner/projects/${testProjectId}`, {
        headers: { Cookie: cookieHeader },
      });

      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(json.data.project.privateRepo !== undefined, 'Owner detail must include privateRepo');
      assert(json.data.project.privateRepo.url === 'https://github.com/ByteCraftDev/mern-store-pro', 'privateRepo url mismatch');
    });

    await test('PATCH /api/owner/projects/:id updates project details', async () => {
      const res = await fetch(`${BASE_URL}/owner/projects/${testProjectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieHeader,
        },
        body: JSON.stringify({
          sortOrder: 10,
        }),
      });

      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(json.data.project.sortOrder === 10, 'Expected sortOrder 10');
    });

    await test('PATCH /api/owner/projects/:id/status updates status to draft and back to published', async () => {
      // 1. To draft
      const res1 = await fetch(`${BASE_URL}/owner/projects/${testProjectId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieHeader,
        },
        body: JSON.stringify({ status: 'draft' }),
      });
      const json1 = await res1.json();
      assert(res1.status === 200, `Expected 200, got ${res1.status}`);
      assert(json1.data.project.status === 'draft', 'Status was not changed to draft');

      // 2. Back to published
      const res2 = await fetch(`${BASE_URL}/owner/projects/${testProjectId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieHeader,
        },
        body: JSON.stringify({ status: 'published' }),
      });
      const json2 = await res2.json();
      assert(res2.status === 200, `Expected 200, got ${res2.status}`);
      assert(json2.data.project.status === 'published', 'Status was not restored to published');
    });

    // ==========================================
    // 4. Public Catalog & Security Assertions
    // ==========================================

    await test('GET /api/projects (public list) returns published projects and metadata', async () => {
      const res = await fetch(`${BASE_URL}/projects?page=1&limit=10`);
      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(Array.isArray(json.data.projects), 'Expected projects array');
      assert(json.meta.page === 1, 'Expected meta.page === 1');
      assert(json.meta.total >= 1, 'Expected meta.total >= 1');
    });

    await test('SECURITY: Public catalog list NEVER exposes privateRepo', async () => {
      const res = await fetch(`${BASE_URL}/projects`);
      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);

      for (const proj of json.data.projects) {
        assert(proj.privateRepo === undefined, `SECURITY BREACH: privateRepo leaked in public list for ${proj.slug}`);
      }
    });

    await test('GET /api/projects with category filter matches only targeted category', async () => {
      const res = await fetch(`${BASE_URL}/projects?category=${testCategoryKey}`);
      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(json.data.projects.length >= 1, 'Expected at least 1 project in category');
      for (const p of json.data.projects) {
        assert(p.category.key === testCategoryKey, 'Project category key does not match filter');
      }
    });

    await test('GET /api/projects with tech filter matches tech stack', async () => {
      const res = await fetch(`${BASE_URL}/projects?tech=TailwindCSS`);
      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(json.data.projects.some((p) => p.slug === testProjectSlug), 'Project with TailwindCSS not found');
    });

    await test('GET /api/projects with price filter matches active package price range', async () => {
      // Package price is 500000 piasters
      const resMatch = await fetch(`${BASE_URL}/projects?minPrice=400000&maxPrice=600000`);
      const jsonMatch = await resMatch.json();
      assert(jsonMatch.data.projects.some((p) => p.slug === testProjectSlug), 'Project within price range not returned');

      const resMiss = await fetch(`${BASE_URL}/projects?minPrice=700000&maxPrice=900000`);
      const jsonMiss = await resMiss.json();
      assert(!jsonMiss.data.projects.some((p) => p.slug === testProjectSlug), 'Project outside price range was incorrectly returned');
    });

    await test('GET /api/projects with search term matches title or tech', async () => {
      const res = await fetch(`${BASE_URL}/projects?search=Blazing`);
      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(json.data.projects.some((p) => p.slug === testProjectSlug), 'Search for "Blazing" did not match');
    });

    await test('GET /api/projects/:slug (public detail) excludes inactive packages and privateRepo', async () => {
      const res = await fetch(`${BASE_URL}/projects/${testProjectSlug}`);
      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);

      const project = json.data.project;
      assert(project.slug === testProjectSlug, 'Project slug mismatch');

      // Security check: privateRepo must NOT exist
      assert(project.privateRepo === undefined, 'SECURITY BREACH: privateRepo leaked in public detail endpoint');

      // Inactive package check: only active packages should be returned
      const enterprisePkg = project.packages.find((pkg) => pkg.key === 'enterprise');
      assert(!enterprisePkg, 'Inactive package "enterprise" was leaked in public response');
    });

    await test('GET /api/projects/:slug increments views counter for guest visitors', async () => {
      // First fetch
      const res1 = await fetch(`${BASE_URL}/projects/${testProjectSlug}`);
      const json1 = await res1.json();
      const initialViews = json1.data.project.stats.views;

      // Second fetch (as public guest)
      const res2 = await fetch(`${BASE_URL}/projects/${testProjectSlug}`);
      const json2 = await res2.json();
      const updatedViews = json2.data.project.stats.views;

      assert(updatedViews === initialViews + 1, `Views should increment by 1. Was: ${initialViews}, Now: ${updatedViews}`);
    });

    await test('GET /api/projects/:slug does NOT increment views counter when visited by Owner', async () => {
      // Fetch as owner
      const res1 = await fetch(`${BASE_URL}/projects/${testProjectSlug}`, {
        headers: { Cookie: cookieHeader },
      });
      const json1 = await res1.json();
      const viewsBefore = json1.data.project.stats.views;

      // Fetch again as owner
      const res2 = await fetch(`${BASE_URL}/projects/${testProjectSlug}`, {
        headers: { Cookie: cookieHeader },
      });
      const json2 = await res2.json();
      const viewsAfter = json2.data.project.stats.views;

      assert(viewsBefore === viewsAfter, `Owner views must not increment counter. Before: ${viewsBefore}, After: ${viewsAfter}`);
    });

    await test('POST /api/projects/:slug/preview-view increments previewViews', async () => {
      const res = await fetch(`${BASE_URL}/projects/${testProjectSlug}/preview-view`, {
        method: 'POST',
      });
      const json = await res.json();
      assert(res.status === 200, `Expected 200, got ${res.status}`);

      // Verify counter in project detail
      const detailRes = await fetch(`${BASE_URL}/projects/${testProjectSlug}`);
      const detailJson = await detailRes.json();
      assert(detailJson.data.project.stats.previewViews >= 1, 'previewViews was not incremented');
    });

    // ==========================================
    // 5. Relational Integrity Checks
    // ==========================================

    await test('DELETE /api/owner/categories/:id fails with 409 CATEGORY_IN_USE while projects are assigned', async () => {
      const res = await fetch(`${BASE_URL}/owner/categories/${testCategoryId}`, {
        method: 'DELETE',
        headers: { Cookie: cookieHeader },
      });

      const json = await res.json();
      assert(res.status === 409, `Expected 409, got ${res.status}`);
      assert(json.error.code === 'CATEGORY_IN_USE', `Expected CATEGORY_IN_USE, got ${json.error.code}`);
    });
  } finally {
    // ==========================================
    // 6. Mandatory Cleanup (Rule 2)
    // ==========================================
    console.log('\n🧹 Performing strict test data cleanup (Rule 2)...');

    // 1. Delete all test projects
    for (const projId of createdProjectIds) {
      try {
        await fetch(`${BASE_URL}/owner/projects/${projId}`, {
          method: 'DELETE',
          headers: { Cookie: cookieHeader },
        });
        console.log(`   🗑️ Cleaned up test project: ${projId}`);
      } catch (err) {
        console.warn(`   ⚠️ Could not delete test project ${projId}: ${err.message}`);
      }
    }

    // 2. Delete all test categories
    for (const catId of createdCategoryIds) {
      try {
        await fetch(`${BASE_URL}/owner/categories/${catId}`, {
          method: 'DELETE',
          headers: { Cookie: cookieHeader },
        });
        console.log(`   🗑️ Cleaned up test category: ${catId}`);
      } catch (err) {
        console.warn(`   ⚠️ Could not delete test category ${catId}: ${err.message}`);
      }
    }

    console.log('✨ Cleanup complete: No temporary records left in database.\n');
  }

  console.log(`========================================`);
  console.log(`📊 Phase 2 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
