import { z } from "zod";

export const purchaseRequestStatusEnum = z.enum([
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "CONVERTED",
]);

export const rfqStatusEnum = z.enum([
  "DRAFT",
  "SENT",
  "QUOTATIONS_RECEIVED",
  "EVALUATED",
  "AWARDED",
  "CANCELLED",
]);

export const createPurchaseRequestItemSchema = z.object({
  productId: z.number().int().positive("Product ID must be a positive integer"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const createPurchaseRequestSchema = z.object({
  salesOrderId: z.number().int().positive().optional().nullable(),
  requiredBy: z.string().datetime({ offset: true }).or(z.string().date()).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  items: z.array(createPurchaseRequestItemSchema).min(1, "At least one item is required"),
});

export const updatePurchaseRequestSchema = z.object({
  status: purchaseRequestStatusEnum.optional(),
  requiredBy: z.string().datetime({ offset: true }).or(z.string().date()).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const createRfqSchema = z.object({
  purchaseRequestId: z.number().int().positive().optional().nullable(),
  dueAt: z.string().datetime({ offset: true }).or(z.string().date()).optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().positive(),
      })
    )
    .optional(),
});

export const updateRfqStatusSchema = z.object({
  status: rfqStatusEnum,
});

export const rfqResponseItemSchema = z.object({
  productId: z.number().int().positive("Product ID must be a positive integer"),
  quantity: z.number().positive("Quantity must be positive"),
  unitPrice: z.number().nonnegative("Unit price cannot be negative"),
  taxPercent: z.number().min(0).max(100).default(0),
});

export const recordRfqResponseSchema = z.object({
  rfqId: z.number().int().positive("RFQ ID must be a positive integer"),
  vendorId: z.number().int().positive("Vendor ID must be a positive integer"),
  validUntil: z.string().datetime({ offset: true }).or(z.string().date()).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  items: z.array(rfqResponseItemSchema).min(1, "At least one quotation item is required"),
});

export const awardRfqSchema = z.object({
  vendorId: z.number().int().positive("Awarded Vendor ID must be a positive integer"),
});
