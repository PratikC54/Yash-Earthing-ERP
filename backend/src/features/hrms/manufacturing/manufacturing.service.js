/**
 * Submodule 7.7: Manufacturing Workforce Allocation & Shift Handover Service
 * 
 * Functions:
 * 1. Workforce allocation to Work Orders & Production Lines.
 * 2. Absence-impact risk evaluation: flags Work Orders when assigned operators are absent.
 * 3. Structured supervisor shift handover logging (Blockers, QC issues, pending tasks, supervisor signoff).
 * 4. Daily Production Workforce Readiness summary.
 */

let allocationsStore = [
  {
    id: 1,
    workOrderId: 101,
    workOrderNumber: "WO-2026-001",
    lineName: "Copper Bonding Line 1",
    employeeId: 1,
    employeeName: "Suresh Kumar",
    shift: "SHIFT_A",
    role: "Lead Operator",
    assignedDate: "2026-03-20",
  },
];

let shiftHandoversStore = [
  {
    id: 1,
    date: "2026-03-20",
    fromShift: "SHIFT_A",
    toShift: "SHIFT_B",
    outgoingSupervisorId: 1,
    incomingSupervisorId: 2,
    workCompletedSummary: "Completed 500m chemical earthing rods bonding",
    pendingBlockers: "Raw copper strip stock low in RM Store",
    qcNotes: "Lot #CB-44 pending lab conductivity test",
    signedOff: true,
    timestamp: "2026-03-20T14:00:00.000Z",
  },
];

/**
 * Allocate worker to a Work Order
 */
export function allocateWorkforce({
  workOrderId,
  workOrderNumber,
  lineName,
  employeeId,
  employeeName,
  shift = "SHIFT_A",
  role = "Operator",
  assignedDate,
}) {
  const allocation = {
    id: allocationsStore.length + 1,
    workOrderId: Number(workOrderId),
    workOrderNumber: workOrderNumber || `WO-${workOrderId}`,
    lineName: lineName || "General Assembly",
    employeeId: Number(employeeId),
    employeeName,
    shift,
    role,
    assignedDate: assignedDate || new Date().toISOString().slice(0, 10),
  };

  allocationsStore.push(allocation);
  return allocation;
}

/**
 * Assess staffing risk for production lines based on daily absent list
 */
export function evaluateAbsenceStaffingRisk(absentEmployeeIds = []) {
  const absentSet = new Set(absentEmployeeIds.map(Number));
  const impactedAllocations = allocationsStore.filter((a) => absentSet.has(a.employeeId));

  const riskAlerts = impactedAllocations.map((alloc) => ({
    workOrderId: alloc.workOrderId,
    workOrderNumber: alloc.workOrderNumber,
    lineName: alloc.lineName,
    missingWorker: alloc.employeeName,
    severity: alloc.role.includes("Lead") ? "CRITICAL" : "MODERATE",
    recommendedAction: `Reassign qualified operator from backup pool for line ${alloc.lineName}`,
  }));

  return {
    totalImpactedOrders: new Set(impactedAllocations.map((a) => a.workOrderId)).size,
    totalAbsentOperators: absentSet.size,
    riskAlerts,
  };
}

/**
 * Log structured shift handover
 */
export function logShiftHandover({
  date,
  fromShift,
  toShift,
  outgoingSupervisorId,
  incomingSupervisorId,
  workCompletedSummary,
  pendingBlockers,
  qcNotes,
}) {
  const handover = {
    id: shiftHandoversStore.length + 1,
    date: date || new Date().toISOString().slice(0, 10),
    fromShift,
    toShift,
    outgoingSupervisorId: Number(outgoingSupervisorId),
    incomingSupervisorId: incomingSupervisorId ? Number(incomingSupervisorId) : null,
    workCompletedSummary: workCompletedSummary || "Standard shift transition",
    pendingBlockers: pendingBlockers || "None reported",
    qcNotes: qcNotes || "All QC checks nominal",
    signedOff: true,
    timestamp: new Date().toISOString(),
  };

  shiftHandoversStore.push(handover);
  return handover;
}

/**
 * Get daily workforce readiness dashboard summary
 */
export function getWorkforceReadinessSummary() {
  return {
    activeAllocationsCount: allocationsStore.length,
    shiftHandoversCount: shiftHandoversStore.length,
    recentHandovers: shiftHandoversStore.slice(-5),
    allocations: allocationsStore,
  };
}
