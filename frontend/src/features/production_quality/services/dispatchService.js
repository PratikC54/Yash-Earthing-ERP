import axiosInstance from "../../../services/axiosInstance";

/**
 * Dispatch API Service
 * Handles Ready for Dispatch, Dispatch Dashboard Metrics, Dispatch Creation, and Dispatch History
 */
export const dispatchService = {
  // GET /api/production-quality/dispatch/dashboard
  getDashboard: async () => {
    return await axiosInstance.get("/production-quality/dispatch/dashboard");
  },

  // GET /api/production-quality/dispatch/ready
  getReadyForDispatch: async (params = {}) => {
    return await axiosInstance.get("/production-quality/dispatch/ready", { params });
  },

  // POST /api/production-quality/dispatch
  createDispatch: async (payload) => {
    return await axiosInstance.post("/production-quality/dispatch", payload);
  },

  // GET /api/production-quality/dispatch/history
  getHistory: async (params = {}) => {
    return await axiosInstance.get("/production-quality/dispatch/history", { params });
  },
};

export default dispatchService;
