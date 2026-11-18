const paymobService = require('../services/payments/paymob.service');
const orderService = require('../services/order.service');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../config/constants');

/**
 * Payment Controller (Paymob Webhooks)
 * 
 * WHY:
 * 1. Server-to-Server Security: Incoming webhooks from Paymob are cryptographically verified
 *    via HMAC-SHA512. Any invalid signature is immediately rejected with 401 UNAUTHORIZED.
 * 2. Idempotency & Safety: Guarantees repeat webhook delivery will not cause double fulfillment.
 */

const handlePaymobWebhook = asyncHandler(async (req, res) => {
  // 1. Verify Cryptographic HMAC Signature
  const isValidHmac = paymobService.verifyWebhookHmac(req);
  if (!isValidHmac) {
    throw AppError.unauthorized('Invalid Paymob HMAC signature.', ERROR_CODES.INVALID_HMAC);
  }

  // 2. Extract transaction payload
  const transactionObj = req.body?.obj || req.body;
  if (!transactionObj) {
    throw AppError.badRequest('Missing transaction payload.', ERROR_CODES.VALIDATION_ERROR);
  }

  // 3. Process Transaction
  const result = await orderService.processPaymobWebhook(transactionObj);

  res.status(200).json({
    success: true,
    data: result,
  });
});

module.exports = {
  handlePaymobWebhook,
};
