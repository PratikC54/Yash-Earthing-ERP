import { Router } from "express";
import * as requisitionController from "./requisition.controller.js";

export function createRequisitionRouter({ authenticate, authorizeRoles } = {}) {
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

  // Purchase Requests
  router.get("/purchase-requests", maybeAuth, requisitionController.listPurchaseRequests);
  router.get("/purchase-requests/:id", maybeAuth, requisitionController.getPurchaseRequestById);
  router.post(
    "/purchase-requests",
    maybeAuth,
    maybeRole(["ADMIN", "PROCUREMENT", "ENGINEER", "STORE_MANAGER"]),
    requisitionController.createPurchaseRequest
  );
  router.patch(
    "/purchase-requests/:id",
    maybeAuth,
    maybeRole(["ADMIN", "PROCUREMENT", "STORE_MANAGER"]),
    requisitionController.updatePurchaseRequest
  );

  // RFQs
  router.get("/rfqs", maybeAuth, requisitionController.listRfqs);
  router.get("/rfqs/:id", maybeAuth, requisitionController.getRfqById);
  router.post(
    "/rfqs",
    maybeAuth,
    maybeRole(["ADMIN", "PROCUREMENT"]),
    requisitionController.createRfq
  );
  router.patch(
    "/rfqs/:id/status",
    maybeAuth,
    maybeRole(["ADMIN", "PROCUREMENT"]),
    requisitionController.updateRfqStatus
  );
  router.post(
    "/rfqs/responses",
    maybeAuth,
    maybeRole(["ADMIN", "PROCUREMENT"]),
    requisitionController.recordRfqResponse
  );
  router.get("/rfqs/:id/comparison", maybeAuth, requisitionController.compareRfqQuotes);
  router.post(
    "/rfqs/:id/award",
    maybeAuth,
    maybeRole(["ADMIN", "PROCUREMENT"]),
    requisitionController.awardRfq
  );

  return router;
}

export default createRequisitionRouter();
