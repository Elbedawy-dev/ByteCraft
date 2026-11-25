const mongoose = require('mongoose');
const {
  applyTestDatabaseEnvIfFlagged,
  assertTestDatabaseIfFlagged,
} = require('../utils/testDb');

const isTestMode = applyTestDatabaseEnvIfFlagged();

const { connectDB, disconnectDB } = require('../config/db');
const env = require('../config/env');
const User = require('../models/User');
const { ROLES, USER_STATUSES } = require('../config/constants');

/**
 * Seed Admin / Owner Script (`npm run seed:owner`)
 *
 * Creates or updates the initial admin User from environment variables
 * (`OWNER_NAME`, `OWNER_EMAIL`, `OWNER_PASSWORD`).
 *
 * Flags:
 * - `--reset-password` : Overwrites password, name, and bumps tokenVersion if user exists.
 * - `--test`           : Force targeting `bytecraft_test` only.
 */

async function seedOwner({ manageConnection = true } = {}) {
  console.log('🌱 Starting Admin User Seed Script...\n');

  if (!env.OWNER_EMAIL || !env.OWNER_PASSWORD) {
    console.error('❌ Error: OWNER_EMAIL and OWNER_PASSWORD must be configured in .env to seed the admin.');
    process.exit(1);
  }

  if (manageConnection) {
    await connectDB({ exitOnError: false });
    assertTestDatabaseIfFlagged(isTestMode);
  }

  try {
    const dbName = mongoose.connection.name;
    console.log(`📡 Connected Database: "${dbName}"`);

    const targetEmail = env.OWNER_EMAIL.trim().toLowerCase();
    const existingAdmin = await User.findOne({ email: targetEmail }).select('+passwordHash');
    const isResetFlag = process.argv.includes('--reset-password');

    if (existingAdmin) {
      if (isResetFlag) {
        console.log(`🔄 Updating existing admin User credentials from .env for: ${existingAdmin.email}`);
        existingAdmin.passwordHash = await User.hashPassword(env.OWNER_PASSWORD);
        if (env.OWNER_NAME) existingAdmin.name = env.OWNER_NAME;
        existingAdmin.role = ROLES.ADMIN;
        existingAdmin.status = USER_STATUSES.ACTIVE;
        existingAdmin.emailVerified = true;
        existingAdmin.emailVerifiedAt = existingAdmin.emailVerifiedAt || new Date();
        existingAdmin.failedLoginCount = 0;
        existingAdmin.lockUntil = null;
        existingAdmin.tokenVersion = (existingAdmin.tokenVersion || 0) + 1;
        await existingAdmin.save();
        console.log('✅ Admin User credentials successfully updated.');
      } else {
        console.log(`ℹ️ Admin User already exists: [${existingAdmin.email}] (Name: ${existingAdmin.name}, Role: ${existingAdmin.role}).`);
        console.log('   Preserving existing credentials without overwriting.');
        console.log('   👉 Run `npm run seed:owner -- --reset-password` if you want to overwrite credentials from .env.');
      }
    } else {
      console.log(`👤 Creating new Admin User: ${targetEmail}`);
      const passwordHash = await User.hashPassword(env.OWNER_PASSWORD);

      await User.create({
        name: env.OWNER_NAME || 'Nexus Owner',
        email: targetEmail,
        passwordHash,
        role: ROLES.ADMIN,
        status: USER_STATUSES.ACTIVE,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      });

      console.log('✅ Admin User account created successfully!');
    }
  } catch (error) {
    console.error('❌ Error while seeding admin user:', error.message);
    process.exitCode = 1;
  } finally {
    if (manageConnection) {
      await disconnectDB();
      console.log('\n🏁 Admin seed execution finished.');
    }
  }
}

if (require.main === module) {
  seedOwner({ manageConnection: true });
}

module.exports = seedOwner;
