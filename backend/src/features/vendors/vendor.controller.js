import * as vendorService from "./vendor.service.js";

export async function handleListVendors(req, res, next) {
  try {
    const result = await vendorService.listVendors(req.query);
    res.status(200).json({
      success: true,
      data: result.vendors,
      vendors: result.vendors,
      pagination: result.pagination,
      meta: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleGetVendorById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      const error = new Error("Invalid vendor ID");
      error.statusCode = 400;
      return next(error);
    }
    const vendor = await vendorService.getVendorById(id);
    res.status(200).json({
      success: true,
      data: vendor,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleCreateVendor(req, res, next) {
  try {
    const vendor = await vendorService.createVendor(req.body);
    res.status(201).json({
      success: true,
      data: vendor,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateVendor(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      const error = new Error("Invalid vendor ID");
      error.statusCode = 400;
      return next(error);
    }
    const vendor = await vendorService.updateVendor(id, req.body);
    res.status(200).json({
      success: true,
      data: vendor,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleDeactivateVendor(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      const error = new Error("Invalid vendor ID");
      error.statusCode = 400;
      return next(error);
    }
    const vendor = await vendorService.softDeactivateVendor(id);
    res.status(200).json({
      success: true,
      message: "Vendor status toggled successfully",
      data: vendor,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleDeleteVendor(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      const error = new Error("Invalid vendor ID");
      error.statusCode = 400;
      return next(error);
    }
    const vendor = await vendorService.deleteVendorPermanently(id);
    res.status(200).json({
      success: true,
      message: "Vendor deleted permanently",
      data: vendor,
    });
  } catch (err) {
    next(err);
  }
}
