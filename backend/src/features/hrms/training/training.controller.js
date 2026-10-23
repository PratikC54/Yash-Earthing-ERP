import * as trainingService from "./training.service.js";

export function listTrainings(req, res) {
  const { employeeId } = req.params;
  const data = trainingService.getEmployeeTrainings(employeeId);
  res.json({ success: true, data });
}

export function recordTraining(req, res) {
  const { employeeId } = req.params;
  const result = trainingService.recordTrainingCompletion({
    employeeId,
    ...req.body,
  });
  res.status(201).json({ success: true, message: "Training record logged", data: result });
}

export function checkSafetyEligibility(req, res) {
  const { employeeId } = req.params;
  const { courseCode } = req.query;
  const result = trainingService.checkWorkstationSafetyEligibility(employeeId, courseCode);
  res.json({ success: true, data: result });
}

export function listSkills(req, res) {
  const { employeeId } = req.params;
  const data = trainingService.getEmployeeSkills(employeeId);
  res.json({ success: true, data });
}

export function addSkill(req, res) {
  const { employeeId } = req.params;
  const result = trainingService.addEmployeeSkill({
    employeeId,
    ...req.body,
  });
  res.status(201).json({ success: true, message: "Skill added", data: result });
}

export function getMandatoryCourses(req, res) {
  res.json({ success: true, data: trainingService.MANDATORY_SAFETY_COURSES });
}
