const servicePlanService = require('../services/servicePlan.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * ServicePlan Controller
 * 
 * WHY:
 * Handles owner CRUD and public active listing of custom build plans.
 */

const getServicePlans = asyncHandler(async (req, res) => {
  const isPublic = req.baseUrl.startsWith('/api/service-plans');
  const plans = await servicePlanService.listServicePlans({
    onlyActive: isPublic,
    group: req.query.group,
  });

  res.status(200).json({
    success: true,
    data: {
      plans,
    },
  });
});

const getServicePlanById = asyncHandler(async (req, res) => {
  const plan = await servicePlanService.getServicePlanById(req.params.id);

  res.status(200).json({
    success: true,
    data: {
      plan,
    },
  });
});

const createServicePlan = asyncHandler(async (req, res) => {
  const plan = await servicePlanService.createServicePlan(req.body);

  res.status(201).json({
    success: true,
    data: {
      plan,
    },
  });
});

const updateServicePlan = asyncHandler(async (req, res) => {
  const plan = await servicePlanService.updateServicePlan(req.params.id, req.body);

  res.status(200).json({
    success: true,
    data: {
      plan,
    },
  });
});

const deleteServicePlan = asyncHandler(async (req, res) => {
  await servicePlanService.deleteServicePlan(req.params.id);

  res.status(200).json({
    success: true,
    data: {
      message: 'Service plan deleted successfully',
    },
  });
});

module.exports = {
  getServicePlans,
  getServicePlanById,
  createServicePlan,
  updateServicePlan,
  deleteServicePlan,
};
