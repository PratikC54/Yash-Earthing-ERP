import * as taskService from "./task.service.js";

export async function listTasks(req, res, next) {
  try {
    const { status, priority, department, assignedToId, createdById, search, page, limit } =
      req.query;

    const result = await taskService.getTasks({
      status,
      priority,
      department,
      assignedToId,
      createdById,
      search,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });

    res.json({
      success: true,
      data: result.items,
      kanban: result.kanban,
      metrics: result.metrics,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTask(req, res, next) {
  try {
    const task = await taskService.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
}

export async function createTask(req, res, next) {
  try {
    const creatorUserId = req.user?.id || req.body.createdById || 1;
    const task = await taskService.createTask(req.body, creatorUserId);

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    if (
      error.message.includes("is required") ||
      error.message.includes("Unsupported related entity") ||
      error.message.includes("already exists") ||
      error.message.includes("does not exist")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const actorUserId = req.user?.id || 1;
    const { status, notes, evidenceUrl } = req.body;

    const task = await taskService.updateTaskStatus(
      req.params.id,
      status,
      actorUserId,
      notes,
      evidenceUrl
    );

    res.json({
      success: true,
      message: `Task status updated to ${status}`,
      data: task,
    });
  } catch (error) {
    if (error.message.includes("Invalid task status transition") || error.message.includes("evidence")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
}

export async function reassignTask(req, res, next) {
  try {
    const actorUserId = req.user?.id || 1;
    const { assignedToId, reason } = req.body;

    const task = await taskService.reassignTask(req.params.id, assignedToId, actorUserId, reason);

    res.json({
      success: true,
      message: "Task reassigned successfully with audit trail",
      data: task,
    });
  } catch (error) {
    if (error.message.includes("not exist") || error.message.includes("not found")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const actorUserId = req.user?.id || 1;
    const { reason } = req.body;

    const task = await taskService.deleteTaskSafely(req.params.id, actorUserId, reason);

    res.json({
      success: true,
      message: "Task safely cancelled (hard deletion prohibited for audit compliance)",
      data: task,
    });
  } catch (error) {
    next(error);
  }
}
