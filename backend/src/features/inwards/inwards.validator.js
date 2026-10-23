import { z } from "zod";

export const receiptStatusEnum = z.enum([
  "DRAFT",
  "RECEIVED",
  "UNDER_INSPECTION",
  "ACCEPTED",
  "PARTIALLY_ACCEPTED",
  "REJECTED",
]);

export const createGoodsReceiptItemSchema = z.object({
  productId: z.number().int().positive("Product ID must be a positive integer"),
  receivedQuantity: z.number().positive("Received quantity must be greater than 0"),
  batchNumber: z.string().trim().max(100).optional().nullable(),
});

export const createGoodsReceiptSchema = z.object({
  purchaseOrderId: z.number().int().positive("Purchase Order ID must be a positive integer"),
  notes: z.string().trim().max(1000).optional().nullable(),
  items: z.array(createGoodsReceiptItemSchema).min(1, "At least one item is required in the GRN"),
});

export const inspectionItemSchema = z.object({
  itemId: z.number().int().positive("Item ID must be a positive integer"),
  acceptedQuantity: z.number().min(0, "Accepted quantity cannot be negative"),
  rejectedQuantity: z.number().min(0, "Rejected quantity cannot be negative"),
  batchNumber: z.string().trim().max(100).optional().nullable(),
});

export const inspectGoodsReceiptSchema = z.object({
  status: receiptStatusEnum.refine(
    (s) => ["ACCEPTED", "PARTIALLY_ACCEPTED", "REJECTED", "UNDER_INSPECTION"].includes(s),
    { message: "Inspection status must be ACCEPTED, PARTIALLY_ACCEPTED, REJECTED, or UNDER_INSPECTION" }
  ),
  notes: z.string().trim().max(1000).optional().nullable(),
  items: z.array(inspectionItemSchema).min(1, "At least one item must be inspected"),
});
