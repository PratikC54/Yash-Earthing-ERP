import { sendCreated, sendSuccess } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { MasterDataService } from "./masterData.service.js";

export const getDropdownOptions = asyncHandler(async (req, res) => {
  const category = req.query.category;
  const options = await MasterDataService.getDropdownOptions(category);
  return sendSuccess(res, {
    message: "Dropdown options retrieved successfully",
    data: options,
  });
});

export const createDropdownOption = asyncHandler(async (req, res) => {
  const result = await MasterDataService.createDropdownOption(req.body, req.user);
  return sendCreated(res, {
    message: "Custom dropdown option created successfully",
    data: result,
  });
});
