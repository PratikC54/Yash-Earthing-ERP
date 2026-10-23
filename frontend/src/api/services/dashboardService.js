import api from "../client";

export const dashboardService = {
  getPlanningDashboard: async () => {
    return await api.get("/production-quality/planning/dashboard");
  },

  getManufacturingDashboard: async () => {
    return await api.get("/production-quality/manufacturing/dashboard");
  },

  getQualityDashboard: async () => {
    return await api.get("/production-quality/quality/dashboard");
  },

  getCombinedDashboard: async () => {
    const [planning, manufacturing, quality] = await Promise.allSettled([
      api.get("/production-quality/planning/dashboard"),
      api.get("/production-quality/manufacturing/dashboard"),
      api.get("/production-quality/quality/dashboard"),
    ]);

    return {
      planning: planning.status === "fulfilled" ? planning.value?.data : null,
      manufacturing: manufacturing.status === "fulfilled" ? manufacturing.value?.data : null,
      quality: quality.status === "fulfilled" ? quality.value?.data : null,
    };
  },
};

export default dashboardService;
