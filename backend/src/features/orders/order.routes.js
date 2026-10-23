import { Router } from "express";
import * as orderController from "./order.controller.js";

export function createOrderRouter({ authenticate, authorizeRoles } = {}) {
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

  router.get("/purchase-orders", maybeAuth, orderController.listPurchaseOrders);
  router.get("/purchase-orders/:id", maybeAuth, orderController.getPurchaseOrderById);
  router.post(
    "/purchase-orders",
    maybeAuth,
    maybeRole(["ADMIN", "PROCUREMENT"]),
    orderController.createPurchaseOrder
  );
  router.post(
    "/purchase-orders/from-rfq",
    maybeAuth,
    maybeRole(["ADMIN", "PROCUREMENT"]),
    orderController.createPurchaseOrderFromRfq
  );
  router.patch(
    "/purchase-orders/:id/status",
    maybeAuth,
    maybeRole(["ADMIN", "PROCUREMENT", "MANAGEMENT"]),
    orderController.updatePurchaseOrderStatus
  );

  return router;
}

export default createOrderRouter();
