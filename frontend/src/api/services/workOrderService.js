import api from "../client";

export const workOrderService = {
  listWorkOrders: async (params = {}) => {
    return await api.get("/production-quality/work-orders", { params });
  },

  getWorkOrderById: async (id) => {
    return await api.get(`/production-quality/work-orders/${id}`);
  },

  createWorkOrder: async (data) => {
    return await api.post("/production-quality/work-orders", data);
  },

  updateWorkOrder: async (id, data) => {
    return await api.patch(`/production-quality/work-orders/${id}`, data);
  },

  submitWorkOrder: async (id, data = {}) => {
    return await api.post(`/production-quality/work-orders/${id}/submit`, data);
  },

  approveWorkOrder: async (id, data = {}) => {
    return await api.post(`/production-quality/work-orders/${id}/approve`, data);
  },

  releaseWorkOrder: async (id, data = {}) => {
    return await api.post(`/production-quality/work-orders/${id}/release`, data);
  },

  holdWorkOrder: async (id, data = {}) => {
    return await api.post(`/production-quality/work-orders/${id}/hold`, data);
  },

  resumeWorkOrder: async (id, data = {}) => {
    return await api.post(`/production-quality/work-orders/${id}/resume`, data);
  },

  rejectWorkOrder: async (id, data = {}) => {
    return await api.post(`/production-quality/work-orders/${id}/reject`, data);
  },

  cancelWorkOrder: async (id, data = {}) => {
    return await api.post(`/production-quality/work-orders/${id}/cancel`, data);
  },

  getWorkOrderHistory: async (id) => {
    return await api.get(`/production-quality/work-orders/${id}/history`);
  },

  checkMaterialAvailability: async (id) => {
    return await api.get(`/production-quality/material-availability/${id}`);
  },
};

export default workOrderService;
