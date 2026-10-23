import { z } from "zod";

export const movementTypeEnum = z.enum([
  "STOCK_IN",
  "STOCK_OUT",
  "RESERVATION",
  "RELEASE_RESERVATION",
  "ISSUE_TO_WORK_ORDER",
  "DISPATCH",
  "RETURN",
  "ADJUSTMENT",
]);

export const inventoryAdjustmentSchema = z.object({
  productId: z.number().int().positive("Product ID must be a positive integer"),
  movementType: z.enum(["ADJUSTMENT", "RESERVATION", "RELEASE_RESERVATION"]),
  quantity: z.number().positive("Quantity must be greater than 0"),
  notes: z.string().trim().max(1000).optional().nullable(),
  batchNumber: z.string().trim().max(100).optional().nullable(),
});

export const updateReorderLevelSchema = z.object({
  reorderLevel: z.number().nonnegative("Reorder level cannot be negative"),
  warehouseLocation: z.string().trim().max(100).optional(),
});
