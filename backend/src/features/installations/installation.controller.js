import * as installationService from "./installation.service.js";
import {
  scheduleInstallationSchema,
  updateInstallationStatusSchema,
  recordTestResultsSchema,
  completeHandoverSchema,
} from "./installation.validator.js";

export async function listInstallations(req, res, next) {
  try {
    const result = await installationService.listInstallations(req.query);
    res.status(200).json({ success: true, data: result.installations, ...result });
  } catch (err) {
    next(err);
  }
}

export async function getInstallationById(req, res, next) {
  try {
    const installation = await installationService.getInstallationById(req.params.id);
    res.status(200).json({ success: true, data: installation });
  } catch (err) {
    next(err);
  }
}

export async function scheduleInstallation(req, res, next) {
  try {
    const validated = scheduleInstallationSchema.parse(req.body);
    const installation = await installationService.scheduleInstallation(validated);
    res.status(201).json({
      success: true,
      message: `Installation ${installation.installationNo} scheduled`,
      data: installation,
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

export async function recordTestResults(req, res, next) {
  try {
    const validated = recordTestResultsSchema.parse(req.body);
    const updated = await installationService.recordTestResults(req.params.id, validated);
    res.status(200).json({
      success: true,
      message: `Testing & checklist results recorded for ${updated.installationNo}`,
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

export async function completeHandover(req, res, next) {
  try {
    const validated = completeHandoverSchema.parse(req.body);
    const completed = await installationService.completeHandover(req.params.id, validated);
    res.status(200).json({
      success: true,
      message: `Installation & Handover completed for ${completed.installationNo}`,
      data: completed,
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

export async function updateStatus(req, res, next) {
  try {
    const validated = updateInstallationStatusSchema.parse(req.body);
    const updated = await installationService.updateInstallationStatus(req.params.id, validated);
    res.status(200).json({
      success: true,
      message: `Installation ${updated.installationNo} status updated to ${updated.status}`,
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
