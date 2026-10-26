import prisma from "../../db/prisma.js";
import { generateUniqueProjectCode } from "../../utils/codeGenerators.js";

export async function listProjects(filters = {}) {
  const { status, customerId, search, page = 1, limit = 20 } = filters;
  const where = {};

  if (status && status !== "ALL" && status.trim() !== "") {
    where.status = status.toUpperCase();
  }
  if (customerId) where.customerId = Number(customerId);
  if (search) {
    where.OR = [
      { projectCode: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
      { siteName: { contains: search, mode: "insensitive" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take,
      include: {
        customer: { select: { id: true, code: true, name: true, phone: true } },
        salesOrder: { select: { id: true, orderNumber: true, grandTotal: true, status: true } },
        owner: { select: { id: true, name: true, email: true, designation: true } },
        _count: { select: { installations: true, tasks: true, mediaAssets: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.count({ where }),
  ]);

  return {
    projects,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
  };
}

export async function getProjectById(id) {
  const project = await prisma.project.findUnique({
    where: { id: Number(id) },
    include: {
      customer: true,
      salesOrder: {
        include: {
          items: {
            include: {
              product: { select: { id: true, sku: true, name: true, category: true, unitOfMeasure: true } },
            },
          },
        },
      },
      owner: { select: { id: true, name: true, email: true, designation: true, phone: true } },
      installations: {
        orderBy: { createdAt: "desc" },
      },
      tasks: {
        include: {
          assignedTo: { select: { id: true, name: true, email: true, designation: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      mediaAssets: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) {
    const error = new Error(`Project with ID ${id} not found`);
    error.statusCode = 404;
    throw error;
  }

  // Cross-module Material Requirements calculation linked to Sales Order items & Inventory
  let materialRequirements = [];
  if (project.salesOrder && project.salesOrder.items) {
    const productIds = project.salesOrder.items.map((i) => i.productId);
    const inventoryRecords = await prisma.inventory.findMany({
      where: { productId: { in: productIds } },
    });
    const invMap = new Map(inventoryRecords.map((r) => [r.productId, r]));

    materialRequirements = project.salesOrder.items.map((item) => {
      const inv = invMap.get(item.productId) || {
        physicalQuantity: 0,
        reservedQuantity: 0,
        reorderLevel: 0,
      };
      const physical = Number(inv.physicalQuantity);
      const reserved = Number(inv.reservedQuantity);
      const available = physical - reserved;
      const required = Number(item.quantity);
      const shortage = Math.max(0, required - available);

      return {
        productId: item.productId,
        sku: item.productSkuSnapshot,
        name: item.productNameSnapshot,
        requiredQuantity: required,
        physicalStock: physical,
        reservedStock: reserved,
        availableStock: available,
        shortageQuantity: shortage,
        status: shortage > 0 ? "SHORTAGE" : "READY_IN_STORES",
      };
    });
  }

  return { ...project, materialRequirements };
}

export async function createProject(data) {
  // Concurrency-safe project code generation if not provided
  const projectCode = data.projectCode || (await generateUniqueProjectCode());

  // Validate sales order exists
  const salesOrder = await prisma.salesOrder.findUnique({
    where: { id: Number(data.salesOrderId) },
  });
  if (!salesOrder) {
    const error = new Error(`Cannot create project: Sales Order #${data.salesOrderId} does not exist`);
    error.statusCode = 400;
    throw error;
  }

  // Validate customer exists
  const customer = await prisma.customer.findUnique({
    where: { id: Number(data.customerId) },
  });
  if (!customer) {
    const error = new Error(`Cannot create project: Customer #${data.customerId} does not exist`);
    error.statusCode = 400;
    throw error;
  }

  // Unique projectCode check
  const existing = await prisma.project.findUnique({
    where: { projectCode },
  });
  if (existing) {
    const error = new Error(`Project code "${projectCode}" already in use`);
    error.statusCode = 400;
    throw error;
  }

  return prisma.project.create({
    data: {
      projectCode,
      salesOrderId: Number(data.salesOrderId),
      customerId: Number(data.customerId),
      ownerId: data.ownerId ? Number(data.ownerId) : null,
      name: data.name,
      siteName: data.siteName || null,
      siteAddress: data.siteAddress || null,
      status: "DRAFT",
      surveyDate: data.surveyDate || null,
      plannedStart: data.plannedStart || null,
      plannedEnd: data.plannedEnd || null,
      notes: data.notes || null,
    },
    include: {
      customer: true,
      salesOrder: true,
      owner: true,
    },
  });
}

export async function updateProject(id, data) {
  await getProjectById(id);

  return prisma.project.update({
    where: { id: Number(id) },
    data: {
      ...data,
      ownerId: data.ownerId !== undefined ? (data.ownerId ? Number(data.ownerId) : null) : undefined,
    },
    include: {
      customer: true,
      salesOrder: true,
      owner: true,
    },
  });
}

export async function addTaskToProject(projectId, taskData, userId) {
  const project = await getProjectById(projectId);

  // Generate unique taskNo
  const count = await prisma.task.count();
  const taskNo = `TSK-${String(count + 1).padStart(4, "0")}`;

  return prisma.task.create({
    data: {
      taskNo,
      title: taskData.title,
      description: taskData.description || null,
      department: taskData.department || "Site Operations",
      roleTitle: taskData.roleTitle || "Site Engineer",
      priority: taskData.priority || "MEDIUM",
      status: "OPEN",
      dueAt: taskData.dueAt || null,
      projectId: Number(projectId),
      createdById: Number(userId || project.ownerId || 1),
      assignedToId: taskData.assignedToId ? Number(taskData.assignedToId) : null,
      relatedEntityType: "PROJECT",
      relatedEntityId: Number(projectId),
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function updateTaskStatus(taskId, status) {
  const task = await prisma.task.findUnique({ where: { id: Number(taskId) } });
  if (!task) {
    const error = new Error(`Task #${taskId} not found`);
    error.statusCode = 404;
    throw error;
  }

  return prisma.task.update({
    where: { id: Number(taskId) },
    data: {
      status,
      completedAt: status === "COMPLETED" ? new Date() : null,
    },
  });
}

export async function getProjectDashboardMetrics() {
  const [
    totalProjects,
    activeProjects,
    completedProjects,
    onHoldProjects,
    totalInstallations,
    scheduledInstallations,
    testingInstallations,
    completedInstallations,
    pendingHandover,
    serviceTicketsOpen,
    inProgressTickets,
    unassignedTickets,
    recentProjects,
    actionRequiredInstallations,
    actionRequiredTickets
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: { in: ["PLANNED", "IN_PROGRESS", "SURVEY_PENDING"] } } }),
    prisma.project.count({ where: { status: "COMPLETED" } }),
    prisma.project.count({ where: { status: "ON_HOLD" } }),
    prisma.installation.count(),
    prisma.installation.count({ where: { status: "SCHEDULED" } }),
    prisma.installation.count({ where: { status: "TESTING" } }),
    prisma.installation.count({ where: { status: "COMPLETED" } }),
    prisma.installation.count({ where: { status: { in: ["TESTING", "HANDOVER_PENDING"] } } }),
    prisma.serviceTicket.count({ where: { status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS", "WAITING_PARTS"] } } }),
    prisma.serviceTicket.count({ where: { status: "IN_PROGRESS" } }),
    prisma.serviceTicket.count({ where: { status: "OPEN", assignedToId: null } }),
    prisma.project.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true } },
        salesOrder: { select: { orderNumber: true } },
        owner: { select: { name: true } },
      },
    }),
    prisma.installation.findMany({
      where: { status: { in: ["SURVEY_DUE", "SCHEDULED", "TESTING", "HANDOVER_PENDING", "BLOCKED"] } },
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        project: { select: { projectCode: true, name: true, customer: { select: { name: true } } } },
      },
    }),
    prisma.serviceTicket.findMany({
      where: { status: { in: ["OPEN", "ASSIGNED", "WAITING_PARTS"] } },
      take: 6,
      orderBy: { reportedAt: "desc" },
      include: {
        customer: { select: { name: true, phone: true } },
        assignedTo: { select: { name: true } },
      },
    }),
  ]);

  // Operational Action Center dynamic task compilation
  const operationsActionCentre = [];

  for (const inst of actionRequiredInstallations) {
    if (inst.status === "TESTING" || inst.status === "SCHEDULED" || inst.status === "SURVEY_DUE") {
      operationsActionCentre.push({
        id: `inst-test-${inst.id}`,
        type: inst.status === "SCHEDULED" ? "SITE_WORK_SCHEDULED" : "RESISTANCE_TEST_DUE",
        title: inst.status === "SCHEDULED" ? `Site Work Scheduled: ${inst.installationNo}` : `Earth Resistance Test Due: ${inst.installationNo}`,
        subtitle: `Project: ${inst.project?.name} (${inst.project?.projectCode}) | Client: ${inst.project?.customer?.name || "Client Site"}`,
        urgency: inst.status === "TESTING" ? "HIGH" : "MEDIUM",
        role: "ENGINEER",
        targetModule: "installations",
        targetId: inst.id,
        actionLabel: inst.status === "SCHEDULED" ? "View & Update Site Work" : "Conduct QC Test (≤ 2.0 Ω)",
      });
    } else if (inst.status === "HANDOVER_PENDING") {
      operationsActionCentre.push({
        id: `inst-handover-${inst.id}`,
        type: "HANDOVER_SIGN_OFF_DUE",
        title: `Customer Handover Sign-off Pending: ${inst.installationNo}`,
        subtitle: `Client: ${inst.project?.customer?.name} | Certified ≤ 2.0 Ω`,
        urgency: "CRITICAL",
        role: "PROJECT_MANAGER",
        targetModule: "installations",
        targetId: inst.id,
        actionLabel: "Collect Client Sign-Off",
      });
    } else if (inst.status === "BLOCKED") {
      operationsActionCentre.push({
        id: `inst-blocked-${inst.id}`,
        type: "INSTALLATION_BLOCKED",
        title: `Site Installation Non-Compliant / Blocked: ${inst.installationNo}`,
        subtitle: `Earth test exceeded limit (> 2.0 Ω) or safety checklist failed`,
        urgency: "CRITICAL",
        role: "ENGINEER",
        targetModule: "installations",
        targetId: inst.id,
        actionLabel: "Retest & Correct Pit",
      });
    }
  }

  for (const ticket of actionRequiredTickets) {
    if (ticket.status === "OPEN" && !ticket.assignedTo) {
      operationsActionCentre.push({
        id: `ticket-unassigned-${ticket.id}`,
        type: "TICKET_UNASSIGNED",
        title: `Unassigned Service Ticket: ${ticket.ticketNo}`,
        subtitle: `Customer: ${ticket.customer?.name} | Issue: ${ticket.issue}`,
        urgency: "HIGH",
        role: "SERVICE_EXECUTIVE",
        targetModule: "service",
        targetId: ticket.id,
        actionLabel: "Assign Field Engineer",
      });
    } else if (ticket.status === "WAITING_PARTS") {
      operationsActionCentre.push({
        id: `ticket-parts-${ticket.id}`,
        type: "TICKET_WAITING_PARTS",
        title: `Service Ticket Waiting for Spare Parts: ${ticket.ticketNo}`,
        subtitle: `Customer: ${ticket.customer?.name} | Assigned: ${ticket.assignedTo?.name || "Field Team"}`,
        urgency: "MEDIUM",
        role: "SERVICE_EXECUTIVE",
        targetModule: "service",
        targetId: ticket.id,
        actionLabel: "Check Stores & Resolve",
      });
    }
  }

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    onHoldProjects,
    totalInstallations,
    scheduledInstallations,
    testingInstallations,
    completedInstallations,
    pendingHandover,
    serviceTicketsOpen,
    openTickets: serviceTicketsOpen,
    totalTickets: serviceTicketsOpen,
    inProgressTickets,
    unassignedTickets,
    kpis: {
      totalProjects,
      activeProjects,
      completedProjects,
      onHoldProjects,
      totalInstallations,
      scheduledInstallations,
      testingInstallations,
      completedInstallations,
      pendingHandover,
      serviceTicketsOpen,
    },
    operationsActionCentre,
    recentProjects,
  };
}
