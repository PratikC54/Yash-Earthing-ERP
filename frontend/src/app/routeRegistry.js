import React from "react";
import { Navigate } from "react-router-dom";
import DashboardPage from "../features/dashboard/pages/DashboardPage";
import ProductionPlanningPage from "../features/production_quality/pages/ProductionPlanningPage";
import ShopFloorPage from "../features/production_quality/pages/ShopFloorPage";
import QualityDashboard from "../features/production_quality/pages/QualityDashboard";
import WorkOrdersPage from "../features/production_quality/pages/WorkOrdersPage";
import WorkOrderDetailsPage from "../features/production_quality/pages/WorkOrderDetailsPage";
import InspectionPage from "../features/production_quality/pages/InspectionPage";
import InspectionDetailsPage from "../features/production_quality/pages/InspectionDetailsPage";
import NonConformancePage from "../features/production_quality/pages/NonConformancePage";
import ReworkTrackingPage from "../features/production_quality/pages/ReworkTrackingPage";
import MaterialIssuancePage from "../features/production_quality/pages/MaterialIssuancePage";
import ProductionCompletionPage from "../features/production_quality/pages/ProductionCompletionPage";
import DispatchPage from "../features/production_quality/pages/DispatchPage";
import QRWorkOrderPage from "../features/production_quality/pages/QRWorkOrderPage";
import NotificationHistoryPage from "../features/production_quality/pages/NotificationHistoryPage";
import productionQualityRoutes from "../features/production_quality/routes/productionQualityRoutes";

const redirect = (to) =>
  React.createElement(Navigate, { to, replace: true });

const comp = (Component) =>
  React.createElement(Component, null);

/**
 * Global Route Registry for Yash Group ERP
 * Only Production & Quality module and its submodules (Planning, Manufacturing, Quality)
 * are accessible in frontend navigation.
 */
export const moduleRoutes = [
  // Core Production & Quality routes (/production-quality/...)
  ...productionQualityRoutes,

  // Main Production & Quality Dashboard
  { path: "pq/dashboard", element: comp(DashboardPage) },
  { path: "production/dashboard", element: redirect("/pq/dashboard") },
  { path: "erp/production/dashboard", element: redirect("/pq/dashboard") },

  // PQ namespace aliases
  { path: "pq/planning", element: comp(ProductionPlanningPage) },
  { path: "pq/manufacturing", element: comp(ShopFloorPage) },
  { path: "pq/work-orders", element: comp(WorkOrdersPage) },
  { path: "pq/work-orders/:id", element: comp(WorkOrderDetailsPage) },
  { path: "pq/work-orders/:id/qr", element: comp(QRWorkOrderPage) },
  { path: "pq/material-issuance", element: comp(MaterialIssuancePage) },
  { path: "pq/completion", element: comp(ProductionCompletionPage) },
  { path: "pq/quality", element: comp(QualityDashboard) },
  { path: "pq/inspections", element: comp(InspectionPage) },
  { path: "pq/inspections/:id", element: comp(InspectionDetailsPage) },
  { path: "pq/dispatch", element: comp(DispatchPage) },
  { path: "production/dispatch", element: comp(DispatchPage) },
  { path: "dispatch", element: redirect("/pq/dispatch") },
  { path: "pq/non-conformance", element: comp(NonConformancePage) },
  { path: "pq/rework", element: comp(ReworkTrackingPage) },
  { path: "pq/notifications", element: comp(NotificationHistoryPage) },
  { path: "notifications", element: redirect("/pq/notifications") },

  // Direct Submodule & Production routes
  { path: "production", element: redirect("/pq/dashboard") },
  { path: "erp/production", element: redirect("/pq/dashboard") },

  // Submodule 1: Planning
  { path: "production/planning", element: comp(ProductionPlanningPage) },
  { path: "erp/production/planning", element: redirect("/production-quality/planning") },

  // Submodule 2: Manufacturing
  { path: "production/manufacturing", element: comp(ShopFloorPage) },
  { path: "erp/production/manufacturing", element: redirect("/production-quality/manufacturing") },
  { path: "production/tracking", element: comp(ShopFloorPage) },
  { path: "erp/production/tracking", element: redirect("/production-quality/manufacturing") },
  { path: "production/shop-floor", element: redirect("/production-quality/manufacturing") },
  { path: "erp/production/shop-floor", element: redirect("/production-quality/manufacturing") },

  // Submodule 3: Quality
  { path: "quality", element: redirect("/production-quality/quality") },
  { path: "erp/quality", element: redirect("/production-quality/quality") },
  { path: "production/quality", element: redirect("/production-quality/quality") },
  { path: "quality/dashboard", element: comp(QualityDashboard) },

  // Additional Submodule flows (Work Orders, Inspections, NCR, CAPA, Material Issuance)
  { path: "production/work-orders", element: comp(WorkOrdersPage) },
  { path: "production/work-orders/:id", element: comp(WorkOrderDetailsPage) },
  { path: "erp/production/work-orders", element: redirect("/production-quality/work-orders") },
  { path: "erp/production/work-orders/:id", element: redirect("/production-quality/work-orders") },

  { path: "production/material-issuance", element: comp(MaterialIssuancePage) },
  { path: "erp/production/material-issuance", element: redirect("/production-quality/material-issuance") },

  { path: "production/completion", element: comp(ProductionCompletionPage) },
  { path: "erp/production/completion", element: redirect("/production-quality/completion") },

  { path: "quality/inspections", element: comp(InspectionPage) },
  { path: "quality/inspections/:id", element: comp(InspectionDetailsPage) },
  { path: "production/quality-inspection", element: redirect("/production-quality/inspections") },
  { path: "erp/quality/inspections", element: redirect("/production-quality/inspections") },

  { path: "quality/non-conformance", element: comp(NonConformancePage) },
  { path: "erp/quality/non-conformance", element: redirect("/production-quality/non-conformance") },

  { path: "quality/capa", element: comp(ReworkTrackingPage) },
  { path: "erp/quality/capa", element: redirect("/production-quality/rework") },
  { path: "quality/rework", element: redirect("/production-quality/rework") },
];

export default moduleRoutes;
