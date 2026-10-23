import { Router } from "express";
import { authenticateUser } from "../../../middleware/authenticateUser.js";
import { authorizeRoles } from "../../../middleware/authorizeRoles.js";
import { validateRequest } from "../../../middleware/validateRequest.js";
import {
  approveInspection,
  assignInspector,
  getEligibleInspectors,
  approveScrap,
  getDashboard,
  getInspectionById,
  getInspectionQueue,
  getInspectionReport,
  holdInspection,
  listCAPARecords,
  listNonConformances,
  recordCorrectiveAction,
  recordNonConformance,
  recordResults,
  rejectInspection,
  releaseFinishedGoods,
  requestRework,
  resolveCAPA,
  startInspection,
  submitDecision,
} from "./quality.controller.js";
import {
  assignInspectorSchema,
  finishedGoodsReleaseSchema,
  inspectionDecisionSchema,
  inspectionIdParamSchema,
  recordInspectionResultsSchema,
  scrapApprovalSchema,
} from "./quality.validation.js";

const qualityRouter = Router();

// Protect all quality routes
qualityRouter.use(authenticateUser);

// Dashboard & Queue
qualityRouter.get("/dashboard", getDashboard);
qualityRouter.get("/inspection-queue", getInspectionQueue);

// Eligible Inspectors for Manual Assignment
qualityRouter.get("/eligible-inspectors", getEligibleInspectors);

// Single Inspection
qualityRouter.get(
  "/inspections/:id",
  validateRequest({ params: inspectionIdParamSchema }),
  getInspectionById
);

// Manual Inspector Assignment
qualityRouter.post(
  "/inspections/:id/assign",
  authorizeRoles("ADMIN", "PRODUCTION_MANAGER", "QUALITY_INSPECTOR"),
  validateRequest({ params: inspectionIdParamSchema, body: assignInspectorSchema }),
  assignInspector
);

// Start Inspection
qualityRouter.post(
  "/inspections/:id/start",
  authorizeRoles("ADMIN", "QUALITY_INSPECTOR", "PRODUCTION_MANAGER"),
  validateRequest({ params: inspectionIdParamSchema }),
  startInspection
);

// Record Measurements & Results
qualityRouter.post(
  "/inspections/:id/results",
  authorizeRoles("ADMIN", "QUALITY_INSPECTOR", "PRODUCTION_MANAGER"),
  validateRequest({ params: inspectionIdParamSchema, body: recordInspectionResultsSchema }),
  recordResults
);

// Unified Quality Decision (Pass, Rework, Rejected)
qualityRouter.post(
  "/inspections/:id/decision",
  authorizeRoles("ADMIN", "QUALITY_INSPECTOR", "PRODUCTION_MANAGER"),
  validateRequest({ params: inspectionIdParamSchema, body: inspectionDecisionSchema }),
  submitDecision
);

// CAPA Records
qualityRouter.get("/capa", listCAPARecords);
qualityRouter.post(
  "/capa/:id/resolve",
  authorizeRoles("ADMIN", "QUALITY_INSPECTOR", "PRODUCTION_MANAGER"),
  resolveCAPA
);

// Decisions: Approve, Hold, Reject, Rework
qualityRouter.post(
  "/inspections/:id/approve",
  authorizeRoles("ADMIN", "QUALITY_INSPECTOR", "PRODUCTION_MANAGER"),
  validateRequest({ params: inspectionIdParamSchema }),
  approveInspection
);

qualityRouter.post(
  "/inspections/:id/hold",
  authorizeRoles("ADMIN", "QUALITY_INSPECTOR", "PRODUCTION_MANAGER"),
  validateRequest({ params: inspectionIdParamSchema }),
  holdInspection
);

qualityRouter.post(
  "/inspections/:id/reject",
  authorizeRoles("ADMIN", "QUALITY_INSPECTOR", "PRODUCTION_MANAGER"),
  validateRequest({ params: inspectionIdParamSchema }),
  rejectInspection
);

qualityRouter.post(
  "/inspections/:id/rework",
  authorizeRoles("ADMIN", "QUALITY_INSPECTOR", "PRODUCTION_MANAGER"),
  validateRequest({ params: inspectionIdParamSchema }),
  requestRework
);

// Non-Conformance, CAPA & Scrap Approval
qualityRouter.get("/non-conformance", listNonConformances);

qualityRouter.post(
  "/non-conformance",
  authorizeRoles("ADMIN", "QUALITY_INSPECTOR", "PRODUCTION_MANAGER"),
  recordNonConformance
);

qualityRouter.post(
  "/corrective-actions",
  authorizeRoles("ADMIN", "QUALITY_INSPECTOR", "PRODUCTION_MANAGER"),
  recordCorrectiveAction
);

qualityRouter.post(
  "/scrap-approvals",
  authorizeRoles("ADMIN", "QUALITY_INSPECTOR", "PRODUCTION_MANAGER"),
  validateRequest({ body: scrapApprovalSchema }),
  approveScrap
);

// Finished Goods Release
qualityRouter.post(
  "/finished-goods-releases",
  authorizeRoles("ADMIN", "QUALITY_INSPECTOR", "PRODUCTION_MANAGER"),
  validateRequest({ body: finishedGoodsReleaseSchema }),
  releaseFinishedGoods
);

// Reports
qualityRouter.get("/reports/inspection", getInspectionReport);

export default qualityRouter;
