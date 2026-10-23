import { Router } from "express";
import * as attendanceController from "./attendance.controller.js";

const attendanceRouter = Router();

attendanceRouter.get("/", attendanceController.getAttendanceList);
attendanceRouter.post("/check-in", attendanceController.checkIn);
attendanceRouter.post("/check-out", attendanceController.checkOut);
attendanceRouter.post("/labour-roster", attendanceController.submitLabourRoster);
attendanceRouter.put("/:id/correct", attendanceController.correctAttendance);

export default attendanceRouter;
