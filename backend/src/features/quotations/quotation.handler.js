import {
  createQuotation,
  deleteQuotation,
  finalizeProformaInvoice,
  getQuotationById,
  getQuotations,
  reviseQuotation,
  sendQuotationEmail,
} from "./quotation.service.js";

export async function handleGetQuotations(req, res, next) {
  try {
    const { search, status, page, limit } = req.query;
    const result = await getQuotations({ search, status, page, limit });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function handleGetQuotationById(req, res, next) {
  try {
    const { id } = req.params;
    const quotation = await getQuotationById(id);
    return res.status(200).json({ success: true, data: quotation });
  } catch (error) {
    next(error);
  }
}

export async function handleCreateQuotation(req, res, next) {
  try {
    const quotation = await createQuotation(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: "Quotation prepared and issued by Back Officer",
      data: quotation,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleReviseQuotation(req, res, next) {
  try {
    const { id } = req.params;
    const revised = await reviseQuotation(id, req.body, req.user);
    return res.status(200).json({
      success: true,
      message: "Quotation revised with negotiated terms/rates",
      data: revised,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleFinalizeProformaInvoice(req, res, next) {
  try {
    const { id } = req.params;
    const finalized = await finalizeProformaInvoice(id, req.user);
    return res.status(200).json({
      success: true,
      message: "Quotation finalized and marked as Proforma Invoice (PI)",
      data: finalized,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleSendEmail(req, res, next) {
  try {
    const { id } = req.params;
    const result = await sendQuotationEmail(id, req.body);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function handleDeleteQuotation(req, res, next) {
  try {
    const { id } = req.params;
    await deleteQuotation(id);
    return res.status(200).json({ success: true, message: "Quotation deleted" });
  } catch (error) {
    next(error);
  }
}
