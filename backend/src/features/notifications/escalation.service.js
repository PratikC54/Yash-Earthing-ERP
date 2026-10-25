import prisma from "../../db/prisma.js";
import { ApiError } from "../../utils/apiResponse.js";
import { NOTIFICATION_PRIORITY, NOTIFICATION_TYPES } from "./notification.constants.js";
import { NotificationService } from "./notification.service.js";

export class EscalationService {
  /**
   * List all escalation rules.
   */
  static async listRules() {
    return await prisma.escalationRule.findMany({
      orderBy: [{ eventType: "asc" }, { level: "asc" }],
    });
  }

  /**
   * Update an existing escalation rule threshold or target roles.
   */
  static async updateRule(id, data) {
    const numId = Number(id);
    const existing = await prisma.escalationRule.findUnique({
      where: { id: numId },
    });

    if (!existing) {
      throw ApiError.notFound(`Escalation rule #${id} not found`);
    }

    const updated = await prisma.escalationRule.update({
      where: { id: numId },
      data: {
        ...(data.thresholdHours !== undefined ? { thresholdHours: Number(data.thresholdHours) } : {}),
        ...(data.targetRoles !== undefined ? { targetRoles: data.targetRoles } : {}),
        ...(data.isActive !== undefined ? { isActive: Boolean(data.isActive) } : {}),
      },
    });

    return updated;
  }

  /**
   * Evaluate and dispatch escalation notifications based on elapsed hours.
   */
  static async triggerEscalation({
    eventType,
    entityType,
    entityId,
    hoursElapsed,
    title,
    message,
    link,
    metadata = {},
  }) {
    const rules = await prisma.escalationRule.findMany({
      where: {
        eventType,
        isActive: true,
      },
      orderBy: { level: "asc" },
    });

    const dispatched = [];

    for (const rule of rules) {
      // Check if threshold has been reached
      if (hoursElapsed >= rule.thresholdHours) {
        const dedupKey = `ESCALATION:${eventType}:${entityId}:L${rule.level}`;
        const escalationType =
          rule.level === 3
            ? NOTIFICATION_TYPES.ESCALATION_LEVEL_3
            : rule.level === 2
            ? NOTIFICATION_TYPES.ESCALATION_LEVEL_2
            : eventType;

        const notifs = await NotificationService.notifyRoles(rule.targetRoles, {
          type: escalationType,
          title: `[ESCALATION Level ${rule.level}] ${title}`,
          message: `${message} (Overdue by ${Math.floor(hoursElapsed)}h, threshold: ${rule.thresholdHours}h)`,
          priority: rule.level >= 2 ? NOTIFICATION_PRIORITY.CRITICAL : NOTIFICATION_PRIORITY.HIGH,
          link,
          entityType,
          entityId,
          dedupKey,
          metadata: {
            ...metadata,
            escalationLevel: rule.level,
            thresholdHours: rule.thresholdHours,
            hoursElapsed,
          },
        });

        dispatched.push(...notifs);
      }
    }

    return dispatched;
  }
}
