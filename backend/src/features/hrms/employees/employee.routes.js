import { Router } from "express";
import * as employeeController from "./employee.controller.js";

const employeeRouter = Router();

employeeRouter.get("/departments", employeeController.getDepartments);
employeeRouter.get("/", employeeController.listEmployees);
employeeRouter.get("/:id", employeeController.getEmployee);
employeeRouter.post("/", employeeController.createEmployee);
employeeRouter.put("/:id", employeeController.updateEmployee);
employeeRouter.delete("/:id", employeeController.deactivateEmployee);

export default employeeRouter;
