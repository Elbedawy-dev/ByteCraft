const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const Settings = require('../models/Settings');
const { DEFAULT_GUARANTEE_DAYS } = require('../config/constants');

/**
 * Seed Settings Script (`npm run seed:settings`)
 * 
 * WHY:
 * Initializes the singleton site settings document with safe defaults:
 * - Real owner contact data
 * - Guarantee days = 30
 * - All payment methods initially DISABLED until the owner explicitly configures and enables them.
 * 
 * Rules:
 * Idempotent: If settings already exist, does not overwrite the owner's customized settings.
 */

async function seedSettings() {
  console.log('🌱 Starting Settings Seed Script...\n');

  await connectDB();

  try {
    const existing = await Settings.findOne({ key: 'main' });

    if (existing) {
      console.log(`ℹ️ Settings singleton already initialized (Site: "${existing.siteName}").`);
      console.log('   Preserving existing settings without overwriting.');
    } else {
      console.log('⚙️ Initializing Settings singleton with safe defaults...');

      await Settings.create({
        key: 'main',
        siteName: 'ByteCraft',
        guaranteeDays: DEFAULT_GUARANTEE_DAYS,
        contact: {
          email: 'moaazelbedawy@gmail.com',
          whatsapp: '201095731606',
          phone: '+201095731606',
          location: {
            ar: '',
            en: '',
          },
          socials: {
            github: 'https://github.com/Elbedawy-dev',
            linkedin: 'https://www.linkedin.com/in/moaaz-elbedawy',
            twitter: '',
            facebook: '',
          },
        },
        paymentMethods: {
          vodafone_cash: {
            enabled: false,
            walletNumber: '',
            accountName: '',
            instructions: {
              ar: 'حول المبلغ المطلوب عبر فودافون كاش ثم ارفع إيصال التحويل.',
              en: 'Transfer the required amount via Vodafone Cash and upload the payment proof.',
            },
          },
          instapay: {
            enabled: false,
            ipa: '',
            accountName: '',
            instructions: {
              ar: 'حول المبلغ المطلوب عبر انستاباي ثم ارفع إيصال التحويل.',
              en: 'Transfer the required amount via InstaPay and upload the payment proof.',
            },
          },
          fawry: {
            enabled: false,
          },
          card: {
            enabled: false,
          },
        },
      });

      console.log('✅ Settings singleton created successfully with all payment gateways disabled by default.');
      console.log('⚠️ Reminder: Please confirm your GitHub profile URL (set to https://github.com/Elbedawy-dev).');
    }
  } catch (error) {
    console.error('❌ Error while seeding settings:', error.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
    console.log('\n🏁 Settings seed execution finished.');
  }
}

if (require.main === module) {
  seedSettings();
}

module.exports = seedSettings;
