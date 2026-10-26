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
      return authorizeRoles(...(Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]))(req, res, next);
    }
    return next();
  };

  router.get("/goods-receipts", maybeAuth, inwardsController.listGoodsReceipts);
  router.get("/inwards", maybeAuth, inwardsController.listGoodsReceipts);
  router.get("/goods-receipts/:id", maybeAuth, inwardsController.getGoodsReceiptById);
  router.get("/inwards/:id", maybeAuth, inwardsController.getGoodsReceiptById);
  router.post(
    "/goods-receipts",
    maybeAuth,
    maybeRole(["ADMIN", "FACTORY_INWARD_OFFICER", "PROCUREMENT_OFFICER"]),
    inwardsController.createGoodsReceipt
  );
  router.post(
    "/inwards",
    maybeAuth,
    maybeRole(["ADMIN", "FACTORY_INWARD_OFFICER", "PROCUREMENT_OFFICER"]),
    inwardsController.createGoodsReceipt
  );
  router.post(
    "/inwards/receipts",
    maybeAuth,
    maybeRole(["ADMIN", "FACTORY_INWARD_OFFICER", "PROCUREMENT_OFFICER"]),
    inwardsController.createGoodsReceipt
  );
  router.post(
    "/goods-receipts/:id/inspect",
    maybeAuth,
    maybeRole(["ADMIN", "QUALITY_INSPECTOR"]),
    inwardsController.inspectAndPostGoodsReceipt
  );
  router.post(
    "/inwards/:id/inspect",
    maybeAuth,
    maybeRole(["ADMIN", "QUALITY_INSPECTOR"]),
    inwardsController.inspectAndPostGoodsReceipt
  );
  router.post(
    "/inwards/receipts/:id/inspect",
    maybeAuth,
    maybeRole(["ADMIN", "QUALITY_INSPECTOR"]),
    inwardsController.inspectAndPostGoodsReceipt
  );

  return router;
}

export default createInwardsRouter();
