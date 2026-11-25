const userService = require('../services/user.service');
const { clearSessionCookie } = require('./auth.controller');
const asyncHandler = require('../utils/asyncHandler');

/**
 * User Controller
 *
 * Handles authenticated customer self-service endpoints (`/api/account/*`)
 * and admin user/admin management endpoints (`/api/owner/users`, `/api/owner/admins`).
 */

// ==========================================
// Customer Account Handlers
// ==========================================

const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  res.status(200).json({
    success: true,
    data: { user },
  });
});

const deleteAccount = asyncHandler(async (req, res) => {
  const result = await userService.deleteAccount(req.user._id, req.body.password);
  clearSessionCookie(res);
  res.status(200).json({
    success: true,
    data: result,
  });
});

// ==========================================
// Admin Users & Admins Management Handlers
// ==========================================

const listCustomers = asyncHandler(async (req, res) => {
  const { users, meta } = await userService.listCustomers(req.query);
  res.status(200).json({
    success: true,
    data: { users },
    meta,
  });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await userService.updateUserStatus(
    req.params.id,
    req.body.status,
    req.user._id
  );
  res.status(200).json({
    success: true,
    data: { user },
  });
});

const listAdmins = asyncHandler(async (req, res) => {
  const admins = await userService.listAdmins();
  res.status(200).json({
    success: true,
    data: { admins },
  });
});

const createAdmin = asyncHandler(async (req, res) => {
  const admin = await userService.createAdmin(req.body, req.user);
  res.status(201).json({
    success: true,
    data: { admin },
  });
});

const deleteAdmin = asyncHandler(async (req, res) => {
  const result = await userService.deleteAdmin(req.params.id, req.user._id);
  res.status(200).json({
    success: true,
    data: result,
  });
});

module.exports = {
  updateProfile,
  deleteAccount,
  listCustomers,
  updateUserStatus,
  listAdmins,
  createAdmin,
  deleteAdmin,
};
