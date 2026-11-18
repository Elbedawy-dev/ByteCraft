const uploadService = require('../services/upload.service');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../config/constants');

/**
 * Upload Controller
 * 
 * WHY:
 * 1. Handles multi-file uploads (field 'images', up to 10 files).
 * 2. Streams files to Cloudinary and returns standardized metadata [{ url, publicId, width, height }].
 * 3. Handles asset deletion by publicId.
 */

const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw AppError.badRequest('No image files provided for upload.', ERROR_CODES.NO_FILES_PROVIDED);
  }

  // Upload each received file buffer concurrently
  const uploadPromises = req.files.map((file) =>
    uploadService.uploadImage(file.buffer, 'bytecraft/projects', file.originalname)
  );

  const images = await Promise.all(uploadPromises);

  res.status(200).json({
    success: true,
    data: {
      images,
    },
  });
});

const deleteImage = asyncHandler(async (req, res) => {
  const { publicId } = req.body;
  if (!publicId) {
    throw AppError.badRequest('publicId is required in request body.', ERROR_CODES.VALIDATION_ERROR);
  }

  await uploadService.deleteImage(publicId);

  res.status(200).json({
    success: true,
    data: {
      message: 'Image deleted successfully',
    },
  });
});

module.exports = {
  uploadImages,
  deleteImage,
};
