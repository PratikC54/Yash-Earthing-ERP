import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Eye,
  X,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  UserPlus,
  UserCheck,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Filter,
  QrCode,
} from "lucide-react";
import qualityService from "../services/qualityService";
import QRLabelModal from "../components/qr/QRLabelModal";
import AssignInspectorModal from "../components/quality/AssignInspectorModal";
import StatusBadge from "../../../components/common/StatusBadge";
import Button from "../../../components/common/Button";

export default function InspectionPage() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [viewedInspection, setViewedInspection] = useState(null);
  const [assigningInspection, setAssigningInspection] = useState(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

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
        sku: item.sku || "",
        inspectionType: item.inspectionType || "Batch Sampling (IS 3043)",
        inspectedQuantity: Number(item.inspectedQuantity || 0),
        acceptedQuantity: Number(item.acceptedQuantity || 0),
        rejectedQuantity: Number(item.rejectedQuantity || 0),
        inspector: item.inspector || (item.status === "PENDING_ASSIGNMENT" ? "Unassigned" : "Unassigned"),
        assignedInspector: item.assignedInspector || null,
        assignedInspectorId: item.assignedInspector?.id || item.assignedInspectorId || null,
        inspectionStatus: item.status || "PENDING_ASSIGNMENT",
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

  // Compute Group Counts
  const counts = useMemo(() => {
    let pendingAssignment = 0;
    let assigned = 0;
    let inProgress = 0;
    let completed = 0;

    inspections.forEach((item) => {
      const st = item.inspectionStatus;
      if (st === "PENDING_ASSIGNMENT" || !item.assignedInspectorId) {
        pendingAssignment++;
      } else if (st === "ASSIGNED" || st === "PENDING") {
        assigned++;
      } else if (st === "IN_PROGRESS") {
        inProgress++;
      } else if (["PASS", "FAIL", "HOLD", "RELEASED", "PASSED", "REJECTED"].includes(st)) {
        completed++;
      }
    });

    return {
      all: inspections.length,
      pendingAssignment,
      assigned,
      inProgress,
      completed,
    };
  }, [inspections]);

  const filtered = useMemo(() => {
    return inspections.filter((item) => {
      const st = item.inspectionStatus;
      const isUnassigned = st === "PENDING_ASSIGNMENT" || !item.assignedInspectorId;

      // Group / Tab filter
      if (activeTab === "PENDING_ASSIGNMENT") {
        if (!isUnassigned) return false;
      } else if (activeTab === "ASSIGNED") {
        if (isUnassigned || !(st === "ASSIGNED" || st === "PENDING")) return false;
      } else if (activeTab === "IN_PROGRESS") {
        if (st !== "IN_PROGRESS") return false;
      } else if (activeTab === "COMPLETED") {
        if (!["PASS", "FAIL", "HOLD", "RELEASED", "PASSED", "REJECTED"].includes(st)) return false;
      }

      // Search term filter
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
  }, [inspections, activeTab, searchTerm]);

  const handleAssignmentComplete = (updatedInspection) => {
    setSuccessMessage(
      `Inspector successfully assigned to Inspection Lot #${updatedInspection.inspectionNo || "Lot"}!`
    );
    setTimeout(() => setSuccessMessage(null), 5000);
    loadInspections();
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
            Manage incoming lots, assign certified Quality Inspectors, perform audits, and authorize FG releases.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={QrCode}
            onClick={() => setIsQRModalOpen(true)}
            title="View & Print Work Order QR Code"
          >
            QR Code
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={loadInspections}
            title="Refresh Inspection Register"
          >
            Refresh
          </Button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage(null)} className="text-[#94a3b8] hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Inspection Queue Category Tabs & Search Bar */}
      <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-4 shadow-md space-y-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin border-b border-[#1e2a4a] pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "ALL"
                ? "bg-[#3b82f6] text-white shadow-xs"
                : "bg-[#0a1020] text-[#94a3b8] hover:text-[#f1f5f9] border border-[#1e2a4a]"
            }`}
          >
            <span>All Lots</span>
            <span className="text-[10px] bg-black/30 px-1.5 py-0.2 rounded-full">
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("PENDING_ASSIGNMENT")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "PENDING_ASSIGNMENT"
                ? "bg-amber-500 text-black shadow-xs"
                : "bg-[#0a1020] text-amber-400 hover:bg-amber-500/10 border border-amber-500/30"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Pending Assignment</span>
            <span className="text-[10px] bg-black/20 px-1.5 py-0.2 rounded-full font-bold">
              {counts.pendingAssignment}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ASSIGNED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "ASSIGNED"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-[#0a1020] text-blue-400 hover:bg-blue-500/10 border border-blue-500/30"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Assigned to Inspector</span>
            <span className="text-[10px] bg-black/20 px-1.5 py-0.2 rounded-full">
              {counts.assigned}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("IN_PROGRESS")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "IN_PROGRESS"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-[#0a1020] text-indigo-400 hover:bg-indigo-500/10 border border-indigo-500/30"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Inspection In Progress</span>
            <span className="text-[10px] bg-black/20 px-1.5 py-0.2 rounded-full">
              {counts.inProgress}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("COMPLETED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "COMPLETED"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-[#0a1020] text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/30"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Inspection Completed</span>
            <span className="text-[10px] bg-black/20 px-1.5 py-0.2 rounded-full">
              {counts.completed}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by QC#, WO#, Product, Inspector..."
              className="w-full bg-[#0a1020] text-[#f1f5f9] placeholder-[#64748b] text-xs pl-9 pr-3 py-2 rounded-lg border border-[#1e2a4a] focus:outline-hidden focus:border-[#3b82f6]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#f1f5f9]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-[#94a3b8] ml-auto">
            Showing <strong className="text-[#f1f5f9]">{filtered.length}</strong> of {inspections.length} lots
          </div>
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

      {/* Main Inspection Register Table */}
      <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-md">
        <div className="overflow-x-auto rounded-xl border border-[#1e2a4a] scrollbar-thin">
          <table className="w-full text-left text-xs text-[#94a3b8]">
            <thead className="bg-[#0b1329] text-[#94a3b8] uppercase font-bold text-[10px] tracking-wider border-b border-[#1e2a4a]">
              <tr>
                <th className="py-3 px-3.5 whitespace-nowrap">Inspection #</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Work Order #</th>
                <th className="py-3 px-3.5">Product</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Quantity</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Passed / Rej</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Assigned Inspector</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Status</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a4a]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#94a3b8]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-[#3b82f6]" />
                      <span className="text-xs">Loading live inspections from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#94a3b8] space-y-1">
                    <p className="font-semibold text-[#f1f5f9]">No inspection lots in this category.</p>
                    <p className="text-[11px] text-[#64748b]">
                      Outputs transferred from shop-floor manufacturing will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isUnassigned =
                    item.inspectionStatus === "PENDING_ASSIGNMENT" ||
                    !item.assignedInspectorId;

                  return (
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
                      <td className="py-3 px-3.5 text-[#f1f5f9] font-medium max-w-[220px] truncate" title={item.product}>
                        {item.product}
                        {item.sku && (
                          <span className="text-[10.5px] font-mono text-[#94a3b8] ml-1.5">
                            ({item.sku})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-[#f1f5f9] whitespace-nowrap">
                        {item.inspectedQuantity}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="font-mono text-emerald-400 font-semibold">{item.acceptedQuantity}</span>
                        <span className="text-[#64748b] mx-1">/</span>
                        <span className="font-mono text-rose-400 font-semibold">{item.rejectedQuantity}</span>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {!isUnassigned ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-[#f1f5f9] font-medium">
                            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                            <span>{item.inspector}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <StatusBadge status={item.inspectionStatus} />
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isUnassigned ? (
                            <button
                              type="button"
                              onClick={() => setAssigningInspection(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-semibold transition cursor-pointer"
                              title="Assign Quality Inspector"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Assign Inspector</span>
                            </button>
                          ) : (
                            <Link
                              to={`/pq/inspections/${item.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#3b82f6] text-white hover:bg-blue-600 text-xs font-semibold transition"
                            >
                              <span>Inspect</span>
                            </Link>
                          )}

                          <button
                            type="button"
                            onClick={() => setViewedInspection(item)}
                            className="p-1.5 rounded-lg bg-[#0a1020] hover:bg-slate-700 text-[#94a3b8] hover:text-[#f1f5f9] border border-[#1e2a4a] transition cursor-pointer"
                            title="Audit View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Inspector Assignment Modal */}
      {assigningInspection && (
        <AssignInspectorModal
          isOpen={Boolean(assigningInspection)}
          onClose={() => setAssigningInspection(null)}
          inspection={assigningInspection}
          onAssigned={handleAssignmentComplete}
        />
      )}

      {/* Audit Detail Modal */}
      {viewedInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-4 sm:p-6 text-[#f1f5f9] space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
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
                Inspection Standard: {viewedInspection.inspectionType}
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
              <div className="pt-2 text-xs flex items-center justify-between border-t border-[#1e2a4a]">
                <span className="text-[#94a3b8]">Assigned Inspector:</span>
                <span className="font-semibold text-[#f1f5f9]">
                  {viewedInspection.inspector}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#1e2a4a] flex items-center justify-between">
              {viewedInspection.inspectionStatus === "PENDING_ASSIGNMENT" || !viewedInspection.assignedInspectorId ? (
                <button
                  type="button"
                  onClick={() => {
                    const target = viewedInspection;
                    setViewedInspection(null);
                    setAssigningInspection(target);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Assign Inspector</span>
                </button>
              ) : (
                <Link
                  to={`/pq/inspections/${viewedInspection.id}`}
                  className="text-xs font-semibold text-[#3b82f6] hover:underline flex items-center gap-1"
                >
                  <span>Open Full QA Audit</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
              <button
                type="button"
                onClick={() => setViewedInspection(null)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white"
              >
                Close
              </button>
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