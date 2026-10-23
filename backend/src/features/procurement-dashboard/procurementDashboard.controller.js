import * as dashboardService from "./procurementDashboard.service.js";

export async function getDashboardMetrics(req, res, next) {
  try {
    const metrics = await dashboardService.getProcurementDashboardMetrics();
    res.status(200).json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
}
