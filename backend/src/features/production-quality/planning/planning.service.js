import prisma from "../../../db/prisma.js";
import { AuditService } from "../../../services/audit.service.js";
import { ApiError } from "../../../utils/apiResponse.js";
import { formatPaginatedResult, getPaginationParams } from "../../../utils/pagination.js";
import { PRIORITY, WORK_ORDER_STATUS } from "../shared/productionQuality.constants.js";
import { generateWorkOrderNo, validateFutureOrTodayDate, validateQuantityValue } from "../shared/productionQuality.utils.js";
import { MasterDataService } from "../master-data/masterData.service.js";

export class PlanningService {
  /**
   * Get production dashboard statistics
   */
  static async getDashboard() {
    const [countsByStatus, total] = await Promise.all([
      prisma.workOrder.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.workOrder.count(),
    ]);

    const statusMap = {};
    for (const item of countsByStatus) {
      statusMap[item.status] = item._count._all;
    }

    const draft = statusMap[WORK_ORDER_STATUS.DRAFT] || 0;
    const planned = statusMap[WORK_ORDER_STATUS.PLANNED] || 0;
    const released = statusMap[WORK_ORDER_STATUS.RELEASED] || 0;
    const inProgress = statusMap[WORK_ORDER_STATUS.IN_PROGRESS] || 0;
    const onHold = (statusMap[WORK_ORDER_STATUS.MATERIAL_HOLD] || 0) + (statusMap[WORK_ORDER_STATUS.QC_HOLD] || 0);
    const completed = statusMap[WORK_ORDER_STATUS.COMPLETED] || 0;
    const cancelled = statusMap[WORK_ORDER_STATUS.CANCELLED] || 0;

    const recentWorkOrders = await prisma.workOrder.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        salesOrder: {
          select: { orderNumber: true, customer: { select: { name: true } } },
        },
      },
    });

    return {
      metrics: {
        totalWorkOrders: total,
        draft,
        planned,
        readyForProduction: released,
        inProgress,
        onHold,
        completed,
        cancelled,
      },
      recentWorkOrders,
    };
  }

  /**
   * Create a new Work Order
   */
  
  /**
   * Get common reference data for forms (Sales Orders, Products, BOMs, Users, Lines, Locations)
   */
  static async getReferenceData() {
    const [salesOrders, products, users] = await Promise.all([
      prisma.salesOrder.findMany({
        select: {
          id: true,
          orderNumber: true,
          status: true,
          customer: { select: { id: true, name: true } },
          items: {
            select: {
              id: true,
              productId: true,
              quantity: true,
              product: { select: { id: true, name: true, sku: true } },
            },
          },
        },
        orderBy: { id: "desc" },
        take: 100,
      }),
      prisma.product.findMany({
        select: {
          id: true,
          name: true,
          sku: true,
          unitOfMeasure: true,
          bomRevisions: {
            select: { id: true, revision: true, status: true },
          },
        },
        orderBy: { name: "asc" },
        take: 100,
      }),
      prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, name: true, email: true, role: true, department: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      salesOrders: salesOrders.map((so) => ({
        id: so.id,
        orderNumber: so.orderNumber,
        customerName: so.customer?.name || "Unknown Customer",
        status: so.status,
        items: so.items.map((i) => ({
          id: i.id,
          productId: i.productId,
          productName: i.product?.name || "",
          sku: i.product?.sku || "",
          quantity: Number(i.quantity),
        })),
      })),
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        unit: p.unitOfMeasure || "NOS",
        bomRevisions: p.bomRevisions.map((b) => ({ id: b.id, revision: b.revision })),
      })),
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
      })),
      productionLines: (await MasterDataService.getDropdownOptions("productionLine")).map((o) => o.value),
      machines: (await MasterDataService.getDropdownOptions("machine")).map((o) => o.value),
      workCenters: (await MasterDataService.getDropdownOptions("workCenter")).map((o) => o.value),
      downtimeReasons: (await MasterDataService.getDropdownOptions("downtimeReason")).map((o) => o.value),
      scrapReasons: (await MasterDataService.getDropdownOptions("scrapReason")).map((o) => o.value),
      defectTypes: (await MasterDataService.getDropdownOptions("defectType")).map((o) => o.value),
      rejectionReasons: (await MasterDataService.getDropdownOptions("rejectionReason")).map((o) => o.value),
      correctiveActions: (await MasterDataService.getDropdownOptions("correctiveAction")).map((o) => o.value),
      warehouseLocations: [
        "FG-WH-BAY-01 · Finished Goods Main",
        "FG-WH-BAY-02 · Export Buffer",
        "FG-WH-BAY-03 · Local Dispatch",
        "QC-HOLD-BAY · Quarantine Inspection Zone",
        "Raw Material Warehouse A",
        "Copper Strip Storage · Bay 2",
        "Chemical Bulk Store",
        "Shop Floor Holding Area",
      ],
      shifts: [
        { value: "SHIFT_A", label: "Shift A (06:00 - 14:00)" },
        { value: "SHIFT_B", label: "Shift B (14:00 - 22:00)" },
        { value: "SHIFT_C", label: "Shift C (Night)" },
      ],
    };
  }

  static async createWorkOrder(data, user) {
    const {
      salesOrderId,
      productId,
      plannedQuantity,
      bomRevisionId,
      plannedStart,
      plannedEnd,
      assignedLine,
      priority = PRIORITY.MEDIUM,
      notes,
      items: customItems,
    } = data;

    // 1. Verify Sales Order exists
    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id: salesOrderId },
    });
    if (!salesOrder) {
      throw ApiError.notFound(`Sales Order with ID ${salesOrderId} does not exist`);
    }

    // 2. Verify Product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { productSpecifications: { where: { status: "RELEASED" }, take: 1 } },
    });
    if (!product) {
      throw ApiError.notFound(`Product with ID ${productId} does not exist`);
    }

    // Date validation — Prevent past dates for scheduled production activities
    if (plannedStart) {
      validateFutureOrTodayDate(plannedStart, "Planned start date");
    }
    if (plannedEnd) {
      validateFutureOrTodayDate(plannedEnd, "Planned completion date");
      if (plannedStart && new Date(plannedEnd).getTime() < new Date(plannedStart).getTime()) {
        throw ApiError.badRequest("Planned completion date cannot be earlier than planned start date.");
      }
    }

    // Quantity validation — Non-negative, non-zero, whole units checked
    validateQuantityValue({
      quantity: plannedQuantity,
      uom: product.unitOfMeasure || "NOS",
      fieldName: "Planned quantity",
    });

    // 3. Resolve BOM Revision
    let targetBOMId = bomRevisionId;
    if (!targetBOMId) {
      const releasedBOM = await prisma.bOMRevision.findFirst({
        where: { productId, status: "RELEASED" },
        orderBy: { id: "desc" },
      });
      if (releasedBOM) {
        targetBOMId = releasedBOM.id;
      }
    }

    if (targetBOMId) {
      const bomExists = await prisma.bOMRevision.findUnique({
        where: { id: targetBOMId },
        include: { items: true },
      });
      if (!bomExists) {
        throw ApiError.notFound(`BOM Revision with ID ${targetBOMId} does not exist`);
      }
    }

    const workOrderNo = await generateWorkOrderNo();

    // 4. Create Work Order and WorkOrderItems in a transaction
    return await prisma.$transaction(async (tx) => {
      const workOrder = await tx.workOrder.create({
        data: {
          workOrderNo,
          salesOrderId,
          bomRevisionId: targetBOMId || null,
          createdById: user?.id || null,
          status: WORK_ORDER_STATUS.DRAFT,
          plannedQuantity,
          goodQuantity: 0,
          rejectedQuantity: 0,
          plannedStart: plannedStart ? new Date(plannedStart) : null,
          plannedEnd: plannedEnd ? new Date(plannedEnd) : null,
          assignedLine: assignedLine || null,
          priority,
          notes,
        },
      });

      // Populate component lines
      if (customItems && customItems.length > 0) {
        await tx.workOrderItem.createMany({
          data: customItems.map((item) => ({
            workOrderId: workOrder.id,
            productId: item.productId,
            plannedQuantity: item.plannedQuantity,
          })),
        });
      } else if (targetBOMId) {
        const bomItems = await tx.bOMItem.findMany({
          where: { bomRevisionId: targetBOMId },
        });

        if (bomItems.length > 0) {
          await tx.workOrderItem.createMany({
            data: bomItems.map((bi) => ({
              workOrderId: workOrder.id,
              productId: bi.componentProductId,
              plannedQuantity: Number(bi.quantity) * Number(plannedQuantity),
            })),
          });
        }
      }

      await AuditService.record({
        userId: user?.id,
        action: "WORK_ORDER_CREATED",
        entityType: "WorkOrder",
        entityId: workOrder.id,
        after: workOrder,
        client: tx,
      });

      return tx.workOrder.findUnique({
        where: { id: workOrder.id },
        include: {
          items: { include: { product: true } },
          bomRevision: { include: { operations: true } },
          salesOrder: true,
          createdBy: { select: { id: true, name: true, email: true, role: true } },
        },
      });
    });
  }

  /**
   * List Work Orders with filtering, search, and pagination
   */
  static async listWorkOrders(query) {
    const { page, limit, skip, take, sortBy, sortOrder } = getPaginationParams(query);
    const { status, salesOrderId, priority, search } = query;

    const where = {};

    if (status) {
      where.status = status;
    }
    if (salesOrderId) {
      where.salesOrderId = Number(salesOrderId);
    }
    if (priority) {
      where.priority = priority;
    }
    if (search) {
      where.OR = [
        { workOrderNo: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, workOrders] = await Promise.all([
      prisma.workOrder.count({ where }),
      prisma.workOrder.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          salesOrder: {
            select: {
              id: true,
              orderNumber: true,
              productSummary: true,
              customer: { select: { name: true } },
            },
          },
          bomRevision: {
            select: {
              id: true,
              revision: true,
              product: {
                select: { id: true, name: true, sku: true },
              },
            },
          },
          items: {
            take: 1,
            include: {
              product: {
                select: { id: true, name: true, sku: true },
              },
            },
          },
          createdBy: { select: { id: true, name: true, email: true, role: true } },
          _count: { select: { items: true, inspections: true } },
        },
      }),
    ]);

    return formatPaginatedResult({ data: workOrders, total, page, limit });
  }

  /**
   * Get single Work Order by ID with complete relations
   */
  static async getWorkOrderById(id) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: Number(id) },
      include: {
        salesOrder: {
          include: {
            customer: true,
            items: { include: { product: true } },
          },
        },
        bomRevision: {
          include: {
            items: { include: { component: true } },
            operations: { orderBy: { sequence: "asc" } },
            product: {
              include: {
                productSpecifications: { orderBy: { id: "desc" }, take: 1 },
              },
            },
          },
        },
        items: {
          include: {
            product: {
              include: {
                inventory: true,
              },
            },
          },
        },
        inspections: {
          orderBy: { createdAt: "desc" },
        },
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!workOrder) {
      throw ApiError.notFound(`Work Order with ID ${id} not found`);
    }

    return workOrder;
  }

  /**
   * Update Work Order (Allowed only when in DRAFT state)
   */
  static async updateWorkOrder(id, data, user) {
    const workOrder = await this.getWorkOrderById(id);

    if (workOrder.status !== WORK_ORDER_STATUS.DRAFT) {
      throw ApiError.badRequest(
        `Cannot edit Work Order in status '${workOrder.status}'. Only DRAFT work orders can be modified.`
      );
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id: Number(id) },
        data: {
          plannedQuantity: data.plannedQuantity ?? workOrder.plannedQuantity,
          bomRevisionId: data.bomRevisionId ?? workOrder.bomRevisionId,
          plannedStart: data.plannedStart ? new Date(data.plannedStart) : workOrder.plannedStart,
          plannedEnd: data.plannedEnd ? new Date(data.plannedEnd) : workOrder.plannedEnd,
          assignedLine: data.assignedLine !== undefined ? data.assignedLine : workOrder.assignedLine,
          priority: data.priority ?? workOrder.priority,
          notes: data.notes ?? workOrder.notes,
        },
      });

      await AuditService.record({
        userId: user?.id,
        action: "WORK_ORDER_UPDATED",
        entityType: "WorkOrder",
        entityId: id,
        before: workOrder,
        after: updated,
        client: tx,
      });

      return updated;
    });
  }

  /**
   * Submit Work Order for approval (DRAFT -> PLANNED)
   */
  static async submitWorkOrder(id, user) {
    const workOrder = await this.getWorkOrderById(id);

    if (workOrder.status !== WORK_ORDER_STATUS.DRAFT) {
      throw ApiError.badRequest(`Work Order is already in status '${workOrder.status}'. Must be DRAFT to submit.`);
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id: Number(id) },
        data: { status: WORK_ORDER_STATUS.PLANNED },
      });

      await AuditService.record({
        userId: user?.id,
        action: "WORK_ORDER_SUBMITTED",
        entityType: "WorkOrder",
        entityId: id,
        before: { status: workOrder.status },
        after: { status: updated.status },
        client: tx,
      });

      return updated;
    });
  }

  /**
   * Approve Work Order
   */
  static async approveWorkOrder(id, user) {
    const workOrder = await this.getWorkOrderById(id);

    if (workOrder.status !== WORK_ORDER_STATUS.DRAFT && workOrder.status !== WORK_ORDER_STATUS.PLANNED) {
      throw ApiError.badRequest(
        `Cannot approve Work Order in status '${workOrder.status}'. Must be in DRAFT or PLANNED status.`
      );
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id: Number(id) },
        data: { status: WORK_ORDER_STATUS.PLANNED },
      });

      await AuditService.record({
        userId: user?.id,
        action: "WORK_ORDER_APPROVED",
        entityType: "WorkOrder",
        entityId: id,
        before: { status: workOrder.status },
        after: { status: updated.status },
        client: tx,
      });

      return updated;
    });
  }

  /**
   * Reject Work Order
   */
  static async rejectWorkOrder(id, reason, user) {
    const workOrder = await this.getWorkOrderById(id);

    if (workOrder.status !== WORK_ORDER_STATUS.DRAFT && workOrder.status !== WORK_ORDER_STATUS.PLANNED) {
      throw ApiError.badRequest(`Cannot reject Work Order in status '${workOrder.status}'.`);
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id: Number(id) },
        data: {
          status: WORK_ORDER_STATUS.CANCELLED,
          notes: workOrder.notes ? `${workOrder.notes}\nRejection Reason: ${reason}` : `Rejection Reason: ${reason}`,
        },
      });

      await AuditService.record({
        userId: user?.id,
        action: "WORK_ORDER_REJECTED",
        entityType: "WorkOrder",
        entityId: id,
        before: { status: workOrder.status },
        after: { status: updated.status, reason },
        client: tx,
      });

      return updated;
    });
  }

  /**
   * Check Material Availability for Work Order components against Inventory
   */
  static async checkMaterialAvailability(workOrderId) {
    const workOrder = await this.getWorkOrderById(workOrderId);

    const items = workOrder.items || [];
    const availabilityReport = [];
    let isSufficient = true;

    for (const item of items) {
      const inventory = await prisma.inventory.findUnique({
        where: { productId: item.productId },
      });

      const required = Number(item.plannedQuantity);
      const physical = inventory ? Number(inventory.physicalQuantity) : 0;
      const reserved = inventory ? Number(inventory.reservedQuantity) : 0;
      const available = physical - reserved;
      const shortfall = required > available ? required - available : 0;

      if (shortfall > 0) {
        isSufficient = false;
      }

      availabilityReport.push({
        productId: item.productId,
        productName: item.product?.name || `Product #${item.productId}`,
        sku: item.product?.sku || "",
        requiredQuantity: required,
        physicalQuantity: physical,
        reservedQuantity: reserved,
        availableQuantity: available,
        shortfall,
        status: shortfall === 0 ? "AVAILABLE" : "SHORTAGE",
      });
    }

    return {
      workOrderId: Number(workOrderId),
      workOrderNo: workOrder.workOrderNo,
      isSufficient,
      componentsCount: availabilityReport.length,
      shortagesCount: availabilityReport.filter((r) => r.status === "SHORTAGE").length,
      materials: availabilityReport,
    };
  }

  /**
   * Release Work Order for manufacturing execution
   */
  static async releaseWorkOrder(id, user) {
    const workOrder = await this.getWorkOrderById(id);

    if (
      workOrder.status !== WORK_ORDER_STATUS.DRAFT &&
      workOrder.status !== WORK_ORDER_STATUS.PLANNED &&
      workOrder.status !== WORK_ORDER_STATUS.MATERIAL_HOLD
    ) {
      throw ApiError.badRequest(
        `Cannot release Work Order in status '${workOrder.status}'. Must be DRAFT, PLANNED or MATERIAL_HOLD.`
      );
    }

    // Material availability verification
    const availability = await this.checkMaterialAvailability(id);

    return await prisma.$transaction(async (tx) => {
      // If shortage exists, place on MATERIAL_HOLD instead of RELEASED
      if (!availability.isSufficient) {
        await tx.workOrder.update({
          where: { id: Number(id) },
          data: { status: WORK_ORDER_STATUS.MATERIAL_HOLD },
        });

        await AuditService.record({
          userId: user?.id,
          action: "WORK_ORDER_MATERIAL_HOLD",
          entityType: "WorkOrder",
          entityId: id,
          after: { status: WORK_ORDER_STATUS.MATERIAL_HOLD, shortages: availability.shortagesCount },
          client: tx,
        });

        throw ApiError.badRequest(
          `Cannot release work order: raw material shortage detected for ${availability.shortagesCount} item(s). Status moved to MATERIAL_HOLD.`,
          availability.materials.filter((m) => m.status === "SHORTAGE")
        );
      }

      const updated = await tx.workOrder.update({
        where: { id: Number(id) },
        data: { status: WORK_ORDER_STATUS.RELEASED },
      });

      await AuditService.record({
        userId: user?.id,
        action: "WORK_ORDER_RELEASED",
        entityType: "WorkOrder",
        entityId: id,
        before: { status: workOrder.status },
        after: { status: updated.status },
        client: tx,
      });

      return updated;
    });
  }

  /**
   * Place Work Order on hold
   */
  static async holdWorkOrder(id, reason, holdType = WORK_ORDER_STATUS.MATERIAL_HOLD, user) {
    const workOrder = await this.getWorkOrderById(id);

    if (
      workOrder.status !== WORK_ORDER_STATUS.RELEASED &&
      workOrder.status !== WORK_ORDER_STATUS.IN_PROGRESS &&
      workOrder.status !== WORK_ORDER_STATUS.PLANNED
    ) {
      throw ApiError.badRequest(`Cannot place Work Order in status '${workOrder.status}' on hold.`);
    }

    const targetStatus =
      holdType === WORK_ORDER_STATUS.QC_HOLD ? WORK_ORDER_STATUS.QC_HOLD : WORK_ORDER_STATUS.MATERIAL_HOLD;

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id: Number(id) },
        data: { status: targetStatus },
      });

      await AuditService.record({
        userId: user?.id,
        action: "WORK_ORDER_HELD",
        entityType: "WorkOrder",
        entityId: id,
        before: { status: workOrder.status },
        after: { status: targetStatus, reason },
        client: tx,
      });

      return updated;
    });
  }

  /**
   * Resume Work Order from hold
   */
  static async resumeWorkOrder(id, user) {
    const workOrder = await this.getWorkOrderById(id);

    if (
      workOrder.status !== WORK_ORDER_STATUS.MATERIAL_HOLD &&
      workOrder.status !== WORK_ORDER_STATUS.QC_HOLD
    ) {
      throw ApiError.badRequest(`Work Order is not on hold (current status: '${workOrder.status}')`);
    }

    // If started earlier (actualStart present or goodQuantity > 0), resume to IN_PROGRESS, else RELEASED
    const resumeStatus = workOrder.actualStart ? WORK_ORDER_STATUS.IN_PROGRESS : WORK_ORDER_STATUS.RELEASED;

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id: Number(id) },
        data: { status: resumeStatus },
      });

      await AuditService.record({
        userId: user?.id,
        action: "WORK_ORDER_RESUMED",
        entityType: "WorkOrder",
        entityId: id,
        before: { status: workOrder.status },
        after: { status: resumeStatus },
        client: tx,
      });

      return updated;
    });
  }

  /**
   * Cancel Work Order
   */
  static async cancelWorkOrder(id, reason, user) {
    const workOrder = await this.getWorkOrderById(id);

    if (workOrder.status === WORK_ORDER_STATUS.COMPLETED) {
      throw ApiError.badRequest("Completed work orders cannot be cancelled.");
    }
    if (workOrder.status === WORK_ORDER_STATUS.CANCELLED) {
      throw ApiError.badRequest("Work Order is already cancelled.");
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id: Number(id) },
        data: {
          status: WORK_ORDER_STATUS.CANCELLED,
          notes: workOrder.notes ? `${workOrder.notes}\nCancellation Reason: ${reason}` : `Cancellation: ${reason}`,
        },
      });

      await AuditService.record({
        userId: user?.id,
        action: "WORK_ORDER_CANCELLED",
        entityType: "WorkOrder",
        entityId: id,
        before: { status: workOrder.status },
        after: { status: WORK_ORDER_STATUS.CANCELLED, reason },
        client: tx,
      });

      return updated;
    });
  }

  /**
   * Get production calendar
   */
  static async getProductionCalendar({ startDate, endDate, search, status, priority }) {
    const where = {};
    if (startDate || endDate) {
      where.plannedStart = {};
      if (startDate) where.plannedStart.gte = new Date(startDate);
      if (endDate) where.plannedStart.lte = new Date(endDate);
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (priority && priority !== "ALL") {
      where.priority = priority;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { workOrderNo: { contains: q, mode: "insensitive" } },
        { assignedLine: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
        { salesOrder: { orderNumber: { contains: q, mode: "insensitive" } } },
        { salesOrder: { customer: { name: { contains: q, mode: "insensitive" } } } },
        { bomRevision: { product: { name: { contains: q, mode: "insensitive" } } } },
        { bomRevision: { product: { sku: { contains: q, mode: "insensitive" } } } },
      ];
    }

    const scheduledOrders = await prisma.workOrder.findMany({
      where,
      orderBy: [
        { plannedStart: "asc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        workOrderNo: true,
        status: true,
        priority: true,
        plannedQuantity: true,
        goodQuantity: true,
        rejectedQuantity: true,
        plannedStart: true,
        plannedEnd: true,
        actualStart: true,
        actualEnd: true,
        assignedLine: true,
        notes: true,
        createdAt: true,
        salesOrder: {
          select: {
            id: true,
            orderNumber: true,
            customer: {
              select: { id: true, name: true },
            },
          },
        },
        bomRevision: {
          select: {
            id: true,
            revision: true,
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
        items: {
          select: {
            id: true,
            plannedQuantity: true,
            issuedQuantity: true,
            consumedQuantity: true,
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
      },
    });

    return scheduledOrders;
  }
}

export default PlanningService;
