// Public Feature Exports for Production & Quality Module (M4)
export { default as productionService } from "./services/productionService";
export { default as qualityService } from "./services/qualityService";
export * from "./services";
export { default as productionQualityRoutes } from "./routes/productionQualityRoutes";
export { default as useWorkOrders } from "./hooks/useWorkOrders";
export { default as useInspections } from "./hooks/useInspections";
export * from "./utils/productionQualityHelpers";

// Pages
export { default as ProductionDashboard } from "./pages/ProductionDashboard";
export { default as WorkOrdersPage } from "./pages/WorkOrdersPage";
export { default as WorkOrderDetailsPage } from "./pages/WorkOrderDetailsPage";
export { default as ProductionPlanningPage } from "./pages/ProductionPlanningPage";
export { default as QualityDashboard } from "./pages/QualityDashboard";
export { default as InspectionPage } from "./pages/InspectionPage";
export { default as NonConformancePage } from "./pages/NonConformancePage";
