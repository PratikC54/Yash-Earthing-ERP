import prisma from "../../../db/prisma.js";
import { ApiError } from "../../../utils/apiResponse.js";

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
export async function generateInspectionNo(tx) {
  const client = tx || prisma;
  const currentYear = new Date().getFullYear();
  const prefix = `QI-${currentYear}-`;

  const latestQI = await client.qualityInspection.findFirst({
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

  let candidate = `${prefix}${String(nextSequence).padStart(4, "0")}`;
  while (await client.qualityInspection.findUnique({ where: { inspectionNo: candidate } })) {
    nextSequence++;
    candidate = `${prefix}${String(nextSequence).padStart(4, "0")}`;
  }

  return candidate;
}

/**
 * Returns today's date string (YYYY-MM-DD) in the specified business timezone (defaults to Asia/Kolkata / IST)
 */
export function getBusinessTodayString(timeZone = "Asia/Kolkata") {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  } catch (_e) {
    // Fallback to local system date in YYYY-MM-DD
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}

/**
 * Checks if a given date string or Date object is strictly before today in the business timezone
 */
export function isPastDate(dateInput, timeZone = "Asia/Kolkata") {
  if (!dateInput) return false;
  let parsedDateStr = "";
  if (typeof dateInput === "string") {
    // If it's YYYY-MM-DD or contains YYYY-MM-DD
    const match = dateInput.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) {
      parsedDateStr = match[1];
    } else {
      const parsed = new Date(dateInput);
      if (isNaN(parsed.getTime())) return false;
      parsedDateStr = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(parsed);
    }
  } else if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return false;
    parsedDateStr = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(dateInput);
  }

  if (!parsedDateStr) return false;
  const todayStr = getBusinessTodayString(timeZone);
  return parsedDateStr < todayStr;
}

/**
 * Throws ApiError if dateInput is strictly before today in the business timezone
 */
export function validateFutureOrTodayDate(dateInput, fieldName = "Date", timeZone = "Asia/Kolkata") {
  if (!dateInput) return;
  if (isPastDate(dateInput, timeZone)) {
    throw ApiError.badRequest("Past dates are not allowed. Please select today or a future date.");
  }
}

/**
 * Checks if a product unit of measure represents whole/discrete units (e.g. NOS, PCS, UNITS, EA)
 */
export function isWholeUnit(uom) {
  if (!uom || typeof uom !== "string") return true; // Default discrete
  const normalized = uom.trim().toUpperCase();
  const wholeUnits = ["NOS", "PCS", "PIECES", "UNIT", "UNITS", "EA", "EACH", "SET", "SETS", "BAG", "BOX"];
  return wholeUnits.includes(normalized);
}

/**
 * Validates a numeric quantity with strict checks against negative values, decimals for whole units, and maximum limits
 */
export function validateQuantityValue({
  quantity,
  uom = "NOS",
  max = undefined,
  min = 0.001,
  fieldName = "Quantity",
  allowZero = false,
}) {
  if (quantity === undefined || quantity === null || quantity === "") {
    throw ApiError.badRequest(`Please enter a valid ${fieldName.toLowerCase()}.`);
  }

  const num = Number(quantity);
  if (isNaN(num)) {
    throw ApiError.badRequest(`Please enter a valid ${fieldName.toLowerCase()}. Non-numeric values are not allowed.`);
  }

  if (num < 0) {
    throw ApiError.badRequest(`${fieldName} cannot be negative.`);
  }

  if (!allowZero && num <= 0) {
    throw ApiError.badRequest(`Please enter a ${fieldName.toLowerCase()} greater than zero.`);
  }

  if (allowZero && num < 0) {
    throw ApiError.badRequest(`${fieldName} cannot be negative.`);
  }

  if (isWholeUnit(uom) && !Number.isInteger(num)) {
    throw ApiError.badRequest(
      `Decimal quantities are not allowed for products measured in whole units (${uom}). Please enter a whole number.`
    );
  }

  if (max !== undefined && max !== null && num > max) {
    throw ApiError.badRequest(
      `${fieldName} cannot exceed the maximum permitted (${max} ${uom}).`
    );
  }

  return num;
}
