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
      return authorizeRoles(...(Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]))(req, res, next);
    }
    return next();
  };

  // Purchase Requests
  router.get("/purchase-requests", maybeAuth, requisitionController.listPurchaseRequests);
  router.get("/requisitions", maybeAuth, requisitionController.listPurchaseRequests);
  router.get("/purchase-requests/:id", maybeAuth, requisitionController.getPurchaseRequestById);
  router.get("/requisitions/:id", maybeAuth, requisitionController.getPurchaseRequestById);
  router.post(
    "/purchase-requests",
    maybeAuth,
    maybeRole(["ADMIN", "PROCUREMENT_OFFICER", "ENGINEER"]),
    requisitionController.createPurchaseRequest
  );
  router.post(
    "/requisitions",
    maybeAuth,
    maybeRole(["ADMIN", "PROCUREMENT_OFFICER", "ENGINEER"]),
    requisitionController.createPurchaseRequest
  );
  router.patch(
    "/purchase-requests/:id",
    maybeAuth,
    maybeRole(["ADMIN", "PROCUREMENT_OFFICER"]),
    requisitionController.updatePurchaseRequest
  );
  router.patch(
    "/requisitions/:id",
    maybeAuth,
    maybeRole(["ADMIN", "PROCUREMENT_OFFICER"]),
    requisitionController.updatePurchaseRequest
  );

  // RFQs
  router.get("/rfqs", maybeAuth, requisitionController.listRfqs);
  router.get("/rfqs/:id", maybeAuth, requisitionController.getRfqById);
  router.post(
    "/rfqs",
    maybeAuth,
    maybeRole(["ADMIN", "PROCUREMENT_OFFICER"]),
    requisitionController.createRfq
  );
  router.patch(
    "/rfqs/:id/status",
    maybeAuth,
    maybeRole(["ADMIN", "PROCUREMENT_OFFICER"]),
    requisitionController.updateRfqStatus
  );
  router.post(
    "/rfqs/responses",
    maybeAuth,
    maybeRole(["ADMIN", "PROCUREMENT_OFFICER"]),
    requisitionController.recordRfqResponse
  );
  router.get("/rfqs/:id/comparison", maybeAuth, requisitionController.compareRfqQuotes);
  router.post(
    "/rfqs/:id/award",
    maybeAuth,
    maybeRole(["ADMIN", "PROCUREMENT_OFFICER"]),
    requisitionController.awardRfq
  );

  return router;
}

export default createRequisitionRouter();
