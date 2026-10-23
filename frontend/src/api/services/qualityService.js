import api from "../client";

export const qualityService = {
  getQualityDashboard: async () => {
    return await api.get("/production-quality/quality/dashboard");
  },

  getInspectionQueue: async (params = {}) => {
    return await api.get("/production-quality/quality/inspection-queue", { params });
  },

  getInspectionById: async (id) => {
    return await api.get(`/production-quality/quality/inspections/${id}`);
  },

  startInspection: async (id, data = {}) => {
    return await api.post(`/production-quality/quality/inspections/${id}/start`, data);
  },

  recordResults: async (id, data) => {
    return await api.post(`/production-quality/quality/inspections/${id}/results`, data);
  },

  holdInspection: async (id, data = {}) => {
    return await api.post(`/production-quality/quality/inspections/${id}/hold`, data);
  },

  reworkInspection: async (id, data = {}) => {
    return await api.post(`/production-quality/quality/inspections/${id}/rework`, data);
  },

  approveInspection: async (id, data = {}) => {
    return await api.post(`/production-quality/quality/inspections/${id}/approve`, data);
  },

  rejectInspection: async (id, data = {}) => {
    return await api.post(`/production-quality/quality/inspections/${id}/reject`, data);
  },

  submitDecision: async (id, data) => {
    return await api.post(`/production-quality/quality/inspections/${id}/decision`, data);
  },

  listCAPARecords: async () => {
    return await api.get("/production-quality/quality/capa");
  },

  resolveCAPA: async (id, data) => {
    return await api.post(`/production-quality/quality/capa/${id}/resolve`, data);
  },

  recordNonConformance: async (data) => {
    return await api.post("/production-quality/quality/non-conformance", data);
  },

  listNonConformances: async (params = {}) => {
    return await api.get("/production-quality/quality/non-conformance", { params });
  },

  recordCorrectiveAction: async (data) => {
    return await api.post("/production-quality/quality/corrective-actions", data);
  },

  approveScrap: async (data) => {
    return await api.post("/production-quality/quality/scrap-approvals", data);
  },

  releaseFinishedGoods: async (data) => {
    return await api.post("/production-quality/quality/finished-goods-releases", data);
  },

  getInspectionReport: async (params = {}) => {
    return await api.get("/production-quality/quality/reports/inspection", { params });
  },
};

export default qualityService;
