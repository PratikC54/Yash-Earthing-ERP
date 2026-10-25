import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Factory,
  ClipboardList,
  Target,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CheckSquare,
  Gauge,
  ShieldAlert,
  Search,
  Eye,
  ArrowRight,
  X,
  Layers,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  QrCode,
} from "lucide-react";
import productionService from "../../production_quality/services/productionService";
import qualityService from "../../production_quality/services/qualityService";
import QRLabelModal from "../../production_quality/components/qr/QRLabelModal";
import StatusBadge from "../../../components/common/StatusBadge";
import Loader from "../../../components/common/Loader";
import { formatDate } from "../../production_quality/utils/productionQualityHelpers";

export default function DashboardPage() {
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showKpis, setShowKpis] = useState(true);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Raw data from APIs
  const [planningMetrics, setPlanningMetrics] = useState(null);
  const [qualityMetrics, setQualityMetrics] = useState(null);
  const [workOrders, setWorkOrders] = useState([]);
  const [inspections, setInspections] = useState([]);

  // Filtering & Search
  const [woSearch, setWoSearch] = useState("");
  const [woStatusFilter, setWoStatusFilter] = useState("ALL");
  const [qaSearch, setQaSearch] = useState("");
  const [qaStatusFilter, setQaStatusFilter] = useState("ALL");

  // Detail Modal selection
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [selectedInspection, setSelectedInspection] = useState(null);

  // Data Fetching
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        planningRes,
        _manufacturingRes,
        qualityRes,
        workOrdersRes,
        inspectionsRes,
      ] = await Promise.allSettled([
        productionService.getPlanningDashboard(),
        productionService.getManufacturingDashboard(),
        qualityService.getQualityDashboard(),
        productionService.listWorkOrders({ limit: 50 }),
        qualityService.getInspectionReport({ limit: 50 }),
      ]);

      // 1. Planning metrics
      if (planningRes.status === "fulfilled" && planningRes.value?.data?.metrics) {
        setPlanningMetrics(planningRes.value.data.metrics);
      }

      // 2. Quality metrics
      if (qualityRes.status === "fulfilled" && qualityRes.value?.data?.metrics) {
        setQualityMetrics(qualityRes.value.data.metrics);
      }

      // 3. Work Orders
      if (workOrdersRes.status === "fulfilled" && Array.isArray(workOrdersRes.value?.data)) {
        const fetchedWOs = workOrdersRes.value.data.map((wo) => ({
          id: wo.id,
          workOrderNo: wo.workOrderNo || "",
          productName: wo.bomRevision?.product?.name || wo.productName || "",
          sku: wo.bomRevision?.product?.sku || wo.sku || "",
          bomReference: wo.bomRevision?.revision || "",
          plannedQuantity: Number(wo.plannedQuantity) || 0,
          goodQuantity: Number(wo.goodQuantity) || 0,
          rejectedQuantity: Number(wo.rejectedQuantity) || 0,
          assignedLine: wo.assignedLine || "",
          priority: wo.priority || "",
          plannedStart: wo.plannedStart,
          plannedEnd: wo.plannedEnd,
          status: wo.status,
          customer: wo.salesOrder?.customer?.name || "",
        }));
        setWorkOrders(fetchedWOs);
      } else if (workOrdersRes.status === "rejected") {
        setError(workOrdersRes.reason?.message || "Failed to load work orders from backend API.");
      }

      // 4. Quality Inspections
      if (inspectionsRes.status === "fulfilled" && Array.isArray(inspectionsRes.value?.data)) {
        const fetchedInspections = inspectionsRes.value.data.map((qi) => ({
          id: qi.id,
          inspectionNo: qi.inspectionNo,
          workOrderNo: qi.workOrderNo || "",
          productName: qi.productName || "",
          sku: qi.sku || "",
          inspectionType: qi.inspectionType || "",
          inspectedQuantity: Number(qi.inspectedQuantity) || 0,
          acceptedQuantity: Number(qi.acceptedQuantity) || 0,
          rejectedQuantity: Number(qi.rejectedQuantity) || 0,
          inspector: qi.inspector || "",
          status: qi.status,
          inspectedAt: qi.inspectedAt || qi.createdAt,
        }));
        setInspections(fetchedInspections);
      } else if (inspectionsRes.status === "rejected") {
        setError(inspectionsRes.reason?.message || "Failed to load quality inspections from backend API.");
      }

    } catch (err) {
      console.error("Dashboard data load error:", err);
      setError("Unable to sync live shop-floor telemetry from backend API. Please check server connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ==========================================
  // Calculated Metrics for Section 3A & 3B
  // ==========================================
  const totalWorkOrdersCount = planningMetrics?.totalWorkOrders ?? workOrders.length;
  
  const totalPlannedQty = useMemo(() => {
    return workOrders.reduce((acc, wo) => acc + (Number(wo.plannedQuantity) || 0), 0);
  }, [workOrders]);

  const totalProducedQty = useMemo(() => {
    return workOrders.reduce((acc, wo) => acc + (Number(wo.goodQuantity) || 0), 0);
  }, [workOrders]);

  const totalRemainingQty = Math.max(0, totalPlannedQty - totalProducedQty);

  const lineWorkloads = useMemo(() => {
    const workloads = new Map();
    workOrders.forEach((workOrder) => {
      if (workOrder.assignedLine) {
        workloads.set(
          workOrder.assignedLine,
          (workloads.get(workOrder.assignedLine) || 0) + 1,
        );
      }
    });
    return Array.from(workloads, ([line, count]) => ({ line, count }));
  }, [workOrders]);

  const inProgressWorkOrdersCount = useMemo(() => {
    if (planningMetrics?.inProgress !== undefined) return planningMetrics.inProgress;
    return workOrders.filter((wo) => wo.status === "IN_PROGRESS").length;
  }, [planningMetrics, workOrders]);

  const completedWorkOrdersCount = useMemo(() => {
    if (planningMetrics?.completed !== undefined) return planningMetrics.completed;
    return workOrders.filter((wo) => wo.status === "COMPLETED" || wo.status === "RELEASED").length;
  }, [planningMetrics, workOrders]);

  const delayedWorkOrdersCount = useMemo(() => {
    const today = new Date();
    return workOrders.filter((wo) => {
      if (wo.status === "COMPLETED" || wo.status === "CANCELLED") return false;
      if (!wo.plannedEnd) return false;
      return new Date(wo.plannedEnd) < today;
    }).length;
  }, [workOrders]);

  const overallProgressPercentage = totalPlannedQty > 0
    ? Math.min(100, Math.round((totalProducedQty / totalPlannedQty) * 100))
    : 0;

  // Quality metrics
  const totalInspectionsCount = qualityMetrics?.totalInspections ?? inspections.length;
  const pendingInspectionsCount = useMemo(() => {
    if (qualityMetrics?.pendingInspection !== undefined) return qualityMetrics.pendingInspection;
    return inspections.filter((i) => i.status === "PENDING" || i.status === "HOLD" || i.status === "NOT_STARTED").length;
  }, [qualityMetrics, inspections]);

  const passedInspectionsCount = useMemo(() => {
    if (qualityMetrics?.passed !== undefined && qualityMetrics.passed > 0) return qualityMetrics.passed;
    if (qualityMetrics?.releasedToInventory !== undefined && qualityMetrics.releasedToInventory > 0) return qualityMetrics.releasedToInventory;
    return inspections.filter((i) => i.status === "PASSED" || i.status === "RELEASED" || i.status === "APPROVED").length;
  }, [qualityMetrics, inspections]);

  const failedInspectionsCount = useMemo(() => {
    if (qualityMetrics?.failed !== undefined) return qualityMetrics.failed;
    return inspections.filter((i) => i.status === "FAIL" || i.status === "FAILED" || i.status === "REJECTED").length;
  }, [qualityMetrics, inspections]);

  const totalRejectedQty = useMemo(() => {
    const fromWOs = workOrders.reduce((acc, wo) => acc + (Number(wo.rejectedQuantity) || 0), 0);
    const fromQA = inspections.reduce((acc, i) => acc + (Number(i.rejectedQuantity) || 0), 0);
    return Math.max(fromWOs, fromQA);
  }, [workOrders, inspections]);

  const totalAcceptedQty = useMemo(() => {
    const fromWOs = workOrders.reduce((acc, wo) => acc + (Number(wo.goodQuantity) || 0), 0);
    const fromQA = inspections.reduce((acc, i) => acc + (Number(i.acceptedQuantity) || 0), 0);
    return Math.max(fromWOs, fromQA);
  }, [workOrders, inspections]);

  const productionEfficiency = useMemo(() => {
    if (totalPlannedQty <= 0) return "—";
    const ratio = (totalProducedQty / totalPlannedQty) * 100;
    return `${Math.round(ratio * 10) / 10}%`;
  }, [totalProducedQty, totalPlannedQty]);

  const firstPassYieldValue = totalInspectionsCount > 0
    ? (passedInspectionsCount / totalInspectionsCount) * 100
    : null;
  const firstPassYield = useMemo(() => {
    return firstPassYieldValue === null ? "—" : `${firstPassYieldValue.toFixed(1)}%`;
  }, [firstPassYieldValue]);

  // 8 Specific KPI Cards as required by Section 3A
  const kpiCardsData = [
    {
      id: "total-wo",
      label: "TOTAL WORK ORDERS",
      value: String(totalWorkOrdersCount),
      subtext: `${inProgressWorkOrdersCount} active on shop floor`,
      icon: ClipboardList,
      color: "from-blue-600 to-indigo-600",
      accent: "text-[#3B82F6]",
      bgAccent: "bg-[#3B82F6]/10",
      link: "/production/work-orders",
    },
    {
      id: "planned-prod",
      label: "PLANNED PRODUCTION",
      value: `${totalPlannedQty.toLocaleString("en-IN")} Nos`,
      subtext: "From loaded work orders",
      icon: Target,
      color: "from-indigo-600 to-purple-600",
      accent: "text-indigo-400",
      bgAccent: "bg-indigo-500/10",
      link: "/production/planning",
    },
    {
      id: "in-progress",
      label: "PRODUCTION IN PROGRESS",
      value: `${inProgressWorkOrdersCount} Orders`,
      subtext: "From loaded work orders",
      icon: Activity,
      color: "from-amber-600 to-yellow-600",
      accent: "text-[#FACC15]",
      bgAccent: "bg-[#FACC15]/10",
      link: "/production/shop-floor",
    },
    {
      id: "completed-wo",
      label: "COMPLETED WORK ORDERS",
      value: `${completedWorkOrdersCount} Orders`,
      subtext: "From loaded work orders",
      icon: CheckCircle2,
      color: "from-emerald-600 to-teal-600",
      accent: "text-[#2DD4BF]",
      bgAccent: "bg-[#2DD4BF]/10",
      link: "/production/work-orders",
    },
    {
      id: "pending-qa",
      label: "PENDING QA INSPECTIONS",
      value: `${pendingInspectionsCount} Batches`,
      subtext: "From loaded inspections",
      icon: Clock,
      color: "from-purple-600 to-pink-600",
      accent: "text-purple-400",
      bgAccent: "bg-purple-500/10",
      link: "/production/quality-inspection",
    },
    {
      id: "rejected-qty",
      label: "REJECTED QUANTITY",
      value: `${totalRejectedQty.toLocaleString("en-IN")} Nos`,
      subtext: "From loaded inspections",
      icon: AlertTriangle,
      color: "from-rose-600 to-red-600",
      accent: "text-[#F87171]",
      bgAccent: "bg-[#F87171]/10",
      link: "/production-quality/non-conformance",
    },
    {
      id: "accepted-qty",
      label: "ACCEPTED QUANTITY",
      value: `${totalAcceptedQty.toLocaleString("en-IN")} Nos`,
      subtext: "From loaded inspections",
      icon: CheckSquare,
      color: "from-teal-600 to-emerald-600",
      accent: "text-[#2DD4BF]",
      bgAccent: "bg-[#2DD4BF]/10",
      link: "/production-quality/manufacturing",
    },
    {
      id: "prod-efficiency",
      label: "PRODUCTION EFFICIENCY",
      value: productionEfficiency,
      subtext: `First-Pass Yield: ${firstPassYield}`,
      icon: Gauge,
      color: "from-cyan-600 to-blue-600",
      accent: "text-cyan-400",
      bgAccent: "bg-cyan-500/10",
      link: "/production-quality/manufacturing",
    },
  ];

  // Workflow Stages as required by Section 3F
  const workflowStages = [
    {
      id: "stage-planning",
      step: "01",
      title: "Production Planning",
      count: `${totalWorkOrdersCount} Total`,
      status: planningMetrics ? `${planningMetrics.planned} Planned` : "—",
      path: "/production-quality/planning",
      color: "border-blue-500 text-blue-400",
      desc: "Resource allocation & calendar",
    },
    {
      id: "stage-wo-creation",
      step: "02",
      title: "Work Order Creation",
      count: `${inProgressWorkOrdersCount + completedWorkOrdersCount} Released`,
      status: planningMetrics ? `${planningMetrics.readyForProduction} Released` : "—",
      path: "/production-quality/work-orders",
      color: "border-indigo-500 text-indigo-400",
      desc: "BOM revision & specs attached",
    },
    {
      id: "stage-materials",
      step: "03",
      title: "Material Availability",
      count: "—",
      status: "—",
      path: "/production-quality/material-issuance",
      color: "border-teal-500 text-[#2DD4BF]",
      desc: "Inventory availability",
    },
    {
      id: "stage-execution",
      step: "04",
      title: "Production Execution",
      count: `${inProgressWorkOrdersCount} Active Jobs`,
      status: inProgressWorkOrdersCount > 0 ? `${inProgressWorkOrdersCount} Active` : "—",
      path: "/production-quality/manufacturing",
      color: "border-amber-500 text-[#FACC15]",
      desc: "Manufacturing operations",
    },
    {
      id: "stage-quality",
      step: "05",
      title: "Quality Inspection",
      count: `${totalInspectionsCount} Inspected`,
      status: `${pendingInspectionsCount} Pending`,
      path: "/production-quality/inspections",
      color: "border-purple-500 text-purple-400",
      desc: "Ultrasonic, IS-3043 & coating",
    },
    {
      id: "stage-fg-approval",
      step: "06",
      title: "Finished Goods Approval",
      count: `${completedWorkOrdersCount} Released`,
      status: `${completedWorkOrdersCount} Completed`,
      path: "/production-quality/completion",
      color: "border-emerald-500 text-emerald-400",
      desc: "Final packaging & warehouse issue",
    },
  ];

  // Filtered Work Orders Table Records (Section 3C)
  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      const matchesSearch =
        wo.workOrderNo.toLowerCase().includes(woSearch.toLowerCase()) ||
        wo.productName.toLowerCase().includes(woSearch.toLowerCase()) ||
        (wo.customer && wo.customer.toLowerCase().includes(woSearch.toLowerCase()));

      const matchesStatus =
        woStatusFilter === "ALL" || wo.status === woStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [workOrders, woSearch, woStatusFilter]);

  // Filtered Quality Inspections Table Records (Section 3E)
  const filteredInspections = useMemo(() => {
    return inspections.filter((qi) => {
      const matchesSearch =
        (qi.inspectionNo || "").toLowerCase().includes(qaSearch.toLowerCase()) ||
        qi.workOrderNo.toLowerCase().includes(qaSearch.toLowerCase()) ||
        qi.productName.toLowerCase().includes(qaSearch.toLowerCase()) ||
        qi.inspector.toLowerCase().includes(qaSearch.toLowerCase());

      const matchesStatus =
        qaStatusFilter === "ALL" || qi.status === qaStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [inspections, qaSearch, qaStatusFilter]);

  if (loading) {
    return (
      <div className="space-y-6 pb-12 animate-fade-in">
        {/* 1. Header Banner Skeleton */}
        <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-2xl shadow-xs space-y-2.5 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="h-5 w-36 bg-slate-200/80 rounded-full" />
            <div className="h-5 w-20 bg-slate-200/60 rounded" />
          </div>
          <div className="h-7 w-80 bg-slate-200/80 rounded-lg" />
          <div className="h-4 w-96 max-w-full bg-slate-200/50 rounded" />
        </div>

        {/* 2. 8 KPI Cards Skeleton */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-48 bg-slate-200/80 rounded animate-pulse" />
            <div className="h-3 w-36 bg-slate-200/50 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-xs animate-pulse space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="h-3 w-28 bg-slate-200/80 rounded" />
                  <div className="w-8 h-8 rounded-lg bg-slate-200/70 shrink-0" />
                </div>
                <div className="my-2">
                  <div className="h-7 w-24 bg-slate-200/80 rounded-lg" />
                </div>
                <div className="h-3 w-36 bg-slate-200/50 rounded pt-1 border-t border-slate-100" />
              </div>
            ))}
          </div>
        </div>

        {/* 3. 6 Lifecycle Stages Stepper Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 animate-pulse"
            >
              <div className="h-3 w-8 bg-slate-200/80 rounded" />
              <div className="h-4 w-24 bg-slate-200/80 rounded" />
              <div className="h-3 w-16 bg-slate-200/50 rounded" />
            </div>
          ))}
        </div>

        {/* 4. Work Orders Table Skeleton */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs p-4 space-y-3 animate-pulse">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="h-5 w-44 bg-slate-200/80 rounded" />
            <div className="h-8 w-60 bg-slate-200/60 rounded-xl" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="py-2.5 flex items-center justify-between gap-4 border-b border-slate-50 last:border-0">
              <div className="h-4 w-28 bg-slate-200/80 rounded" />
              <div className="h-4 w-40 bg-slate-200/80 rounded" />
              <div className="h-4 w-20 bg-slate-200/60 rounded" />
              <div className="h-5 w-20 bg-slate-200/70 rounded-full" />
              <div className="h-6 w-16 bg-slate-200/60 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-[#10182f] border border-[#1e2a4a] p-5 sm:p-6 rounded-2xl shadow-lg">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#2DD4BF]/10 text-[#2DD4BF] border border-[#2DD4BF]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF] animate-pulse" />
              Production & Quality
            </span>
            <span className="text-xs text-[#94a3b8] bg-[#0a1020] px-2 py-0.5 rounded border border-[#1e2a4a]">
              ERP data
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#f1f5f9] tracking-tight">
            Production & Quality Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#94a3b8] mt-1 max-w-3xl">
            Operational metrics from production orders and quality inspections.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsQRModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#0a1020] hover:bg-[#1e2a4a] border border-[#1e2a4a] text-blue-400 hover:text-blue-300 transition shadow-sm cursor-pointer"
            title="View & Print Work Order QR Code"
          >
            <QrCode className="w-4 h-4 text-blue-400" />
            <span>QR Code</span>
          </button>
        </div>

      </div>

      {/* Error / Alert notice if any */}
      {error && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
          <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => fetchDashboardData()}
            className="underline font-bold text-amber-300 hover:text-white shrink-0"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* 2. SECTION 3A: 8 Required KPI Cards */}
      <section aria-labelledby="core-kpis-heading">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h2 id="core-kpis-heading" className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#94a3b8]">
              Core Production & Quality KPIs
            </h2>
            <span className="hidden sm:inline-block text-[11px] text-[#64748b]">
              Calculated from active ERP records
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowKpis((prev) => !prev)}
            aria-expanded={showKpis}
            aria-controls="production-quality-kpi-cards"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1e2a4a] bg-[#10182f] text-xs font-semibold text-[#94a3b8] hover:text-[#f1f5f9] hover:border-[#3b82f6]/60 hover:bg-slate-800/40 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
          >
            <span>{showKpis ? "Hide KPIs" : "Show KPIs"}</span>
            {showKpis ? (
              <ChevronUp className="w-3.5 h-3.5 text-[#3b82f6]" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-[#3b82f6]" aria-hidden="true" />
            )}
          </button>
        </div>

        <div
          id="production-quality-kpi-cards"
          className={`grid transition-all duration-300 ease-in-out ${
            showKpis
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0 pointer-events-none"
          }`}
        >
          <div className="overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-0.5 pb-1">
              {kpiCardsData.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.id}
                    onClick={() => navigate(card.link)}
                    className="bg-[#10182f] border border-[#1e2a4a] hover:border-[#3b82f6]/60 rounded-xl p-4 flex flex-col justify-between shadow-xs hover:bg-slate-800/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] leading-tight">
                        {card.label}
                      </span>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${card.bgAccent} ${card.accent}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="my-2.5">
                      <div className="text-xl sm:text-2xl font-black text-[#f1f5f9] tracking-tight group-hover:text-white">
                        {card.value}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#94a3b8] pt-1 border-t border-[#1e2a4a]">
                      <span className="truncate">{card.subtext}</span>
                      <ArrowRight className="w-3 h-3 text-[#3b82f6] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION 3F: Production Workflow Pipeline */}
      <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#1e2a4a]">
          <div>
            <h3 className="text-sm font-bold text-[#f1f5f9] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#3b82f6]" />
              <span>Production & Quality Lifecycle Pipeline</span>
            </h3>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Click any stage to drill down directly into the corresponding workspace module
            </p>
          </div>
          <span className="text-[11px] font-semibold text-[#2DD4BF] bg-[#2DD4BF]/10 px-2.5 py-1 rounded-full border border-[#2DD4BF]/30 self-start sm:self-auto">
            ● End-to-End Traceability Active
          </span>
        </div>

        {/* Workflow Horizontal Stepper */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 mt-4">
          {workflowStages.map((stg) => (
            <div
              key={stg.id}
              onClick={() => navigate(stg.path)}
              className="relative p-3.5 rounded-xl bg-[#0a1020] border border-[#1e2a4a] hover:border-[#3b82f6] hover:bg-slate-800/40 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#64748b] mb-1.5">
                  <span>STAGE {stg.step}</span>
                  <ChevronRight className="w-3 h-3 text-[#3b82f6] group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-xs font-bold text-[#f1f5f9] group-hover:text-[#3b82f6] transition-colors leading-snug">
                  {stg.title}
                </div>
                <div className="text-[10px] text-[#94a3b8] mt-1 leading-tight line-clamp-2">
                  {stg.desc}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-[#1e2a4a] flex items-center justify-between text-[11px]">
                <span className="font-bold text-[#f1f5f9]">{stg.count}</span>
                <span className="text-[9.5px] font-semibold text-[#2DD4BF] bg-[#2DD4BF]/10 px-1.5 py-0.2 rounded">
                  {stg.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. SECTION 3B: Production Overview & Line Workloads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Production Overview Metrics Card */}
        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2a4a]">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#3b82f6]" />
                <h3 className="text-sm font-bold text-[#f1f5f9]">Production Overview</h3>
              </div>
              <span className="text-[11px] font-semibold text-[#2DD4BF] bg-[#2DD4BF]/10 px-2 py-0.5 rounded border border-[#2DD4BF]/30">
                Loaded data
              </span>
            </div>

            {/* Metrics Breakdown */}
            <div className="space-y-3.5 mt-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#94a3b8]">Total Planned Quantity</span>
                <span className="font-bold text-[#f1f5f9] font-mono">
                  {totalPlannedQty.toLocaleString("en-IN")} Nos
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94a3b8]">Actual Production Quantity</span>
                <span className="font-bold text-[#2DD4BF] font-mono">
                  {totalProducedQty.toLocaleString("en-IN")} Nos
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94a3b8]">Remaining Production Quantity</span>
                <span className="font-bold text-[#FACC15] font-mono">
                  {totalRemainingQty.toLocaleString("en-IN")} Nos
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94a3b8]">Work Orders In Progress</span>
                <span className="font-bold text-[#3b82f6] font-mono">
                  {inProgressWorkOrdersCount} Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94a3b8]">Completed Orders</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {completedWorkOrdersCount} Released
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94a3b8]">Delayed Work Orders</span>
                <span className={`font-bold font-mono ${delayedWorkOrdersCount > 0 ? "text-[#F87171]" : "text-[#64748b]"}`}>
                  {delayedWorkOrdersCount} Flagged
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-5 pt-4 border-t border-[#1e2a4a]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-[#f1f5f9]">Overall Production Progress</span>
              <span className="font-mono font-bold text-[#2DD4BF]">{overallProgressPercentage}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[#0a1020] border border-[#1e2a4a] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#3b82f6] via-[#2DD4BF] to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${overallProgressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 3D: Quality Overview Card */}
        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2a4a]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#2DD4BF]" />
                <h3 className="text-sm font-bold text-[#f1f5f9]">Quality Assurance Overview</h3>
              </div>
              <span className="text-[11px] font-semibold text-[#3b82f6] bg-[#3b82f6]/10 px-2 py-0.5 rounded border border-[#3b82f6]/30">
                QA Compliance
              </span>
            </div>

            {/* Quality Metrics */}
            <div className="space-y-3.5 mt-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#94a3b8]">Total Inspections Logged</span>
                <span className="font-bold text-[#f1f5f9] font-mono">{totalInspectionsCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94a3b8]">Pending QA Inspections</span>
                <span className="font-bold text-[#FACC15] font-mono">{pendingInspectionsCount} Pending</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94a3b8]">Passed & Released Inspections</span>
                <span className="font-bold text-[#2DD4BF] font-mono">{passedInspectionsCount} Passed</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94a3b8]">Failed / Rejected Audits</span>
                <span className="font-bold text-[#F87171] font-mono">{failedInspectionsCount} Failed</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94a3b8]">Total Rejected Scrap Units</span>
                <span className="font-bold text-[#F87171] font-mono">
                  {totalRejectedQty.toLocaleString("en-IN")} Nos
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94a3b8]">First-Pass Yield (FPY)</span>
                <span className="font-bold text-[#2DD4BF] font-mono">{firstPassYield}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[#1e2a4a]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-[#f1f5f9]">Quality Acceptance Rate</span>
              <span className="font-mono font-bold text-[#2DD4BF]">{firstPassYield}</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[#0a1020] border border-[#1e2a4a] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-[#2DD4BF] rounded-full transition-all duration-500"
                style={{ width: `${firstPassYieldValue ?? 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Active Production Line Workload Indicators */}
        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-md space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#1e2a4a]">
            <div className="flex items-center gap-2">
              <Factory className="w-4 h-4 text-[#FACC15]" />
              <h3 className="text-sm font-bold text-[#f1f5f9]">Shop Floor Lines</h3>
            </div>
            <span className="text-[11px] text-[#94a3b8] font-semibold">
              {lineWorkloads.length} Lines
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {lineWorkloads.length > 0 ? (
              lineWorkloads.map(({ line, count }) => (
                <div key={line} className="p-2.5 rounded-xl bg-[#0a1020] border border-[#1e2a4a]">
                  <div className="flex justify-between font-semibold text-[#f1f5f9]">
                    <span>{line}</span>
                    <span className="text-[#94a3b8]">{count} Work Orders</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-[#94a3b8]">
                No production line data available.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 5. SECTION 3C: Work Order Summary Table */}
      <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e2a4a]">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#f1f5f9] flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#3b82f6]" />
              <span>Work Order Summary</span>
            </h3>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Live fabrication registry with planned output, status, and assignment
            </p>
          </div>
          <Link
            to="/production/work-orders"
            className="text-xs text-[#3b82f6] hover:text-blue-400 font-semibold flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View Full Register</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={woSearch}
              onChange={(e) => setWoSearch(e.target.value)}
              placeholder="Search by WO #, product, or customer..."
              className="w-full h-9 pl-9 pr-8 text-xs bg-[#0a1020] text-[#f1f5f9] placeholder-[#64748b] rounded-lg border border-[#1e2a4a] focus:outline-none focus:border-[#3b82f6]"
            />
            {woSearch && (
              <button
                type="button"
                onClick={() => setWoSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {["ALL", "IN_PROGRESS", "PLANNED", "COMPLETED", "QC_HOLD", "DRAFT"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setWoStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors ${
                  woStatusFilter === st
                    ? "bg-[#3b82f6] text-white"
                    : "bg-[#0a1020] text-[#94a3b8] hover:bg-slate-800/40 hover:text-[#f1f5f9] border border-[#1e2a4a]"
                }`}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto rounded-xl border border-[#1e2a4a]">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#0b1329] text-[#94a3b8] uppercase text-[10px] tracking-wider border-b border-[#1e2a4a]">
              <tr>
                <th className="py-3 px-4">Work Order #</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Planned Qty</th>
                <th className="py-3 px-4">Produced Qty</th>
                <th className="py-3 px-4">Production Line</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Completion Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a4a] text-[#f1f5f9]">
              {filteredWorkOrders.length > 0 ? (
                filteredWorkOrders.slice(0, 8).map((wo) => {
                  const progress = wo.plannedQuantity > 0
                    ? Math.min(100, Math.round((wo.goodQuantity / wo.plannedQuantity) * 100))
                    : 0;

                  return (
                    <tr key={wo.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#3b82f6]">
                        {wo.workOrderNo}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold max-w-[240px] truncate">{wo.productName}</div>
                        <div className="text-[10px] text-[#94a3b8]">{wo.sku} · {wo.customer}</div>
                      </td>
                      <td className="py-3 px-4 font-mono">{wo.plannedQuantity.toLocaleString("en-IN")} Nos</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#2DD4BF]">{wo.goodQuantity}</span>
                          <span className="text-[10px] text-[#94a3b8]">({progress}%)</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#94a3b8] max-w-[180px] truncate">{wo.assignedLine}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            wo.priority === "CRITICAL"
                              ? "bg-rose-500/20 text-[#F87171] border border-rose-500/30"
                              : wo.priority === "HIGH"
                              ? "bg-amber-500/20 text-[#FACC15] border border-amber-500/30"
                              : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          }`}
                        >
                          {wo.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#94a3b8]">{formatDate(wo.plannedEnd)}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={wo.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedWorkOrder(wo)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#0a1020] hover:bg-slate-800/40 text-[#94a3b8] hover:text-[#f1f5f9] transition-colors border border-[#1e2a4a]"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="py-6 text-center text-xs text-[#94a3b8]">
                    No work orders match the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. SECTION 3E: Recent Quality Inspections Table */}
      <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e2a4a]">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#f1f5f9] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#2DD4BF]" />
              <span>Recent Quality Inspections</span>
            </h3>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Tolerance audits, spectrometry results, and finished goods compliance logs
            </p>
          </div>
          <Link
            to="/production/quality-inspection"
            className="text-xs text-[#2DD4BF] hover:text-teal-300 font-semibold flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All QA Audits</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Quality Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={qaSearch}
              onChange={(e) => setQaSearch(e.target.value)}
              placeholder="Search by QI #, WO #, or inspector..."
              className="w-full h-9 pl-9 pr-8 text-xs bg-[#0a1020] text-[#f1f5f9] placeholder-[#64748b] rounded-lg border border-[#1e2a4a] focus:outline-none focus:border-[#2DD4BF]"
            />
            {qaSearch && (
              <button
                type="button"
                onClick={() => setQaSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {["ALL", "RELEASED", "PASSED", "HOLD", "PENDING", "FAILED"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setQaStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors ${
                  qaStatusFilter === st
                    ? "bg-[#2DD4BF] text-slate-900"
                    : "bg-[#0a1020] text-[#94a3b8] hover:bg-slate-800/40 hover:text-[#f1f5f9] border border-[#1e2a4a]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Quality Table */}
        <div className="overflow-x-auto rounded-xl border border-[#1e2a4a]">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#0b1329] text-[#94a3b8] uppercase text-[10px] tracking-wider border-b border-[#1e2a4a]">
              <tr>
                <th className="py-3 px-4">Inspection ID</th>
                <th className="py-3 px-4">Work Order #</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Inspection Type</th>
                <th className="py-3 px-4">Inspected Qty</th>
                <th className="py-3 px-4">Accepted Qty</th>
                <th className="py-3 px-4">Rejected Qty</th>
                <th className="py-3 px-4">Inspector</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a4a] text-[#f1f5f9]">
              {filteredInspections.length > 0 ? (
                filteredInspections.slice(0, 8).map((qi) => (
                  <tr key={qi.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#2DD4BF]">
                      {qi.inspectionNo}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#3b82f6]">
                      {qi.workOrderNo}
                    </td>
                    <td className="py-3 px-4 font-medium max-w-[200px] truncate">
                      {qi.productName}
                    </td>
                    <td className="py-3 px-4 text-[#94a3b8] max-w-[200px] truncate">
                      {qi.inspectionType}
                    </td>
                    <td className="py-3 px-4 font-mono">{qi.inspectedQuantity} Nos</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#2DD4BF]">
                      {qi.acceptedQuantity} Nos
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#F87171]">
                      {qi.rejectedQuantity} Nos
                    </td>
                    <td className="py-3 px-4 text-[#94a3b8]">{qi.inspector}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={qi.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedInspection(qi)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#0a1020] hover:bg-[#2DD4BF] hover:text-slate-900 text-[#f1f5f9] transition-colors border border-[#1e2a4a]"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="py-6 text-center text-xs text-[#94a3b8]">
                    No quality inspection audits match the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================================================== */}
      {/* Detail Modals for View Actions                       */}
      {/* ==================================================== */}
      {/* 1. Work Order Detail Modal */}
      {selectedWorkOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-5 bg-[#0b172d] border-b border-[#1e2a4a] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3b82f6]">
                  Work Order Details
                </span>
                <h3 className="text-base font-bold text-[#f1f5f9]">
                  {selectedWorkOrder.workOrderNo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWorkOrder(null)}
                className="p-1 rounded-lg text-[#94a3b8] hover:text-white hover:bg-slate-800/40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 p-3 rounded-xl bg-[#070e1e] border border-[#1e2a4a]">
                <div>
                  <span className="text-[#94a3b8]">Product</span>
                  <p className="font-semibold text-[#f1f5f9] mt-0.5">{selectedWorkOrder.productName}</p>
                </div>
                <div>
                  <span className="text-[#94a3b8]">Customer</span>
                  <p className="font-semibold text-[#f1f5f9] mt-0.5">{selectedWorkOrder.customer}</p>
                </div>
                <div>
                  <span className="text-[#94a3b8]">BOM Reference</span>
                  <p className="font-mono text-[#f1f5f9] mt-0.5">{selectedWorkOrder.bomReference}</p>
                </div>
                <div>
                  <span className="text-[#94a3b8]">Assigned Line</span>
                  <p className="font-semibold text-[#f1f5f9] mt-0.5">{selectedWorkOrder.assignedLine}</p>
                </div>
                <div>
                  <span className="text-[#94a3b8]">Planned Quantity</span>
                  <p className="font-mono font-bold text-[#f1f5f9] mt-0.5">{selectedWorkOrder.plannedQuantity} Nos</p>
                </div>
                <div>
                  <span className="text-[#94a3b8]">Produced Quantity</span>
                  <p className="font-mono font-bold text-[#2DD4BF] mt-0.5">{selectedWorkOrder.goodQuantity} Nos</p>
                </div>
                <div>
                  <span className="text-[#94a3b8]">Priority</span>
                  <p className="font-bold text-[#FACC15] mt-0.5">{selectedWorkOrder.priority}</p>
                </div>
                <div>
                  <span className="text-[#94a3b8]">Status</span>
                  <div className="mt-0.5">
                    <StatusBadge status={selectedWorkOrder.status} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e2a4a]">
                <button
                  type="button"
                  onClick={() => setSelectedWorkOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0a1020] text-[#94a3b8] hover:bg-slate-800/40 border border-[#1e2a4a]"
                >
                  Close
                </button>
                <Link
                  to={`/production/work-orders/${selectedWorkOrder.id}`}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#3b82f6] hover:bg-blue-600 text-white"
                >
                  Full Work Order Page →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Quality Inspection Detail Modal */}
      {selectedInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-5 bg-[#0b172d] border-b border-[#1e2a4a] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2DD4BF]">
                  Quality Audit Details
                </span>
                <h3 className="text-base font-bold text-[#f1f5f9]">
                  {selectedInspection.inspectionNo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInspection(null)}
                className="p-1 rounded-lg text-[#94a3b8] hover:text-white hover:bg-slate-800/40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 p-3 rounded-xl bg-[#070e1e] border border-[#1e2a4a]">
                <div>
                  <span className="text-[#94a3b8]">Work Order</span>
                  <p className="font-mono font-bold text-[#3b82f6] mt-0.5">{selectedInspection.workOrderNo}</p>
                </div>
                <div>
                  <span className="text-[#94a3b8]">Product</span>
                  <p className="font-semibold text-[#f1f5f9] mt-0.5">{selectedInspection.productName}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[#94a3b8]">Inspection Type</span>
                  <p className="font-medium text-[#f1f5f9] mt-0.5">{selectedInspection.inspectionType}</p>
                </div>
                <div>
                  <span className="text-[#94a3b8]">Inspected Quantity</span>
                  <p className="font-mono text-[#f1f5f9] mt-0.5">{selectedInspection.inspectedQuantity} Nos</p>
                </div>
                <div>
                  <span className="text-[#94a3b8]">Accepted Quantity</span>
                  <p className="font-mono font-bold text-[#2DD4BF] mt-0.5">{selectedInspection.acceptedQuantity} Nos</p>
                </div>
                <div>
                  <span className="text-[#94a3b8]">Rejected Scrap</span>
                  <p className="font-mono font-bold text-[#F87171] mt-0.5">{selectedInspection.rejectedQuantity} Nos</p>
                </div>
                <div>
                  <span className="text-[#94a3b8]">Inspector</span>
                  <p className="font-semibold text-[#f1f5f9] mt-0.5">{selectedInspection.inspector}</p>
                </div>
                <div>
                  <span className="text-[#94a3b8]">Audit Status</span>
                  <div className="mt-0.5">
                    <StatusBadge status={selectedInspection.status} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e2a4a]">
                <button
                  type="button"
                  onClick={() => setSelectedInspection(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0a1020] text-[#94a3b8] hover:bg-slate-800/40 border border-[#1e2a4a]"
                >
                  Close
                </button>
                <Link
                  to="/production/quality-inspection"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2DD4BF] hover:bg-teal-400 text-slate-900"
                >
                  Quality Inspections Register →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      <QRLabelModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
      />
    </div>
  );
}