import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { formatEmployeeRecord } from "../src/features/hrms/employees/employee.service.js";

describe("Submodule 7.1 Employee Unit Tests", () => {
  test("formatEmployeeRecord should mask salary for non-privileged roles", () => {
    const rawEmployee = {
      id: 101,
      employeeCode: "EMP-101",
      userId: 5,
      fullName: "Rohan Patel",
      department: "Production",
      designation: "Machine Operator",
      employmentType: "Full-Time",
      dateOfJoining: new Date("2023-04-10"),
      salary: "45000.00",
      isActive: true,
      user: {
        id: 5,
        name: "Rohan Patel",
        email: "rohan@yashgroup.com",
        role: "PRODUCTION_MANAGER",
        shift: "SHIFT_A",
        isLoggedIn: true,
      },
      _count: { attendance: 42 },
    };

    // When viewed by non-privileged role (e.g. SALES_CONSULTANT or SERVICE_EXECUTIVE)
    const formattedWorker = formatEmployeeRecord(rawEmployee, "SALES_CONSULTANT");
    assert.strictEqual(formattedWorker.salary, null, "Salary must be null for non-privileged roles");
    assert.strictEqual(formattedWorker.fullName, "Rohan Patel");
    assert.strictEqual(formattedWorker.employeeCode, "EMP-101");
    assert.strictEqual(formattedWorker.recentAttendanceCount, 42);

    // When viewed by HR_MANAGER or ADMIN
    const formattedAdmin = formatEmployeeRecord(rawEmployee, "HR_MANAGER");
    assert.strictEqual(formattedAdmin.salary, 45000, "Salary must be exposed to HR_MANAGER");
  });

  test("formatEmployeeRecord supports labour/contract workers without individual login user accounts", () => {
    const rawLabourWorker = {
      id: 202,
      employeeCode: "LBR-001",
      userId: null, // No user account
      fullName: "Suresh Patil",
      department: "Labour Workforce",
      designation: "General Contractor",
      employmentType: "Daily-Wage",
      dateOfJoining: new Date("2024-01-01"),
      salary: "15000.00",
      isActive: true,
      user: null,
      _count: { attendance: 12 },
    };

    const formatted = formatEmployeeRecord(rawLabourWorker, "ADMIN");
    assert.strictEqual(formatted.userId, null);
    assert.strictEqual(formatted.user, null, "Labour worker should safely have null user account");
    assert.strictEqual(formatted.employmentType, "Daily-Wage");
    assert.strictEqual(formatted.employeeCode, "LBR-001");
  });

  test("formatEmployeeRecord preserves deactivation status for historical records", () => {
    const deactivatedEmp = {
      id: 303,
      employeeCode: "EMP-099",
      userId: 12,
      fullName: "Anita Deshmukh",
      department: "Quality",
      designation: "QC Inspector",
      employmentType: "Full-Time",
      dateOfJoining: new Date("2021-02-01"),
      salary: "50000.00",
      isActive: false, // Inactive employee
      user: null,
      _count: { attendance: 300 },
    };

    const formatted = formatEmployeeRecord(deactivatedEmp, "ADMIN");
    assert.strictEqual(formatted.isActive, false, "Deactivation status must be preserved");
    assert.strictEqual(formatted.fullName, "Anita Deshmukh");
  });
});
