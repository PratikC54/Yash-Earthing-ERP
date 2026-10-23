import * as mfgService from "./manufacturing.service.js";

export function allocateWorkforce(req, res) {
  const result = mfgService.allocateWorkforce(req.body);
  res.status(201).json({ success: true, message: "Workforce allocated to work order", data: result });
}

export function evaluateStaffingRisk(req, res) {
  const { absentIds } = req.query;
  const ids = absentIds ? absentIds.split(",") : [];
  const report = mfgService.evaluateAbsenceStaffingRisk(ids);
  res.json({ success: true, data: report });
}

export function recordShiftHandover(req, res) {
  const supervisorId = req.user?.id || 1;
  const result = mfgService.logShiftHandover({
    ...req.body,
    outgoingSupervisorId: supervisorId,
  });
  res.status(201).json({ success: true, message: "Shift handover logged", data: result });
}

export function getReadinessSummary(req, res) {
  const summary = mfgService.getWorkforceReadinessSummary();
  res.json({ success: true, data: summary });
}
