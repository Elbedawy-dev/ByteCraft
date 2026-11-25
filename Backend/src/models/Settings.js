const mongoose = require('mongoose');
const { DEFAULT_GUARANTEE_DAYS } = require('../config/constants');

/**
 * Settings Model (Singleton)
 * 
 * WHY:
 * 1. Global site settings (contact info, active payment gateways, guarantee period) are stored
 *    in a single document identified by `key: 'main'`.
 * 2. Storing bilingual instructions `{ ar, en }` directly inside payment method objects
 *    allows the customer checkout flow to display localized payment details seamlessly.
 */

const bilingualStringSchema = new mongoose.Schema(
  {
    ar: { type: String, default: '', trim: true },
    en: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      enum: ['main'],
      default: 'main',
      immutable: true,
    },
    siteName: {
      type: String,
      default: 'Nexus',
      trim: true,
    },
    guaranteeDays: {
      type: Number,
      default: DEFAULT_GUARANTEE_DAYS,
      min: 0,
    },
    registrationEnabled: {
      type: Boolean,
      default: true,
    },
    contact: {
      email: { type: String, default: '', trim: true, lowercase: true },
      whatsapp: { type: String, default: '', trim: true },
      phone: { type: String, default: '', trim: true },
      location: {
        type: bilingualStringSchema,
        default: () => ({ ar: '', en: '' }),
      },
      socials: {
        github: { type: String, default: '', trim: true },
        linkedin: { type: String, default: '', trim: true },
        twitter: { type: String, default: '', trim: true },
        facebook: { type: String, default: '', trim: true },
      },
    },
    paymentMethods: {
      vodafone_cash: {
        enabled: { type: Boolean, default: false },
        walletNumber: { type: String, default: '', trim: true },
        accountName: { type: String, default: '', trim: true },
        instructions: {
          type: bilingualStringSchema,
          default: () => ({
            ar: 'حول المبلغ المطلوب عبر فودافون كاش ثم ارفع إيصال التحويل.',
            en: 'Transfer the required amount via Vodafone Cash and upload the payment proof.',
          }),
        },
      },
      instapay: {
        enabled: { type: Boolean, default: false },
        ipa: { type: String, default: '', trim: true }, // InstaPay Payment Address (IPA/Username)
        accountName: { type: String, default: '', trim: true },
        instructions: {
          type: bilingualStringSchema,
          default: () => ({
            ar: 'حول المبلغ المطلوب عبر انستاباي ثم ارفع إيصال التحويل.',
            en: 'Transfer the required amount via InstaPay and upload the payment proof.',
          }),
        },
      },
      fawry: {
        enabled: { type: Boolean, default: false },
      },
      card: {
        enabled: { type: Boolean, default: false },
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.vatRate;
        return ret;
      },
    },
  }
);

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
