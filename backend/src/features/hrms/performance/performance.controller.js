import * as performanceService from "./performance.service.js";

export async function evaluateEmployee(req, res, next) {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate, weights } = req.query;

    const result = await performanceService.getEmployeePerformance(employeeId, {
      startDate,
      endDate,
      customWeights: weights ? JSON.parse(weights) : {},
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
}

export function getScoringWeights(req, res) {
  res.json({
    success: true,
    data: performanceService.DEFAULT_PERFORMANCE_WEIGHTS,
  });
}

export async function getLeaderboard(req, res, next) {
  try {
    const list = await performanceService.getPerformanceLeaderboard();
    res.json({
      success: true,
      data: list,
    });
  } catch (error) {
    next(error);
  }
}
