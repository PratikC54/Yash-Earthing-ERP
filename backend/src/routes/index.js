import { Router } from "express";
import authRouter from "../features/auth/auth.routes.js";
import healthRouter from "../features/health/health.routes.js";
import leadRouter from "../features/leads/lead.routes.js";
import quotationRouter from "../features/quotations/quotation.routes.js";
import orderRouter from "../features/orders/order.routes.js";
import engineeringRouter from "../features/engineering/engineering.routes.js";

// Module 2 Routers
import vendorRouter from "../features/vendors/vendor.routes.js";
import requisitionRouter from "../features/requisitions/requisition.routes.js";
import purchaseOrderRouter from "../features/purchase-orders/purchaseOrder.routes.js";
import inwardsRouter from "../features/inwards/inwards.routes.js";
import inventoryRouter from "../features/inventory/inventory.routes.js";
import dashboardRouter from "../features/procurement-dashboard/procurementDashboard.routes.js";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/leads", leadRouter);
apiRouter.use("/quotations", quotationRouter);
apiRouter.use("/orders", orderRouter);
apiRouter.use("/engineering", engineeringRouter);

// Mount Module 2 features under /api/v1
apiRouter.use("/vendors", vendorRouter);
apiRouter.use("/", requisitionRouter);
apiRouter.use("/", purchaseOrderRouter);
apiRouter.use("/", inwardsRouter);
apiRouter.use("/", inventoryRouter);
apiRouter.use("/", dashboardRouter);

// Module 7: HRMS Workforce
import hrmsRouter from "../features/hrms/hrms.routes.js";
apiRouter.use("/hrms", hrmsRouter);

export default apiRouter;

