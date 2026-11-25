const projectService = require('../services/project.service');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../config/constants');

/**
 * Project Controller
 * 
 * WHY:
 * Exposes Owner/Admin CRUD routes and Public Catalog browsing endpoints.
 */

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
  const isAdmin = req.user?.role === ROLES.ADMIN;
  const project = await projectService.getPublicProjectBySlug(req.params.slug, isAdmin);

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
