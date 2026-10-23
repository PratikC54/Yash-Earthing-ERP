import { z } from "zod";

export const inspectionIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Inspection ID must be a positive integer"),
});

export const assignInspectorSchema = z.object({
  inspectorId: z.coerce.number().int().positive("Inspector ID must be a positive integer"),
  notes: z.string().max(500).optional(),
});

export const recordInspectionResultsSchema = z.object({
  acceptedQuantity: z.coerce.number().min(0, "Accepted quantity cannot be negative"),
  rejectedQuantity: z.coerce.number().min(0, "Rejected quantity cannot be negative"),
  measurements: z
    .object({
      dimensional: z.array(z.record(z.any())).optional(),
      visual: z.array(z.record(z.any())).optional(),
      parameters: z.record(z.any()).optional(),
      defects: z.array(z.record(z.any())).optional(),
    })
    .optional(),
  evidenceNotes: z.string().max(1000).optional(),
});

export const inspectionDecisionSchema = z.object({
  decision: z.enum(["PASS", "REWORK", "REJECTED", "FAIL", "HOLD"]),
  quantity: z.coerce.number().positive().optional(),
  acceptedQuantity: z.coerce.number().min(0).optional(),
  rejectedQuantity: z.coerce.number().min(0).optional(),
  reworkQuantity: z.coerce.number().min(0).optional(),
  officer: z.string().optional(),
  reason: z.string().max(1000).optional(),
  notes: z.string().max(1000).optional(),
  defectReason: z.string().optional(),
  defectDescription: z.string().optional(),
  correctiveAction: z.string().optional(),
  rootCause: z.string().optional(),
  responsiblePerson: z.string().optional(),
  targetCompletionDate: z.string().optional(),
});

export const resolveCAPASchema = z.object({
  resolutionNotes: z.string().min(3, "Resolution notes are required"),
  verificationResult: z.string().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).default("RESOLVED"),
});

export const nonConformanceReportSchema = z.object({
  inspectionId: z.coerce.number().int().positive("Inspection ID is required"),
  defectType: z.string().min(1, "Defect type is required"),
  severity: z.enum(["MINOR", "MAJOR", "CRITICAL"]),
  description: z.string().min(5, "Detailed description is required"),
  rootCause: z.string().optional(),
  proposedAction: z.enum(["REWORK", "SCRAP", "CONCESSION"]),
});

export const correctiveActionSchema = z.object({
  ncrId: z.string().min(1, "NCR reference is required"),
  actionDescription: z.string().min(5, "Action description is required"),
  assignedToId: z.coerce.number().int().positive().optional(),
  targetDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
});

export const scrapApprovalSchema = z.object({
  inspectionId: z.coerce.number().int().positive("Inspection ID is required"),
  quantity: z.coerce.number().positive("Quantity to scrap must be positive"),
  reason: z.string().min(3, "Reason for scrap approval is required"),
  scrapCost: z.coerce.number().min(0).optional(),
});

export const finishedGoodsReleaseSchema = z.object({
  inspectionId: z.coerce.number().int().positive("Inspection ID is required"),
  warehouseLocation: z.string().trim().min(1, "Warehouse location is required"),
  batchNumber: z.string().optional(),
  notes: z.string().max(500).optional(),
});
