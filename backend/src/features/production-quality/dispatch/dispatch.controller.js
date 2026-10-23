import { sendCreated, sendSuccess } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { DispatchService } from "./dispatch.service.js";

export const getDashboard = asyncHandler(async (_req, res) => {
  const data = await DispatchService.getDashboard();
  return sendSuccess(res, {
    message: "Dispatch dashboard metrics retrieved successfully",
    data,
  });
});

export const getReadyForDispatch = asyncHandler(async (_req, res) => {
  const data = await DispatchService.getReadyForDispatch();
  return sendSuccess(res, {
    message: "Ready for dispatch lots retrieved successfully",
    data,
  });
});

export const createDispatch = asyncHandler(async (req, res) => {
  const record = await DispatchService.createDispatch(req.body, req.user);
  return sendCreated(res, {
    message: "Dispatch record created successfully",
    data: record,
  });
});

export const getHistory = asyncHandler(async (_req, res) => {
  const data = await DispatchService.getHistory();
  return sendSuccess(res, {
    message: "Dispatch history retrieved successfully",
    data,
  });
});
