import { Router } from "express";
import authRouter from "../features/auth/auth.routes.js";
import healthRouter from "../features/health/health.routes.js";
import leadRouter from "../features/leads/lead.routes.js";
import quotationRouter from "../features/quotations/quotation.routes.js";
import orderRouter from "../features/orders/order.routes.js";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/leads", leadRouter);
apiRouter.use("/quotations", quotationRouter);
apiRouter.use("/orders", orderRouter);

export default apiRouter;
