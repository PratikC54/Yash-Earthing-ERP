import { Router } from "express";
import {
  handleBulkImport,
  handleCreateLead,
  handleDeleteLead,
  handleGetFollowups,
  handleGetLeadById,
  handleGetLeads,
  handleGetProductsCatalog,
  handleGetStats,
  handleLogCall,
  handleReassignLead,
  handleUpdateLead,
} from "./lead.handler.js";
import { authenticate, requireRoles } from "../auth/auth.middleware.js";

const leadRouter = Router();

leadRouter.get("/stats", authenticate, handleGetStats);
leadRouter.get("/products", authenticate, handleGetProductsCatalog);
leadRouter.get("/followups", authenticate, handleGetFollowups);
leadRouter.get("/", authenticate, handleGetLeads);
leadRouter.get("/:id", authenticate, handleGetLeadById);

// Authenticated actions
leadRouter.post("/", authenticate, handleCreateLead);
leadRouter.put("/:id", authenticate, handleUpdateLead);
// Manual Lead Reassignment: strictly restricted to ADMIN and SALES_MANAGER
leadRouter.patch("/:id/assign", authenticate, requireRoles("ADMIN", "SALES_MANAGER"), handleReassignLead);
leadRouter.delete("/:id", authenticate, handleDeleteLead);
leadRouter.post("/:id/call", authenticate, handleLogCall);
leadRouter.post("/import", authenticate, handleBulkImport);

export default leadRouter;
