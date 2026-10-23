import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isCertificationValid,
  checkWorkstationSafetyEligibility,
  recordTrainingCompletion,
} from "../src/features/hrms/training/training.service.js";

test("Training Engine: Validates active and expired certifications against current time", () => {
  const futureExpiry = new Date(Date.now() + 86400000 * 30).toISOString();
  const pastExpiry = new Date(Date.now() - 86400000 * 30).toISOString();

  assert.equal(isCertificationValid(futureExpiry), true);
  assert.equal(isCertificationValid(pastExpiry), false);
  assert.equal(isCertificationValid(null), false);
});

test("Training Engine: Flags safety-critical assignment eligibility", () => {
  // Course SAF-001 is expired in initial fixture for emp 1
  const check = checkWorkstationSafetyEligibility(1, "SAF-001");
  assert.equal(check.eligible, false);
  assert.equal(check.status, "EXPIRED");
  assert.ok(check.reason.includes("expired"));
});

test("Training Engine: Grants eligibility once mandatory course is renewed", () => {
  recordTrainingCompletion({
    employeeId: 1,
    courseCode: "SAF-001",
    courseTitle: "Electrical Safety & Earthing Protocols",
    completionDate: new Date().toISOString(),
    validityMonths: 12,
    certificateNo: "CERT-NEW-999",
  });

  const check = checkWorkstationSafetyEligibility(1, "SAF-001");
  assert.equal(check.eligible, true);
  assert.equal(check.status, "ACTIVE");
  assert.equal(check.certificateNo, "CERT-NEW-999");
});
