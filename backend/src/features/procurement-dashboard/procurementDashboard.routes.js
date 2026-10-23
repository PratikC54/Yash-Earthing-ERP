import { Router } from "express";
import * as dashboardController from "./procurementDashboard.controller.js";

export function createProcurementDashboardRouter({ authenticate } = {}) {
  const router = Router();

  const maybeAuth = (req, res, next) => {
    if (typeof authenticate === "function") {
      return authenticate(req, res, next);
    }
    return next();
  };

  router.get("/procurement/dashboard-kpis", maybeAuth, dashboardController.getDashboardMetrics);

  return router;
}

export default createProcurementDashboardRouter();
