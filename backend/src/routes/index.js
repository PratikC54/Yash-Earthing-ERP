import { Router } from "express";
import healthRouter from "../features/health/health.routes.js";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);

export default apiRouter;
