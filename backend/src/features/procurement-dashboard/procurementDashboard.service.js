import { prisma } from "../../db/prisma.js";

export async function getProcurementDashboardMetrics() {
  const now = new Date();

  // Run independent aggregations concurrently using Promise.all
  const [
    // 1. Procurement KPIs
    openPrCount,
    activeRfqCount,
    pendingPoCount,
    openPosAggregate,
    overduePoCount,

    // 2. Vendor Analytics
    totalVendors,
    activeVendors,
    vendorAverages,
    topVendors,

    // 3. Inventory Analytics
    allInventory,
    recentMovements,

    // 4. Goods Receipt Analytics
    underInspectionCount,
    grnItemsAggregate,
    expectedDeliveriesCount,

    // 5. Action Centre Raw Records
    submittedPrs,
    overdueRfqs,
    pendingApprovalPos,
    underInspectionReceipts,
    openRequisitionsList,
  ] = await Promise.all([
    // Open PRs
    prisma.purchaseRequest.count({
      where: { status: { in: ["DRAFT", "SUBMITTED", "APPROVED"] } },
    }),

    // Active RFQs
    prisma.rFQ.count({
      where: { status: { in: ["SENT", "QUOTATIONS_RECEIVED", "EVALUATED"] } },
    }),

    // Pending PO Approvals
    prisma.purchaseOrder.count({
      where: { status: "PENDING_APPROVAL" },
    }),

    // Open PO Value
    prisma.purchaseOrder.aggregate({
      _sum: { total: true },
      where: { status: { in: ["APPROVED", "SENT", "PARTIALLY_RECEIVED"] } },
    }),

    // Overdue POs
    prisma.purchaseOrder.count({
      where: {
        status: { in: ["APPROVED", "SENT", "PARTIALLY_RECEIVED"] },
        expectedDate: { lt: now },
      },
    }),

    // Vendor counts
    prisma.vendor.count(),
    prisma.vendor.count({ where: { isActive: true } }),

    // Vendor averages
    prisma.vendor.aggregate({
      _avg: {
        onTimeDeliveryPercent: true,
        qualityScore: true,
      },
      where: { isActive: true },
    }),

    // Top vendors
    prisma.vendor.findMany({
      where: { isActive: true },
      take: 5,
      orderBy: [{ rating: "desc" }, { onTimeDeliveryPercent: "desc" }],
      select: {
        id: true,
        code: true,
        name: true,
        rating: true,
        onTimeDeliveryPercent: true,
        qualityScore: true,
      },
    }),

    // All Inventory records for accurate derived available calculation
    prisma.inventory.findMany({
      include: {
        product: {
          select: { id: true, sku: true, name: true, unitOfMeasure: true },
        },
      },
    }),

    // Movements in last 30 days
    prisma.inventoryMovement.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { sku: true, name: true } },
      },
    }),

    // Receipts under inspection
    prisma.goodsReceipt.count({
      where: { status: "UNDER_INSPECTION" },
    }),

    // GRN item accepted/rejected sums
    prisma.goodsReceiptItem.aggregate({
      _sum: {
        receivedQuantity: true,
        acceptedQuantity: true,
        rejectedQuantity: true,
      },
    }),

    // Expected deliveries
    prisma.purchaseOrder.count({
      where: {
        status: { in: ["APPROVED", "SENT", "PARTIALLY_RECEIVED"] },
        expectedDate: { gte: now },
      },
    }),

    // Action Centre: Submitted PRs waiting action
    prisma.purchaseRequest.findMany({
      where: { status: "SUBMITTED" },
      take: 5,
      orderBy: { createdAt: "asc" },
      select: { id: true, requestNo: true, createdAt: true },
    }),

    // Action Centre: Overdue RFQs
    prisma.rFQ.findMany({
      where: {
        status: { in: ["DRAFT", "SENT", "QUOTATIONS_RECEIVED", "EVALUATED"] },
        dueAt: { lt: now },
      },
      take: 5,
      orderBy: { dueAt: "asc" },
      select: { id: true, rfqNo: true, dueAt: true, status: true },
    }),

    // Action Centre: Pending approval POs
    prisma.purchaseOrder.findMany({
      where: { status: "PENDING_APPROVAL" },
      take: 5,
      orderBy: { createdAt: "asc" },
      select: { id: true, poNumber: true, total: true, vendor: { select: { name: true } } },
    }),

    // Action Centre: Receipts pending inspection
    prisma.goodsReceipt.findMany({
      where: { status: "UNDER_INSPECTION" },
      take: 5,
      orderBy: { receivedAt: "asc" },
      select: { id: true, grnNumber: true, receivedAt: true, purchaseOrder: { select: { poNumber: true } } },
    }),

    // Action Centre: Open Requisitions for cross-referencing low stock items (duplicate protection)
    prisma.purchaseRequest.findMany({
      where: { status: { in: ["DRAFT", "SUBMITTED", "APPROVED"] } },
      select: {
        id: true,
        requestNo: true,
        status: true,
        items: { select: { productId: true, quantity: true } },
      },
    }),
  ]);

  // Derived inventory calculations
  let totalPhysicalStock = 0;
  let totalReservedStock = 0;
  let lowStockItemCount = 0;
  const criticalLowStockItems = [];

  allInventory.forEach((inv) => {
    const physical = Number(inv.physicalQuantity) || 0;
    const reserved = Number(inv.reservedQuantity) || 0;
    const available = physical - reserved;
    const reorder = Number(inv.reorderLevel) || 0;

    totalPhysicalStock += physical;
    totalReservedStock += reserved;

    if (available <= reorder) {
      lowStockItemCount += 1;
      if (criticalLowStockItems.length < 5) {
        criticalLowStockItems.push({
          productId: inv.productId,
          sku: inv.product.sku,
          name: inv.product.name,
          availableQuantity: available,
          reorderLevel: reorder,
        });
      }
    }
  });

  const derivedAvailableStock = totalPhysicalStock - totalReservedStock;

  // GRN calculations
  const totalReceived = Number(grnItemsAggregate._sum.receivedQuantity) || 0;
  const totalAccepted = Number(grnItemsAggregate._sum.acceptedQuantity) || 0;
  const totalRejected = Number(grnItemsAggregate._sum.rejectedQuantity) || 0;
  const inspectionTotal = totalAccepted + totalRejected;
  const rejectionRate =
    inspectionTotal > 0 ? Number(((totalRejected / inspectionTotal) * 100).toFixed(2)) : 0;

  // Movements by type
  const movementsByType = {};
  recentMovements.forEach((m) => {
    movementsByType[m.movementType] = (movementsByType[m.movementType] || 0) + 1;
  });

  return {
    procurement: {
      openRequisitions: openPrCount,
      activeRfqs: activeRfqCount,
      pendingApprovals: pendingPoCount,
      openPoValue: Number(openPosAggregate._sum.total) || 0,
      overduePurchases: overduePoCount,
    },
    vendorAnalytics: {
      totalVendors,
      activeVendors,
      inactiveVendors: totalVendors - activeVendors,
      onTimeDeliveryPercent: vendorAverages._avg.onTimeDeliveryPercent
        ? Number(Number(vendorAverages._avg.onTimeDeliveryPercent).toFixed(1))
        : null,
      qualityScore: vendorAverages._avg.qualityScore
        ? Number(Number(vendorAverages._avg.qualityScore).toFixed(1))
        : null,
      topVendors: topVendors.map((v) => ({
        id: v.id,
        code: v.code,
        name: v.name,
        rating: v.rating ? Number(v.rating) : null,
        onTimeDeliveryPercent: v.onTimeDeliveryPercent ? Number(v.onTimeDeliveryPercent) : null,
        qualityScore: v.qualityScore ? Number(v.qualityScore) : null,
      })),
    },
    inventory: {
      totalPhysicalQuantity: totalPhysicalStock,
      totalReservedQuantity: totalReservedStock,
      derivedAvailableQuantity: derivedAvailableStock,
      lowStockItemCount,
      criticalItems: criticalLowStockItems,
      movementsByType,
    },
    goodsReceipt: {
      expectedDeliveries: expectedDeliveriesCount,
      receiptsPendingInspection: underInspectionCount,
      totalReceivedQuantity: totalReceived,
      totalAcceptedQuantity: totalAccepted,
      totalRejectedQuantity: totalRejected,
      rejectionRatePercentage: rejectionRate,
    },
    actionCentre: {
      submittedRequisitions: submittedPrs.map((pr) => ({
        id: pr.id,
        title: `Purchase Request ${pr.requestNo} awaiting RFQ / action`,
        type: "PR_WAITING_ACTION",
        targetModule: "rfqs",
        targetId: pr.id,
        urgency: "HIGH",
      })),
      overdueRfqs: overdueRfqs.map((rfq) => ({
        id: rfq.id,
        title: `RFQ ${rfq.rfqNo} passed deadline (${new Date(rfq.dueAt).toLocaleDateString()})`,
        type: "OVERDUE_RFQ",
        targetModule: "rfqs",
        targetId: rfq.id,
        urgency: "CRITICAL",
      })),
      pendingApprovalOrders: pendingApprovalPos.map((po) => ({
        id: po.id,
        title: `PO ${po.poNumber} for ${po.vendor.name} (₹${Number(po.total).toLocaleString()}) pending approval`,
        type: "PENDING_PO_APPROVAL",
        targetModule: "purchase-orders",
        targetId: po.id,
        urgency: "HIGH",
      })),
      pendingInspectionReceipts: underInspectionReceipts.map((grn) => ({
        id: grn.id,
        title: `GRN ${grn.grnNumber} (PO: ${grn.purchaseOrder.poNumber}) pending quality inspection`,
        type: "PENDING_QC_INSPECTION",
        targetModule: "goods-receipts",
        targetId: grn.id,
        urgency: "MEDIUM",
      })),
      criticalLowStockWarnings: criticalLowStockItems.map((item) => {
        // Cross-reference with openRequisitionsList to detect existing open PR for this SKU
        const existingPr = openRequisitionsList.find((pr) =>
          pr.items?.some((i) => i.productId === item.productId)
        );

        return {
          id: item.productId,
          title: `Low Stock: ${item.name} (${item.availableQuantity} available vs reorder level ${item.reorderLevel})`,
          type: "LOW_STOCK_ALERT",
          targetModule: "inventory",
          targetId: item.productId,
          urgency: "CRITICAL",
          role: "PROCUREMENT_OFFICER",
          productId: item.productId,
          sku: item.sku,
          name: item.name,
          availableQuantity: item.availableQuantity,
          reorderLevel: item.reorderLevel,
          existingPr: existingPr ? { id: existingPr.id, requestNo: existingPr.requestNo, status: existingPr.status } : null,
        };
      }),
    },
  };
}
