import { Router } from "express";
import * as mfgController from "./manufacturing.controller.js";

const manufacturingHrmsRouter = Router();

manufacturingHrmsRouter.get("/readiness", mfgController.getReadinessSummary);
manufacturingHrmsRouter.get("/staffing-risk", mfgController.evaluateStaffingRisk);
manufacturingHrmsRouter.post("/allocate", mfgController.allocateWorkforce);
manufacturingHrmsRouter.post("/shift-handover", mfgController.recordShiftHandover);

export default manufacturingHrmsRouter;
