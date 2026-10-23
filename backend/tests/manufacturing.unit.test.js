import assert from "node:assert/strict";
import { test } from "node:test";
import {
  allocateWorkforce,
  evaluateAbsenceStaffingRisk,
  logShiftHandover,
} from "../src/features/hrms/manufacturing/manufacturing.service.js";

test("Manufacturing Integration: Allocates operator to work order successfully", () => {
  const alloc = allocateWorkforce({
    workOrderId: 202,
    workOrderNumber: "WO-2026-002",
    lineName: "Chemical Earthing Assembly",
    employeeId: 5,
    employeeName: "Ramesh Sharma",
    role: "Lead Technician",
  });

  assert.equal(alloc.workOrderId, 202);
  assert.equal(alloc.workOrderNumber, "WO-2026-002");
  assert.equal(alloc.role, "Lead Technician");
});

test("Manufacturing Risk Engine: Detects absence impact on critical work orders", () => {
  const risk = evaluateAbsenceStaffingRisk([5]); // Ramesh Sharma is assigned to WO-2026-002

  assert.equal(risk.totalImpactedOrders, 1);
  assert.equal(risk.riskAlerts.length, 1);
  assert.equal(risk.riskAlerts[0].workOrderNumber, "WO-2026-002");
  assert.equal(risk.riskAlerts[0].severity, "CRITICAL");
  assert.ok(risk.riskAlerts[0].recommendedAction.includes("Reassign qualified operator"));
});

test("Manufacturing Handover: Logs structured shift handover with signoff", () => {
  const handover = logShiftHandover({
    fromShift: "SHIFT_A",
    toShift: "SHIFT_B",
    outgoingSupervisorId: 10,
    incomingSupervisorId: 12,
    workCompletedSummary: "Completed 250 units",
    pendingBlockers: "Low packaging cartons",
    qcNotes: "All samples passed conductivity test",
  });

  assert.equal(handover.signedOff, true);
  assert.equal(handover.outgoingSupervisorId, 10);
  assert.equal(handover.workCompletedSummary, "Completed 250 units");
});
