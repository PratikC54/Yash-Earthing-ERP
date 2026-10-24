import prisma from "../../../db/prisma.js";
import { AuditService } from "../../../services/audit.service.js";
import { ApiError } from "../../../utils/apiResponse.js";
import {
  INVENTORY_MOVEMENT_TYPE,
  INVENTORY_REFERENCE_TYPE,
  QUALITY_STATUS,
  WORK_ORDER_STATUS,
} from "../shared/productionQuality.constants.js";
import {
  generateInspectionNo,
  validateFutureOrTodayDate,
  validateQuantityValue,
} from "../shared/productionQuality.utils.js";

export class ManufacturingService {
  /**
   * Manufacturing execution dashboard
   */
  static async getDashboard() {
    const [activeOrders, downtimeLogs] = await Promise.all([
      prisma.workOrder.findMany({
        where: {
          status: { not: WORK_ORDER_STATUS.CANCELLED },
          OR: [
            {
              status: {
                in: [
                  WORK_ORDER_STATUS.RELEASED,
                  WORK_ORDER_STATUS.IN_PROGRESS,
                  WORK_ORDER_STATUS.COMPLETED,
                  WORK_ORDER_STATUS.MATERIAL_HOLD,
                  WORK_ORDER_STATUS.QC_HOLD,
                ],
              },
            },
            {
              status: { in: [WORK_ORDER_STATUS.DRAFT, WORK_ORDER_STATUS.PLANNED] },
              assignedLine: { not: null },
            },
          ],
        },
        include: {
          salesOrder: {
            select: {
              orderNumber: true,
              productSummary: true,
              items: { include: { product: true } },
            },
          },
          bomRevision: {
            select: {
              revision: true,
              productId: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  unitOfMeasure: true,
                },
              },
            },
          },
          items: true,
          inspections: {
            select: {
              id: true,
              inspectionNo: true,
              inspectedQuantity: true,
              status: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.auditLog.findMany({
        where: {
          entityType: { in: ["MachineDowntime", "ProductionDelay"] },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const enrichedOrders = activeOrders.map((wo) => {
      const plannedQuantity = Number(wo.plannedQuantity || 0);
      const goodQuantity = Number(wo.goodQuantity || 0);
      const rejectedQuantity = Number(wo.rejectedQuantity || 0);
      const transferredQuantity = (wo.inspections || []).reduce(
        (sum, insp) => sum + Number(insp.inspectedQuantity || 0),
        0
      );
      const pendingQuantity = Math.max(0, plannedQuantity - goodQuantity);
      const availableForTransfer = Math.max(0, goodQuantity - transferredQuantity);
      const completionPercentage =
        plannedQuantity > 0
          ? Math.min(100, Math.round((goodQuantity / plannedQuantity) * 100))
          : 0;

      const isCancelled = wo.status === WORK_ORDER_STATUS.CANCELLED;
      const isHold = [
        WORK_ORDER_STATUS.MATERIAL_HOLD,
        WORK_ORDER_STATUS.QC_HOLD,
        "ON_HOLD",
      ].includes(wo.status);

      // Distinct check for shop-floor operation interruption (Machine Downtime or Production Delay)
      const woDowntimes = downtimeLogs.filter((d) => String(d.entityId) === String(wo.id));
      const isInterrupted = woDowntimes.length > 0;
      // Convert BigInt IDs for clean JSON serialization
      const serializedDowntimes = woDowntimes.map((d) => ({
        id: Number(d.id),
        action: d.action,
        entityType: d.entityType,
        entityId: d.entityId,
        details: d.after,
        createdAt: d.createdAt,
      }));
      const latestDowntime = serializedDowntimes[0] || null;

      // Production-completed qualification:
      // A work order qualifies as production-completed when its persisted good production quantity
      // equals or exceeds planned quantity (with plannedQuantity > 0), provided its status is not Cancelled or On Hold.
      const isCompleted =
        !isCancelled &&
        !isHold &&
        (wo.status === WORK_ORDER_STATUS.COMPLETED || (plannedQuantity > 0 && goodQuantity >= plannedQuantity));

      // Effective status calculation based on real production quantities and life-cycle state
      let effectiveStatus = wo.status;
      if (isCancelled) {
        effectiveStatus = WORK_ORDER_STATUS.CANCELLED;
      } else if (isHold) {
        effectiveStatus = "ON_HOLD";
      } else if (isCompleted) {
        effectiveStatus = WORK_ORDER_STATUS.COMPLETED;
      } else if (goodQuantity > 0 && goodQuantity < plannedQuantity) {
        effectiveStatus = WORK_ORDER_STATUS.IN_PROGRESS;
      } else if (goodQuantity === 0) {
        effectiveStatus = wo.status === WORK_ORDER_STATUS.RELEASED ? WORK_ORDER_STATUS.RELEASED : wo.status;
      }

      // Condition for Ready for Quality Inspection:
      // 1. Production is 100% complete (goodQuantity >= plannedQuantity)
      // 2. Pending quantity is zero
      // 3. Batch has not yet been transferred to Quality Inspection (transferredQuantity === 0)
      // 4. Work order is not cancelled or on hold
      const isReadyForQC =
        isCompleted &&
        pendingQuantity === 0 &&
        transferredQuantity === 0 &&
        !isHold &&
        !isCancelled;

      // Completion Date: actualEnd if present, or updatedAt, or createdAt
      const completionDate = wo.actualEnd || wo.updatedAt || wo.createdAt;

      // 4-tier sorting priority:
      // Tier 1: Ready for Quality Inspection (100% complete, untransferred)
      // Tier 2: In Production (started but not complete)
      // Tier 3: Not Started (no production completed)
      // Tier 4: Transferred to Quality (batch already transferred)
      let priorityTier = 3;
      let priorityTierLabel = "Not Started";

      if (isReadyForQC) {
        priorityTier = 1;
        priorityTierLabel = "Ready for Quality Inspection";
      } else if (transferredQuantity > 0 && availableForTransfer === 0) {
        priorityTier = 4;
        priorityTierLabel = "Transferred to Quality";
      } else if (effectiveStatus === WORK_ORDER_STATUS.IN_PROGRESS) {
        priorityTier = 2;
        priorityTierLabel = "In Production";
      } else if (goodQuantity === 0 && transferredQuantity === 0) {
        priorityTier = 3;
        priorityTierLabel = "Not Started";
      } else if (isCompleted) {
        priorityTier = 1;
        priorityTierLabel = "Completed";
      } else {
        priorityTier = 2;
        priorityTierLabel = "In Production";
      }

      // Resolve finished product name, SKU, and UOM
      const targetProduct =
        wo.bomRevision?.product ||
        wo.salesOrder?.items?.find((i) => i.productId === wo.bomRevision?.productId)?.product ||
        wo.salesOrder?.items?.[0]?.product ||
        null;

      const productName =
        targetProduct?.name ||
        wo.productName ||
        wo.salesOrder?.productSummary ||
        "Standard Manufactured Product";

      const productSku = targetProduct?.sku || "—";
      const uom = targetProduct?.unitOfMeasure || targetProduct?.unit || targetProduct?.uom || "NOS";

      return {
        ...wo,
        rawStatus: wo.status,
        status: effectiveStatus,
        effectiveStatus,
        holdType: isHold ? wo.status : null,
        isHold,
        isInterrupted,
        downtimes: serializedDowntimes,
        latestDowntime,
        isCompleted,
        plannedQuantity,
        goodQuantity,
        rejectedQuantity,
        transferredQuantity,
        pendingQuantity,
        availableForTransfer,
        completionPercentage,
        isReadyForQC,
        completionDate,
        priorityTier,
        priorityTierLabel,
        productName,
        productSku,
        uom,
      };
    });

    // Sort work orders according to required prioritization rules:
    // 1. Ready for Quality Inspection first, sorted by completion date (oldest completed batch first)
    // 2. In Production
    // 3. Not Started
    // 4. Transferred to Quality
    enrichedOrders.sort((a, b) => {
      if (a.priorityTier !== b.priorityTier) {
        return a.priorityTier - b.priorityTier;
      }

      if (a.priorityTier === 1) {
        // Oldest completed batch first (ascending)
        const dateA = new Date(a.completionDate || 0).getTime();
        const dateB = new Date(b.completionDate || 0).getTime();
        return dateA - dateB;
      }

      if (a.priorityTier === 2) {
        const pOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        const pDiff = (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
        if (pDiff !== 0) return pDiff;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }

      if (a.priorityTier === 3) {
        const pOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
      }

      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    const readyForQualityOrders = enrichedOrders.filter((o) => o.isReadyForQC);

    // Compute metrics directly from the enriched active orders list to ensure 100% synchronization
    // between dashboard counters and filtered tab counts
    const activeWorkOrdersCount = enrichedOrders.length;
    const completedCount = enrichedOrders.filter((o) => o.effectiveStatus === WORK_ORDER_STATUS.COMPLETED).length;
    const onHoldCount = enrichedOrders.filter((o) => o.isHold || o.effectiveStatus === "ON_HOLD").length;
    const inProgressCount = enrichedOrders.filter((o) => o.effectiveStatus === WORK_ORDER_STATUS.IN_PROGRESS).length;
    const readyToStartCount = enrichedOrders.filter(
      (o) => o.effectiveStatus === WORK_ORDER_STATUS.RELEASED || o.effectiveStatus === WORK_ORDER_STATUS.PLANNED
    ).length;
    const readyForQualityCount = readyForQualityOrders.length;
    const interruptedCount = enrichedOrders.filter((o) => o.isInterrupted).length;

    return {
      metrics: {
        activeWorkOrdersCount,
        inProgressCount,
        readyToStartCount,
        onHoldCount,
        completedCount,
        readyForQualityCount,
        interruptedCount,
      },
      readyForQualityOrders,
      activeWorkOrders: enrichedOrders,
    };
  }

  /**
   * Start Work Order execution
   */
  static async startWorkOrder(id, data, user) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: Number(id) },
    });

    if (!workOrder) {
      throw ApiError.notFound(`Work Order #${id} not found`);
    }

    if (workOrder.status !== WORK_ORDER_STATUS.RELEASED) {
      throw ApiError.badRequest(
        `Cannot start Work Order in status '${workOrder.status}'. Only RELEASED work orders can be started.`
      );
    }

    const actualStart = data.actualStart ? new Date(data.actualStart) : new Date();

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id: Number(id) },
        data: {
          status: WORK_ORDER_STATUS.IN_PROGRESS,
          actualStart,
        },
      });

      await AuditService.record({
        userId: user?.id,
        action: "WORK_ORDER_STARTED",
        entityType: "WorkOrder",
        entityId: id,
        after: {
          status: WORK_ORDER_STATUS.IN_PROGRESS,
          actualStart,
          shift: data.shift,
          operatorId: data.operatorId,
          workCenter: data.workCenter,
        },
        client: tx,
      });

      return updated;
    });
  }

  /**
   * Record daily / shift production entry or manual production completion
   */
  static async recordProductionEntry(data, user) {
    const rawWorkOrderId = data.workOrderId;
    const workOrderId = Number(rawWorkOrderId);
    const quantityToAdd = Number(data.quantityCompleted ?? data.quantityProduced ?? data.quantity);
    const notes = data.remarks ?? data.notes ?? "";
    const shift = data.shift || "GENERAL";
    const operatorId = data.operatorId ? Number(data.operatorId) : undefined;
    const workCenter = data.workCenter;
    const dateInput = data.completionDate || data.timestamp || new Date().toISOString();

    if (!workOrderId || isNaN(workOrderId)) {
      throw ApiError.badRequest("Valid Work Order ID is required");
    }

    if (data.completionDate) {
      validateFutureOrTodayDate(data.completionDate, "Completion date");
    }

    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        bomRevision: { select: { product: true } },
        salesOrder: { select: { items: { include: { product: true } } } },
      },
    });

    if (!workOrder) {
      throw ApiError.notFound(`Work Order #${workOrderId} not found`);
    }

    // Preserve existing business rules for Cancelled and On-Hold work orders
    if (workOrder.status === WORK_ORDER_STATUS.CANCELLED) {
      throw ApiError.badRequest("Cannot record production completion for a cancelled Work Order.");
    }

    if (
      workOrder.status === WORK_ORDER_STATUS.ON_HOLD ||
      workOrder.status === WORK_ORDER_STATUS.QC_HOLD ||
      workOrder.status === WORK_ORDER_STATUS.MATERIAL_HOLD
    ) {
      throw ApiError.badRequest(
        `Cannot record production completion for Work Order in status '${workOrder.status}'. Please resume the order first.`
      );
    }

    const uom =
      workOrder.bomRevision?.product?.unitOfMeasure ||
      workOrder.salesOrder?.items?.[0]?.product?.unitOfMeasure ||
      "NOS";

    const currentGood = Number(workOrder.goodQuantity || 0);
    const planned = Number(workOrder.plannedQuantity);
    const pendingBefore = Math.max(0, planned - currentGood);

    validateQuantityValue({
      quantity: quantityToAdd,
      uom,
      fieldName: "Quantity completed",
      allowZero: false,
    });

    const newGood = currentGood + quantityToAdd;

    if (newGood > planned && !data.allowOverproduction) {
      throw ApiError.badRequest(
        `Completed production (${newGood}) cannot exceed the planned quantity (${planned}). Maximum additional quantity allowed is ${pendingBefore} units.`
      );
    }

    // Update the production status according to the actual completed quantity:
    // * Not Started: Completed quantity is zero.
    // * In Progress: Completed quantity is greater than zero but less than the planned quantity.
    // * Completed: Completed quantity equals the planned quantity.
    let newStatus = workOrder.status;
    if (newGood >= planned) {
      newStatus = WORK_ORDER_STATUS.COMPLETED;
    } else if (newGood > 0) {
      newStatus = WORK_ORDER_STATUS.IN_PROGRESS;
    } else {
      newStatus = workOrder.status === WORK_ORDER_STATUS.IN_PROGRESS ? WORK_ORDER_STATUS.RELEASED : workOrder.status;
    }

    const recordDate = new Date(dateInput);
    const validDate = isNaN(recordDate.getTime()) ? new Date() : recordDate;
    const actualStart = workOrder.actualStart || (newGood > 0 ? validDate : null);
    const actualEnd = newGood >= planned ? validDate : workOrder.actualEnd;

    return await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.workOrder.update({
        where: { id: workOrderId },
        data: {
          goodQuantity: newGood,
          status: newStatus,
          ...(actualStart && !workOrder.actualStart ? { actualStart } : {}),
          ...(newGood >= planned ? { actualEnd } : {}),
        },
      });

      const entryLog = {
        workOrderId,
        quantityCompleted: quantityToAdd,
        quantityProduced: quantityToAdd,
        previouslyCompleted: currentGood,
        totalCompleted: newGood,
        plannedQuantity: planned,
        pendingQuantity: Math.max(0, planned - newGood),
        completionPercentage: planned > 0 ? Math.min(100, Math.round((newGood / planned) * 100)) : 0,
        status: newStatus,
        shift,
        operatorId,
        workCenter,
        completionDate: validDate.toISOString(),
        timestamp: validDate.toISOString(),
        remarks: notes,
        notes,
      };

      await AuditService.record({
        userId: user?.id,
        action: "PRODUCTION_COMPLETION_RECORDED",
        entityType: "ProductionCompletion",
        entityId: workOrderId,
        before: { goodQuantity: currentGood, status: workOrder.status },
        after: entryLog,
        client: tx,
      });

      return {
        workOrderId,
        quantityCompleted: quantityToAdd,
        quantityProduced: quantityToAdd,
        goodQuantity: newGood,
        completedQuantity: newGood,
        plannedQuantity: planned,
        pendingQuantity: Math.max(0, planned - newGood),
        completionPercentage: planned > 0 ? Math.min(100, Math.round((newGood / planned) * 100)) : 0,
        status: newStatus,
        workOrder: updatedOrder,
        entryLog,
      };
    });
  }

  /**
   * Issue materials from inventory store to the work order
   */
  static async issueMaterial(data, user) {
    const { workOrderId, productId, quantity, batchNumber, locationCode, notes } = data;

    const workOrder = await prisma.workOrder.findUnique({
      where: { id: Number(workOrderId) },
      include: { items: true },
    });

    if (!workOrder) {
      throw ApiError.notFound(`Work Order #${workOrderId} not found`);
    }

    if (
      workOrder.status !== WORK_ORDER_STATUS.RELEASED &&
      workOrder.status !== WORK_ORDER_STATUS.IN_PROGRESS
    ) {
      throw ApiError.badRequest(`Cannot issue materials to Work Order in status '${workOrder.status}'`);
    }

    // Check inventory stock balance
    const inventory = await prisma.inventory.findUnique({
      where: { productId: Number(productId) },
    });

    const physicalStock = inventory ? Number(inventory.physicalQuantity) : 0;
    if (physicalStock < Number(quantity)) {
      throw ApiError.badRequest(
        `Insufficient inventory stock for Product #${productId}. Available: ${physicalStock}, Requested: ${quantity}`
      );
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Decrement physical stock in inventory
      await tx.inventory.update({
        where: { productId: Number(productId) },
        data: {
          physicalQuantity: physicalStock - Number(quantity),
        },
      });

      // 2. Record InventoryMovement
      const movement = await tx.inventoryMovement.create({
        data: {
          productId: Number(productId),
          movementType: INVENTORY_MOVEMENT_TYPE.ISSUE_TO_WORK_ORDER,
          referenceType: INVENTORY_REFERENCE_TYPE.WORK_ORDER,
          referenceId: Number(workOrderId),
          quantity: Number(quantity),
          batchNumber: batchNumber || null,
          locationCode: locationCode || inventory?.warehouseLocation || "RM Store",
          notes: notes || `Issued to Work Order ${workOrder.workOrderNo}`,
          createdById: user?.id || null,
        },
      });

      // 3. Update WorkOrderItem issued quantity
      const existingItem = workOrder.items.find((item) => item.productId === Number(productId));
      if (existingItem) {
        await tx.workOrderItem.update({
          where: { id: existingItem.id },
          data: {
            issuedQuantity: Number(existingItem.issuedQuantity) + Number(quantity),
          },
        });
      } else {
        await tx.workOrderItem.create({
          data: {
            workOrderId: Number(workOrderId),
            productId: Number(productId),
            plannedQuantity: Number(quantity),
            issuedQuantity: Number(quantity),
            consumedQuantity: 0,
          },
        });
      }

      await AuditService.record({
        userId: user?.id,
        action: "MATERIAL_ISSUED",
        entityType: "InventoryMovement",
        entityId: movement.id,
        after: movement,
        client: tx,
      });

      return movement;
    });
  }

  /**
   * Record actual material consumption against work order
   */
  static async recordMaterialConsumption(data, user) {
    const { workOrderId, productId, quantity, notes } = data;

    const workOrderItem = await prisma.workOrderItem.findFirst({
      where: {
        workOrderId: Number(workOrderId),
        productId: Number(productId),
      },
    });

    if (!workOrderItem) {
      throw ApiError.notFound(
        `Component item for Product #${productId} not found on Work Order #${workOrderId}`
      );
    }

    const issued = Number(workOrderItem.issuedQuantity);
    const currentlyConsumed = Number(workOrderItem.consumedQuantity);
    const newConsumed = currentlyConsumed + Number(quantity);

    if (newConsumed > issued) {
      throw ApiError.badRequest(
        `Total consumption (${newConsumed}) exceeds total issued quantity (${issued}) for Product #${productId}. Please issue additional material first.`
      );
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.workOrderItem.update({
        where: { id: workOrderItem.id },
        data: {
          consumedQuantity: newConsumed,
        },
      });

      await AuditService.record({
        userId: user?.id,
        action: "MATERIAL_CONSUMED",
        entityType: "WorkOrderItem",
        entityId: workOrderItem.id,
        after: {
          consumedQuantity: newConsumed,
          previouslyConsumed: currentlyConsumed,
          added: Number(quantity),
          notes,
        },
        client: tx,
      });

      return updated;
    });
  }

  /**
   * Return unused material from work order back to inventory
   */
  static async returnMaterial(data, user) {
    const { workOrderId, productId, quantity, reason } = data;

    const workOrderItem = await prisma.workOrderItem.findFirst({
      where: {
        workOrderId: Number(workOrderId),
        productId: Number(productId),
      },
    });

    if (!workOrderItem) {
      throw ApiError.notFound(`Component Product #${productId} not linked to Work Order #${workOrderId}`);
    }

    const issued = Number(workOrderItem.issuedQuantity);
    const consumed = Number(workOrderItem.consumedQuantity);
    const unconsumed = issued - consumed;

    if (Number(quantity) > unconsumed) {
      throw ApiError.badRequest(
        `Return quantity (${quantity}) exceeds unconsumed issued balance (${unconsumed}).`
      );
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Decrement issued quantity on WorkOrderItem
      await tx.workOrderItem.update({
        where: { id: workOrderItem.id },
        data: {
          issuedQuantity: issued - Number(quantity),
        },
      });

      // 2. Increment stock in Inventory
      const inventory = await tx.inventory.findUnique({
        where: { productId: Number(productId) },
      });

      if (inventory) {
        await tx.inventory.update({
          where: { productId: Number(productId) },
          data: {
            physicalQuantity: Number(inventory.physicalQuantity) + Number(quantity),
          },
        });
      }

      // 3. Log movement
      const movement = await tx.inventoryMovement.create({
        data: {
          productId: Number(productId),
          movementType: INVENTORY_MOVEMENT_TYPE.RETURN,
          referenceType: INVENTORY_REFERENCE_TYPE.WORK_ORDER,
          referenceId: Number(workOrderId),
          quantity: Number(quantity),
          notes: `Return from Work Order: ${reason || "Unused material"}`,
          createdById: user?.id || null,
        },
      });

      await AuditService.record({
        userId: user?.id,
        action: "MATERIAL_RETURNED",
        entityType: "InventoryMovement",
        entityId: movement.id,
        after: movement,
        client: tx,
      });

      return movement;
    });
  }

  /**
   * Material Reconciliation for Work Order
   */
  static async reconcileMaterial(workOrderId) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: Number(workOrderId) },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!workOrder) {
      throw ApiError.notFound(`Work Order #${workOrderId} not found`);
    }

    const reconciliation = workOrder.items.map((item) => {
      const planned = Number(item.plannedQuantity);
      const issued = Number(item.issuedQuantity);
      const consumed = Number(item.consumedQuantity);
      const balanceWithOperator = issued - consumed;
      const variance = consumed - planned;

      return {
        productId: item.productId,
        productName: item.product.name,
        sku: item.product.sku,
        plannedQuantity: planned,
        issuedQuantity: issued,
        consumedQuantity: consumed,
        balanceWithOperator,
        variance,
        variancePercentage: planned > 0 ? ((variance / planned) * 100).toFixed(2) + "%" : "0%",
        status: balanceWithOperator === 0 ? "RECONCILED" : "PENDING_RETURN",
      };
    });

    return {
      workOrderId: Number(workOrderId),
      workOrderNo: workOrder.workOrderNo,
      items: reconciliation,
    };
  }

  /**
   * Record scrap generated during manufacturing
   */
  static async recordScrap(data, user) {
    const { workOrderId, quantity, reason, operationId, notes } = data;

    validateQuantityValue({
      quantity,
      fieldName: "Scrap quantity",
      allowZero: false,
    });

    const workOrder = await prisma.workOrder.findUnique({
      where: { id: Number(workOrderId) },
    });

    if (!workOrder) {
      throw ApiError.notFound(`Work Order #${workOrderId} not found`);
    }

    const currentScrap = Number(workOrder.rejectedQuantity);
    const newScrap = currentScrap + Number(quantity);

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id: Number(workOrderId) },
        data: {
          rejectedQuantity: newScrap,
        },
      });

      const scrapRecord = {
        workOrderId,
        quantity: Number(quantity),
        reason,
        operationId,
        notes,
        totalScrapToDate: newScrap,
      };

      await AuditService.record({
        userId: user?.id,
        action: "SCRAP_RECORDED",
        entityType: "ScrapRecord",
        entityId: workOrderId,
        after: scrapRecord,
        client: tx,
      });

      return {
        workOrderId,
        scrapQuantityAdded: Number(quantity),
        totalScrapQuantity: newScrap,
        workOrder: updated,
      };
    });
  }

  /**
   * Record machine downtime
   */
  static async recordDowntime(data, user) {
    const { workOrderId, machineOrWorkCenter, durationMinutes, reason, notes } = data;

    const workOrder = await prisma.workOrder.findUnique({
      where: { id: Number(workOrderId) },
    });

    if (!workOrder) {
      throw ApiError.notFound(`Work Order #${workOrderId} not found`);
    }

    const downtime = {
      workOrderId,
      machineOrWorkCenter,
      durationMinutes: Number(durationMinutes),
      reason,
      notes,
      timestamp: new Date().toISOString(),
    };

    await AuditService.record({
      userId: user?.id,
      action: "MACHINE_DOWNTIME_RECORDED",
      entityType: "MachineDowntime",
      entityId: workOrderId,
      after: downtime,
    });

    return downtime;
  }

  /**
   * Record production delay
   */
  static async recordDelay(data, user) {
    const { workOrderId, reason, impactMinutes, correctiveAction } = data;

    const workOrder = await prisma.workOrder.findUnique({
      where: { id: Number(workOrderId) },
    });

    if (!workOrder) {
      throw ApiError.notFound(`Work Order #${workOrderId} not found`);
    }

    const delay = {
      workOrderId,
      reason,
      impactMinutes: impactMinutes ? Number(impactMinutes) : null,
      correctiveAction,
      timestamp: new Date().toISOString(),
    };

    await AuditService.record({
      userId: user?.id,
      action: "PRODUCTION_DELAY_RECORDED",
      entityType: "ProductionDelay",
      entityId: workOrderId,
      after: delay,
    });

    return delay;
  }

  /**
   * Transfer finished or partially finished manufactured output to Quality Inspection
   */
  static async transferToQuality(workOrderId, data = {}, user) {
    const { batchNumber, notes } = data;

    // Step 1: Pre-fetch workOrder
    const baseWorkOrder = await prisma.workOrder.findUnique({
      where: { id: Number(workOrderId) },
      include: {
        inspections: true,
        bomRevision: { select: { product: { select: { id: true, name: true, sku: true } } } },
      },
    });

    if (!baseWorkOrder) {
      throw ApiError.notFound(`Work Order #${workOrderId} not found`);
    }

    // 8 & 12. Cancelled and on-hold work orders cannot be transferred
    if (baseWorkOrder.status === WORK_ORDER_STATUS.CANCELLED) {
      throw ApiError.badRequest("Cannot transfer a cancelled work order to Quality Inspection.");
    }
    if (
      baseWorkOrder.status === WORK_ORDER_STATUS.MATERIAL_HOLD ||
      baseWorkOrder.status === WORK_ORDER_STATUS.QC_HOLD ||
      baseWorkOrder.status === "ON_HOLD"
    ) {
      throw ApiError.badRequest(
        `Cannot transfer work order in '${baseWorkOrder.status}' status. Resume the order first.`
      );
    }
    if (
      baseWorkOrder.status !== WORK_ORDER_STATUS.IN_PROGRESS &&
      baseWorkOrder.status !== WORK_ORDER_STATUS.RELEASED &&
      baseWorkOrder.status !== WORK_ORDER_STATUS.COMPLETED
    ) {
      throw ApiError.badRequest(
        `Cannot transfer output to quality in status '${baseWorkOrder.status}'. Work order must be IN_PROGRESS, RELEASED, or COMPLETED.`
      );
    }

    // 3. Planned quantity must be greater than zero
    const plannedQty = Number(baseWorkOrder.plannedQuantity || 0);
    if (plannedQty <= 0) {
      throw ApiError.badRequest("Work order planned quantity must be greater than zero.");
    }

    // 4 & 5. Completed good production equals/exceeds planned quantity (100% complete)
    // Note: Rejected units do not count toward completed good quantity
    const goodQty = Number(baseWorkOrder.goodQuantity || 0);
    if (goodQty < plannedQty) {
      throw ApiError.badRequest(
        `Cannot transfer incomplete batch to Quality Inspection. Completed good output (${goodQty}) is less than planned quantity (${plannedQty}). Production must be 100% complete.`
      );
    }

    // 6. No production quantity remains pending
    const pendingQty = Math.max(0, plannedQty - goodQty);
    if (pendingQty > 0) {
      throw ApiError.badRequest(`Cannot transfer batch while ${pendingQty} units remain pending.`);
    }

    // 7. No part of the batch has already been transferred (prevent duplicate transfers)
    const alreadyTransferred = (baseWorkOrder.inspections || []).reduce(
      (sum, insp) => sum + Number(insp.inspectedQuantity || 0),
      0
    );
    if (alreadyTransferred > 0) {
      const existingInspection = baseWorkOrder.inspections[0];
      throw ApiError.badRequest(
        `This batch has already been transferred to Quality Inspection (Inspection #${existingInspection?.inspectionNo || existingInspection?.id}, quantity: ${alreadyTransferred}). Duplicate transfers are not permitted.`
      );
    }

    // 6. Partial batch transfers are rejected
    if (data.quantity !== undefined && data.quantity !== null && data.quantity !== "") {
      const requestedQty = Number(data.quantity);
      if (requestedQty <= 0) {
        throw ApiError.badRequest("Transfer quantity must be greater than zero.");
      }
      if (requestedQty < plannedQty) {
        throw ApiError.badRequest(
          `Partial batch transfers are not allowed. The entire completed batch of ${plannedQty} units must be transferred.`
        );
      }
    }

    // Full batch transfer quantity is persisted planned quantity
    const transferQty = plannedQty;

    return await prisma.$transaction(async (tx) => {
      // 1. Attempt row-level lock on real database table to serialize concurrent transfers
      try {
        const lockedRows = await tx.$queryRawUnsafe(
          'SELECT id, status, "plannedQuantity", "goodQuantity" FROM "WorkOrder" WHERE id = $1 FOR UPDATE',
          Number(workOrderId)
        );
        if (lockedRows && lockedRows.length > 0) {
          const lockedWo = lockedRows[0];
          if (
            lockedWo.status === WORK_ORDER_STATUS.CANCELLED ||
            lockedWo.status === WORK_ORDER_STATUS.MATERIAL_HOLD ||
            lockedWo.status === WORK_ORDER_STATUS.QC_HOLD ||
            lockedWo.status === "ON_HOLD"
          ) {
            throw ApiError.badRequest(`Cannot transfer work order in '${lockedWo.status}' status.`);
          }
          const lockedPlanned = Number(lockedWo.plannedQuantity || 0);
          const lockedGood = Number(lockedWo.goodQuantity || 0);
          if (lockedPlanned <= 0 || lockedGood < lockedPlanned) {
            throw ApiError.badRequest(
              `Cannot transfer incomplete batch. Completed good output (${lockedGood}) must equal planned quantity (${lockedPlanned}).`
            );
          }
        }
      } catch (lockErr) {
        if (lockErr?.statusCode) throw lockErr;
      }

      // 8 & 9. Verify no simultaneous transfer request has already created an inspection
      const currentInspections = await tx.qualityInspection.findMany({
        where: { workOrderId: Number(workOrderId) },
        select: { id: true, inspectionNo: true, inspectedQuantity: true, status: true },
      });

      if (currentInspections.length > 0) {
        throw ApiError.badRequest(
          `This batch has already been transferred to Quality Inspection (Inspection #${currentInspections[0].inspectionNo}). Duplicate transfers are prevented.`
        );
      }

      const inspectionNo = await generateInspectionNo(tx);

      // Create QualityInspection lot in transaction (status PENDING_ASSIGNMENT, inspector unassigned)
      const inspection = await tx.qualityInspection.create({
        data: {
          inspectionNo,
          workOrderId: Number(workOrderId),
          status: QUALITY_STATUS.PENDING_ASSIGNMENT,
          inspectedQuantity: transferQty,
          acceptedQuantity: 0,
          rejectedQuantity: 0,
          assignedInspectorId: null,
          decisionOfficer: null,
          evidenceNotes: [
            batchNumber && `Transfer Batch: ${batchNumber}`,
            notes || "Full batch transfer to Quality Inspection",
          ].filter(Boolean).join(". ") || null,
        },
        include: {
          assignedInspector: { select: { id: true, name: true, email: true, role: true } },
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

      // Atomically update WorkOrder status to COMPLETED and set actualEnd
      await tx.workOrder.update({
        where: { id: Number(workOrderId) },
        data: {
          status: WORK_ORDER_STATUS.COMPLETED,
          actualEnd: baseWorkOrder.actualEnd || new Date(),
        },
      });

      await AuditService.record({
        userId: user?.id,
        action: "OUTPUT_TRANSFERRED_TO_QUALITY",
        entityType: "QualityInspection",
        entityId: inspection.id,
        after: inspection,
        client: tx,
      });

      return inspection;
    });
  }

  /**
   * Planned vs Actual Production Report
   */
  static async getProductionReport(_query = {}) {
    const workOrders = await prisma.workOrder.findMany({
      include: {
        salesOrder: { select: { orderNumber: true } },
        bomRevision: { select: { revision: true, product: { select: { name: true, sku: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    const report = workOrders.map((wo) => {
      const planned = Number(wo.plannedQuantity);
      const actualGood = Number(wo.goodQuantity);
      const actualRejected = Number(wo.rejectedQuantity);
      const completionRate = planned > 0 ? ((actualGood / planned) * 100).toFixed(2) + "%" : "0%";

      return {
        workOrderId: wo.id,
        workOrderNo: wo.workOrderNo,
        status: wo.status,
        productName: wo.bomRevision?.product?.name || null,
        sku: wo.bomRevision?.product?.sku || null,
        plannedQuantity: planned,
        actualGoodQuantity: actualGood,
        rejectedQuantity: actualRejected,
        completionRate,
        plannedStart: wo.plannedStart,
        plannedEnd: wo.plannedEnd,
        actualStart: wo.actualStart,
        actualEnd: wo.actualEnd,
      };
    });

    return report;
  }
}

export default ManufacturingService;
