import { Router } from "express";
import healthRouter from "../features/health/health.routes.js";
import engineeringRouter from "../features/engineering/engineering.routes.js";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/engineering", engineeringRouter);

export default apiRouter;