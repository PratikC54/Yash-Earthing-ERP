import { Router } from "express";
import * as serviceTicketController from "./serviceTicket.controller.js";
import { authenticate, requireRoles } from "../auth/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", serviceTicketController.listServiceTickets);
router.get("/:id", serviceTicketController.getServiceTicketById);
router.post(
  "/",
  requireRoles("ADMIN", "SERVICE_EXECUTIVE", "PROJECT_MANAGER", "ENGINEER", "SALES_CONSULTANT"),
  serviceTicketController.createServiceTicket
);
router.patch(
  "/:id/assign",
  requireRoles("ADMIN", "SERVICE_EXECUTIVE", "PROJECT_MANAGER"),
  serviceTicketController.assignServiceEngineer
);
router.patch(
  "/:id/status",
  requireRoles("ADMIN", "ENGINEER", "SERVICE_EXECUTIVE", "PROJECT_MANAGER"),
  serviceTicketController.updateServiceStatus
);
router.post(
  "/:id/resolve",
  requireRoles("ADMIN", "ENGINEER", "SERVICE_EXECUTIVE", "PROJECT_MANAGER"),
  serviceTicketController.resolveServiceTicket
);
router.patch(
  "/:id/resolve",
  requireRoles("ADMIN", "ENGINEER", "SERVICE_EXECUTIVE", "PROJECT_MANAGER"),
  serviceTicketController.resolveServiceTicket
);

export default router;
