import { Router } from "express";
import { authenticateUser } from "../../../middleware/authenticateUser.js";
import { createDropdownOption, getDropdownOptions } from "./masterData.controller.js";

const masterDataRouter = Router();

// Protect master-data routes
masterDataRouter.use(authenticateUser);

masterDataRouter.get("/dropdown-options", getDropdownOptions);
masterDataRouter.post("/dropdown-options", createDropdownOption);

export default masterDataRouter;
