import * as attendanceService from "./attendance.service.js";

export async function checkIn(req, res, next) {
  try {
    const { employeeId, latitude, longitude } = req.body;
    const ipAddress = req.ip || req.headers["x-forwarded-for"];
    const userAgent = req.headers["user-agent"];

    const result = await attendanceService.checkInWithGps({
      employeeId,
      latitude,
      longitude,
      ipAddress,
      userAgent,
    });

    res.json({
      success: true,
      message: "Check-in recorded successfully",
      data: result.data,
      geofence: result.geofence,
    });
  } catch (error) {
    if (error.message.includes("GPS Check-in rejected") || error.message.includes("already checked in")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
}

export async function checkOut(req, res, next) {
  try {
    const { employeeId } = req.body;
    const result = await attendanceService.checkOutWithGps({ employeeId });

    res.json({
      success: true,
      message: "Check-out recorded successfully",
      data: result.data,
    });
  } catch (error) {
    if (error.message.includes("Cannot clock out") || error.message.includes("Already clocked out")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
}

export async function submitLabourRoster(req, res, next) {
  try {
    const supervisorId = req.user?.id || req.body.supervisorId || null;
    const { workDate, rosterItems } = req.body;

    const result = await attendanceService.submitLabourRoster({
      supervisorId,
      workDate,
      rosterItems,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function correctAttendance(req, res, next) {
  try {
    const { id } = req.params;
    const { newStatus, reason } = req.body;
    const correctedByUserId = req.user?.id || null;

    const result = await attendanceService.correctAttendance({
      attendanceId: id,
      newStatus,
      reason,
      correctedByUserId,
    });

    res.json({
      success: true,
      message: "Attendance corrected successfully with preserved audit trail",
      data: result,
    });
  } catch (error) {
    if (error.message.includes("reason is required") || error.message.includes("not found")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
}

export async function getAttendanceList(req, res, next) {
  try {
    const { date, department, status, page, limit } = req.query;

    const result = await attendanceService.getAttendanceList({
      date,
      department,
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
      metrics: result.metrics,
    });
  } catch (error) {
    next(error);
  }
}
