import { Router } from "express";
import { authenticateUser } from "../../middleware/authenticateUser.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { getCurrentUser, login, logout } from "./auth.controller.js";
import { loginSchema } from "./auth.validation.js";

const authRouter = Router();

authRouter.post("/login", validateRequest({ body: loginSchema }), login);
authRouter.post("/logout", authenticateUser, logout);
authRouter.get("/me", authenticateUser, getCurrentUser);

export default authRouter;
