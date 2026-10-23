import { Router } from "express";
import * as performanceController from "./performance.controller.js";
import { authenticate, requireRoles } from "../../auth/auth.middleware.js";

const performanceRouter = Router();

// Leaderboard endpoint
performanceRouter.get("/leaderboard", performanceController.getLeaderboard);

// Retrieve default configurable scoring weights
performanceRouter.get("/weights", performanceController.getScoringWeights);

// Evaluate specific employee performance
performanceRouter.get("/employees/:employeeId", performanceController.evaluateEmployee);

export default performanceRouter;
