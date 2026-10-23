import { Router } from "express";
import employeeRouter from "./employees/employee.routes.js";
import attendanceRouter from "./attendance/attendance.routes.js";
import taskRouter from "./tasks/task.routes.js";
import performanceRouter from "./performance/performance.routes.js";
import trainingRouter from "./training/training.routes.js";
import payrollRouter from "./payroll/payroll.routes.js";
import manufacturingHrmsRouter from "./manufacturing/manufacturing.routes.js";

const hrmsRouter = Router();

// Submodule 7.1 Employee & Workforce Management
hrmsRouter.use("/employees", employeeRouter);

// Submodule 7.2 Attendance Management (GPS & Labour Roster)
hrmsRouter.use("/attendance", attendanceRouter);

// Submodule 7.3 Task Assignment & Lifecycle Management
hrmsRouter.use("/tasks", taskRouter);

// Submodule 7.4 Performance Management Engine
hrmsRouter.use("/performance", performanceRouter);

// Submodule 7.5 Training & Skills Matrix
hrmsRouter.use("/training", trainingRouter);

// Submodule 7.6 Payroll, Attendance Pay & Fines
hrmsRouter.use("/payroll", payrollRouter);

// Submodule 7.7 Manufacturing Workforce Allocation & Shift Handover
hrmsRouter.use("/manufacturing", manufacturingHrmsRouter);

export default hrmsRouter;
