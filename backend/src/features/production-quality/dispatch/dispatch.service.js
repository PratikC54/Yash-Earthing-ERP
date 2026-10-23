import prisma from "../../../db/prisma.js";
import { AuditService } from "../../../services/audit.service.js";
import { ApiError } from "../../../utils/apiResponse.js";
import { QUALITY_STATUS } from "../shared/productionQuality.constants.js";

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

    const readyItems = inspections
      .map((ins) => {
        const approved = Number(ins.acceptedQuantity);
        const previouslyDispatched = Number(ins.dispatchedQuantity || 0);
        const remaining = Math.max(0, approved - previouslyDispatched);

        const wo = ins.workOrder;
        const so = wo?.salesOrder;
        const prod = wo?.bomRevision?.product;

        let status = "READY_FOR_DISPATCH";
        if (previouslyDispatched > 0 && remaining > 0) {
          status = "PARTIALLY_DISPATCHED";
        } else if (remaining === 0) {
          status = "FULLY_DISPATCHED";
        }

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
          batchNumber: null,
          approvedQuantity: approved,
          acceptedQuantity: approved,
          previouslyDispatchedQuantity: previouslyDispatched,
          dispatchedQuantity: previouslyDispatched,
          remainingQuantity: remaining,
          availableToDispatch: remaining,
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

    const approvedQty = Number(inspection.acceptedQuantity);
    const dispatchedSoFar = Number(inspection.dispatchedQuantity || 0);
    const availableToDispatch = Math.max(0, approvedQty - dispatchedSoFar);
    const dispatchQty = Number(quantity);

    if (dispatchQty <= 0) {
      throw ApiError.badRequest("Dispatch quantity must be greater than zero");
    }

    if (dispatchQty > availableToDispatch) {
      throw ApiError.badRequest(
        `Requested dispatch quantity (${dispatchQty}) exceeds available quality-approved quantity (${availableToDispatch}).`
      );
    }

    const dispatchNo = await generateDispatchNo();
    const workOrderId = inspection.workOrderId;
    const salesOrderId = inspection.workOrder?.salesOrderId || null;
    const finalStatus =
      dispatchedSoFar + dispatchQty >= approvedQty
        ? "DISPATCHED"
        : "PARTIALLY_DISPATCHED";

    return await prisma.$transaction(async (tx) => {
      // 1. Create Dispatch Record
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

      // 2. Increment dispatchedQuantity on QualityInspection
      await tx.qualityInspection.update({
        where: { id: Number(inspectionId) },
        data: {
          dispatchedQuantity: dispatchedSoFar + dispatchQty,
        },
      });

      // 3. Update SalesOrder if linked
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

      // 4. Record Inventory Outward Movement
      const productId = inspection.workOrder?.bomRevision?.productId;
      if (productId) {
        await tx.inventoryMovement.create({
          data: {
            productId,
            movementType: "STOCK_OUT",
            referenceType: "DISPATCH",
            referenceId: record.id,
            salesOrderId: salesOrderId || null,
            quantity: dispatchQty,
            batchNumber: null,
            locationCode: destinationAddress,
            notes: `Dispatch order ${dispatchNo} via ${transporterName} (${vehicleNumber})`,
            createdById: user?.id || null,
          },
        });
      }

      // 5. Audit Log
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
