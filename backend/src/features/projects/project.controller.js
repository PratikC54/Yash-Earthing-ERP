import * as projectService from "./project.service.js";
import { createProjectSchema, updateProjectSchema, projectTaskSchema } from "./project.validator.js";

export async function listProjects(req, res, next) {
  try {
    const result = await projectService.listProjects(req.query);
    res.status(200).json({ success: true, data: result.projects, ...result });
  } catch (err) {
    next(err);
  }
}

export async function getProjectById(req, res, next) {
  try {
    const project = await projectService.getProjectById(req.params.id);
    res.status(200).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
}

export async function createProject(req, res, next) {
  try {
    const validated = createProjectSchema.parse(req.body);
    const project = await projectService.createProject(validated);
    res.status(201).json({
      success: true,
      message: `Project ${project.projectCode} initiated successfully`,
      data: project,
    });
  } catch (err) {
    if (err.name === "ZodError") {
      const error = new Error(err.errors[0]?.message || "Validation failed");
      error.statusCode = 400;
      error.errors = err.errors.map((e) => ({ field: e.path.join("."), message: e.message }));
      return next(error);
    }
    next(err);
  }
}

export async function updateProject(req, res, next) {
  try {
    const validated = updateProjectSchema.parse(req.body);
    const updated = await projectService.updateProject(req.params.id, validated);
    res.status(200).json({
      success: true,
      message: `Project ${updated.projectCode} updated`,
      data: updated,
    });
  } catch (err) {
    if (err.name === "ZodError") {
      const error = new Error(err.errors[0]?.message || "Validation failed");
      error.statusCode = 400;
      error.errors = err.errors.map((e) => ({ field: e.path.join("."), message: e.message }));
      return next(error);
    }
    next(err);
  }
}

export async function addTaskToProject(req, res, next) {
  try {
    const validated = projectTaskSchema.parse(req.body);
    const userId = req.user?.id || 1;
    const task = await projectService.addTaskToProject(req.params.id, validated, userId);
    res.status(201).json({
      success: true,
      message: `Task ${task.taskNo} assigned to project`,
      data: task,
    });
  } catch (err) {
    if (err.name === "ZodError") {
      const error = new Error(err.errors[0]?.message || "Validation failed");
      error.statusCode = 400;
      error.errors = err.errors.map((e) => ({ field: e.path.join("."), message: e.message }));
      return next(error);
    }
    next(err);
  }
}

export async function updateTaskStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!status) {
      const error = new Error("Task status is required");
      error.statusCode = 400;
      throw error;
    }
    const updated = await projectService.updateTaskStatus(req.params.taskId, status);
    res.status(200).json({
      success: true,
      message: `Task ${updated.taskNo} status updated to ${status}`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function getDashboardMetrics(_req, res, next) {
  try {
    const data = await projectService.getProjectDashboardMetrics();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
