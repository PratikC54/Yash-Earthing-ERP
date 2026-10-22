import { Router } from "express";
import authRouter from "../features/auth/auth.routes.js";
import healthRouter from "../features/health/health.routes.js";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);

export default apiRouter;
