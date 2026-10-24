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
  const [totalProjects, activeProjects, completedProjects, onHoldProjects, totalInstallations, pendingHandover, serviceTicketsOpen] =
    await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { status: { in: ["PLANNED", "IN_PROGRESS", "SURVEY_PENDING"] } } }),
      prisma.project.count({ where: { status: "COMPLETED" } }),
      prisma.project.count({ where: { status: "ON_HOLD" } }),
      prisma.installation.count(),
      prisma.installation.count({ where: { status: { in: ["TESTING", "HANDOVER_PENDING"] } } }),
      prisma.serviceTicket.count({ where: { status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS", "WAITING_PARTS"] } } }),
    ]);

  const recentProjects = await prisma.project.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true } },
      salesOrder: { select: { orderNumber: true } },
      owner: { select: { name: true } },
    },
  });

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    onHoldProjects,
    totalInstallations,
    totalTickets: serviceTicketsOpen,
    pendingHandover,
    serviceTicketsOpen,
    openTickets: serviceTicketsOpen,
    kpis: {
      totalProjects,
      activeProjects,
      completedProjects,
      onHoldProjects,
      totalInstallations,
      pendingHandover,
      serviceTicketsOpen,
    },
    recentProjects,
  };
}
