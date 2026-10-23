import { Router } from "express";
import * as vendorController from "./vendor.controller.js";
import {
  validateBody,
  validateQuery,
  createVendorSchema,
  updateVendorSchema,
  listVendorQuerySchema,
} from "./vendor.validator.js";

/**
 * Vendor router factory.
 * Prepares endpoints for integration with Module 7 authentication and authorization middleware.
 *
 * Expected Module 7 middleware contract:
 * - authenticate: verifies Bearer JWT / session and populates req.user
 * - authorizeRoles: checks if req.user.role matches allowed roles (e.g. ADMIN, PROCUREMENT_OFFICER)
 *
 * @param {Object} [options]
 * @param {import("express").RequestHandler} [options.authenticate]
 * @param {Function} [options.authorizeRoles]
 * @returns {Router}
 */
export function createVendorRouter({ authenticate, authorizeRoles } = {}) {
  const router = Router();

  // Read endpoints (Vendor Directory & Details)
  // Can be accessed by authenticated team members across M1, M2, M3, M6
  const readAuth = authenticate ?? ((_req, _res, next) => next());
  router.get("/", readAuth, validateQuery(listVendorQuerySchema), vendorController.handleListVendors);
  router.get("/:id", readAuth, vendorController.handleGetVendorById);

  // Write endpoints (Vendor Onboarding, Updates, Deactivation)
  // Protected for Procurement Officer and Admin
  const writeAuth = authenticate ?? ((_req, _res, next) => next());
  const writeRole = authorizeRoles
    ? authorizeRoles(["ADMIN", "PROCUREMENT_OFFICER"])
    : ((_req, _res, next) => next());

  router.post(
    "/",
    writeAuth,
    writeRole,
    validateBody(createVendorSchema),
    vendorController.handleCreateVendor,
  );

  router.patch(
    "/:id",
    writeAuth,
    writeRole,
    validateBody(updateVendorSchema),
    vendorController.handleUpdateVendor,
  );

  router.delete(
    "/:id",
    writeAuth,
    writeRole,
    vendorController.handleDeactivateVendor,
  );

  router.delete(
    "/:id/permanent",
    writeAuth,
    writeRole,
    vendorController.handleDeleteVendor,
  );

  return router;
}

const defaultVendorRouter = createVendorRouter();
export default defaultVendorRouter;
