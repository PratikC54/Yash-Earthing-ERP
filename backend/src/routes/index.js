import { Router } from "express";
import healthRouter from "../features/health/health.routes.js";
import productionQualityRouter from "../features/production-quality/productionQuality.routes.js";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/production-quality", productionQualityRouter);

export default apiRouter;
