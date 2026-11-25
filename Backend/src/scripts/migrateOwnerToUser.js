const mongoose = require('mongoose');
const {
  applyTestDatabaseEnvIfFlagged,
  assertTestDatabaseIfFlagged,
} = require('../utils/testDb');

const isTestMode = applyTestDatabaseEnvIfFlagged();

const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const { ROLES, USER_STATUSES } = require('../config/constants');

/**
 * Migrate Owner -> User Script (`npm run migrate:owner-to-user`)
 *
 * Idempotently copies any existing document in the legacy `owners` collection
 * into the `users` collection as `role: 'admin'`, keeping the exact same
 * email and bcrypt `passwordHash`, with `emailVerified: true`.
 * Leaves the `owners` collection completely untouched.
 *
 * Flags:
 * - `--dry-run` : Preview actions without writing to MongoDB.
 * - `--test`    : Force targeting `bytecraft_test` only.
 */
async function migrateOwnerToUser({ dryRun = process.argv.includes('--dry-run'), manageConnection = true } = {}) {
  console.log(`🔄 Starting Owner -> User migration${dryRun ? ' [DRY RUN]' : ''}...\n`);

  if (manageConnection) {
    await connectDB({ exitOnError: false });
    assertTestDatabaseIfFlagged(isTestMode);
  }

  try {
    const dbName = mongoose.connection.name;
    console.log(`📡 Connected Database: "${dbName}"`);

    const ownersCollection = mongoose.connection.db.collection('owners');
    const ownerDocs = await ownersCollection.find({}).toArray();

    if (!ownerDocs || ownerDocs.length === 0) {
      console.log('ℹ️  No documents found in legacy "owners" collection. Nothing to migrate.');
      return { dbName, dryRun, found: 0, migrated: 0, skipped: 0 };
    }

    let migrated = 0;
    let skipped = 0;

    for (const ownerDoc of ownerDocs) {
      const email = String(ownerDoc.email || '').trim().toLowerCase();
      if (!email) {
        console.warn(`⚠️ Skipping owner document ${ownerDoc._id} with empty email.`);
        skipped++;
        continue;
      }

      const existingUser = await User.findOne({ email }).select('+passwordHash');

      if (existingUser) {
        if (existingUser.role === ROLES.ADMIN && existingUser.emailVerified === true) {
          console.log(`✅ [SKIP] Admin user already exists in "users" for [${email}] (idempotent).`);
          skipped++;
          continue;
        }

        if (dryRun) {
          console.log(`🔍 [DRY RUN] Would promote/verify existing user [${email}] to role="admin", emailVerified=true.`);
          migrated++;
          continue;
        }

        existingUser.role = ROLES.ADMIN;
        existingUser.status = USER_STATUSES.ACTIVE;
        existingUser.emailVerified = true;
        existingUser.emailVerifiedAt = existingUser.emailVerifiedAt || new Date();
        if (!existingUser.passwordHash && ownerDoc.passwordHash) {
          existingUser.passwordHash = ownerDoc.passwordHash;
        }
        await existingUser.save();
        console.log(`✅ Updated existing user [${email}] to admin with emailVerified=true.`);
        migrated++;
        continue;
      }

      if (dryRun) {
        console.log(
          `🔍 [DRY RUN] Would copy Owner [${email}] (name="${ownerDoc.name || 'Nexus Owner'}") into "users" with role="admin", emailVerified=true.`
        );
        migrated++;
        continue;
      }

      await User.create({
        name: (ownerDoc.name || 'Nexus Owner').trim(),
        email,
        passwordHash: ownerDoc.passwordHash,
        role: ROLES.ADMIN,
        status: USER_STATUSES.ACTIVE,
        emailVerified: true,
        emailVerifiedAt: ownerDoc.createdAt || new Date(),
        tokenVersion: 0,
        failedLoginCount: 0,
        lockUntil: null,
        lastLoginAt: ownerDoc.lastLoginAt || null,
      });

      console.log(`✅ Migrated Owner [${email}] into "users" collection (role="admin", emailVerified=true).`);
      migrated++;
    }

    console.log('\n🔒 Legacy "owners" collection was left completely untouched.');
    return { dbName, dryRun, found: ownerDocs.length, migrated, skipped };
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exitCode = 1;
    throw error;
  } finally {
    if (manageConnection) {
      await disconnectDB();
      console.log('🏁 Migration finished.');
    }
  }
}

if (require.main === module) {
  migrateOwnerToUser({ manageConnection: true }).catch(() => {
    process.exit(1);
  });
}

module.exports = {
  migrateOwnerToUser,
};
