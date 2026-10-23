import { z } from "zod";

export const createDispatchSchema = z.object({
  inspectionId: z.coerce.number().int().positive("Inspection ID is required"),
  workOrderId: z.coerce.number().int().positive().optional(),
  quantity: z.coerce.number().positive("Dispatch quantity must be greater than zero"),
  destinationAddress: z.string().min(3, "Destination address is required"),
  transporterName: z.string().min(2, "Transporter name is required"),
  vehicleNumber: z.string().min(3, "Vehicle registration number is required"),
  lrNumber: z.string().optional(),
  deliveryChallanNo: z.string().optional(),
  deliveryNotes: z.string().max(500).optional(),
  dispatchDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
});

export const dispatchIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Dispatch ID must be a positive integer"),
});
