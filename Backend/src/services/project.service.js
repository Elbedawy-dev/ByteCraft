const mongoose = require('mongoose');
const Project = require('../models/Project');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Review = require('../models/Review');
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
   * Computes published reviews summary ({ average, count }) for a batch of project IDs
   * in a single aggregation query (avoids N+1 queries).
   */
  async _getReviewsSummaryMap(projectIds = []) {
    const summaryMap = new Map();
    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      return summaryMap;
    }

    const objectIds = projectIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => (id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(id)));

    if (objectIds.length === 0) {
      return summaryMap;
    }

    const stats = await Review.aggregate([
      {
        $match: {
          project: { $in: objectIds },
          isPublished: true,
        },
      },
      {
        $group: {
          _id: '$project',
          average: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    for (const row of stats) {
      summaryMap.set(String(row._id), {
        average: Math.round(row.average * 10) / 10,
        count: row.count,
      });
    }

    return summaryMap;
  }

  /**
   * Formats a project for public API responses:
   * - Exposes `id` consistently (strips `_id` and `__v`)
   * - Filters `packages` to active packages only
   * - Always strips `privateRepo`
   * - Computes `startingPrice` (cheapest active package price in piasters)
   * - Attaches `reviewsSummary: { average, count }` (published reviews only)
   */
  _formatPublicProject(project, reviewsSummary = { average: 0, count: 0 }) {
    const plain = project.toJSON ? project.toJSON() : { ...project };

    if (!plain.id && plain._id) {
      plain.id = String(plain._id);
    } else if (plain.id) {
      plain.id = String(plain.id);
    }
    delete plain._id;
    delete plain.__v;
    delete plain.privateRepo;

    // Ensure populated category also exposes consistent `id`
    if (plain.category && typeof plain.category === 'object') {
      if (!plain.category.id && plain.category._id) {
        plain.category = { ...plain.category, id: String(plain.category._id) };
      } else if (plain.category.id) {
        plain.category = { ...plain.category, id: String(plain.category.id) };
      }
      delete plain.category._id;
      delete plain.category.__v;
    }

    const activePackages = Array.isArray(plain.packages)
      ? plain.packages.filter((p) => p.isActive !== false)
      : [];

    plain.packages = activePackages;
    plain.startingPrice =
      activePackages.length > 0
        ? Math.min(...activePackages.map((p) => p.price))
        : null;
    plain.reviewsSummary = {
      average: reviewsSummary?.average || 0,
      count: reviewsSummary?.count || 0,
    };

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

    // Fetch paginated projects & total count
    let projects = [];
    let total = 0;

    if (query.sort === 'price_asc' || query.sort === 'price_desc') {
      // Sort accurately by the cheapest ACTIVE package price (startingPrice)
      const priceDir = query.sort === 'price_asc' ? 1 : -1;
      const [aggIds, count] = await Promise.all([
        Project.aggregate([
          { $match: filter },
          {
            $addFields: {
              _computedStartingPrice: {
                $min: {
                  $map: {
                    input: {
                      $filter: {
                        input: '$packages',
                        as: 'pkg',
                        cond: { $ne: ['$$pkg.isActive', false] },
                      },
                    },
                    as: 'activePkg',
                    in: '$$activePkg.price',
                  },
                },
              },
            },
          },
          { $sort: { _computedStartingPrice: priceDir, createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          { $project: { _id: 1 } },
        ]),
        Project.countDocuments(filter),
      ]);

      total = count;
      const orderedIds = aggIds.map((doc) => doc._id);
      if (orderedIds.length > 0) {
        const docs = await Project.find({ _id: { $in: orderedIds } }).populate('category', 'key name');
        const docMap = new Map(docs.map((d) => [String(d._id), d]));
        projects = orderedIds.map((id) => docMap.get(String(id))).filter(Boolean);
      }
    } else {
      let sort = { createdAt: -1 };
      if (query.sort === 'popular') {
        sort = { 'stats.purchases': -1, 'stats.views': -1 };
      }

      const [docs, count] = await Promise.all([
        Project.find(filter)
          .populate('category', 'key name')
          .sort(sort)
          .skip(skip)
          .limit(limit),
        Project.countDocuments(filter),
      ]);
      projects = docs;
      total = count;
    }

    // Compute published review summaries in a single batch query
    const reviewsSummaryMap = await this._getReviewsSummaryMap(projects.map((p) => p._id));

    // Format output: consistent `id`, active packages only, startingPrice, reviewsSummary, NO privateRepo
    const sanitizedProjects = projects.map((p) =>
      this._formatPublicProject(p, reviewsSummaryMap.get(String(p._id)))
    );

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

    const reviewsSummaryMap = await this._getReviewsSummaryMap([project._id]);
    return this._formatPublicProject(project, reviewsSummaryMap.get(String(project._id)));
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
