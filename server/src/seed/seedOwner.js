const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const env = require('../config/env');
const Owner = require('../models/Owner');

/**
 * Seed Owner Script (`npm run seed:owner`)
 * 
 * WHY:
 * As specified in the architecture, there is NO public registration endpoint.
 * The single Owner is created strictly from environment variables.
 * 
 * Rules:
 * 1. Refuses to create a second Owner.
 * 2. If the Owner already exists, does nothing unless the `--reset-password` CLI flag is passed.
 */

async function seedOwner() {
  console.log('🌱 Starting Owner Seed Script...\n');

  // Verify that required seed credentials exist in .env
  if (!env.OWNER_EMAIL || !env.OWNER_PASSWORD) {
    console.error('❌ Error: OWNER_EMAIL and OWNER_PASSWORD must be configured in .env to seed the owner.');
    process.exit(1);
  }

  await connectDB();

  try {
    const existingOwner = await Owner.findOne({ key: 'owner' }).select('+passwordHash');
    const isResetFlag = process.argv.includes('--reset-password');

    if (existingOwner) {
      if (isResetFlag) {
        console.log(`🔄 Updating existing Owner password from .env for: ${existingOwner.email}`);
        existingOwner.passwordHash = await Owner.hashPassword(env.OWNER_PASSWORD);
        if (env.OWNER_NAME) existingOwner.name = env.OWNER_NAME;
        if (env.OWNER_EMAIL) existingOwner.email = env.OWNER_EMAIL.toLowerCase();
        await existingOwner.save();
        console.log('✅ Owner credentials successfully updated.');
      } else {
        console.log(`ℹ️ Owner already exists: [${existingOwner.email}] (Name: ${existingOwner.name}).`);
        console.log('   Refusing to create a duplicate owner document.');
        console.log('   👉 Run `npm run seed:owner -- --reset-password` if you want to overwrite credentials from .env.');
      }
    } else {
      console.log(`👤 Creating new Owner: ${env.OWNER_EMAIL}`);
      const passwordHash = await Owner.hashPassword(env.OWNER_PASSWORD);

      await Owner.create({
        key: 'owner',
        name: env.OWNER_NAME || 'ByteCraft Owner',
        email: env.OWNER_EMAIL.toLowerCase(),
        passwordHash,
      });

      console.log('✅ Single Owner account created successfully!');
    }
  } catch (error) {
    console.error('❌ Error while seeding owner:', error.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
    console.log('\n🏁 Owner seed execution finished.');
  }
}

seedOwner();
