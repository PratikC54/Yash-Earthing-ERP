import * as serviceTicketService from "./serviceTicket.service.js";
import {
  createServiceTicketSchema,
  assignServiceTicketSchema,
  resolveServiceTicketSchema,
  updateServiceStatusSchema,
} from "./serviceTicket.validator.js";

export async function listServiceTickets(req, res, next) {
  try {
    const result = await serviceTicketService.listServiceTickets(req.query);
    res.status(200).json({ success: true, data: result.tickets, ...result });
  } catch (err) {
    next(err);
  }
}

export async function getServiceTicketById(req, res, next) {
  try {
    const ticket = await serviceTicketService.getServiceTicketById(req.params.id);
    res.status(200).json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
}

export async function createServiceTicket(req, res, next) {
  try {
    const validated = createServiceTicketSchema.parse(req.body);
    const ticket = await serviceTicketService.createServiceTicket(validated);
    res.status(201).json({
      success: true,
      message: `Service ticket ${ticket.ticketNo} logged`,
      data: ticket,
    });
  } catch (err) {
    if (err.name === "ZodError") {
      const error = new Error(err.errors[0]?.message || "Validation failed");
      error.statusCode = 400;
      error.errors = err.errors.map((e) => ({ field: e.path.join("."), message: e.message }));
      return next(error);
    }
    next(err);
  }
}

export async function assignServiceEngineer(req, res, next) {
  try {
    const { assignedToId } = assignServiceTicketSchema.parse(req.body);
    const updated = await serviceTicketService.assignServiceEngineer(req.params.id, assignedToId);
    res.status(200).json({
      success: true,
      message: `Engineer assigned to ticket ${updated.ticketNo}`,
      data: updated,
    });
  } catch (err) {
    if (err.name === "ZodError") {
      const error = new Error(err.errors[0]?.message || "Validation failed");
      error.statusCode = 400;
      error.errors = err.errors.map((e) => ({ field: e.path.join("."), message: e.message }));
      return next(error);
    }
    next(err);
  }
}

export async function resolveServiceTicket(req, res, next) {
  try {
    const validated = resolveServiceTicketSchema.parse(req.body);
    const updated = await serviceTicketService.resolveServiceTicket(req.params.id, validated);
    res.status(200).json({
      success: true,
      message: `Service ticket ${updated.ticketNo} marked resolved`,
      data: updated,
    });
  } catch (err) {
    if (err.name === "ZodError") {
      const error = new Error(err.errors[0]?.message || "Validation failed");
      error.statusCode = 400;
      error.errors = err.errors.map((e) => ({ field: e.path.join("."), message: e.message }));
      return next(error);
    }
    next(err);
  }
}

export async function updateServiceStatus(req, res, next) {
  try {
    const { status } = updateServiceStatusSchema.parse(req.body);
    const updated = await serviceTicketService.updateServiceStatus(req.params.id, status);
    res.status(200).json({
      success: true,
      message: `Service ticket status updated to ${updated.status}`,
      data: updated,
    });
  } catch (err) {
    if (err.name === "ZodError") {
      const error = new Error(err.errors[0]?.message || "Validation failed");
      error.statusCode = 400;
      error.errors = err.errors.map((e) => ({ field: e.path.join("."), message: e.message }));
      return next(error);
    }
    next(err);
  }
}
