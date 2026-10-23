import { Router } from "express";
import {
  handleCheckInventory,
  handleCreateSalesOrder,
  handleDeleteSalesOrder,
  handleGetOrderById,
  handleGetOrders,
  handleIssueCustomerPO,
  handleUpdateSalesOrder,
} from "./order.handler.js";
import { authenticate, requireRoles } from "../auth/auth.middleware.js";

const orderRouter = Router();

orderRouter.get("/", authenticate, handleGetOrders);
orderRouter.get("/:id", authenticate, handleGetOrderById);

// RBAC: Customer PO can be issued by BACK_OFFICER, SALES_MANAGER, or ADMIN
orderRouter.post("/po/:quotationId", authenticate, requireRoles("BACK_OFFICER", "SALES_MANAGER"), handleIssueCustomerPO);

// RBAC: Official Sales Order can be approved and issued by SALES_MANAGER (or ADMIN)
orderRouter.post("/", authenticate, requireRoles("SALES_MANAGER"), handleCreateSalesOrder);

// Standard product inventory check
orderRouter.post("/:id/check-inventory", authenticate, handleCheckInventory);
orderRouter.put("/:id", authenticate, requireRoles("SALES_MANAGER"), handleUpdateSalesOrder);
orderRouter.delete("/:id", authenticate, requireRoles("SALES_MANAGER"), handleDeleteSalesOrder);

export default orderRouter;
