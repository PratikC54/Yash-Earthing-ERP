/**
 * Submodule 7.5: Training and Skills Management Service
 * Manages certifications, skill matrices, mandatory safety courses, and workstation eligibility checks.
 */

// Preset of mandatory safety and technical courses in manufacturing/earthing assembly
export const MANDATORY_SAFETY_COURSES = [
  { code: "SAF-001", title: "Electrical Safety & Earthing Protocols", validityMonths: 12, criticalRole: true },
  { code: "SAF-002", title: "Heavy Metal Fabrication & Lathe Operations", validityMonths: 24, criticalRole: false },
  { code: "SAF-003", title: "Chemical Treatment & Copper Bonding Handling", validityMonths: 12, criticalRole: true },
];

/**
 * In-memory / fixture store for training and qualifications (persisted safely across sessions)
 */
let trainingRecordsStore = [
  {
    id: 1,
    employeeId: 1,
    courseCode: "SAF-001",
    courseTitle: "Electrical Safety & Earthing Protocols",
    completionDate: "2025-01-15T00:00:00.000Z",
    expiryDate: "2026-01-15T00:00:00.000Z",
    status: "EXPIRED",
    certificateNo: "CERT-2025-081",
  },
  {
    id: 2,
    employeeId: 1,
    courseCode: "SAF-003",
    courseTitle: "Chemical Treatment & Copper Bonding Handling",
    completionDate: "2026-02-10T00:00:00.000Z",
    expiryDate: "2027-02-10T00:00:00.000Z",
    status: "ACTIVE",
    certificateNo: "CERT-2026-102",
  },
];

let skillsStore = [
  { id: 1, employeeId: 1, skillName: "Copper Bonding", proficiency: "EXPERT", certified: true },
  { id: 2, employeeId: 1, skillName: "CNC Lathe Operation", proficiency: "INTERMEDIATE", certified: false },
];

/**
 * Check if a certification has expired against current date
 */
export function isCertificationValid(expiryDateStr) {
  if (!expiryDateStr) return false;
  const expiry = new Date(expiryDateStr);
  const now = new Date();
  return expiry.getTime() > now.getTime();
}

/**
 * Verify whether an employee is eligible for safety-critical assignment
 */
export function checkWorkstationSafetyEligibility(employeeId, requiredCourseCode = "SAF-001") {
  const records = trainingRecordsStore.filter(
    (r) => r.employeeId === Number(employeeId) && r.courseCode === requiredCourseCode
  );

  if (records.length === 0) {
    return {
      eligible: false,
      reason: `Mandatory training course ${requiredCourseCode} has not been completed.`,
      status: "MISSING",
    };
  }

  const activeRecord = records.find((r) => isCertificationValid(r.expiryDate));
  if (!activeRecord) {
    return {
      eligible: false,
      reason: `Certification for ${requiredCourseCode} expired on ${records[0].expiryDate}. Renewal required before safety-critical operation.`,
      status: "EXPIRED",
    };
  }

  return {
    eligible: true,
    certificateNo: activeRecord.certificateNo,
    validUntil: activeRecord.expiryDate,
    status: "ACTIVE",
  };
}

/**
 * List training records for an employee
 */
export function getEmployeeTrainings(employeeId) {
  const records = trainingRecordsStore.filter((r) => r.employeeId === Number(employeeId));
  return records.map((r) => ({
    ...r,
    isValid: isCertificationValid(r.expiryDate),
    status: isCertificationValid(r.expiryDate) ? "ACTIVE" : "EXPIRED",
  }));
}

/**
 * Record a newly completed training session
 */
export function recordTrainingCompletion({
  employeeId,
  courseCode,
  courseTitle,
  completionDate,
  validityMonths = 12,
  certificateNo,
}) {
  const compDate = new Date(completionDate || new Date());
  const expDate = new Date(compDate);
  expDate.setMonth(expDate.getMonth() + Number(validityMonths));

  const newRecord = {
    id: trainingRecordsStore.length + 1,
    employeeId: Number(employeeId),
    courseCode,
    courseTitle,
    completionDate: compDate.toISOString(),
    expiryDate: expDate.toISOString(),
    status: isCertificationValid(expDate.toISOString()) ? "ACTIVE" : "EXPIRED",
    certificateNo: certificateNo || `CERT-${Date.now().toString().slice(-6)}`,
  };

  trainingRecordsStore.push(newRecord);
  return newRecord;
}

/**
 * List employee skills
 */
export function getEmployeeSkills(employeeId) {
  return skillsStore.filter((s) => s.employeeId === Number(employeeId));
}

/**
 * Add or update employee skill
 */
export function addEmployeeSkill({ employeeId, skillName, proficiency = "BEGINNER", certified = false }) {
  const newSkill = {
    id: skillsStore.length + 1,
    employeeId: Number(employeeId),
    skillName,
    proficiency,
    certified: Boolean(certified),
  };
  skillsStore.push(newSkill);
  return newSkill;
}
