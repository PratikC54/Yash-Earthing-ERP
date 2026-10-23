import { Router } from "express";
import {
  handleCreateQuotation,
  handleDeleteQuotation,
  handleFinalizeProformaInvoice,
  handleGetQuotationById,
  handleGetQuotations,
  handleReviseQuotation,
  handleSendEmail,
} from "./quotation.handler.js";
import { authenticate, requireRoles } from "../auth/auth.middleware.js";

const quotationRouter = Router();

quotationRouter.get("/", authenticate, handleGetQuotations);
quotationRouter.get("/:id", authenticate, handleGetQuotationById);

// RBAC: BACK_OFFICER, SALES_MANAGER, and ADMIN can prepare/revise quotations
quotationRouter.post("/", authenticate, requireRoles("BACK_OFFICER", "SALES_MANAGER"), handleCreateQuotation);
quotationRouter.post("/:id/revise", authenticate, requireRoles("BACK_OFFICER", "SALES_MANAGER"), handleReviseQuotation);
quotationRouter.post("/:id/finalize-pi", authenticate, requireRoles("BACK_OFFICER", "SALES_MANAGER"), handleFinalizeProformaInvoice);
// Email quotation: SALES_CONSULTANT (can send quotation prepared by BACK_OFFICER), BACK_OFFICER, SALES_MANAGER, ADMIN
quotationRouter.post("/:id/send-email", authenticate, requireRoles("SALES_CONSULTANT", "BACK_OFFICER", "SALES_MANAGER"), handleSendEmail);
quotationRouter.delete("/:id", authenticate, requireRoles("BACK_OFFICER", "SALES_MANAGER"), handleDeleteQuotation);

export default quotationRouter;
