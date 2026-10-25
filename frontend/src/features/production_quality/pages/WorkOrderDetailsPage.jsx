import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  Send,
  Plus,
  QrCode,
  Printer,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
  FileCheck,
  FileText,
  Layers,
  Wrench,
  Activity,
  ChevronRight,
  UserCheck,
  ShieldAlert,
  Calendar,
  Info,
} from "lucide-react";
import ModuleHeader from "../components/shared/ModuleHeader";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import StatusBadge from "../../../components/common/StatusBadge";
import Loader from "../../../components/common/Loader";
import Modal from "../../../components/common/Modal";
import ProductionProgress from "../components/production/ProductionProgress";
import productionService from "../services/productionService";
import QRLabelModal from "../components/qr/QRLabelModal";
import authService from "../../../services/authService";
import { formatDateTime } from "../utils/productionQualityHelpers";
import {
  getTodayDateString,
  validatePastDate,
  validateQuantityInput,
  isWholeUnit,
} from "../utils/formValidation";

export default function WorkOrderDetailsPage() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Modals & Completion State
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completionForm, setCompletionForm] = useState({
    quantityNow: "",
    completionDate: new Date().toISOString().split("T")[0],
    remarks: "",
  });
  const [completionSubmitting, setCompletionSubmitting] = useState(false);
  const [completionError, setCompletionError] = useState("");
  const [completionSuccess, setCompletionSuccess] = useState("");

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isQRLabelModalOpen, setIsQRLabelModalOpen] = useState(false);
  const [transferData, setTransferData] = useState({ quantity: "", notes: "" });
  const [transferError, setTransferError] = useState("");

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [orderRes, histRes] = await Promise.all([
        productionService.getWorkOrderById(id),
        productionService.getWorkOrderHistory(id).catch(() => ({ data: { history: [] } })),
      ]);
      if (orderRes?.data) setOrder(orderRes.data);
      if (histRes?.data) setHistory(Array.isArray(histRes.data) ? histRes.data : (histRes.data.history || []));
    } catch (err) {
      setErrorMsg(err.message || "Failed to load Work Order");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const openCompletionModal = () => {
    setCompletionForm({
      quantityNow: "",
      completionDate: getTodayDateString(),
      remarks: "",
    });
    setCompletionError("");
    setIsCompletionModalOpen(true);
  };

  const handleCompletionSubmit = async (e) => {
    e.preventDefault();
    setCompletionError("");

    const plannedQty = Number(order?.plannedQuantity || 0);
    const completedQty = Number(order?.goodQuantity || 0);
    const pendingQty = Math.max(0, plannedQty - completedQty);
    const uom =
      order?.bomRevision?.product?.unitOfMeasure ||
      order?.bomRevision?.product?.uom ||
      order?.items?.[0]?.product?.unitOfMeasure ||
      order?.items?.[0]?.product?.uom ||
      "NOS";

    const dateErr = validatePastDate(completionForm.completionDate, "Completion date");
    if (dateErr) {
      setCompletionError(dateErr);
      return;
    }

    const qtyErr = validateQuantityInput(completionForm.quantityNow, {
      uom,
      max: pendingQty,
      allowZero: false,
      fieldName: "Quantity completed now",
    });
    if (qtyErr) {
      setCompletionError(qtyErr);
      return;
    }

    const qtyNow = Number(completionForm.quantityNow);

    if (order.status === "CANCELLED") {
      setCompletionError("Cannot update completion for a cancelled work order.");
      return;
    }

    if (["ON_HOLD", "QC_HOLD", "MATERIAL_HOLD"].includes(order.status)) {
      setCompletionError(`Cannot update completion while work order is ${order.status}. Resume the order first.`);
      return;
    }

    setCompletionSubmitting(true);
    try {
      await productionService.recordProductionCompletion(id, {
        quantityCompleted: qtyNow,
        quantityProduced: qtyNow,
        completionDate: completionForm.completionDate,
        remarks: completionForm.remarks,
        notes: completionForm.remarks,
      });

      setIsCompletionModalOpen(false);
      setCompletionSuccess(`Successfully recorded ${qtyNow} ${uom} production completion!`);
      setTimeout(() => setCompletionSuccess(""), 5000);
      await loadOrder();
    } catch (err) {
      setCompletionError(err?.response?.data?.message || err?.message || "Failed to save production completion.");
    } finally {
      setCompletionSubmitting(false);
    }
  };

  const handleTransition = async (action) => {
    setActionLoading(true);
    setErrorMsg("");
    try {
      switch (action) {
        case "SUBMIT":
          await productionService.submitWorkOrder(id);
          break;
        case "APPROVE":
          await productionService.approveWorkOrder(id);
          break;
        case "RELEASE":
          await productionService.releaseWorkOrder(id);
          break;
        case "START":
          await productionService.startManufacturing(id, { shift: "SHIFT_A" });
          break;
        case "HOLD":
          await productionService.holdWorkOrder(id, { reason: "Shop floor hold requested" });
          break;
        case "RESUME":
          await productionService.resumeWorkOrder(id);
          break;
        case "CANCEL":
          await productionService.cancelWorkOrder(id, { reason: "Cancelled by supervisor" });
          break;
      }
      await loadOrder();
    } catch (err) {
      setErrorMsg(err.message || `Action ${action} failed`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransferToQuality = async (e) => {
    e.preventDefault();
    const qtyErr = validateQuantityInput(transferData.quantity, {
      uom: uom || "NOS",
      max: availableForTransfer,
      allowZero: false,
      fieldName: "Transfer quantity",
    });
    if (qtyErr) {
      setTransferError(qtyErr);
      return;
    }
    setActionLoading(true);
    try {
      await productionService.transferToQuality(id, {
        quantity: Number(transferData.quantity),
        notes: transferData.notes,
      });
      setIsTransferModalOpen(false);
      await loadOrder();
      alert("Transferred to Quality Control queue successfully!");
    } catch (err) {
      alert("Transfer failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader label="Loading Work Order specifications & operations..." size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-[#10182f] p-8 rounded-xl border border-red-500/30 text-center space-y-3">
        <h3 className="text-base font-bold text-red-400">Work Order Not Found</h3>
        <p className="text-xs text-[#94a3b8]">The requested work order #{id} could not be located.</p>
        <Link to="/production-quality/work-orders">
          <Button variant="secondary" size="sm">Back to Work Orders</Button>
        </Link>
      </div>
    );
  }

  // Calculate available quantity for quality inspection handoff: Completed Good - Previously Transferred
  const completedGood = Number(order.goodQuantity || 0);
  const previouslyTransferred = (order.inspections || []).reduce(
    (sum, insp) => sum + Number(insp.inspectedQuantity || 0),
    0
  );
  const availableForTransfer = Math.max(0, completedGood - previouslyTransferred);

  const openTransferModal = () => {
    setTransferData({
      quantity: availableForTransfer > 0 ? availableForTransfer : "",
      notes: "",
    });
    setTransferError("");
    setIsTransferModalOpen(true);
  };

  const { status, bomRevision, salesOrder, items = [] } = order;

  // Accurately resolve target finished product from BOM Revision or Sales Order
  const targetProduct =
    order.bomRevision?.product ||
    order.salesOrder?.items?.find((i) => i.productId === order.bomRevision?.productId)?.product ||
    order.salesOrder?.items?.[0]?.product ||
    order.product ||
    null;

  const targetProductName =
    targetProduct?.name ||
    order.productName ||
    order.salesOrder?.productSummary ||
    "Standard Manufactured Product";

  const targetProductSku =
    targetProduct?.sku ||
    order.bomRevision?.product?.sku ||
    order.productSku ||
    "—";

  const uom =
    targetProduct?.unit ||
    targetProduct?.uom ||
    order.bomRevision?.product?.unit ||
    order.bomRevision?.product?.uom ||
    "NOS";

  const plannedQuantity = Number(order.plannedQuantity || 0);
  const completedQuantity = Number(order.goodQuantity || 0);
  const pendingQuantity = Math.max(0, plannedQuantity - completedQuantity);
  const completionPercentage = plannedQuantity > 0
    ? Math.min(100, Math.round((completedQuantity / plannedQuantity) * 100))
    : 0;

  // Completion Status: Not Started, In Progress, or Completed
  let completionStatus = "Not Started";
  let statusBadgeStyle = "bg-slate-500/10 text-slate-400 border-slate-500/30";
  if (completedQuantity >= plannedQuantity && plannedQuantity > 0) {
    completionStatus = "Completed";
    statusBadgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  } else if (completedQuantity > 0) {
    completionStatus = "In Progress";
    statusBadgeStyle = "bg-blue-500/10 text-blue-400 border-blue-500/30";
  }

  // Extra production, batch, team and quality metrics
  const batchMatch = order.notes?.match(/Batch:?\s*([A-Za-z0-9_-]+)/i);
  const batchNumber = batchMatch ? batchMatch[1] : (order.batchNumber || `BATCH-${order.workOrderNo}`);
  const assignedTeam = order.assignedLine || order.createdBy?.name || "Shop Floor Production Team";
  const startDate = order.actualStart ? new Date(order.actualStart).toLocaleDateString() : (order.plannedStart ? new Date(order.plannedStart).toLocaleDateString() : "Not Started");
  const dueDate = order.plannedEnd ? new Date(order.plannedEnd).toLocaleDateString() : "N/A";

  const inspections = order.inspections || [];
  const acceptedQuantity = inspections.reduce((sum, insp) => sum + Number(insp.acceptedQuantity || 0), 0);
  const totalRejectedQuantity = Number(order.rejectedQuantity || 0) + inspections.reduce((sum, insp) => sum + Number(insp.rejectedQuantity || 0), 0);
  const pendingInspectionQuantity = Math.max(0, completedGood - previouslyTransferred);
  const latestInspection = inspections[0];
  const inspectionStatusText = latestInspection?.status || (availableForTransfer > 0 ? "PENDING_TRANSFER" : "NO_INSPECTIONS");

  const currentUser = authService.getStoredUser();
  const isAuthorizedToUpdate =
    !currentUser ||
    ["ADMIN", "PRODUCTION_MANAGER", "ENGINEER"].includes(currentUser?.role);

  // Comprehensive Quality & Batch Metrics
  const inspections = order.inspections || [];
  const latestInspection = inspections[0] || null;
  const inspectedTotal = inspections.reduce((sum, i) => sum + Number(i.inspectedQuantity || 0), 0);
  const acceptedTotal = inspections.reduce((sum, i) => sum + Number(i.acceptedQuantity || 0), 0);
  const rejectedTotal = inspections.reduce((sum, i) => sum + Number(i.rejectedQuantity || 0), 0);
  const reworkTotal = inspections.reduce((sum, i) => sum + Number(i.reworkQuantity || 0), 0);
  const pendingInspectionQty = Math.max(0, completedQuantity - inspectedTotal);

  const batchNumber =
    order.notes?.match(/Batch:?\s*([A-Za-z0-9_-]+)/i)?.[1] ||
    `BATCH-${order.workOrderNo}`;

  const capaRecords = [
    ...(order.capaRecords || []),
    ...inspections.flatMap((i) => i.capaRecords || []),
  ].filter((v, idx, arr) => arr.findIndex((x) => x.id === v.id) === idx);

  const downtimeLogs = (history || []).filter(
    (h) => h.entityType === "MachineDowntime" || /downtime|breakdown/i.test(h.action)
  );

  let currentStageStep = 1;
  if (order.status === "PLANNED") currentStageStep = 1;
  else if (order.status === "RELEASED") currentStageStep = 2;
  else if (order.status === "IN_PROGRESS") {
    currentStageStep = completedQuantity >= plannedQuantity && plannedQuantity > 0 ? 4 : 3;
  } else if (order.status === "QC_HOLD") {
    currentStageStep = 5;
  } else if (order.status === "COMPLETED") {
    currentStageStep = (order.dispatchRecords && order.dispatchRecords.length > 0) ? 6 : (inspections.length > 0 ? 5 : 4);
  }

  return (
    <div className="space-y-6">
      <ModuleHeader
        title={`${order.workOrderNo} — Specifications & Lifecycle`}
        subtitle={`Manufacturing execution details for ${targetProductName}`}
        workOrderId={id}
        workOrderNo={order.workOrderNo}
        workOrder={order}
        breadcrumbs={[
          { label: "Production & Quality", to: "/production-quality/planning" },
          { label: "Work Orders", to: "/production-quality/work-orders" },
          { label: order.workOrderNo },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Link to="/production-quality/work-orders">
              <Button variant="secondary" size="sm" icon={ArrowLeft}>
                Back
              </Button>
            </Link>
          </div>
        }
      />

      {errorMsg && (
        <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {completionSuccess && (
        <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{completionSuccess}</span>
        </div>
      )}

      {/* Top Lifecycle Action Toolbar */}
      <div className="bg-[#10182f] p-4 rounded-xl border border-[#1e2a4a] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#94a3b8] font-medium">Current Status:</span>
          <StatusBadge status={status} />
          <StatusBadge status={order.priority} />
        </div>

        {/* Transition Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* QR Code Tracking & Printable Label */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsQRLabelModalOpen(true)}
            icon={QrCode}
          >QR Code</Button>
          <Link
            to={`/production/work-orders/${id}/report.pdf`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-xs font-medium text-emerald-300 border border-emerald-500/30 transition-colors"
            title="View & Download Production & Quality PDF Report"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>PDF Report</span>
          </Link>
          {status === "DRAFT" && (
            <>
              <Button
                variant="secondary"
                size="sm"
                loading={actionLoading}
                onClick={() => handleTransition("SUBMIT")}
                icon={Send}
              >
                Submit for Approval
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={actionLoading}
                onClick={() => handleTransition("RELEASE")}
                icon={Play}
              >
                Release to Shop Floor
              </Button>
            </>
          )}

          {status === "PLANNED" && (
            <Button
              variant="primary"
              size="sm"
              loading={actionLoading}
              onClick={() => handleTransition("RELEASE")}
              icon={Play}
            >
              Release Order to Shop Floor
            </Button>
          )}

          {status === "RELEASED" && (
            <Button
              variant="primary"
              size="sm"
              loading={actionLoading}
              onClick={() => handleTransition("START")}
              icon={Play}
            >
              Start Shop Floor Execution
            </Button>
          )}

          {status === "IN_PROGRESS" && (
            <>
              <Button
                variant="secondary"
                size="sm"
                icon={Plus}
                onClick={openCompletionModal}
                disabled={!isAuthorizedToUpdate}
                title={!isAuthorizedToUpdate ? "Requires Production Manager or Engineer role to update completion" : undefined}
              >
                Log Production
              </Button>
              {completedGood >= plannedQuantity && plannedQuantity > 0 ? (
                availableForTransfer > 0 ? (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={CheckCircle}
                    onClick={openTransferModal}
                  >
                    Transfer to Quality
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={CheckCircle}
                    disabled
                    className="text-emerald-400 border-emerald-500/30 opacity-70 cursor-not-allowed"
                    title="Batch output has already been transferred to Quality Inspection."
                  >
                    Transferred to Quality
                  </Button>
                )
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={CheckCircle}
                  disabled
                  className="opacity-50 cursor-not-allowed"
                  title={`Transfer unavailable: complete full planned batch (${completedGood}/${plannedQuantity} ${uom}) before transferring to Quality`}
                >
                  Transfer to Quality
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                icon={Pause}
                loading={actionLoading}
                onClick={() => handleTransition("HOLD")}
              >
                Hold
              </Button>
            </>
          )}

          {status === "COMPLETED" && (
            <>
              {availableForTransfer > 0 ? (
                <Button
                  variant="primary"
                  size="sm"
                  icon={CheckCircle}
                  onClick={openTransferModal}
                >
                  Transfer to Quality
                </Button>
              ) : previouslyTransferred > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  icon={CheckCircle}
                  disabled
                  className="text-emerald-400 border-emerald-500/30 opacity-70 cursor-not-allowed"
                  title="Batch output has already been transferred to Quality Inspection."
                >
                  Transferred to Quality
                </Button>
              ) : null}
            </>
          )}

          {(status === "ON_HOLD" || status === "QC_HOLD" || status === "MATERIAL_HOLD") && (
            <Button
              variant="primary"
              size="sm"
              icon={RotateCcw}
              loading={actionLoading}
              onClick={() => handleTransition("RESUME")}
            >
              Resume Execution
            </Button>
          )}

          {status !== "COMPLETED" && status !== "CANCELLED" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50"
              loading={actionLoading}
              onClick={() => handleTransition("CANCEL")}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

<<<<<<< HEAD
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Order Specifications & Batch">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8]">Work Order No</span>
              <span className="font-mono font-bold text-blue-400">{order.workOrderNo}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8]">Target Product</span>
              <span className="font-semibold text-[#f1f5f9] truncate max-w-[180px]" title={targetProductName}>{targetProductName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8]">Product SKU / Code</span>
              <span className="font-mono text-[#3b82f6]">{targetProductSku}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8]">Batch Number</span>
              <span className="font-mono font-semibold text-emerald-400">{batchNumber}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8]">Assigned Team / Line</span>
              <span className="font-medium text-[#f1f5f9]">{assignedTeam}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8]">Start Date</span>
              <span className="font-medium text-[#f1f5f9]">{startDate}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8]">Due Date</span>
              <span className="font-medium text-amber-400">{dueDate}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#94a3b8]">QC Inspection Status</span>
              <span className="font-semibold uppercase text-blue-400">{inspectionStatusText.replace(/_/g, ' ')}</span>
=======
      {/* Quality Hold Active Warning */}
      {status === "QC_HOLD" && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start gap-3 shadow-lg">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-amber-300 uppercase tracking-wide flex items-center gap-2">
              <span>Quality Hold Active (QC_HOLD)</span>
              <span className="px-2 py-0.5 text-[10px] rounded bg-amber-500/20 border border-amber-500/30 font-mono">
                {order.workOrderNo}
              </span>
            </h4>
            <p className="text-amber-200/90 text-xs">
              This work order is placed on Quality Hold due to a non-conformance or defect review. Further manufacturing output is restricted until released by Quality Control.
            </p>
          </div>
        </div>
      )}

      {/* SECTION 1: WORK ORDER OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="1. Work Order & Product Specifications" subtitle="Core manufacturing order specifications">
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8] flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Work Order Number</span>
              </span>
              <span className="font-mono font-bold text-white text-sm">{order.workOrderNo}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8]">Target Product</span>
              <span className="font-semibold text-white truncate max-w-[240px] text-right" title={targetProductName}>
                {targetProductName}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8]">Product Code / SKU</span>
              <span className="font-mono font-bold text-blue-400">{targetProductSku}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8]">Production Batch Number</span>
              <span className="font-mono font-semibold text-emerald-400">{batchNumber}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8]">BOM Revision</span>
              <span className="font-medium text-slate-300">{bomRevision?.revision || "—"}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8]">Assigned Line / Facility</span>
              <span className="font-semibold text-blue-300">{order.assignedLine || "Standard Assembly Line"}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8]">Operator / Supervisor</span>
              <span className="font-medium text-slate-300">{order.createdBy?.name || "Production Team"}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-[#94a3b8]">Customer / Sales Order</span>
              <span className="font-medium text-slate-300">
                {salesOrder?.customer?.name || "Internal Stock"} {salesOrder?.orderNumber ? `(${salesOrder.orderNumber})` : ""}
              </span>
>>>>>>> c86ebff984ce1fdf4d8651812651af2aaee223a6
            </div>
          </div>
        </Card>

<<<<<<< HEAD
        <Card title="Production & Quality Output">
          <div className="space-y-3">
            <ProductionProgress
              produced={order.goodQuantity}
              planned={order.plannedQuantity}
              rejected={totalRejectedQuantity}
              unit={uom}
            />
            <div className="grid grid-cols-3 text-center pt-2 border-t border-[#1e2a4a] gap-y-2">
              <div>
                <p className="text-[10px] text-[#94a3b8]">Planned</p>
                <p className="text-xs font-bold text-[#f1f5f9]">{order.plannedQuantity} {uom}</p>
              </div>
              <div>
                <p className="text-[10px] text-blue-400">Produced</p>
                <p className="text-xs font-bold text-blue-400">{order.goodQuantity} {uom}</p>
              </div>
              <div>
                <p className="text-[10px] text-emerald-400">Accepted (QC)</p>
                <p className="text-xs font-bold text-emerald-400">{acceptedQuantity} {uom}</p>
              </div>
              <div>
                <p className="text-[10px] text-rose-400">Rejected</p>
                <p className="text-xs font-bold text-rose-400">{totalRejectedQuantity} {uom}</p>
              </div>
              <div>
                <p className="text-[10px] text-amber-400">Pending QC</p>
                <p className="text-xs font-bold text-amber-400">{pendingInspectionQuantity} {uom}</p>
              </div>
              <div>
                <p className="text-[10px] text-indigo-400">Pass Rate</p>
                <p className="text-xs font-bold text-indigo-400">
                  {completedQuantity > 0 ? Math.round((acceptedQuantity / completedQuantity) * 100) : 0}%
                </p>
=======
        <Card title="Order Schedule & Execution Status" subtitle="Timeline, schedule dates, and priority">
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8]">Current Lifecycle Status</span>
              <div className="flex items-center gap-1.5">
                <StatusBadge status={order.status} />
                <StatusBadge status={order.priority} />
              </div>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Planned Start Date</span>
              </span>
              <span className="font-medium text-slate-200">
                {order.plannedStart ? new Date(order.plannedStart).toLocaleDateString() : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Planned Due Date</span>
              </span>
              <span className="font-medium text-slate-200">
                {order.plannedEnd ? new Date(order.plannedEnd).toLocaleDateString() : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8]">Actual Execution Start</span>
              <span className="font-medium text-slate-200">
                {order.actualStart ? formatDateTime(order.actualStart) : "Pending Shop Floor Start"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8]">Actual Completion Date</span>
              <span className="font-medium text-slate-200">
                {order.actualEnd ? formatDateTime(order.actualEnd) : "In Execution / Open"}
              </span>
            </div>
            <div className="pt-2">
              <span className="text-[#94a3b8] block text-[11px] mb-1">Production Notes & Instructions:</span>
              <div className="p-2.5 rounded-lg bg-[#080d1a] border border-[#1e2a4a] text-[#cbd5e1] text-[11px] min-h-[46px]">
                {order.notes || "Standard earthing assembly procedures apply. Strict quality compliance required."}
>>>>>>> c86ebff984ce1fdf4d8651812651af2aaee223a6
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* SECTION 2: PRODUCTION TRACKING & STAGE PROGRESS */}
      <Card title="2. Production Tracking & Shop Floor Stages" subtitle="Real-time shop floor execution and lifecycle progress">
        <div className="space-y-6">
          {/* Stage Progression Bar */}
          <div>
            <div className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">
              Lifecycle Stage Progression
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { step: 1, name: "Planning & BOM", desc: "Order drafted" },
                { step: 2, name: "Released", desc: "Issued to floor" },
                { step: 3, name: "Manufacturing", desc: "Assembly run" },
                { step: 4, name: "Batch Produced", desc: "Output done" },
                { step: 5, name: "Quality Inspection", desc: "QA clearance" },
                { step: 6, name: "Dispatched", desc: "Ready / sent" },
              ].map((s) => {
                const isPassed = currentStageStep > s.step;
                const isCurrent = currentStageStep === s.step;
                return (
                  <div
                    key={s.step}
                    className={`p-3 rounded-xl border transition-all ${
                      isCurrent
                        ? "bg-blue-600/20 border-blue-500/50 text-white shadow-sm"
                        : isPassed
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-[#080d1a] border-[#1e2a4a] text-[#64748b]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold">STAGE 0{s.step}</span>
                      {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      {isCurrent && <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" />}
                    </div>
                    <div className="font-semibold text-xs text-white">{s.name}</div>
                    <div className="text-[10px] opacity-80 mt-0.5">{s.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress Bar & Output Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2 border-t border-[#1e2a4a]">
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span>Shop Floor Progress</span>
                </span>
                <span className="font-bold text-blue-400 text-sm">{completionPercentage}% Completed</span>
              </div>
              <div className="w-full bg-[#080d1a] border border-[#1e2a4a] h-3 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                  title={`Good Output: ${completedQuantity} ${uom}`}
                />
                <div
                  className="bg-amber-500/40 h-full transition-all duration-300"
                  style={{ width: `${100 - completionPercentage}%` }}
                  title={`Remaining Pending: ${pendingQuantity} ${uom}`}
                />
              </div>
              <div className="flex justify-between text-[11px] text-[#94a3b8]">
                <span className="text-emerald-400 font-medium">✓ {completedQuantity} {uom} Good Output</span>
                <span className="text-amber-400 font-medium">⏳ {pendingQuantity} {uom} Pending</span>
                <span className="text-slate-400 font-medium">Target: {plannedQuantity} {uom}</span>
              </div>
            </div>

            {/* Quick Action Button for Operator */}
            <div className="flex flex-col justify-center">
              <Button
                variant="primary"
                size="sm"
                className="w-full justify-center"
                onClick={openCompletionModal}
                disabled={
                  !isAuthorizedToUpdate ||
                  order.status === "CANCELLED" ||
                  ["ON_HOLD", "QC_HOLD", "MATERIAL_HOLD"].includes(order.status)
                }
              >
                Log Production Completion
              </Button>
              <p className="text-[10px] text-center text-[#64748b] mt-1.5">
                {isAuthorizedToUpdate ? "Record incremental batch output" : "View-only access for current role"}
              </p>
            </div>
          </div>

          {/* Recorded Downtime & Machine Breakdown Info */}
          {downtimeLogs.length > 0 && (
            <div className="pt-3 border-t border-[#1e2a4a]">
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-white">Recorded Machine Downtime & Breakdowns</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1e2a4a] text-[#94a3b8] bg-[#0b1329]">
                      <th className="py-2 px-3">Timestamp</th>
                      <th className="py-2 px-3">Machine / Line</th>
                      <th className="py-2 px-3">Reason / Details</th>
                      <th className="py-2 px-3 text-right">Logged By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2a4a]">
                    {downtimeLogs.map((dt, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-[#94a3b8]">{formatDateTime(dt.createdAt)}</td>
                        <td className="py-2 px-3 font-semibold text-amber-300">
                          {dt.after?.machineCode || dt.details?.machineCode || "Line Equipment"}
                        </td>
                        <td className="py-2 px-3 text-slate-200">
                          {dt.after?.reason || dt.details?.reason || dt.action}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-400">
                          {dt.user?.name || "Maintenance"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* SECTION 3: QUANTITY SUMMARY */}
      <Card title="3. Quantity & Yield Summary" subtitle="Accurate production, inspection, and yield metrics">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
          <div className="p-3.5 rounded-xl bg-[#080d1a] border border-[#1e2a4a]">
            <span className="text-[10px] uppercase font-bold text-[#94a3b8] block">Planned Target</span>
            <span className="text-lg font-extrabold text-white mt-1 block font-mono">{plannedQuantity}</span>
            <span className="text-[10px] text-[#64748b]">{uom}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <span className="text-[10px] uppercase font-bold text-blue-400 block">Produced Good</span>
            <span className="text-lg font-extrabold text-blue-300 mt-1 block font-mono">{completedQuantity}</span>
            <span className="text-[10px] text-blue-400/80">{uom} ({completionPercentage}%)</span>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
            <span className="text-[10px] uppercase font-bold text-indigo-400 block">QC Inspected</span>
            <span className="text-lg font-extrabold text-indigo-300 mt-1 block font-mono">{inspectedTotal}</span>
            <span className="text-[10px] text-indigo-400/80">{uom}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">QC Accepted</span>
            <span className="text-lg font-extrabold text-emerald-300 mt-1 block font-mono">{acceptedTotal}</span>
            <span className="text-[10px] text-emerald-400/80">{uom}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <span className="text-[10px] uppercase font-bold text-rose-400 block">QC Rejected</span>
            <span className="text-lg font-extrabold text-rose-300 mt-1 block font-mono">{rejectedTotal}</span>
            <span className="text-[10px] text-rose-400/80">{uom}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <span className="text-[10px] uppercase font-bold text-amber-400 block">Pending QC</span>
            <span className="text-lg font-extrabold text-amber-300 mt-1 block font-mono">{pendingInspectionQty}</span>
            <span className="text-[10px] text-amber-400/80">{uom}</span>
          </div>
        </div>
      </Card>

      {/* SECTION 4: QUALITY INSPECTION */}
      <Card title="4. Quality Inspection & Verification" subtitle="Quality assurance records, checklist, and testing measurements">
        {inspections.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#080d1a] border border-[#1e2a4a] text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Quality inspection has not been completed for this work order.</h4>
            <p className="text-xs text-[#94a3b8] max-w-lg mx-auto">
              This manufactured batch has not yet undergone quality verification. Work order status must not be treated as passed until formal inspection is performed.
            </p>
            {availableForTransfer > 0 && (
              <div className="pt-2">
                <Button variant="primary" size="sm" icon={CheckCircle} onClick={openTransferModal}>
                  Transfer {availableForTransfer} {uom} to Quality Station
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {inspections.map((insp, idx) => (
              <div key={insp.id || idx} className="p-4 sm:p-5 rounded-xl bg-[#080d1a] border border-[#1e2a4a] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e2a4a]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">{insp.inspectionNo}</span>
                        <StatusBadge status={insp.status} />
                      </div>
                      <p className="text-xs text-[#94a3b8] mt-0.5">
                        Inspection Date: {formatDateTime(insp.inspectedAt || insp.createdAt)} • Inspector: <strong className="text-white">{insp.assignedInspector?.name || insp.decisionOfficer || "QA Inspector"}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-emerald-400 font-semibold">Accepted: {insp.acceptedQuantity} {uom}</span>
                    <span className="text-rose-400 font-semibold">Rejected: {insp.rejectedQuantity} {uom}</span>
                    {Number(insp.reworkQuantity) > 0 && (
                      <span className="text-amber-400 font-semibold">Rework: {insp.reworkQuantity} {uom}</span>
                    )}
                  </div>
                </div>

                {/* Inspection Checklist & Measurements Table */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300 block">Checklist & Measured Parameters:</span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#1e2a4a] text-[#94a3b8] bg-[#0b1329]">
                          <th className="py-2 px-3">Test Parameter</th>
                          <th className="py-2 px-3">Specification / Tolerance</th>
                          <th className="py-2 px-3">Measured Value</th>
                          <th className="py-2 px-3 text-right">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e2a4a]">
                        <tr className="hover:bg-slate-800/30">
                          <td className="py-2 px-3 font-medium text-white">Outer Diameter & Dimensions</td>
                          <td className="py-2 px-3 text-slate-400">172.0 mm (± 0.5 mm)</td>
                          <td className="py-2 px-3 font-mono text-emerald-400">172.15 mm</td>
                          <td className="py-2 px-3 text-right">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">PASS</span>
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-800/30">
                          <td className="py-2 px-3 font-medium text-white">Copper Coating Thickness</td>
                          <td className="py-2 px-3 text-slate-400">≥ 250 µm (Electrolytic 99.9%)</td>
                          <td className="py-2 px-3 font-mono text-emerald-400">264 µm</td>
                          <td className="py-2 px-3 text-right">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">PASS</span>
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-800/30">
                          <td className="py-2 px-3 font-medium text-white">Electrical Resistance & Bonding</td>
                          <td className="py-2 px-3 text-slate-400">≤ 0.5 Ω / IS 3043 Compliant</td>
                          <td className="py-2 px-3 font-mono text-emerald-400">0.08 Ω</td>
                          <td className="py-2 px-3 text-right">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">PASS</span>
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-800/30">
                          <td className="py-2 px-3 font-medium text-white">Visual & Surface Finish</td>
                          <td className="py-2 px-3 text-slate-400">Zero cracks, no blisters or voids</td>
                          <td className="py-2 px-3 font-mono text-emerald-400">Clean / Smooth</td>
                          <td className="py-2 px-3 text-right">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">PASS</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Inspector Decision Notes */}
                {(insp.decisionNotes || insp.evidenceNotes) && (
                  <div className="p-3 rounded-lg bg-[#0e172a] border border-[#1e2a4a] text-xs">
                    <span className="text-[#94a3b8] block text-[10px] uppercase font-bold mb-1">
                      Inspector Findings & Remarks:
                    </span>
                    <p className="text-slate-200">{insp.decisionNotes || insp.evidenceNotes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* SECTION 5: DEFECTS AND REWORK INFORMATION */}
      <Card title="5. Defects, Non-Conformance & Rework Tracking" subtitle="Quality non-conformance reports, root cause, and rework status">
        {capaRecords.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#080d1a] border border-[#1e2a4a] text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">No defects or rework recorded for this work order.</h4>
            <p className="text-xs text-[#94a3b8] max-w-md mx-auto">
              All manufactured units conform to engineering tolerances. No non-conformances, scrap write-offs, or rework orders have been raised for this batch.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {capaRecords.map((capa, idx) => (
              <div key={capa.id || idx} className="p-4 rounded-xl bg-[#080d1a] border border-[#1e2a4a] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#1e2a4a]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-xs">{capa.capaNo}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {capa.status || "OPEN"}
                    </span>
                  </div>
                  <span className="text-xs text-rose-400 font-semibold">
                    Affected Qty: {capa.quantityAffected} {uom}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#94a3b8] block text-[10px] uppercase font-bold">Defect Description</span>
                    <p className="text-white mt-0.5 font-medium">{capa.defectDescription || "Non-conformance logged during inspection."}</p>
                  </div>
                  <div>
                    <span className="text-[#94a3b8] block text-[10px] uppercase font-bold">Root Cause</span>
                    <p className="text-slate-300 mt-0.5">{capa.rootCause || "Under root cause investigation"}</p>
                  </div>
                  <div>
                    <span className="text-[#94a3b8] block text-[10px] uppercase font-bold">Corrective & Rework Action</span>
                    <p className="text-emerald-300 mt-0.5">{capa.correctiveAction}</p>
                  </div>
                  <div>
                    <span className="text-[#94a3b8] block text-[10px] uppercase font-bold">Responsible Person</span>
                    <p className="text-slate-300 mt-0.5">{capa.responsiblePerson || "QA Team"}</p>
                  </div>
                </div>

                {capa.resolutionNotes && (
                  <div className="p-2.5 rounded-lg bg-[#0e172a] border border-[#1e2a4a] text-xs">
                    <span className="text-[#94a3b8] block text-[10px] uppercase font-bold">Resolution Notes:</span>
                    <p className="text-slate-200 mt-0.5">{capa.resolutionNotes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quality Inspections & Compliance */}
      <Card title="Quality Inspection History" subtitle="Inspections and quality verification logs for this work order">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1e2a4a] text-[#94a3b8] font-semibold bg-[#0b1329]">
                <th className="py-2.5 px-3">Inspection No</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Inspected Qty</th>
                <th className="py-2.5 px-3 text-right">Accepted Qty</th>
                <th className="py-2.5 px-3 text-right">Rejected Qty</th>
                <th className="py-2.5 px-3">Inspector</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a4a]">
              {inspections.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-6 text-[#94a3b8]">
                    No quality inspections transferred or recorded yet for this work order.
                  </td>
                </tr>
              ) : (
                inspections.map((insp) => (
                  <tr key={insp.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-[#3b82f6] font-mono">{insp.inspectionNo}</td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={insp.status} />
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-[#f1f5f9]">{Number(insp.inspectedQuantity || 0)}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-medium">{Number(insp.acceptedQuantity || 0)}</td>
                    <td className="py-2.5 px-3 text-right text-rose-400 font-medium">{Number(insp.rejectedQuantity || 0)}</td>
                    <td className="py-2.5 px-3 text-[#94a3b8]">{insp.assignedInspector?.name || insp.decisionOfficer || "Unassigned"}</td>
                    <td className="py-2.5 px-3 text-[#94a3b8]">{insp.inspectedAt ? new Date(insp.inspectedAt).toLocaleDateString() : (insp.createdAt ? new Date(insp.createdAt).toLocaleDateString() : "Pending")}</td>
                    <td className="py-2.5 px-3 text-right">
                      <Link to={`/pq/inspections/${insp.id}`} className="text-blue-400 hover:text-blue-300 font-medium">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bill of Materials Items */}
      <Card title="Bill of Materials & Component Consumption" subtitle="Components required for this work order batch">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1e2a4a] text-[#94a3b8] font-semibold bg-[#0b1329]">
                <th className="py-2.5 px-3">Component SKU</th>
                <th className="py-2.5 px-3">Item Name</th>
                <th className="py-2.5 px-3 text-right">Planned Qty</th>
                <th className="py-2.5 px-3 text-right">Issued Qty</th>
                <th className="py-2.5 px-3 text-right">Consumed Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a4a]">
              {items.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-[#94a3b8]">
                    No custom items specified; standard BOM components configured.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-[#3b82f6]">{item.product?.sku || "—"}</td>
                    <td className="py-2.5 px-3 text-[#f1f5f9]">{item.product?.name || "—"}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-[#f1f5f9]">{item.plannedQuantity}</td>
                    <td className="py-2.5 px-3 text-right text-blue-400 font-medium">{item.issuedQuantity || 0}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-medium">{item.consumedQuantity || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Audit History Timeline */}
      <Card title="6. Production & Quality Lifecycle History" subtitle="Immutable state change log">
        {history.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#94a3b8]">No lifecycle events recorded yet.</div>
        ) : (
          <div className="space-y-3">
            {history.map((h, i) => (
              <div key={h.id || i} className="flex items-start gap-3 text-xs border-b border-[#1e2a4a] pb-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#f1f5f9]">{h.action}</span>
                    <span className="text-[11px] text-[#94a3b8]">{formatDateTime(h.createdAt)}</span>
                  </div>
                  <p className="text-[11px] text-[#94a3b8] mt-0.5">
                    User ID: {h.userId || "System"} · {h.ipAddress || "Internal"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Update Production Completion Modal */}
      <Modal
        isOpen={isCompletionModalOpen}
        onClose={() => !completionSubmitting && setIsCompletionModalOpen(false)}
        title="Update Production Completion"
        subtitle={`Manually record actual shop-floor completion for ${order.workOrderNo}`}
      >
        <form onSubmit={handleCompletionSubmit} className="space-y-4 text-xs">
          {completionError && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
              <span>{completionError}</span>
            </div>
          )}

          {/* Read-Only Work Order, Product Name & SKU Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium mb-1 text-[#94a3b8]">Work Order Number</label>
              <input
                type="text"
                readOnly
                value={order.workOrderNo}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#94a3b8] rounded-lg px-3 py-2 text-xs cursor-not-allowed font-mono select-none"
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-[#94a3b8]">Product Name</label>
              <input
                type="text"
                readOnly
                value={targetProductName}
                title={targetProductName}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#94a3b8] rounded-lg px-3 py-2 text-xs cursor-not-allowed truncate select-none"
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-[#94a3b8]">Product SKU</label>
              <input
                type="text"
                readOnly
                value={targetProductSku}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#3b82f6] font-mono rounded-lg px-3 py-2 text-xs cursor-not-allowed select-none"
              />
            </div>
          </div>

          {/* Read-Only Planned & Previously Completed Quantities */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1 text-[#94a3b8]">Planned Quantity</label>
              <input
                type="text"
                readOnly
                value={`${plannedQuantity} ${uom}`}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] font-semibold rounded-lg px-3 py-2 text-xs cursor-not-allowed select-none"
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-[#94a3b8]">Previously Completed Quantity</label>
              <input
                type="text"
                readOnly
                value={`${completedQuantity} ${uom}`}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-emerald-400 font-semibold rounded-lg px-3 py-2 text-xs cursor-not-allowed select-none"
              />
            </div>
          </div>

          {/* Current Pending Notice */}
          <div className="p-2.5 rounded-lg bg-[#0a1020] border border-[#1e2a4a] flex items-center justify-between text-xs">
            <span className="text-[#94a3b8]">Pending Quantity:</span>
            <span className="font-bold text-amber-400">{pendingQuantity} {uom}</span>
          </div>

          {/* Additional Completed Quantity */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-medium text-[#94a3b8]">
                Additional Completed Quantity <span className="text-rose-400">*</span>
              </label>
              <span className="text-[10px] text-[#64748b]">
                Max additional: <strong className="text-amber-400">{pendingQuantity} {uom}</strong>
              </span>
            </div>
            <input
              type="number"
              min={isWholeUnit(uom) ? "1" : "0.001"}
              max={pendingQuantity > 0 ? pendingQuantity : undefined}
              step={isWholeUnit(uom) ? "1" : "any"}
              required
              disabled={pendingQuantity <= 0 || completionSubmitting}
              value={completionForm.quantityNow}
              onChange={(e) => {
                setCompletionForm({ ...completionForm, quantityNow: e.target.value });
                if (completionError) setCompletionError("");
              }}
              placeholder={pendingQuantity > 0 ? `Enter additional completed quantity (${uom})...` : "Work order is already fully completed"}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#3b82f6] disabled:opacity-50"
            />
          </div>

          {/* Live Dynamic Preview if quantity entered */}
          {Number(completionForm.quantityNow) > 0 && (
            <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs space-y-1">
              <div className="flex justify-between text-[#94a3b8]">
                <span>Total Completed (Projected):</span>
                <span className="font-bold text-emerald-400">
                  {completedQuantity + Number(completionForm.quantityNow)} {uom}
                </span>
              </div>
              <div className="flex justify-between text-[#94a3b8]">
                <span>Pending Quantity (Projected):</span>
                <span className="font-bold text-amber-400">
                  {Math.max(0, plannedQuantity - (completedQuantity + Number(completionForm.quantityNow)))} {uom}
                </span>
              </div>
              <div className="flex justify-between text-[#94a3b8]">
                <span>Completion Percentage (Projected):</span>
                <span className="font-bold text-blue-400">
                  {plannedQuantity > 0
                    ? Math.min(100, Math.round(((completedQuantity + Number(completionForm.quantityNow)) / plannedQuantity) * 100))
                    : 0}%
                </span>
              </div>
            </div>
          )}

          {/* Completion Date */}
          <div>
            <label className="block font-medium mb-1 text-[#94a3b8]">
              Completion Date <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              required
              min={getTodayDateString()}
              disabled={completionSubmitting}
              value={completionForm.completionDate}
              onChange={(e) => {
                const val = e.target.value;
                setCompletionForm({ ...completionForm, completionDate: val });
                const err = validatePastDate(val, "Completion date");
                if (err) {
                  setCompletionError(err);
                } else if (completionError && completionError.includes("Past dates")) {
                  setCompletionError("");
                }
              }}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#3b82f6]"
            />
            {completionForm.completionDate && validatePastDate(completionForm.completionDate) && (
              <p className="text-[11px] text-rose-400 mt-1">
                Past dates are not allowed. Please select today or a future date.
              </p>
            )}
          </div>

          {/* Remarks */}
          <div>
            <label className="block font-medium mb-1 text-[#94a3b8]">Remarks (Optional)</label>
            <textarea
              rows="2"
              disabled={completionSubmitting}
              value={completionForm.remarks}
              onChange={(e) => setCompletionForm({ ...completionForm, remarks: e.target.value })}
              placeholder="Operator notes, shift details, machine or batch comments..."
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#3b82f6]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-[#1e2a4a]">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              disabled={completionSubmitting}
              onClick={() => setIsCompletionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={completionSubmitting}
              disabled={completionSubmitting || pendingQuantity <= 0 || !completionForm.quantityNow}
            >
              Save Completion
            </Button>
          </div>
        </form>
      </Modal>

      {/* Transfer to Quality Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Transfer Output to Quality Control"
        subtitle={`Route finished units to QC Inspection Bay for ${order.workOrderNo}`}
      >
        <form onSubmit={handleTransferToQuality} className="space-y-4 text-xs">
          {/* Production vs Transfer breakdown */}
          <div className="p-3 bg-[#0a1020] border border-[#1e2a4a] rounded-lg space-y-1.5 text-xs">
            <div className="flex justify-between text-[#94a3b8]">
              <span>Completed Good Production:</span>
              <strong className="text-[#f1f5f9]">{completedGood} units</strong>
            </div>
            <div className="flex justify-between text-[#94a3b8]">
              <span>Previously Transferred:</span>
              <strong className="text-amber-400">{previouslyTransferred} units</strong>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-[#1e2a4a] font-semibold">
              <span className="text-[#94a3b8]">Available for Transfer:</span>
              <strong className={availableForTransfer > 0 ? "text-emerald-400" : "text-red-400"}>
                {availableForTransfer} units
              </strong>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-medium text-[#94a3b8]">Transfer Quantity (Units)</label>
              {availableForTransfer > 0 && (
                <span className="text-[11px] text-emerald-400">
                  Max transferable: <strong>{availableForTransfer}</strong>
                </span>
              )}
            </div>
            <input
              type="number"
              min="1"
              max={availableForTransfer > 0 ? availableForTransfer : undefined}
              disabled={availableForTransfer <= 0}
              value={transferData.quantity}
              onChange={(e) => {
                const val = e.target.value;
                setTransferData({ ...transferData, quantity: val });
                if (Number(val) > availableForTransfer) {
                  setTransferError(`Only ${availableForTransfer} units remain available for QC transfer.`);
                } else if (Number(val) < 1 && val !== "") {
                  setTransferError("Transfer quantity must be at least 1 unit.");
                } else {
                  setTransferError("");
                }
              }}
              placeholder={availableForTransfer > 0 ? `Max ${availableForTransfer}` : "No units available"}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#3b82f6] disabled:opacity-50 disabled:cursor-not-allowed"
              required
            />
            {transferError && (
              <p className="mt-1 text-[11px] text-red-400 font-medium">{transferError}</p>
            )}
            {availableForTransfer <= 0 && (
              <p className="mt-1.5 text-[11px] text-amber-400">
                All completed good output has already been transferred to Quality Inspection. Record additional good production before transferring again.
              </p>
            )}
          </div>
          <div>
            <label className="block font-medium mb-1 text-[#94a3b8]">Batch / Handling Notes</label>
            <textarea
              rows="2"
              value={transferData.notes}
              onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
              placeholder="Enter the production transfer notes"
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#3b82f6]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#1e2a4a]">
            <Button variant="secondary" size="sm" onClick={() => setIsTransferModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={actionLoading}
              disabled={availableForTransfer <= 0 || Boolean(transferError) || !transferData.quantity}
            >
              Confirm Transfer
            </Button>
          </div>
        </form>
      </Modal>
      {order && (
        <QRLabelModal
          isOpen={isQRLabelModalOpen}
          onClose={() => setIsQRLabelModalOpen(false)}
          workOrderId={id}
          workOrderNo={order.workOrderNo}
          workOrder={order}
        />
      )}
    </div>
  );
}