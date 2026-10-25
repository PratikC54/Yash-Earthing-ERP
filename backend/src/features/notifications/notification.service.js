import prisma from "../../db/prisma.js";
import { ApiError } from "../../utils/apiResponse.js";
import {
  NOTIFICATION_PRIORITY,
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPES,
} from "./notification.constants.js";

export class NotificationService {
  /**
   * Create or deduplicate an in-app notification for a specific recipient.
   */
  static async createNotification(data) {
    const {
      recipientId,
      type,
      title,
      message,
      priority = NOTIFICATION_PRIORITY.MEDIUM,
      link = null,
      entityType = null,
      entityId = null,
      dedupKey = null,
      metadata = null,
    } = data;

    if (!recipientId || isNaN(recipientId)) {
      throw new Error("Valid recipientId is required to create a notification");
    }

    // If dedupKey is provided, check if notification already exists for this recipient
    if (dedupKey) {
      const existing = await prisma.notification.findUnique({
        where: {
          recipientId_dedupKey: {
            recipientId: Number(recipientId),
            dedupKey,
          },
        },
      });

      if (existing) {
        return existing;
      }
    }

    return await prisma.notification.create({
      data: {
        recipientId: Number(recipientId),
        type,
        title,
        message,
        priority,
        link,
        entityType,
        entityId: entityId ? Number(entityId) : null,
        dedupKey,
        metadata: metadata || undefined,
        status: NOTIFICATION_STATUS.UNREAD,
      },
    });
  }

  /**
   * Broadcast a notification to all active users matching specified roles.
   */
  static async notifyRoles(roles, notificationPayload) {
    if (!roles || (Array.isArray(roles) && roles.length === 0)) {
      return [];
    }

    const roleList = Array.isArray(roles) ? roles : [roles];
    const users = await prisma.user.findMany({
      where: {
        role: { in: roleList },
        isActive: true,
      },
      select: { id: true, name: true, role: true },
    });

    const results = [];
    for (const u of users) {
      try {
        const notif = await this.createNotification({
          ...notificationPayload,
          recipientId: u.id,
        });
        results.push(notif);
      } catch (err) {
        console.error(`Failed to dispatch notification to user #${u.id}:`, err);
      }
    }
    return results;
  }

  /**
   * Broadcast a notification to explicit user IDs.
   */
  static async notifyUsers(userIds, notificationPayload) {
    if (!userIds || userIds.length === 0) return [];

    const distinctIds = [...new Set(userIds.filter(Boolean).map(Number))];
    const results = [];

    for (const id of distinctIds) {
      try {
        const notif = await this.createNotification({
          ...notificationPayload,
          recipientId: id,
        });
        results.push(notif);
      } catch (err) {
        console.error(`Failed to dispatch notification to user #${id}:`, err);
      }
    }
    return results;
  }

  /**
   * List paginated notifications for the authenticated user with optional filtering.
   */
  static async listNotifications(userId, query = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where = {
      recipientId: Number(userId),
    };

    if (query.status && query.status !== "ALL") {
      where.status = query.status;
    }

    if (query.priority && query.priority !== "ALL") {
      where.priority = query.priority;
    }

    if (query.type && query.type !== "ALL") {
      where.type = query.type;
    }

    if (query.category) {
      const cat = query.category.toUpperCase();
      if (cat === "WORK_ORDER") {
        where.type = { in: [NOTIFICATION_TYPES.WO_APPROACHING_DEADLINE, NOTIFICATION_TYPES.WO_OVERDUE, NOTIFICATION_TYPES.PRODUCTION_COMPLETED] };
      } else if (cat === "QUALITY") {
        where.type = { in: [NOTIFICATION_TYPES.INSPECTION_FAILED, NOTIFICATION_TYPES.INSPECTION_OVERDUE, NOTIFICATION_TYPES.REWORK_COMPLETED, NOTIFICATION_TYPES.CRITICAL_DEFECT] };
      } else if (cat === "MAINTENANCE") {
        where.type = { in: [NOTIFICATION_TYPES.MACHINE_BREAKDOWN] };
      }
    }

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { message: { contains: q, mode: "insensitive" } },
      ];
    }

    const total = await prisma.notification.count({ where });
    const unreadCount = await prisma.notification.count({
      where: { recipientId: Number(userId), status: NOTIFICATION_STATUS.UNREAD },
    });
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    return {
      notifications,
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get unread notifications count for badge display.
   */
  static async getUnreadCount(userId) {
    const count = await prisma.notification.count({
      where: {
        recipientId: Number(userId),
        status: NOTIFICATION_STATUS.UNREAD,
      },
    });
    return { unreadCount: count };
  }

  /**
   * Retrieve recent notifications for the top navbar bell dropdown.
   */
  static async getRecentNotifications(userId, limit = 10) {
    const unreadCount = await prisma.notification.count({
      where: { recipientId: Number(userId), status: NOTIFICATION_STATUS.UNREAD },
    });
    const notifications = await prisma.notification.findMany({
      where: { recipientId: Number(userId) },
      orderBy: [{ status: "desc" }, { createdAt: "desc" }],
      take: Math.min(30, Math.max(1, Number(limit))),
    });

    return {
      unreadCount,
      notifications,
    };
  }

  /**
   * Mark a single notification as READ.
   * Enforces security: users can only mark their own notifications.
   */
  static async markAsRead(notificationId, userId) {
    const id = Number(notificationId);
    const notif = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notif) {
      throw ApiError.notFound(`Notification #${id} not found`);
    }

    if (notif.recipientId !== Number(userId)) {
      throw ApiError.forbidden("Access denied: You cannot modify notifications belonging to another user.");
    }

    return await prisma.notification.update({
      where: { id },
      data: {
        status: NOTIFICATION_STATUS.READ,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark ALL unread notifications as READ for the user.
   */
  static async markAllAsRead(userId) {
    const result = await prisma.notification.updateMany({
      where: {
        recipientId: Number(userId),
        status: NOTIFICATION_STATUS.UNREAD,
      },
      data: {
        status: NOTIFICATION_STATUS.READ,
        readAt: new Date(),
      },
    });

    return {
      message: "All notifications marked as read",
      count: result.count,
    };
  }
}
