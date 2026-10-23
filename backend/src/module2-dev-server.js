import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";

// Import all Module 2 Routers
import vendorRouter from "./features/vendors/vendor.routes.js";
import requisitionRouter from "./features/requisitions/requisition.routes.js";
import orderRouter from "./features/orders/order.routes.js";
import inwardsRouter from "./features/inwards/inwards.routes.js";
import inventoryRouter from "./features/inventory/inventory.routes.js";
import dashboardRouter from "./features/procurement-dashboard/procurementDashboard.routes.js";
import healthRouter from "./features/health/health.routes.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Root test route
app.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Yash Group ERP — Module 2 Dev Server",
    version: "1.0.0",
    apiPrefix: "/api/v1",
  });
});

// Mount Module 2 features under /api/v1
const apiRouter = express.Router();
apiRouter.use("/health", healthRouter);
apiRouter.use("/vendors", vendorRouter);
apiRouter.use("/", requisitionRouter);
apiRouter.use("/", orderRouter);
apiRouter.use("/", inwardsRouter);
apiRouter.use("/", inventoryRouter);
apiRouter.use("/", dashboardRouter);

app.use("/api/v1", apiRouter);

app.use(notFound);
app.use(errorHandler);

const PORT = env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`  🚀 Module 2 Backend API running on port ${PORT}`);
  console.log(`  🔗 Base URL: http://localhost:${PORT}/api/v1`);
  console.log(`==================================================\n`);
});
