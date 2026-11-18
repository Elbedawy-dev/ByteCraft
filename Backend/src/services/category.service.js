const Category = require('../models/Category');
const Project = require('../models/Project');
const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../config/constants');
const { generateUniqueSlug } = require('../utils/slug');

/** 
 * Category Service
 * 
 * WHY:
 * 1. Handles Category business logic and uniqueness validation.
 * 2. Enforces relational integrity: prevents deleting a category that still contains active projects.
 */

class CategoryService {
  /**
   * Lists categories
   * @param {boolean} onlyActive - If true, returns only active categories (for public endpoints)
   */
  async listCategories(onlyActive = false) {
    const query = onlyActive ? { isActive: true } : {};
    return Category.find(query).sort({ order: 1, createdAt: 1 });
  }

  /**
   * Retrieves category by ID
   * @param {string} id 
   */
  async getCategoryById(id) {
    const category = await Category.findById(id);
    if (!category) {
      throw AppError.notFound('Category not found', ERROR_CODES.NOT_FOUND);
    }
    return category;
  }

  /**
   * Creates a new category
   * @param {object} data 
   */
  async createCategory(data) {
    let key = data.key;
    if (!key) {
      key = await generateUniqueSlug(Category, data.name.en, null, 'key');
    } else {
      const existing = await Category.findOne({ key });
      if (existing) {
        throw AppError.conflict(`Category key "${key}" already exists`, ERROR_CODES.CONFLICT);
      }
    }

    const category = await Category.create({
      ...data,
      key,
    });

    return category;
  }

  /**
   * Updates an existing category
   * @param {string} id 
   * @param {object} data 
   */
  async updateCategory(id, data) {
    const category = await Category.findById(id);
    if (!category) {
      throw AppError.notFound('Category not found', ERROR_CODES.NOT_FOUND);
    }

    if (data.key && data.key !== category.key) {
      const duplicate = await Category.findOne({ key: data.key, _id: { $ne: id } });
      if (duplicate) {
        throw AppError.conflict(`Category key "${data.key}" already exists`, ERROR_CODES.CONFLICT);
      }
    }

    Object.assign(category, data);
    await category.save();

    return category;
  }

  /**
   * Deletes a category if not in use by any projects
   * @param {string} id 
   */
  async deleteCategory(id) {
    const category = await Category.findById(id);
    if (!category) {
      throw AppError.notFound('Category not found', ERROR_CODES.NOT_FOUND);
    }

    // Check if any project is assigned to this category
    const projectCount = await Project.countDocuments({ category: id });
    if (projectCount > 0) {
      throw AppError.conflict(
        `Cannot delete category "${category.name.en}": it is currently assigned to ${projectCount} project(s).`,
        ERROR_CODES.CATEGORY_IN_USE
      );
    }

    await Category.findByIdAndDelete(id);
    return true;
  }
}

module.exports = new CategoryService();
