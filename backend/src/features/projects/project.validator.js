import { z } from "zod";

export const createProjectSchema = z.object({
  projectCode: z.string().max(50).optional(),
  salesOrderId: z.coerce.number().int().positive("Valid Sales Order ID is required"),
  customerId: z.coerce.number().int().positive("Valid Customer ID is required"),
  ownerId: z.coerce.number().int().positive().optional().nullable(),
  name: z.string().min(2, "Project name is required").max(150),
  siteName: z.string().max(150).optional().nullable(),
  siteAddress: z.any().optional().nullable(),
  surveyDate: z.coerce.date().optional().nullable(),
  plannedStart: z.coerce.date().optional().nullable(),
  plannedEnd: z.coerce.date().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  ownerId: z.coerce.number().int().positive().optional().nullable(),
  siteName: z.string().max(150).optional().nullable(),
  siteAddress: z.any().optional().nullable(),
  status: z.enum([
    "DRAFT",
    "SURVEY_PENDING",
    "PLANNED",
    "IN_PROGRESS",
    "ON_HOLD",
    "COMPLETED",
    "CANCELLED"
  ]).optional(),
  surveyDate: z.coerce.date().optional().nullable(),
  plannedStart: z.coerce.date().optional().nullable(),
  plannedEnd: z.coerce.date().optional().nullable(),
  actualStart: z.coerce.date().optional().nullable(),
  actualEnd: z.coerce.date().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const projectTaskSchema = z.object({
  title: z.string().min(2, "Task title is required").max(150),
  description: z.string().max(1000).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  roleTitle: z.string().max(100).optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  assignedToId: z.coerce.number().int().positive().optional().nullable(),
  dueAt: z.coerce.date().optional().nullable(),
});
