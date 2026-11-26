const Category = require('../models/Category');
const settingsService = require('../services/settings.service');
const env = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Meta Controller
 * 
 * WHY:
 * 1. Single endpoint returning initial platform configuration needed by the frontend at load time:
 *    - Active categories for navigation and filter chips
 *    - Enabled payment methods (sanitized: WITHOUT private wallet numbers or IPAs)
 *    - Guarantee days
 *    - Public studio contact details and social links (empty values returned as empty strings)
 * 2. Privacy & Security: Sensitive owner payout destinations are never sent here.
 * 3. Gateway Guard: Online Paymob methods (`card`, `fawry`) are exposed as enabled ONLY
 *    when the Settings flag is enabled AND the matching Paymob server configuration is ready.
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
      enabled: Boolean(rawPm.fawry?.enabled) && Boolean(env.PAYMOB_FAWRY_READY),
    },
    card: {
      enabled: Boolean(rawPm.card?.enabled) && Boolean(env.PAYMOB_CONFIGURED),
    },
  };

  // Ensure contact values are clean strings (empty strings when unset so Frontend hides them)
  const contact = {
    email: settings.contact?.email || '',
    whatsapp: settings.contact?.whatsapp || '',
    phone: settings.contact?.phone || '',
    location: {
      ar: settings.contact?.location?.ar || '',
      en: settings.contact?.location?.en || '',
    },
    socials: {
      github: settings.contact?.socials?.github || '',
      linkedin: settings.contact?.socials?.linkedin || '',
      twitter: settings.contact?.socials?.twitter || '',
      facebook: settings.contact?.socials?.facebook || '',
    },
  };

  res.status(200).json({
    success: true,
    data: {
      siteName: settings.siteName,
      guaranteeDays: settings.guaranteeDays,
      registrationEnabled: settings.registrationEnabled !== false,
      contact,
      categories,
      paymentMethods,
    },
  });
});

module.exports = {
  getMeta,
};
