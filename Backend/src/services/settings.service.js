const Settings = require('../models/Settings');
const env = require('../config/env');
const paymobService = require('./payments/paymob.service');
const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../config/constants');

/**
 * Settings Service
 *
 * WHY:
 * Encapsulates singleton settings retrieval and updates.
 * - Guarantees that the settings document always exists and enforces validation.
 * - Flattens nested update payloads into dot-notation `$set` paths so partial PATCH
 *   requests never wipe sibling nested fields (e.g. patching `card.enabled` preserves
 *   `vodafone_cash` and `instapay`).
 * - Blocks enabling Paymob methods (`card`, `fawry`) when Paymob is not configured.
 */

function flattenToDotNotation(obj, prefix = '', out = {}) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return out;
  }

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    const nextPath = prefix ? `${prefix}.${key}` : key;
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      flattenToDotNotation(value, nextPath, out);
    } else {
      out[nextPath] = value;
    }
  }

  return out;
}

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
   * Formats settings for the Owner API, normalizing unavailable Paymob flags
   * so the admin UI never displays an unconfigured gateway as enabled.
   */
  formatOwnerSettings(settingsDoc) {
    const plain = settingsDoc.toJSON ? settingsDoc.toJSON() : { ...settingsDoc };
    const gateways = paymobService.getGatewayStatus();
    const integrations = {
      paymobConfigured: Boolean(env.PAYMOB_CONFIGURED),
      fawryReady: Boolean(env.PAYMOB_FAWRY_READY),
    };

    if (plain.paymentMethods) {
      plain.paymentMethods = {
        ...plain.paymentMethods,
        fawry: {
          ...(plain.paymentMethods.fawry || {}),
          enabled: integrations.fawryReady && Boolean(plain.paymentMethods.fawry?.enabled),
        },
        card: {
          ...(plain.paymentMethods.card || {}),
          enabled: integrations.paymobConfigured && Boolean(plain.paymentMethods.card?.enabled),
        },
      };
    }

    return {
      settings: plain,
      paymentGateways: gateways,
      integrations,
    };
  }

  /**
   * Updates site settings (supports safe deep partial updates)
   * @param {object} updates
   * @returns {Promise<Document>}
   */
  async updateSettings(updates) {
    if (
      updates?.paymentMethods?.card?.enabled === true &&
      !env.PAYMOB_CONFIGURED
    ) {
      throw AppError.badRequest(
        'Card payments cannot be enabled because Paymob is not configured on the server.',
        ERROR_CODES.VALIDATION_ERROR,
        [{ field: 'paymentMethods.card.enabled', message: 'Paymob card gateway is not configured.' }]
      );
    }

    if (
      updates?.paymentMethods?.fawry?.enabled === true &&
      !env.PAYMOB_FAWRY_READY
    ) {
      throw AppError.badRequest(
        'Fawry payments cannot be enabled because Paymob is not configured on the server.',
        ERROR_CODES.VALIDATION_ERROR,
        [{ field: 'paymentMethods.fawry.enabled', message: 'Paymob Fawry gateway is not configured.' }]
      );
    }

    // Ensure singleton exists before applying dot-notation partial updates
    await this.getSettings();

    const flattened = flattenToDotNotation(updates);
    if (Object.keys(flattened).length === 0) {
      return this.getSettings();
    }

    const settings = await Settings.findOneAndUpdate(
      { key: 'main' },
      { $set: flattened },
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
