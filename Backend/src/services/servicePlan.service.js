const ServicePlan = require('../models/ServicePlan');
const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../config/constants');

/**
 * ServicePlan Service
 * 
 * WHY:
 * Encapsulates custom software build service plans management.
 */

class ServicePlanService {
  /**
   * Lists service plans with optional group filter
   * @param {object} options
   * @param {boolean} [options.onlyActive=false]
   * @param {string} [options.group]
   */
  async listServicePlans({ onlyActive = false, group } = {}) {
    const filter = {};
    if (onlyActive) {
      filter.isActive = true;
    }
    if (group && typeof group === 'string' && group.trim() !== '') {
      filter.group = group.trim().toLowerCase();
    }

    return ServicePlan.find(filter).sort({ group: 1, sortOrder: 1, createdAt: 1 });
  }

  /**
   * Retrieves single plan by ID
   * @param {string} id
   */
  async getServicePlanById(id) {
    const plan = await ServicePlan.findById(id);
    if (!plan) {
      throw AppError.notFound('Service plan not found', ERROR_CODES.NOT_FOUND);
    }
    return plan;
  }

  /**
   * Creates a new service plan (Owner only)
   * @param {object} data
   */
  async createServicePlan(data) {
    return ServicePlan.create(data);
  }

  /**
   * Updates an existing service plan
   * @param {string} id
   * @param {object} data
   */
  async updateServicePlan(id, data) {
    const plan = await ServicePlan.findById(id);
    if (!plan) {
      throw AppError.notFound('Service plan not found', ERROR_CODES.NOT_FOUND);
    }

    Object.assign(plan, data);
    await plan.save();

    return plan;
  }

  /**
   * Deletes a service plan
   * @param {string} id
   */
  async deleteServicePlan(id) {
    const plan = await ServicePlan.findById(id);
    if (!plan) {
      throw AppError.notFound('Service plan not found', ERROR_CODES.NOT_FOUND);
    }

    await ServicePlan.findByIdAndDelete(id);
    return true;
  }
}

module.exports = new ServicePlanService();
