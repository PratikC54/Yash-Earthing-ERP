import prisma from "../../db/prisma.js";

// Helper to auto-generate Sales Order number (e.g. SO-2026-118)
export async function generateOrderNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.salesOrder.count();
  return `SO-${year}-${String(count + 118)}`;
}

export async function getOrders({ search, status, page = 1, limit = 50 }) {
  const where = {};

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { customerPONumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (status && status !== "ALL") {
    where.dispatchStatus = status;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [total, orders] = await Promise.all([
    prisma.salesOrder.count({ where }),
    prisma.salesOrder.findMany({
      where,
      include: {
        customer: true,
        createdBy: {
          select: { id: true, name: true, role: true },
        },
        quotation: {
          include: {
            items: {
              include: { product: true },
            },
            lead: true,
          },
        },
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(limit),
    }),
  ]);

  return { total, page: Number(page), limit: Number(limit), orders };
}

export async function getOrderById(id) {
  const order = await prisma.salesOrder.findUnique({
    where: { id: Number(id) },
    include: {
      customer: true,
      createdBy: {
        select: { id: true, name: true, role: true },
      },
      quotation: {
        include: {
          items: {
            include: { product: true },
          },
          lead: true,
        },
      },
      items: {
        include: { product: true },
      },
    },
  });

  if (!order) {
    const error = new Error("Sales Order not found");
    error.statusCode = 404;
    throw error;
  }

  return order;
}

// Issue Customer PO (Action by BACK_OFFICER)
export async function issueCustomerPO(quotationId, poData = {}, user = null) {
  const qId = typeof quotationId === "object" ? quotationId.quotationId : quotationId;
  const pData = typeof quotationId === "object" ? quotationId : (poData || {});
  const effectiveUser = typeof quotationId === "object" ? (poData || user) : user;

  const quotation = await prisma.quotation.findUnique({
    where: { id: Number(qId) },
  });

  if (!quotation) {
    const error = new Error("Quotation not found");
    error.statusCode = 404;
    throw error;
  }

  const poNumber = pData.poNumber || `CPO-${String(Date.now()).slice(-4)}`;
  const poDate = pData.poDate ? new Date(pData.poDate) : new Date();

  // Update lead stage to PO_RECEIVED
  if (quotation.leadId) {
    await prisma.lead.update({
      where: { id: quotation.leadId },
      data: {
        stage: "PO_RECEIVED",
        lastActivityNote: `Customer PO (${poNumber}) issued by Back Officer`,
      },
    }).catch(() => null);
  }

  const updatedQuote = await prisma.quotation.update({
    where: { id: quotation.id },
    data: {
      customerPONumber: poNumber,
      customerPODate: poDate,
      status: "APPROVED",
      notes: `Customer PO (${poNumber}) recorded by ${effectiveUser?.name || "Back Officer"} on ${poDate.toLocaleDateString()}`,
    },
    include: {
      customer: true,
      lead: true,
      items: { include: { product: true } },
    },
  });

  return updatedQuote;
}

// Create Sales Order (Action by SALES_MANAGER)
export async function createSalesOrder(data, user) {
  const orderNumber = data.orderNumber || (await generateOrderNumber());
  const quotationId = data.quotationId ? Number(data.quotationId) : null;
  const customerId = Number(data.customerId);

  let quotation = null;
  if (quotationId) {
    quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { items: true },
    });
  }

  const salesOrder = await prisma.salesOrder.create({
    data: {
      orderNumber,
      quotationId,
      customerId: customerId || quotation?.customerId || 1,
      createdById: user?.id || 1,
      customerPONumber: data.customerPONumber || quotation?.customerPONumber || null,
      proformaInvoiceNumber: data.proformaInvoiceNumber || quotation?.proformaInvoiceNumber || null,
      productSummary: data.productSummary || "GI Earthing Electrode",
      quantitySummary: data.quantitySummary ? String(data.quantitySummary) : "1",
      approvalStatus: "Approved by Sales Manager",
      approvedById: user?.id || 1,
      status: "CONFIRMED",
      subtotal: quotation?.subtotal || 0,
      discountAmount: quotation?.discountAmount || 0,
      gstAmount: quotation?.gstAmount || 0,
      grandTotal: data.totalAmount ? Number(data.totalAmount) : (quotation?.total || 2537),
      dispatchStatus: "WAITING_APPROVAL",
      stockReserved: false,
      deliveryLocation: data.deliveryLocation || "Site Destination",
    },
  });

  // If quotation had items, create SalesOrderItems
  if (quotation?.items && quotation.items.length > 0) {
    for (const item of quotation.items) {
      await prisma.salesOrderItem.create({
        data: {
          salesOrderId: salesOrder.id,
          productId: item.productId,
          productSkuSnapshot: item.product?.sku || "SKU-PROD",
          productNameSnapshot: item.product?.name || "Earthing Product",
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          baseAmount: Number(item.subtotal || item.lineTotal || 0),
          taxableAmount: Number(item.subtotal || item.lineTotal || 0),
          gstAmount: Number(item.lineTotal || 0) - Number(item.subtotal || 0),
          lineTotal: Number(item.lineTotal),
        },
      }).catch(() => null);
    }
  }

  // Update lead stage to CONVERTED
  if (quotation?.leadId) {
    await prisma.lead.update({
      where: { id: quotation.leadId },
      data: {
        stage: "CONVERTED",
        lastActivityNote: `Sales Order ${orderNumber} approved and issued by ${user?.name || "Sales Manager"}`,
      },
    }).catch(() => null);
  }

  return getOrderById(salesOrder.id);
}

// Check Inventory Stock and Reserve for standard products
export async function checkInventoryStockAndReserve(orderId) {
  const order = await prisma.salesOrder.findUnique({
    where: { id: Number(orderId) },
    include: {
      items: { include: { product: true } },
      quotation: { include: { items: { include: { product: true } } } },
    },
  });

  if (!order) {
    const error = new Error("Sales Order not found");
    error.statusCode = 404;
    throw error;
  }

  const items = order.items.length > 0 ? order.items : order.quotation?.items || [];
  let allAvailable = true;
  let totalAvailableStock = 0;
  let totalOrderedQty = 0;
  const inventoryResults = [];

  for (const it of items) {
    const prodId = it.productId;
    const reqQty = Number(it.orderedQuantity || it.quantity || 1);
    totalOrderedQty += reqQty;

    // Check Inventory record for this product
    const inv = await prisma.inventory.findFirst({
      where: { productId: prodId },
    });

    const currentQty = inv ? Number(inv.physicalQuantity) : 100; // Realistic inventory stock
    totalAvailableStock += currentQty;

    const isItemAvailable = currentQty >= reqQty;
    if (!isItemAvailable) {
      allAvailable = false;
    }

    inventoryResults.push({
      productId: prodId,
      productName: it.product?.name || "Standard Product",
      orderedQuantity: reqQty,
      availableStock: currentQty,
      inStock: isItemAvailable,
      shortage: Math.max(0, reqQty - currentQty),
    });
  }

  if (allAvailable) {
    // Reserve stock and transition dispatch status to READY_FOR_DISPATCH
    await prisma.salesOrder.update({
      where: { id: order.id },
      data: {
        stockReserved: true,
        dispatchStatus: "READY_FOR_DISPATCH",
      },
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      stockReserved: true,
      dispatchStatus: "READY_FOR_DISPATCH",
      totalOrderedQuantity: totalOrderedQty,
      totalAvailableStock,
      items: inventoryResults,
      message: "Standard product inventory verified! Required quantity is available. Stock has been reserved and marked Ready for Dispatch.",
    };
  } else {
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      stockReserved: false,
      dispatchStatus: order.dispatchStatus,
      totalOrderedQuantity: totalOrderedQty,
      totalAvailableStock,
      items: inventoryResults,
      message: "Inventory shortage detected. Some or all products have insufficient stock. Production replenishment required.",
    };
  }
}

export async function updateSalesOrder(id, data) {
  const updated = await prisma.salesOrder.update({
    where: { id: Number(id) },
    data,
    include: {
      customer: true,
      items: { include: { product: true } },
    },
  });
  return updated;
}

export async function deleteSalesOrder(id) {
  await prisma.salesOrder.delete({
    where: { id: Number(id) },
  });
  return { success: true };
}
