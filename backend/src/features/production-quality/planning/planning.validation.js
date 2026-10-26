import { z } from "zod";
import { PRIORITY } from "../shared/productionQuality.constants.js";

/**
 * Validation schemas for Production Planning
 */
export const createWorkOrderSchema = z.object({
  bomRevisionId: z.coerce.number().int().positive("BOM Revision ID is required and must be a positive integer"),
  plannedQuantity: z.coerce.number().positive("Planned quantity must be greater than zero"),
  plannedStart: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  plannedEnd: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  assignedLine: z.string().max(100).nullable().optional(),
  priority: z.enum([PRIORITY.LOW, PRIORITY.MEDIUM, PRIORITY.HIGH, PRIORITY.URGENT]).default(PRIORITY.MEDIUM),
  notes: z.string().max(1000).optional(),
});

export const updateWorkOrderSchema = z.object({
  plannedQuantity: z.coerce.number().positive("Planned quantity must be greater than zero").optional(),
  plannedStart: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  plannedEnd: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  assignedLine: z.string().max(100).nullable().optional(),
  priority: z.enum([PRIORITY.LOW, PRIORITY.MEDIUM, PRIORITY.HIGH, PRIORITY.URGENT]).optional(),
  notes: z.string().max(1000).optional(),
});

export const workOrderIdParamSchema = z.object({
  id: z.union([
    z.coerce.number().int().positive("Work Order ID must be a positive integer"),
    z.string().min(1, "Work Order identifier cannot be empty"),
  ]),
});

export const workOrderIdInParamsSchema = z.object({
  workOrderId: z.union([
    z.coerce.number().int().positive("Work Order ID must be a positive integer"),
    z.string().min(1, "Work Order identifier cannot be empty"),
  ]),
});

export const transitionStatusSchema = z.object({
  action: z.enum(["SUBMIT", "RELEASE", "START", "HOLD", "RESUME", "CANCEL", "COMPLETE", "TRANSFER_QUALITY"], {
    errorMap: () => ({ message: "Action must be SUBMIT, RELEASE, START, HOLD, RESUME, CANCEL, COMPLETE, or TRANSFER_QUALITY" }),
  }),
  reason: z.string().max(500).optional(),
});

export const listWorkOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.string().optional(),
  priority: z.string().optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const productionCalendarQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
});
