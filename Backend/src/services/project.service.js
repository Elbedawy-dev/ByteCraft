const mongoose = require('mongoose');
const Project = require('../models/Project');
const Category = require('../models/Category');
const Order = require('../models/Order');
const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../config/constants');
const { generateUniqueSlug } = require('../utils/slug');
const uploadService = require('./upload.service');

/**
 * Project Service
 * 
 * WHY:
 * 1. Single source of truth for Project catalog business logic.
 * 2. Enforces security: `privateRepo` is excluded from all public projections.
 * 3. Enforces data validity: guarantees at least one active package before publishing.
 * 4. Increments view stats cleanly while filtering out owner visits.
 */

class ProjectService {
  /**
   * Validates that at least one package is active for published projects
   */
  _validatePublishedPackages(packages, status) {
    if (status === 'published') {
      const hasActive = Array.isArray(packages) && packages.some((p) => p.isActive !== false);
      if (!hasActive) {
        throw AppError.badRequest(
          'A published project must have at least one active package.',
          ERROR_CODES.VALIDATION_ERROR
        );
      }
    }
  }

  /**
   * Filter packages on a project so public clients only see active packages
   */
  _filterActivePackages(project) {
    const plain = project.toObject ? project.toObject() : { ...project };
    if (Array.isArray(plain.packages)) {
      plain.packages = plain.packages.filter((p) => p.isActive !== false);
    }
    delete plain.privateRepo;
    return plain;
  }

  /**
   * Creates a new project (Owner only)
   * @param {object} data 
   */
  async createProject(data) {
    // 1. Verify Category exists
    const categoryExists = await Category.findById(data.category);
    if (!categoryExists) {
      throw AppError.badRequest('Selected category does not exist.', ERROR_CODES.VALIDATION_ERROR);
    }

    // 2. Validate packages
    this._validatePublishedPackages(data.packages, data.status);

    // 3. Generate unique slug
    const baseSlugSource = data.slug || data.title.en;
    const slug = await generateUniqueSlug(Project, baseSlugSource);

    // 4. Create project
    const project = await Project.create({
      ...data,
      slug,
    });

    return Project.findById(project._id).populate('category', 'key name');
  }

  /**
   * Lists projects for Owner (all statuses, paginated)
   * @param {object} query 
   */
  async getOwnerProjects(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.category) {
      if (mongoose.Types.ObjectId.isValid(query.category)) {
        filter.category = query.category;
      } else {
        const cat = await Category.findOne({ key: query.category });
        filter.category = cat ? cat._id : new mongoose.Types.ObjectId();
      }
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { 'title.ar': searchRegex },
        { 'title.en': searchRegex },
        { 'tagline.ar': searchRegex },
        { 'tagline.en': searchRegex },
        { techStack: searchRegex },
      ];
    }

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('category', 'key name')
        .sort({ sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Project.countDocuments(filter),
    ]);

    return {
      projects,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves single project for Owner (including privateRepo)
   * @param {string} id 
   */
  async getOwnerProjectById(id) {
    const project = await Project.findById(id)
      .select('+privateRepo')
      .populate('category', 'key name');

    if (!project) {
      throw AppError.notFound('Project not found', ERROR_CODES.NOT_FOUND);
    }

    return project;
  }

  /**
   * Updates a project (Owner only)
   * @param {string} id 
   * @param {object} data 
   */
  async updateProject(id, data) {
    const project = await Project.findById(id);
    if (!project) {
      throw AppError.notFound('Project not found', ERROR_CODES.NOT_FOUND);
    }

    // Verify Category if updating
    if (data.category && data.category.toString() !== project.category.toString()) {
      const categoryExists = await Category.findById(data.category);
      if (!categoryExists) {
        throw AppError.badRequest('Selected category does not exist.', ERROR_CODES.VALIDATION_ERROR);
      }
    }

    // Validate packages for published status
    const effectiveStatus = data.status || project.status;
    const effectivePackages = data.packages || project.packages;
    this._validatePublishedPackages(effectivePackages, effectiveStatus);

    // Slug management
    if (data.slug && data.slug !== project.slug) {
      data.slug = await generateUniqueSlug(Project, data.slug, id);
    }

    Object.assign(project, data);
    await project.save();

    return Project.findById(id)
      .select('+privateRepo')
      .populate('category', 'key name');
  }

  /**
   * Updates only project status
   * @param {string} id 
   * @param {string} status 
   */
  async updateProjectStatus(id, status) {
    const project = await Project.findById(id);
    if (!project) {
      throw AppError.notFound('Project not found', ERROR_CODES.NOT_FOUND);
    }

    this._validatePublishedPackages(project.packages, status);

    project.status = status;
    await project.save();

    return Project.findById(id).populate('category', 'key name');
  }

  /**
   * Deletes a project (blocked if paid orders exist)
   * @param {string} id 
   */
  async deleteProject(id) {
    const project = await Project.findById(id);
    if (!project) {
      throw AppError.notFound('Project not found', ERROR_CODES.NOT_FOUND);
    }

    // Check if Order model exists and has paid orders for this project
    if (mongoose.models.Order) {
      const paidOrdersCount = await mongoose.models.Order.countDocuments({
        project: id,
        status: { $in: ['paid', 'delivered'] },
      });

      if (paidOrdersCount > 0) {
        throw AppError.conflict(
          'Cannot delete project with paid orders. Please archive it instead.',
          ERROR_CODES.PROJECT_HAS_PAID_ORDERS
        );
      }
    }

    // Best effort cleanup of images from Cloudinary
    if (project.thumbnail && project.thumbnail.publicId) {
      uploadService.deleteImage(project.thumbnail.publicId);
    }
    if (Array.isArray(project.gallery)) {
      project.gallery.forEach((img) => {
        if (img.publicId) uploadService.deleteImage(img.publicId);
      });
    }

    await Project.findByIdAndDelete(id);
    return true;
  }

  /**
   * Public: Lists published projects with filters, search, sorting, and pagination
   * @param {object} query 
   */
  async getPublicProjects(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    // Strict filter: ONLY published projects
    const filter = { status: 'published' };

    // Filter: Category slug
    if (query.category) {
      const categoryDoc = await Category.findOne({ key: query.category.toLowerCase() });
      if (!categoryDoc) {
        return {
          projects: [],
          meta: { page, limit, total: 0, totalPages: 0 },
        };
      }
      filter.category = categoryDoc._id;
    }

    // Filter: Featured
    if (query.featured !== undefined) {
      filter.isFeatured = query.featured;
    }

    // Filter: Tech Stack (comma-separated list e.g. "React,Node.js")
    if (query.tech) {
      const techs = query.tech
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      if (techs.length > 0) {
        filter.techStack = { $all: techs.map((t) => new RegExp(`^${t}$`, 'i')) };
      }
    }

    // Filter: Search across title, tagline, techStack
    if (query.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { 'title.ar': searchRegex },
        { 'title.en': searchRegex },
        { 'tagline.ar': searchRegex },
        { 'tagline.en': searchRegex },
        { techStack: searchRegex },
      ];
    }

    // Filter: Price range against active packages
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const priceFilter = { isActive: true };
      if (query.minPrice !== undefined) priceFilter.price = { ...priceFilter.price, $gte: Number(query.minPrice) };
      if (query.maxPrice !== undefined) priceFilter.price = { ...priceFilter.price, $lte: Number(query.maxPrice) };
      filter.packages = { $elemMatch: priceFilter };
    }

    // Sorting
    let sort = { sortOrder: 1, createdAt: -1 };
    switch (query.sort) {
      case 'popular':
        sort = { 'stats.purchases': -1, 'stats.views': -1 };
        break;
      case 'price_asc':
        sort = { 'packages.0.price': 1 };
        break;
      case 'price_desc':
        sort = { 'packages.0.price': -1 };
        break;
      case 'newest':
      default:
        sort = { createdAt: -1 };
        break;
    }

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('category', 'key name')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Project.countDocuments(filter),
    ]);

    // Format output: strip inactive packages and ensure privateRepo is NEVER exposed
    const sanitizedProjects = projects.map((p) => this._filterActivePackages(p));

    return {
      projects: sanitizedProjects,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Public: Retrieves single published project details and increments views (unless owner)
   * @param {string} slug 
   * @param {boolean} isOwner 
   */
  async getPublicProjectBySlug(slug, isOwner = false) {
    const project = await Project.findOne({ slug: slug.toLowerCase(), status: 'published' })
      .populate('category', 'key name');

    if (!project) {
      throw AppError.notFound('Project not found', ERROR_CODES.NOT_FOUND);
    }

    // Increment views only for public visitors (never for the logged-in owner)
    if (!isOwner) {
      project.stats.views = (project.stats.views || 0) + 1;
      await project.save();
    }

    return this._filterActivePackages(project);
  }

  /**
   * Public: Increments previewViews counter (fire-and-forget)
   * @param {string} slug 
   */
  async recordPreviewView(slug) {
    await Project.updateOne(
      { slug: slug.toLowerCase(), status: 'published' },
      { $inc: { 'stats.previewViews': 1 } }
    );
    return true;
  }
}

module.exports = new ProjectService();
