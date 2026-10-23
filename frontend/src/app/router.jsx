import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import ERPLayout from "../layouts/ERPLayout";
import DashboardPage from "../features/dashboard/pages/DashboardPage";
import LoginPage from "../features/auth/pages/LoginPage";
import moduleRoutes from "./routeRegistry";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <ERPLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/pq/dashboard" replace />,
      },
      {
        path: "pq/dashboard",
        element: <DashboardPage />,
      },
      {
        path: "dashboard",
        element: <Navigate to="/pq/dashboard" replace />,
      },
      {
        path: "erp/dashboard",
        element: <Navigate to="/pq/dashboard" replace />,
      },
      ...moduleRoutes,
      {
        path: "*",
        element: <Navigate to="/pq/dashboard" replace />,
      },
    ],
  },
]);

export default router;
