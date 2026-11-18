const jwt = require('jsonwebtoken');
const projectService = require('../services/project.service');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');
const { AUTH_COOKIE_NAME } = require('../config/constants');

/**
 * Project Controller
 * 
 * WHY:
 * Exposes Owner CRUD routes and Public Catalog browsing endpoints.
 */

// Helper to silently detect if request is from the authenticated Owner
function isOwnerRequester(req) {
  try {
    const token = req.cookies?.[AUTH_COOKIE_NAME] || req.headers?.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      return Boolean(decoded && decoded.id);
    }
  } catch {
    // Non-owner / guest visitor
  }
  return false;
}

// ==========================================
// Owner Handlers
// ==========================================

const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.body);

  res.status(201).json({
    success: true,
    data: {
      project,
    },
  });
});

const getOwnerProjects = asyncHandler(async (req, res) => {
  const result = await projectService.getOwnerProjects(req.query);

  res.status(200).json({
    success: true,
    data: {
      projects: result.projects,
    },
    meta: result.meta,
  });
});

const getOwnerProjectById = asyncHandler(async (req, res) => {
  const project = await projectService.getOwnerProjectById(req.params.id);

  res.status(200).json({
    success: true,
    data: {
      project,
    },
  });
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(req.params.id, req.body);

  res.status(200).json({
    success: true,
    data: {
      project,
    },
  });
});

const updateProjectStatus = asyncHandler(async (req, res) => {
  const project = await projectService.updateProjectStatus(req.params.id, req.body.status);

  res.status(200).json({
    success: true,
    data: {
      project,
    },
  });
});

const deleteProject = asyncHandler(async (req, res) => {
  await projectService.deleteProject(req.params.id);

  res.status(200).json({
    success: true,
    data: {
      message: 'Project deleted successfully',
    },
  });
});

// ==========================================
// Public Handlers
// ==========================================

const getPublicProjects = asyncHandler(async (req, res) => {
  const result = await projectService.getPublicProjects(req.query);

  res.status(200).json({
    success: true,
    data: {
      projects: result.projects,
    },
    meta: result.meta,
  });
});

const getPublicProjectBySlug = asyncHandler(async (req, res) => {
  const isOwner = isOwnerRequester(req);
  const project = await projectService.getPublicProjectBySlug(req.params.slug, isOwner);

  res.status(200).json({
    success: true,
    data: {
      project,
    },
  });
});

const recordPreviewView = asyncHandler(async (req, res) => {
  await projectService.recordPreviewView(req.params.slug);

  res.status(200).json({
    success: true,
    data: {
      message: 'Preview view recorded',
    },
  });
});

module.exports = {
  // Owner
  createProject,
  getOwnerProjects,
  getOwnerProjectById,
  updateProject,
  updateProjectStatus,
  deleteProject,
  // Public
  getPublicProjects,
  getPublicProjectBySlug,
  recordPreviewView,
};
