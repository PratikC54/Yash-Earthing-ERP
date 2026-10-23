/**
 * Helpers & Utilities for Module M4 Production & Quality
 */

export const formatDate = (dateString, options = {}) => {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      ...options,
    });
  } catch {
    return String(dateString);
  }
};

export const formatDateTime = (dateString) => {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(dateString);
  }
};

export const formatQuantity = (val, uom = "NOS") => {
  if (val === null || val === undefined || isNaN(val)) return `0 ${uom}`;
  const num = Number(val);
  return `${num.toLocaleString("en-IN", { maximumFractionDigits: 2 })} ${uom}`;
};

export const calculateProgress = (produced, planned) => {
  const prod = Number(produced) || 0;
  const plan = Number(planned) || 0;
  if (plan <= 0) return 0;
  return Math.min(100, Math.round((prod / plan) * 100));
};

export const getWorkOrderNextActions = (status) => {
  switch (status) {
    case "DRAFT":
      return ["SUBMIT", "CANCEL"];
    case "PLANNED":
      return ["APPROVE", "REJECT", "CANCEL"];
    case "READY_FOR_PRODUCTION":
      return ["RELEASE", "CANCEL"];
    case "IN_PROGRESS":
      return ["START", "HOLD", "TRANSFER_QC"];
    case "ON_HOLD":
    case "QC_HOLD":
    case "MATERIAL_HOLD":
      return ["RESUME", "CANCEL"];
    default:
      return [];
  }
};
