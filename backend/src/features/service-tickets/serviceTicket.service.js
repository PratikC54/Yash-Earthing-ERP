import prisma from "../../db/prisma.js";
import { generateUniqueTicketNo } from "../../utils/codeGenerators.js";

export async function listServiceTickets(filters = {}) {
  const { status, customerId, assignedToId, search, page = 1, limit = 20 } = filters;
  const where = {};

  if (status) where.status = status;
  if (customerId) where.customerId = Number(customerId);
  if (assignedToId) where.assignedToId = Number(assignedToId);
  if (search) {
    where.OR = [
      { ticketNo: { contains: search, mode: "insensitive" } },
      { issue: { contains: search, mode: "insensitive" } },
      { serialNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [tickets, total] = await Promise.all([
    prisma.serviceTicket.findMany({
      where,
      skip,
      take,
      include: {
        customer: { select: { id: true, code: true, name: true, phone: true } },
        product: { select: { id: true, sku: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { reportedAt: "desc" },
    }),
    prisma.serviceTicket.count({ where }),
  ]);

  // Compute live warranty status for each ticket
  const now = new Date();
  const enrichedTickets = tickets.map((t) => {
    let warrantyStatus = "NOT_SPECIFIED";
    if (t.warrantyEnd) {
      warrantyStatus = new Date(t.warrantyEnd) >= now ? "UNDER_WARRANTY" : "EXPIRED";
    }
    return { ...t, warrantyStatus };
  });

  return {
    tickets: enrichedTickets,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
  };
}

export async function getServiceTicketById(id) {
  const ticket = await prisma.serviceTicket.findUnique({
    where: { id: Number(id) },
    include: {
      customer: true,
      product: true,
      assignedTo: { select: { id: true, name: true, email: true, phone: true, designation: true } },
    },
  });

  if (!ticket) {
    const error = new Error(`Service ticket #${id} not found`);
    error.statusCode = 404;
    throw error;
  }

  const now = new Date();
  let warrantyStatus = "NOT_SPECIFIED";
  if (ticket.warrantyEnd) {
    warrantyStatus = new Date(ticket.warrantyEnd) >= now ? "UNDER_WARRANTY" : "EXPIRED";
  }

  return { ...ticket, warrantyStatus };
}

export async function createServiceTicket(data) {
  // Validate customer
  const customer = await prisma.customer.findUnique({
    where: { id: Number(data.customerId) },
  });
  if (!customer) {
    const error = new Error(`Customer #${data.customerId} not found`);
    error.statusCode = 400;
    throw error;
  }

  // Validate product if provided
  if (data.productId) {
    const product = await prisma.product.findUnique({
      where: { id: Number(data.productId) },
    });
    if (!product) {
      const error = new Error(`Product #${data.productId} not found`);
      error.statusCode = 400;
      throw error;
    }
  }

  // Concurrency-safe ticketNo generation if not supplied
  const ticketNo = data.ticketNo || (await generateUniqueTicketNo());

  // Check unique ticketNo
  const existing = await prisma.serviceTicket.findUnique({
    where: { ticketNo },
  });
  if (existing) {
    const error = new Error(`Ticket No "${ticketNo}" already exists`);
    error.statusCode = 400;
    throw error;
  }

  const status = data.assignedToId ? "ASSIGNED" : "OPEN";

  return prisma.serviceTicket.create({
    data: {
      ticketNo,
      customerId: Number(data.customerId),
      assignedToId: data.assignedToId ? Number(data.assignedToId) : null,
      salesOrderId: data.salesOrderId ? Number(data.salesOrderId) : null,
      productId: data.productId ? Number(data.productId) : null,
      serialNumber: data.serialNumber || null,
      issue: data.issue,
      status,
      warrantyStart: data.warrantyStart || null,
      warrantyEnd: data.warrantyEnd || null,
      reportedAt: new Date(),
    },
    include: {
      customer: true,
      product: true,
      assignedTo: true,
    },
  });
}

export async function assignServiceEngineer(id, assignedToId) {
  const ticket = await getServiceTicketById(id);

  const engineer = await prisma.user.findUnique({
    where: { id: Number(assignedToId) },
  });
  if (!engineer) {
    const error = new Error(`Engineer User #${assignedToId} not found`);
    error.statusCode = 400;
    throw error;
  }

  return prisma.serviceTicket.update({
    where: { id: Number(id) },
    data: {
      assignedToId: Number(assignedToId),
      status: ticket.status === "OPEN" ? "ASSIGNED" : ticket.status,
    },
    include: {
      customer: true,
      assignedTo: true,
    },
  });
}

export async function resolveServiceTicket(id, { resolution, partsUsed }) {
  await getServiceTicketById(id);

  let formattedResolution = resolution;
  if (partsUsed && Array.isArray(partsUsed) && partsUsed.length > 0) {
    const partsSummary = partsUsed
      .map((p) => `Product #${p.productId} (Qty: ${p.quantity})`)
      .join(", ");
    formattedResolution = `${resolution} | [Parts Consumed: ${partsSummary}]`;
  }

  return prisma.serviceTicket.update({
    where: { id: Number(id) },
    data: {
      resolution: formattedResolution,
      status: "RESOLVED",
      resolvedAt: new Date(),
    },
    include: {
      customer: true,
      product: true,
      assignedTo: true,
    },
  });
}

export async function updateServiceStatus(id, status) {
  await getServiceTicketById(id);

  return prisma.serviceTicket.update({
    where: { id: Number(id) },
    data: { status },
    include: { customer: true, assignedTo: true },
  });
}
