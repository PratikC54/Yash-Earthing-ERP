import { prisma } from "../../db/prisma.js";

// Purchase Request Valid Transitions
const VALID_PR_TRANSITIONS = {
  DRAFT: ["SUBMITTED", "REJECTED"],
  SUBMITTED: ["APPROVED", "REJECTED", "DRAFT"],
  APPROVED: ["CONVERTED", "REJECTED"],
  REJECTED: ["DRAFT"],
  CONVERTED: [],
};

// RFQ Valid Transitions
const VALID_RFQ_TRANSITIONS = {
  DRAFT: ["SENT", "CANCELLED"],
  SENT: ["QUOTATIONS_RECEIVED", "CANCELLED"],
  QUOTATIONS_RECEIVED: ["EVALUATED", "AWARDED", "CANCELLED"],
  EVALUATED: ["AWARDED", "CANCELLED"],
  AWARDED: [],
  CANCELLED: [],
};

export async function listPurchaseRequests({
  page = 1,
  limit = 20,
  status,
  search,
  sortBy = "createdAt",
  sortOrder = "desc",
}) {
  const skip = (page - 1) * limit;
  const where = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { requestNo: { contains: search, mode: "insensitive" } },
      { notes: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, requests] = await Promise.all([
    prisma.purchaseRequest.count({ where }),
    prisma.purchaseRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, sku: true, name: true, unitOfMeasure: true },
            },
          },
        },
        _count: {
          select: { rfqs: true },
        },
      },
    }),
  ]);

  return {
    requests,
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

export async function getPurchaseRequestById(id) {
  const pr = await prisma.purchaseRequest.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, sku: true, name: true, unitOfMeasure: true },
          },
        },
      },
      rfqs: {
        select: {
          id: true,
          rfqNo: true,
          status: true,
          dueAt: true,
          createdAt: true,
        },
      },
      salesOrder: {
        select: { id: true, orderNumber: true, status: true },
      },
    },
  });

  if (!pr) {
    const error = new Error(`Purchase Request with ID ${id} not found`);
    error.statusCode = 404;
    throw error;
  }

  return pr;
}

export async function createPurchaseRequest({ salesOrderId, requiredBy, notes, items }) {
  const requestNo = `PR-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

  const createdPr = await prisma.purchaseRequest.create({
    data: {
      requestNo,
      salesOrderId: salesOrderId || null,
      requiredBy: requiredBy ? new Date(requiredBy) : null,
      notes: notes || null,
      status: "DRAFT",
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          notes: item.notes || null,
        })),
      },
    },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, sku: true, name: true, unitOfMeasure: true },
          },
        },
      },
    },
  });

  return createdPr;
}

export async function updatePurchaseRequest(id, { status, requiredBy, notes }) {
  const existing = await getPurchaseRequestById(id);

  if (status && status !== existing.status) {
    const allowed = VALID_PR_TRANSITIONS[existing.status] || [];
    if (!allowed.includes(status)) {
      const error = new Error(
        `Invalid status transition from ${existing.status} to ${status}. Allowed: ${allowed.join(", ") || "None"}`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  const updateData = {};
  if (status) updateData.status = status;
  if (requiredBy !== undefined) updateData.requiredBy = requiredBy ? new Date(requiredBy) : null;
  if (notes !== undefined) updateData.notes = notes;

  const updated = await prisma.purchaseRequest.update({
    where: { id },
    data: updateData,
    include: {
      items: {
        include: {
          product: {
            select: { id: true, sku: true, name: true, unitOfMeasure: true },
          },
        },
      },
    },
  });

  return updated;
}

export async function listRfqs({
  page = 1,
  limit = 20,
  status,
  search,
  sortBy = "createdAt",
  sortOrder = "desc",
}) {
  const skip = (page - 1) * limit;
  const where = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [{ rfqNo: { contains: search, mode: "insensitive" } }];
  }

  const [total, rfqs] = await Promise.all([
    prisma.rFQ.count({ where }),
    prisma.rFQ.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        purchaseRequest: {
          select: { id: true, requestNo: true, status: true },
        },
        _count: {
          select: { responses: true, purchaseOrders: true },
        },
      },
    }),
  ]);

  return {
    rfqs,
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

export async function getRfqById(id) {
  const rfq = await prisma.rFQ.findUnique({
    where: { id },
    include: {
      purchaseRequest: {
        include: {
          items: {
            include: {
              product: {
                select: { id: true, sku: true, name: true, unitOfMeasure: true },
              },
            },
          },
        },
      },
      responses: {
        include: {
          vendor: {
            select: {
              id: true,
              code: true,
              name: true,
              rating: true,
              onTimeDeliveryPercent: true,
              qualityScore: true,
            },
          },
          items: {
            include: {
              product: {
                select: { id: true, sku: true, name: true, unitOfMeasure: true },
              },
            },
          },
        },
      },
      purchaseOrders: {
        select: { id: true, poNumber: true, status: true, total: true },
      },
    },
  });

  if (!rfq) {
    const error = new Error(`RFQ with ID ${id} not found`);
    error.statusCode = 404;
    throw error;
  }

  return rfq;
}

export async function createRfq({ purchaseRequestId, dueAt }) {
  if (purchaseRequestId) {
    const pr = await getPurchaseRequestById(purchaseRequestId);
    if (pr.status === "REJECTED" || pr.status === "CONVERTED") {
      const error = new Error(`Cannot create RFQ for Purchase Request in ${pr.status} status`);
      error.statusCode = 400;
      throw error;
    }
  }

  const rfqNo = `RFQ-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

  const created = await prisma.rFQ.create({
    data: {
      rfqNo,
      purchaseRequestId: purchaseRequestId || null,
      dueAt: dueAt ? new Date(dueAt) : null,
      status: "DRAFT",
    },
    include: {
      purchaseRequest: {
        include: {
          items: {
            include: {
              product: {
                select: { id: true, sku: true, name: true, unitOfMeasure: true },
              },
            },
          },
        },
      },
    },
  });

  return created;
}

export async function updateRfqStatus(id, { status }) {
  const rfq = await getRfqById(id);

  const allowed = VALID_RFQ_TRANSITIONS[rfq.status] || [];
  if (!allowed.includes(status)) {
    const error = new Error(
      `Invalid RFQ status transition from ${rfq.status} to ${status}. Allowed: ${allowed.join(", ") || "None"}`
    );
    error.statusCode = 400;
    throw error;
  }

  const updated = await prisma.rFQ.update({
    where: { id },
    data: {
      status,
      sentAt: status === "SENT" && !rfq.sentAt ? new Date() : undefined,
    },
  });

  return updated;
}

export async function recordRfqResponse({ rfqId, vendorId, validUntil, notes, items }) {
  const rfq = await getRfqById(rfqId);

  if (rfq.status === "AWARDED" || rfq.status === "CANCELLED") {
    const error = new Error(`Cannot record quotation for an RFQ with status ${rfq.status}`);
    error.statusCode = 400;
    throw error;
  }

  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
  });

  if (!vendor) {
    const error = new Error(`Vendor with ID ${vendorId} not found`);
    error.statusCode = 404;
    throw error;
  }

  if (!vendor.isActive) {
    const error = new Error(`Cannot record quotation for inactive vendor ${vendor.name} (${vendor.code})`);
    error.statusCode = 400;
    throw error;
  }

  // Calculate total: sum(quantity * unitPrice * (1 + taxPercent/100))
  let totalAmount = 0;
  items.forEach((item) => {
    const lineTotal = item.quantity * item.unitPrice * (1 + (item.taxPercent || 0) / 100);
    totalAmount += lineTotal;
  });

  const savedResponse = await prisma.$transaction(async (tx) => {
    const response = await tx.rFQResponse.upsert({
      where: {
        rfqId_vendorId: {
          rfqId,
          vendorId,
        },
      },
      create: {
        rfqId,
        vendorId,
        validUntil: validUntil ? new Date(validUntil) : null,
        notes: notes || null,
        totalAmount,
      },
      update: {
        validUntil: validUntil ? new Date(validUntil) : null,
        notes: notes || null,
        totalAmount,
        quotedAt: new Date(),
      },
    });

    // Delete existing response items if updating
    await tx.rFQResponseItem.deleteMany({
      where: { responseId: response.id },
    });

    // Create fresh items
    await tx.rFQResponseItem.createMany({
      data: items.map((item) => ({
        responseId: response.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxPercent: item.taxPercent || 0,
      })),
    });

    // Update RFQ status to QUOTATIONS_RECEIVED if DRAFT or SENT
    if (rfq.status === "DRAFT" || rfq.status === "SENT") {
      await tx.rFQ.update({
        where: { id: rfqId },
        data: { status: "QUOTATIONS_RECEIVED" },
      });
    }

    return tx.rFQResponse.findUnique({
      where: { id: response.id },
      include: {
        vendor: {
          select: { id: true, code: true, name: true, rating: true },
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
  });

  return savedResponse;
}

export async function compareRfqQuotes(rfqId) {
  const rfq = await getRfqById(rfqId);

  const responses = rfq.responses.map((resp) => {
    const total = Number(resp.totalAmount) || 0;
    return {
      responseId: resp.id,
      vendorId: resp.vendor.id,
      vendorCode: resp.vendor.code,
      vendorName: resp.vendor.name,
      rating: resp.vendor.rating ? Number(resp.vendor.rating) : null,
      onTimeDeliveryPercent: resp.vendor.onTimeDeliveryPercent
        ? Number(resp.vendor.onTimeDeliveryPercent)
        : null,
      qualityScore: resp.vendor.qualityScore ? Number(resp.vendor.qualityScore) : null,
      quotedAt: resp.quotedAt,
      validUntil: resp.validUntil,
      totalAmount: total,
      items: resp.items.map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        sku: item.product.sku,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        taxPercent: Number(item.taxPercent),
        lineTotal:
          Number(item.quantity) * Number(item.unitPrice) * (1 + Number(item.taxPercent) / 100),
      })),
    };
  });

  // Determine lowest bidder
  let lowestBidder = null;
  if (responses.length > 0) {
    lowestBidder = responses.reduce((min, cur) => (cur.totalAmount < min.totalAmount ? cur : min));
  }

  return {
    rfqId: rfq.id,
    rfqNo: rfq.rfqNo,
    rfqStatus: rfq.status,
    dueAt: rfq.dueAt,
    quotationCount: responses.length,
    lowestBidder: lowestBidder
      ? { vendorId: lowestBidder.vendorId, vendorName: lowestBidder.vendorName, amount: lowestBidder.totalAmount }
      : null,
    comparisons: responses,
  };
}

export async function awardRfq(rfqId, vendorId, { expectedDate, justification, notes, user } = {}) {
  const rfq = await getRfqById(rfqId);

  if (rfq.status === "AWARDED") {
    const error = new Error(`RFQ ${rfq.rfqNo} has already been awarded. Duplicate award rejected.`);
    error.statusCode = 400;
    throw error;
  }

  if (rfq.status !== "QUOTATIONS_RECEIVED" && rfq.status !== "EVALUATED") {
    const error = new Error(`RFQ must be in QUOTATIONS_RECEIVED or EVALUATED status to be awarded. Current: ${rfq.status}`);
    error.statusCode = 400;
    throw error;
  }

  const selectedResponse = rfq.responses.find((r) => r.vendorId === vendorId);
  if (!selectedResponse) {
    const error = new Error(`No quotation found for Vendor ID ${vendorId} under RFQ ${rfq.rfqNo}`);
    error.statusCode = 404;
    throw error;
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Double-check concurrent award lock inside transaction
    const freshRfq = await tx.rFQ.findUnique({
      where: { id: rfqId },
      include: { purchaseOrders: true },
    });

    if (freshRfq.status === "AWARDED" || freshRfq.purchaseOrders?.length > 0) {
      const error = new Error(`RFQ ${freshRfq.rfqNo} was already awarded or converted to a PO.`);
      error.statusCode = 409;
      throw error;
    }

    // 2. Mark RFQ as AWARDED
    const updatedRfq = await tx.rFQ.update({
      where: { id: rfqId },
      data: { status: "AWARDED" },
    });

    // 3. Mark linked PR as CONVERTED
    if (rfq.purchaseRequestId) {
      await tx.purchaseRequest.update({
        where: { id: rfq.purchaseRequestId },
        data: { status: "CONVERTED" },
      });
    }

    // 4. Calculate Subtotal, Tax, and Landed Total from winning response
    let subtotal = 0;
    let taxAmount = 0;

    selectedResponse.items.forEach((item) => {
      const lineSubtotal = Number((Number(item.quantity) * Number(item.unitPrice)).toFixed(2));
      const lineTax = Number((lineSubtotal * (Number(item.taxPercent || 0) / 100)).toFixed(2));
      subtotal += lineSubtotal;
      taxAmount += lineTax;
    });

    subtotal = Number(subtotal.toFixed(2));
    taxAmount = Number(taxAmount.toFixed(2));
    const total = Number((subtotal + taxAmount).toFixed(2));

    // 5. Enforce ₹1,00,000 threshold for status:
    // If total > ₹1,00,000 -> PENDING_APPROVAL (Admin signoff required)
    // If total <= ₹1,00,000 -> DRAFT (Procurement Officer can advance)
    const initialPoStatus = total > 100000 ? "PENDING_APPROVAL" : "DRAFT";

    const poNumber = `PO-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const poNotes = [
      justification ? `[AWARD JUSTIFICATION]: ${justification}` : null,
      notes || `Awarded from RFQ ${rfq.rfqNo}`,
    ]
      .filter(Boolean)
      .join(" | ");

    // 6. Create Purchase Order with winning vendor's quoted lines
    const createdPo = await tx.purchaseOrder.create({
      data: {
        poNumber,
        vendorId,
        rfqId,
        status: initialPoStatus,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        subtotal,
        taxAmount,
        total,
        notes: poNotes,
        items: {
          create: selectedResponse.items.map((it) => ({
            productId: it.productId,
            quantity: Number(it.quantity),
            unitPrice: Number(it.unitPrice),
            taxPercent: Number(it.taxPercent || 0),
          })),
        },
      },
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
      },
    });

    return {
      message: `RFQ ${rfq.rfqNo} successfully awarded to vendor ${selectedResponse.vendor.name}. Purchase Order ${createdPo.poNumber} generated.`,
      rfq: updatedRfq,
      purchaseOrder: createdPo,
      awardedVendor: selectedResponse.vendor,
      quotedTotal: selectedResponse.totalAmount,
    };
  });
}
