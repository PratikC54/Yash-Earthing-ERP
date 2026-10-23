import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  ALLOWED_TRANSITIONS,
  isValidStatusTransition,
  isTaskOverdue,
  validateTaskInput,
  formatTaskRecord,
  SUPPORTED_RELATED_ENTITIES,
} from "../src/features/hrms/tasks/task.service.js";

describe("Submodule 7.3 Task Assignment & Lifecycle Unit Tests", () => {
  // 1. Required-field validation
  test("validateTaskInput enforces title presence", () => {
    assert.throws(
      () => validateTaskInput({ title: "" }),
      /Task title is required/,
      "Empty title should throw validation error"
    );

    assert.throws(
      () => validateTaskInput({ title: "   " }),
      /Task title is required/,
      "Whitespace-only title should throw validation error"
    );

    assert.doesNotThrow(
      () => validateTaskInput({ title: "Calibrate Testing Rig 4" }),
      "Valid title should pass validation"
    );
  });

  // 2. Related ERP Entity Validation
  test("validateTaskInput validates supported ERP related entity types", () => {
    assert.throws(
      () =>
        validateTaskInput({
          title: "QC Check",
          relatedEntityType: "INVALID_MODULE_TYPE",
          relatedEntityId: 10,
        }),
      /Unsupported related entity type/
    );

    assert.throws(
      () =>
        validateTaskInput({
          title: "QC Check",
          relatedEntityType: "WORK_ORDER",
          relatedEntityId: null, // missing ID
        }),
      /Related entity ID is required/
    );

    assert.doesNotThrow(() =>
      validateTaskInput({
        title: "QC Check",
        relatedEntityType: "WORK_ORDER",
        relatedEntityId: 102,
      })
    );
  });

  // 3. Status Transition Rules (Lifecycle Enforcement)
  test("isValidStatusTransition permits valid operational transitions", () => {
    // OPEN -> IN_PROGRESS
    assert.strictEqual(isValidStatusTransition("OPEN", "IN_PROGRESS"), true);

    // IN_PROGRESS -> WAITING_APPROVAL
    assert.strictEqual(isValidStatusTransition("IN_PROGRESS", "WAITING_APPROVAL"), true);

    // WAITING_APPROVAL -> COMPLETED
    assert.strictEqual(isValidStatusTransition("WAITING_APPROVAL", "COMPLETED"), true);

    // IN_PROGRESS -> BLOCKED
    assert.strictEqual(isValidStatusTransition("IN_PROGRESS", "BLOCKED"), true);

    // BLOCKED -> IN_PROGRESS (unblocked)
    assert.strictEqual(isValidStatusTransition("BLOCKED", "IN_PROGRESS"), true);

    // WAITING_APPROVAL -> IN_PROGRESS (rework)
    assert.strictEqual(isValidStatusTransition("WAITING_APPROVAL", "IN_PROGRESS"), true);
  });

  // 4. Invalid Status Transitions Blocked
  test("isValidStatusTransition rejects illegal status jumps", () => {
    // Cannot jump straight from OPEN to COMPLETED without progress/review
    assert.strictEqual(isValidStatusTransition("OPEN", "COMPLETED"), false);

    // Cannot jump from BLOCKED directly to COMPLETED
    assert.strictEqual(isValidStatusTransition("BLOCKED", "COMPLETED"), false);

    // CANCELLED tasks cannot transition
    assert.strictEqual(isValidStatusTransition("CANCELLED", "IN_PROGRESS"), false);
  });

  // 5. Overdue and due-date logic
  test("isTaskOverdue accurately flags overdue incomplete tasks", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    assert.strictEqual(isTaskOverdue(yesterday, "OPEN"), true, "Past due date must be overdue");
    assert.strictEqual(isTaskOverdue(tomorrow, "OPEN"), false, "Future due date is not overdue");

    // Completed or cancelled tasks are never overdue
    assert.strictEqual(isTaskOverdue(yesterday, "COMPLETED"), false);
    assert.strictEqual(isTaskOverdue(yesterday, "CANCELLED"), false);
  });

  // 6. Safe formatting and sensitive information masking
  test("formatTaskRecord structures data safely without exposing passwords or hashes", () => {
    const rawTask = {
      id: 1,
      taskNo: "TSK-001",
      title: "Inspect Copper Bonding for WO-88",
      description: "Perform micron coating thickness test",
      department: "Quality & Metrology",
      shift: "GENERAL",
      status: "OPEN",
      priority: "HIGH",
      dueAt: new Date(Date.now() + 86400000),
      createdBy: {
        id: 2,
        name: "Admin User",
        email: "admin@yashgroup.com",
        passwordHash: "secretHash",
        role: "ADMIN",
      },
      assignedTo: {
        id: 4,
        name: "Quality Engineer",
        email: "qc@yashgroup.com",
        passwordHash: "secretHash",
        role: "QUALITY_INSPECTOR",
      },
    };

    const formatted = formatTaskRecord(rawTask);
    assert.strictEqual(formatted.taskNo, "TSK-001");
    assert.strictEqual(formatted.priority, "HIGH");
    assert.strictEqual(formatted.createdBy.passwordHash, undefined);
    assert.strictEqual(formatted.assignedTo.passwordHash, undefined);
    assert.strictEqual(formatted.isOverdue, false);
  });
});
