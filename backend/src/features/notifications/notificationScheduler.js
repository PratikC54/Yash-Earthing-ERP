import prisma from "../../db/prisma.js";
import { WORK_ORDER_STATUS } from "../production-quality/shared/productionQuality.constants.js";
import { EscalationService } from "./escalation.service.js";
import { NOTIFICATION_PRIORITY, NOTIFICATION_TYPES } from "./notification.constants.js";
import { NotificationService } from "./notification.service.js";

export class NotificationScheduler {
  /**
   * Check Work Orders approaching their deadline within the warning window (24h).
   */
  static async checkApproachingDeadlines(warningHours = 24) {
    const now = new Date();
    const deadlineThreshold = new Date(now.getTime() + warningHours * 60 * 60 * 1000);

    const approachingOrders = await prisma.workOrder.findMany({
      where: {
        status: {
          in: [
            WORK_ORDER_STATUS.PLANNED,
            WORK_ORDER_STATUS.RELEASED,
            WORK_ORDER_STATUS.IN_PROGRESS,
            WORK_ORDER_STATUS.MATERIAL_HOLD,
            WORK_ORDER_STATUS.QC_HOLD,
          ],
        },
        plannedEnd: {
          gt: now,
          lte: deadlineThreshold,
        },
      },
      include: {
        bomRevision: { select: { product: { select: { name: true, sku: true } } } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    let count = 0;
    for (const wo of approachingOrders) {
      const remainingHours = Math.max(
        1,
        Math.round((new Date(wo.plannedEnd).getTime() - now.getTime()) / (1000 * 60 * 60))
      );
      const productName = wo.bomRevision?.product?.name || "Product";
      const dateStr = new Date(wo.plannedEnd).toISOString().split("T")[0];
      const dedupKey = `DEADLINE:${wo.id}:${dateStr}`;

      const recipients = ["PRODUCTION_MANAGER", "ENGINEER"];
      const notifs = await NotificationService.notifyRoles(recipients, {
        type: NOTIFICATION_TYPES.WO_APPROACHING_DEADLINE,
        title: `Work Order ${wo.workOrderNo} Approaching Deadline`,
        message: `Work Order ${wo.workOrderNo} (${productName}) is due in ${remainingHours} hour(s) on ${dateStr}. Status: ${wo.status}.`,
        priority: NOTIFICATION_PRIORITY.HIGH,
        link: `/pq/work-orders/${wo.id}`,
        entityType: "WorkOrder",
        entityId: wo.id,
        dedupKey,
        metadata: {
          workOrderNo: wo.workOrderNo,
          plannedEnd: wo.plannedEnd,
          remainingHours,
        },
      });

      // Also notify creator if present
      if (wo.createdById) {
        await NotificationService.notifyUsers([wo.createdById], {
          type: NOTIFICATION_TYPES.WO_APPROACHING_DEADLINE,
          title: `Work Order ${wo.workOrderNo} Approaching Deadline`,
          message: `Work Order ${wo.workOrderNo} (${productName}) created by you is due in ${remainingHours} hour(s).`,
          priority: NOTIFICATION_PRIORITY.HIGH,
          link: `/pq/work-orders/${wo.id}`,
          entityType: "WorkOrder",
          entityId: wo.id,
          dedupKey: `${dedupKey}:creator`,
        });
      }

      count += notifs.length;
    }

    return { processedOrders: approachingOrders.length, alertsSent: count };
  }

  /**
   * Check Work Orders that have passed their due date without reaching completion.
   * Dispatches overdue alerts and triggers multi-level escalations.
   */
  static async checkOverdueWorkOrders() {
    const now = new Date();

    const overdueOrders = await prisma.workOrder.findMany({
      where: {
        status: {
          notIn: [WORK_ORDER_STATUS.COMPLETED, WORK_ORDER_STATUS.CANCELLED],
        },
        plannedEnd: {
          lt: now,
        },
      },
      include: {
        bomRevision: { select: { product: { select: { name: true, sku: true } } } },
        createdBy: { select: { id: true } },
      },
    });

    let count = 0;
    for (const wo of overdueOrders) {
      const hoursOverdue = Math.max(
        0.1,
        (now.getTime() - new Date(wo.plannedEnd).getTime()) / (1000 * 60 * 60)
      );
      const productName = wo.bomRevision?.product?.name || "Product";
      const dateStr = new Date(wo.plannedEnd).toISOString().split("T")[0];

      // Base Level 1 overdue alert
      const baseDedup = `OVERDUE:${wo.id}:${dateStr}`;
      const baseNotifs = await NotificationService.notifyRoles(
        ["PRODUCTION_MANAGER", "ENGINEER"],
        {
          type: NOTIFICATION_TYPES.WO_OVERDUE,
          title: `CRITICAL: Work Order ${wo.workOrderNo} is OVERDUE`,
          message: `Work Order ${wo.workOrderNo} (${productName}) passed its scheduled deadline on ${dateStr} by ${Math.floor(hoursOverdue)}h. Current Status: ${wo.status}.`,
          priority: NOTIFICATION_PRIORITY.CRITICAL,
          link: `/pq/work-orders/${wo.id}`,
          entityType: "WorkOrder",
          entityId: wo.id,
          dedupKey: baseDedup,
          metadata: {
            workOrderNo: wo.workOrderNo,
            plannedEnd: wo.plannedEnd,
            hoursOverdue,
          },
        }
      );
      count += baseNotifs.length;

      // Evaluate and trigger multi-level escalation
      const escalated = await EscalationService.triggerEscalation({
        eventType: "WO_OVERDUE",
        entityType: "WorkOrder",
        entityId: wo.id,
        hoursElapsed: hoursOverdue,
        title: `Work Order ${wo.workOrderNo} Overdue Escalation`,
        message: `Work Order ${wo.workOrderNo} (${productName}) has remained overdue for ${Math.floor(hoursOverdue)} hours without completion.`,
        link: `/pq/work-orders/${wo.id}`,
        metadata: { workOrderNo: wo.workOrderNo, hoursOverdue },
      });
      count += escalated.length;
    }

    return { processedOrders: overdueOrders.length, alertsSent: count };
  }

  /**
   * Check Quality Inspections that have exceeded their SLA threshold.
   */
  static async checkOverdueInspections(slaHours = 4) {
    const now = new Date();
    const slaCutoff = new Date(now.getTime() - slaHours * 60 * 60 * 1000);

    const pendingInspections = await prisma.qualityInspection.findMany({
      where: {
        status: {
          in: ["PENDING_ASSIGNMENT", "ASSIGNED", "PENDING", "IN_PROGRESS", "HOLD"],
        },
        createdAt: {
          lte: slaCutoff,
        },
      },
      include: {
        workOrder: { select: { id: true, workOrderNo: true } },
        assignedInspector: { select: { id: true, name: true } },
      },
    });

    let count = 0;
    for (const insp of pendingInspections) {
      const hoursElapsed = Math.max(
        0.1,
        (now.getTime() - new Date(insp.createdAt).getTime()) / (1000 * 60 * 60)
      );

      // Base alert to QC Inspector and Production Manager
      const baseDedup = `INSP_OVERDUE:${insp.id}:${Math.floor(hoursElapsed / 12)}`;
      const notifs = await NotificationService.notifyRoles(
        ["QUALITY_INSPECTOR", "PRODUCTION_MANAGER"],
        {
          type: NOTIFICATION_TYPES.INSPECTION_OVERDUE,
          title: `Inspection SLA Exceeded: Lot ${insp.inspectionNo}`,
          message: `Inspection Lot ${insp.inspectionNo} (WO: ${insp.workOrder.workOrderNo}) has been pending decision for ${Math.floor(hoursElapsed)}h (SLA: ${slaHours}h). Status: ${insp.status}.`,
          priority: NOTIFICATION_PRIORITY.HIGH,
          link: `/pq/inspections/${insp.id}`,
          entityType: "QualityInspection",
          entityId: insp.id,
          dedupKey: baseDedup,
          metadata: {
            inspectionNo: insp.inspectionNo,
            workOrderId: insp.workOrderId,
            hoursElapsed,
          },
        }
      );
      count += notifs.length;

      // Evaluate escalation
      const escalated = await EscalationService.triggerEscalation({
        eventType: "INSPECTION_OVERDUE",
        entityType: "QualityInspection",
        entityId: insp.id,
        hoursElapsed,
        title: `Quality Inspection ${insp.inspectionNo} SLA Escalation`,
        message: `Inspection Lot ${insp.inspectionNo} has remained unfinalized for ${Math.floor(hoursElapsed)} hours.`,
        link: `/pq/inspections/${insp.id}`,
        metadata: { inspectionNo: insp.inspectionNo, hoursElapsed },
      });
      count += escalated.length;
    }

    return { processedInspections: pendingInspections.length, alertsSent: count };
  }

  /**
   * Run all checks in a single batch.
   */
  static async runAllChecks() {
    try {
      const deadlineStats = await this.checkApproachingDeadlines();
      const overdueStats = await this.checkOverdueWorkOrders();
      const inspectionStats = await this.checkOverdueInspections();

      return {
        timestamp: new Date().toISOString(),
        success: true,
        deadlineStats,
        overdueStats,
        inspectionStats,
      };
    } catch (error) {
      console.error("Error during scheduled notification execution:", error);
      return {
        timestamp: new Date().toISOString(),
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Start in-process background interval runner.
   */
  static startScheduler(intervalMs = 5 * 60 * 1000) {
    // Initial run after short startup grace period (10 seconds)
    setTimeout(() => {
      this.runAllChecks().catch((err) =>
        console.error("Initial notification check failed:", err)
      );
    }, 10000);

    return setInterval(() => {
      this.runAllChecks().catch((err) =>
        console.error("Background notification interval check failed:", err)
      );
    }, intervalMs);
  }
}
