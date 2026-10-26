import * as requisitionService from "./requisition.service.js";
import {
  createPurchaseRequestSchema,
  updatePurchaseRequestSchema,
  createRfqSchema,
  updateRfqStatusSchema,
  recordRfqResponseSchema,
  awardRfqSchema,
} from "./requisition.validator.js";

export async function listPurchaseRequests(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const status = req.query.status;
    const search = req.query.search;

    const result = await requisitionService.listPurchaseRequests({ page, limit, status, search });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getPurchaseRequestById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, message: "Invalid purchase request ID" });
    }
    const pr = await requisitionService.getPurchaseRequestById(id);
    res.status(200).json({ success: true, data: pr });
  } catch (error) {
    next(error);
  }
}

export async function createPurchaseRequest(req, res, next) {
  try {
    const parsed = createPurchaseRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues,
      });
    }

    const pr = await requisitionService.createPurchaseRequest(parsed.data);
    res.status(201).json({ success: true, message: "Purchase request created successfully", data: pr });
  } catch (error) {
    next(error);
  }
}

export async function updatePurchaseRequest(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, message: "Invalid purchase request ID" });
    }

    const parsed = updatePurchaseRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues,
      });
    }

    const pr = await requisitionService.updatePurchaseRequest(id, parsed.data);
    res.status(200).json({ success: true, message: "Purchase request updated successfully", data: pr });
  } catch (error) {
    next(error);
  }
}

export async function listRfqs(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const status = req.query.status;
    const search = req.query.search;

    const result = await requisitionService.listRfqs({ page, limit, status, search });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getRfqById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, message: "Invalid RFQ ID" });
    }
    const rfq = await requisitionService.getRfqById(id);
    res.status(200).json({ success: true, data: rfq });
  } catch (error) {
    next(error);
  }
}

export async function createRfq(req, res, next) {
  try {
    const parsed = createRfqSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues,
      });
    }

    const rfq = await requisitionService.createRfq(parsed.data);
    res.status(201).json({ success: true, message: "RFQ created successfully", data: rfq });
  } catch (error) {
    next(error);
  }
}

export async function updateRfqStatus(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, message: "Invalid RFQ ID" });
    }

    const parsed = updateRfqStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues,
      });
    }

    const rfq = await requisitionService.updateRfqStatus(id, parsed.data);
    res.status(200).json({ success: true, message: "RFQ status updated successfully", data: rfq });
  } catch (error) {
    next(error);
  }
}

export async function recordRfqResponse(req, res, next) {
  try {
    const parsed = recordRfqResponseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues,
      });
    }

    const response = await requisitionService.recordRfqResponse(parsed.data);
    res.status(201).json({ success: true, message: "RFQ response recorded successfully", data: response });
  } catch (error) {
    next(error);
  }
}

export async function compareRfqQuotes(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, message: "Invalid RFQ ID" });
    }

    const comparison = await requisitionService.compareRfqQuotes(id);
    res.status(200).json({ success: true, data: comparison });
  } catch (error) {
    next(error);
  }
}

export async function awardRfq(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, message: "Invalid RFQ ID" });
    }

    const parsed = awardRfqSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues,
      });
    }

    const result = await requisitionService.awardRfq(id, parsed.data.vendorId, {
      expectedDate: parsed.data.expectedDate,
      justification: parsed.data.justification,
      notes: parsed.data.notes,
      user: req.user,
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}
