import { Router } from "express";
import {
  handleBulkImport,
  handleCreateLead,
  handleDeleteLead,
  handleGetFollowups,
  handleGetLeadById,
  handleGetLeads,
  handleGetStats,
  handleLogCall,
  handleUpdateLead,
} from "./lead.handler.js";
import { authenticate } from "../auth/auth.middleware.js";

const leadRouter = Router();

leadRouter.get("/stats", handleGetStats);
leadRouter.get("/followups", handleGetFollowups);
leadRouter.get("/", handleGetLeads);
leadRouter.get("/:id", handleGetLeadById);

// Authenticated actions
leadRouter.post("/", authenticate, handleCreateLead);
leadRouter.put("/:id", authenticate, handleUpdateLead);
leadRouter.delete("/:id", authenticate, handleDeleteLead);
leadRouter.post("/:id/call", authenticate, handleLogCall);
leadRouter.post("/import", authenticate, handleBulkImport);

export default leadRouter;
