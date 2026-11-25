const crypto = require('crypto');
const User = require('../models/User');
const Order = require('../models/Order');
const emailService = require('./email.service');
const authService = require('./auth.service');
const AppError = require('../utils/AppError');
const { ERROR_CODES, ROLES, USER_STATUSES } = require('../config/constants');

const ADMIN_INVITE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * User Management Service
 *
 * Handles customer self-service profile/account deletion and admin user/admin operations.
 */
class UserService {
  async updateProfile(userId, updates) {
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.unauthorized('Account not found.', ERROR_CODES.UNAUTHORIZED);
    }

    if (updates.name !== undefined) user.name = updates.name.trim();
    if (updates.phone !== undefined) user.phone = updates.phone.trim();
    if (updates.gitProvider !== undefined) {
      user.gitProvider = updates.gitProvider === '' || updates.gitProvider === null ? null : updates.gitProvider;
    }
    if (updates.gitUsername !== undefined) user.gitUsername = updates.gitUsername.trim();
    if (updates.locale !== undefined) user.locale = updates.locale;

    await user.save();
    return user.toSafeObject();
  }

  /**
   * Deletes the customer's account after password confirmation.
   * Preserves all orders with their snapshots intact and sets `Order.user = null`.
   */
  async deleteAccount(userId, password) {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      throw AppError.unauthorized('Account not found.', ERROR_CODES.UNAUTHORIZED);
    }

    if (user.role === ROLES.ADMIN) {
      throw AppError.forbidden('Admin accounts cannot be self-deleted.', ERROR_CODES.FORBIDDEN);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw AppError.badRequest('Password confirmation is incorrect.', ERROR_CODES.INVALID_CURRENT_PASSWORD);
    }

    await Order.updateMany({ user: user._id }, { $set: { user: null } });
    await User.findByIdAndDelete(user._id);

    return {
      message: 'Account deleted successfully',
    };
  }

  /**
   * Admin: Paginated list of customer accounts with search, status filter, and order counts.
   */
  async listCustomers({ search, status, page = 1, limit = 20 } = {}) {
    const filter = { role: ROLES.CUSTOMER };

    if (status) {
      filter.status = status;
    }

    if (search && search.trim() !== '') {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      User.countDocuments(filter),
    ]);

    const userIds = users.map((u) => u._id);
    const orderCounts = userIds.length
      ? await Order.aggregate([
          { $match: { user: { $in: userIds } } },
          { $group: { _id: '$user', count: { $sum: 1 } } },
        ])
      : [];

    const countMap = new Map(orderCounts.map((row) => [String(row._id), row.count]));

    return {
      users: users.map((u) => ({
        ...u.toSafeObject(),
        ordersCount: countMap.get(String(u._id)) || 0,
      })),
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * Admin: Enable or disable a user account.
   * Prevents self-disable and disabling the last active admin.
   */
  async updateUserStatus(targetId, status, actingAdminId) {
    const target = await User.findById(targetId);
    if (!target) {
      throw AppError.notFound('User not found.', ERROR_CODES.NOT_FOUND);
    }

    if (String(target._id) === String(actingAdminId) && status === USER_STATUSES.DISABLED) {
      throw AppError.forbidden('You cannot disable your own account.', ERROR_CODES.FORBIDDEN);
    }

    if (
      target.role === ROLES.ADMIN &&
      status === USER_STATUSES.DISABLED &&
      target.status === USER_STATUSES.ACTIVE
    ) {
      const activeAdmins = await User.countDocuments({
        role: ROLES.ADMIN,
        status: USER_STATUSES.ACTIVE,
      });
      if (activeAdmins <= 1) {
        throw AppError.conflict('Cannot disable the last active admin.', ERROR_CODES.CONFLICT);
      }
    }

    target.status = status;
    if (status === USER_STATUSES.DISABLED) {
      target.tokenVersion = (target.tokenVersion || 0) + 1;
    }

    await target.save();
    return target.toSafeObject();
  }

  /**
   * Admin: List all admin accounts.
   */
  async listAdmins() {
    const admins = await User.find({ role: ROLES.ADMIN }).sort({ createdAt: 1 });
    return admins.map((a) => a.toSafeObject());
  }

  /**
   * Admin: Create a new admin by name + email and send a one-time "set your password" email link.
   */
  async createAdmin({ name, email, locale = 'ar' }, invitedByUser) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      throw AppError.conflict(
        'An account with this email already exists.',
        ERROR_CODES.CONFLICT
      );
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = authService.hashToken(rawToken);

    const admin = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash: null,
      role: ROLES.ADMIN,
      locale: locale === 'en' ? 'en' : 'ar',
      status: USER_STATUSES.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: new Date(Date.now() + ADMIN_INVITE_TTL_MS),
    });

    emailService.sendAdminInvite(admin, rawToken, invitedByUser?.name || '').catch((err) => {
      console.error('Failed to send admin invite email:', err.message);
    });

    return admin.toSafeObject();
  }

  /**
   * Admin: Delete another admin account.
   * Blocks self-deletion and prevents removing the last admin account.
   */
  async deleteAdmin(targetId, actingAdminId) {
    const target = await User.findById(targetId);
    if (!target || target.role !== ROLES.ADMIN) {
      throw AppError.notFound('Admin account not found.', ERROR_CODES.NOT_FOUND);
    }

    if (String(target._id) === String(actingAdminId)) {
      throw AppError.forbidden('You cannot delete your own admin account.', ERROR_CODES.FORBIDDEN);
    }

    const totalAdmins = await User.countDocuments({ role: ROLES.ADMIN });
    if (totalAdmins <= 1) {
      throw AppError.conflict('Cannot remove the last admin account.', ERROR_CODES.CONFLICT);
    }

    if (target.status === USER_STATUSES.ACTIVE) {
      const activeAdmins = await User.countDocuments({
        role: ROLES.ADMIN,
        status: USER_STATUSES.ACTIVE,
      });
      if (activeAdmins <= 1) {
        throw AppError.conflict('Cannot remove the last active admin account.', ERROR_CODES.CONFLICT);
      }
    }

    await User.findByIdAndDelete(target._id);
    return {
      message: 'Admin deleted successfully',
    };
  }
}

module.exports = new UserService();
