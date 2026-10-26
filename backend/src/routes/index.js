import { Router } from "express";
import authRouter from "../features/auth/auth.routes.js";
import healthRouter from "../features/health/health.routes.js";
import productionQualityRouter from "../features/production-quality/productionQuality.routes.js";
import notificationRouter from "../features/notifications/notification.routes.js";
import leadRouter from "../features/leads/lead.routes.js";
import quotationRouter from "../features/quotations/quotation.routes.js";
import orderRouter from "../features/orders/order.routes.js";
import engineeringRouter from "../features/engineering/engineering.routes.js";
import financeRouter from "../features/finance/finance.routes.js";

// Module 2 Routers
import { createInwardsRouter } from "../features/inwards/inwards.routes.js";
import { createInventoryRouter } from "../features/inventory/inventory.routes.js";
import { createOrderRouter } from "../features/purchase-orders/purchaseOrder.routes.js";
import { createRequisitionRouter } from "../features/requisitions/requisition.routes.js";
import { createVendorRouter } from "../features/vendors/vendor.routes.js";
import dashboardRouter from "../features/procurement-dashboard/procurementDashboard.routes.js";
import { authenticate, requireRoles } from "../features/auth/auth.middleware.js";

const inwardsRouter = createInwardsRouter({ authenticate, authorizeRoles: requireRoles });
const inventoryRouter = createInventoryRouter({ authenticate, authorizeRoles: requireRoles });
const purchaseOrderRouter = createOrderRouter({ authenticate, authorizeRoles: requireRoles });
const requisitionRouter = createRequisitionRouter({ authenticate, authorizeRoles: requireRoles });
const vendorRouter = createVendorRouter({ authenticate, authorizeRoles: (roles) => requireRoles(...roles) });

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/leads", leadRouter);
apiRouter.use("/quotations", quotationRouter);
apiRouter.use("/orders", orderRouter);
apiRouter.use("/engineering", engineeringRouter);
apiRouter.use("/finance", financeRouter);

// Mount Module 2 features under /api/v1
apiRouter.use("/vendors", vendorRouter);
apiRouter.use("/", requisitionRouter);
apiRouter.use("/", purchaseOrderRouter);
apiRouter.use("/", inwardsRouter);
apiRouter.use("/", inventoryRouter);
apiRouter.use("/", dashboardRouter);

apiRouter.use("/production-quality", productionQualityRouter);
apiRouter.use("/pq", productionQualityRouter);
apiRouter.use("/notifications", notificationRouter);

// Module 7: HRMS Workforce
import hrmsRouter from "../features/hrms/hrms.routes.js";
apiRouter.use("/hrms", hrmsRouter);

// Module 5: Project, Installation & Service
import projectRouter from "../features/projects/project.routes.js";
import installationRouter from "../features/installations/installation.routes.js";
import serviceTicketRouter from "../features/service-tickets/serviceTicket.routes.js";

apiRouter.use("/projects", projectRouter);
apiRouter.use("/installations", installationRouter);
apiRouter.use("/service-tickets", serviceTicketRouter);

export default apiRouter;
