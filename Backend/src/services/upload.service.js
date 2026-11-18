const fs = require('fs');
const path = require('path');
const cloudinaryConfig = require('../config/cloudinary');
const env = require('../config/env');

/**
 * Upload Service
 * 
 * WHY:
 * 1. Encapsulates Cloudinary streaming uploads (upload_stream) and image asset deletion.
 * 2. Provides seamless local fallback when Cloudinary API keys are not yet configured or fail in development,
 *    allowing local development and tests to proceed without crashing or requiring internet access.
 * 3. Deletion is always best-effort to ensure user operations never fail because of a cloud cleanup glitch.
 */

class UploadService {
  /**
   * Saves image buffer locally under public/uploads
   * @private
   */
  _saveLocal(buffer, folder, originalname) {
    const ext = path.extname(originalname) || '.png';
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    const uploadDir = path.join(__dirname, '../../public/uploads', folder);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `/uploads/${folder}/${filename}`.replace(/\\/g, '/');
    const publicId = `local_${folder}_${filename}`.replace(/[\/\\]/g, '_');

    return {
      url: relativeUrl,
      publicId,
      width: 800,
      height: 600,
    };
  }

  /**
   * Uploads an image buffer to Cloudinary (or local storage fallback)
   * @param {Buffer} buffer - File buffer from Multer
   * @param {string} folder - Target Cloudinary folder (e.g. 'bytecraft/projects')
   * @param {string} originalname - Original file name for fallback saving
   * @returns {Promise<{ url: string, publicId: string, width: number, height: number }>}
   */
  async uploadImage(buffer, folder = 'bytecraft/projects', originalname = 'upload.png') {
    // 1. If Cloudinary credentials are configured, stream directly to Cloudinary
    if (cloudinaryConfig.isConfigured) {
      try {
        return await new Promise((resolve, reject) => {
          const uploadStream = cloudinaryConfig.cloudinary.uploader.upload_stream(
            {
              folder,
              resource_type: 'auto',
            },
            (error, result) => {
              if (error) {
                return reject(new Error(`Cloudinary upload failed: ${error.message}`));
              }
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
                width: result.width || 800,
                height: result.height || 600,
              });
            }
          );

          uploadStream.end(buffer);
        });
      } catch (err) {
        // In development, if Cloudinary returns an error (e.g. invalid cloud name),
        // fallback gracefully to local storage so work is not blocked
        if (env.NODE_ENV === 'development') {
          console.warn(`⚠️ Cloudinary upload warning: ${err.message}. Falling back to local disk storage for development.`);
          return this._saveLocal(buffer, folder, originalname);
        }
        throw err;
      }
    }

    // 2. Fallback: Store locally under public/uploads (strictly disabled in production)
    if (env.NODE_ENV === 'production') {
      throw new Error('Cloudinary credentials are not configured or upload failed. Local disk storage fallback is disabled in production.');
    }

    return this._saveLocal(buffer, folder, originalname);
  }

  /**
   * Deletes an image by publicId from Cloudinary (or local fallback)
   * Best-effort: never throws an exception to avoid breaking the calling request.
   * @param {string} publicId
   * @returns {Promise<boolean>}
   */
  async deleteImage(publicId) {
    if (!publicId) return false;

    try {
      if (cloudinaryConfig.isConfigured && !publicId.startsWith('local_')) {
        await cloudinaryConfig.cloudinary.uploader.destroy(publicId);
        return true;
      }

      // If local dev file
      if (publicId.startsWith('local_')) {
        const parts = publicId.replace(/^local_/, '').split('_');
        const filename = parts.pop();
        const folder = parts.join('/');
        const filePath = path.join(__dirname, '../../public/uploads', folder, filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        return true;
      }

      return true;
    } catch (err) {
      console.warn(`⚠️ Warning: Failed to delete image [${publicId}]: ${err.message}`);
      return false;
    }
  }
}

module.exports = new UploadService();
