import prisma from "../../../db/prisma.js";
import { AuditService } from "../../../services/audit.service.js";
import { ApiError } from "../../../utils/apiResponse.js";
import {
  INVENTORY_MOVEMENT_TYPE,
  INVENTORY_REFERENCE_TYPE,
  QUALITY_STATUS,
  WORK_ORDER_STATUS,
} from "../shared/productionQuality.constants.js";
import { generateInspectionNo } from "../shared/productionQuality.utils.js";

export class ManufacturingService {
  /**
   * Manufacturing execution dashboard
   */
  static async getDashboard() {
    const [activeOrders, inProgressCount, releasedCount, onHoldCount] = await Promise.all([
      prisma.workOrder.findMany({
        where: {
          OR: [
            { status: { in: [WORK_ORDER_STATUS.RELEASED, WORK_ORDER_STATUS.IN_PROGRESS] } },
            {
              status: { in: [WORK_ORDER_STATUS.DRAFT, WORK_ORDER_STATUS.PLANNED] },
              assignedLine: { not: null },
            },
          ],
        },
        include: {
          salesOrder: { select: { orderNumber: true } },
          bomRevision: { select: { revision: true } },
          items: true,
          inspections: {
            select: {
              id: true,
              inspectedQuantity: true,
              status: true,
            },
          },
        },
        orderBy: { priority: "desc" },
      }),
      prisma.workOrder.count({ where: { status: WORK_ORDER_STATUS.IN_PROGRESS } }),
      prisma.workOrder.count({ where: { status: WORK_ORDER_STATUS.RELEASED } }),
      prisma.workOrder.count({
        where: {
          status: { in: [WORK_ORDER_STATUS.MATERIAL_HOLD, WORK_ORDER_STATUS.QC_HOLD] },
        },
      }),
    ]);

    const enrichedOrders = activeOrders.map((wo) => {
      const transferredQuantity = (wo.inspections || []).reduce(
        (sum, insp) => sum + Number(insp.inspectedQuantity || 0),
        0
      );
      const goodQuantity = Number(wo.goodQuantity || 0);
      const availableForTransfer = Math.max(0, goodQuantity - transferredQuantity);

      return {
        ...wo,
        transferredQuantity,
        availableForTransfer,
      };
    });

    return {
      metrics: {
        activeWorkOrdersCount: enrichedOrders.length,
        inProgressCount,
        readyToStartCount: releasedCount,
        onHoldCount,
      },
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
   * Record daily / shift production entry
   */
  static async recordProductionEntry(data, user) {
    const { workOrderId, quantityProduced, shift, operatorId, workCenter, timestamp, notes } = data;

    const workOrder = await prisma.workOrder.findUnique({
      where: { id: Number(workOrderId) },
    });

    if (!workOrder) {
      throw ApiError.notFound(`Work Order #${workOrderId} not found`);
    }

    if (workOrder.status !== WORK_ORDER_STATUS.IN_PROGRESS) {
      throw ApiError.badRequest(
        `Cannot record production for Work Order in status '${workOrder.status}'. Status must be IN_PROGRESS.`
      );
    }

    const currentGood = Number(workOrder.goodQuantity);
    const planned = Number(workOrder.plannedQuantity);
    const newGood = currentGood + Number(quantityProduced);

    // Overproduction protection: cannot exceed planned quantity by more than 10% without authorization
    if (newGood > planned * 1.1) {
      throw ApiError.badRequest(
        `Production quantity (${newGood}) exceeds authorized planned quantity (${planned}) beyond permissible tolerance.`
      );
    }

    return await prisma.$transaction(async (tx) => {
      await tx.workOrder.update({
        where: { id: Number(workOrderId) },
        data: {
          goodQuantity: newGood,
        },
      });

      const entryLog = {
        workOrderId,
        quantityProduced: Number(quantityProduced),
        shift,
        operatorId,
        workCenter,
        timestamp: timestamp || new Date().toISOString(),
        notes,
        totalProducedSoFar: newGood,
        remainingPlanned: Math.max(0, planned - newGood),
      };

      await AuditService.record({
        userId: user?.id,
        action: "PRODUCTION_ENTRY_RECORDED",
        entityType: "ProductionEntry",
        entityId: workOrderId,
        after: entryLog,
        client: tx,
      });

      return {
        workOrderId,
        quantityProduced: Number(quantityProduced),
        goodQuantity: newGood,
        plannedQuantity: planned,
        remainingQuantity: Math.max(0, planned - newGood),
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
  static async transferToQuality(workOrderId, data, user) {
    const { quantity, batchNumber, notes } = data;
    const transferQty = Number(quantity);

    if (!transferQty || transferQty <= 0) {
      throw ApiError.badRequest("Transfer quantity must be greater than zero.");
    }

    const inspectionNo = await generateInspectionNo();

    // Step 1: Pre-fetch or lock workOrder
    const baseWorkOrder = await prisma.workOrder.findUnique({
      where: { id: Number(workOrderId) },
      include: { inspections: true },
    });

    if (!baseWorkOrder) {
      throw ApiError.notFound(`Work Order #${workOrderId} not found`);
    }

    if (
      baseWorkOrder.status !== WORK_ORDER_STATUS.IN_PROGRESS &&
      baseWorkOrder.status !== WORK_ORDER_STATUS.RELEASED
    ) {
      throw ApiError.badRequest(
        `Cannot transfer output to quality in status '${baseWorkOrder.status}'. Work order must be IN_PROGRESS or RELEASED.`
      );
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Attempt row-level lock on real database table to serialize concurrent transfers
      let goodQty = Number(baseWorkOrder.goodQuantity || 0);
      try {
        const lockedRows = await tx.$queryRawUnsafe(
          'SELECT id, status, "goodQuantity" FROM "WorkOrder" WHERE id = $1 FOR UPDATE',
          Number(workOrderId)
        );
        if (lockedRows && lockedRows.length > 0) {
          const lockedWo = lockedRows[0];
          if (
            lockedWo.status !== WORK_ORDER_STATUS.IN_PROGRESS &&
            lockedWo.status !== WORK_ORDER_STATUS.RELEASED
          ) {
            throw ApiError.badRequest(
              `Cannot transfer output to quality in status '${lockedWo.status}'. Work order must be IN_PROGRESS or RELEASED.`
            );
          }
          goodQty = Number(lockedWo.goodQuantity || 0);
        }
      } catch (lockErr) {
        // If lockedRows throws an explicit business badRequest, rethrow it
        if (lockErr?.statusCode) throw lockErr;
      }

      // 2. Sum already transferred/inspected quantities inside the locked transaction
      const inspections = await tx.qualityInspection.findMany({
        where: { workOrderId: Number(workOrderId) },
        select: { inspectedQuantity: true },
      });

      const alreadyTransferred = inspections.reduce(
        (sum, insp) => sum + Number(insp.inspectedQuantity || 0),
        0
      );

      const availableToTransfer = Math.max(0, goodQty - alreadyTransferred);

      if (availableToTransfer <= 0) {
        throw ApiError.badRequest(
          `All completed good output has already been transferred to Quality Inspection (${alreadyTransferred}/${goodQty} units transferred). Record additional good production before transferring again.`
        );
      }

      if (transferQty > availableToTransfer) {
        throw ApiError.badRequest(
          `Total quantity transferred for inspection (${alreadyTransferred + transferQty}) cannot exceed completed good production quantity (${goodQty}). Remaining available for transfer: ${availableToTransfer}.`
        );
      }

      // 3. Create QualityInspection lot in transaction
      const inspection = await tx.qualityInspection.create({
        data: {
          inspectionNo,
          workOrderId: Number(workOrderId),
          status: QUALITY_STATUS.PENDING,
          inspectedQuantity: transferQty,
          acceptedQuantity: 0,
          rejectedQuantity: 0,
          evidenceNotes: [
            batchNumber && `Transfer Batch: ${batchNumber}`,
            notes,
          ].filter(Boolean).join(". ") || null,
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
