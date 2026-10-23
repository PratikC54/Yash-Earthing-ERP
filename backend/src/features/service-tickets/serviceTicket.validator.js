import { z } from "zod";

export const createServiceTicketSchema = z.object({
  ticketNo: z.string().max(50).optional(),
  customerId: z.coerce.number().int().positive("Customer ID is required"),
  assignedToId: z.coerce.number().int().positive().optional().nullable(),
  salesOrderId: z.coerce.number().int().positive().optional().nullable(),
  productId: z.coerce.number().int().positive().optional().nullable(),
  serialNumber: z.string().max(100).optional().nullable(),
  issue: z.string().min(3, "Issue description is required").max(1000),
  warrantyStart: z.coerce.date().optional().nullable(),
  warrantyEnd: z.coerce.date().optional().nullable(),
});

export const assignServiceTicketSchema = z.object({
  assignedToId: z.coerce.number().int().positive("Valid engineer User ID is required"),
});

export const resolveServiceTicketSchema = z.object({
  resolution: z.string().min(3, "Resolution notes are required").max(1000),
  partsUsed: z.array(z.object({
    productId: z.coerce.number().int().positive(),
    quantity: z.coerce.number().positive(),
    notes: z.string().optional(),
  })).optional().nullable(),
});

export const updateServiceStatusSchema = z.object({
  status: z.enum([
    "OPEN",
    "ASSIGNED",
    "IN_PROGRESS",
    "WAITING_PARTS",
    "RESOLVED",
    "CLOSED"
  ]),
});
