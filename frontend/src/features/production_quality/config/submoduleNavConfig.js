import {
  Gauge,
  ClipboardList,
  Target,
  Factory,
  Box,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  CheckSquare,
  Truck,
} from "lucide-react";

/**
 * Centralized Production & Quality Submodule Navigation Configuration
 * Contains exact route paths, aliases, IDs, and Lucide icons.
 */
export const productionQualitySubmodules = [
  {
    id: "m4-dashboard",
    label: "Production Overview",
    path: "/production-quality/dashboard",
    aliases: [
      "/pq/dashboard",
      "/production/dashboard",
      "/production-quality",
      "/production",
      "/pq",
    ],
    icon: Gauge,
    description: "Plant telemetry, live line yields & FPY metrics",
  },
  {
    id: "m4-planning",
    label: "Production Planning",
    path: "/production-quality/planning",
    aliases: [
      "/pq/planning",
      "/production/planning",
      "/erp/production/planning",
    ],
    icon: Target,
    description: "Monthly production plan, capacity & calendars",
  },
  {
    id: "m4-work-orders",
    label: "Work Orders",
    path: "/production-quality/work-orders",
    aliases: [
      "/pq/work-orders",
      "/production/work-orders",
      "/work-orders",
      "/pg/work-orders",
    ],
    icon: ClipboardList,
    description: "Release fabrication orders, BOM specs & routing",
  },
  {
    id: "m4-shop-floor",
    label: "Shop-Floor Tracking",
    path: "/production-quality/manufacturing",
    aliases: [
      "/production-quality/shop-floor",
      "/production-quality/tracking",
      "/pq/manufacturing",
      "/production/manufacturing",
      "/production/shop-floor",
      "/production/tracking",
    ],
    icon: Factory,
    description: "Live line execution, output logs & downtime",
  },
  {
    id: "m4-issuance",
    label: "Material Issuance",
    path: "/production-quality/material-issuance",
    aliases: [
      "/pq/material-issuance",
      "/production/material-issuance",
      "/material-issuance",
    ],
    icon: Box,
    description: "BOM component issue, consumption & scrap return",
  },
  {
    id: "m4-inspections",
    label: "Quality Inspections",
    path: "/production-quality/inspections",
    aliases: [
      "/pq/inspections",
      "/quality/inspections",
      "/production/quality-inspection",
    ],
    icon: CheckCircle2,
    description: "In-process & final QC, ultrasonic tests & IS-3043",
  },
  {
    id: "m4-quality",
    label: "Quality Assurance",
    path: "/production-quality/quality",
    aliases: [
      "/pq/quality",
      "/quality",
      "/quality/dashboard",
    ],
    icon: ShieldAlert,
    description: "Inspection queues, QA signoffs & compliance",
  },
  {
    id: "m4-ncr",
    label: "Non-Conformance (NCR)",
    path: "/production-quality/non-conformance",
    aliases: [
      "/pq/non-conformance",
      "/quality/non-conformance",
      "/production-quality/rework",
      "/pq/rework",
      "/quality/capa",
      "/quality/rework",
      "/rework",
    ],
    icon: AlertTriangle,
    description: "Defect logging, root cause & CAPA action plans",
  },
  {
    id: "m4-completion",
    label: "Finished Goods Approval",
    path: "/production-quality/completion",
    aliases: [
      "/pq/completion",
      "/production/completion",
    ],
    icon: CheckSquare,
    description: "Finished goods release & warehouse handover",
  },
  {
    id: "m4-dispatch",
    label: "Production Dispatch",
    path: "/production-quality/dispatch",
    aliases: [
      "/pq/dispatch",
      "/production/dispatch",
      "/dispatch",
    ],
    icon: Truck,
    description: "QC release gate pass, packing & delivery challans",
  },
];

export default productionQualitySubmodules;
