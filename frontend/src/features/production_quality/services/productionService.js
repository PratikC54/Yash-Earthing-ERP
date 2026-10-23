import axiosInstance from "../../../services/axiosInstance";

/**
 * Production & Planning API Service (Module M4.1 & M4.2)
 * Clean frontend client wrappers for all M4 backend routes
 */
export const productionService = {
  // ==========================================
  // 1. Planning & Work Orders (M4.1)
  // ==========================================

  // GET /api/pq/dashboard
  getPlanningDashboard: async () => {
    try {
      return await axiosInstance.get("/pq/dashboard");
    } catch {
      return await axiosInstance.get("/production-quality/planning/dashboard");
    }
  },

  // GET /api/production-quality/production-calendar (supports ?startDate=...&endDate=...)
  getProductionCalendar: async (params = {}) => {
    return await axiosInstance.get("/production-quality/production-calendar", { params });
  },

  // GET /api/production-quality/planning/reference-data
  getReferenceData: async () => {
    return await axiosInstance.get("/production-quality/planning/reference-data");
  },

  // POST /api/production-quality/work-orders
  createWorkOrder: async (data) => {
    return await axiosInstance.post("/production-quality/work-orders", data);
  },

  // GET /api/production-quality/work-orders (supports ?page=1&limit=10&status=...)
  listWorkOrders: async (params = {}) => {
    return await axiosInstance.get("/production-quality/work-orders", { params });
  },

  // GET /api/production-quality/work-orders/:id
  getWorkOrderById: async (id) => {
    return await axiosInstance.get(`/production-quality/work-orders/${id}`);
  },

  // PATCH /api/production-quality/work-orders/:id
  updateWorkOrder: async (id, data) => {
    return await axiosInstance.patch(`/production-quality/work-orders/${id}`, data);
  },

  // GET /api/production-quality/material-availability/:id
  checkMaterialAvailability: async (id) => {
    return await axiosInstance.get(`/production-quality/material-availability/${id}`);
  },

  // POST /api/production-quality/work-orders/:id/submit
  submitWorkOrder: async (id, data = {}) => {
    return await axiosInstance.post(`/production-quality/work-orders/${id}/submit`, data);
  },

  // POST /api/production-quality/work-orders/:id/approve
  approveWorkOrder: async (id, data = {}) => {
    return await axiosInstance.post(`/production-quality/work-orders/${id}/approve`, data);
  },

  // POST /api/production-quality/work-orders/:id/release
  releaseWorkOrder: async (id, data = {}) => {
    return await axiosInstance.post(`/production-quality/work-orders/${id}/release`, data);
  },

  // POST /api/production-quality/work-orders/:id/hold
  holdWorkOrder: async (id, data = {}) => {
    return await axiosInstance.post(`/production-quality/work-orders/${id}/hold`, data);
  },

  // POST /api/production-quality/work-orders/:id/resume
  resumeWorkOrder: async (id, data = {}) => {
    return await axiosInstance.post(`/production-quality/work-orders/${id}/resume`, data);
  },

  // GET /api/production-quality/work-orders/:id/history
  getWorkOrderHistory: async (id) => {
    return await axiosInstance.get(`/production-quality/work-orders/${id}/history`);
  },

  // POST /api/production-quality/work-orders/:id/reject
  rejectWorkOrder: async (id, data = {}) => {
    return await axiosInstance.post(`/production-quality/work-orders/${id}/reject`, data);
  },

  // POST /api/production-quality/work-orders/:id/cancel
  cancelWorkOrder: async (id, data = {}) => {
    return await axiosInstance.post(`/production-quality/work-orders/${id}/cancel`, data);
  },

  // ==========================================
  // 2. Manufacturing Execution (M4.2)
  // ==========================================

  // GET /api/production-quality/manufacturing/dashboard
  getManufacturingDashboard: async () => {
    return await axiosInstance.get("/production-quality/manufacturing/dashboard");
  },

  // POST /api/production-quality/manufacturing/work-orders/:id/start
  startManufacturing: async (id, data = {}) => {
    return await axiosInstance.post(`/production-quality/manufacturing/work-orders/${id}/start`, data);
  },

  // POST /api/production-quality/manufacturing/production-entries
  recordProductionEntry: async (data) => {
    return await axiosInstance.post("/production-quality/manufacturing/production-entries", data);
  },

  // POST /api/production-quality/manufacturing/material-issues
  issueMaterial: async (data) => {
    return await axiosInstance.post("/production-quality/manufacturing/material-issues", data);
  },

  // POST /api/production-quality/manufacturing/material-consumption
  recordMaterialConsumption: async (data) => {
    return await axiosInstance.post("/production-quality/manufacturing/material-consumption", data);
  },

  // POST /api/production-quality/manufacturing/material-returns
  returnMaterial: async (data) => {
    return await axiosInstance.post("/production-quality/manufacturing/material-returns", data);
  },

  // GET /api/production-quality/manufacturing/material-reconciliation/:id
  getMaterialReconciliation: async (id) => {
    return await axiosInstance.get(`/production-quality/manufacturing/material-reconciliation/${id}`);
  },

  // POST /api/production-quality/manufacturing/scrap
  recordScrap: async (data) => {
    return await axiosInstance.post("/production-quality/manufacturing/scrap", data);
  },

  // POST /api/production-quality/manufacturing/downtime
  recordDowntime: async (data) => {
    return await axiosInstance.post("/production-quality/manufacturing/downtime", data);
  },

  // POST /api/production-quality/manufacturing/delays
  recordDelay: async (data) => {
    return await axiosInstance.post("/production-quality/manufacturing/delays", data);
  },

  // POST /api/production-quality/manufacturing/outputs/:id/transfer-to-quality
  transferToQuality: async (id, data) => {
    return await axiosInstance.post(`/production-quality/manufacturing/outputs/${id}/transfer-to-quality`, data);
  },

  // GET /api/production-quality/manufacturing/reports/production (supports ?groupBy=daily)
  getProductionReport: async (params = {}) => {
    return await axiosInstance.get("/production-quality/manufacturing/reports/production", { params });
  },
};

export default productionService;
