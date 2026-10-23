import { Router } from "express";
import { authenticateUser } from "../../../middleware/authenticateUser.js";
import { authorizeRoles } from "../../../middleware/authorizeRoles.js";
import { validateRequest } from "../../../middleware/validateRequest.js";
import { workOrderIdParamSchema } from "../planning/planning.validation.js";
import {
  getDashboard,
  getProductionReport,
  issueMaterial,
  reconcileMaterial,
  recordDelay,
  recordDowntime,
  recordMaterialConsumption,
  recordProductionEntry,
  recordScrap,
  returnMaterial,
  startWorkOrder,
  transferToQuality,
} from "./manufacturing.controller.js";
import {
  delayRecordSchema,
  downtimeRecordSchema,
  materialConsumptionSchema,
  materialIssueSchema,
  materialReturnSchema,
  productionEntrySchema,
  scrapRecordSchema,
  startWorkOrderSchema,
  transferToQualitySchema,
} from "./manufacturing.validation.js";

const manufacturingRouter = Router();

// Protect all manufacturing routes
manufacturingRouter.use(authenticateUser);

// Dashboard
manufacturingRouter.get("/dashboard", getDashboard);

// Start execution
manufacturingRouter.post(
  "/work-orders/:id/start",
  authorizeRoles("ADMIN", "PRODUCTION_MANAGER"),
  validateRequest({ params: workOrderIdParamSchema, body: startWorkOrderSchema }),
  startWorkOrder
);

// Daily Production Entries
manufacturingRouter.post(
  "/production-entries",
  authorizeRoles("ADMIN", "PRODUCTION_MANAGER", "ENGINEER"),
  validateRequest({ body: productionEntrySchema }),
  recordProductionEntry
);

// Material Operations
manufacturingRouter.post(
  "/material-issues",
  authorizeRoles("ADMIN", "PRODUCTION_MANAGER"),
  validateRequest({ body: materialIssueSchema }),
  issueMaterial
);

manufacturingRouter.post(
  "/material-consumption",
  authorizeRoles("ADMIN", "PRODUCTION_MANAGER", "ENGINEER"),
  validateRequest({ body: materialConsumptionSchema }),
  recordMaterialConsumption
);

manufacturingRouter.post(
  "/material-returns",
  authorizeRoles("ADMIN", "PRODUCTION_MANAGER"),
  validateRequest({ body: materialReturnSchema }),
  returnMaterial
);

manufacturingRouter.get(
  "/material-reconciliation/:workOrderId",
  reconcileMaterial
);

// Operational Exceptions: Scrap, Downtime, Delay
manufacturingRouter.post(
  "/scrap",
  authorizeRoles("ADMIN", "PRODUCTION_MANAGER", "ENGINEER"),
  validateRequest({ body: scrapRecordSchema }),
  recordScrap
);

manufacturingRouter.post(
  "/downtime",
  authorizeRoles("ADMIN", "PRODUCTION_MANAGER", "ENGINEER"),
  validateRequest({ body: downtimeRecordSchema }),
  recordDowntime
);

manufacturingRouter.post(
  "/delays",
  authorizeRoles("ADMIN", "PRODUCTION_MANAGER", "ENGINEER"),
  validateRequest({ body: delayRecordSchema }),
  recordDelay
);

// Transfer Output to Quality Inspection
manufacturingRouter.post(
  "/outputs/:id/transfer-to-quality",
  authorizeRoles("ADMIN", "PRODUCTION_MANAGER", "ENGINEER"),
  validateRequest({ params: workOrderIdParamSchema, body: transferToQualitySchema }),
  transferToQuality
);

// Reports
manufacturingRouter.get("/reports/production", getProductionReport);

export default manufacturingRouter;
