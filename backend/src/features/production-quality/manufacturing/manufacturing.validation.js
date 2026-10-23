import { z } from "zod";

export const startWorkOrderSchema = z.object({
  actualStart: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  shift: z.enum(["GENERAL", "SHIFT_A", "SHIFT_B", "SHIFT_C"]).default("GENERAL"),
  operatorId: z.coerce.number().int().positive().optional(),
  workCenter: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const productionEntrySchema = z.object({
  workOrderId: z.coerce.number().int().positive("Work Order ID is required"),
  quantityProduced: z.coerce.number().positive("Quantity produced must be greater than zero"),
  shift: z.enum(["GENERAL", "SHIFT_A", "SHIFT_B", "SHIFT_C"]).default("GENERAL"),
  operatorId: z.coerce.number().int().positive().optional(),
  workCenter: z.string().optional(),
  timestamp: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

export const materialIssueSchema = z.object({
  workOrderId: z.coerce.number().int().positive("Work Order ID is required"),
  productId: z.coerce.number().int().positive("Product ID is required"),
  quantity: z.coerce.number().positive("Quantity to issue must be greater than zero"),
  batchNumber: z.string().optional(),
  locationCode: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const materialConsumptionSchema = z.object({
  workOrderId: z.coerce.number().int().positive("Work Order ID is required"),
  productId: z.coerce.number().int().positive("Product ID is required"),
  quantity: z.coerce.number().positive("Quantity consumed must be greater than zero"),
  notes: z.string().max(500).optional(),
});

export const materialReturnSchema = z.object({
  workOrderId: z.coerce.number().int().positive("Work Order ID is required"),
  productId: z.coerce.number().int().positive("Product ID is required"),
  quantity: z.coerce.number().positive("Quantity to return must be greater than zero"),
  reason: z.string().max(500).optional(),
});

export const scrapRecordSchema = z.object({
  workOrderId: z.coerce.number().int().positive("Work Order ID is required"),
  quantity: z.coerce.number().positive("Scrap quantity must be greater than zero"),
  reason: z.string().min(3, "Reason for scrap is required"),
  operationId: z.coerce.number().int().positive().optional(),
  notes: z.string().max(500).optional(),
});

export const downtimeRecordSchema = z.object({
  workOrderId: z.coerce.number().int().positive("Work Order ID is required"),
  machineOrWorkCenter: z.string().min(1, "Machine or Work Center identifier is required"),
  durationMinutes: z.coerce.number().positive("Downtime duration in minutes must be positive"),
  reason: z.string().min(3, "Downtime reason is required"),
  notes: z.string().max(500).optional(),
});

export const delayRecordSchema = z.object({
  workOrderId: z.coerce.number().int().positive("Work Order ID is required"),
  reason: z.string().min(3, "Delay reason is required"),
  impactMinutes: z.coerce.number().positive().optional(),
  correctiveAction: z.string().optional(),
});

export const transferToQualitySchema = z.object({
  quantity: z.coerce.number().positive("Transfer quantity must be greater than zero"),
  batchNumber: z.string().optional(),
  notes: z.string().max(500).optional(),
});
