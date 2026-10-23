import { Router } from "express";
import * as inventoryController from "./inventory.controller.js";

export function createInventoryRouter({ authenticate, authorizeRoles } = {}) {
  const router = Router();

  const maybeAuth = (req, res, next) => {
    if (typeof authenticate === "function") {
      return authenticate(req, res, next);
    }
    return next();
  };

  const maybeRole = (allowedRoles) => (req, res, next) => {
    if (typeof authorizeRoles === "function") {
      return authorizeRoles(allowedRoles)(req, res, next);
    }
    return next();
  };

  router.get("/inventory", maybeAuth, inventoryController.listInventory);
  router.get("/inventory/products/:productId", maybeAuth, inventoryController.getInventoryByProductId);
  router.get("/inventory/movements", maybeAuth, inventoryController.listMovements);
  router.post(
    "/inventory/adjustments",
    maybeAuth,
    maybeRole(["ADMIN", "STORE_MANAGER"]),
    inventoryController.recordInventoryAdjustment
  );

  return router;
}

export default createInventoryRouter();
