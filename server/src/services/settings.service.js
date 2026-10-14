const Settings = require('../models/Settings');

/**
 * Settings Service
 * 
 * WHY:
 * Encapsulates singleton settings retrieval and updates.
 * Guarantees that the settings document always exists and enforces validation.
 */

class SettingsService {
  /**
   * Retrieves the singleton site settings
   * @returns {Promise<Document>}
   */
  async getSettings() {
    let settings = await Settings.findOne({ key: 'main' });
    if (!settings) {
      // Auto-initialize if seed hasn't run yet
      settings = await Settings.create({ key: 'main' });
    }
    return settings;
  }

  /**
   * Updates site settings
   * @param {object} updates
   * @returns {Promise<Document>}
   */
  async updateSettings(updates) {
    const settings = await Settings.findOneAndUpdate(
      { key: 'main' },
      { $set: updates },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );
    return settings;
  }
}

module.exports = new SettingsService();
