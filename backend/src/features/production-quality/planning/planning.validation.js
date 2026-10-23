import { z } from "zod";
import { PRIORITY, WORK_ORDER_STATUS } from "../shared/productionQuality.constants.js";

export const createWorkOrderSchema = z.object({
  salesOrderId: z.coerce.number().int().positive(),
  productId: z.coerce.number().int().positive(),
  plannedQuantity: z.coerce.number().positive("Planned quantity must be greater than zero"),
  bomRevisionId: z.preprocess(
    (val) => (val === undefined || val === null || val === "" ? undefined : val),
    z.coerce.number().int().positive().optional()
  ),
  plannedStart: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  plannedEnd: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  assignedLine: z.string().max(100).nullable().optional(),
  priority: z.preprocess((val) => (!val ? PRIORITY.MEDIUM : val), z.enum([PRIORITY.LOW, PRIORITY.MEDIUM, PRIORITY.HIGH, PRIORITY.URGENT])),
  notes: z.string().max(1000).optional(),
  assignedSupervisorId: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().positive().optional()),
  workCenter: z.string().optional(),
  items: z.array(z.any()).optional(),
});

export const updateWorkOrderSchema = z.object({
  plannedQuantity: z.coerce.number().positive().optional(),
  bomRevisionId: z.coerce.number().int().positive().optional(),
  plannedStart: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  plannedEnd: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  assignedLine: z.string().max(100).nullable().optional(),
  priority: z.enum([PRIORITY.LOW, PRIORITY.MEDIUM, PRIORITY.HIGH, PRIORITY.URGENT]).optional(),
  notes: z.string().max(1000).optional(),
});

export const workOrderIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Work Order ID must be a positive integer"),
});

export const workOrderIdInParamsSchema = z.object({
  workOrderId: z.coerce.number().int().positive("Work Order ID must be a positive integer"),
});

export const transitionStatusSchema = z.object({
  reason: z.string().max(500).optional(),
  notes: z.string().max(500).optional(),
});

export const listWorkOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.nativeEnum(WORK_ORDER_STATUS).optional(),
  salesOrderId: z.coerce.number().int().positive().optional(),
  priority: z.nativeEnum(PRIORITY).optional(),
  search: z.string().optional(),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const productionCalendarQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
