const express = require('express');
const crypto = require('crypto');
const orderService = require('../services/order.service');
const env = require('../config/env');
const { ERROR_CODES } = require('../config/constants');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

/**
 * GET /api/cron/expire-orders
 * 
 * WHY:
 * Invoked by Vercel Cron (or external cron runner) once per day.
 * Protected with Bearer token constant-time comparison against CRON_SECRET.
 * Automatically marks abandoned orders as expired and returns the released count.
 */
router.get(
  '/expire-orders',
  asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Missing or invalid Authorization header.',
          details: [],
        },
      });
    }

    const providedSecret = authHeader.slice(7).trim();
    const expectedSecret = env.CRON_SECRET || '';

    if (!expectedSecret) {
      console.error('CRON_SECRET is not configured on the server.');
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Cron execution is disabled: server CRON_SECRET not configured.',
          details: [],
        },
      });
    }

    const providedBuf = Buffer.from(providedSecret, 'utf8');
    const expectedBuf = Buffer.from(expectedSecret, 'utf8');

    // Constant-time comparison to prevent timing side-channel attacks
    const secretsMatch =
      providedBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(providedBuf, expectedBuf);

    if (!secretsMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Unauthorized: Invalid cron secret.',
          details: [],
        },
      });
    }

    const result = await orderService.expireAbandonedOrders();

    return res.status(200).json({
      success: true,
      data: {
        expiredCount: result.expiredCount,
        timestamp: new Date().toISOString(),
      },
    });
  })
);

module.exports = router;
