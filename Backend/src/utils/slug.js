const slugify = require('slugify');

/**
 * Slug Utility
 * 
 * WHY:
 * 1. Creates clean, URL-safe slugs from English titles (e.g. "E-Commerce Pro LMS" -> "e-commerce-pro-lms").
 * 2. Enforces uniqueness across MongoDB documents by checking existing records and auto-incrementing
 *    a numeric suffix if a collision occurs (e.g. "my-project", "my-project-1", "my-project-2").
 */

/**
 * Creates a normalized base slug from text
 * @param {string} text 
 * @returns {string}
 */
function createSlug(text) {
  if (!text || typeof text !== 'string') return 'item';
  const clean = slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  });
  return clean || 'item';
}

/**
 * Generates an unconditionally unique slug for a given Mongoose Model
 * @param {import('mongoose').Model} Model - The Mongoose model to query
 * @param {string} baseText - The text to base the slug on (e.g. title.en)
 * @param {string|import('mongoose').Types.ObjectId|null} excludeId - Document ID to exclude (during updates)
 * @param {string} slugField - Name of the slug field in the schema (default 'slug')
 * @returns {Promise<string>}
 */
async function generateUniqueSlug(Model, baseText, excludeId = null, slugField = 'slug') {
  const baseSlug = createSlug(baseText);
  let candidateSlug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { [slugField]: candidateSlug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const exists = await Model.exists(query);
    if (!exists) {
      return candidateSlug;
    }

    candidateSlug = `${baseSlug}-${counter}`;
    counter++;
  }
}

module.exports = {
  createSlug,
  generateUniqueSlug,
};
