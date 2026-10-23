import React, { useState, useEffect, useCallback } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock, AlertCircle, RefreshCw } from "lucide-react";
import ModuleHeader from "../components/shared/ModuleHeader";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import StatusBadge from "../../../components/common/StatusBadge";
import Loader from "../../../components/common/Loader";
import productionService from "../services/productionService";
import { formatDate } from "../utils/productionQualityHelpers";

export default function ProductionPlanningPage() {
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [planningMetrics, setPlanningMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
        productionService.getProductionCalendar({ startDate: startOfMonth, endDate: endOfMonth }),
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

      {/* Top Calendar Toolbar */}
      <div className="bg-[#10182f] p-4 rounded-xl border border-[#1e2a4a] shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-[#3b82f6]" />
          <h2 className="text-base font-bold text-[#f1f5f9]">{currentMonthLabel}</h2>
          <span className="text-xs bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
            {calendarEvents.length} Scheduled Runs
          </span>
        </div>

        <div className="flex items-center gap-1.5">
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
            icon={ChevronRight}
            onClick={handleNextMonth}
          >
            Next
          </Button>
        </div>
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
            <Card title="Scheduled Production Runs" subtitle="Planned work order milestones">
              {calendarEvents.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#94a3b8]">
                  No production events scheduled for this window.
                </div>
              ) : (
                <div className="space-y-3">
                  {calendarEvents.map((evt) => (
                    <div
                      key={evt.id || evt.workOrderNo}
                      className="p-4 rounded-xl border border-[#1e2a4a] bg-[#0a1020] flex items-center justify-between hover:border-[#3b82f6]/40 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#3b82f6] text-xs">
                            {evt.workOrderNo || "—"}
                          </span>
                          <StatusBadge status={evt.status || "—"} />
                          <StatusBadge status={evt.priority || "—"} />
                        </div>
                        <p className="text-xs font-semibold text-[#f1f5f9]">
                          {evt.bomRevision?.product?.name || "—"}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-[#94a3b8]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Planned: {formatDate(evt.plannedStart)} &rarr; {formatDate(evt.plannedEnd)}
                          </span>
                          <span>· Qty: {evt.plannedQuantity ?? "—"} units</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Plant Work Center Capacity & Real Metrics */}
          <div className="space-y-6">
            <Card title="Live Production Workload" subtitle="Aggregated ERP shop-floor metrics">
              <div className="space-y-3 text-xs">
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
              </div>
            </Card>

            <Card title="Raw Material Staging Checklist">
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <span className="font-semibold">GI Pipe 50mm Class B</span>
                  <p className="text-[11px] text-emerald-400/80">1,000 MTR physical inventory available</p>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <span className="font-semibold">Chemical Earthing Compound (BFC)</span>
                  <p className="text-[11px] text-emerald-400/80">2,400 KG in stock</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
