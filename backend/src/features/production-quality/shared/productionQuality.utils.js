import prisma from "../../../db/prisma.js";

export const TX_OPTIONS = { maxWait: 15000, timeout: 30000 };

/**
 * Generates the next sequential unique Work Order number (e.g. WO-2026-0001)
 */
export async function generateWorkOrderNo() {
  const currentYear = new Date().getFullYear();
  const prefix = `WO-${currentYear}-`;

  const latestWO = await prisma.workOrder.findFirst({
    where: {
      workOrderNo: {
        startsWith: prefix,
      },
    },
    orderBy: {
      id: "desc",
    },
    select: {
      workOrderNo: true,
    },
  });

  let nextSequence = 1;
  if (latestWO && latestWO.workOrderNo) {
    const parts = latestWO.workOrderNo.split("-");
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num)) {
      nextSequence = num + 1;
    }
  }

  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
}

/**
 * Generates the next sequential unique Quality Inspection number (e.g. QI-2026-0001)
 */
export async function generateInspectionNo() {
  const currentYear = new Date().getFullYear();
  const prefix = `QI-${currentYear}-`;

  const latestQI = await prisma.qualityInspection.findFirst({
    where: {
      inspectionNo: {
        startsWith: prefix,
      },
    },
    orderBy: {
      id: "desc",
    },
    select: {
      inspectionNo: true,
    },
  });

  let nextSequence = 1;
  if (latestQI && latestQI.inspectionNo) {
    const parts = latestQI.inspectionNo.split("-");
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num)) {
      nextSequence = num + 1;
    }
  }

  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
}
