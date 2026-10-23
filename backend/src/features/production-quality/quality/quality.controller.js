import { sendCreated, sendSuccess } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import QualityService from "./quality.service.js";

export const getDashboard = asyncHandler(async (_req, res) => {
  const data = await QualityService.getDashboard();
  return sendSuccess(res, {
    message: "Quality dashboard metrics retrieved successfully",
    data,
  });
});

export const getInspectionQueue = asyncHandler(async (_req, res) => {
  const queue = await QualityService.getInspectionQueue();
  return sendSuccess(res, {
    message: "Inspection queue retrieved successfully",
    data: queue,
  });
});

export const getEligibleInspectors = asyncHandler(async (_req, res) => {
  const inspectors = await QualityService.getEligibleInspectors();
  return sendSuccess(res, {
    message: "Eligible quality inspectors retrieved successfully",
    data: inspectors,
  });
});

export const getInspectionById = asyncHandler(async (req, res) => {
  const inspection = await QualityService.getInspectionById(req.params.id);
  return sendSuccess(res, {
    message: "Quality Inspection retrieved successfully",
    data: inspection,
  });
});

export const assignInspector = asyncHandler(async (req, res) => {
  const inspection = await QualityService.assignInspector(req.params.id, req.body, req.user);
  return sendSuccess(res, {
    message: "Quality inspector assigned successfully",
    data: inspection,
  });
});

export const startInspection = asyncHandler(async (req, res) => {
  const inspection = await QualityService.startInspection(req.params.id, req.user);
  return sendSuccess(res, {
    message: "Quality inspection started successfully",
    data: inspection,
  });
});

export const recordResults = asyncHandler(async (req, res) => {
  const inspection = await QualityService.recordResults(req.params.id, req.body, req.user);
  return sendSuccess(res, {
    message: "Inspection measurements and results recorded successfully",
    data: inspection,
  });
});

export const approveInspection = asyncHandler(async (req, res) => {
  const inspection = await QualityService.approveInspection(req.params.id, req.body.notes, req.user);
  return sendSuccess(res, {
    message: "Quality inspection approved successfully",
    data: inspection,
  });
});

export const holdInspection = asyncHandler(async (req, res) => {
  const inspection = await QualityService.holdInspection(req.params.id, req.body.reason, req.user);
  return sendSuccess(res, {
    message: "Quality hold placed on inspection batch successfully",
    data: inspection,
  });
});

export const rejectInspection = asyncHandler(async (req, res) => {
  const inspection = await QualityService.rejectInspection(req.params.id, req.body.reason, req.user);
  return sendSuccess(res, {
    message: "Inspection batch rejected successfully",
    data: inspection,
  });
});

export const requestRework = asyncHandler(async (req, res) => {
  const notes = req.body.notes || [
    req.body.reworkStation && `Station: ${req.body.reworkStation}`,
    req.body.batchTag && `Batch: ${req.body.batchTag}`,
    req.body.defectNote && `Reason: ${req.body.defectNote}`,
  ].filter(Boolean).join(". ");
  const inspection = await QualityService.requestRework(req.params.id, notes, req.user);
  return sendSuccess(res, {
    message: "Rework request logged successfully",
    data: inspection,
  });
});

export const recordNonConformance = asyncHandler(async (req, res) => {
  const ncr = await QualityService.recordNonConformance(req.body, req.user);
  return sendCreated(res, {
    message: "Non-conformance report (NCR) logged successfully",
    data: ncr,
  });
});

export const listNonConformances = asyncHandler(async (req, res) => {
  const ncrs = await QualityService.listNonConformances(req.query);
  return sendSuccess(res, {
    message: "Non-conformance reports retrieved successfully",
    data: ncrs,
  });
});

export const recordCorrectiveAction = asyncHandler(async (req, res) => {
  const capa = await QualityService.recordCorrectiveAction(req.body, req.user);
  return sendCreated(res, {
    message: "Corrective and preventive action (CAPA) logged successfully",
    data: capa,
  });
});

export const approveScrap = asyncHandler(async (req, res) => {
  const scrapAuth = await QualityService.approveScrap(req.body, req.user);
  return sendCreated(res, {
    message: "Scrap authorization granted successfully",
    data: scrapAuth,
  });
});

export const releaseFinishedGoods = asyncHandler(async (req, res) => {
  const result = await QualityService.releaseFinishedGoods(req.body, req.user);
  return sendCreated(res, {
    message: "Finished goods released and inventoried successfully",
    data: result,
  });
});

export const getInspectionReport = asyncHandler(async (_req, res) => {
  const report = await QualityService.getInspectionReport();
  return sendSuccess(res, {
    message: "Quality inspection report generated successfully",
    data: report,
  });
});

export const submitDecision = asyncHandler(async (req, res) => {
  const inspection = await QualityService.submitDecision(req.params.id, req.body, req.user);
  return sendSuccess(res, {
    message: `Quality decision '${req.body.decision}' recorded successfully`,
    data: inspection,
  });
});

export const listCAPARecords = asyncHandler(async (_req, res) => {
  const capas = await QualityService.listCAPARecords();
  return sendSuccess(res, {
    message: "CAPA records retrieved successfully",
    data: capas,
  });
});

export const resolveCAPA = asyncHandler(async (req, res) => {
  const capa = await QualityService.resolveCAPA(req.params.id, req.body, req.user);
  return sendSuccess(res, {
    message: "CAPA record status updated successfully",
    data: capa,
  });
});
