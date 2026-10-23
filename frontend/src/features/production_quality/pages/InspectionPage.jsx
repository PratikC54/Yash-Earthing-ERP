import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Eye,
  X,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import qualityService from "../services/qualityService";

export const initialInspections = [];

export default function InspectionPage() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewedInspection, setViewedInspection] = useState(null);

  const loadInspections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await qualityService.getInspectionReport();
      const rawList = res?.data || (Array.isArray(res) ? res : []);
      const mapped = rawList.map((item) => ({
        id: item.id,
        inspectionNumber: item.inspectionNo || "",
        workOrderNumber: item.workOrderNo || "",
        product: item.productName || "",
        inspectionType: item.inspectionType || "",
        inspectedQuantity: Number(item.inspectedQuantity || 0),
        acceptedQuantity: Number(item.acceptedQuantity || 0),
        rejectedQuantity: Number(item.rejectedQuantity || 0),
        inspector: item.inspector || "",
        inspectionStatus: item.status || "",
        date: item.inspectedAt
          ? new Date(item.inspectedAt).toISOString().slice(0, 10)
          : item.createdAt
          ? new Date(item.createdAt).toISOString().slice(0, 10)
          : "—",
      }));
      setInspections(mapped);
    } catch (err) {
      console.error("Failed to load inspection report:", err);
      setError(err?.message || "Failed to load live quality inspection reports from database.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInspections();
  }, [loadInspections]);

  const filtered = useMemo(() => {
    return inspections.filter((item) => {
      if (statusFilter !== "ALL" && item.inspectionStatus !== statusFilter) {
        return false;
      }
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          item.inspectionNumber.toLowerCase().includes(q) ||
          item.workOrderNumber.toLowerCase().includes(q) ||
          item.product.toLowerCase().includes(q) ||
          item.inspector.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [inspections, statusFilter, searchTerm]);

  const getStatusBadge = (st) => {
    switch (st) {
      case "PASSED":
        return "bg-emerald-500/10 text-[#2DD4BF] border-emerald-500/30";
      case "CONDITIONAL":
        return "bg-amber-500/10 text-[#FACC15] border-amber-500/30";
      case "REJECTED":
        return "bg-rose-500/10 text-[#F87171] border-rose-500/30";
      default:
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#10182f] border border-[#1e2a4a] p-5 sm:p-6 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2DD4BF]/20 text-[#2DD4BF] border border-[#2DD4BF]/30">
              MODULE 4 · QUALITY ASSURANCE
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#f1f5f9] tracking-tight">
            Quality Inspection Register
          </h1>
          <p className="text-xs sm:text-sm text-[#94a3b8] mt-1">
            Execute batch inspection audits, track accepted/rejected yields, and authorize FG release permits.
          </p>
        </div>

      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-4 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by QC#, WO#, Product, Inspector..."
            className="w-full bg-[#0a1020] text-[#f1f5f9] placeholder-[#64748b] text-xs pl-9 pr-3 py-2 rounded-lg border border-[#1e2a4a] focus:outline-none focus:border-[#3b82f6]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
          {["ALL", "PASSED", "CONDITIONAL", "REJECTED"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                statusFilter === st
                  ? "bg-[#3b82f6] text-white"
                  : "bg-[#0a1020] text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-slate-800/40 border border-[#1e2a4a]"
              }`}
            >
              {st === "ALL" ? "All Inspections" : st}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert with Retry */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadInspections}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-semibold cursor-pointer transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Main Inspection Table with All Required Columns (Section 6) */}
      <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-md">
        <div className="overflow-x-auto rounded-xl border border-[#1e2a4a] scrollbar-thin">
          <table className="w-full text-left text-xs text-[#94a3b8]">
            <thead className="bg-[#0b1329] text-[#94a3b8] uppercase font-bold text-[10px] tracking-wider border-b border-[#1e2a4a]">
              <tr>
                <th className="py-3 px-3.5 whitespace-nowrap">Inspection #</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Work Order #</th>
                <th className="py-3 px-3.5">Product</th>
                <th className="py-3 px-3.5">Inspection Type</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Inspected Qty</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Accepted Qty</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Rejected Qty</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Inspector</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Status</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a4a]">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#94a3b8]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-[#3b82f6]" />
                      <span className="text-xs">Loading live inspections from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-[#94a3b8]">
                    No quality inspection audits found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-3.5 font-mono font-bold text-[#f1f5f9] whitespace-nowrap">
                      <Link
                        to={`/pq/inspections/${item.id}`}
                        className="hover:text-[#3b82f6] hover:underline"
                      >
                        {item.inspectionNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-3.5 font-mono text-[11px] text-[#3b82f6] font-semibold whitespace-nowrap">
                      {item.workOrderNumber}
                    </td>
                    <td className="py-3 px-3.5 text-[#f1f5f9] font-medium max-w-[200px] truncate" title={item.product}>
                      {item.product}
                    </td>
                    <td className="py-3 px-3.5 text-[#94a3b8] max-w-[180px] truncate">
                      {item.inspectionType}
                    </td>
                    <td className="py-3 px-3.5 font-mono font-bold text-[#f1f5f9] whitespace-nowrap">
                      {item.inspectedQuantity}
                    </td>
                    <td className="py-3 px-3.5 font-mono font-bold text-[#2DD4BF] whitespace-nowrap">
                      {item.acceptedQuantity}
                    </td>
                    <td className="py-3 px-3.5 font-mono font-bold text-[#F87171] whitespace-nowrap">
                      {item.rejectedQuantity}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap text-[#94a3b8]">
                      {item.inspector}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold border ${getStatusBadge(
                          item.inspectionStatus
                        )}`}
                      >
                        {item.inspectionStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/pq/inspections/${item.id}`}
                          title="View Full QA Audit & Decisions"
                          className="p-1.5 rounded-lg bg-[#0a1020] hover:bg-[#3b82f6] hover:text-white text-[#94a3b8] border border-[#1e2a4a] transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setViewedInspection(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0a1020] hover:bg-[#3b82f6] hover:text-white text-[#94a3b8] border border-[#1e2a4a] text-xs font-semibold transition cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Audit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Detail Modal */}
      {viewedInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-6 text-[#f1f5f9] space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1e2a4a] pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#2DD4BF]">
                  {viewedInspection.inspectionStatus}
                </span>
                <h3 className="text-base font-bold text-[#f1f5f9]">
                  {viewedInspection.inspectionNumber} · {viewedInspection.workOrderNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewedInspection(null)}
                className="text-[#94a3b8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-semibold text-[#f1f5f9]">
                {viewedInspection.product}
              </p>
              <p className="text-[#94a3b8]">
                Method: {viewedInspection.inspectionType}
              </p>
              <div className="grid grid-cols-3 gap-2 pt-2 bg-[#0a1020] p-3 rounded-xl border border-[#1e2a4a]">
                <div>
                  <span className="text-[#94a3b8] block">Inspected</span>
                  <span className="font-mono font-bold text-[#f1f5f9]">
                    {viewedInspection.inspectedQuantity}
                  </span>
                </div>
                <div>
                  <span className="text-[#94a3b8] block">Accepted</span>
                  <span className="font-mono font-bold text-[#2DD4BF]">
                    {viewedInspection.acceptedQuantity}
                  </span>
                </div>
                <div>
                  <span className="text-[#94a3b8] block">Rejected</span>
                  <span className="font-mono font-bold text-[#F87171]">
                    {viewedInspection.rejectedQuantity}
                  </span>
                </div>
              </div>
              <div className="pt-1 text-[#94a3b8]">
                Certified Inspector: <strong className="text-[#f1f5f9]">{viewedInspection.inspector}</strong>
              </div>
            </div>

            <div className="pt-3 border-t border-[#1e2a4a] flex justify-end">
              <button
                type="button"
                onClick={() => setViewedInspection(null)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-[#3b82f6] text-white"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
