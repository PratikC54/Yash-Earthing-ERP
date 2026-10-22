import { Router } from "express";
import { getHealth } from "./health.handler.js";

const healthRouter = Router();

healthRouter.get("/", getHealth);

export default healthRouter;
