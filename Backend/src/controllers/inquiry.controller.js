const inquiryService = require('../services/inquiry.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Inquiry Controller
 */

// POST /api/inquiries (Public — accepts application/json or multipart/form-data with up to 3 attachments)
const createInquiry = asyncHandler(async (req, res) => {
  const inquiry = await inquiryService.createInquiry(req.body, req.files || []);
  res.status(201).json({
    success: true,
    data: { inquiry },
  });
});

// GET /api/owner/inquiries (Owner)
const getOwnerInquiries = asyncHandler(async (req, res) => {
  const { inquiries, meta } = await inquiryService.getOwnerInquiries(req.query);
  res.status(200).json({
    success: true,
    data: { inquiries },
    meta,
  });
});

// GET /api/owner/inquiries/:id (Owner)
const getOwnerInquiryById = asyncHandler(async (req, res) => {
  const inquiry = await inquiryService.getOwnerInquiryById(req.params.id);
  res.status(200).json({
    success: true,
    data: { inquiry },
  });
});

// PATCH /api/owner/inquiries/:id (Owner)
const updateInquiry = asyncHandler(async (req, res) => {
  const inquiry = await inquiryService.updateInquiry(req.params.id, req.body);
  res.status(200).json({
    success: true,
    data: { inquiry },
  });
});

// DELETE /api/owner/inquiries/:id (Owner)
const deleteInquiry = asyncHandler(async (req, res) => {
  const result = await inquiryService.deleteInquiry(req.params.id);
  res.status(200).json({
    success: true,
    data: result,
  });
});

module.exports = {
  createInquiry,
  getOwnerInquiries,
  getOwnerInquiryById,
  updateInquiry,
  deleteInquiry,
};
