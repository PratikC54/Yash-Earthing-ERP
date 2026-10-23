import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Box,
  ShoppingCart,
  Layers,
  Truck,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Users,
  RefreshCw,
  Award,
} from "lucide-react";
import * as api from "../api/procurementApi";
import { LoadingSkeleton, ErrorAlert } from "../components/common/StateFeedback";

export default function Module2Dashboard({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getProcurementDashboardMetrics();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load Procurement & Inventory Analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardMetrics();
  }, [fetchDashboardMetrics]);

  if (loading) {
    return (
      <div className="p-6 sm:p-8 space-y-6 bg-[#edf1f7] text-slate-800 min-h-full">
        <LoadingSkeleton rows={8} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 sm:p-8 space-y-6 bg-[#edf1f7] text-slate-800 min-h-full">
        <ErrorAlert message={error} onRetry={fetchDashboardMetrics} />
      </div>
    );
  }

  const p = data?.procurement || {};
  const v = data?.vendorAnalytics || {};
  const inv = data?.inventory || {};
  const grn = data?.goodsReceipt || {};
  const actionCentre = data?.actionCentre || {};

  // Flatten action centre items
  const allActionItems = [
    ...(actionCentre.submittedRequisitions || []),
    ...(actionCentre.overdueRfqs || []),
    ...(actionCentre.pendingApprovalOrders || []),
    ...(actionCentre.pendingInspectionReceipts || []),
    ...(actionCentre.criticalLowStockWarnings || []),
  ];

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-[#edf1f7] text-slate-800 min-h-full">
      {/* Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
            Procurement & Inventory Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
            Operational analytics, material commitments, stock velocity, and prioritized action pipeline
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDashboardMetrics}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* 1. Procurement KPIs (5-card grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div
          onClick={() => onNavigate && onNavigate("purchase-requests")}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Open PRs
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50/90 text-blue-600 flex items-center justify-center border border-blue-100/60 shadow-2xs">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2.5">
            <div className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight leading-none font-mono">
              {p.openRequisitions ?? 0}
            </div>
          </div>
          <div className="flex items-center space-x-1 text-[11px] text-slate-500">
            <span>Requisitions in pipeline</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate && onNavigate("purchase-requests")}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Active RFQs
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/60 shadow-2xs">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2.5">
            <div className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight leading-none font-mono">
              {p.activeRfqs ?? 0}
            </div>
          </div>
          <div className="flex items-center space-x-1 text-[11px] text-slate-500">
            <span>Supplier bids in progress</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate && onNavigate("purchase-orders")}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Pending Approvals
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/60 shadow-2xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2.5">
            <div className="text-2xl sm:text-[28px] font-bold text-amber-600 tracking-tight leading-none font-mono">
              {p.pendingApprovals ?? 0}
            </div>
          </div>
          <div className="flex items-center space-x-1 text-[11px] text-slate-500">
            <span>POs waiting sign-off</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate && onNavigate("purchase-orders")}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Open PO Value
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/60 shadow-2xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2.5">
            <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-none font-mono">
              ₹{(p.openPoValue || 0).toLocaleString()}
            </div>
          </div>
          <div className="flex items-center space-x-1 text-[11px] text-slate-500">
            <span>Committed purchasing spend</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate && onNavigate("purchase-orders")}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Overdue POs
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100/60 shadow-2xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2.5">
            <div className="text-2xl sm:text-[28px] font-bold text-rose-600 tracking-tight leading-none font-mono">
              {p.overduePurchases ?? 0}
            </div>
          </div>
          <div className="flex items-center space-x-1 text-[11px] text-slate-500">
            <span>Expected date passed</span>
          </div>
        </div>
      </div>

      {/* 2. Action Centre & Low-Stock Alerts */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Action Centre (Requires Employee Attention)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {allActionItems.length} actionable triggers
          </span>
        </div>

        {allActionItems.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500 font-medium">
            All procurement workflows and stock thresholds are currently in optimal state.
          </div>
        ) : (
          <div className="space-y-2">
            {allActionItems.map((item, idx) => (
              <div
                key={idx}
                onClick={() => onNavigate && onNavigate(item.targetModule)}
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-200/70 flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] shrink-0 ${
                      item.urgency === "CRITICAL"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {item.urgency}
                  </span>
                  <span className="text-xs font-medium text-slate-800 truncate">
                    {item.title}
                  </span>
                </div>

                <div className="flex items-center space-x-1 text-blue-600 text-xs font-semibold shrink-0 group-hover:translate-x-0.5 transition-transform">
                  <span>Take Action</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Two-Column Operational Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Vendor Performance Snapshot */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Vendor Performance & Reliability
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate("vendors")}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                View Directory →
              </button>
            </div>

            {/* Vendor Stats Pills */}
            <div className="grid grid-cols-3 gap-3 mb-4 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Vendors</span>
                <span className="text-lg font-bold text-slate-800 font-mono mt-0.5 block">
                  {v.activeVendors ?? 0} / {v.totalVendors ?? 0}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">Active</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">On-Time %</span>
                <span className="text-lg font-bold text-slate-800 font-mono mt-0.5 block">
                  {v.onTimeDeliveryPercent != null ? `${v.onTimeDeliveryPercent}%` : "—"}
                </span>
                <span className="text-[10px] text-slate-500">Average Rate</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Quality</span>
                <span className="text-lg font-bold text-slate-800 font-mono mt-0.5 block">
                  {v.qualityScore != null ? `${v.qualityScore}%` : "—"}
                </span>
                <span className="text-[10px] text-slate-500">Acceptance Score</span>
              </div>
            </div>

            {/* Top Vendors Table */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Top Rated Sourcing Partners
              </span>
              {v.topVendors?.length === 0 ? (
                <div className="text-xs text-slate-400 py-3 text-center">No vendor rating data yet.</div>
              ) : (
                <div className="space-y-1.5">
                  {v.topVendors?.map((vendor) => (
                    <div
                      key={vendor.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-800">{vendor.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 ml-2">{vendor.code}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-[11px] font-mono">
                        {vendor.onTimeDeliveryPercent != null && (
                          <span className="text-slate-600">{vendor.onTimeDeliveryPercent}% OT</span>
                        )}
                        {vendor.qualityScore != null && (
                          <span className="text-emerald-700 font-semibold">{vendor.qualityScore}% QC</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Inventory Health & Derived Available Stock */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Box className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Inventory Balances & Free Available Stock
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate("inventory")}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                Stock Ledger →
              </button>
            </div>

            {/* 3-Part Stock Balance Gauge */}
            <div className="grid grid-cols-3 gap-3 mb-4 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Physical</span>
                <span className="text-lg font-bold text-slate-800 font-mono mt-0.5 block">
                  {inv.totalPhysicalQuantity?.toLocaleString() || 0}
                </span>
                <span className="text-[10px] text-slate-500">On Hand</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Reserved</span>
                <span className="text-lg font-bold text-amber-600 font-mono mt-0.5 block">
                  {inv.totalReservedQuantity?.toLocaleString() || 0}
                </span>
                <span className="text-[10px] text-slate-500">Production Hold</span>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/70">
                <span className="text-[10px] text-blue-600 font-bold uppercase block">Available</span>
                <span className="text-lg font-bold text-blue-900 font-mono mt-0.5 block">
                  {inv.derivedAvailableQuantity?.toLocaleString() || 0}
                </span>
                <span className="text-[10px] text-blue-600 font-semibold">Net Free Stock</span>
              </div>
            </div>

            {/* Goods Receipt & QC Pipeline Summary */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">Goods Receipt Quality Metric</span>
                <span className="font-mono text-slate-600 font-bold">
                  {grn.rejectionRatePercentage ?? 0}% Rejection
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
                <div>
                  <span className="text-slate-400 block">Accepted</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {grn.totalAcceptedQuantity?.toLocaleString() || 0}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Rejected</span>
                  <span className="font-mono font-bold text-rose-700">
                    {grn.totalRejectedQuantity?.toLocaleString() || 0}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Under QC</span>
                  <span className="font-mono font-bold text-amber-600">
                    {grn.receiptsPendingInspection || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
