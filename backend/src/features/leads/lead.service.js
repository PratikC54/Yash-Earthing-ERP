import prisma from "../../db/prisma.js";

// Helper to normalize lead source enum
function normalizeLeadSource(src) {
  if (!src) return "INDIAN_MART";
  const s = String(src).toUpperCase().replace(/[\s-]/g, "_");
  if (s === "INDIAMART" || s === "INDIAN_MART") return "INDIAN_MART";
  if (s === "EXPORT_INDIA" || s === "EXPORTERS_INDIA") return "EXPORT_INDIA";
  if (s === "JUSTDIAL" || s === "JUST_DIAL") return "JUSTDIAL";
  if (s === "TRADE_INDIA" || s === "TRADEINDIA") return "TRADE_INDIA";
  if (s === "SULEKHA") return "SULEKHA";
  if (s === "GOOGLE_ADS" || s === "GOOGLE") return "GOOGLE_ADS";
  if (s === "META_ADS" || s === "META" || s === "FACEBOOK") return "META_ADS";
  if (s === "WEBSITE") return "WEBSITE";
  if (s === "EXCEL") return "EXCEL";
  if (s === "MANUAL") return "MANUAL";
  if (s === "REFERRAL") return "REFERRAL";
  return "OTHER";
}

// Helper to auto-generate lead code (e.g. LD-261022-001)
export async function generateLeadCode() {
  const today = new Date();
  const dateStr = today.toISOString().slice(2, 10).replace(/-/g, "");
  const count = await prisma.lead.count();
  return `LD-${dateStr}-${String(count + 1).padStart(3, "0")}`;
}

// Automatically finds and assigns an active SALES_CONSULTANT (or SALES_MANAGER)
export async function getAutoAssignedConsultant() {
  const consultant = await prisma.user.findFirst({
    where: {
      role: "SALES_CONSULTANT",
      isActive: true,
      approvalStatus: "APPROVED",
    },
    select: { id: true, name: true },
  });

  if (consultant) return consultant;

  // Fallback to SALES_MANAGER or ADMIN
  const fallback = await prisma.user.findFirst({
    where: {
      role: { in: ["SALES_MANAGER", "ADMIN"] },
      isActive: true,
      approvalStatus: "APPROVED",
    },
    select: { id: true, name: true },
  });

  return fallback || { id: 1, name: "System Admin" };
}

export async function getLeads({ search, stage, source, priority, page = 1, limit = 50 }, user = null) {
  const where = {};

  // If logged-in user is SALES_CONSULTANT, strictly restrict to their assigned leads
  if (user && user.role === "SALES_CONSULTANT") {
    where.assignedToId = user.id;
  }

  if (search) {
    where.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
      { contactName: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { productName: { contains: search, mode: "insensitive" } },
    ];
  }

  if (stage && stage !== "ALL" && stage !== "All Stages") {
    where.stage = stage;
  }

  if (source && source !== "ALL" && source !== "All Sources") {
    where.source = source;
  }

  if (priority && priority !== "ALL" && priority !== "All Priorities") {
    where.priority = priority;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [total, rawLeads] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, phone: true, role: true },
        },
        items: {
          include: { product: true },
        },
        quotations: {
          select: { id: true, quotationNo: true, status: true, total: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(limit),
    }),
  ]);

  // Fetch call logs for these leads
  const leadIds = rawLeads.map((l) => l.id);
  const callLogs = await prisma.callLog.findMany({
    where: { leadId: { in: leadIds } },
    orderBy: { loggedAt: "desc" },
  });

  // Group call logs by leadId
  const callLogsByLead = {};
  for (const log of callLogs) {
    if (!callLogsByLead[log.leadId]) callLogsByLead[log.leadId] = [];
    callLogsByLead[log.leadId].push(log);
  }

  const leads = rawLeads.map((l) => ({
    ...l,
    callLogs: callLogsByLead[l.id] || [],
  }));

  return { total, page: Number(page), limit: Number(limit), leads };
}

export async function getLeadById(id) {
  const lead = await prisma.lead.findUnique({
    where: { id: Number(id) },
    include: {
      assignedTo: {
        select: { id: true, name: true, email: true, phone: true, role: true },
      },
      customer: true,
      product: true,
      quotations: {
        include: {
          items: true,
          salesOrder: true,
        },
      },
      items: true,
    },
  });

  if (!lead) {
    const error = new Error("Lead not found");
    error.statusCode = 404;
    throw error;
  }

  const callLogs = await prisma.callLog.findMany({
    where: { leadId: lead.id },
    orderBy: { loggedAt: "desc" },
  });

  return { ...lead, callLogs };
}

export async function createLead(data, creatorUser = null) {
  const code = data.code || (await generateLeadCode());
  const assigned = data.assignedToId
    ? { id: Number(data.assignedToId), name: data.assignedByName || "Sales Consultant" }
    : await getAutoAssignedConsultant();

  // Create or link Customer if necessary
  let customerId = data.customerId ? Number(data.customerId) : null;
  if (!customerId && data.customerName) {
    const existingCust = await prisma.customer.findFirst({
      where: { name: { equals: data.customerName, mode: "insensitive" } },
    });
    if (existingCust) {
      customerId = existingCust.id;
    } else {
      const custCount = await prisma.customer.count();
      const newCust = await prisma.customer.create({
        data: {
          code: `CUST-${String(custCount + 1001)}`,
          name: data.customerName,
          email: data.email || null,
          phone: data.phone || null,
          city: data.city || "Pune",
          state: data.state || "Maharashtra",
        },
      });
      customerId = newCust.id;
    }
  }

  const lead = await prisma.lead.create({
    data: {
      code,
      source: normalizeLeadSource(data.source),
      sourceReference: data.sourceReference || null,
      customerName: data.customerName,
      contactName: data.contactName || data.customerName,
      email: data.email || null,
      phone: data.phone || null,
      alternatePhone: data.alternatePhone || null,
      city: data.city || "Pune",
      state: data.state || "Maharashtra",
      productSku: data.productSku || (data.items?.[0]?.productSku) || "YEC-CBR-172",
      productName: data.productName || (data.items?.[0]?.productName) || "Copper Bonding Receptacle",
      variant: data.variant || (data.items?.[0]?.variant) || "Standard Heavy Duty",
      quantity: data.quantity ? Number(data.quantity) : (data.items?.reduce((acc, it) => acc + Number(it.quantity || 1), 0) || 1),
      expectedValue: data.expectedValue ? Number(data.expectedValue) : 0,
      intent: data.intent || "Positive",
      sentiment: data.sentiment || "High Priority",
      stage: data.stage || "NEW",
      priority: data.priority || "MEDIUM",
      assignedToId: assigned.id,
      assignedById: creatorUser?.id || assigned.id,
      assignedByName: assigned.name,
      requirement: data.requirement || "Customer product enquiry",
      customerId,
      nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null,
    },
    include: {
      assignedTo: {
        select: { id: true, name: true, email: true, phone: true, role: true },
      },
    },
  });

  // Create multiple LeadItems if provided
  if (Array.isArray(data.items) && data.items.length > 0) {
    for (const item of data.items) {
      await prisma.leadItem.create({
        data: {
          leadId: lead.id,
          productId: item.productId ? Number(item.productId) : null,
          productName: item.productName || item.name || "Earthing Product",
          productSku: item.productSku || item.sku || null,
          variant: item.variant || null,
          quantity: Number(item.quantity || 1),
        },
      }).catch(() => null);
    }
  }

  return getLeadById(lead.id);
}

export async function updateLead(id, data) {
  const updateData = { ...data };
  if (updateData.quantity) updateData.quantity = Number(updateData.quantity);
  if (updateData.expectedValue) updateData.expectedValue = Number(updateData.expectedValue);
  if (updateData.nextFollowUpAt) updateData.nextFollowUpAt = new Date(updateData.nextFollowUpAt);
  if (updateData.assignedToId) updateData.assignedToId = Number(updateData.assignedToId);

  const updated = await prisma.lead.update({
    where: { id: Number(id) },
    data: updateData,
    include: {
      assignedTo: {
        select: { id: true, name: true, email: true, phone: true, role: true },
      },
    },
  });

  return updated;
}

export async function reassignLead(id, { assignedToId, assignedByName }, user) {
  const targetUser = await prisma.user.findUnique({
    where: { id: Number(assignedToId) },
    select: { id: true, name: true, role: true, email: true },
  });

  if (!targetUser) {
    const error = new Error("Selected consultant not found");
    error.statusCode = 404;
    throw error;
  }

  const updated = await prisma.lead.update({
    where: { id: Number(id) },
    data: {
      assignedToId: targetUser.id,
      assignedByName: targetUser.name,
      lastActivityNote: `Lead manually reassigned to ${targetUser.name} (${targetUser.role}) by ${user?.name || "Admin"}`,
    },
    include: {
      assignedTo: {
        select: { id: true, name: true, email: true, phone: true, role: true },
      },
      quotations: true,
    },
  });

  return updated;
}

export async function getProductsCatalog() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      sku: true,
      variant: true,
      listPrice: true,
      hsnCode: true,
      unitOfMeasure: true,
      description: true,
    },
    orderBy: { name: "asc" },
  });
  return products;
}

export async function deleteLead(id) {
  await prisma.lead.delete({
    where: { id: Number(id) },
  });
  return { success: true };
}

// Log Call and Finalize enquiry / schedule follow-up
export async function logCall(leadId, callData, callerUser) {
  const lead = await prisma.lead.findUnique({
    where: { id: Number(leadId) },
  });

  if (!lead) {
    const error = new Error("Lead not found");
    error.statusCode = 404;
    throw error;
  }

  const { outcome, notes, followUpDate, durationMinutes = 3, quotationRequested = false } = callData;

  const isSuccess =
    outcome === "ANSWERED" ||
    outcome === "QUOTATION_REQUESTED" ||
    quotationRequested ||
    callData.succeeded === true;

  // Create CallLog in DB
  const log = await prisma.callLog.create({
    data: {
      leadId: lead.id,
      callerId: callerUser?.id || lead.assignedToId || 1,
      customerName: lead.customerName,
      phone: lead.phone || "+91 00000 00000",
      outcome: outcome || (isSuccess ? "QUOTATION_REQUESTED" : "BUSY"),
      durationSeconds: Number(durationMinutes) * 60,
      discussionHighlights: notes || "Call with customer regarding requirement",
      quoteRequested: isSuccess,
      nextFollowUpAt: !isSuccess && followUpDate ? new Date(followUpDate) : null,
    },
  });

  // If call succeeded -> mark enquiry as requirement captured / quotation requested
  if (isSuccess) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        stage: "REQUIREMENT_CAPTURED",
        lastActivityNote: `Call succeeded by ${callerUser?.name || "Consultant"}. Handed over to Back Officer for Quotation. Notes: ${notes || ""}`,
        sentiment: "Positive",
      },
    });
  } else {
    // If call failed -> issue follow-up callback
    const nextDate = followUpDate ? new Date(followUpDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        stage: "CONTACTED",
        nextFollowUpAt: nextDate,
        lastActivityNote: `Call attempt: ${outcome}. Follow-up scheduled for ${nextDate.toLocaleDateString()}. Notes: ${notes || ""}`,
      },
    });
  }

  return { log, isSuccess, stage: isSuccess ? "REQUIREMENT_CAPTURED" : "CONTACTED" };
}

export async function getFollowups({ search }, user = null) {
  const where = {
    nextFollowUpAt: { not: null },
  };

  // If logged-in user is SALES_CONSULTANT, strictly restrict to their assigned leads
  if (user && user.role === "SALES_CONSULTANT") {
    where.assignedToId = user.id;
  }

  if (search) {
    where.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
      { contactName: { contains: search, mode: "insensitive" } },
    ];
  }

  const leads = await prisma.lead.findMany({
    where,
    include: {
      assignedTo: {
        select: { id: true, name: true, phone: true, role: true },
      },
    },
    orderBy: { nextFollowUpAt: "asc" },
  });

  return leads;
}

export async function getPipelineStats() {
  const [totalLeads, inDiscussion, quotesRequested, poConfirmed, totalPipeline] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({
      where: { stage: { in: ["CONTACTED", "QUALIFIED", "REQUIREMENT_CAPTURED"] } },
    }),
    prisma.lead.count({
      where: { stage: { in: ["QUOTATION_DRAFT", "QUOTATION_SENT", "NEGOTIATION"] } },
    }),
    prisma.lead.count({
      where: { stage: { in: ["PO_RECEIVED", "CONVERTED"] } },
    }),
    prisma.lead.aggregate({
      _sum: { expectedValue: true },
    }),
  ]);

  return {
    totalLeads,
    inDiscussion,
    quotesRequested,
    poConfirmed,
    totalPipelineValue: Number(totalPipeline._sum.expectedValue || 0),
  };
}

export async function bulkImportLeads(leadsArray, creatorUser) {
  const consultant = await getAutoAssignedConsultant();
  const results = [];

  for (const item of leadsArray) {
    try {
      const code = item.code || (await generateLeadCode());
      const lead = await prisma.lead.create({
        data: {
          code,
          customerName: item.customerName || item.Company || "New Enterprise",
          contactName: item.contactName || item.Contact || item.customerName || "Purchasing Manager",
          phone: item.phone || item.Mobile || null,
          email: item.email || item.Email || null,
          city: item.city || item.City || "Pune",
          state: item.state || item.State || "Maharashtra",
          productName: item.productName || item.Product || "Copper Bonding Receptacle",
          productSku: item.productSku || "YEC-CBR-172",
          variant: item.variant || "Standard Heavy Duty",
          quantity: Number(item.quantity || item.Qty || 1),
          expectedValue: Number(item.expectedValue || item.Amount || 5000),
          source: normalizeLeadSource(item.source),
          stage: item.stage || "NEW",
          priority: item.priority || "MEDIUM",
          assignedToId: consultant.id,
          assignedById: creatorUser?.id || consultant.id,
          assignedByName: consultant.name,
          requirement: item.requirement || "Imported lead from Excel",
        },
      });
      results.push(lead);
    } catch (e) {
      console.error("Error importing lead item:", e);
    }
  }

  return { importedCount: results.length, leads: results };
}
