import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { EscalationService } from "./escalation.service.js";
import { NotificationService } from "./notification.service.js";
import { NotificationScheduler } from "./notificationScheduler.js";

export const listNotifications = asyncHandler(async (req, res) => {
  const result = await NotificationService.listNotifications(req.user.id, req.query);
  return res.status(200).json({
    success: true,
    message: "Notifications retrieved successfully",
    data: result.notifications,
    meta: {
      unreadCount: result.unreadCount,
      pagination: result.pagination,
    },
    pagination: result.pagination,
  });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const result = await NotificationService.getUnreadCount(req.user.id);
  return sendSuccess(res, {
    message: "Unread notifications count retrieved",
    data: result,
  });
});

export const getRecentNotifications = asyncHandler(async (req, res) => {
  const limit = req.query.limit || 10;
  const result = await NotificationService.getRecentNotifications(req.user.id, limit);
  return res.status(200).json({
    success: true,
    message: "Recent notifications retrieved",
    data: result.notifications,
    meta: { unreadCount: result.unreadCount },
    unreadCount: result.unreadCount,
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const result = await NotificationService.markAsRead(req.params.id, req.user.id);
  return sendSuccess(res, {
    message: "Notification marked as read",
    data: result,
  });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await NotificationService.markAllAsRead(req.user.id);
  return sendSuccess(res, {
    message: "All notifications marked as read",
    data: result,
  });
});

export const listEscalationRules = asyncHandler(async (req, res) => {
  const rules = await EscalationService.listRules();
  return sendSuccess(res, {
    message: "Escalation rules retrieved successfully",
    data: rules,
  });
});

export const updateEscalationRule = asyncHandler(async (req, res) => {
  const updated = await EscalationService.updateRule(req.params.id, req.body);
  return sendSuccess(res, {
    message: "Escalation rule updated successfully",
    data: updated,
  });
});

export const runNotificationChecks = asyncHandler(async (req, res) => {
  const stats = await NotificationScheduler.runAllChecks();
  return sendSuccess(res, {
    message: "Notification and escalation checks executed successfully",
    data: stats,
  });
});
