import prisma from "../../../db/prisma.js";
import { AuditService } from "../../../services/audit.service.js";
import { ApiError } from "../../../utils/apiResponse.js";
import { QUALITY_STATUS } from "../shared/productionQuality.constants.js";
import { QualityService } from "../quality/quality.service.js";

async function generateDispatchNo() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const count = await prisma.dispatchRecord.count({
    where: {
      dispatchNo: { startsWith: `DSP-${dateStr}` },
    },
  });
  return `DSP-${dateStr}-${String(count + 1).padStart(4, "0")}`;
}

export class DispatchService {
  /**
   * Get Dispatch Dashboard Metrics & Recent Dispatches
   */
  static async getDashboard() {
     const [passedInspections, totalDispatches] = await Promise.all([
       prisma.qualityInspection.findMany({
         where: {
           status: { in: [QUALITY_STATUS.PASS, QUALITY_STATUS.RELEASED] },
           acceptedQuantity: { gt: 0 },
         },
       }),
       prisma.dispatchRecord.count(),
     ]);

    let readyForDispatchCount = 0;
    let partiallyDispatchedCount = 0;
    let fullyDispatchedCount = 0;
    let totalQuantityReady = 0;
    let totalQuantityDispatched = 0;

    for (const ins of passedInspections) {
      const accepted = Number(ins.acceptedQuantity);
      const dispatched = Number(ins.dispatchedQuantity || 0);
      const remaining = Math.max(0, accepted - dispatched);

      totalQuantityDispatched += dispatched;
      totalQuantityReady += remaining;

      if (dispatched === 0) {
        readyForDispatchCount++;
      } else if (dispatched < accepted) {
        partiallyDispatchedCount++;
      } else {
        fullyDispatchedCount++;
      }
    }

    const recentDispatches = await prisma.dispatchRecord.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        workOrder: {
          select: {
            workOrderNo: true,
            bomRevision: { select: { product: { select: { name: true, sku: true } } } },
          },
        },
        inspection: {
          select: { inspectionNo: true },
        },
        salesOrder: {
          select: { orderNumber: true, customer: { select: { name: true } } },
        },
      },
    });

    return {
      readyForDispatchCount,
      partiallyDispatchedCount,
      fullyDispatchedCount,
      totalQuantityReady,
      totalQuantityDispatched,
      totalDispatches,
      metrics: {
        readyForDispatchCount,
        partiallyDispatchedCount,
        fullyDispatchedCount,
        totalQuantityReady,
        totalQuantityDispatched,
        totalDispatches,
      },
      recentDispatches,
    };
  }

  /**
   * Get Orders & Lots Ready for Dispatch (Quality Approved)
   */
  static async getReadyForDispatch() {
    const inspections = await prisma.qualityInspection.findMany({
      where: {
        status: { in: [QUALITY_STATUS.PASS, QUALITY_STATUS.RELEASED] },
        acceptedQuantity: { gt: 0 },
      },
      orderBy: { id: "desc" },
      include: {
        workOrder: {
          include: {
            salesOrder: {
              include: { customer: true },
            },
            bomRevision: {
              include: { product: true },
            },
          },
        },
      },
    });

    // Query finished goods inventory for associated products
    const productIds = [
      ...new Set(
        inspections
          .map((ins) => ins.workOrder?.bomRevision?.productId)
          .filter(Boolean)
      ),
    ];

    const inventoryRecords = productIds.length > 0
      ? await prisma.inventory.findMany({
          where: { productId: { in: productIds } },
        })
      : [];

    const inventoryMap = new Map(
      inventoryRecords.map((inv) => [
        inv.productId,
        {
          physicalQuantity: Number(inv.physicalQuantity),
          reservedQuantity: Number(inv.reservedQuantity),
          availableQuantity: Math.max(0, Number(inv.physicalQuantity) - Number(inv.reservedQuantity)),
          warehouseLocation: inv.warehouseLocation,
        },
      ])
    );

    const readyItems = inspections
      .map((ins) => {
        const approved = Number(ins.acceptedQuantity);
        const previouslyDispatched = Number(ins.dispatchedQuantity || 0);
        const remaining = Math.max(0, approved - previouslyDispatched);

        const wo = ins.workOrder;
        const so = wo?.salesOrder;
        const prod = wo?.bomRevision?.product;
        const invInfo = prod?.id ? inventoryMap.get(prod.id) : null;

        let status = "READY_FOR_DISPATCH";
        if (previouslyDispatched > 0 && remaining > 0) {
          status = "PARTIALLY_DISPATCHED";
        } else if (remaining === 0) {
          status = "FULLY_DISPATCHED";
        }

        const batchNumber = wo?.workOrderNo ? `BTH-${wo.workOrderNo}` : `BTH-${ins.inspectionNo}`;

        return {
          id: ins.id,
          inspectionId: ins.id,
          inspectionNo: ins.inspectionNo,
          workOrderId: wo?.id,
          workOrderNo: wo?.workOrderNo || "—",
          salesOrderId: so?.id || null,
          sourceOrderNo: so?.orderNumber || null,
          customerName: so?.customer?.name || null,
          productName: prod?.name || null,
          sku: prod?.sku || null,
          batchNumber,
          approvedQuantity: approved,
          acceptedQuantity: approved,
          previouslyDispatchedQuantity: previouslyDispatched,
          dispatchedQuantity: previouslyDispatched,
          remainingQuantity: remaining,
          availableToDispatch: remaining,
          inventoryPhysicalQuantity: invInfo?.physicalQuantity ?? 0,
          inventoryAvailableQuantity: invInfo?.availableQuantity ?? 0,
          warehouseLocation: invInfo?.warehouseLocation ?? "Finished Goods Main",
          approvalDate: ins.decisionAt || ins.inspectedAt || ins.createdAt,
          dispatchStatus: status,
        };
      })
      .filter((item) => item.remainingQuantity > 0);

    return readyItems;
  }

  /**
   * Create a Dispatch Record
   * Enforces that quantity <= remaining quality-approved quantity
   */
  static async createDispatch(data, user) {
    const {
      inspectionId,
      quantity,
      destinationAddress,
      transporterName,
      vehicleNumber,
      lrNumber,
      deliveryChallanNo,
      deliveryNotes,
      dispatchDate,
      batchNumber,
    } = data;

    const inspection = await prisma.qualityInspection.findUnique({
      where: { id: Number(inspectionId) },
      include: {
        workOrder: {
          include: {
            salesOrder: true,
            bomRevision: { include: { product: true } },
          },
        },
      },
    });

    if (!inspection) {
      throw ApiError.notFound(`Quality Inspection #${inspectionId} not found`);
    }

    if (
      inspection.status !== QUALITY_STATUS.PASS &&
      inspection.status !== QUALITY_STATUS.RELEASED
    ) {
      throw ApiError.badRequest(
        `Cannot dispatch output from inspection in status '${inspection.status}'. Batch must be quality-approved (PASS).`
      );
    }

    const dispatchQty = Number(quantity);
    if (!dispatchQty || dispatchQty <= 0) {
      throw ApiError.badRequest("Dispatch quantity must be greater than zero");
    }

    const workOrder = inspection.workOrder;
    const workOrderId = inspection.workOrderId;
    const salesOrderId = workOrder?.salesOrderId || null;

    return await prisma.$transaction(async (tx) => {
      // 1. Concurrency Protection & Row Lock on QualityInspection
      let lockedInspection = inspection;
      try {
        const lockedInspections = await tx.$queryRawUnsafe(
          'SELECT id, "workOrderId", status, "acceptedQuantity", "dispatchedQuantity" FROM "QualityInspection" WHERE id = $1 FOR UPDATE',
          Number(inspectionId)
        );
        if (lockedInspections && lockedInspections[0]) {
          lockedInspection = lockedInspections[0];
        }
      } catch {
        lockedInspection = await tx.qualityInspection.findUnique({ where: { id: Number(inspectionId) } });
      }

      if (
        lockedInspection.status !== QUALITY_STATUS.PASS &&
        lockedInspection.status !== QUALITY_STATUS.RELEASED
      ) {
        throw ApiError.badRequest(
          `Cannot dispatch output from inspection in status '${lockedInspection.status}'. Batch must be quality-approved (PASS).`
        );
      }

      const approvedQty = Number(lockedInspection.acceptedQuantity);
      const dispatchedSoFar = Number(lockedInspection.dispatchedQuantity || 0);
      const availableToDispatch = Math.max(0, approvedQty - dispatchedSoFar);

      if (dispatchQty > availableToDispatch) {
        throw ApiError.badRequest(
          `Requested dispatch quantity (${dispatchQty}) exceeds available quality-approved quantity (${availableToDispatch}).`
        );
      }

      // 2. Resolve Finished Product ID from WorkOrder
      const productId = await QualityService.resolveWorkOrderProductId(workOrder, tx);
      if (!productId) {
        throw ApiError.badRequest("Could not determine finished product ID for work order dispatch.");
      }

      // 3. Concurrency Protection & Row Lock on Inventory
      let inv;
      try {
        const lockedInventories = await tx.$queryRawUnsafe(
          'SELECT id, "productId", "physicalQuantity", "reservedQuantity" FROM "Inventory" WHERE "productId" = $1 FOR UPDATE',
          Number(productId)
        );
        if (lockedInventories && lockedInventories[0]) {
          inv = lockedInventories[0];
        }
      } catch {
        inv = await tx.inventory.findUnique({ where: { productId } });
      }

      if (!inv) {
        inv = await tx.inventory.findUnique({ where: { productId } });
      }

      const physicalStock = inv ? Number(inv.physicalQuantity) : 0;
      const reservedStock = inv ? Number(inv.reservedQuantity || 0) : 0;
      const availableStock = Math.max(0, physicalStock - reservedStock);

      if (dispatchQty > availableStock) {
        const prodName = workOrder?.bomRevision?.product?.name || "product";
        throw ApiError.badRequest(
          `Insufficient Finished Goods Inventory for ${prodName}. Available in inventory: ${availableStock} units, requested dispatch: ${dispatchQty} units.`
        );
      }

      // 4. Atomic Inventory Stock Deduction
      await tx.inventory.update({
        where: { productId },
        data: {
          physicalQuantity: { decrement: dispatchQty },
        },
      });

      // 5. Generate unique dispatch number & record
      const dispatchNo = await generateDispatchNo();
      const finalStatus =
        dispatchedSoFar + dispatchQty >= approvedQty
          ? "DISPATCHED"
          : "PARTIALLY_DISPATCHED";

      const record = await tx.dispatchRecord.create({
        data: {
          dispatchNo,
          workOrderId,
          inspectionId: Number(inspectionId),
          salesOrderId,
          quantity: dispatchQty,
          dispatchDate: dispatchDate ? new Date(dispatchDate) : new Date(),
          destinationAddress,
          transporterName,
          vehicleNumber,
          lrNumber: lrNumber || null,
          deliveryChallanNo: deliveryChallanNo || null,
          deliveryNotes: deliveryNotes || null,
          responsibleUser: user?.name || null,
          status: finalStatus,
        },
      });

      // 6. Update QualityInspection dispatchedQuantity
      await tx.qualityInspection.update({
        where: { id: Number(inspectionId) },
        data: {
          dispatchedQuantity: dispatchedSoFar + dispatchQty,
        },
      });

      // 7. Update SalesOrder if linked
      if (salesOrderId) {
        await tx.salesOrder.update({
          where: { id: salesOrderId },
          data: {
            dispatchStatus: "DISPATCHED",
            vehicleNumber,
            lrNumber: lrNumber || null,
            transporterName,
            deliveryChallanNumber: deliveryChallanNo || null,
            deliveryLocation: destinationAddress,
            dispatchedAt: new Date(),
          },
        });
      }

      // 8. Record Outward Inventory Movement with Batch Traceability
      const dispatchBatch = batchNumber || (workOrder?.workOrderNo ? `BTH-${workOrder.workOrderNo}` : `BTH-${inspection.inspectionNo}`);
      await tx.inventoryMovement.create({
        data: {
          productId,
          movementType: "STOCK_OUT",
          referenceType: "DISPATCH",
          referenceId: record.id,
          salesOrderId: salesOrderId || null,
          quantity: dispatchQty,
          batchNumber: dispatchBatch,
          locationCode: destinationAddress,
          notes: `[DISPATCH:${record.id}] Dispatch ${dispatchNo} for Work Order ${workOrder?.workOrderNo || workOrderId}. Transporter: ${transporterName || 'N/A'} (${vehicleNumber || 'N/A'}). DC: ${deliveryChallanNo || 'N/A'}. LR: ${lrNumber || 'N/A'}`.trim(),
          createdById: user?.id || null,
        },
      });

      // 9. Audit Log
      await AuditService.record({
        userId: user?.id,
        action: "DISPATCH_CREATED",
        entityType: "DispatchRecord",
        entityId: record.id,
        after: record,
        client: tx,
      });

      return { ...record, quantity: Number(record.quantity) };
    });
  }

  /**
   * Get Dispatch History
   */
  static async getHistory() {
    return await prisma.dispatchRecord.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        workOrder: {
          select: {
            workOrderNo: true,
            bomRevision: { select: { product: { select: { name: true, sku: true } } } },
          },
        },
        inspection: {
          select: { inspectionNo: true, acceptedQuantity: true },
        },
        salesOrder: {
          select: { orderNumber: true, customer: { select: { name: true } } },
        },
      },
    });
  }
}
