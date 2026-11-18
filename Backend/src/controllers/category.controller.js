const categoryService = require('../services/category.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Category Controller
 * 
 * WHY:
 * Handles HTTP requests for managing Categories.
 */

const getCategories = asyncHandler(async (req, res) => {
  // If requested by public endpoint, only active categories are listed
  const onlyActive = req.baseUrl.startsWith('/api/categories');
  const categories = await categoryService.listCategories(onlyActive);

  res.status(200).json({
    success: true,
    data: {
      categories,
    },
  });
});

const getCategoryById = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);

  res.status(200).json({
    success: true,
    data: {
      category,
    },
  });
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);

  res.status(201).json({
    success: true,
    data: {
      category,
    },
  });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);

  res.status(200).json({
    success: true,
    data: {
      category,
    },
  });
});

const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);

  res.status(200).json({
    success: true,
    data: {
      message: 'Category deleted successfully',
    },
  });
});

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
