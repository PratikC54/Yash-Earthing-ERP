import { Router } from "express";
import * as inwardsController from "./inwards.controller.js";

export function createInwardsRouter({ authenticate, authorizeRoles } = {}) {
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

  router.get("/goods-receipts", maybeAuth, inwardsController.listGoodsReceipts);
  router.get("/goods-receipts/:id", maybeAuth, inwardsController.getGoodsReceiptById);
  router.post(
    "/goods-receipts",
    maybeAuth,
    maybeRole(["ADMIN", "STORE_MANAGER", "PROCUREMENT"]),
    inwardsController.createGoodsReceipt
  );
  router.post(
    "/goods-receipts/:id/inspect",
    maybeAuth,
    maybeRole(["ADMIN", "QUALITY_INSPECTOR", "STORE_MANAGER"]),
    inwardsController.inspectAndPostGoodsReceipt
  );

  return router;
}

export default createInwardsRouter();
