import { Router } from "express";
import * as payrollController from "./payroll.controller.js";

const payrollRouter = Router();

// Fines endpoints
payrollRouter.get("/fines", payrollController.listFines);
payrollRouter.post("/fines", payrollController.reportFine);
payrollRouter.patch("/fines/:id/status", payrollController.handleFineAction);

// Payroll calculation & review
payrollRouter.post("/generate", payrollController.generatePayroll);
payrollRouter.patch("/:id/status", payrollController.updatePayrollStatus);

export default payrollRouter;
