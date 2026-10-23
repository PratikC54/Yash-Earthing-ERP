import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calculateAttendancePay,
  filterPermittedFineDeductions,
  FINE_STATUSES,
  updateFineStatus,
} from "../src/features/hrms/payroll/payroll.service.js";

test("Payroll Engine: Calculates attendance-based gross and net earnings accurately", () => {
  const result = calculateAttendancePay({
    monthlyBasicSalary: 30000,
    payableDays: 25,
    totalMonthDays: 30,
    allowances: 2000,
    approvedDeductions: 500,
  });

  // Daily rate = 30000 / 30 = 1000
  // Earned basic = 1000 * 25 = 25000
  // Gross pay = 25000 + 2000 = 27000
  // Net pay = 27000 - 500 = 26500
  assert.equal(result.dailyRate, 1000);
  assert.equal(result.earnedBasic, 25000);
  assert.equal(result.grossPay, 27000);
  assert.equal(result.netPay, 26500);
});

test("Payroll & Fine Safeguard: Excludes disputed and unapproved fines from payroll deductions", () => {
  const sampleFines = [
    { id: 1, amount: 500, approvedAmount: 500, status: FINE_STATUSES.APPROVED },
    { id: 2, amount: 1000, approvedAmount: null, status: FINE_STATUSES.DISPUTED },
    { id: 3, amount: 200, approvedAmount: null, status: FINE_STATUSES.REPORTED },
    { id: 4, amount: 400, approvedAmount: 0, status: FINE_STATUSES.REJECTED },
  ];

  const filtered = filterPermittedFineDeductions(sampleFines);

  // Strictly only the approved fine of 500 should be permitted
  assert.equal(filtered.totalPermittedDeduction, 500);
  assert.equal(filtered.eligibleFines.length, 1);
  assert.equal(filtered.disputedOrPendingFines.length, 3);
});

test("Fine Workflow: Dispute preserves record without unauthorized deduction", () => {
  const fine = updateFineStatus(2, {
    action: "DISPUTE",
    reason: "Bus breakdown caused reporting delay",
  });

  assert.equal(fine.status, FINE_STATUSES.DISPUTED);
  assert.equal(fine.disputeReason, "Bus breakdown caused reporting delay");
});
