import * as payrollService from "./payroll.service.js";

export function listFines(req, res) {
  const { employeeId, status } = req.query;
  const fines = payrollService.getFines({ employeeId, status });
  res.json({ success: true, data: fines });
}

export function reportFine(req, res) {
  const actorId = req.user?.id || null;
  const fine = payrollService.reportFine({
    ...req.body,
    reportedById: actorId,
  });
  res.status(201).json({ success: true, message: "Fine incident reported", data: fine });
}

export function handleFineAction(req, res, next) {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;
    const actorRole = req.user?.role || "ADMIN";
    const actorId = req.user?.id || null;

    const result = payrollService.updateFineStatus(id, { action, reason, actorRole, actorId });
    res.json({ success: true, message: `Fine action ${action} completed`, data: result });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export function generatePayroll(req, res) {
  const draft = payrollService.generatePayrollDraft(req.body);
  res.status(201).json({ success: true, message: "Payroll calculated", data: draft });
}

export function updatePayrollStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = payrollService.updatePayrollStatus(id, status);
    res.json({ success: true, message: `Payroll status updated to ${status}`, data: result });
  } catch (error) {
    if (error.message.includes("locked")) {
      return res.status(409).json({ success: false, message: error.message });
    }
    if (error.message.includes("not found")) {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
}
