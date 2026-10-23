import axiosInstance from "../../../services/axiosInstance";

/**
 * Quality Control & Output API Service (Module M4.3)
 * Clean frontend client wrappers for all M4.3 Quality endpoints
 */
export const qualityService = {
  // ==========================================
  // 3. Quality Control, NCR & Output (M4.3)
  // ==========================================

  // GET /api/production-quality/quality/dashboard
  getQualityDashboard: async () => {
    return await axiosInstance.get("/production-quality/quality/dashboard");
  },

  // GET /api/production-quality/quality/inspection-queue (supports ?page=1&limit=10&status=...)
  getInspectionQueue: async (params = {}) => {
    return await axiosInstance.get("/production-quality/quality/inspection-queue", { params });
  },

  // GET /api/production-quality/quality/eligible-inspectors
  getEligibleInspectors: async () => {
    return await axiosInstance.get("/production-quality/quality/eligible-inspectors");
  },

  // POST /api/production-quality/quality/inspections/:id/assign
  assignInspector: async (id, data) => {
    return await axiosInstance.post(`/production-quality/quality/inspections/${id}/assign`, data);
  },

  // GET /api/production-quality/quality/inspections/:id
  getInspectionById: async (id) => {
    return await axiosInstance.get(`/production-quality/quality/inspections/${id}`);
  },

  // POST /api/production-quality/quality/inspections/:id/start
  startInspection: async (id, data = {}) => {
    return await axiosInstance.post(`/production-quality/quality/inspections/${id}/start`, data);
  },

  // POST /api/production-quality/quality/inspections/:id/results
  recordResults: async (id, data) => {
    return await axiosInstance.post(`/production-quality/quality/inspections/${id}/results`, data);
  },

  // POST /api/production-quality/quality/inspections/:id/hold
  holdInspection: async (id, data = {}) => {
    return await axiosInstance.post(`/production-quality/quality/inspections/${id}/hold`, data);
  },

  // POST /api/production-quality/quality/inspections/:id/rework
  reworkInspection: async (id, data = {}) => {
    return await axiosInstance.post(`/production-quality/quality/inspections/${id}/rework`, data);
  },

  // POST /api/production-quality/quality/non-conformance
  recordNonConformance: async (data) => {
    return await axiosInstance.post("/production-quality/quality/non-conformance", data);
  },

  // GET /api/production-quality/quality/non-conformance
  listNonConformances: async (params = {}) => {
    return await axiosInstance.get("/production-quality/quality/non-conformance", { params });
  },

  // POST /api/production-quality/quality/corrective-actions
  recordCorrectiveAction: async (data) => {
    return await axiosInstance.post("/production-quality/quality/corrective-actions", data);
  },

  // POST /api/production-quality/quality/scrap-approvals
  approveScrap: async (data) => {
    return await axiosInstance.post("/production-quality/quality/scrap-approvals", data);
  },

  // POST /api/production-quality/quality/inspections/:id/approve
  approveInspection: async (id, data = {}) => {
    return await axiosInstance.post(`/production-quality/quality/inspections/${id}/approve`, data);
  },

  // POST /api/production-quality/quality/inspections/:id/reject
  rejectInspection: async (id, data = {}) => {
    return await axiosInstance.post(`/production-quality/quality/inspections/${id}/reject`, data);
  },

  // POST /api/production-quality/quality/inspections/:id/decision (Pass / Rework / Rejected)
  submitDecision: async (id, data) => {
    return await axiosInstance.post(`/production-quality/quality/inspections/${id}/decision`, data);
  },

  // GET /api/production-quality/quality/capa
  listCAPARecords: async () => {
    return await axiosInstance.get("/production-quality/quality/capa");
  },

  // POST /api/production-quality/quality/capa/:id/resolve
  resolveCAPA: async (id, data) => {
    return await axiosInstance.post(`/production-quality/quality/capa/${id}/resolve`, data);
  },

  // POST /api/production-quality/quality/finished-goods-releases
  releaseFinishedGoods: async (data) => {
    return await axiosInstance.post("/production-quality/quality/finished-goods-releases", data);
  },

  // GET /api/production-quality/quality/reports/inspection
  getInspectionReport: async (params = {}) => {
    return await axiosInstance.get("/production-quality/quality/reports/inspection", { params });
  },
};

export default qualityService;
