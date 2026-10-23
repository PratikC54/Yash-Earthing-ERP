import assert from "node:assert/strict";
import { test } from "node:test";
import { calculatePerformanceScore } from "../src/features/hrms/performance/performance.service.js";

test("Performance Engine: Calculates balanced score accurately when all indicators present", () => {
  const result = calculatePerformanceScore({
    attendanceDaysPresent: 28,
    attendanceDaysTotal: 30, // 93%
    tasksCompletedOnTime: 9,
    tasksAssignedTotal: 10,  // 90%
    targetActual: 95000,
    targetGoal: 100000,      // 95%
    qualityPasses: 100,
    qualityTotal: 100,       // 100%
  });

  assert.equal(typeof result.finalScore, "number");
  assert.ok(result.finalScore >= 90);
  assert.equal(result.ratingBand, "OUTSTANDING");
  assert.equal(result.hasInsufficientData, false);
});

test("Performance Engine: Gracefully handles missing target & quality data without zeroing attendance/tasks", () => {
  const result = calculatePerformanceScore({
    attendanceDaysPresent: 25,
    attendanceDaysTotal: 25, // 100%
    tasksCompletedOnTime: 8,
    tasksAssignedTotal: 10,  // 80%
    targetActual: null,
    targetGoal: null,
    qualityPasses: 0,
    qualityTotal: 0,
  });

  // Expected: weighted dynamically across attendance (30%) and tasks (40%) -> (100*0.3 + 80*0.4)/0.7 = (30+32)/0.7 = 88.5 -> 89
  assert.equal(result.finalScore, 89);
  assert.equal(result.hasInsufficientData, true);
  assert.ok(result.missingDataFields.includes("targets"));
  assert.ok(result.missingDataFields.includes("quality"));
});
