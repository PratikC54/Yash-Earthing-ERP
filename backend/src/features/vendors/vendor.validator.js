import { z } from "zod";

export const createVendorSchema = z.object({
  code: z
    .string({ required_error: "Vendor code is required" })
    .trim()
    .min(2, "Vendor code must be at least 2 characters")
    .max(50, "Vendor code cannot exceed 50 characters"),
  name: z
    .string({ required_error: "Vendor name is required" })
    .trim()
    .min(2, "Vendor name must be at least 2 characters")
    .max(255, "Vendor name cannot exceed 255 characters"),
  contactName: z.string().trim().max(255).optional().nullable(),
  email: z.string().trim().email("Invalid email address").optional().nullable().or(z.literal("")),
  phone: z.string().trim().max(50).optional().nullable(),
  alternatePhone: z.string().trim().max(50).optional().nullable(),
  gstin: z.string().trim().max(30).optional().nullable(),
  pan: z.string().trim().max(30).optional().nullable(),
  address: z.any().optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(100).optional().nullable(),
  category: z.string().trim().max(100).optional().nullable(),
  categories: z.any().optional().nullable(),
  makesSupplied: z.any().optional().nullable(),
  paymentTerms: z.string().trim().max(255).optional().nullable(),
  bankDetails: z.any().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  rating: z.coerce.number().min(0).max(5).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateVendorSchema = createVendorSchema.partial().omit({ code: true }).extend({
  code: z.string().trim().min(2).max(50).optional(),
});

export const listVendorQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  sortBy: z.enum(["name", "code", "createdAt", "rating"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export function validateBody(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const error = new Error("Validation failed");
      error.statusCode = 400;
      error.errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return next(error);
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const error = new Error("Invalid query parameters");
      error.statusCode = 400;
      error.errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return next(error);
    }
    req.query = result.data;
    next();
  };
}
