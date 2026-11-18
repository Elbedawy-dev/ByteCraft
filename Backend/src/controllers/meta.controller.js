const Category = require('../models/Category');
const settingsService = require('../services/settings.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Meta Controller
 * 
 * WHY:
 * 1. Single endpoint returning initial platform configuration needed by the frontend at load time:
 *    - Active categories for navigation and filter chips
 *    - Enabled payment methods (sanitized: WITHOUT private wallet numbers or IPAs)
 *    - Guarantee days
 *    - Public studio contact details and social links
 * 2. Privacy & Security: Sensitive owner payout destinations are never sent here.
 */

const getMeta = asyncHandler(async (req, res) => {
  const [categories, settings] = await Promise.all([
    Category.find({ isActive: true }).sort({ order: 1, createdAt: 1 }),
    settingsService.getSettings(),
  ]);

  const rawPm = settings.paymentMethods || {};

  // Strip sensitive wallet numbers and IPAs: only send enabled status and bilingual instructions
  const paymentMethods = {
    vodafone_cash: {
      enabled: Boolean(rawPm.vodafone_cash?.enabled),
      instructions: rawPm.vodafone_cash?.instructions || { ar: '', en: '' },
    },
    instapay: {
      enabled: Boolean(rawPm.instapay?.enabled),
      instructions: rawPm.instapay?.instructions || { ar: '', en: '' },
    },
    fawry: {
      enabled: Boolean(rawPm.fawry?.enabled),
    },
    card: {
      enabled: Boolean(rawPm.card?.enabled),
    },
  };

  res.status(200).json({
    success: true,
    data: {
      siteName: settings.siteName,
      guaranteeDays: settings.guaranteeDays,
      contact: settings.contact,
      categories,
      paymentMethods,
    },
  });
});

module.exports = {
  getMeta,
};
