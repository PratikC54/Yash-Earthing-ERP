import {
  bulkImportLeads,
  createLead,
  deleteLead,
  getFollowups,
  getLeadById,
  getLeads,
  getPipelineStats,
  getProductsCatalog,
  logCall,
  reassignLead,
  updateLead,
} from "./lead.service.js";

export async function handleGetLeads(req, res, next) {
  try {
    const { search, stage, source, priority, page, limit } = req.query;
    const result = await getLeads({ search, stage, source, priority, page, limit }, req.user);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function handleGetLeadById(req, res, next) {
  try {
    const { id } = req.params;
    const lead = await getLeadById(id);
    return res.status(200).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
}

export async function handleCreateLead(req, res, next) {
  try {
    const lead = await createLead(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: "Lead created and automatically assigned to Sales Consultant",
      data: lead,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateLead(req, res, next) {
  try {
    const { id } = req.params;
    const lead = await updateLead(id, req.body);
    return res.status(200).json({ success: true, message: "Lead updated", data: lead });
  } catch (error) {
    next(error);
  }
}

export async function handleReassignLead(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await reassignLead(id, req.body, req.user);
    return res.status(200).json({
      success: true,
      message: `Lead successfully reassigned to ${updated.assignedTo?.name || "Consultant"}`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleDeleteLead(req, res, next) {
  try {
    const { id } = req.params;
    await deleteLead(id);
    return res.status(200).json({ success: true, message: "Lead deleted successfully" });
  } catch (error) {
    next(error);
  }
}

export async function handleLogCall(req, res, next) {
  try {
    const { id } = req.params;
    const result = await logCall(id, req.body, req.user);
    return res.status(200).json({
      success: true,
      message: result.isSuccess
        ? "Call succeeded. Enquiry finalized and handed over to Back Officer for Quotation!"
        : "Call attempt logged. Follow-up automatically scheduled.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetFollowups(req, res, next) {
  try {
    const { search } = req.query;
    const followups = await getFollowups({ search }, req.user);
    return res.status(200).json({ success: true, data: followups });
  } catch (error) {
    next(error);
  }
}

export async function handleGetProductsCatalog(_req, res, next) {
  try {
    const products = await getProductsCatalog();
    return res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
}

export async function handleGetStats(_req, res, next) {
  try {
    const stats = await getPipelineStats();
    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

export async function handleBulkImport(req, res, next) {
  try {
    const { leads } = req.body;
    if (!Array.isArray(leads)) {
      return res.status(400).json({ success: false, message: "Invalid payload: leads must be an array" });
    }
    const result = await bulkImportLeads(leads, req.user);
    return res.status(200).json({
      success: true,
      message: `Successfully imported ${result.importedCount} leads!`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
