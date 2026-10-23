import { Router } from "express";
import {
  handleApproveUser,
  handleDevQuickApprove,
  handleGetMe,
  handleGetPendingUsers,
  handleGetStatus,
  handleLogin,
  handleLogout,
  handleRegister,
  handleRejectUser,
} from "./auth.handler.js";
import { authenticate, requireAdmin } from "./auth.middleware.js";

const authRouter = Router();

// Public routes
authRouter.post("/register", handleRegister);
authRouter.post("/login", handleLogin);
authRouter.get("/status", handleGetStatus);
authRouter.post("/dev-quick-approve", handleDevQuickApprove);

// Authenticated routes
authRouter.get("/me", authenticate, handleGetMe);
authRouter.post("/logout", authenticate, handleLogout);

// Admin-only approval management
authRouter.get("/pending", authenticate, requireAdmin, handleGetPendingUsers);
authRouter.post("/approve/:id", authenticate, requireAdmin, handleApproveUser);
authRouter.post("/reject/:id", authenticate, requireAdmin, handleRejectUser);

export default authRouter;
