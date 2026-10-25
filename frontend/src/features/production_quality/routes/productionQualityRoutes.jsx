import React from "react";
import ProductionDashboard from "../pages/ProductionDashboard";
import WorkOrdersPage from "../pages/WorkOrdersPage";
import WorkOrderDetailsPage from "../pages/WorkOrderDetailsPage";
import ProductionPlanningPage from "../pages/ProductionPlanningPage";
import QualityDashboard from "../pages/QualityDashboard";
import InspectionPage from "../pages/InspectionPage";
import InspectionDetailsPage from "../pages/InspectionDetailsPage";
import NonConformancePage from "../pages/NonConformancePage";
import MaterialIssuancePage from "../pages/MaterialIssuancePage";
import ShopFloorPage from "../pages/ShopFloorPage";
import ReworkTrackingPage from "../pages/ReworkTrackingPage";
import ProductionCompletionPage from "../pages/ProductionCompletionPage";
import DispatchPage from "../pages/DispatchPage";
import QRWorkOrderPage from "../pages/QRWorkOrderPage";
import WorkOrderReportPage from "../pages/WorkOrderReportPage";
import NotificationHistoryPage from "../pages/NotificationHistoryPage";

/**
 * Route objects for Production & Quality Module (M4)
 * Exported for registration into the central App router
 */
export const productionQualityRoutes = [
  {
    path: "production-quality",
    children: [
      {
        index: true,
        element: <ProductionDashboard />,
      },
      {
        path: "production",
        element: <ProductionDashboard />,
      },
      {
        path: "dashboard",
        element: <ProductionDashboard />,
      },
      {
        path: "manufacturing",
        element: <ShopFloorPage />,
      },
      {
        path: "planning",
        element: <ProductionPlanningPage />,
      },
      {
        path: "work-orders",
        element: <WorkOrdersPage />,
      },
      {
        path: "work-orders/:id",
        element: <WorkOrderDetailsPage />,
      },
      {
        path: "work-orders/:id/qr",
        element: <QRWorkOrderPage />,
      },
      {
        path: "work-orders/:id/report.pdf",
        element: <WorkOrderReportPage />,
      },
      {
        path: "work-orders/:id/report",
        element: <WorkOrderReportPage />,
      },
      {
        path: "material-issuance",
        element: <MaterialIssuancePage />,
      },
      {
        path: "shop-floor",
        element: <ShopFloorPage />,
      },
      {
        path: "quality",
        element: <QualityDashboard />,
      },
      {
        path: "inspections",
        element: <InspectionPage />,
      },
      {
        path: "inspections/:id",
        element: <InspectionDetailsPage />,
      },
      {
        path: "non-conformance",
        element: <NonConformancePage />,
      },
      {
        path: "dispatch",
        element: <DispatchPage />,
      },
      {
        path: "rework",
        element: <ReworkTrackingPage />,
      },
      {
        path: "completion",
        element: <ProductionCompletionPage />,
      },
      {
        path: "notifications",
        element: <NotificationHistoryPage />,
      },
    ],
  },
];

export default productionQualityRoutes;
