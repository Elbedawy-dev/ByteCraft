const multer = require('multer');
const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../config/constants');

/**
 * Multer Upload Middleware Configuration
 * 
 * WHY:
 * 1. Uses memoryStorage so that uploaded files stay in buffer memory before being streamed
 *    directly to Cloudinary, avoiding temporary disk clutter on servers.
 * 2. Strictly validates file MIME types (only JPEG, PNG, WebP) to prevent malicious executable uploads.
 * 3. Enforces 5 MB file size limit directly at the stream parsing level.
 */

const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_PROOF_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Megabytes

const storage = multer.memoryStorage();

function imageFileFilter(req, file, cb) {
  if (ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      AppError.badRequest(
        `Invalid file type: "${file.mimetype}". Only image/jpeg, image/png, and image/webp are allowed.`,
        ERROR_CODES.INVALID_FILE_TYPE
      ),
      false
    );
  }
}

function proofFileFilter(req, file, cb) {
  if (ALLOWED_PROOF_MIMES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      AppError.badRequest(
        `Invalid file type: "${file.mimetype}". Only images (JPEG, PNG, WebP) and PDF documents are allowed for payment proof.`,
        ERROR_CODES.INVALID_FILE_TYPE
      ),
      false
    );
  }
}

/**
 * Validates real file magic bytes directly from buffer (not just file extension or client header)
 */
function validateMagicBytes(buffer, allowedTypes = ALLOWED_PROOF_MIMES) {
  if (!buffer || buffer.length < 4) return false;

  // JPEG: FF D8 FF
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  // WebP: 'RIFF' at 0, 'WEBP' at 8
  const isWebp =
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP';
  // PDF: '%PDF-' (25 50 44 46 2D)
  const isPdf = buffer.toString('ascii', 0, 5) === '%PDF-';

  if (isJpeg && (allowedTypes.has('image/jpeg') || allowedTypes.has('image/jpg'))) return 'image/jpeg';
  if (isPng && allowedTypes.has('image/png')) return 'image/png';
  if (isWebp && allowedTypes.has('image/webp')) return 'image/webp';
  if (isPdf && allowedTypes.has('application/pdf')) return 'application/pdf';

  return null;
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: imageFileFilter,
});

const uploadProofMulter = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: proofFileFilter,
});

// Up to 10 images under field name 'images'
const uploadImages = upload.array('images', 10);

// Single proof under field name 'proof' for payment proofs (images & PDF)
const uploadSingleProof = uploadProofMulter.single('proof');

module.exports = {
  upload,
  uploadImages,
  uploadSingleProof,
  validateMagicBytes,
  MAX_FILE_SIZE,
};
