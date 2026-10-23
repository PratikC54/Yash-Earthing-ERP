import { Router } from "express";
import dispatchRouter from "./dispatch/dispatch.routes.js";
import manufacturingRouter from "./manufacturing/manufacturing.routes.js";
import planningRouter from "./planning/planning.routes.js";
import qualityRouter from "./quality/quality.routes.js";

const productionQualityRouter = Router();

// Submodule M4.1 — Planning & Work Orders
productionQualityRouter.use("/planning", planningRouter);

// Submodule M4.2 — Manufacturing Execution
productionQualityRouter.use("/manufacturing", manufacturingRouter);

// Submodule M4.3 — Quality Control, Rejection & Output
productionQualityRouter.use("/quality", qualityRouter);

// Submodule M4.4 — Dispatch Management
productionQualityRouter.use("/dispatch", dispatchRouter);

// Direct root alias for work orders and planning shortcuts
productionQualityRouter.use("/", planningRouter);

export default productionQualityRouter;
