import api from "../client";

export const dispatchService = {
  getDashboard: async () => {
    return await api.get("/production-quality/dispatch/dashboard");
  },

  getReadyForDispatch: async (params = {}) => {
    return await api.get("/production-quality/dispatch/ready", { params });
  },

  createDispatch: async (payload) => {
    return await api.post("/production-quality/dispatch", payload);
  },

  getHistory: async (params = {}) => {
    return await api.get("/production-quality/dispatch/history", { params });
  },
};

export default dispatchService;
