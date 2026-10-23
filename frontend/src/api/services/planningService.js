import api from "../client";

export const planningService = {
  getPlanningDashboard: async () => {
    return await api.get("/production-quality/planning/dashboard");
  },

  getProductionCalendar: async (params = {}) => {
    return await api.get("/production-quality/production-calendar", { params });
  },

  checkMaterialAvailability: async (workOrderId) => {
    return await api.get(`/production-quality/material-availability/${workOrderId}`);
  },
};

export default planningService;
