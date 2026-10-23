import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  calculateHaversineDistanceMeters,
  validateGeofence,
  evaluatePunctuality,
} from "../src/features/hrms/attendance/attendance.service.js";

describe("Submodule 7.2 Attendance Unit Tests", () => {
  const mockOfficeSetting = {
    requireGeofence: true,
    officeLatitude: 18.5204, // Pune mid-point
    officeLongitude: 73.8567,
    officeRadiusMeters: 150,
    workStartTime: "09:30",
    graceBufferMinutes: 10,
  };

  test("calculateHaversineDistanceMeters accurately calculates proximity", () => {
    // Distance from office point to exact same point must be 0 meters
    const distZero = calculateHaversineDistanceMeters(18.5204, 73.8567, 18.5204, 73.8567);
    assert.strictEqual(distZero, 0);

    // Distance ~50 meters away
    const distSmall = calculateHaversineDistanceMeters(18.5204, 73.8567, 18.5208, 73.8567);
    assert.ok(distSmall > 30 && distSmall < 60, `Distance should be ~44m, got ${distSmall}`);
  });

  test("validateGeofence approves check-in within radius and rejects outside boundary", () => {
    // Within perimeter (~44 meters away, radius 150m)
    const valid = validateGeofence(
      { latitude: 18.5208, longitude: 73.8567 },
      mockOfficeSetting
    );
    assert.strictEqual(valid.isValid, true);
    assert.strictEqual(valid.reason, "Within approved geofence perimeter");

    // Outside perimeter (far location in Mumbai ~120km away)
    const invalid = validateGeofence(
      { latitude: 19.0760, longitude: 72.8777 },
      mockOfficeSetting
    );
    assert.strictEqual(invalid.isValid, false);
    assert.ok(invalid.distance > 100000);
    assert.ok(invalid.reason.includes("Outside authorized perimeter"));
  });

  test("validateGeofence rejects when location permission denied or coords unavailable", () => {
    const missing = validateGeofence(null, mockOfficeSetting);
    assert.strictEqual(missing.isValid, false);
    assert.ok(missing.reason.includes("unavailable or permission denied"));
  });

  test("evaluatePunctuality respects grace buffer for OnTime/Present vs Late", () => {
    // Exactly at 09:35 (within 10-min grace buffer for 09:30 start)
    const withinGrace = new Date("2026-10-22T09:35:00");
    const res1 = evaluatePunctuality(withinGrace, "09:30", 10);
    assert.strictEqual(res1.status, "Present");
    assert.strictEqual(res1.lateMinutes, 0);

    // Late at 09:48 (18 minutes late past 09:30 start)
    const late = new Date("2026-10-22T09:48:00");
    const res2 = evaluatePunctuality(late, "09:30", 10);
    assert.strictEqual(res2.status, "Late");
    assert.strictEqual(res2.lateMinutes, 18);
  });
});
