import prisma from "../../db/prisma.js";
import { generateUniqueInstallationNo } from "../../utils/codeGenerators.js";

export async function listInstallations(filters = {}) {
  const { status, projectId, search, page = 1, limit = 20 } = filters;
  const where = {};

  if (status && status !== "ALL" && status.trim() !== "") {
    where.status = status.toUpperCase();
  }
  if (projectId) where.projectId = Number(projectId);
  if (search) {
    where.OR = [
      { installationNo: { contains: search, mode: "insensitive" } },
      { project: { name: { contains: search, mode: "insensitive" } } },
      { project: { projectCode: { contains: search, mode: "insensitive" } } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [installations, total] = await Promise.all([
    prisma.installation.findMany({
      where,
      skip,
      take,
      include: {
        project: {
          select: {
            id: true,
            projectCode: true,
            name: true,
            siteName: true,
            customer: { select: { name: true, phone: true } },
          },
        },
        _count: { select: { mediaAssets: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.installation.count({ where }),
  ]);

  return {
    installations,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
  };
}

export async function getInstallationById(id) {
  const installation = await prisma.installation.findUnique({
    where: { id: Number(id) },
    include: {
      project: {
        include: {
          customer: true,
          salesOrder: true,
          owner: { select: { id: true, name: true, email: true, phone: true } },
          tasks: true,
        },
      },
      mediaAssets: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!installation) {
    const error = new Error(`Installation #${id} not found`);
    error.statusCode = 404;
    throw error;
  }

  return installation;
}

export async function scheduleInstallation(data) {
  const project = await prisma.project.findUnique({
    where: { id: Number(data.projectId) },
  });
  if (!project) {
    const error = new Error(`Project #${data.projectId} not found`);
    error.statusCode = 400;
    throw error;
  }

  const installationNo = data.installationNo || (await generateUniqueInstallationNo());

  const existing = await prisma.installation.findUnique({
    where: { installationNo },
  });
  if (existing) {
    const error = new Error(`Installation No "${installationNo}" already in use`);
    error.statusCode = 400;
    throw error;
  }

  return prisma.installation.create({
    data: {
      installationNo,
      projectId: Number(data.projectId),
      status: "SCHEDULED",
      scheduledAt: data.scheduledAt || new Date(),
      notes: data.notes || null,
    },
    include: {
      project: { select: { id: true, projectCode: true, name: true } },
    },
  });
}

export async function recordTestResults(id, testData) {
  const installation = await getInstallationById(id);

  // Business Rule: Validate mandatory checklist items
  const { mandatoryChecklist, gridContinuityPassed, earthResistanceOhms } = testData;
  const isChecklistComplete =
    mandatoryChecklist &&
    mandatoryChecklist.pitExcavationVerified &&
    mandatoryChecklist.backfillCompoundApplied &&
    mandatoryChecklist.copperBondingInspected &&
    mandatoryChecklist.safetySignageInstalled;

  if (!isChecklistComplete) {
    const error = new Error("Cannot pass inspection: Mandatory site installation checklist items are incomplete");
    error.statusCode = 400;
    throw error;
  }

  // Business Rule: Earthing resistance check (Standard Yash Earthing specification: <= 2.0 Ohms)
  const isOhmPassed = earthResistanceOhms <= 2.0;
  const isOverallPassed = isOhmPassed && gridContinuityPassed;

  const nextStatus = isOverallPassed ? "HANDOVER_PENDING" : "BLOCKED";

  return prisma.installation.update({
    where: { id: Number(id) },
    data: {
      testResults: {
        ...testData,
        recordedAt: new Date().toISOString(),
        isOverallPassed,
        resistanceCompliant: isOhmPassed,
      },
      status: nextStatus,
    },
    include: { project: true },
  });
}

export async function completeHandover(id, handoverData) {
  const installation = await getInstallationById(id);

  // Business Rule: An installation cannot be marked complete if testing requirements are incomplete or failed
  if (installation.status !== "HANDOVER_PENDING") {
    const error = new Error(
      `Handover cannot be completed. Current status is ${installation.status}. Installation must successfully pass all testing & checklists first.`
    );
    error.statusCode = 400;
    throw error;
  }

  // Verify testResults exist
  if (!installation.testResults || !installation.testResults.isOverallPassed) {
    const error = new Error("Cannot complete handover: Earthing test results are missing or sub-standard.");
    error.statusCode = 400;
    throw error;
  }

  // Atomic update: Complete installation and update associated Project status if all installations complete
  return prisma.$transaction(async (tx) => {
    const updatedInstallation = await tx.installation.update({
      where: { id: Number(id) },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        customerSignoffName: handoverData.customerSignoffName,
        customerSignedAt: handoverData.customerSignedAt || new Date(),
        proofOfWork: handoverData.proofOfWork || null,
        notes: handoverData.notes || installation.notes,
      },
      include: { project: true },
    });

    // Check if other installations on this project are also completed
    const pendingInstallations = await tx.installation.count({
      where: {
        projectId: installation.projectId,
        status: { not: "COMPLETED" },
      },
    });

    if (pendingInstallations === 0) {
      await tx.project.update({
        where: { id: installation.projectId },
        data: {
          status: "COMPLETED",
          actualEnd: new Date(),
        },
      });

      // Synchronize SalesOrder status if linked
      if (installation.project?.salesOrderId) {
        await tx.salesOrder.update({
          where: { id: installation.project.salesOrderId },
          data: { status: "DELIVERED", deliveredAt: new Date() },
        });
      }
    }

    return updatedInstallation;
  });
}

export async function updateInstallationStatus(id, { status, notes }) {
  const installation = await getInstallationById(id);

  // Business rule: Cannot jump directly to COMPLETED without signoff
  if (status === "COMPLETED" && (!installation.customerSignoffName || !installation.customerSignedAt)) {
    const error = new Error("Cannot set status to COMPLETED without formal customer sign-off & handover documentation");
    error.statusCode = 400;
    throw error;
  }

  return prisma.installation.update({
    where: { id: Number(id) },
    data: {
      status,
      notes: notes || installation.notes,
      startedAt: status === "IN_PROGRESS" && !installation.startedAt ? new Date() : installation.startedAt,
    },
    include: { project: true },
  });
}
