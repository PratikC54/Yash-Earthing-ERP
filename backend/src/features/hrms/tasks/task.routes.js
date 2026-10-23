import { Router } from "express";
import * as taskController from "./task.controller.js";

const taskRouter = Router();

taskRouter.get("/", taskController.listTasks);
taskRouter.get("/:id", taskController.getTask);
taskRouter.post("/", taskController.createTask);
taskRouter.put("/:id/status", taskController.updateStatus);
taskRouter.put("/:id/reassign", taskController.reassignTask);
taskRouter.delete("/:id", taskController.deleteTask);

export default taskRouter;
