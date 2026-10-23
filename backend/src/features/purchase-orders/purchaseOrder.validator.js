import { z } from "zod";

export const purchaseOrderStatusEnum = z.enum([
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "SENT",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CLOSED",
  "CANCELLED",
]);

export const ALLOWED_GST_RATES = [0, 5, 12, 18];

export const createPurchaseOrderItemSchema = z.object({
  productId: z.number().int().positive("Product ID must be a positive integer"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unitPrice: z.number().nonnegative("Unit price cannot be negative"),
  taxPercent: z
    .number()
    .refine((val) => ALLOWED_GST_RATES.includes(val), {
      message: "GST taxPercent must be one of the configured rates: 0, 5, 12, or 18",
    })
    .default(18),
});

export const createPurchaseOrderSchema = z.object({
  vendorId: z.number().int().positive("Vendor ID must be a positive integer"),
  rfqId: z.number().int().positive().optional().nullable(),
  expectedDate: z.string().datetime({ offset: true }).or(z.string().date()).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  items: z.array(createPurchaseOrderItemSchema).min(1, "At least one item is required in the PO"),
});

export const createPoFromRfqSchema = z.object({
  rfqId: z.number().int().positive("RFQ ID must be a positive integer"),
  vendorId: z.number().int().positive("Vendor ID must be a positive integer"),
  expectedDate: z.string().datetime({ offset: true }).or(z.string().date()).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const updatePurchaseOrderStatusSchema = z.object({
  status: purchaseOrderStatusEnum,
  notes: z.string().trim().max(1000).optional().nullable(),
});
