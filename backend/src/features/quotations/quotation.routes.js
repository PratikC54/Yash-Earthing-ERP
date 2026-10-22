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
import { authenticate } from "../auth/auth.middleware.js";

const quotationRouter = Router();

quotationRouter.get("/", handleGetQuotations);
quotationRouter.get("/:id", handleGetQuotationById);

// Authenticated actions
quotationRouter.post("/", authenticate, handleCreateQuotation);
quotationRouter.post("/:id/revise", authenticate, handleReviseQuotation);
quotationRouter.post("/:id/finalize-pi", authenticate, handleFinalizeProformaInvoice);
quotationRouter.post("/:id/send-email", authenticate, handleSendEmail);
quotationRouter.delete("/:id", authenticate, handleDeleteQuotation);

export default quotationRouter;
