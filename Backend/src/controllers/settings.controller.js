const settingsService = require('../services/settings.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Settings Controller
 * 
 * WHY:
 * Exposes endpoints for the Owner to view and update singleton site settings.
 */

const getSettings = asyncHandler(async (req, res) => {
  const rawSettings = await settingsService.getSettings();
  const { settings, paymentGateways, integrations } = settingsService.formatOwnerSettings(rawSettings);

  res.status(200).json({
    success: true,
    data: {
      settings,
      paymentGateways,
      integrations,
    },
  });
});

const updateSettings = asyncHandler(async (req, res) => {
  const updatedDoc = await settingsService.updateSettings(req.body);
  const { settings, paymentGateways, integrations } = settingsService.formatOwnerSettings(updatedDoc);

  res.status(200).json({
    success: true,
    data: {
      settings,
      paymentGateways,
      integrations,
    },
  });
});

module.exports = {
  getSettings,
  updateSettings,
};
