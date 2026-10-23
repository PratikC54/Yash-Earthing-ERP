import * as orderService from "./purchaseOrder.service.js";
import {
  createPurchaseOrderSchema,
  createPoFromRfqSchema,
  updatePurchaseOrderStatusSchema,
} from "./purchaseOrder.validator.js";

export async function listPurchaseOrders(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const status = req.query.status;
    const vendorId = req.query.vendorId ? parseInt(req.query.vendorId, 10) : undefined;
    const search = req.query.search;

    const result = await orderService.listPurchaseOrders({
      page,
      limit,
      status,
      vendorId,
      search,
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getPurchaseOrderById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, message: "Invalid Purchase Order ID" });
    }

    const po = await orderService.getPurchaseOrderById(id);
    res.status(200).json({ success: true, data: po });
  } catch (error) {
    next(error);
  }
}

export async function createPurchaseOrder(req, res, next) {
  try {
    const parsed = createPurchaseOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues,
      });
    }

    const po = await orderService.createPurchaseOrder(parsed.data);
    res.status(201).json({ success: true, message: "Purchase Order created successfully", data: po });
  } catch (error) {
    next(error);
  }
}

export async function createPurchaseOrderFromRfq(req, res, next) {
  try {
    const parsed = createPoFromRfqSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues,
      });
    }

    const po = await orderService.createPurchaseOrderFromRfq(parsed.data);
    res.status(201).json({ success: true, message: "Purchase Order generated from RFQ successfully", data: po });
  } catch (error) {
    next(error);
  }
}

export async function updatePurchaseOrderStatus(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, message: "Invalid Purchase Order ID" });
    }

    const parsed = updatePurchaseOrderStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues,
      });
    }

    const po = await orderService.updatePurchaseOrderStatus(id, parsed.data);
    res.status(200).json({ success: true, message: "Purchase Order status updated successfully", data: po });
  } catch (error) {
    next(error);
  }
}

