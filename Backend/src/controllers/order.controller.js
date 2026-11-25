const orderService = require('../services/order.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Order Controller
 * 
 * WHY:
 * 1. Thin Controller: Delegates all transactional, calculation, and state transition
 *    logic to `order.service.js`.
 * 2. Unified Envelopes: All successful responses adhere strictly to `{ success: true, data: {}, meta?: {} }`.
 */

// ==========================================
// Public & Checkout Endpoints
// ==========================================

const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.body, {
    userId: req.user?._id || null,
  });
  res.status(201).json({
    success: true,
    data: { order },
  });
});

const getGuestOrder = asyncHandler(async (req, res) => {
  const { orderNumber } = req.params;
  const { token } = req.query;
  const order = await orderService.getGuestOrder(orderNumber, token);
  res.status(200).json({
    success: true,
    data: { order },
  });
});

const submitPaymentProof = asyncHandler(async (req, res) => {
  const { orderNumber } = req.params;
  const { token } = req.query;
  const { reference } = req.body;
  const order = await orderService.submitPaymentProof(orderNumber, token, {
    file: req.file,
    reference,
  });
  res.status(200).json({
    success: true,
    data: { order },
  });
});

// ==========================================
// Authenticated Customer Account Endpoints
// ==========================================

const getAccountOrders = asyncHandler(async (req, res) => {
  const result = await orderService.getAccountOrders(req.user._id, req.query);
  res.status(200).json({
    success: true,
    data: { orders: result.orders },
    meta: result.meta,
  });
});

const getAccountOrder = asyncHandler(async (req, res) => {
  const order = await orderService.getAccountOrderByNumber(req.params.orderNumber, req.user._id);
  res.status(200).json({
    success: true,
    data: { order },
  });
});

const submitAccountPaymentProof = asyncHandler(async (req, res) => {
  const order = await orderService.submitAccountPaymentProof(
    req.params.orderNumber,
    req.user._id,
    {
      file: req.file,
      reference: req.body?.reference,
    }
  );
  res.status(200).json({
    success: true,
    data: { order },
  });
});

const claimGuestOrders = asyncHandler(async (req, res) => {
  const result = await orderService.claimGuestOrders(req.user);
  res.status(200).json({
    success: true,
    data: result,
  });
});

// ==========================================
// Owner Endpoints
// ==========================================

const getOwnerOrders = asyncHandler(async (req, res) => {
  const result = await orderService.getOwnerOrders(req.query);
  res.status(200).json({
    success: true,
    data: { orders: result.orders },
    meta: result.meta,
  });
});

const getOwnerOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOwnerOrderById(req.params.id);
  res.status(200).json({
    success: true,
    data: { order },
  });
});

const approveOrder = asyncHandler(async (req, res) => {
  const order = await orderService.approveOrder(req.params.id);
  res.status(200).json({
    success: true,
    data: { order },
  });
});

const rejectOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await orderService.rejectOrder(req.params.id, reason);
  res.status(200).json({
    success: true,
    data: { order },
  });
});

const updateDelivery = asyncHandler(async (req, res) => {
  const order = await orderService.updateDelivery(req.params.id, req.body);
  res.status(200).json({
    success: true,
    data: { order },
  });
});

const refundOrder = asyncHandler(async (req, res) => {
  const { note } = req.body;
  const order = await orderService.refundOrder(req.params.id, note);
  res.status(200).json({
    success: true,
    data: { order },
  });
});

const cleanupExpiredOrders = asyncHandler(async (req, res) => {
  const result = await orderService.expireAbandonedOrders(req.body);
  res.status(200).json({
    success: true,
    data: result,
  });
});

module.exports = {
  createOrder,
  getGuestOrder,
  submitPaymentProof,
  getAccountOrders,
  getAccountOrder,
  submitAccountPaymentProof,
  claimGuestOrders,
  getOwnerOrders,
  getOwnerOrderById,
  approveOrder,
  rejectOrder,
  updateDelivery,
  refundOrder,
  cleanupExpiredOrders,
};
