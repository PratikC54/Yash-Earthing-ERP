import { Router } from "express";
import { authenticateUser } from "../../../middleware/authenticateUser.js";
import { authorizeRoles } from "../../../middleware/authorizeRoles.js";
import { validateRequest } from "../../../middleware/validateRequest.js";
import {
  createDispatch,
  getDashboard,
  getHistory,
  getReadyForDispatch,
} from "./dispatch.controller.js";
import { createDispatchSchema } from "./dispatch.validation.js";

const dispatchRouter = Router();

dispatchRouter.use(authenticateUser);

dispatchRouter.get("/dashboard", getDashboard);
dispatchRouter.get("/ready", getReadyForDispatch);
dispatchRouter.get("/history", getHistory);

dispatchRouter.post(
  "/",
  authorizeRoles("ADMIN", "DISPATCH_OFFICER", "PRODUCTION_MANAGER"),
  validateRequest({ body: createDispatchSchema }),
  createDispatch
);

export default dispatchRouter;
