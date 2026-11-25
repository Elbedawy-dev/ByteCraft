const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

/**
 * Seed Brand Script (`npm run seed:brand`)
 *
 * WHY:
 * Idempotently updates ONLY the `siteName` field of the existing Settings singleton
 * document (`key: "main"`) to "Nexus" without touching contact info, payment methods,
 * guarantee days, or any other field. Always prints the connected database name.
 *
 * Usage:
 * - Production / configured DB: `npm run seed:brand`
 * - Isolated Test DB only (`bytecraft_test`): `npm run seed:brand -- --test`
 */

const TARGET_BRAND_NAME = 'Nexus';

// If invoked with `--test` via CLI, force test port 5001 and `bytecraft_test` DB BEFORE loading config/env
if (require.main === module && process.argv.includes('--test')) {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
  process.env.PORT = '5001';

  let uri = (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bytecraft_test').trim();
  if (uri.includes('.mongodb.net/')) {
    uri = uri.replace(/\.mongodb\.net\/([^?]+)/, '.mongodb.net/bytecraft_test');
  } else {
    uri = uri.replace(/\/([^/?]+)(\?|$)/, '/bytecraft_test$2');
  }
  process.env.MONGODB_URI = uri;
}

const { connectDB, disconnectDB } = require('../config/db');
const Settings = require('../models/Settings');

async function seedBrand({ manageConnection = true } = {}) {
  console.log(`🌱 Starting Brand Seed Script (target siteName: "${TARGET_BRAND_NAME}")...\n`);

  if (manageConnection) {
    await connectDB({ exitOnError: false });
  }

  try {
    const dbName = mongoose.connection.name;
    console.log(`📡 Connected Database: "${dbName}"`);

    const existing = await Settings.findOne({ key: 'main' });

    if (!existing) {
      console.log(`ℹ️  No existing Settings document (key: "main") found in database "${dbName}".`);
      console.log('   Nothing was created or modified. Run `npm run seed:settings` to initialize Settings first.');
      return { dbName, existed: false, updated: false, previousSiteName: null, siteName: null };
    }

    const previousSiteName = existing.siteName;

    if (previousSiteName === TARGET_BRAND_NAME) {
      console.log(`✅ Settings.siteName is already "${TARGET_BRAND_NAME}" in database "${dbName}" (no changes needed).`);
      return {
        dbName,
        existed: true,
        updated: false,
        previousSiteName,
        siteName: TARGET_BRAND_NAME,
      };
    }

    await Settings.updateOne(
      { _id: existing._id },
      { $set: { siteName: TARGET_BRAND_NAME } }
    );

    console.log(`✅ Updated ONLY Settings.siteName in database "${dbName}":`);
    console.log(`   - Previous siteName: "${previousSiteName}"`);
    console.log(`   - New siteName:      "${TARGET_BRAND_NAME}"`);
    console.log('   - All other Settings fields (contact, paymentMethods, guaranteeDays) were preserved untouched.');

    return {
      dbName,
      existed: true,
      updated: true,
      previousSiteName,
      siteName: TARGET_BRAND_NAME,
    };
  } catch (error) {
    console.error('❌ Error while updating brand name:', error.message);
    process.exitCode = 1;
    throw error;
  } finally {
    if (manageConnection) {
      await disconnectDB();
      console.log('\n🏁 Brand seed script finished.');
    }
  }
}

if (require.main === module) {
  seedBrand({ manageConnection: true }).catch(() => {
    process.exit(1);
  });
}

module.exports = {
  seedBrand,
  TARGET_BRAND_NAME,
};
