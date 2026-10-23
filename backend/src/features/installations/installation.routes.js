import { Router } from "express";
import * as installationController from "./installation.controller.js";
import { authenticate, requireRoles } from "../auth/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", installationController.listInstallations);
router.get("/:id", installationController.getInstallationById);
router.post(
  "/",
  requireRoles("ADMIN", "PROJECT_MANAGER", "ENGINEER"),
  installationController.scheduleInstallation
);
router.patch(
  "/:id/schedule",
  requireRoles("ADMIN", "PROJECT_MANAGER", "ENGINEER"),
  installationController.scheduleInstallation
);
router.patch(
  "/:id/status",
  requireRoles("ADMIN", "PROJECT_MANAGER", "ENGINEER"),
  installationController.updateStatus
);
router.post(
  "/:id/test-results",
  requireRoles("ADMIN", "QUALITY_INSPECTOR", "ENGINEER", "PROJECT_MANAGER"),
  installationController.recordTestResults
);
router.patch(
  "/:id/test-results",
  requireRoles("ADMIN", "QUALITY_INSPECTOR", "ENGINEER", "PROJECT_MANAGER"),
  installationController.recordTestResults
);
router.post(
  "/:id/handover",
  requireRoles("ADMIN", "PROJECT_MANAGER", "ENGINEER"),
  installationController.completeHandover
);
router.patch(
  "/:id/handover",
  requireRoles("ADMIN", "PROJECT_MANAGER", "ENGINEER"),
  installationController.completeHandover
);

export default router;
