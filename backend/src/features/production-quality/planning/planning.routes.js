import { Router } from "express";
import { authenticateUser } from "../../../middleware/authenticateUser.js";
import { authorizeRoles } from "../../../middleware/authorizeRoles.js";
import { validateRequest } from "../../../middleware/validateRequest.js";
import {
  approveWorkOrder,
  cancelWorkOrder,
  checkMaterialAvailability,
  createWorkOrder,
  getDashboard,
  getProductionCalendar,
  getReferenceData,
  getWorkOrderById,
  getWorkOrderHistory,
  holdWorkOrder,
  listWorkOrders,
  rejectWorkOrder,
  releaseWorkOrder,
  recordWorkOrderCompletion,
  resumeWorkOrder,
  submitWorkOrder,
  updateWorkOrder,
} from "./planning.controller.js";
import {
  createWorkOrderSchema,
  listWorkOrdersQuerySchema,
  productionCalendarQuerySchema,
  transitionStatusSchema,
  updateWorkOrderSchema,
  workOrderIdInParamsSchema,
  workOrderIdParamSchema,
} from "./planning.validation.js";

const planningRouter = Router();

// Protect all planning routes
planningRouter.use(authenticateUser);

// Production Dashboard
planningRouter.get("/dashboard", getDashboard);
planningRouter.get("/reference-data", getReferenceData);

// Production Calendar
planningRouter.get(
  "/production-calendar",
  validateRequest({ query: productionCalendarQuerySchema }),
  getProductionCalendar
);

// Material Availability Check
planningRouter.get(
  "/material-availability/:workOrderId",
  validateRequest({ params: workOrderIdInParamsSchema }),
  checkMaterialAvailability
);

// Work Orders Core Endpoints
planningRouter.post(
  "/work-orders",
  authorizeRoles("ADMIN", "PRODUCTION_MANAGER", "ENGINEER"),
  validateRequest({ body: createWorkOrderSchema }),
  createWorkOrder
);

planningRouter.get(
  "/work-orders",
  validateRequest({ query: listWorkOrdersQuerySchema }),
  listWorkOrders
);

planningRouter.get(
  "/work-orders/:id",
  validateRequest({ params: workOrderIdParamSchema }),
  getWorkOrderById
);

planningRouter.patch(
  "/work-orders/:id",
  authorizeRoles("ADMIN", "PRODUCTION_MANAGER", "ENGINEER"),
  validateRequest({ params: workOrderIdParamSchema, body: updateWorkOrderSchema }),
  updateWorkOrder
);

// Work Order Lifecycle Actions
planningRouter.post(
  "/work-orders/:id/submit",
  authorizeRoles("ADMIN", "PRODUCTION_MANAGER", "ENGINEER"),
  validateRequest({ params: workOrderIdParamSchema }),
  submitWorkOrder
);

planningRouter.post(
  "/work-orders/:id/approve",
  authorizeRoles("ADMIN", "PRODUCTION_MANAGER"),
  validateRequest({ params: workOrderIdParamSchema }),
  approveWorkOrder
);

planningRouter.post(
  "/work-orders/:id/reject",
  authorizeRoles("ADMIN", "PRODUCTION_MANAGER"),
  validateRequest({ params: workOrderIdParamSchema, body: transitionStatusSchema }),
  rejectWorkOrder
);

planningRouter.post(
  "/work-orders/:id/release",
  authorizeRoles("ADMIN", "PRODUCTION_MANAGER"),
  validateRequest({ params: workOrderIdParamSchema }),
  releaseWorkOrder
);

planningRouter.post(
  "/work-orders/:id/hold",
  authorizeRoles("ADMIN", "PRODUCTION_MANAGER"),
  validateRequest({ params: workOrderIdParamSchema, body: transitionStatusSchema }),
  holdWorkOrder
);

planningRouter.post(
  "/work-orders/:id/resume",
  authorizeRoles("ADMIN", "PRODUCTION_MANAGER"),
  validateRequest({ params: workOrderIdParamSchema }),
  resumeWorkOrder
);

planningRouter.post(
  "/work-orders/:id/cancel",
  authorizeRoles("ADMIN", "PRODUCTION_MANAGER"),
  validateRequest({ params: workOrderIdParamSchema, body: transitionStatusSchema }),
  cancelWorkOrder
);

planningRouter.post(
  "/work-orders/:id/completion",
  authorizeRoles("ADMIN", "PRODUCTION_MANAGER", "ENGINEER"),
  validateRequest({ params: workOrderIdParamSchema }),
  recordWorkOrderCompletion
);

planningRouter.get(
  "/work-orders/:id/history",
  validateRequest({ params: workOrderIdParamSchema }),
  getWorkOrderHistory
);

export default planningRouter;
