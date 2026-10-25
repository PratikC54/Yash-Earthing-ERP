import prisma from "../../../db/prisma.js";
import { AuditService } from "../../../services/audit.service.js";
import { ApiError } from "../../../utils/apiResponse.js";
import { NotificationService } from "../../notifications/notification.service.js";
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITY } from "../../notifications/notification.constants.js";
import {
  INVENTORY_MOVEMENT_TYPE,
  INVENTORY_REFERENCE_TYPE,
  QUALITY_STATUS,
  WORK_ORDER_STATUS,
} from "../shared/productionQuality.constants.js";
import {
  validateFutureOrTodayDate,
  validateQuantityValue,
} from "../shared/productionQuality.utils.js";

export class QualityService {
  /**
   * Quality Control Dashboard metrics
   */
  static async getDashboard() {
    const [total, pendingAssignment, assigned, inProgress, passed, failed, held, released] = await Promise.all([
      prisma.qualityInspection.count(),
      prisma.qualityInspection.count({ where: { status: QUALITY_STATUS.PENDING_ASSIGNMENT } }),
      prisma.qualityInspection.count({
        where: { status: { in: [QUALITY_STATUS.ASSIGNED, QUALITY_STATUS.PENDING] } },
      }),
      prisma.qualityInspection.count({ where: { status: QUALITY_STATUS.IN_PROGRESS } }),
      prisma.qualityInspection.count({ where: { status: QUALITY_STATUS.PASS } }),
      prisma.qualityInspection.count({ where: { status: QUALITY_STATUS.FAIL } }),
      prisma.qualityInspection.count({ where: { status: QUALITY_STATUS.HOLD } }),
      prisma.qualityInspection.count({ where: { status: QUALITY_STATUS.RELEASED } }),
    ]);

    const queue = await this.getInspectionQueue();

    return {
      metrics: {
        totalInspections: total,
        pendingAssignment,
        assignedToInspector: assigned,
        inProgress,
        passed,
        failed,
        onHold: held,
        releasedToInventory: released,
        pendingInspection: pendingAssignment + assigned + inProgress + held,
      },
      queue,
    };
  }

  /**
   * Inspection queue: work order outputs waiting for QC assignment or decision
   */
  static async getInspectionQueue(query = {}) {
    const where = {};
    if (query?.status) {
      where.status = query.status;
    } else {
      where.status = {
        in: [
          QUALITY_STATUS.PENDING_ASSIGNMENT,
          QUALITY_STATUS.ASSIGNED,
          QUALITY_STATUS.PENDING,
          QUALITY_STATUS.IN_PROGRESS,
          QUALITY_STATUS.HOLD,
        ],
      };
    }

    if (query?.inspectorId) {
      where.assignedInspectorId = Number(query.inspectorId);
    }

    return prisma.qualityInspection.findMany({
      where,
      include: {
        assignedInspector: {
          select: { id: true, name: true, email: true, role: true, department: true },
        },
        assignedBy: {
          select: { id: true, name: true, role: true },
        },
        workOrder: {
          select: {
            id: true,
            workOrderNo: true,
            priority: true,
            bomRevision: {
              select: {
                revision: true,
                product: {
                  select: { id: true, name: true, sku: true, unitOfMeasure: true },
                },
              },
            },
            salesOrder: {
              select: { orderNumber: true, customer: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get eligible users who can be assigned as Quality Inspectors
   */
  static async getEligibleInspectors() {
    return await prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: ["QUALITY_INSPECTOR", "ADMIN", "PRODUCTION_MANAGER"] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Single inspection details with full context
   */
  static async getInspectionById(id) {
    const inspection = await prisma.qualityInspection.findUnique({
      where: { id: Number(id) },
      include: {
        assignedInspector: {
          select: { id: true, name: true, email: true, role: true, department: true },
        },
        assignedBy: {
          select: { id: true, name: true, role: true },
        },
        workOrder: {
          include: {
            bomRevision: {
              include: {
                product: {
                  include: {
                    productSpecifications: { where: { status: "RELEASED" }, take: 1 },
                  },
                },
              },
            },
            salesOrder: {
              select: { orderNumber: true, customer: { select: { name: true } } },
            },
          },
        },
        capaRecords: true,
      },
    });

    if (!inspection) {
      throw ApiError.notFound(`Quality Inspection #${id} not found`);
    }

    return inspection;
  }

  /**
   * Manually Assign a Quality Inspector to an Inspection Lot
   */
  static async assignInspector(id, data, user) {
    const { inspectorId, notes } = data;
    if (!inspectorId) {
      throw ApiError.badRequest("Inspector ID is required for assignment.");
    }

    const inspector = await prisma.user.findUnique({
      where: { id: Number(inspectorId) },
      select: { id: true, name: true, role: true, isActive: true },
    });

    if (!inspector) {
      throw ApiError.notFound(`User with ID ${inspectorId} not found.`);
    }

    if (!inspector.isActive) {
      throw ApiError.badRequest(`User '${inspector.name}' is inactive and cannot be assigned to inspections.`);
    }

    const eligibleRoles = ["QUALITY_INSPECTOR", "ADMIN", "PRODUCTION_MANAGER"];
    if (!eligibleRoles.includes(inspector.role)) {
      throw ApiError.badRequest(
        `User '${inspector.name}' has role '${inspector.role}', which is not authorized to perform quality inspections.`
      );
    }

    const inspection = await this.getInspectionById(id);

    if (inspection.status === QUALITY_STATUS.RELEASED) {
      throw ApiError.conflict("Cannot reassign inspector for inspection lot that has already been released to finished goods.");
    }

    if (inspection.status === QUALITY_STATUS.PASS || inspection.status === QUALITY_STATUS.FAIL) {
      throw ApiError.badRequest(`Cannot assign inspector to an inspection that has already been finalized (${inspection.status}).`);
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.qualityInspection.update({
        where: { id: Number(id) },
        data: {
          assignedInspectorId: inspector.id,
          status: QUALITY_STATUS.ASSIGNED,
          assignedAt: new Date(),
          assignedById: user?.id || null,
          evidenceNotes: notes
            ? `${inspection.evidenceNotes || ""}\nInspector Assignment: Assigned to ${inspector.name}. ${notes}`.trim()
            : inspection.evidenceNotes,
        },
        include: {
          assignedInspector: { select: { id: true, name: true, email: true, role: true } },
          assignedBy: { select: { id: true, name: true, role: true } },
          workOrder: {
            select: {
              id: true,
              workOrderNo: true,
              priority: true,
              bomRevision: { select: { product: { select: { id: true, name: true, sku: true } } } },
            },
          },
        },
      });

      // Set WorkOrder to QC_HOLD
      await tx.workOrder.update({
        where: { id: inspection.workOrderId },
        data: { status: WORK_ORDER_STATUS.QC_HOLD },
      });

      NotificationService.notifyRoles(["QUALITY_INSPECTOR", "PRODUCTION_MANAGER", "ADMIN"], {
        type: NOTIFICATION_TYPES.INSPECTION_FAILED,
        title: `Quality Inspection FAILED: Lot ${inspection.inspectionNo}`,
        message: `Inspection Lot ${inspection.inspectionNo} (WO: ${inspection.workOrder?.workOrderNo || inspection.workOrderId}) has FAILED quality checks. Reason: ${reason}. Work Order moved to QC_HOLD.`,
        priority: NOTIFICATION_PRIORITY.CRITICAL,
        link: `/pq/inspections/${id}`,
        entityType: "QualityInspection",
        entityId: Number(id),
        dedupKey: `INSP_FAILED:${id}`,
        metadata: { inspectionNo: inspection.inspectionNo, workOrderId: inspection.workOrderId, reason },
      }).catch((err) => console.error("Failed to emit INSPECTION_FAILED alert:", err));

      await AuditService.record({
        userId: user?.id,
        action: "INSPECTION_INSPECTOR_ASSIGNED",
        entityType: "QualityInspection",
        entityId: Number(id),
        after: {
          inspectionNo: inspection.inspectionNo,
          assignedInspectorId: inspector.id,
          assignedInspectorName: inspector.name,
          assignedById: user?.id,
          status: updated.status,
        },
        client: tx,
      });

      return updated;
    });
  }

  /**
   * Start Inspection
   */
  static async startInspection(id, user) {
    const inspection = await this.getInspectionById(id);

    if (!inspection.assignedInspectorId) {
      throw ApiError.badRequest(
        "Cannot start an unassigned inspection lot. An authorized user must assign a Quality Inspector first."
      );
    }

    if (
      user?.role !== "ADMIN" &&
      user?.role !== "PRODUCTION_MANAGER" &&
      user?.id !== inspection.assignedInspectorId
    ) {
      throw ApiError.forbidden("Only the assigned Quality Inspector or an administrator can start this inspection.");
    }

    const validStartStatuses = [
      QUALITY_STATUS.PENDING_ASSIGNMENT,
      QUALITY_STATUS.ASSIGNED,
      QUALITY_STATUS.PENDING,
      QUALITY_STATUS.NOT_STARTED,
    ];

    if (!validStartStatuses.includes(inspection.status)) {
      throw ApiError.badRequest(
        `Cannot start inspection in status '${inspection.status}'.`
      );
    }

    return await prisma.qualityInspection.update({
      where: { id: Number(id) },
      data: {
        status: QUALITY_STATUS.IN_PROGRESS,
        inspectedAt: inspection.inspectedAt || new Date(),
      },
      include: {
        assignedInspector: { select: { id: true, name: true, email: true, role: true } },
        workOrder: {
          select: {
            id: true,
            workOrderNo: true,
            bomRevision: { select: { product: { select: { id: true, name: true, sku: true } } } },
          },
        },
      },
    });
  }

  /**
   * Record Inspection Measurements & Results
   */
  static async recordResults(id, data, user) {
    const inspection = await this.getInspectionById(id);

    if (!inspection.assignedInspectorId) {
      throw ApiError.badRequest(
        "Cannot record inspection results on an unassigned inspection lot. An authorized user must assign a Quality Inspector first."
      );
    }

    if (
      user?.role !== "ADMIN" &&
      user?.role !== "PRODUCTION_MANAGER" &&
      user?.id !== inspection.assignedInspectorId
    ) {
      throw ApiError.forbidden("Only the assigned Quality Inspector or an administrator can record inspection results.");
    }

    if (inspection.status === QUALITY_STATUS.RELEASED) {
      throw ApiError.badRequest("Cannot modify inspection results. Output has already been released to finished goods.");
    }

    const totalInspected = Number(inspection.inspectedQuantity);
    const accepted = Number(data.acceptedQuantity);
    const rejected = Number(data.rejectedQuantity);

    // Quantity conservation: accepted + rejected <= total inspected
    if (accepted + rejected > totalInspected) {
      throw ApiError.badRequest(
        `Total accepted (${accepted}) + rejected (${rejected}) exceeds inspected quantity (${totalInspected}).`
      );
    }

    let calculatedStatus = inspection.status;
    if (accepted === totalInspected) {
      calculatedStatus = QUALITY_STATUS.PASS;
    } else if (rejected === totalInspected) {
      calculatedStatus = QUALITY_STATUS.FAIL;
    } else if (rejected > 0) {
      calculatedStatus = QUALITY_STATUS.HOLD;
    } else if (inspection.status === QUALITY_STATUS.ASSIGNED || inspection.status === QUALITY_STATUS.PENDING) {
      calculatedStatus = QUALITY_STATUS.IN_PROGRESS;
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.qualityInspection.update({
        where: { id: Number(id) },
        data: {
          acceptedQuantity: accepted,
          rejectedQuantity: rejected,
          measurements: data.measurements || inspection.measurements,
          evidenceNotes: data.evidenceNotes ?? inspection.evidenceNotes,
          status: calculatedStatus,
          inspectedAt: inspection.inspectedAt || new Date(),
          decisionOfficer: inspection.assignedInspector?.name || user?.name || null,
        },
        include: {
          assignedInspector: { select: { id: true, name: true, email: true, role: true } },
          workOrder: {
            select: {
              id: true,
              workOrderNo: true,
              bomRevision: { select: { product: { select: { id: true, name: true, sku: true } } } },
            },
          },
        },
      });

      await AuditService.record({
        userId: user?.id,
        action: "INSPECTION_RESULTS_RECORDED",
        entityType: "QualityInspection",
        entityId: id,
        after: updated,
        client: tx,
      });

      return updated;
    });
  }

  /**
   * Approve inspection manually
   */
  static async approveInspection(id, notes, user) {
    const inspection = await this.getInspectionById(id);

    if (!inspection.assignedInspectorId) {
      throw ApiError.badRequest(
        "Cannot approve an unassigned inspection lot. An authorized user must assign a Quality Inspector first."
      );
    }

    if (
      user?.role !== "ADMIN" &&
      user?.role !== "PRODUCTION_MANAGER" &&
      user?.id !== inspection.assignedInspectorId
    ) {
      throw ApiError.forbidden("Only the assigned Quality Inspector or an administrator can approve this inspection.");
    }

    if (inspection.status === QUALITY_STATUS.RELEASED) {
      throw ApiError.badRequest("Inspection already released to finished goods.");
    }

    const inspected = Number(inspection.inspectedQuantity);
    const accepted = Number(inspection.acceptedQuantity) || inspected;

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.qualityInspection.update({
        where: { id: Number(id) },
        data: {
          status: QUALITY_STATUS.PASS,
          acceptedQuantity: accepted,
          rejectedQuantity: 0,
          decisionOfficer: inspection.assignedInspector?.name || user?.name || null,
          decisionAt: new Date(),
          evidenceNotes: notes
            ? `${inspection.evidenceNotes || ""}\nApproval Note: ${notes}`
            : inspection.evidenceNotes,
        },
        include: {
          assignedInspector: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      await AuditService.record({
        userId: user?.id,
        action: "QUALITY_INSPECTION_APPROVED",
        entityType: "QualityInspection",
        entityId: id,
        after: updated,
        client: tx,
      });

      return updated;
    });
  }

  /**
   * Place inspection on quality hold
   */
  static async holdInspection(id, reason, user) {
    const inspection = await this.getInspectionById(id);

    if (!inspection.assignedInspectorId) {
      throw ApiError.badRequest(
        "Cannot hold an unassigned inspection lot. An authorized user must assign a Quality Inspector first."
      );
    }

    if (
      user?.role !== "ADMIN" &&
      user?.role !== "PRODUCTION_MANAGER" &&
      user?.id !== inspection.assignedInspectorId
    ) {
      throw ApiError.forbidden("Only the assigned Quality Inspector or an administrator can place this lot on hold.");
    }

    if (inspection.status === QUALITY_STATUS.RELEASED) {
      throw ApiError.conflict("Cannot hold inspection that is already released.");
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.qualityInspection.update({
        where: { id: Number(id) },
        data: {
          status: QUALITY_STATUS.HOLD,
          decisionOfficer: inspection.assignedInspector?.name || user?.name || null,
          decisionAt: new Date(),
          evidenceNotes: `${inspection.evidenceNotes || ""}\nQC Hold: ${reason}`,
        },
        include: {
          assignedInspector: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      // Also set WorkOrder to QC_HOLD if needed
      await tx.workOrder.update({
        where: { id: inspection.workOrderId },
        data: { status: WORK_ORDER_STATUS.QC_HOLD },
      });

      await AuditService.record({
        userId: user?.id,
        action: "QUALITY_INSPECTION_HOLD",
        entityType: "QualityInspection",
        entityId: id,
        after: { status: QUALITY_STATUS.HOLD, reason },
        client: tx,
      });

      return updated;
    });
  }

  /**
   * Reject inspection
   */
  static async rejectInspection(id, reason, user) {
    const inspection = await this.getInspectionById(id);

    if (!inspection.assignedInspectorId) {
      throw ApiError.badRequest(
        "Cannot reject an unassigned inspection lot. An authorized user must assign a Quality Inspector first."
      );
    }

    if (
      user?.role !== "ADMIN" &&
      user?.role !== "PRODUCTION_MANAGER" &&
      user?.id !== inspection.assignedInspectorId
    ) {
      throw ApiError.forbidden("Only the assigned Quality Inspector or an administrator can reject this inspection.");
    }

    if (inspection.status === QUALITY_STATUS.RELEASED) {
      throw ApiError.conflict("Cannot reject output that has already been released to finished goods.");
    }

    const inspected = Number(inspection.inspectedQuantity);

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.qualityInspection.update({
        where: { id: Number(id) },
        data: {
          status: QUALITY_STATUS.FAIL,
          acceptedQuantity: 0,
          rejectedQuantity: inspected,
          decisionOfficer: inspection.assignedInspector?.name || user?.name || null,
          decisionAt: new Date(),
          evidenceNotes: `${inspection.evidenceNotes || ""}\nQC Rejection Reason: ${reason}`,
        },
        include: {
          assignedInspector: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      await AuditService.record({
        userId: user?.id,
        action: "QUALITY_INSPECTION_REJECTED",
        entityType: "QualityInspection",
        entityId: id,
        after: { status: QUALITY_STATUS.FAIL, reason },
        client: tx,
      });

      return updated;
    });
  }

  /**
   * Request Rework for defective batch
   */
  static async requestRework(id, notes, user) {
    const inspection = await this.getInspectionById(id);

    if (!inspection.assignedInspectorId) {
      throw ApiError.badRequest(
        "Cannot request rework for an unassigned inspection lot. An authorized user must assign a Quality Inspector first."
      );
    }

    if (
      user?.role !== "ADMIN" &&
      user?.role !== "PRODUCTION_MANAGER" &&
      user?.id !== inspection.assignedInspectorId
    ) {
      throw ApiError.forbidden("Only the assigned Quality Inspector or an administrator can request rework.");
    }

    if (!notes?.trim()) {
      throw ApiError.badRequest("Rework notes are required.");
    }

    if (inspection.status === QUALITY_STATUS.RELEASED) {
      throw ApiError.conflict("Cannot request rework for released batch.");
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.qualityInspection.update({
        where: { id: Number(id) },
        data: {
          status: QUALITY_STATUS.HOLD,
          decisionOfficer: inspection.assignedInspector?.name || user?.name || null,
          decisionAt: new Date(),
          evidenceNotes: `${inspection.evidenceNotes || ""}\nRework Instructions: ${notes}`,
        },
        include: {
          assignedInspector: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      NotificationService.notifyRoles(["QUALITY_INSPECTOR", "PRODUCTION_MANAGER"], {
        type: NOTIFICATION_TYPES.REWORK_COMPLETED,
        title: `Rework Required: Lot ${inspection.inspectionNo}`,
        message: `Rework instructions logged for Inspection ${inspection.inspectionNo}: ${notes}. Must be re-inspected before dispatch.`,
        priority: NOTIFICATION_PRIORITY.HIGH,
        link: `/pq/inspections/${id}`,
        entityType: "QualityInspection",
        entityId: Number(id),
      }).catch((err) => console.error("Failed to emit REWORK alert:", err));

      await AuditService.record({
        userId: user?.id,
        action: "REWORK_REQUESTED",
        entityType: "QualityInspection",
        entityId: id,
        after: { reworkNotes: notes },
        client: tx,
      });

      return updated;
    });
  }

  /**
   * Log Non-Conformance Report (NCR)
   */
  static async recordNonConformance(data, user) {
    const { inspectionId, severity, rootCause, proposedAction } = data;
    const defectType = data.defectType || data.defectCategory;
    const description = data.description || data.defectDescription;

    const inspection = await this.getInspectionById(inspectionId);

    const ncr = {
      inspectionId,
      inspectionNo: inspection.inspectionNo,
      workOrderId: inspection.workOrderId,
      defectType,
      severity,
      description,
      rootCause: rootCause || null,
      proposedAction,
      loggedAt: new Date().toISOString(),
    };

    if (severity === "CRITICAL") {
      // Apply automatic quality hold on work order
      await prisma.workOrder.update({
        where: { id: inspection.workOrderId },
        data: { status: WORK_ORDER_STATUS.QC_HOLD },
      });

      NotificationService.notifyRoles(["QUALITY_INSPECTOR", "PRODUCTION_MANAGER", "ADMIN"], {
        type: NOTIFICATION_TYPES.CRITICAL_DEFECT,
        title: `CRITICAL DEFECT DETECTED: ${defectType}`,
        message: `A critical defect (${defectType}) was reported on Lot ${inspection.inspectionNo} (WO: ${inspection.workOrder?.workOrderNo || inspection.workOrderId}): ${description}. Work Order has been placed on QC_HOLD immediately.`,
        priority: NOTIFICATION_PRIORITY.CRITICAL,
        link: `/pq/inspections/${inspectionId}`,
        entityType: "QualityInspection",
        entityId: Number(inspectionId),
        dedupKey: `CRITICAL_DEFECT:${inspectionId}:${Date.now()}`,
        metadata: { inspectionId, workOrderId: inspection.workOrderId, defectType, severity, description },
      }).catch((err) => console.error("Failed to emit CRITICAL_DEFECT alert:", err));
    }

    await AuditService.record({
      userId: user?.id,
      action: "NON_CONFORMANCE_LOGGED",
      entityType: "NonConformanceReport",
      entityId: inspectionId,
      after: ncr,
    });

    return ncr;
  }

  /**
   * List Non-Conformance Reports
   */
  static async listNonConformances() {
    const auditLogs = await prisma.auditLog.findMany({
      where: { action: "NON_CONFORMANCE_LOGGED" },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, role: true } } },
    });

    const loggedNcrs = auditLogs.map((log) => {
      const data = log.after || {};
      const numId = Number(log.id);
      return {
        id: numId,
        ncrId: `NCR-${new Date(log.createdAt).getFullYear()}-${String(numId).padStart(3, "0")}`,
        inspectionId: log.entityId,
        defectType: data.defectType || null,
        severity: data.severity || null,
        description: data.description || null,
        rootCause: data.rootCause || null,
        proposedAction: data.proposedAction || null,
        loggedBy: log.user?.name || null,
        createdAt: log.createdAt,
      };
    });

    return loggedNcrs;
  }

  /**
   * Log Corrective and Preventive Action (CAPA)
   */
  static async recordCorrectiveAction(data, user) {
    const { ncrId, actionDescription, assignedToId, targetDate } = data;

    const capa = {
      ncrId,
      actionDescription,
      assignedToId,
      targetDate: targetDate || null,
      loggedAt: new Date().toISOString(),
    };

    await AuditService.record({
      userId: user?.id,
      action: "CORRECTIVE_ACTION_LOGGED",
      entityType: "CorrectiveAction",
      entityId: ncrId,
      after: capa,
    });

    return capa;
  }

  /**
   * Authorize Scrap from Quality Rejection
   */
  static async approveScrap(data, user) {
    const { inspectionId, quantity, reason, scrapCost } = data;

    const inspection = await this.getInspectionById(inspectionId);

    const scrapAuth = {
      inspectionId,
      workOrderId: inspection.workOrderId,
      quantityScrapped: Number(quantity),
      reason,
      scrapCost: scrapCost ? Number(scrapCost) : 0,
      approvedBy: user?.name || null,
      approvedAt: new Date().toISOString(),
    };

    await AuditService.record({
      userId: user?.id,
      action: "SCRAP_APPROVED_BY_QUALITY",
      entityType: "ScrapApproval",
      entityId: inspectionId,
      after: scrapAuth,
    });

    return scrapAuth;
  }

  /**
   * Release inspected & accepted batch into Finished Goods Inventory
   */
  static async releaseFinishedGoods(data, user) {
    const { inspectionId, warehouseLocation, batchNumber, notes } = data;

    const inspection = await this.getInspectionById(inspectionId);

    // 1. Idempotency Check
    if (inspection.status === QUALITY_STATUS.RELEASED) {
      throw ApiError.conflict(
        `Quality Inspection #${inspectionId} (${inspection.inspectionNo}) has already been released to finished goods inventory.`
      );
    }

    // 2. Eligibility Check: must be PASS and have acceptedQuantity > 0
    if (inspection.status !== QUALITY_STATUS.PASS) {
      throw ApiError.badRequest(
        `Cannot release to finished goods. Inspection status must be PASS (current status: '${inspection.status}').`
      );
    }

    const releaseQuantity = Number(inspection.acceptedQuantity);
    if (releaseQuantity <= 0) {
      throw ApiError.badRequest(
        `Accepted quantity is ${releaseQuantity}. Only positive accepted quantities can be released to finished goods.`
      );
    }

    // 3. Resolve Finished Product ID from WorkOrder
    const workOrder = inspection.workOrder;
    let finishedProductId = workOrder.bomRevision?.productId;

    if (!finishedProductId) {
      const so = await prisma.salesOrder.findUnique({
        where: { id: workOrder.salesOrderId },
        include: { items: true },
      });
      finishedProductId = so?.items[0]?.productId;
    }

    if (!finishedProductId) {
      throw ApiError.badRequest(
        "Could not determine finished product ID for work order release. Check BOM or Sales Order configuration."
      );
    }

    return await prisma.$transaction(async (tx) => {
      // Step A: Mark Inspection as RELEASED
      const updatedInspection = await tx.qualityInspection.update({
        where: { id: Number(inspectionId) },
        data: {
          status: QUALITY_STATUS.RELEASED,
        },
        include: {
          assignedInspector: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      // Step B: Update Inventory stock for finished product
      const existingInventory = await tx.inventory.findUnique({
        where: { productId: finishedProductId },
      });

      if (existingInventory) {
        await tx.inventory.update({
          where: { productId: finishedProductId },
          data: {
            physicalQuantity: Number(existingInventory.physicalQuantity) + releaseQuantity,
            warehouseLocation,
          },
        });
      } else {
        await tx.inventory.create({
          data: {
            productId: finishedProductId,
            physicalQuantity: releaseQuantity,
            reservedQuantity: 0,
            reorderLevel: 10,
            unitCost: 0,
            warehouseLocation,
          },
        });
      }

      // Step C: Create InventoryMovement audit record (STOCK_IN for WORK_ORDER)
      const movement = await tx.inventoryMovement.create({
        data: {
          productId: finishedProductId,
          movementType: INVENTORY_MOVEMENT_TYPE.STOCK_IN,
          referenceType: INVENTORY_REFERENCE_TYPE.WORK_ORDER,
          referenceId: workOrder.id,
          quantity: releaseQuantity,
          batchNumber: batchNumber || null,
          locationCode: warehouseLocation,
          notes: notes || `FG Release from QC Inspection ${inspection.inspectionNo}`,
          createdById: user?.id || null,
        },
      });

      // Step D: Check if Work Order is completely finished
      const allInspections = await tx.qualityInspection.findMany({
        where: { workOrderId: workOrder.id },
      });

      const totalReleased = allInspections.reduce(
        (sum, insp) => (insp.status === QUALITY_STATUS.RELEASED ? sum + Number(insp.acceptedQuantity) : sum),
        0
      );

      let isWorkOrderCompleted = false;
      if (totalReleased >= Number(workOrder.plannedQuantity)) {
        await tx.workOrder.update({
          where: { id: workOrder.id },
          data: {
            status: WORK_ORDER_STATUS.COMPLETED,
            actualEnd: new Date(),
          },
        });
        isWorkOrderCompleted = true;
      }

      // Step E: Audit logging
      await AuditService.record({
        userId: user?.id,
        action: "FINISHED_GOODS_RELEASED",
        entityType: "FinishedGoodsRelease",
        entityId: inspection.id,
        after: {
          inspectionId: inspection.id,
          inspectionNo: inspection.inspectionNo,
          workOrderId: workOrder.id,
          finishedProductId,
          releaseQuantity,
          inventoryMovementId: movement.id,
          isWorkOrderCompleted,
        },
        client: tx,
      });

      return {
        inspection: updatedInspection,
        releaseQuantity,
        finishedProductId,
        inventoryMovement: movement,
        isWorkOrderCompleted,
      };
    });
  }

  /**
   * Submit Quality Decision (Pass, Rework, Rejected)
   * Enforces strict quantity conservation:
   * Transferred = Passed + Rework + Rejected + Pending
   */
  static async submitDecision(id, data, user) {
    const inspection = await this.getInspectionById(id);

    if (!inspection.assignedInspectorId) {
      throw ApiError.badRequest(
        "Cannot record a quality decision on an unassigned inspection lot. An authorized user must assign a Quality Inspector first."
      );
    }

    if (
      user?.role !== "ADMIN" &&
      user?.role !== "PRODUCTION_MANAGER" &&
      user?.id !== inspection.assignedInspectorId
    ) {
      throw ApiError.forbidden("Only the assigned Quality Inspector or an authorized administrator can submit quality decisions for this lot.");
    }

    if (inspection.status === QUALITY_STATUS.RELEASED) {
      throw ApiError.conflict("Cannot record decision for inspection lot that has already been released to finished goods.");
    }

    const {
      decision,
      quantity,
      reason,
      notes,
      defectDescription,
      correctiveAction,
      preventiveAction,
      responsiblePerson,
      targetCompletionDate,
      rootCause,
    } = data;

    if (targetCompletionDate) {
      validateFutureOrTodayDate(targetCompletionDate, "Target completion date");
    }

    const totalInspected = Number(inspection.inspectedQuantity);
    const prevPassed = Number(inspection.acceptedQuantity || 0);
    const prevRework = Number(inspection.reworkQuantity || 0);
    const prevRejected = Number(inspection.rejectedQuantity || 0);

    const alreadyDecided = prevPassed + prevRework + prevRejected;
    const availablePending = Math.max(0, totalInspected - alreadyDecided);

    if (availablePending <= 0) {
      throw ApiError.badRequest("All units in this inspection lot have already received a final quality decision.");
    }

    const decideQty = quantity !== undefined && quantity !== null && Number(quantity) > 0
      ? Number(quantity)
      : availablePending;

    const uom = inspection.workOrder?.bomRevision?.product?.unitOfMeasure || "NOS";

    validateQuantityValue({
      quantity: decideQty,
      uom,
      max: availablePending,
      fieldName: "Decision quantity",
      allowZero: false,
    });

    const decisionOfficer = data.officer || inspection.assignedInspector?.name || user?.name || "Quality Inspector";
    const decisionTime = new Date();

    return await prisma.$transaction(async (tx) => {
      // Row lock to prevent concurrent conflicting decisions
      const lockedRows = await tx.$queryRawUnsafe(
        'SELECT id, status, "acceptedQuantity", "rejectedQuantity", "reworkQuantity", "inspectedQuantity" FROM "QualityInspection" WHERE id = $1 FOR UPDATE',
        Number(id)
      );

      const locked = (lockedRows && lockedRows[0]) || inspection;

      if (locked.status === QUALITY_STATUS.RELEASED) {
        throw ApiError.conflict("Cannot record decision for inspection lot that has already been released to finished goods.");
      }

      const txPassed = Number(locked.acceptedQuantity || 0);
      const txRework = Number(locked.reworkQuantity || 0);
      const txRejected = Number(locked.rejectedQuantity || 0);
      const txPending = Math.max(0, Number(locked.inspectedQuantity) - (txPassed + txRework + txRejected));

      if (txPending <= 0) {
        throw ApiError.badRequest("All units in this inspection lot have already received a final quality decision.");
      }

      if (decideQty > txPending) {
        throw ApiError.badRequest(
          `Requested decision quantity (${decideQty}) exceeds available pending inspection quantity (${txPending}).`
        );
      }

      let updatedInspection;

      if (decision === "PASS") {
        const newPassed = txPassed + decideQty;

        updatedInspection = await tx.qualityInspection.update({
          where: { id: Number(id) },
          data: {
            acceptedQuantity: newPassed,
            status: QUALITY_STATUS.PASS,
            decisionOfficer,
            decisionNotes: notes || reason || null,
            decisionAt: decisionTime,
          },
          include: {
            assignedInspector: { select: { id: true, name: true, email: true, role: true } },
          },
        });

        await AuditService.record({
          userId: user?.id,
          action: "INSPECTION_DECISION_PASS",
          entityType: "QualityInspection",
          entityId: id,
          after: {
            decision: "PASS",
            passedQuantity: decideQty,
            totalPassed: newPassed,
            decisionOfficer,
            timestamp: decisionTime,
          },
          client: tx,
        });

      } else if (decision === "REWORK") {
        if (!reason && !defectDescription && !notes) {
          throw ApiError.badRequest("A reason or defect description is required when requesting rework.");
        }
        if (!correctiveAction?.trim()) {
          throw ApiError.badRequest("A corrective action is required when creating a rework CAPA.");
        }

        const newRework = txRework + decideQty;

        updatedInspection = await tx.qualityInspection.update({
          where: { id: Number(id) },
          data: {
            reworkQuantity: newRework,
            status: QUALITY_STATUS.HOLD,
            decisionOfficer,
            decisionNotes: reason || defectDescription || notes,
            decisionAt: decisionTime,
          },
          include: {
            assignedInspector: { select: { id: true, name: true, email: true, role: true } },
          },
        });

        // Create linked CAPA Record
        const capaCount = await tx.cAPARecord.count();
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const capaNo = `CAPA-${dateStr}-${String(capaCount + 1).padStart(4, "0")}`;

        const capa = await tx.cAPARecord.create({
          data: {
            capaNo,
            inspectionId: Number(id),
            workOrderId: inspection.workOrderId,
            defectDescription: defectDescription || reason || notes,
            rootCause: rootCause || null,
            correctiveAction: correctiveAction.trim(),
            preventiveAction: preventiveAction || null,
            responsiblePerson: responsiblePerson || user?.name || null,
            targetCompletionDate: targetCompletionDate ? new Date(targetCompletionDate) : null,
            quantityAffected: decideQty,
            status: "OPEN",
          },
        });

        await AuditService.record({
          userId: user?.id,
          action: "INSPECTION_DECISION_REWORK",
          entityType: "QualityInspection",
          entityId: id,
          after: {
            decision: "REWORK",
            reworkQuantity: decideQty,
            totalRework: newRework,
            capaId: capa.id,
            capaNo: capa.capaNo,
            decisionOfficer,
            timestamp: decisionTime,
          },
          client: tx,
        });

      } else if (decision === "REJECTED" || decision === "FAIL") {
        if (!reason && !notes) {
          throw ApiError.badRequest("A rejection reason is required when rejecting inspection output.");
        }

        const newRejected = txRejected + decideQty;

        updatedInspection = await tx.qualityInspection.update({
          where: { id: Number(id) },
          data: {
            rejectedQuantity: newRejected,
            status: QUALITY_STATUS.FAIL,
            decisionOfficer,
            decisionNotes: reason || notes,
            decisionAt: decisionTime,
          },
          include: {
            assignedInspector: { select: { id: true, name: true, email: true, role: true } },
          },
        });

        // Also reflect rejection on WorkOrder
        await tx.workOrder.update({
          where: { id: inspection.workOrderId },
          data: {
            rejectedQuantity: { increment: decideQty },
          },
        });

        await AuditService.record({
          userId: user?.id,
          action: "INSPECTION_DECISION_REJECTED",
          entityType: "QualityInspection",
          entityId: id,
          after: {
            decision: "REJECTED",
            rejectedQuantity: decideQty,
            totalRejected: newRejected,
            reason: reason || notes,
            decisionOfficer,
            timestamp: decisionTime,
          },
          client: tx,
        });
      } else {
        throw ApiError.badRequest(`Invalid decision '${decision}'. Must be PASS, REWORK, or REJECTED.`);
      }

      return updatedInspection;
    });
  }

  /**
   * List CAPA Records
   */
  static async listCAPARecords() {
    return await prisma.cAPARecord.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        inspection: {
          select: { inspectionNo: true, inspectedQuantity: true },
        },
        workOrder: {
          select: {
            workOrderNo: true,
            bomRevision: { select: { product: { select: { name: true, sku: true } } } },
          },
        },
      },
    });
  }

  /**
   * Resolve or Close a CAPA record
   */
  static async resolveCAPA(id, data, user) {
    const { resolutionNotes, verificationResult, status = "RESOLVED" } = data;
    const capa = await prisma.cAPARecord.findUnique({ where: { id: Number(id) } });
    if (!capa) throw ApiError.notFound(`CAPA record #${id} not found`);

    const updated = await prisma.cAPARecord.update({
      where: { id: Number(id) },
      data: {
        status,
        resolutionNotes,
        verificationResult: verificationResult || null,
        closureAt: status === "CLOSED" || status === "RESOLVED" ? new Date() : null,
      },
    });

    await AuditService.record({
      userId: user?.id,
      action: "CAPA_RESOLVED",
      entityType: "CAPARecord",
      entityId: id,
      after: updated,
    });

    return updated;
  }

  static async getInspectionReport() {
    const inspections = await prisma.qualityInspection.findMany({
      include: {
        assignedInspector: {
          select: { id: true, name: true, email: true, role: true },
        },
        workOrder: {
          select: {
            workOrderNo: true,
            bomRevision: { select: { product: { select: { name: true, sku: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return inspections.map((insp) => ({
      id: insp.id,
      inspectionNo: insp.inspectionNo,
      workOrderNo: insp.workOrder?.workOrderNo,
      productName: insp.workOrder?.bomRevision?.product?.name || null,
      sku: insp.workOrder?.bomRevision?.product?.sku || null,
      status: insp.status,
      inspectedQuantity: Number(insp.inspectedQuantity),
      acceptedQuantity: Number(insp.acceptedQuantity),
      rejectedQuantity: Number(insp.rejectedQuantity),
      inspector: insp.assignedInspector?.name || insp.decisionOfficer || "Unassigned",
      assignedInspector: insp.assignedInspector || null,
      inspectedAt: insp.inspectedAt,
      createdAt: insp.createdAt,
    }));
  }
}

export default QualityService;
