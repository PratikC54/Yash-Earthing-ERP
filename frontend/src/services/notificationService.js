import axiosInstance from "./axiosInstance";

/**
 * Smart Alerts & Notification Service
 * Manages in-app notifications, unread badges, mark-as-read, and escalation rules.
 */
export const notificationService = {
  /**
   * List paginated notifications with filters
   * params: { page, limit, status, priority, type, search }
   */
  listNotifications: async (params = {}) => {
    return await axiosInstance.get("/notifications", { params });
  },

  /**
   * Get unread notification count for the badge
   */
  getUnreadCount: async () => {
    return await axiosInstance.get("/notifications/unread-count");
  },

  /**
   * Get recent notifications for the top navbar bell dropdown
   */
  getRecentNotifications: async (limit = 8) => {
    return await axiosInstance.get("/notifications/recent", { params: { limit } });
  },

  /**
   * Mark a specific notification as READ
   */
  markAsRead: async (id) => {
    return await axiosInstance.patch(`/notifications/${id}/read`);
  },

  /**
   * Mark all unread notifications for current user as READ
   */
  markAllAsRead: async () => {
    return await axiosInstance.patch("/notifications/read-all");
  },

  /**
   * Retrieve configurable escalation rules
   */
  getEscalationRules: async () => {
    return await axiosInstance.get("/notifications/escalation-rules");
  },

  /**
   * Trigger immediate background check evaluation (for testing or manual sync)
   */
  runChecks: async () => {
    return await axiosInstance.post("/notifications/run-checks");
  },
};

export default notificationService;
