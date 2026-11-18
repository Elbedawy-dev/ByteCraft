const settingsService = require('../services/settings.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Settings Controller
 * 
 * WHY:
 * Exposes endpoints for the Owner to view and update singleton site settings.
 */

const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getSettings();

  res.status(200).json({
    success: true,
    data: {
      settings,
    },
  });
});

const updateSettings = asyncHandler(async (req, res) => {
  const updated = await settingsService.updateSettings(req.body);

  res.status(200).json({
    success: true,
    data: {
      settings: updated,
    },
  });
});

module.exports = {
  getSettings,
  updateSettings,
};
