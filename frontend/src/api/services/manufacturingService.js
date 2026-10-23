import api from "../client";

export const manufacturingService = {
  getManufacturingDashboard: async () => {
    return await api.get("/production-quality/manufacturing/dashboard");
  },

  startWorkOrder: async (id, data = {}) => {
    return await api.post(`/production-quality/manufacturing/work-orders/${id}/start`, data);
  },

  recordProductionEntry: async (data) => {
    return await api.post("/production-quality/manufacturing/production-entries", data);
  },

  issueMaterial: async (data) => {
    return await api.post("/production-quality/manufacturing/material-issues", data);
  },

  recordMaterialConsumption: async (data) => {
    return await api.post("/production-quality/manufacturing/material-consumption", data);
  },

  returnMaterial: async (data) => {
    return await api.post("/production-quality/manufacturing/material-returns", data);
  },

  getMaterialReconciliation: async (id) => {
    return await api.get(`/production-quality/manufacturing/material-reconciliation/${id}`);
  },

  recordScrap: async (data) => {
    return await api.post("/production-quality/manufacturing/scrap", data);
  },

  recordDowntime: async (data) => {
    return await api.post("/production-quality/manufacturing/downtime", data);
  },

  recordDelay: async (data) => {
    return await api.post("/production-quality/manufacturing/delays", data);
  },

  transferToQuality: async (id, data) => {
    return await api.post(`/production-quality/manufacturing/outputs/${id}/transfer-to-quality`, data);
  },

  getProductionReport: async (params = {}) => {
    return await api.get("/production-quality/manufacturing/reports/production", { params });
  },
};

export default manufacturingService;
