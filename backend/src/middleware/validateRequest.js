import { ApiError } from "../utils/apiResponse.js";

/**
 * Higher-order middleware to validate req.body, req.query, or req.params with a Zod schema.
 * @param {object} schemas - { body?: ZodSchema, query?: ZodSchema, params?: ZodSchema }
 */
export function validateRequest(schemas = {}) {
  return (req, _res, next) => {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      next();
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        const formattedErrors = err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        return next(new ApiError(400, "Validation failed", formattedErrors));
      }
      next(err);
    }
  };
}

export default validateRequest;
