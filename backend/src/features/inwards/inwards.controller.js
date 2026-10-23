import * as inwardsService from "./inwards.service.js";
import {
  createGoodsReceiptSchema,
  inspectGoodsReceiptSchema,
} from "./inwards.validator.js";

export async function listGoodsReceipts(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const status = req.query.status;
    const purchaseOrderId = req.query.purchaseOrderId ? parseInt(req.query.purchaseOrderId, 10) : undefined;
    const search = req.query.search;

    const result = await inwardsService.listGoodsReceipts({
      page,
      limit,
      status,
      purchaseOrderId,
      search,
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getGoodsReceiptById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, message: "Invalid Goods Receipt ID" });
    }

    const grn = await inwardsService.getGoodsReceiptById(id);
    res.status(200).json({ success: true, data: grn });
  } catch (error) {
    next(error);
  }
}

export async function createGoodsReceipt(req, res, next) {
  try {
    const parsed = createGoodsReceiptSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues,
      });
    }

    const grn = await inwardsService.createGoodsReceipt(parsed.data);
    res.status(201).json({ success: true, message: "Goods Receipt Note created successfully", data: grn });
  } catch (error) {
    next(error);
  }
}

export async function inspectAndPostGoodsReceipt(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, message: "Invalid Goods Receipt ID" });
    }

    const parsed = inspectGoodsReceiptSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues,
      });
    }

    const userId = req.user?.id;
    const result = await inwardsService.inspectAndPostGoodsReceipt(id, {
      ...parsed.data,
      userId,
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}
