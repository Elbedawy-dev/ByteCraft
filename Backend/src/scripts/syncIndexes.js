const {
  applyTestDatabaseEnvIfFlagged,
  assertTestDatabaseIfFlagged,
} = require('../utils/testDb');

const isTestMode = applyTestDatabaseEnvIfFlagged();

const { connectDB, disconnectDB } = require('../config/db');
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
 * Synchronize Database Indexes (`npm run db:indexes`)
 *
 * Explicitly calls `syncIndexes()` on every Mongoose model to ensure
 * unique and query indexes exist in MongoDB (especially in production where autoIndex is disabled).
 */
async function syncAllIndexes() {
  console.log('🔄 Starting MongoDB Index Synchronization...\n');
  await connectDB({ exitOnError: false });
  assertTestDatabaseIfFlagged(isTestMode);

  const models = [
    { name: 'User', model: User },
    { name: 'Settings', model: Settings },
    { name: 'Category', model: Category },
    { name: 'Project', model: Project },
    { name: 'ServicePlan', model: ServicePlan },
    { name: 'Coupon', model: Coupon },
    { name: 'Order', model: Order },
    { name: 'Inquiry', model: Inquiry },
    { name: 'Review', model: Review },
    { name: 'Counter', model: Counter },
  ];

  try {
    for (const { name, model } of models) {
      console.log(`📌 Syncing indexes for [${name}]...`);
      await model.syncIndexes();
      const rawIndexes = await model.collection.getIndexes();
      const indexSummary = Object.entries(rawIndexes).map(([idxName, keyObj]) => {
        return `${idxName}: ${JSON.stringify(keyObj)}`;
      });
      console.log(`   ✅ Existing Indexes for ${name}:`);
      indexSummary.forEach((idx) => console.log(`      - ${idx}`));
      console.log('');
    }
    console.log('✨ All database indexes synchronized successfully.');
  } catch (error) {
    console.error('❌ Index synchronization failed:', error.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
    console.log('🔌 Database disconnected.');
  }
}

if (require.main === module) {
  syncAllIndexes();
}

module.exports = syncAllIndexes;
