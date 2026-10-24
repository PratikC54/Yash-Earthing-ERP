import { prisma } from "../../db/prisma.js";

const VALID_PO_TRANSITIONS = {
  DRAFT: ["PENDING_APPROVAL", "CANCELLED"],
  PENDING_APPROVAL: ["APPROVED", "DRAFT", "CANCELLED"],
  APPROVED: ["SENT", "CANCELLED"],
  SENT: ["PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"],
  PARTIALLY_RECEIVED: ["RECEIVED", "CLOSED"],
  RECEIVED: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
};

export async function listPurchaseOrders({
  page = 1,
  limit = 20,
  status,
  vendorId,
  search,
  sortBy = "createdAt",
  sortOrder = "desc",
}) {
  const skip = (page - 1) * limit;
  const where = {};

  if (status && status !== "ALL" && status.trim() !== "") {
    where.status = status.toUpperCase();
  }

  if (vendorId) {
    where.vendorId = vendorId;
  }

  if (search) {
    where.OR = [
      { poNumber: { contains: search, mode: "insensitive" } },
      { vendor: { name: { contains: search, mode: "insensitive" } } },
      { notes: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, orders] = await Promise.all([
    prisma.purchaseOrder.count({ where }),
    prisma.purchaseOrder.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        vendor: {
          select: { id: true, code: true, name: true, phone: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, sku: true, name: true, unitOfMeasure: true },
            },
          },
        },
        _count: {
          select: { receipts: true, bills: true },
        },
      },
    }),
  ]);

  return {
    orders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

export async function getPurchaseOrderById(id) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      vendor: {
        select: {
          id: true,
          code: true,
          name: true,
          email: true,
          phone: true,
          gstin: true,
          paymentTerms: true,
        },
      },
      rfq: {
        select: { id: true, rfqNo: true, status: true },
      },
      items: {
        include: {
          product: {
            select: { id: true, sku: true, name: true, unitOfMeasure: true },
          },
        },
      },
      receipts: {
        select: {
          id: true,
          grnNumber: true,
          status: true,
          receivedAt: true,
        },
      },
    },
  });

  if (!po) {
    const error = new Error(`Purchase Order with ID ${id} not found`);
    error.statusCode = 404;
    throw error;
  }

  return po;
}

export async function createPurchaseOrder({ vendorId, rfqId, expectedDate, notes, items }) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
  });

  if (!vendor) {
    const error = new Error(`Vendor with ID ${vendorId} not found`);
    error.statusCode = 404;
    throw error;
  }

  if (!vendor.isActive) {
    const error = new Error(`Cannot issue purchase order to inactive vendor ${vendor.name} (${vendor.code})`);
    error.statusCode = 400;
    throw error;
  }

  // Calculate subtotal, taxAmount, and total on server with 2-decimal rounding
  let subtotal = 0;
  let taxAmount = 0;

  items.forEach((item) => {
    const lineSubtotal = Number((item.quantity * item.unitPrice).toFixed(2));
    const lineTax = Number((lineSubtotal * ((item.taxPercent || 0) / 100)).toFixed(2));
    subtotal += lineSubtotal;
    taxAmount += lineTax;
  });

  subtotal = Number(subtotal.toFixed(2));
  taxAmount = Number(taxAmount.toFixed(2));
  const total = Number((subtotal + taxAmount).toFixed(2));
  const poNumber = `PO-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

  const createdPo = await prisma.purchaseOrder.create({
    data: {
      poNumber,
      vendorId,
      rfqId: rfqId || null,
      status: "DRAFT",
      expectedDate: expectedDate ? new Date(expectedDate) : null,
      subtotal,
      taxAmount,
      total,
      notes: notes || null,
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxPercent: item.taxPercent || 0,
        })),
      },
    },
    include: {
      vendor: {
        select: { id: true, code: true, name: true },
      },
      items: {
        include: {
          product: {
            select: { id: true, sku: true, name: true, unitOfMeasure: true },
          },
        },
      },
    },
  });

  return createdPo;
}

export async function createPurchaseOrderFromRfq({ rfqId, vendorId, expectedDate, notes }) {
  const rfq = await prisma.rFQ.findUnique({
    where: { id: rfqId },
    include: {
      responses: {
        where: { vendorId },
        include: {
          items: true,
          vendor: true,
        },
      },
    },
  });

  if (!rfq) {
    const error = new Error(`RFQ with ID ${rfqId} not found`);
    error.statusCode = 404;
    throw error;
  }

  const response = rfq.responses[0];
  if (!response) {
    const error = new Error(`No quotation found for Vendor ${vendorId} under RFQ ${rfq.rfqNo}`);
    error.statusCode = 404;
    throw error;
  }

  const items = response.items.map((it) => ({
    productId: it.productId,
    quantity: Number(it.quantity),
    unitPrice: Number(it.unitPrice),
    taxPercent: Number(it.taxPercent),
  }));

  return createPurchaseOrder({
    vendorId,
    rfqId,
    expectedDate,
    notes: notes || `Generated from RFQ ${rfq.rfqNo}`,
    items,
  });
}

export async function updatePurchaseOrderStatus(id, { status, notes }) {
  const po = await getPurchaseOrderById(id);

  if (status && status !== po.status) {
    const allowed = VALID_PO_TRANSITIONS[po.status] || [];
    if (!allowed.includes(status)) {
      const error = new Error(
        `Invalid Purchase Order status transition from ${po.status} to ${status}. Allowed: ${allowed.join(", ") || "None"}`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      status,
      notes: notes !== undefined ? notes : po.notes,
    },
    include: {
      vendor: {
        select: { id: true, code: true, name: true },
      },
      items: true,
    },
  });

  return updated;
}
