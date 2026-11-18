const cloudinary = require('cloudinary').v2;
const env = require('./env');

/**
 * Cloudinary Configuration
 * 
 * WHY:
 * Centralizes Cloudinary SDK configuration.
 * Automatically checks whether credentials are provided in .env before performing API actions.
 */

const isConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME &&
  env.CLOUDINARY_API_KEY &&
  env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

module.exports = {
  cloudinary,
  isConfigured,
};
