import { sendCreated, sendSuccess } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import ManufacturingService from "./manufacturing.service.js";

export const getDashboard = asyncHandler(async (_req, res) => {
  const data = await ManufacturingService.getDashboard();
  return sendSuccess(res, {
    message: "Manufacturing dashboard metrics retrieved successfully",
    data,
  });
});

export const startWorkOrder = asyncHandler(async (req, res) => {
  const data = await ManufacturingService.startWorkOrder(req.params.id, req.body, req.user);
  return sendSuccess(res, {
    message: "Work Order manufacturing execution started successfully",
    data,
  });
});

export const recordProductionEntry = asyncHandler(async (req, res) => {
  const result = await ManufacturingService.recordProductionEntry(req.body, req.user);
  return sendCreated(res, {
    message: "Production entry recorded successfully",
    data: result,
  });
});

export const issueMaterial = asyncHandler(async (req, res) => {
  const result = await ManufacturingService.issueMaterial(req.body, req.user);
  return sendCreated(res, {
    message: "Material issued to Work Order successfully",
    data: result,
  });
});

export const recordMaterialConsumption = asyncHandler(async (req, res) => {
  const result = await ManufacturingService.recordMaterialConsumption(req.body, req.user);
  return sendSuccess(res, {
    message: "Material consumption recorded successfully",
    data: result,
  });
});

export const returnMaterial = asyncHandler(async (req, res) => {
  const result = await ManufacturingService.returnMaterial(req.body, req.user);
  return sendSuccess(res, {
    message: "Material returned to inventory successfully",
    data: result,
  });
});

export const reconcileMaterial = asyncHandler(async (req, res) => {
  const result = await ManufacturingService.reconcileMaterial(req.params.workOrderId || req.body.workOrderId);
  return sendSuccess(res, {
    message: "Material reconciliation generated successfully",
    data: result,
  });
});

export const recordScrap = asyncHandler(async (req, res) => {
  const result = await ManufacturingService.recordScrap(req.body, req.user);
  return sendCreated(res, {
    message: "Scrap recorded successfully",
    data: result,
  });
});

export const recordDowntime = asyncHandler(async (req, res) => {
  const result = await ManufacturingService.recordDowntime(req.body, req.user);
  return sendCreated(res, {
    message: "Machine downtime event logged successfully",
    data: result,
  });
});

export const recordDelay = asyncHandler(async (req, res) => {
  const result = await ManufacturingService.recordDelay(req.body, req.user);
  return sendCreated(res, {
    message: "Production delay logged successfully",
    data: result,
  });
});

export const transferToQuality = asyncHandler(async (req, res) => {
  const result = await ManufacturingService.transferToQuality(req.params.id, req.body, req.user);
  return sendCreated(res, {
    message: "Output transferred to Quality Inspection successfully",
    data: result,
  });
});

export const getProductionReport = asyncHandler(async (req, res) => {
  const report = await ManufacturingService.getProductionReport(req.query);
  return sendSuccess(res, {
    message: "Production report generated successfully",
    data: report,
  });
});
