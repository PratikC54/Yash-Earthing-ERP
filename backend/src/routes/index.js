import { Router } from "express";
import authRouter from "../features/auth/auth.routes.js";
import healthRouter from "../features/health/health.routes.js";
import productionQualityRouter from "../features/production-quality/productionQuality.routes.js";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/production-quality", productionQualityRouter);
apiRouter.use("/pq", productionQualityRouter);

export default apiRouter;
