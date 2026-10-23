import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  X,
  Filter,
  Eye,
  Layers,
  Building,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  PackageCheck,
  Factory,
} from "lucide-react";
import ModuleHeader from "../components/shared/ModuleHeader";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import StatusBadge from "../../../components/common/StatusBadge";
import Loader from "../../../components/common/Loader";
import Modal from "../../../components/common/Modal";
import productionService from "../services/productionService";
import { formatDate, formatDateTime, formatQuantity, calculateProgress } from "../utils/productionQualityHelpers";

export default function ProductionPlanningPage() {
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [planningMetrics, setPlanningMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Selected Order for Detail Modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const currentMonthLabel = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const loadPlanningData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const [calendarRes, dashRes] = await Promise.all([
        productionService.getProductionCalendar({
          startDate: startOfMonth,
          endDate: endOfMonth,
        }),
        productionService.getPlanningDashboard(),
      ]);

      const events = calendarRes?.data?.calendar || (Array.isArray(calendarRes?.data) ? calendarRes.data : []);
      setCalendarEvents(events);

      if (dashRes?.data?.metrics) {
        setPlanningMetrics(dashRes.data.metrics);
      }
    } catch (err) {
      console.error("Planning data fetch error:", err);
      setError(err?.message || "Failed to load production calendar from the server.");
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadPlanningData();
  }, [loadPlanningData]);

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
  };

  // Filtered calendar events based on search term, status, and priority
  const filteredEvents = useMemo(() => {
    return calendarEvents.filter((evt) => {
      // Status filter
      if (statusFilter !== "ALL" && evt.status !== statusFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== "ALL" && evt.priority !== priorityFilter) {
        return false;
      }

      // Search term filter
      if (!searchTerm.trim()) return true;

      const q = searchTerm.toLowerCase().trim();
      const woNo = (evt.workOrderNo || "").toLowerCase();
      const productName = (evt.bomRevision?.product?.name || evt.items?.[0]?.product?.name || "").toLowerCase();
      const productSku = (evt.bomRevision?.product?.sku || evt.items?.[0]?.product?.sku || "").toLowerCase();
      const customer = (evt.salesOrder?.customer?.name || "").toLowerCase();
      const orderNo = (evt.salesOrder?.orderNumber || "").toLowerCase();
      const line = (evt.assignedLine || "").toLowerCase();
      const notes = (evt.notes || "").toLowerCase();

      return (
        woNo.includes(q) ||
        productName.includes(q) ||
        productSku.includes(q) ||
        customer.includes(q) ||
        orderNo.includes(q) ||
        line.includes(q) ||
        notes.includes(q)
      );
    });
  }, [calendarEvents, searchTerm, statusFilter, priorityFilter]);

  const isFiltering = searchTerm.trim() !== "" || statusFilter !== "ALL" || priorityFilter !== "ALL";

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Production Planning & Master Scheduling"
        subtitle="Manage production calendar, machine line slots, and material availability before release."
        breadcrumbs={[
          { label: "Production & Quality", to: "/production-quality/planning" },
          { label: "Planning" },
        ]}
      />

      {/* Top Calendar & Filter Toolbar */}
      <div className="bg-[#10182f] p-4 rounded-xl border border-[#1e2a4a] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[#3b82f6]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#f1f5f9]">{currentMonthLabel}</h2>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {calendarEvents.length} Scheduled Runs
                </span>
              </div>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Master schedule & machine line reservations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={ChevronLeft}
              onClick={handlePrevMonth}
            >
              Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const now = new Date();
                setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
              }}
            >
              Today
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={ChevronRight}
              onClick={handleNextMonth}
            >
              Next
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={loadPlanningData}
              title="Refresh production schedule"
            />
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="pt-3 border-t border-[#1e2a4a] grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Work Order #, Product Name, SKU, Customer, Line..."
              className="w-full pl-9 pr-9 py-2 bg-[#0a1020] border border-[#1e2a4a] rounded-lg text-xs text-[#f1f5f9] placeholder:text-[#64748b] focus:outline-hidden focus:border-[#3b82f6] transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#f1f5f9] p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#0a1020] border border-[#1e2a4a] rounded-lg text-xs text-[#f1f5f9] focus:outline-hidden focus:border-[#3b82f6] transition"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="PLANNED">PLANNED</option>
              <option value="RELEASED">RELEASED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="ON_HOLD">ON_HOLD</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="md:col-span-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#0a1020] border border-[#1e2a4a] rounded-lg text-xs text-[#f1f5f9] focus:outline-hidden focus:border-[#3b82f6] transition"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">URGENT</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          {/* Reset Action */}
          <div className="md:col-span-1 flex items-center">
            {isFiltering ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full py-2 px-2 bg-slate-800/60 hover:bg-slate-700/60 border border-[#1e2a4a] rounded-lg text-[11px] font-semibold text-[#94a3b8] hover:text-[#f1f5f9] transition flex items-center justify-center gap-1"
                title="Reset all filters"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            ) : (
              <div className="text-[11px] text-[#64748b] text-center w-full">
                {filteredEvents.length} runs
              </div>
            )}
          </div>
        </div>

        {/* Active Filter Indicators */}
        {isFiltering && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-[#94a3b8] text-[11px] flex items-center gap-1">
              <Filter className="w-3 h-3 text-[#3b82f6]" /> Filters:
            </span>
            {searchTerm && (
              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1">
                Keyword: &ldquo;{searchTerm}&rdquo;
                <button type="button" onClick={() => setSearchTerm("")}>
                  <X className="w-3 h-3 hover:text-white" />
                </button>
              </span>
            )}
            {statusFilter !== "ALL" && (
              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1">
                Status: {statusFilter}
                <button type="button" onClick={() => setStatusFilter("ALL")}>
                  <X className="w-3 h-3 hover:text-white" />
                </button>
              </span>
            )}
            {priorityFilter !== "ALL" && (
              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1">
                Priority: {priorityFilter}
                <button type="button" onClick={() => setPriorityFilter("ALL")}>
                  <X className="w-3 h-3 hover:text-white" />
                </button>
              </span>
            )}
            <span className="text-[#94a3b8] text-[11px] ml-auto">
              Showing {filteredEvents.length} of {calendarEvents.length} scheduled runs
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadPlanningData}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-semibold cursor-pointer transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center">
          <Loader label="Loading production calendar events..." size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Event List */}
          <div className="lg:col-span-2 space-y-4">
            <Card
              title="Scheduled Production Runs"
              subtitle={
                isFiltering
                  ? `Showing ${filteredEvents.length} matching work order milestones`
                  : `Planned work order milestones for ${currentMonthLabel}`
              }
            >
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#94a3b8] space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#10182f] border border-[#1e2a4a] flex items-center justify-center mx-auto text-[#64748b]">
                    <Search className="w-5 h-5" />
                  </div>
                  <p className="font-medium text-[#f1f5f9]">
                    {isFiltering ? "No production events match your filters" : "No production events scheduled for this window"}
                  </p>
                  <p className="text-[11px] text-[#64748b] max-w-sm mx-auto">
                    {isFiltering
                      ? "Try searching with a different work order number, product name, or reset the filters."
                      : "Create and plan new work orders in the Work Orders module to populate the calendar."}
                  </p>
                  {isFiltering && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleResetFilters}
                      className="mt-2"
                    >
                      Clear Search & Filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEvents.map((evt) => {
                    const productName =
                      evt.bomRevision?.product?.name ||
                      evt.items?.[0]?.product?.name ||
                      "Earthing Component / Finished Assembly";
                    const productSku =
                      evt.bomRevision?.product?.sku ||
                      evt.items?.[0]?.product?.sku ||
                      "";
                    const customerName =
                      evt.salesOrder?.customer?.name || "Standard Production Stock";
                    const orderNo = evt.salesOrder?.orderNumber || "Internal Stock WO";
                    const progress = calculateProgress(evt.goodQuantity, evt.plannedQuantity);

                    return (
                      <div
                        key={evt.id || evt.workOrderNo}
                        onClick={() => setSelectedOrder(evt)}
                        className="p-4 rounded-xl border border-[#1e2a4a] bg-[#0a1020] hover:border-[#3b82f6]/50 hover:bg-[#0d162c] transition cursor-pointer group"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            {/* WO Header line */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-[#3b82f6] text-xs tracking-wide group-hover:text-blue-400 transition">
                                {evt.workOrderNo || "—"}
                              </span>
                              <StatusBadge status={evt.status || "—"} />
                              <StatusBadge status={evt.priority || "—"} />
                              {evt.assignedLine && (
                                <span className="text-[10px] bg-slate-800 text-[#94a3b8] px-2 py-0.5 rounded-sm border border-[#1e2a4a]">
                                  {evt.assignedLine}
                                </span>
                              )}
                            </div>

                            {/* Product & SKU */}
                            <p className="text-xs font-semibold text-[#f1f5f9] truncate">
                              {productName}
                              {productSku && (
                                <span className="text-[11px] font-normal text-[#94a3b8] ml-2">
                                  ({productSku})
                                </span>
                              )}
                            </p>

                            {/* Customer & Order reference */}
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#94a3b8]">
                              <span className="flex items-center gap-1 text-[#cbd5e1]">
                                <Building className="w-3 h-3 text-[#3b82f6]" />
                                {customerName}
                              </span>
                              <span>· SO: {orderNo}</span>
                              {evt.bomRevision?.revision && (
                                <span>· BOM: {evt.bomRevision.revision}</span>
                              )}
                            </div>

                            {/* Schedule & Quantity */}
                            <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#94a3b8] pt-0.5">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-blue-400" />
                                Planned: {formatDate(evt.plannedStart)} &rarr; {formatDate(evt.plannedEnd)}
                              </span>
                              <span>· Planned: <strong className="text-[#f1f5f9]">{evt.plannedQuantity ?? "—"}</strong> units</span>
                              {Number(evt.goodQuantity) > 0 && (
                                <span className="text-emerald-400">· Good: {evt.goodQuantity}</span>
                              )}
                            </div>
                          </div>

                          {/* Quick action button & progress badge */}
                          <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0">
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={Eye}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrder(evt);
                              }}
                              className="text-xs"
                            >
                              Details
                            </Button>
                            {Number(evt.plannedQuantity) > 0 && (
                              <span className="text-[10px] font-semibold text-[#94a3b8]">
                                {progress}% Complete
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Plant Work Center Capacity & Real Metrics */}
          <div className="space-y-6">
            <Card title="Live Production Workload" subtitle="Aggregated ERP shop-floor metrics">
              <div className="space-y-3.5 text-xs">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-[#f1f5f9]">In Progress</span>
                    <span className="font-bold text-[#3b82f6]">{planningMetrics?.inProgress ?? 0} Work Orders</span>
                  </div>
                  <div className="w-full h-2 bg-[#0a1020] border border-[#1e2a4a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#3b82f6] rounded-full"
                      style={{
                        width: `${Math.min(100, (((planningMetrics?.inProgress ?? 0) / (planningMetrics?.totalWorkOrders || 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-[#f1f5f9]">QC Hold / Pending Decision</span>
                    <span className="font-bold text-amber-400">{planningMetrics?.onHold ?? 0} Work Orders</span>
                  </div>
                  <div className="w-full h-2 bg-[#0a1020] border border-[#1e2a4a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{
                        width: `${Math.min(100, (((planningMetrics?.onHold ?? 0) / (planningMetrics?.totalWorkOrders || 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-[#f1f5f9]">Draft & Planning Pipeline</span>
                    <span className="font-bold text-emerald-400">{planningMetrics?.draft ?? 0} Work Orders</span>
                  </div>
                  <div className="w-full h-2 bg-[#0a1020] border border-[#1e2a4a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${Math.min(100, (((planningMetrics?.draft ?? 0) / (planningMetrics?.totalWorkOrders || 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1e2a4a] flex items-center justify-between text-[11px] text-[#94a3b8]">
                  <span>Total Managed Work Orders:</span>
                  <span className="font-bold text-[#f1f5f9]">{planningMetrics?.totalWorkOrders ?? calendarEvents.length}</span>
                </div>
              </div>
            </Card>

            <Card title="Raw Material Staging Overview" subtitle="Readiness check for planned runs">
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-1">
                  <div className="flex items-center justify-between font-semibold">
                    <span>GI Pipe 50mm Class B</span>
                    <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full">In Stock</span>
                  </div>
                  <p className="text-[11px] text-emerald-400/80">1,000 MTR physical inventory available</p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-1">
                  <div className="flex items-center justify-between font-semibold">
                    <span>Chemical Earthing Compound (BFC)</span>
                    <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full">In Stock</span>
                  </div>
                  <p className="text-[11px] text-emerald-400/80">2,400 KG in stock</p>
                </div>

                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 space-y-1">
                  <div className="flex items-center justify-between font-semibold">
                    <span>Copper Strip 25x3 mm</span>
                    <span className="text-[10px] bg-blue-500/20 px-2 py-0.5 rounded-full">Allocated</span>
                  </div>
                  <p className="text-[11px] text-blue-400/80">500 MTR staged for continuous coating</p>
                </div>

                <Link
                  to="/production-quality/material-issuance"
                  className="block text-center py-2 px-3 bg-slate-800/80 hover:bg-slate-700/80 border border-[#1e2a4a] rounded-lg text-xs font-semibold text-[#3b82f6] hover:text-blue-300 transition"
                >
                  Manage Material Issuance &rarr;
                </Link>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Comprehensive Work Order Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          title={`Work Order Details: ${selectedOrder.workOrderNo || "—"}`}
          subtitle="Complete master scheduling and operational metadata"
          maxWidth="max-w-3xl"
        >
          <div className="space-y-5 text-xs text-[#f1f5f9]">
            {/* Header Badges */}
            <div className="p-3 bg-[#0a1020] rounded-xl border border-[#1e2a4a] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#94a3b8]">Status:</span>
                <StatusBadge status={selectedOrder.status || "—"} />
                <span className="text-xs text-[#94a3b8] ml-2">Priority:</span>
                <StatusBadge status={selectedOrder.priority || "—"} />
              </div>
              <div className="text-[11px] text-[#94a3b8]">
                WO System ID: <span className="font-mono text-[#f1f5f9]">#{selectedOrder.id}</span>
              </div>
            </div>

            {/* Product & Sales Order Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product Information */}
              <div className="p-4 bg-[#0a1020] rounded-xl border border-[#1e2a4a] space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#3b82f6] border-b border-[#1e2a4a] pb-2">
                  <PackageCheck className="w-4 h-4" />
                  <span>Finished Good Specifications</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-[#94a3b8]">Product:</span>{" "}
                    <span className="font-semibold text-[#f1f5f9]">
                      {selectedOrder.bomRevision?.product?.name ||
                        selectedOrder.items?.[0]?.product?.name ||
                        "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#94a3b8]">SKU Code:</span>{" "}
                    <span className="font-mono text-[#3b82f6]">
                      {selectedOrder.bomRevision?.product?.sku ||
                        selectedOrder.items?.[0]?.product?.sku ||
                        "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#94a3b8]">Unit of Measure:</span>{" "}
                    <span>
                      {selectedOrder.bomRevision?.product?.unitOfMeasure ||
                        selectedOrder.items?.[0]?.product?.unitOfMeasure ||
                        "PCS"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#94a3b8]">BOM Engineering Revision:</span>{" "}
                    <span className="text-emerald-400 font-semibold">
                      {selectedOrder.bomRevision?.revision || "Default Active BOM"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer & Order Reference */}
              <div className="p-4 bg-[#0a1020] rounded-xl border border-[#1e2a4a] space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#3b82f6] border-b border-[#1e2a4a] pb-2">
                  <Building className="w-4 h-4" />
                  <span>Commercial & Customer Reference</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-[#94a3b8]">Customer Client:</span>{" "}
                    <span className="font-semibold text-[#f1f5f9]">
                      {selectedOrder.salesOrder?.customer?.name || "Internal Plant Production"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#94a3b8]">Sales Order #:</span>{" "}
                    <span className="font-mono text-[#f1f5f9]">
                      {selectedOrder.salesOrder?.orderNumber || "Standard Stock Build"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#94a3b8]">Assigned Production Line:</span>{" "}
                    <span className="font-semibold text-blue-400">
                      {selectedOrder.assignedLine || "Unassigned / General Shop Floor"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#94a3b8]">Created Timestamp:</span>{" "}
                    <span>{formatDateTime(selectedOrder.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Production Schedule & Quantities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Schedule Dates */}
              <div className="p-4 bg-[#0a1020] rounded-xl border border-[#1e2a4a] space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#3b82f6] border-b border-[#1e2a4a] pb-2">
                  <Clock className="w-4 h-4" />
                  <span>Production Timeline</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-[#94a3b8]">Planned Start:</span>{" "}
                    <span className="font-semibold text-[#f1f5f9]">{formatDate(selectedOrder.plannedStart)}</span>
                  </div>
                  <div>
                    <span className="text-[#94a3b8]">Planned End:</span>{" "}
                    <span className="font-semibold text-[#f1f5f9]">{formatDate(selectedOrder.plannedEnd)}</span>
                  </div>
                  <div>
                    <span className="text-[#94a3b8]">Actual Start:</span>{" "}
                    <span>{selectedOrder.actualStart ? formatDateTime(selectedOrder.actualStart) : "Not started yet"}</span>
                  </div>
                  <div>
                    <span className="text-[#94a3b8]">Actual End:</span>{" "}
                    <span>{selectedOrder.actualEnd ? formatDateTime(selectedOrder.actualEnd) : "—"}</span>
                  </div>
                </div>
              </div>

              {/* Output Metrics */}
              <div className="p-4 bg-[#0a1020] rounded-xl border border-[#1e2a4a] space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#3b82f6] border-b border-[#1e2a4a] pb-2">
                  <Factory className="w-4 h-4" />
                  <span>Output & Progress Metrics</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#94a3b8]">Target Planned Qty:</span>
                    <span className="font-bold text-[#f1f5f9]">{selectedOrder.plannedQuantity ?? 0} units</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#94a3b8]">Good Finished Output:</span>
                    <span className="font-bold text-emerald-400">{selectedOrder.goodQuantity ?? 0} units</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#94a3b8]">Scrap / Rejected Qty:</span>
                    <span className="font-bold text-rose-400">{selectedOrder.rejectedQuantity ?? 0} units</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#94a3b8]">Completion Ratio:</span>
                      <span className="font-semibold text-[#3b82f6]">
                        {calculateProgress(selectedOrder.goodQuantity, selectedOrder.plannedQuantity)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#3b82f6] rounded-full transition-all"
                        style={{
                          width: `${calculateProgress(selectedOrder.goodQuantity, selectedOrder.plannedQuantity)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill of Materials Staged Components */}
            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div className="p-4 bg-[#0a1020] rounded-xl border border-[#1e2a4a] space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#1e2a4a] pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#3b82f6]">
                    <Layers className="w-4 h-4" />
                    <span>Raw Material Staging & Component Breakdown</span>
                  </div>
                  <span className="text-[11px] text-[#94a3b8]">
                    {selectedOrder.items.length} Component lines
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#1e2a4a] text-[#94a3b8] text-[11px]">
                        <th className="py-1.5">Component / Item</th>
                        <th className="py-1.5">SKU</th>
                        <th className="py-1.5 text-right">Planned Qty</th>
                        <th className="py-1.5 text-right">Issued Qty</th>
                        <th className="py-1.5 text-right">Consumed Qty</th>
                        <th className="py-1.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2a4a]/50 text-[11px]">
                      {selectedOrder.items.map((item) => {
                        const planned = Number(item.plannedQuantity) || 0;
                        const issued = Number(item.issuedQuantity) || 0;
                        const isFullyIssued = issued >= planned && planned > 0;
                        const isPartiallyIssued = issued > 0 && issued < planned;

                        return (
                          <tr key={item.id}>
                            <td className="py-2 text-[#f1f5f9] font-medium">
                              {item.product?.name || "Component Item"}
                            </td>
                            <td className="py-2 font-mono text-[#94a3b8]">
                              {item.product?.sku || "—"}
                            </td>
                            <td className="py-2 text-right text-[#f1f5f9]">
                              {item.plannedQuantity} {item.product?.unitOfMeasure || "NOS"}
                            </td>
                            <td className="py-2 text-right text-emerald-400">
                              {item.issuedQuantity || 0}
                            </td>
                            <td className="py-2 text-right text-blue-400">
                              {item.consumedQuantity || 0}
                            </td>
                            <td className="py-2 text-center">
                              {isFullyIssued ? (
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                  Issued & Ready
                                </span>
                              ) : isPartiallyIssued ? (
                                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                  Partial
                                </span>
                              ) : (
                                <span className="bg-slate-800 text-[#94a3b8] border border-[#1e2a4a] px-2 py-0.5 rounded-full text-[10px]">
                                  Pending Issuance
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Notes Section */}
            {selectedOrder.notes && (
              <div className="p-3 bg-[#0a1020] rounded-xl border border-[#1e2a4a] space-y-1">
                <span className="text-[#94a3b8] text-[11px] font-semibold flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-[#3b82f6]" /> Planning Notes / Instructions:
                </span>
                <p className="text-xs text-[#cbd5e1]">{selectedOrder.notes}</p>
              </div>
            )}

            {/* Navigation and Action buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#1e2a4a]">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Link
                  to={`/production-quality/work-orders/${selectedOrder.id}`}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#3b82f6] hover:bg-blue-600 text-white rounded-lg font-semibold text-xs transition w-full sm:w-auto"
                >
                  <span>Open Full Work Order</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/production-quality/material-issuance"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-[#f1f5f9] rounded-lg font-semibold text-xs border border-[#1e2a4a] transition w-full sm:w-auto"
                >
                  <span>Issue Materials</span>
                </Link>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedOrder(null)}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
