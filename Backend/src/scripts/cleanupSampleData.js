const { connectDB, disconnectDB } = require('../config/db');
const cloudinary = require('../config/cloudinary');
const Category = require('../models/Category');
const Counter = require('../models/Counter');
const Coupon = require('../models/Coupon');
const Inquiry = require('../models/Inquiry');
const Order = require('../models/Order');
const Project = require('../models/Project');
const Review = require('../models/Review');
const ServicePlan = require('../models/ServicePlan');
const Settings = require('../models/Settings');
const User = require('../models/User');

/**
 * Database Sample Data Cleanup Script (`npm run db:cleanup-sample`)
 * 
 * WHY:
 * 1. Default mode: DRY RUN that counts sample/test entities without deleting anything.
 * 2. Confirmed deletion: Requires explicit `--confirm --db=<exact_database_name>` and refuses
 *    if the connected database differs, preventing accidental production deletions.
 * 3. Safe wipe for test DB: `--wipe` is strictly allowed ONLY on `bytecraft_test` (drops all
 *    catalog/order data while preserving Owner and Settings documents).
 * 4. NEVER touches Owner or Settings under any circumstances.
 * 5. Best-effort deletes Cloudinary assets associated with deleted entities.
 */

const TEST_PREFIX_REGEX = /^(FE-P|\[TEST\]|Test|test|probe-|p8-)/i;
const FAKE_EMAIL_REGEX = /@(example\.com|test\.com|mailinator\.com|sample\.com|spam\.net)$/i;

async function destroyCloudinaryAsset(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    // Best effort — ignore deletion failures for already removed or placeholder assets
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isConfirm = args.includes('--confirm');
  const isWipe = args.includes('--wipe');

  const dbArgMatch = args.find((a) => a.startsWith('--db='));
  const specifiedDb = dbArgMatch ? dbArgMatch.split('=')[1].trim() : null;

  console.log('🧹 Nexus Sample Data Cleanup Utility');
  console.log('====================================================');

  await connectDB({ exitOnError: false });
  const mongoose = require('mongoose');
  const actualDb = mongoose.connection.name;

  console.log(`📡 Connected Database: "${actualDb}"`);

  // Guard: Wipe is strictly restricted to bytecraft_test
  if (isWipe) {
    if (actualDb !== 'bytecraft_test') {
      console.error(`\n❌ [SECURITY REJECTION] The --wipe flag is strictly permitted ONLY on the "bytecraft_test" database.`);
      console.error(`   Connected database is "${actualDb}". Operation terminated immediately.\n`);
      await disconnectDB();
      process.exit(1);
    }

    console.log(`\n⚠️  [WIPE MODE] Wiping all test data from "bytecraft_test" (Preserving Owner & Settings)...`);

    // Collect publicIds from Projects, Orders, Inquiries
    const projects = await Project.find({}, 'thumbnail gallery');
    for (const p of projects) {
      if (p.thumbnail?.publicId) await destroyCloudinaryAsset(p.thumbnail.publicId);
      if (Array.isArray(p.gallery)) {
        for (const g of p.gallery) {
          if (g.publicId) await destroyCloudinaryAsset(g.publicId);
        }
      }
    }

    const orders = await Order.find({}, 'payment.proof.publicId');
    for (const o of orders) {
      if (o.payment?.proof?.publicId) await destroyCloudinaryAsset(o.payment.proof.publicId);
    }

    const inquiries = await Inquiry.find({}, 'attachments.publicId');
    for (const inq of inquiries) {
      if (Array.isArray(inq.attachments)) {
        for (const att of inq.attachments) {
          if (att.publicId) await destroyCloudinaryAsset(att.publicId);
        }
      }
    }

    const [delProj, delCat, delCpn, delPlans, delOrders, delInq, delRev, delCount] = await Promise.all([
      Project.deleteMany({}),
      Category.deleteMany({}),
      Coupon.deleteMany({}),
      ServicePlan.deleteMany({}),
      Order.deleteMany({}),
      Inquiry.deleteMany({}),
      Review.deleteMany({}),
      Counter.deleteMany({}),
    ]);

    console.log(`✅ [WIPED] Cleaned test database collections:`);
    console.log(`   - Projects deleted: ${delProj.deletedCount}`);
    console.log(`   - Categories deleted: ${delCat.deletedCount}`);
    console.log(`   - Coupons deleted: ${delCpn.deletedCount}`);
    console.log(`   - Service Plans deleted: ${delPlans.deletedCount}`);
    console.log(`   - Orders deleted: ${delOrders.deletedCount}`);
    console.log(`   - Inquiries deleted: ${delInq.deletedCount}`);
    console.log(`   - Reviews deleted: ${delRev.deletedCount}`);
    console.log(`   - Counters reset: ${delCount.deletedCount}`);
    console.log(`🔒 Owner and Settings documents were preserved safely.`);
    console.log('====================================================\n');

    await disconnectDB();
    process.exit(0);
  }

  // ---------------------------------------------------------
  // Sample Data Identification
  // ---------------------------------------------------------
  // 1. Projects
  const sampleProjects = await Project.find({
    $or: [
      { 'title.en': TEST_PREFIX_REGEX },
      { 'title.ar': TEST_PREFIX_REGEX },
      { slug: TEST_PREFIX_REGEX },
    ],
  });
  const sampleProjectIds = sampleProjects.map((p) => p._id);

  // 2. Categories
  const sampleCategories = await Category.find({
    $or: [
      { key: TEST_PREFIX_REGEX },
      { 'name.en': TEST_PREFIX_REGEX },
      { 'name.ar': TEST_PREFIX_REGEX },
    ],
  });

  // 3. Coupons
  const sampleCoupons = await Coupon.find({
    code: TEST_PREFIX_REGEX,
  });

  // 4. Service Plans
  const samplePlans = await ServicePlan.find({
    $or: [
      { 'name.en': TEST_PREFIX_REGEX },
      { 'name.ar': TEST_PREFIX_REGEX },
      { group: TEST_PREFIX_REGEX },
    ],
  });

  // 5. Orders (matching test criteria or referencing deleted projects)
  const sampleOrders = await Order.find({
    $or: [
      { orderNumber: TEST_PREFIX_REGEX },
      { 'customer.fullName': TEST_PREFIX_REGEX },
      { 'customer.email': FAKE_EMAIL_REGEX },
      { project: { $in: sampleProjectIds } },
    ],
  });
  const sampleOrderIds = sampleOrders.map((o) => o._id);

  // 6. Inquiries
  const sampleInquiries = await Inquiry.find({
    $or: [
      { fullName: TEST_PREFIX_REGEX },
      { email: FAKE_EMAIL_REGEX },
      { subject: TEST_PREFIX_REGEX },
    ],
  });

  // 7. Reviews (matching test criteria or referencing deleted projects/orders)
  const sampleReviews = await Review.find({
    $or: [
      { customerName: TEST_PREFIX_REGEX },
      { comment: TEST_PREFIX_REGEX },
      { project: { $in: sampleProjectIds } },
      { order: { $in: sampleOrderIds } },
    ],
  });

  // Count Cloudinary assets to be cleaned
  let cloudinaryAssetCount = 0;
  sampleProjects.forEach((p) => {
    if (p.thumbnail?.publicId) cloudinaryAssetCount++;
    if (Array.isArray(p.gallery)) cloudinaryAssetCount += p.gallery.filter((g) => g.publicId).length;
  });
  sampleOrders.forEach((o) => {
    if (o.payment?.proof?.publicId) cloudinaryAssetCount++;
  });
  sampleInquiries.forEach((inq) => {
    if (Array.isArray(inq.attachments)) cloudinaryAssetCount += inq.attachments.filter((a) => a.publicId).length;
  });

  // ---------------------------------------------------------
  // DRY RUN Execution (Default)
  // ---------------------------------------------------------
  if (!isConfirm) {
    console.log(`\n🔍 [DRY RUN MODE] Scanning for test/sample fixtures...`);
    console.log(`   (No records will be deleted without --confirm --db=${actualDb})\n`);
    console.log(`Matching entities identified for deletion:`);
    console.log(`   - Projects: ${sampleProjects.length}`);
    console.log(`   - Categories: ${sampleCategories.length}`);
    console.log(`   - Coupons: ${sampleCoupons.length}`);
    console.log(`   - Service Plans: ${samplePlans.length}`);
    console.log(`   - Orders: ${sampleOrders.length}`);
    console.log(`   - Inquiries: ${sampleInquiries.length}`);
    console.log(`   - Reviews: ${sampleReviews.length}`);
    console.log(`   - Cloudinary Assets queued: ${cloudinaryAssetCount}`);
    console.log(`\n🔒 Owner and Settings documents will NEVER be touched.`);
    console.log(`\n👉 To perform actual deletion, run:`);
    console.log(`   npm run db:cleanup-sample -- --confirm --db=${actualDb}\n`);
    console.log('====================================================\n');
    await disconnectDB();
    process.exit(0);
  }

  // ---------------------------------------------------------
  // Confirmed Real Deletion
  // ---------------------------------------------------------
  if (!specifiedDb) {
    console.error(`\n❌ [ABORTED] You passed --confirm without specifying --db=<exact_database_name>.`);
    console.error(`   Example: npm run db:cleanup-sample -- --confirm --db=${actualDb}\n`);
    await disconnectDB();
    process.exit(1);
  }

  if (specifiedDb !== actualDb) {
    console.error(`\n❌ [DATABASE MISMATCH] Specified database "${specifiedDb}" does NOT match connected database "${actualDb}".`);
    console.error(`   Operation aborted to prevent data loss on an unintended database.\n`);
    await disconnectDB();
    process.exit(1);
  }

  console.log(`\n🚨 [CONFIRMED DELETION] Purging ${sampleProjects.length + sampleCategories.length + sampleCoupons.length + samplePlans.length + sampleOrders.length + sampleInquiries.length + sampleReviews.length} sample fixtures from "${actualDb}"...`);

  // 1. Destroy Cloudinary assets (best effort)
  for (const p of sampleProjects) {
    if (p.thumbnail?.publicId) await destroyCloudinaryAsset(p.thumbnail.publicId);
    if (Array.isArray(p.gallery)) {
      for (const g of p.gallery) {
        if (g.publicId) await destroyCloudinaryAsset(g.publicId);
      }
    }
  }
  for (const o of sampleOrders) {
    if (o.payment?.proof?.publicId) await destroyCloudinaryAsset(o.payment.proof.publicId);
  }
  for (const inq of sampleInquiries) {
    if (Array.isArray(inq.attachments)) {
      for (const att of inq.attachments) {
        if (att.publicId) await destroyCloudinaryAsset(att.publicId);
      }
    }
  }

  // 2. Delete database records
  const [delP, delC, delCp, delSp, delO, delI, delR] = await Promise.all([
    Project.deleteMany({ _id: { $in: sampleProjectIds } }),
    Category.deleteMany({ _id: { $in: sampleCategories.map((c) => c._id) } }),
    Coupon.deleteMany({ _id: { $in: sampleCoupons.map((c) => c._id) } }),
    ServicePlan.deleteMany({ _id: { $in: samplePlans.map((s) => s._id) } }),
    Order.deleteMany({ _id: { $in: sampleOrderIds } }),
    Inquiry.deleteMany({ _id: { $in: sampleInquiries.map((i) => i._id) } }),
    Review.deleteMany({ _id: { $in: sampleReviews.map((r) => r._id) } }),
  ]);

  console.log(`\n✅ Deletion complete:`);
  console.log(`   - Deleted Projects: ${delP.deletedCount}`);
  console.log(`   - Deleted Categories: ${delC.deletedCount}`);
  console.log(`   - Deleted Coupons: ${delCp.deletedCount}`);
  console.log(`   - Deleted Service Plans: ${delSp.deletedCount}`);
  console.log(`   - Deleted Orders: ${delO.deletedCount}`);
  console.log(`   - Deleted Inquiries: ${delI.deletedCount}`);
  console.log(`   - Deleted Reviews: ${delR.deletedCount}`);
  console.log(`🔒 Owner and Settings documents remain untouched.`);
  console.log('====================================================\n');

  await disconnectDB();
  process.exit(0);
}

if (require.main === module) {
  main().catch(async (err) => {
    console.error('Fatal error during cleanup:', err.message);
    await disconnectDB();
    process.exit(1);
  });
}

module.exports = main;
