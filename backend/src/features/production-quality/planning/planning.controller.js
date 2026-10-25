import prisma from "../../../db/prisma.js";
import { AuditService } from "../../../services/audit.service.js";
import { sendCreated, sendSuccess } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import PlanningService from "./planning.service.js";
import ManufacturingService from "../manufacturing/manufacturing.service.js";

export const getDashboard = asyncHandler(async (_req, res) => {
  const data = await PlanningService.getDashboard();
  return sendSuccess(res, {
    message: "Production dashboard metrics retrieved successfully",
    data,
  });
});

export const createWorkOrder = asyncHandler(async (req, res) => {
  const workOrder = await PlanningService.createWorkOrder(req.body, req.user);
  return sendCreated(res, {
    message: "Work Order created successfully",
    data: workOrder,
  });
});

export const listWorkOrders = asyncHandler(async (req, res) => {
  const result = await PlanningService.listWorkOrders(req.query);
  return sendSuccess(res, {
    message: "Work Orders retrieved successfully",
    data: result.data,
    pagination: result.pagination,
  });
});

export const getWorkOrderById = asyncHandler(async (req, res) => {
  const workOrder = await PlanningService.getWorkOrderById(req.params.id);
  return sendSuccess(res, {
    message: "Work Order retrieved successfully",
    data: workOrder,
  });
});

export const updateWorkOrder = asyncHandler(async (req, res) => {
  const workOrder = await PlanningService.updateWorkOrder(req.params.id, req.body, req.user);
  return sendSuccess(res, {
    message: "Work Order updated successfully",
    data: workOrder,
  });
});

export const submitWorkOrder = asyncHandler(async (req, res) => {
  const workOrder = await PlanningService.submitWorkOrder(req.params.id, req.user);
  return sendSuccess(res, {
    message: "Work Order submitted for approval successfully",
    data: workOrder,
  });
});

export const approveWorkOrder = asyncHandler(async (req, res) => {
  const workOrder = await PlanningService.approveWorkOrder(req.params.id, req.user);
  return sendSuccess(res, {
    message: "Work Order approved successfully",
    data: workOrder,
  });
});

export const rejectWorkOrder = asyncHandler(async (req, res) => {
  const workOrder = await PlanningService.rejectWorkOrder(req.params.id, req.body.reason, req.user);
  return sendSuccess(res, {
    message: "Work Order rejected successfully",
    data: workOrder,
  });
});

export const releaseWorkOrder = asyncHandler(async (req, res) => {
  const workOrder = await PlanningService.releaseWorkOrder(req.params.id, req.user);
  return sendSuccess(res, {
    message: "Work Order released for production successfully",
    data: workOrder,
  });
});

export const holdWorkOrder = asyncHandler(async (req, res) => {
  const workOrder = await PlanningService.holdWorkOrder(
    req.params.id,
    req.body.reason,
    req.body.holdType,
    req.user
  );
  return sendSuccess(res, {
    message: "Work Order placed on hold successfully",
    data: workOrder,
  });
});

export const resumeWorkOrder = asyncHandler(async (req, res) => {
  const workOrder = await PlanningService.resumeWorkOrder(req.params.id, req.user);
  return sendSuccess(res, {
    message: "Work Order resumed successfully",
    data: workOrder,
  });
});

export const cancelWorkOrder = asyncHandler(async (req, res) => {
  const workOrder = await PlanningService.cancelWorkOrder(req.params.id, req.body.reason, req.user);
  return sendSuccess(res, {
    message: "Work Order cancelled successfully",
    data: workOrder,
  });
});

export const getWorkOrderHistory = asyncHandler(async (req, res) => {
  let targetId = req.params.id;
  if (isNaN(Number(targetId))) {
    const wo = await prisma.workOrder.findFirst({
      where: {
        OR: [
          { workOrderNo: { equals: targetId, mode: "insensitive" } },
          { qrCode: { equals: targetId, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });
    if (wo) targetId = wo.id;
  }
  const history = await AuditService.getHistory("WorkOrder", targetId);
  return sendSuccess(res, {
    message: "Work Order audit history retrieved successfully",
    data: history,
  });
});

export const getProductionCalendar = asyncHandler(async (req, res) => {
  const schedule = await PlanningService.getProductionCalendar(req.query);
  return sendSuccess(res, {
    message: "Production calendar retrieved successfully",
    data: schedule,
  });
});

export const checkMaterialAvailability = asyncHandler(async (req, res) => {
  const report = await PlanningService.checkMaterialAvailability(req.params.workOrderId);
  return sendSuccess(res, {
    message: "Material availability report generated successfully",
    data: report,
  });
});


export const getReferenceData = asyncHandler(async (_req, res) => {
  const data = await PlanningService.getReferenceData();
  return sendSuccess(res, {
    message: "Reference data retrieved successfully",
    data,
  });
});

export const recordWorkOrderCompletion = asyncHandler(async (req, res) => {
  const result = await ManufacturingService.recordProductionEntry(
    {
      ...req.body,
      workOrderId: req.params.id,
    },
    req.user
  );
  return sendSuccess(res, {
    message: "Production completion recorded successfully",
    data: result,
  });
});
