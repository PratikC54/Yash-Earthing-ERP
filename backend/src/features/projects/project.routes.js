import { Router } from "express";
import * as projectController from "./project.controller.js";
import { authenticate, requireRoles } from "../auth/auth.middleware.js";

const router = Router();

// All project routes require valid authenticated session
router.use(authenticate);

router.get("/dashboard-kpis", projectController.getDashboardMetrics);
router.get("/dashboard/metrics", projectController.getDashboardMetrics);
router.get("/", projectController.listProjects);
router.get("/:id", projectController.getProjectById);
router.post(
  "/",
  requireRoles("ADMIN", "PROJECT_MANAGER", "ENGINEER", "SALES_MANAGER"),
  projectController.createProject
);
router.patch(
  "/:id",
  requireRoles("ADMIN", "PROJECT_MANAGER", "ENGINEER"),
  projectController.updateProject
);
router.post(
  "/:id/tasks",
  requireRoles("ADMIN", "PROJECT_MANAGER", "ENGINEER"),
  projectController.addTaskToProject
);
router.patch(
  "/:id/tasks/:taskId/status",
  requireRoles("ADMIN", "PROJECT_MANAGER", "ENGINEER"),
  projectController.updateTaskStatus
);

export default router;
