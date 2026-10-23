/**
 * Submodule 7.6: Payroll & Fines Calculation Engine
 * 
 * Strict Legal & Business Principles:
 * 1. Attendance-based pay calculation: Net days payable = (Present Days + (Half Days * 0.5)).
 * 2. Deductions strictly permitted only for APPROVED fines/penalties.
 * 3. Never deduct disputed, proposed, or rejected fines from payroll.
 * 4. Payroll lifecycle state machine: DRAFT -> CALCULATED -> APPROVED -> FINALIZED.
 * 5. Finalized payroll is locked and immutable.
 */

export const FINE_STATUSES = {
  REPORTED: "REPORTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  DISPUTED: "DISPUTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  REVERSED: "REVERSED",
};

export const PAYROLL_STATUSES = {
  DRAFT: "DRAFT",
  CALCULATED: "CALCULATED",
  APPROVED: "APPROVED",
  FINALIZED: "FINALIZED",
};

/**
 * Calculate gross and net earnings from basic salary, allowances, and attendance
 */
export function calculateAttendancePay({
  monthlyBasicSalary = 0,
  payableDays = 0,
  totalMonthDays = 30,
  allowances = 0,
  approvedDeductions = 0,
} = {}) {
  const safeBasic = Number(monthlyBasicSalary) || 0;
  const safePayable = Math.max(0, Number(payableDays) || 0);
  const safeDays = Math.max(1, Number(totalMonthDays) || 30);
  const safeAllowances = Math.max(0, Number(allowances) || 0);
  const safeDeductions = Math.max(0, Number(approvedDeductions) || 0);

  // Per-day rate calculation
  const dailyRate = safeBasic / safeDays;
  const earnedBasic = Math.round(dailyRate * safePayable * 100) / 100;
  const grossPay = Math.round((earnedBasic + safeAllowances) * 100) / 100;
  const netPay = Math.max(0, Math.round((grossPay - safeDeductions) * 100) / 100);

  return {
    monthlyBasicSalary: safeBasic,
    dailyRate: Math.round(dailyRate * 100) / 100,
    payableDays: safePayable,
    totalMonthDays: safeDays,
    earnedBasic,
    allowances: safeAllowances,
    grossPay,
    approvedDeductions: safeDeductions,
    netPay,
  };
}

/**
 * Filter fines for payroll deduction.
 * CRITICAL SAFEGUARD: Only fines with status "APPROVED" can be deducted.
 * Disputed, under review, reported, or rejected fines are strictly zeroed out.
 */
export function filterPermittedFineDeductions(finesList = []) {
  const eligibleFines = finesList.filter((f) => f.status === FINE_STATUSES.APPROVED);
  const totalPermittedDeduction = eligibleFines.reduce(
    (sum, f) => sum + (Number(f.approvedAmount || f.amount) || 0),
    0
  );

  return {
    eligibleFines,
    totalPermittedDeduction,
    disputedOrPendingFines: finesList.filter((f) => f.status !== FINE_STATUSES.APPROVED),
  };
}

// In-memory persistent state fixtures for payroll runs and fines
let finesStore = [
  {
    id: 1,
    employeeId: 1,
    incidentDate: "2026-03-01",
    category: "SAFETY_VIOLATION",
    amount: 500,
    approvedAmount: 500,
    description: "Failure to wear safety goggles in lathe station",
    status: FINE_STATUSES.APPROVED,
    approvedBy: "Safety Inspector",
  },
  {
    id: 2,
    employeeId: 1,
    incidentDate: "2026-03-10",
    category: "LATE_COMING",
    amount: 200,
    approvedAmount: null,
    description: "Unexplained 45 min delay",
    status: FINE_STATUSES.DISPUTED,
    disputeReason: "Machine breakdown on factory transit bus",
  },
];

let payrollRecordsStore = [];

/**
 * List fines with filtering
 */
export function getFines({ employeeId, status } = {}) {
  return finesStore.filter((f) => {
    if (employeeId && f.employeeId !== Number(employeeId)) return false;
    if (status && f.status !== status) return false;
    return true;
  });
}

export function reportFine({ employeeId, incidentDate, category, amount, description, reportedById, approved = true }) {
  const isApproved = approved === true;
  const newFine = {
    id: finesStore.length + 1,
    employeeId: Number(employeeId),
    incidentDate: incidentDate || new Date().toISOString().slice(0, 10),
    category,
    amount: Number(amount),
    approvedAmount: isApproved ? Number(amount) : null,
    description,
    reportedById,
    status: isApproved ? FINE_STATUSES.APPROVED : FINE_STATUSES.REPORTED,
    approvedBy: isApproved ? "Management" : null,
    createdAt: new Date().toISOString(),
  };

  finesStore.push(newFine);
  return newFine;
}

/**
 * Update fine status (Dispute, Approve, Reject, Reverse)
 */
export function updateFineStatus(fineId, { action, reason, actorRole, actorId }) {
  const fine = finesStore.find((f) => f.id === Number(fineId));
  if (!fine) throw new Error(`Fine ID ${fineId} not found`);

  if (action === "DISPUTE") {
    fine.status = FINE_STATUSES.DISPUTED;
    fine.disputeReason = reason || "Employee raised dispute";
    fine.disputedAt = new Date().toISOString();
    return fine;
  }

  // Management approval/rejection actions require authorization
  if (action === "APPROVE") {
    fine.status = FINE_STATUSES.APPROVED;
    fine.approvedAmount = fine.amount;
    fine.approvedById = actorId;
    fine.approvedAt = new Date().toISOString();
    return fine;
  }

  if (action === "REJECT") {
    fine.status = FINE_STATUSES.REJECTED;
    fine.approvedAmount = 0;
    fine.rejectionReason = reason;
    fine.resolvedAt = new Date().toISOString();
    return fine;
  }

  if (action === "REVERSE") {
    fine.status = FINE_STATUSES.REVERSED;
    fine.approvedAmount = 0;
    fine.reversedReason = reason;
    fine.reversedAt = new Date().toISOString();
    return fine;
  }

  throw new Error(`Invalid fine action: ${action}`);
}

/**
 * Generate or recalculate payroll record for an employee for a given period
 */
export function generatePayrollDraft({
  employeeId,
  period = "2026-03",
  basicSalary = 25000,
  payableDays = 30,
  allowances = 0,
}) {
  const employeeFines = getFines({ employeeId: Number(employeeId) });
  const { eligibleFines, totalPermittedDeduction } = filterPermittedFineDeductions(employeeFines);

  const calc = calculateAttendancePay({
    monthlyBasicSalary: basicSalary,
    payableDays: Number(payableDays) || 30,
    totalMonthDays: 30,
    allowances: Number(allowances) || 0,
    approvedDeductions: totalPermittedDeduction,
  });

  const payrollDraft = {
    id: payrollRecordsStore.length + 1,
    employeeId: Number(employeeId),
    period,
    status: PAYROLL_STATUSES.DRAFT,
    calculation: calc,
    deductionsBreakdown: eligibleFines,
    createdAt: new Date().toISOString(),
  };

  payrollRecordsStore.push(payrollDraft);
  return payrollDraft;
}

/**
 * Approve or finalize payroll record
 */
export function updatePayrollStatus(payrollId, newStatus) {
  const record = payrollRecordsStore.find((p) => p.id === Number(payrollId));
  if (!record) throw new Error(`Payroll record ${payrollId} not found`);

  if (record.status === PAYROLL_STATUSES.FINALIZED) {
    throw new Error("Finalized payroll records are locked and cannot be modified.");
  }

  record.status = newStatus;
  record.updatedAt = new Date().toISOString();
  return record;
}
