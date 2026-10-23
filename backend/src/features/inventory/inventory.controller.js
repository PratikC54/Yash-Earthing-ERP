import * as inventoryService from "./inventory.service.js";
import { inventoryAdjustmentSchema } from "./inventory.validator.js";

export async function listInventory(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const lowStockOnly = req.query.lowStock === "true";
    const search = req.query.search;

    const result = await inventoryService.listInventory({
      page,
      limit,
      lowStockOnly,
      search,
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getInventoryByProductId(req, res, next) {
  try {
    const productId = parseInt(req.params.productId, 10);
    if (isNaN(productId) || productId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const result = await inventoryService.getInventoryByProductId(productId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listMovements(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const productId = req.query.productId ? parseInt(req.query.productId, 10) : undefined;
    const movementType = req.query.movementType;
    const search = req.query.search;

    const result = await inventoryService.listMovements({
      page,
      limit,
      productId,
      movementType,
      search,
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function recordInventoryAdjustment(req, res, next) {
  try {
    const parsed = inventoryAdjustmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues,
      });
    }

    const userId = req.user?.id;
    const result = await inventoryService.recordInventoryAdjustment({
      ...parsed.data,
      userId,
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}
