/**
 * Frontend Form Validation Utilities for Production & Quality Module
 */

export const WHOLE_UNITS = [
  "NOS",
  "PCS",
  "PIECES",
  "UNIT",
  "UNITS",
  "EA",
  "EACH",
  "SET",
  "SETS",
  "BAG",
  "BOX",
];

/**
 * Returns today's date formatted as YYYY-MM-DD in the local business timezone (Asia/Kolkata / IST)
 */
export function getTodayDateString(timeZone = "Asia/Kolkata") {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  } catch (_e) {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}

/**
 * Checks if a given date string or Date is strictly before today in the specified timezone
 */
export function isPastDate(dateInput, timeZone = "Asia/Kolkata") {
  if (!dateInput) return false;
  let parsedDateStr = "";
  if (typeof dateInput === "string") {
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
  const todayStr = getTodayDateString(timeZone);
  return parsedDateStr < todayStr;
}

/**
 * Validates whether the date is today or a future date.
 * Returns error string or empty string if valid.
 */
export function validatePastDate(dateInput, _fieldName = "Date", timeZone = "Asia/Kolkata") {
  if (!dateInput) return "";
  if (isPastDate(dateInput, timeZone)) {
    return "Past dates are not allowed. Please select today or a future date.";
  }
  return "";
}

/**
 * Validates date order (end date must not precede start date)
 */
export function validateDateRange(startDate, endDate, startLabel = "Start date", endLabel = "Completion date") {
  if (!startDate || !endDate) return "";
  const s = String(startDate).slice(0, 10);
  const e = String(endDate).slice(0, 10);
  if (e < s) {
    return `${endLabel} cannot be earlier than ${startLabel.toLowerCase()}.`;
  }
  return "";
}

/**
 * Checks if a product unit of measure is discrete (whole numbers only)
 */
export function isWholeUnit(uom) {
  if (!uom || typeof uom !== "string") return true;
  return WHOLE_UNITS.includes(uom.trim().toUpperCase());
}

/**
 * Validates a numeric quantity input value
 * Returns error message or empty string if valid
 */
export function validateQuantityInput(
  value,
  {
    uom = "NOS",
    max = undefined,
    allowZero = false,
    fieldName = "Quantity",
  } = {}
) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return `Please enter a valid ${fieldName.toLowerCase()}.`;
  }

  const num = Number(value);
  if (isNaN(num)) {
    return `Please enter a valid ${fieldName.toLowerCase()}. Non-numeric values are not allowed.`;
  }

  if (num < 0) {
    return `${fieldName} cannot be negative.`;
  }

  if (!allowZero && num <= 0) {
    return `Please enter a ${fieldName.toLowerCase()} greater than zero.`;
  }

  if (isWholeUnit(uom) && !Number.isInteger(num)) {
    return `Decimal quantities are not allowed for products measured in whole units (${uom}). Please enter a whole number.`;
  }

  if (max !== undefined && max !== null && num > max) {
    return `${fieldName} cannot exceed ${max}.`;
  }

  return "";
}

/**
 * Validates required selection or text field
 */
export function validateRequiredField(value, fieldName = "Field") {
  if (value === undefined || value === null || String(value).trim() === "") {
    return `${fieldName} is required. Please provide a selection or value.`;
  }
  return "";
}

/**
 * Validates minimum string length
 */
export function validateMinLength(value, minLength = 3, fieldName = "Field") {
  if (!value || String(value).trim().length < minLength) {
    return `${fieldName} must be at least ${minLength} characters.`;
  }
  return "";
}
