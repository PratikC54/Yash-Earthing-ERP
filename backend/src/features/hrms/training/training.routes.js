import { Router } from "express";
import * as trainingController from "./training.controller.js";
import { authenticate, requireRoles } from "../../auth/auth.middleware.js";

const trainingRouter = Router();

// Public / general view for mandatory courses
trainingRouter.get("/mandatory-courses", trainingController.getMandatoryCourses);

// Check employee safety eligibility for tasks/work orders
trainingRouter.get("/employees/:employeeId/safety-check", trainingController.checkSafetyEligibility);

// Training records
trainingRouter.get("/employees/:employeeId", trainingController.listTrainings);
trainingRouter.post(
  "/employees/:employeeId",
  authenticate,
  requireRoles("ADMIN", "HR_MANAGER", "PRODUCTION_MANAGER"),
  trainingController.recordTraining
);

// Skills
trainingRouter.get("/employees/:employeeId/skills", trainingController.listSkills);
trainingRouter.post(
  "/employees/:employeeId/skills",
  authenticate,
  requireRoles("ADMIN", "HR_MANAGER"),
  trainingController.addSkill
);

export default trainingRouter;
