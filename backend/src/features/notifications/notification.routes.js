import { Router } from "express";
import { authenticateUser } from "../../middleware/authenticateUser.js";
import { authorizeRoles } from "../../middleware/authorizeRoles.js";
import {
  getRecentNotifications,
  getUnreadCount,
  listEscalationRules,
  listNotifications,
  markAllAsRead,
  markAsRead,
  runNotificationChecks,
  updateEscalationRule,
} from "./notification.controller.js";

const notificationRouter = Router();

// All notification operations require authentication
notificationRouter.use(authenticateUser);

notificationRouter.get("/", listNotifications);
notificationRouter.get("/unread-count", getUnreadCount);
notificationRouter.get("/recent", getRecentNotifications);
notificationRouter.patch("/:id/read", markAsRead);
notificationRouter.post("/mark-all-read", markAllAsRead);

// Escalation management
notificationRouter.get("/escalation-rules", listEscalationRules);
notificationRouter.patch(
  "/escalation-rules/:id",
  authorizeRoles("ADMIN"),
  updateEscalationRule
);

// Trigger background checks on demand
notificationRouter.post(
  "/run-checks",
  authorizeRoles("ADMIN", "PRODUCTION_MANAGER"),
  runNotificationChecks
);

export default notificationRouter;
