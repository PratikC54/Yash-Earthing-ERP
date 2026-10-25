import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  QrCode,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Wrench,
  FileCheck,
  Activity,
  Printer,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  PlusCircle,
  FileText,
  User,
} from "lucide-react";
import qrService from "../services/qrService";
import QRLabelModal from "../components/qr/QRLabelModal";
import authService from "../../../services/authService";

export default function QRWorkOrderPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'progress' | 'downtime' | 'defect' | 'qc'

  // Progress Form State
  const [progressQty, setProgressQty] = useState("");
  const [progressNotes, setProgressNotes] = useState("");
  const [progressSubmitting, setProgressSubmitting] = useState(false);
  const [progressMsg, setProgressMsg] = useState(null);

  // Downtime Form State
  const [downtimeMachine, setDowntimeMachine] = useState("");
  const [downtimeReason, setDowntimeReason] = useState("");
  const [downtimeDuration, setDowntimeDuration] = useState("");
  const [downtimeSubmitting, setDowntimeSubmitting] = useState(false);
  const [downtimeMsg, setDowntimeMsg] = useState(null);

  // Defect Form State
  const [defectCategory, setDefectCategory] = useState("DIMENSIONAL");
  const [defectQty, setDefectQty] = useState("");
  const [defectSeverity, setDefectSeverity] = useState("MAJOR");
  const [defectDesc, setDefectDesc] = useState("");
  const [defectSubmitting, setDefectSubmitting] = useState(false);
  const [defectMsg, setDefectMsg] = useState(null);

  // Current logged in user
  const currentUser = authService.getUser() || {};
  const currentRole = (currentUser.role || "").toUpperCase();

  useEffect(() => {
    loadWorkOrderDetails();
  }, [id]);

  const loadWorkOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await qrService.lookupQR(id);
      if (res?.success && res.data) {
        const d = res.data;
        setData({
          ...d,
          id: d.id || d.workOrder?.id,
          workOrderNo: d.workOrderNo || d.workOrder?.workOrderNo,
          productName: d.productName || d.product?.name,
          productCode: d.productCode || d.product?.sku,
          batchNumber: d.batchNumber || d.batch?.batchNumber,
          plannedQuantity: d.plannedQuantity ?? d.workOrder?.plannedQuantity ?? 0,
          producedQuantity: d.producedQuantity ?? d.workOrder?.goodQuantity ?? 0,
          acceptedQuantity: d.acceptedQuantity ?? d.qualitySummary?.acceptedQuantity ?? 0,
          rejectedQuantity: d.rejectedQuantity ?? d.workOrder?.rejectedQuantity ?? 0,
          status: d.status || d.workOrder?.status,
          priority: d.priority || d.workOrder?.priority || "MEDIUM",
          userPermissions: d.userPermissions || d.permissions || {},
        });
      } else {
        setError(res?.message || "Work order not found or inaccessible.");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Could not load work order details. Verify you have appropriate access permissions."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRecordProgress = async (e) => {
    e.preventDefault();
    const qty = Number(progressQty);
    if (!qty || qty <= 0 || !Number.isFinite(qty)) {
      setProgressMsg({ type: "error", text: "Please enter a valid positive production quantity." });
      return;
    }

    try {
      setProgressSubmitting(true);
      setProgressMsg(null);

      const res = await qrService.recordProgress({
        workOrderId: Number(data.id),
        quantityProduced: qty,
        notes: progressNotes || "Recorded via Mobile QR Scanner",
        operatorName: currentUser.name || "Operator",
      });

      if (res?.success) {
        setProgressMsg({ type: "success", text: `Successfully logged ${qty} produced units!` });
        setProgressQty("");
        setProgressNotes("");
        // Reload WO details to refresh quantities
        await loadWorkOrderDetails();
      } else {
        setProgressMsg({ type: "error", text: res?.message || "Failed to record progress." });
      }
    } catch (err) {
      setProgressMsg({
        type: "error",
        text: err?.response?.data?.message || err?.message || "Failed to submit production entry.",
      });
    } finally {
      setProgressSubmitting(false);
    }
  };

  const handleReportDowntime = async (e) => {
    e.preventDefault();
    if (!downtimeReason.trim()) {
      setDowntimeMsg({ type: "error", text: "Please enter the breakdown reason." });
      return;
    }

    try {
      setDowntimeSubmitting(true);
      setDowntimeMsg(null);

      const res = await qrService.reportDowntime({
        workOrderId: Number(data.id),
        machineCode: downtimeMachine || "MAIN_LINE_01",
        reason: downtimeReason,
        durationMinutes: Number(downtimeDuration) || 30,
      });

      if (res?.success) {
        setDowntimeMsg({
          type: "success",
          text: "Machine breakdown reported! Smart Alert dispatched to Maintenance & Production Managers.",
        });
        setDowntimeMachine("");
        setDowntimeReason("");
        setDowntimeDuration("");
        await loadWorkOrderDetails();
      } else {
        setDowntimeMsg({ type: "error", text: res?.message || "Failed to report downtime." });
      }
    } catch (err) {
      setDowntimeMsg({
        type: "error",
        text: err?.response?.data?.message || err?.message || "Failed to submit downtime report.",
      });
    } finally {
      setDowntimeSubmitting(false);
    }
  };

  const handleReportDefect = async (e) => {
    e.preventDefault();
    const qty = Number(defectQty);
    if (!qty || qty <= 0) {
      setDefectMsg({ type: "error", text: "Please enter a valid defective quantity." });
      return;
    }

    try {
      setDefectSubmitting(true);
      setDefectMsg(null);

      const res = await qrService.reportDefect({
        workOrderId: Number(data.id),
        defectCategory,
        severity: defectSeverity,
        defectiveQuantity: qty,
        description: defectDesc,
      });

      if (res?.success) {
        setDefectMsg({
          type: "success",
          text: "Defect report logged. If marked CRITICAL, Quality Hold (QC_HOLD) has been automatically applied.",
        });
        setDefectQty("");
        setDefectDesc("");
        await loadWorkOrderDetails();
      } else {
        setDefectMsg({ type: "error", text: res?.message || "Failed to log defect." });
      }
    } catch (err) {
      setDefectMsg({
        type: "error",
        text: err?.response?.data?.message || err?.message || "Failed to log defect report.",
      });
    } finally {
      setDefectSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070d19] flex flex-col items-center justify-center p-4 text-[#94a3b8]">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Loading QR Work Order Tracking...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#070d19] flex flex-col items-center justify-center p-4 text-[#f1f5f9]">
        <div className="w-full max-w-md bg-[#0e172a] border border-[#1e2a4a] rounded-2xl p-6 text-center shadow-xl">
          <div className="p-3 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 inline-block mb-3">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Work Order Inaccessible</h2>
          <p className="text-xs text-[#94a3b8] mb-6">{error || "Record not found or unauthorized."}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/pq/work-orders")}
              className="px-4 py-2 rounded-xl bg-[#1e2a4a] hover:bg-slate-700 text-xs text-white transition-colors cursor-pointer"
            >
              Back to Work Orders
            </button>
            <button
              type="button"
              onClick={loadWorkOrderDetails}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs text-white font-semibold transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const perms = data.userPermissions || {};
  const progressPct =
    data.plannedQuantity > 0
      ? Math.min(100, Math.round((data.producedQuantity / data.plannedQuantity) * 100))
      : 0;

  return (
    <div className="min-h-screen bg-[#070d19] text-[#f1f5f9] pb-16">
      {/* Top Mobile Bar */}
      <header className="sticky top-0 z-30 bg-[#0b1324] border-b border-[#1e2a4a] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#1e2a4a] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                QR Verified
              </span>
              <span className="text-xs font-mono font-bold text-white">{data.workOrderNo}</span>
            </div>
            <p className="text-[11px] text-[#94a3b8] truncate max-w-[200px] sm:max-w-xs">
              {data.productName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLabelModalOpen(true)}
            className="p-2 rounded-lg bg-[#1e2a4a] hover:bg-slate-700 text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Print QR Label"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Label</span>
          </button>
          <Link
            to={`/pq/work-orders/${data.id}`}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors"
          >
            Desktop View
          </Link>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        {/* Quality Hold Alert if active */}
        {data.status === "QC_HOLD" && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div className="text-xs">
              <h4 className="font-bold text-amber-300 uppercase tracking-wide">Quality Hold Active (QC_HOLD)</h4>
              <p className="text-amber-200/90 mt-0.5">
                This work order is placed on Quality Hold. Further shopfloor completion is restricted until QA review.
              </p>
            </div>
          </div>
        )}

        {/* Work Order Hero Card */}
        <div className="bg-[#0e172a] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e2a4a]">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748b]">
                Product SKU: {data.productCode || "—"}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">{data.productName}</h2>
              <div className="flex items-center gap-2 mt-2 text-xs text-[#94a3b8]">
                <span>Batch: <strong className="text-[#f1f5f9]">{data.batchNumber || "UNASSIGNED"}</strong></span>
                <span>•</span>
                <span>Priority: <strong className="text-[#f1f5f9] uppercase">{data.priority}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:self-start">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                data.status === "COMPLETED"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : data.status === "IN_PROGRESS"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : data.status === "QC_HOLD"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-slate-700/50 text-slate-300 border border-slate-600"
              }`}>
                {data.status}
              </span>
            </div>
          </div>

          {/* Quantities Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-center">
            <div className="p-3 rounded-xl bg-[#080d1a] border border-[#1e2a4a]">
              <span className="text-[10px] uppercase font-semibold text-[#64748b] block">Planned</span>
              <span className="text-base font-bold text-white">{data.plannedQuantity}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#080d1a] border border-[#1e2a4a]">
              <span className="text-[10px] uppercase font-semibold text-blue-400 block">Produced</span>
              <span className="text-base font-bold text-blue-300">{data.producedQuantity}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#080d1a] border border-[#1e2a4a]">
              <span className="text-[10px] uppercase font-semibold text-emerald-400 block">Accepted (QC)</span>
              <span className="text-base font-bold text-emerald-300">{data.acceptedQuantity}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#080d1a] border border-[#1e2a4a]">
              <span className="text-[10px] uppercase font-semibold text-rose-400 block">Rejected</span>
              <span className="text-base font-bold text-rose-300">{data.rejectedQuantity}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 pt-3 border-t border-[#1e2a4a]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[#94a3b8] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                <span>Production Progress</span>
              </span>
              <span className="font-bold text-white">{progressPct}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[#080d1a] overflow-hidden border border-[#1e2a4a]">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation for Shopfloor Actions */}
        <div className="flex border-b border-[#1e2a4a] overflow-x-auto gap-2 py-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "overview"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-[#94a3b8] hover:text-white hover:bg-[#1e2a4a]"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          {perms.canRecordProgress && (
            <button
              type="button"
              onClick={() => setActiveTab("progress")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "progress"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-[#94a3b8] hover:text-white hover:bg-[#1e2a4a]"
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Record Progress</span>
            </button>
          )}

          {perms.canReportDowntime && (
            <button
              type="button"
              onClick={() => setActiveTab("downtime")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "downtime"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-[#94a3b8] hover:text-white hover:bg-[#1e2a4a]"
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Machine Breakdown</span>
            </button>
          )}

          {perms.canReportDefect && (
            <button
              type="button"
              onClick={() => setActiveTab("defect")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "defect"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-[#94a3b8] hover:text-white hover:bg-[#1e2a4a]"
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Report Defect</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("qc")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "qc"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-[#94a3b8] hover:text-white hover:bg-[#1e2a4a]"
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Quality Inspection</span>
          </button>
        </div>

        {/* TAB CONTENT */}

        {/* 1. OVERVIEW & AUDIT HISTORY */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Meta Card */}
            <div className="bg-[#0e172a] border border-[#1e2a4a] rounded-2xl p-5 space-y-3">
              <h3 className="text-xs uppercase font-bold text-[#64748b] tracking-wider">
                Production Schedule & Assignment
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#64748b] block text-[10px]">Start Date</span>
                  <span className="font-semibold text-white">
                    {data.startDate ? new Date(data.startDate).toLocaleDateString() : "Immediate"}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748b] block text-[10px]">Target Due Date</span>
                  <span className="font-semibold text-white">
                    {data.dueDate ? new Date(data.dueDate).toLocaleDateString() : "Not Specified"}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748b] block text-[10px]">Production Line</span>
                  <span className="font-semibold text-white">{data.line || "Main Fabrication Line"}</span>
                </div>
                <div>
                  <span className="text-[#64748b] block text-[10px]">Assigned Operator / Team</span>
                  <span className="font-semibold text-white">{data.assignedTo || "Shop Floor Team Alpha"}</span>
                </div>
              </div>
            </div>

            {/* Audit History Timeline */}
            <div className="bg-[#0e172a] border border-[#1e2a4a] rounded-2xl p-5">
              <h3 className="text-xs uppercase font-bold text-[#64748b] tracking-wider mb-3">
                Work Order Event & Audit History
              </h3>
              {(!data.history || data.history.length === 0) ? (
                <p className="text-xs text-[#64748b] italic">No prior history events recorded.</p>
              ) : (
                <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-[#1e2a4a]">
                  {data.history.map((item, idx) => (
                    <div key={idx} className="relative flex items-start gap-3 pl-7">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 absolute left-2.5 top-1.5 ring-4 ring-[#0e172a]" />
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{item.action}</span>
                          <span className="text-[10px] text-[#64748b]">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {item.details && (
                          <p className="text-[11px] text-[#94a3b8] mt-0.5">{item.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. RECORD PRODUCTION PROGRESS */}
        {activeTab === "progress" && (
          <div className="bg-[#0e172a] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-blue-400" />
              <span>Record Shift Production Progress</span>
            </h3>
            <p className="text-xs text-[#94a3b8] mb-4">
              Authorized Operator: <strong className="text-white">{currentUser.name || "Operator"}</strong>
            </p>

            {progressMsg && (
              <div className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 ${
                progressMsg.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
              }`}>
                {progressMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{progressMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleRecordProgress} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1">
                  Quantity Produced (Units) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={progressQty}
                  onChange={(e) => setProgressQty(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#080d1a] border border-[#1e2a4a] text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <span className="text-[11px] text-[#64748b] mt-1 block">
                  Remaining planned quantity: {Math.max(0, data.plannedQuantity - data.producedQuantity)} units.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1">
                  Operator Notes / Shift Details (Optional)
                </label>
                <textarea
                  rows="2"
                  value={progressNotes}
                  onChange={(e) => setProgressNotes(e.target.value)}
                  placeholder="e.g. Shift 1 completed on line 2 with zero defects"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#080d1a] border border-[#1e2a4a] text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={progressSubmitting || !progressQty}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                {progressSubmitting ? "Submitting Production Entry..." : "Submit Production Progress"}
              </button>
            </form>
          </div>
        )}

        {/* 3. REPORT MACHINE BREAKDOWN / DOWNTIME */}
        {activeTab === "downtime" && (
          <div className="bg-[#0e172a] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>Report Machine Downtime / Stoppage</span>
            </h3>
            <p className="text-xs text-[#94a3b8] mb-4">
              Automatically dispatches High Priority alerts to Maintenance & Production Managers.
            </p>

            {downtimeMsg && (
              <div className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 ${
                downtimeMsg.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
              }`}>
                {downtimeMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{downtimeMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleReportDowntime} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1">
                  Machine Code / Equipment Identifier
                </label>
                <input
                  type="text"
                  value={downtimeMachine}
                  onChange={(e) => setDowntimeMachine(e.target.value)}
                  placeholder="e.g. STRIP_LINE_01, PRESS_02"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#080d1a] border border-[#1e2a4a] text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1">
                  Breakdown Reason / Symptoms *
                </label>
                <textarea
                  rows="2"
                  required
                  value={downtimeReason}
                  onChange={(e) => setDowntimeReason(e.target.value)}
                  placeholder="e.g. Hydraulic pressure drop on main press cylinder"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#080d1a] border border-[#1e2a4a] text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1">
                  Estimated Downtime Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  value={downtimeDuration}
                  onChange={(e) => setDowntimeDuration(e.target.value)}
                  placeholder="e.g. 45"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#080d1a] border border-[#1e2a4a] text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={downtimeSubmitting || !downtimeReason.trim()}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                {downtimeSubmitting ? "Dispatching Alert..." : "Report Breakdown & Dispatch Alert"}
              </button>
            </form>
          </div>
        )}

        {/* 4. REPORT DEFECT / NON-CONFORMANCE */}
        {activeTab === "defect" && (
          <div className="bg-[#0e172a] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>Report Quality Defect / Scrap</span>
            </h3>
            <p className="text-xs text-[#94a3b8] mb-4">
              Reporting a CRITICAL defect automatically applies a Quality Hold (`QC_HOLD`) on this work order.
            </p>

            {defectMsg && (
              <div className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 ${
                defectMsg.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
              }`}>
                {defectMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{defectMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleReportDefect} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#94a3b8] mb-1">
                    Defect Category
                  </label>
                  <select
                    value={defectCategory}
                    onChange={(e) => setDefectCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#080d1a] border border-[#1e2a4a] text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="DIMENSIONAL">Dimensional Variance</option>
                    <option value="SURFACE_FINISH">Surface / Coating Defect</option>
                    <option value="MATERIAL_PURITY">Material Purity / Grade</option>
                    <option value="WELD_QUALITY">Weld / Bonding Flaw</option>
                    <option value="PACKAGING">Packaging Damage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#94a3b8] mb-1">
                    Defect Severity
                  </label>
                  <select
                    value={defectSeverity}
                    onChange={(e) => setDefectSeverity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#080d1a] border border-[#1e2a4a] text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="MINOR">Minor (Cosmetic)</option>
                    <option value="MAJOR">Major (Rework Needed)</option>
                    <option value="CRITICAL">Critical (Triggers QC_HOLD)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1">
                  Affected Defective Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={defectQty}
                  onChange={(e) => setDefectQty(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#080d1a] border border-[#1e2a4a] text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1">
                  Defect Description & Root Cause Notes
                </label>
                <textarea
                  rows="2"
                  value={defectDesc}
                  onChange={(e) => setDefectDesc(e.target.value)}
                  placeholder="e.g. Coating thickness measured at 80 microns vs required 100 microns"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#080d1a] border border-[#1e2a4a] text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={defectSubmitting || !defectQty}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                {defectSubmitting ? "Submitting Defect..." : "Log Defect & Trigger Quality Review"}
              </button>
            </form>
          </div>
        )}

        {/* 5. QUALITY INSPECTION TAB */}
        {activeTab === "qc" && (
          <div className="bg-[#0e172a] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>Quality Inspection Checklist</span>
                </h3>
                <p className="text-xs text-[#94a3b8]">
                  Inspection records associated with Work Order {data.workOrderNo}
                </p>
              </div>

              {perms.canCreateInspection && (
                <Link
                  to={`/pq/inspections?workOrderId=${data.id}&action=new`}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors"
                >
                  New Inspection
                </Link>
              )}
            </div>

            {(!data.inspections || data.inspections.length === 0) ? (
              <div className="p-6 rounded-xl bg-[#080d1a] border border-[#1e2a4a] text-center text-xs text-[#64748b]">
                <FileText className="w-8 h-8 mx-auto text-[#1e2a4a] mb-2" />
                <p>No quality inspection reports logged yet for this work order.</p>
                {perms.canCreateInspection && (
                  <Link
                    to={`/pq/inspections?workOrderId=${data.id}&action=new`}
                    className="inline-block mt-3 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
                  >
                    Open Inspection Checklist
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {data.inspections.map((insp) => (
                  <div
                    key={insp.id}
                    className="p-3.5 rounded-xl bg-[#080d1a] border border-[#1e2a4a] flex items-center justify-between text-xs hover:border-slate-600 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">Inspection #{insp.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          insp.status === "PASSED"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : insp.status === "FAILED"
                            ? "bg-rose-500/20 text-rose-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}>
                          {insp.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#64748b] block mt-0.5">
                        Sample Size: {insp.sampleSize || "—"} • Inspected by {insp.inspectorName || "QA Team"}
                      </span>
                    </div>

                    <Link
                      to={`/pq/inspections/${insp.id}`}
                      className="p-2 rounded-lg bg-[#1e2a4a] hover:bg-slate-700 text-[#94a3b8] hover:text-white transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* QR Printable Label Modal */}
      <QRLabelModal
        isOpen={isLabelModalOpen}
        onClose={() => setIsLabelModalOpen(false)}
        workOrderId={data.id}
        workOrderNo={data.workOrderNo}
      />
    </div>
  );
}
