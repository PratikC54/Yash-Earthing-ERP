import * as employeeService from "./employee.service.js";

export async function listEmployees(req, res, next) {
  try {
    const { page, limit, search, department, employmentType, isActive } = req.query;
    const userRole = req.user?.role || "ADMIN";

    const result = await employeeService.getEmployees({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      department,
      employmentType,
      isActive,
      userRole,
    });

    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getEmployee(req, res, next) {
  try {
    const userRole = req.user?.role || "ADMIN";
    const employee = await employeeService.getEmployeeById(req.params.id, userRole);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    next(error);
  }
}

export async function createEmployee(req, res, next) {
  try {
    const actorId = req.user?.id || null;
    const employee = await employeeService.createEmployee(req.body, actorId);

    res.status(201).json({
      success: true,
      message: "Employee record created successfully",
      data: employee,
    });
  } catch (error) {
    if (error.message.includes("already exists") || error.message.includes("already linked")) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
}

export async function updateEmployee(req, res, next) {
  try {
    const actorId = req.user?.id || null;
    const employee = await employeeService.updateEmployee(req.params.id, req.body, actorId);

    res.json({
      success: true,
      message: "Employee record updated successfully",
      data: employee,
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message.includes("already linked")) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
}

export async function deactivateEmployee(req, res, next) {
  try {
    const actorId = req.user?.id || null;
    const { reason } = req.body || {};
    const employee = await employeeService.deactivateEmployee(req.params.id, actorId, reason);

    res.json({
      success: true,
      message: "Employee deactivated successfully (historical records preserved)",
      data: employee,
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
}

export async function getDepartments(req, res, next) {
  try {
    const departments = await employeeService.getDepartments();
    res.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    next(error);
  }
}
