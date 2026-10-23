import { Router } from "express";
import healthRouter from "../features/health/health.routes.js";
import engineeringRouter from "../features/engineering/engineering.routes.js";
import financeRouter from "../features/finance/finance.routes.js";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/engineering", engineeringRouter);
apiRouter.use("/finance", financeRouter);

export default apiRouter;