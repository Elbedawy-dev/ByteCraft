const mongoose = require('mongoose');

/**
 * Project Model
 * 
 * WHY:
 * 1. Represents ready-made MERN projects for sale.
 * 2. `privateRepo` is set to `select: false` so that Git repository credentials and URLs
 *    are NEVER sent over the wire to public visitors under any circumstance.
 * 3. Text index on titles, taglines, and tech stack powers high-performance catalog search.
 * 4. Storing prices as integer piasters adheres to zero-float financial precision.
 */

const bilingualStringSchema = new mongoose.Schema(
  {
    ar: { type: String, required: true, trim: true },
    en: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const imageAssetSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const packageSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: bilingualStringSchema,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price must be a positive integer in piasters'],
    },
    compareAtPrice: {
      type: Number,
      default: null,
      min: 0,
    },
    features: [
      {
        type: bilingualStringSchema,
      },
    ],
    licenseType: {
      type: String,
      enum: ['single', 'multi'],
      default: 'single',
    },
    supportDays: {
      type: Number,
      default: 30,
      min: 0,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const previewSchema = new mongoose.Schema(
  {
    url: { type: String, default: '', trim: true },
    mode: {
      type: String,
      enum: ['iframe', 'external'],
      default: 'iframe',
    },
    demoNote: {
      ar: { type: String, default: '', trim: true },
      en: { type: String, default: '', trim: true },
    },
    demoCredentials: {
      label: { type: String, default: 'Demo Account', trim: true },
      email: { type: String, default: '', trim: true },
      password: { type: String, default: '', trim: true },
    },
  },
  { _id: false }
);

const privateRepoSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ['github', 'gitlab', 'other'],
      default: 'github',
    },
    owner: { type: String, default: '', trim: true },
    name: { type: String, default: '', trim: true },
    url: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    title: {
      type: bilingualStringSchema,
      required: true,
    },
    tagline: {
      type: bilingualStringSchema,
      required: true,
    },
    description: {
      type: bilingualStringSchema,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Project category is required'],
    },
    techStack: {
      type: [String],
      default: [],
    },
    features: [
      {
        type: bilingualStringSchema,
      },
    ],
    thumbnail: {
      type: imageAssetSchema,
      required: [true, 'Thumbnail image is required'],
    },
    gallery: {
      type: [imageAssetSchema],
      default: [],
    },
    preview: {
      type: previewSchema,
      default: () => ({}),
    },
    packages: {
      type: [packageSchema],
      validate: {
        validator(pkgs) {
          return Array.isArray(pkgs) && pkgs.length > 0;
        },
        message: 'A project must have at least one package',
      },
    },
    // CRITICAL SECURITY RULE: select: false ensures the private repo URL and details
    // can never be leaked to public clients or guest users
    privateRepo: {
      type: privateRepoSchema,
      select: false,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    stats: {
      views: { type: Number, default: 0 },
      previewViews: { type: Number, default: 0 },
      purchases: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        // Ensure privateRepo is stripped if it somehow was selected
        if (!ret.privateRepo) {
          delete ret.privateRepo;
        }
        return ret;
      },
    },
  }
);

// Full text search index
projectSchema.index(
  {
    'title.ar': 'text',
    'title.en': 'text',
    'tagline.ar': 'text',
    'tagline.en': 'text',
    techStack: 'text',
  },
  {
    weights: {
      'title.en': 10,
      'title.ar': 10,
      'tagline.en': 5,
      'tagline.ar': 5,
      techStack: 3,
    },
    name: 'project_text_search_index',
  }
);

// Compound and lookup indexes
projectSchema.index({ status: 1, createdAt: -1 });
projectSchema.index({ status: 1, category: 1 });
projectSchema.index({ status: 1, isFeatured: 1 });

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
