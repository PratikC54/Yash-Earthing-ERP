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
import { authenticate } from "../auth/auth.middleware.js";

const orderRouter = Router();

orderRouter.get("/", handleGetOrders);
orderRouter.get("/:id", handleGetOrderById);

// Authenticated actions
orderRouter.post("/po/:quotationId", authenticate, handleIssueCustomerPO);
orderRouter.post("/", authenticate, handleCreateSalesOrder);
orderRouter.post("/:id/check-inventory", authenticate, handleCheckInventory);
orderRouter.put("/:id", authenticate, handleUpdateSalesOrder);
orderRouter.delete("/:id", authenticate, handleDeleteSalesOrder);

export default orderRouter;
