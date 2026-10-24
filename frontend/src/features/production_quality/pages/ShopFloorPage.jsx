import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Play,
  Plus,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  Search,
  X,
  CheckCircle,
} from "lucide-react";
import ModuleHeader from "../components/shared/ModuleHeader";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import StatusBadge from "../../../components/common/StatusBadge";
import Loader from "../../../components/common/Loader";
import KpiSection from "../../../components/common/KpiSection";
import productionService from "../services/productionService";
import { formatDateTime } from "../utils/productionQualityHelpers";
import CustomDropdown from "../../../components/common/CustomDropdown";
import {
  getTodayDateString,
  validatePastDate,
  validateQuantityInput,
  isWholeUnit,
} from "../utils/formValidation";

export default function ShopFloorPage() {
  const [activeLines, setActiveLines] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Full Batch Transfer State
  const [fullBatchOrder, setFullBatchOrder] = useState(null);
  const [fullBatchSubmitting, setFullBatchSubmitting] = useState(false);
  const [fullBatchError, setFullBatchError] = useState("");
  const [transferSuccessMessage, setTransferSuccessMessage] = useState("");

  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isDowntimeModalOpen, setIsDowntimeModalOpen] = useState(false);
  const [isScrapModalOpen, setIsScrapModalOpen] = useState(false);

  // Production Entry Form
  const [entryData, setEntryData] = useState({
    workOrderId: "",
    quantityProduced: "",
    goodQuantity: "",
    rejectedQuantity: "",
    shift: "",
    operatorName: "",
    machineId: "",
    hoursWorked: "",
    notes: "",
  });

  // Transfer to Quality Form
  const [transferData, setTransferData] = useState({
    workOrderId: "",
    quantity: "",
    notes: "",
  });

  // Downtime form
  const [downtimeData, setDowntimeData] = useState({
    workOrderId: "",
    machineId: "",
    reason: "",
    durationMinutes: "",
  });

  // Scrap form
  const [scrapData, setScrapData] = useState({
    workOrderId: "",
    quantity: "",
    reason: "",
  });
  const [refData, setRefData] = useState({
    machines: [
      "Line A · Continuous Coating",
      "Line B · Automated Threading",
      "Line C · Finishing & Inspection",
      "Line D · Chemical Treatment",
      "M-01 CNC Lathe",
      "M-02 Thread Roller",
      "Furnace-01",
    ],
    users: [
      { id: 1, name: "System Administrator" },
      { id: 2, name: "Operator - Line A" },
      { id: 3, name: "Operator - Line B" },
    ],
  });

  useEffect(() => {
    async function fetchRef() {
      try {
        const res = await productionService.getReferenceData();
        const data = res?.data || res;
        if (data && (data.machines || data.users)) {
          setRefData((prev) => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error("Could not fetch ref data for shop floor:", err);
      }
    }
    fetchRef();
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const searchInputRef = useRef(null);

  // Production Completion Modal State
  const [completionOrder, setCompletionOrder] = useState(null);
  const [completionForm, setCompletionForm] = useState({
    quantityNow: "",
    completionDate: new Date().toISOString().split("T")[0],
    remarks: "",
  });
  const [completionSubmitting, setCompletionSubmitting] = useState(false);
  const [completionError, setCompletionError] = useState("");
  const [completionSuccess, setCompletionSuccess] = useState("");

  const openCompletionModal = (line) => {
    setCompletionOrder(line);
    setCompletionForm({
      quantityNow: "",
      completionDate: getTodayDateString(),
      remarks: "",
    });
    setCompletionError("");
  };

  const handleCompletionSubmit = async (e) => {
    e.preventDefault();
    if (!completionOrder) return;
    setCompletionError("");

    const dateErr = validatePastDate(completionForm.completionDate, "Completion date");
    if (dateErr) {
      setCompletionError(dateErr);
      return;
    }

    const pendingQty =
      completionOrder.pendingQty ??
      Math.max(0, completionOrder.targetQty - completionOrder.producedQty);

    const qtyErr = validateQuantityInput(completionForm.quantityNow, {
      uom: completionOrder.uom,
      max: pendingQty,
      allowZero: false,
      fieldName: "Quantity completed now",
    });
    if (qtyErr) {
      setCompletionError(qtyErr);
      return;
    }

    const qtyNow = Number(completionForm.quantityNow);

    if (
      completionOrder.isHold ||
      ["ON_HOLD", "QC_HOLD", "MATERIAL_HOLD"].includes(completionOrder.status)
    ) {
      setCompletionError(`Cannot update completion while work order is on hold. Resume the order first.`);
      return;
    }

    setCompletionSubmitting(true);
    setCompletionError("");
    try {
      await productionService.recordProductionCompletion(completionOrder.workOrderId, {
        quantityCompleted: qtyNow,
        quantityProduced: qtyNow,
        completionDate: completionForm.completionDate,
        remarks: completionForm.remarks,
        notes: completionForm.remarks,
      });

      setCompletionOrder(null);
      setCompletionSuccess(
        `Successfully recorded ${qtyNow} ${completionOrder.uom} production completion for Work Order #${completionOrder.workOrderNo}!`
      );
      setTimeout(() => setCompletionSuccess(""), 5000);
      await loadDashboard();
    } catch (err) {
      setCompletionError(err?.response?.data?.message || err?.message || "Failed to save production completion.");
    } finally {
      setCompletionSubmitting(false);
    }
  };

  const runningLines = activeLines.filter((line) => line.status === "IN_PROGRESS");
  const readyForQualityList = activeLines.filter((line) => line.isReadyForQC);
  const selectedTransferLine = activeLines.find(
    (line) => String(line.workOrderId) === String(transferData.workOrderId)
  );

  const statusCounts = useMemo(() => {
    return {
      ALL: activeLines.length,
      READY_FOR_QC: activeLines.filter((l) => l.isReadyForQC).length,
      IN_PROGRESS: activeLines.filter(
        (l) => (l.effectiveStatus === "IN_PROGRESS" || l.status === "IN_PROGRESS") && !l.isHold && !l.isCompleted && !l.isReadyForQC
      ).length,
      RELEASED: activeLines.filter(
        (l) => (l.effectiveStatus === "RELEASED" || l.status === "RELEASED" || l.effectiveStatus === "PLANNED") && !l.isHold && !l.isCompleted
      ).length,
      ON_HOLD: activeLines.filter(
        (l) => l.isHold || ["ON_HOLD", "QC_HOLD", "MATERIAL_HOLD"].includes(l.status) || l.effectiveStatus === "ON_HOLD"
      ).length,
      COMPLETED: activeLines.filter(
        (l) => l.isCompleted || l.effectiveStatus === "COMPLETED" || l.status === "COMPLETED" || (l.targetQty > 0 && l.producedQty >= l.targetQty)
      ).length,
      INTERRUPTED: activeLines.filter((l) => l.isInterrupted).length,
    };
  }, [activeLines]);

  const filteredLines = useMemo(() => {
    const list = activeLines.filter((line) => {
      if (statusFilter === "READY_FOR_QC") {
        if (!line.isReadyForQC) return false;
      } else if (statusFilter === "ON_HOLD") {
        const isHoldOrder = line.isHold || ["ON_HOLD", "QC_HOLD", "MATERIAL_HOLD"].includes(line.status) || line.effectiveStatus === "ON_HOLD";
        if (!isHoldOrder) return false;
      } else if (statusFilter === "COMPLETED") {
        const isCompl = line.isCompleted || line.effectiveStatus === "COMPLETED" || line.status === "COMPLETED" || (line.targetQty > 0 && line.producedQty >= line.targetQty);
        if (!isCompl) return false;
      } else if (statusFilter === "IN_PROGRESS") {
        if (line.isHold) return false;
        if (line.isCompleted || (line.targetQty > 0 && line.producedQty >= line.targetQty)) return false;
        if (line.effectiveStatus !== "IN_PROGRESS" && line.status !== "IN_PROGRESS") return false;
      } else if (statusFilter === "RELEASED") {
        if (line.isHold) return false;
        if (line.isCompleted) return false;
        if (line.effectiveStatus !== "RELEASED" && line.status !== "RELEASED" && line.effectiveStatus !== "PLANNED") return false;
      } else if (statusFilter === "INTERRUPTED") {
        if (!line.isInterrupted) return false;
      } else if (statusFilter !== "ALL" && line.status !== statusFilter && line.effectiveStatus !== statusFilter) {
        return false;
      }

      if (!searchTerm.trim()) {
        return true;
      }
      const q = searchTerm.toLowerCase().trim();
      const matchWo = (line.workOrderNo || "").toLowerCase().includes(q);
      const matchStation = (line.station || "").toLowerCase().includes(q);
      const matchProduct = (line.product || "").toLowerCase().includes(q);
      const matchSku = (line.productSku || "").toLowerCase().includes(q);
      const matchOperator = (line.operator || "").toLowerCase().includes(q);
      const matchMachine = (line.machine || "").toLowerCase().includes(q);
      const matchShift = (line.shift || "").toLowerCase().includes(q);
      const matchId = String(line.id || "").toLowerCase().includes(q);
      const matchStatus = (line.status || "").toLowerCase().includes(q);

      return (
        matchWo ||
        matchStation ||
        matchProduct ||
        matchSku ||
        matchOperator ||
        matchMachine ||
        matchShift ||
        matchId ||
        matchStatus
      );
    });

    // Ensure strict sorting priority is maintained:
    // 1. Ready for Quality Inspection (oldest completion date first)
    // 2. In Production
    // 3. Not Started
    // 4. Transferred to Quality
    return [...list].sort((a, b) => {
      const tierA = a.priorityTier ?? (a.isReadyForQC ? 1 : 2);
      const tierB = b.priorityTier ?? (b.isReadyForQC ? 1 : 2);
      if (tierA !== tierB) {
        return tierA - tierB;
      }
      if (tierA === 1) {
        const dateA = new Date(a.completionDate || 0).getTime();
        const dateB = new Date(b.completionDate || 0).getTime();
        return dateA - dateB;
      }
      return 0;
    });
  }, [activeLines, searchTerm, statusFilter]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productionService.getManufacturingDashboard();
      const data = res?.data || {};
      setMetrics(data.metrics || null);
      const orders = data.activeWorkOrders || [];

      if (orders.length > 0) {
        const mappedLines = orders.map((wo) => {
          const producedQty = Number(wo.goodQuantity || 0);
          const targetQty = Number(wo.plannedQuantity || 0);
          const transferredQty = Number(
            wo.transferredQuantity ??
              (wo.inspections?.reduce((s, i) => s + Number(i.inspectedQuantity || 0), 0) || 0)
          );
          const availableForTransfer = Number(
            wo.availableForTransfer ?? Math.max(0, producedQty - transferredQty)
          );
          const pendingQty = Number(wo.pendingQuantity ?? Math.max(0, targetQty - producedQty));
          const completionPct = Number(
            wo.completionPercentage ??
              (targetQty > 0 ? Math.min(100, Math.round((producedQty / targetQty) * 100)) : 0)
          );
          const isReadyForQC = Boolean(wo.isReadyForQC);
          const completionDate = wo.completionDate || wo.actualEnd || wo.updatedAt || wo.createdAt;
          const isHold = Boolean(wo.isHold || ["MATERIAL_HOLD", "QC_HOLD", "ON_HOLD"].includes(wo.status));
          const isCompleted = Boolean(wo.isCompleted || (targetQty > 0 && producedQty >= targetQty));

          return {
            id: wo.workOrderNo || String(wo.id),
            workOrderId: wo.id,
            station: wo.station || wo.assignedLine || "Unassigned",
            workOrderNo: wo.workOrderNo,
            product: wo.productName || wo.bomRevision?.product?.name || wo.product || "Standard Product",
            productSku: wo.productSku || wo.bomRevision?.product?.sku || "—",
            uom: wo.uom || "NOS",
            shift: wo.shift || "Not assigned",
            operator: wo.operatorName || "Not assigned",
            targetQty,
            producedQty,
            pendingQty,
            scrapQty: Number(wo.rejectedQuantity || 0),
            transferredQty,
            availableForTransfer,
            completionPct,
            isReadyForQC,
            isHold,
            holdType: wo.holdType || (isHold ? wo.status : null),
            isInterrupted: Boolean(wo.isInterrupted),
            downtimes: wo.downtimes || [],
            latestDowntime: wo.latestDowntime || null,
            isCompleted,
            completionDate,
            priorityTier: wo.priorityTier || (isReadyForQC ? 1 : 2),
            priorityTierLabel: wo.priorityTierLabel || (isReadyForQC ? "Ready for Quality Inspection" : "In Production"),
            status: wo.status,
            effectiveStatus: wo.effectiveStatus || wo.status,
            rawStatus: wo.rawStatus || wo.status,
            machine: wo.machineId || "",
          };
        });
        setActiveLines(mappedLines);

        // Pre-select first work order in forms
        const firstRunningOrder = orders.find((order) => order.status === "IN_PROGRESS");
        if (firstRunningOrder) {
          setEntryData((prev) => ({ ...prev, workOrderId: firstRunningOrder.id }));
          const firstAvail = firstRunningOrder.availableForTransfer ?? 0;
          setTransferData((prev) => ({
            ...prev,
            workOrderId: firstRunningOrder.id,
            quantity: firstAvail > 0 ? firstAvail : "",
          }));
          setDowntimeData((prev) => ({ ...prev, workOrderId: firstRunningOrder.id }));
          setScrapData((prev) => ({ ...prev, workOrderId: firstRunningOrder.id }));
        }
      } else {
        setActiveLines([]);
      }
    } catch (err) {
      console.error("Failed to load manufacturing dashboard:", err);
      setError(err?.message || "Failed to load active shop floor operations.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFullBatchTransferConfirm = async () => {
    if (!fullBatchOrder) return;
    setFullBatchSubmitting(true);
    setFullBatchError("");
    try {
      await productionService.transferToQuality(fullBatchOrder.workOrderId, {
        quantity: fullBatchOrder.targetQty,
        notes: `Full batch transfer for ${fullBatchOrder.workOrderNo} to Quality Inspection`,
      });
      const woNo = fullBatchOrder.workOrderNo;
      setFullBatchOrder(null);
      setTransferSuccessMessage(
        `Full production batch for ${woNo} has been successfully transferred to Quality Inspection!`
      );
      setTimeout(() => setTransferSuccessMessage(""), 6000);
      await loadDashboard();
    } catch (err) {
      setFullBatchError(
        err?.response?.data?.message || err?.message || "Failed to transfer batch to Quality Inspection."
      );
    } finally {
      setFullBatchSubmitting(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleEntrySubmit = async (e) => {
    e.preventDefault();
    setActionError("");

    if (!entryData.workOrderId) {
      setActionError("Please select a target Work Order.");
      return;
    }

    const prodErr = validateQuantityInput(entryData.quantityProduced, {
      uom: "NOS",
      allowZero: false,
      fieldName: "Quantity produced",
    });
    if (prodErr) {
      setActionError(prodErr);
      return;
    }

    const goodErr = validateQuantityInput(entryData.goodQuantity, {
      uom: "NOS",
      allowZero: true,
      fieldName: "Good quantity",
    });
    if (goodErr) {
      setActionError(goodErr);
      return;
    }

    const rejErr = validateQuantityInput(entryData.rejectedQuantity, {
      uom: "NOS",
      allowZero: true,
      fieldName: "Rejected quantity",
    });
    if (rejErr) {
      setActionError(rejErr);
      return;
    }

    const totalProd = Number(entryData.quantityProduced);
    const goodQty = Number(entryData.goodQuantity);
    const rejQty = Number(entryData.rejectedQuantity);
    if (goodQty + rejQty !== totalProd) {
      setActionError(`Good quantity (${goodQty}) + Rejected quantity (${rejQty}) must equal Total Produced (${totalProd}).`);
      return;
    }

    setSubmitting(true);
    try {
      await productionService.recordProductionEntry({
        ...entryData,
        workOrderId: parseInt(entryData.workOrderId, 10),
        quantityProduced: parseFloat(entryData.quantityProduced),
        goodQuantity: parseFloat(entryData.goodQuantity),
        rejectedQuantity: parseFloat(entryData.rejectedQuantity),
      });
      setIsEntryModalOpen(false);
      await loadDashboard();
    } catch (err) {
      setActionError(err?.message || "Failed to log production output.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setActionError("");

    const qty = parseFloat(transferData.quantity);

    if (isNaN(qty) || qty <= 0) {
      setActionError("Please enter a valid positive quantity to transfer.");
      return;
    }

    if (selectedTransferLine && qty > selectedTransferLine.availableForTransfer) {
      setActionError(
        `Only ${selectedTransferLine.availableForTransfer} units remain available for QA. Reduce the transfer quantity or record more good production first.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const dashboardResponse = await productionService.getManufacturingDashboard();
      const latestOrders = dashboardResponse?.data?.activeWorkOrders || [];
      const latestOrder = latestOrders.find(
        (order) => String(order.id) === String(transferData.workOrderId)
      );

      if (!latestOrder) {
        setActionError("This work order is no longer available for transfer. Refresh the shop-floor list and try again.");
        return;
      }

      if (!["IN_PROGRESS", "RELEASED"].includes(latestOrder.status)) {
        setActionError(
          `This work order is ${latestOrder.status} and cannot be transferred to QA.`
        );
        return;
      }

      const availableNow = Number(
        latestOrder.availableForTransfer ??
          Math.max(
            0,
            Number(latestOrder.goodQuantity || 0) -
              (latestOrder.inspections || []).reduce(
                (sum, inspection) => sum + Number(inspection.inspectedQuantity || 0),
                0
              )
          )
      );
      if (qty > availableNow) {
        setActionError(
          `Only ${availableNow} units are currently available for QA. Refresh production output or reduce the transfer quantity.`
        );
        return;
      }

      await productionService.transferToQuality(transferData.workOrderId, {
        quantity: qty,
        notes: transferData.notes,
      });
      setIsTransferModalOpen(false);
      await loadDashboard();
    } catch (err) {
      setActionError(err?.message || "Failed to transfer batch to Quality.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDowntimeSubmit = async (e) => {
    e.preventDefault();
    setActionError("");

    if (!downtimeData.workOrderId) {
      setActionError("Please select a target Work Order.");
      return;
    }

    const durationNum = Number(downtimeData.durationMinutes);
    if (!durationNum || isNaN(durationNum) || durationNum <= 0) {
      setActionError("Downtime duration must be a positive number of minutes.");
      return;
    }

    if (!downtimeData.machineOrWorkCenter?.trim()) {
      setActionError("Please specify the Machine or Work Center identifier.");
      return;
    }

    if (!downtimeData.reason?.trim()) {
      setActionError("Please enter the reason for downtime.");
      return;
    }

    setSubmitting(true);
    try {
      await productionService.recordDowntime({
        ...downtimeData,
        workOrderId: parseInt(downtimeData.workOrderId, 10),
        durationMinutes: parseInt(downtimeData.durationMinutes, 10),
      });
      setIsDowntimeModalOpen(false);
      await loadDashboard();
    } catch (err) {
      setActionError(err?.message || "Failed to log machine downtime.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleScrapSubmit = async (e) => {
    e.preventDefault();
    setActionError("");

    if (!scrapData.workOrderId) {
      setActionError("Please select a target Work Order.");
      return;
    }

    const scrapQtyErr = validateQuantityInput(scrapData.quantity, {
      uom: "NOS",
      allowZero: false,
      fieldName: "Scrap quantity",
    });
    if (scrapQtyErr) {
      setActionError(scrapQtyErr);
      return;
    }

    if (!scrapData.reason?.trim() || scrapData.reason.trim().length < 3) {
      setActionError("Please enter a valid reason for scrap (minimum 3 characters).");
      return;
    }

    setSubmitting(true);
    try {
      await productionService.recordScrap({
        ...scrapData,
        workOrderId: parseInt(scrapData.workOrderId, 10),
        quantity: parseFloat(scrapData.quantity),
      });
      setIsScrapModalOpen(false);
      await loadDashboard();
    } catch (err) {
      setActionError(err?.message || "Failed to record scrap quantity.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Shop-Floor Execution & Line Operations (M4.2)"
        subtitle="Live tracking of copper bonding, threading, packing, operator machine hours, output entries, and QA handoffs."
        breadcrumbs={[
          { label: "Production & Quality", to: "/production-quality/planning" },
          { label: "Manufacturing" },
        ]}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={Search}
              onClick={() => {
                searchInputRef.current?.focus();
                searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            >
              Search
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Clock}
              disabled={runningLines.length === 0}
              onClick={() => setIsDowntimeModalOpen(true)}
            >
              Log Downtime
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={AlertTriangle}
              disabled={runningLines.length === 0}
              onClick={() => setIsScrapModalOpen(true)}
            >
              Log Scrap
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Plus}
              disabled={runningLines.length === 0}
              onClick={() => setIsEntryModalOpen(true)}
            >
              Log Run
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle}
              disabled={activeLines.filter((l) => !l.isHold && !l.isCompleted).length === 0}
              onClick={() => {
                const target = activeLines.find((l) => l.status === "IN_PROGRESS" && !l.isCompleted) || activeLines.find((l) => !l.isHold && !l.isCompleted);
                if (target) openCompletionModal(target);
              }}
            >
              Update Completion
            </Button>
          </div>
        }
      />

      {/* Error Alert with Retry */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadDashboard}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-semibold cursor-pointer transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Live Metrics Overview */}
      {metrics && (
        <KpiSection title="Shop-Floor Live Metrics">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card
              className={`border-l-4 border-l-blue-500 cursor-pointer transition hover:bg-slate-800/40 ${statusFilter === "ALL" ? "ring-1 ring-blue-500" : ""}`}
              onClick={() => setStatusFilter("ALL")}
            >
              <p className="text-xs text-[#94a3b8] font-medium">Assigned / Active</p>
              <h3 className="text-xl font-bold text-[#f1f5f9] mt-1">{metrics.activeWorkOrdersCount ?? activeLines.length}</h3>
            </Card>
            <Card
              className={`border-l-4 border-l-amber-500 cursor-pointer transition hover:bg-slate-800/40 ${statusFilter === "IN_PROGRESS" ? "ring-1 ring-amber-500" : ""}`}
              onClick={() => setStatusFilter("IN_PROGRESS")}
            >
              <p className="text-xs text-[#94a3b8] font-medium">In Production</p>
              <h3 className="text-xl font-bold text-[#f1f5f9] mt-1">{metrics.inProgressCount ?? 0}</h3>
            </Card>
            <Card
              className={`border-l-4 border-l-slate-500 cursor-pointer transition hover:bg-slate-800/40 ${statusFilter === "RELEASED" ? "ring-1 ring-slate-400" : ""}`}
              onClick={() => setStatusFilter("RELEASED")}
            >
              <p className="text-xs text-[#94a3b8] font-medium">Released / Ready</p>
              <h3 className="text-xl font-bold text-[#f1f5f9] mt-1">{metrics.readyToStartCount ?? 0}</h3>
            </Card>
            <Card
              className={`border-l-4 border-l-rose-500 cursor-pointer transition hover:bg-slate-800/40 ${statusFilter === "ON_HOLD" ? "ring-1 ring-rose-500" : ""}`}
              onClick={() => setStatusFilter("ON_HOLD")}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#94a3b8] font-medium">On Hold</p>
                {metrics.interruptedCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30" title={`${metrics.interruptedCount} operation(s) logged machine downtime or delay`}>
                    {metrics.interruptedCount} Interrupted
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-rose-400 mt-1">{metrics.onHoldCount ?? 0}</h3>
            </Card>
            <Card
              className={`border-l-4 border-l-emerald-500 cursor-pointer transition hover:bg-slate-800/40 ${statusFilter === "COMPLETED" ? "ring-1 ring-emerald-500" : ""}`}
              onClick={() => setStatusFilter("COMPLETED")}
            >
              <p className="text-xs text-[#94a3b8] font-medium">Completed</p>
              <h3 className="text-xl font-bold text-emerald-400 mt-1">{metrics.completedCount ?? 0}</h3>
            </Card>
            <Card
              className={`border-l-4 border-l-cyan-500 cursor-pointer transition hover:bg-slate-800/40 ${statusFilter === "READY_FOR_QC" ? "ring-1 ring-cyan-500" : ""}`}
              onClick={() => setStatusFilter("READY_FOR_QC")}
            >
              <p className="text-xs text-[#94a3b8] font-medium flex items-center justify-between">
                <span>Ready for QC</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              </p>
              <h3 className="text-xl font-bold text-cyan-400 mt-1">{metrics.readyForQualityCount ?? readyForQualityList.length}</h3>
            </Card>
          </div>
        </KpiSection>
      )}

      {/* Completion Success Notification */}
      {completionSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-300 font-semibold shadow-xs">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{completionSuccess}</span>
        </div>
      )}

      {/* Transfer Success Notification */}
      {transferSuccessMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-300 font-semibold shadow-xs">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{transferSuccessMessage}</span>
        </div>
      )}

      {/* Section: Ready for Quality Inspection */}
      <div className="bg-[#10182f] border border-emerald-500/30 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1e2a4a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#f1f5f9]">Ready for Quality Inspection</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {readyForQualityList.length} {readyForQualityList.length === 1 ? "BATCH READY" : "BATCHES READY"}
                </span>
              </div>
              <p className="text-xs text-[#94a3b8]">
                100% completed production batches awaiting handoff to Quality Control bay
              </p>
            </div>
          </div>
          {readyForQualityList.length > 0 && (
            <span className="text-xs text-[#64748b]">
              Prioritized by oldest completion date (FIFO)
            </span>
          )}
        </div>

        {readyForQualityList.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#94a3b8] bg-[#0a1020]/60 border border-[#1e2a4a] rounded-xl flex flex-col items-center justify-center gap-2">
            <ShieldCheck className="w-8 h-8 text-emerald-500/40" />
            <p className="font-semibold text-[#f1f5f9]">
              No fully completed production batches are waiting for Quality Inspection.
            </p>
            <p className="text-[11px] text-[#64748b] max-w-md">
              When work orders reach 100% good production, they will automatically appear here for immediate full-batch transfer.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {readyForQualityList.map((line) => (
              <div
                key={`ready-qc-${line.id}`}
                className="bg-[#0a1020] border border-emerald-500/30 rounded-xl p-4 flex flex-col justify-between space-y-3.5 relative overflow-hidden"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      READY FOR QC
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      100% Complete
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#94a3b8]">Work Order:</span>
                      <Link
                        to={`/production-quality/work-orders/${line.workOrderId}`}
                        className="font-mono font-bold text-blue-400 hover:underline"
                        title="View Work Order details"
                      >
                        {line.workOrderNo}
                      </Link>
                    </div>
                    <p className="text-sm font-bold text-[#f1f5f9] truncate mt-1" title={line.product}>
                      {line.product}
                    </p>
                    <div className="flex items-center justify-between text-[11px] mt-0.5">
                      <span className="text-[#94a3b8]">SKU:</span>
                      <span className="font-mono text-[#3b82f6]">{line.productSku}</span>
                    </div>
                  </div>

                  {/* Quantity Breakdown */}
                  <div className="p-2.5 rounded-lg bg-[#10182f] border border-[#1e2a4a] space-y-1.5 text-xs">
                    <div className="flex justify-between text-[#94a3b8]">
                      <span>Planned Quantity:</span>
                      <span className="font-semibold text-[#f1f5f9]">{line.targetQty} {line.uom}</span>
                    </div>
                    <div className="flex justify-between text-[#94a3b8]">
                      <span>Completed Good Qty:</span>
                      <span className="font-bold text-emerald-400">{line.producedQty} {line.uom}</span>
                    </div>
                    <div className="flex justify-between text-[#94a3b8]">
                      <span>Pending Quantity:</span>
                      <span className="font-bold text-amber-400">{line.pendingQty} {line.uom}</span>
                    </div>
                    <div className="flex justify-between text-[#94a3b8]">
                      <span>Completion:</span>
                      <span className="font-bold text-emerald-400">{line.completionPct}%</span>
                    </div>
                    <div className="flex justify-between text-[#94a3b8] pt-1 border-t border-[#1e2a4a]/60">
                      <span>Completed Date:</span>
                      <span className="text-[#cbd5e1] font-medium">{formatDateTime(line.completionDate)}</span>
                    </div>
                    <div className="flex justify-between text-[#94a3b8]">
                      <span>Transfer Status:</span>
                      <span className="text-blue-400 font-medium">Ready for Transfer</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  icon={ShieldCheck}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                  onClick={() => {
                    setFullBatchOrder(line);
                    setFullBatchError("");
                  }}
                >
                  Transfer Full Batch to Quality
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-4 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            searchInputRef.current?.focus();
          }}
          className="flex items-center gap-2 flex-1 w-full md:max-w-md"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by WO#, Station, Product, Machine, Operator..."
              className="w-full bg-[#0a1020] text-[#f1f5f9] placeholder-[#64748b] text-xs pl-9 pr-8 py-2 rounded-xl border border-[#1e2a4a] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition shadow-inner"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#f1f5f9] p-0.5 rounded-full hover:bg-slate-800/40 transition cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            icon={Search}
            className="shrink-0"
          >
            Search
          </Button>
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
          {[
            { id: "ALL", label: "All" },
            { id: "READY_FOR_QC", label: "Ready for QC" },
            { id: "IN_PROGRESS", label: "In Production" },
            { id: "RELEASED", label: "Released" },
            { id: "ON_HOLD", label: "On Hold" },
            { id: "COMPLETED", label: "Completed" },
            ...(statusCounts.INTERRUPTED > 0 ? [{ id: "INTERRUPTED", label: "Interrupted" }] : []),
          ].map((tab) => {
            const count = statusCounts[tab.id] ?? 0;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? "bg-[#3b82f6] text-white shadow-xs"
                    : "bg-[#0a1020] text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-slate-800/40 border border-[#1e2a4a]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    statusFilter === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-slate-800 text-[#64748b]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
          {(searchTerm || statusFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 transition cursor-pointer flex items-center gap-1"
              title="Reset search and filters"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter matching summary */}
      {(searchTerm || statusFilter !== "ALL") && !loading && activeLines.length > 0 && (
        <div className="flex items-center justify-between text-xs text-[#94a3b8] px-1">
          <span>
            Showing <strong className="text-[#f1f5f9]">{filteredLines.length}</strong> of <strong className="text-[#f1f5f9]">{activeLines.length}</strong> shop-floor operations
            {searchTerm && (
              <span> matching &ldquo;<span className="text-[#3b82f6] font-medium">{searchTerm}</span>&rdquo;</span>
            )}
          </span>
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("ALL");
            }}
            className="text-xs text-[#3b82f6] hover:underline cursor-pointer font-medium"
          >
            Clear filters
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center">
          <Loader label="Loading shop-floor operations from database..." size="lg" />
        </div>
      ) : activeLines.length === 0 ? (
        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-12 text-center text-xs text-[#94a3b8]">
          No work orders are assigned to shop-floor lines.
        </div>
      ) : filteredLines.length === 0 ? (
        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-12 text-center text-xs text-[#94a3b8] space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-[#64748b]">
            <Search className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-[#f1f5f9]">No matching shop-floor operations found</p>
          <p className="text-xs text-[#64748b] max-w-md mx-auto">
            No active lines or work orders matched your criteria{searchTerm ? ` "${searchTerm}"` : ""}. Try adjusting your search query or reset filters.
          </p>
          <div className="pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
                searchInputRef.current?.focus();
              }}
            >
              Clear Search & Filters
            </Button>
          </div>
        </div>
      ) : (
        /* Live Manufacturing Stations Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {filteredLines.map((line) => {
            const progressPct = line.targetQty > 0
              ? Math.min(100, Math.round((line.producedQty / line.targetQty) * 100))
              : 0;
            return (
              <Card key={line.id} className="relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
                      {line.id} · {line.shift}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {line.isReadyForQC && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> READY FOR QC
                        </span>
                      )}
                      {line.isInterrupted && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30" title="Shop-floor operation experienced machine downtime or delay">
                          INTERRUPTED
                        </span>
                      )}
                      <StatusBadge status={line.isHold ? (line.holdType || "ON_HOLD") : line.status} />
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-[#f1f5f9] mb-1">{line.station}</h3>
                  <p className="text-xs text-[#94a3b8] line-clamp-1 mb-3">{line.product}</p>

                  <div className="p-2.5 rounded-xl bg-[#0a1020] border border-[#1e2a4a] space-y-2 mb-4 text-xs">
                    <div className="flex justify-between text-[#94a3b8]">
                      <span>Work Order:</span>
                      <Link
                        to={`/production-quality/work-orders/${line.workOrderId}`}
                        className="font-mono font-semibold text-[#3b82f6] hover:underline"
                        title="View Work Order specifications"
                      >
                        {line.workOrderNo}
                      </Link>
                    </div>
                    {line.productSku && line.productSku !== "—" && (
                      <div className="flex justify-between text-[#94a3b8]">
                        <span>SKU:</span>
                        <span className="font-mono text-[#cbd5e1]">{line.productSku}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[#94a3b8]">
                      <span>Machine:</span>
                      <span className="font-medium text-[#f1f5f9]">{line.machine || "—"}</span>
                    </div>
                    <div className="flex justify-between text-[#94a3b8]">
                      <span>Operator:</span>
                      <span className="font-medium text-[#f1f5f9]">{line.operator || "—"}</span>
                    </div>
                    <div className="flex justify-between text-[#94a3b8]">
                      <span>Planned / Good:</span>
                      <span className="font-medium text-[#f1f5f9]">{line.targetQty} / <strong className="text-emerald-400">{line.producedQty} {line.uom}</strong></span>
                    </div>
                    <div className="flex justify-between text-[#94a3b8]">
                      <span>Pending:</span>
                      <span className="font-medium text-amber-400">{line.pendingQty} {line.uom}</span>
                    </div>
                    <div className="flex justify-between text-[#94a3b8]">
                      <span>Scrap Logged:</span>
                      <span className="font-semibold text-red-400">{line.scrapQty} units</span>
                    </div>
                    <div className="flex justify-between text-[#94a3b8]">
                      <span>Available for QA:</span>
                      <span className={`font-semibold ${line.availableForTransfer > 0 ? "text-emerald-400" : "text-[#64748b]"}`}>
                        {line.availableForTransfer} {line.uom}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[#94a3b8]">Completion</span>
                      <span className={progressPct === 100 ? "text-emerald-400 font-bold" : "text-[#3b82f6]"}>
                        {progressPct === 100 ? "100% Complete" : `${progressPct}% (${line.producedQty} / ${line.targetQty})`}
                      </span>
                    </div>
                    <div className="w-full bg-[#0a1020] border border-[#1e2a4a] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          progressPct === 100 ? "bg-emerald-500" : "bg-[#3b82f6]"
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {line.isReadyForQC ? (
                  <div className="pt-2 border-t border-[#1e2a4a]">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                      icon={ShieldCheck}
                      onClick={() => {
                        setFullBatchOrder(line);
                        setFullBatchError("");
                      }}
                    >
                      Transfer Full Batch to Quality
                    </Button>
                  </div>
                ) : line.isHold ? (
                  <div className="pt-3 border-t border-[#1e2a4a] text-xs space-y-1.5">
                    <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Work Order on hold ({line.holdType || "Hold"}). Resume order before updating production.</span>
                    </div>
                  </div>
                ) : line.isCompleted ? (
                  <div className="pt-3 border-t border-[#1e2a4a] flex items-center justify-between text-xs">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> 100% Production Completed
                    </span>
                    <Link
                      to={`/production-quality/work-orders/${line.workOrderId}`}
                      className="text-xs text-[#3b82f6] hover:underline font-semibold"
                    >
                      View Work Order &rarr;
                    </Link>
                  </div>
                ) : line.pendingQty > 0 ? (
                  <div className="flex items-center gap-2 pt-2 border-t border-[#1e2a4a]">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white"
                      icon={CheckCircle}
                      onClick={() => openCompletionModal(line)}
                    >
                      Update Completion
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      icon={Play}
                      onClick={() => {
                        setEntryData((prev) => ({ ...prev, workOrderId: line.workOrderId }));
                        setIsEntryModalOpen(true);
                      }}
                    >
                      Log Run
                    </Button>
                  </div>
                ) : line.priorityTier === 4 || line.transferredQty > 0 ? (
                  <div className="pt-3 border-t border-[#1e2a4a] flex items-center justify-between text-xs">
                    <span className="text-[#94a3b8]">Status:</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Transferred to Quality
                    </span>
                  </div>
                ) : (
                  <p className="pt-3 border-t border-[#1e2a4a] text-xs text-[#94a3b8]">
                    Production actions are available once this work order is in progress.
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Production Operation Logs */}
      <Card
        title="Active Shop-Floor Logbook"
        subtitle={`Daily shifts, machine utilization, and active batch progress (${filteredLines.length} shown)`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0b1329] text-[#94a3b8] uppercase font-semibold border-b border-[#1e2a4a]">
              <tr>
                <th className="py-2.5 px-3">Work Order</th>
                <th className="py-2.5 px-3">Station / BOM</th>
                <th className="py-2.5 px-3">Shift</th>
                <th className="py-2.5 px-3 text-right">Target Qty</th>
                <th className="py-2.5 px-3 text-right">Good Qty</th>
                <th className="py-2.5 px-3 text-right">Scrap Qty</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a4a]">
              {filteredLines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#94a3b8]">
                    No operations match the current search query or filter.
                  </td>
                </tr>
              ) : (
                filteredLines.map((line) => (
                  <tr key={line.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-semibold text-[#3b82f6]">{line.workOrderNo}</td>
                    <td className="py-2.5 px-3 font-medium text-[#f1f5f9]">{line.station}</td>
                    <td className="py-2.5 px-3 text-[#94a3b8]">{line.shift}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#f1f5f9]">{line.targetQty}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">{line.producedQty}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-red-400">{line.scrapQty}</td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={line.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Full Batch Quality Transfer Confirmation */}
      <Modal
        isOpen={Boolean(fullBatchOrder)}
        onClose={() => !fullBatchSubmitting && setFullBatchOrder(null)}
        title="Transfer Full Batch to Quality Inspection"
        subtitle={`Confirm full-batch transfer for Work Order #${fullBatchOrder?.workOrderNo}`}
      >
        {fullBatchOrder && (
          <div className="space-y-4 text-xs">
            {fullBatchError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{fullBatchError}</span>
              </div>
            )}

            {/* Read-Only Batch Details */}
            <div className="p-3.5 bg-[#0a1020] border border-[#1e2a4a] rounded-xl space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#1e2a4a]">
                <span className="text-[#94a3b8]">Work Order Number:</span>
                <span className="font-mono font-bold text-[#f1f5f9]">{fullBatchOrder.workOrderNo}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1e2a4a]">
                <span className="text-[#94a3b8]">Product Name:</span>
                <span className="font-semibold text-[#f1f5f9] truncate max-w-[240px] text-right" title={fullBatchOrder.product}>
                  {fullBatchOrder.product}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1e2a4a]">
                <span className="text-[#94a3b8]">Planned Quantity:</span>
                <span className="font-semibold text-[#f1f5f9]">{fullBatchOrder.targetQty} {fullBatchOrder.uom}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1e2a4a]">
                <span className="text-[#94a3b8]">Completed Good Quantity:</span>
                <span className="font-bold text-emerald-400">{fullBatchOrder.producedQty} {fullBatchOrder.uom}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1e2a4a]">
                <span className="text-[#94a3b8]">Previously Transferred:</span>
                <span className="font-semibold text-[#cbd5e1]">{fullBatchOrder.transferredQty || 0} {fullBatchOrder.uom}</span>
              </div>
              <div className="flex justify-between py-1.5 pt-2 border-t border-[#1e2a4a] text-sm">
                <span className="font-bold text-[#94a3b8]">Quantity Being Transferred:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {fullBatchOrder.targetQty} {fullBatchOrder.uom}
                </span>
              </div>
            </div>

            {/* Confirmation Banner */}
            <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-xl text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#f1f5f9] text-xs">
                  Production is 100% complete. You are about to transfer the entire batch to Quality Inspection. Do you want to continue?
                </p>
                <p className="text-[11px] text-[#94a3b8] mt-1">
                  This action transfers the entire planned batch of {fullBatchOrder.targetQty} {fullBatchOrder.uom} into the Quality Control queue for inspection and prevents partial or duplicate transfers.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#1e2a4a]">
              <Button
                variant="outline"
                size="sm"
                disabled={fullBatchSubmitting}
                onClick={() => setFullBatchOrder(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={fullBatchSubmitting}
                icon={ShieldCheck}
                onClick={handleFullBatchTransferConfirm}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Confirm Transfer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Log Output Entry */}
      <Modal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        title="Record Daily Production Output"
        size="md"
      >
        <form onSubmit={handleEntrySubmit} className="space-y-4 text-xs">
          {actionError && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}
          <div>
            <label className="block text-[#94a3b8] font-medium mb-1">Select Work Order</label>
            <select
              required
              value={entryData.workOrderId}
              onChange={(e) => setEntryData({ ...entryData, workOrderId: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
            >
              {runningLines.map((l) => (
                <option key={l.workOrderId} value={l.workOrderId}>
                  {l.workOrderNo} - {l.product} (Qty: {l.targetQty})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#94a3b8] font-medium mb-1">Good Quantity Produced</label>
              <input
                type="number"
                required
                value={entryData.goodQuantity}
                onChange={(e) => setEntryData({ ...entryData, goodQuantity: e.target.value, quantityProduced: Number(e.target.value) + Number(entryData.rejectedQuantity || 0) })}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
              />
            </div>
            <div>
              <label className="block text-[#94a3b8] font-medium mb-1">Rejected Quantity</label>
              <input
                type="number"
                value={entryData.rejectedQuantity}
                onChange={(e) => setEntryData({ ...entryData, rejectedQuantity: e.target.value, quantityProduced: Number(entryData.goodQuantity || 0) + Number(e.target.value) })}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#94a3b8] font-medium mb-1">Shift</label>
              <select
                value={entryData.shift}
                onChange={(e) => setEntryData({ ...entryData, shift: e.target.value })}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
              >
                <option value="SHIFT_A">Shift A (06:00 - 14:00)</option>
                <option value="SHIFT_B">Shift B (14:00 - 22:00)</option>
                <option value="SHIFT_C">Shift C (Night)</option>
              </select>
            </div>
            <div>
              <label className="block text-[#94a3b8] font-medium mb-1">Hours Run</label>
              <input
                type="number"
                step="0.5"
                value={entryData.hoursWorked}
                onChange={(e) => setEntryData({ ...entryData, hoursWorked: e.target.value })}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#94a3b8] font-medium mb-1">Operator <span className="text-[#3b82f6] text-[10px]">(Existing Personnel)</span></label>
              <select
                value={entryData.operatorName}
                onChange={(e) => setEntryData({ ...entryData, operatorName: e.target.value })}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
              >
                <option value="">-- Select Operator --</option>
                {refData.users.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} {u.role ? `(${u.role})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[#94a3b8] font-medium mb-1">Machine / Station <span className="text-[#3b82f6] text-[10px]">(Existing Lines)</span></label>
              <select
                value={entryData.machineId}
                onChange={(e) => setEntryData({ ...entryData, machineId: e.target.value })}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
              >
                <option value="">-- Select Machine / Station --</option>
                {refData.machines.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[#94a3b8] font-medium mb-1">Notes / Observations</label>
            <textarea
              rows="2"
              value={entryData.notes}
              onChange={(e) => setEntryData({ ...entryData, notes: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#1e2a4a]">
            <Button variant="secondary" onClick={() => setIsEntryModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Production Entry"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Transfer Output to Quality Inspection */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setActionError("");
        }}
        title="Transfer Batch to Quality Control"
        size="md"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs">
          {actionError && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {(() => {
            const currentLine = selectedTransferLine;
            if (!currentLine) return null;
            return (
              <div className="p-3 bg-[#0a1020] border border-[#1e2a4a] rounded-xl grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[10px] text-[#64748b] uppercase block font-semibold">Produced Good</span>
                  <span className="text-sm font-bold text-[#f1f5f9]">{currentLine.producedQty}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748b] uppercase block font-semibold">In QA / Transferred</span>
                  <span className="text-sm font-bold text-amber-400">{currentLine.transferredQty}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748b] uppercase block font-semibold">Available for QA</span>
                  <span className={`text-sm font-bold ${currentLine.availableForTransfer > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {currentLine.availableForTransfer}
                  </span>
                </div>
              </div>
            );
          })()}

          {(() => {
            const currentLine = selectedTransferLine;
            if (currentLine && currentLine.availableForTransfer <= 0) {
              return (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
                  All completed good output ({currentLine.producedQty} units) for this order has already been transferred to Quality. Log more production via &apos;Log Run&apos; before creating another transfer batch.
                </div>
              );
            }
            return null;
          })()}

          <div>
            <label className="block text-[#94a3b8] font-medium mb-1">Select Work Order</label>
            <select
              required
              value={transferData.workOrderId}
              onChange={(e) => {
                const selectedWoId = e.target.value;
                const found = activeLines.find((l) => String(l.workOrderId) === String(selectedWoId));
                setTransferData({
                  ...transferData,
                  workOrderId: selectedWoId,
                  quantity: found && found.availableForTransfer > 0 ? found.availableForTransfer : "",
                });
                setActionError("");
              }}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
            >
              {runningLines.map((l) => (
                <option key={l.workOrderId} value={l.workOrderId}>
                  {l.workOrderNo} - {l.product} (Available: {l.availableForTransfer} / Good: {l.producedQty})
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[#94a3b8] font-medium">Quantity Ready for Inspection</label>
              {(() => {
                const currentLine = activeLines.find(
                  (l) => String(l.workOrderId) === String(transferData.workOrderId)
                );
                return currentLine ? (
                  <span className="text-[10px] text-[#64748b]">
                    Max transferable: <strong className="text-emerald-400">{currentLine.availableForTransfer} units</strong>
                  </span>
                ) : null;
              })()}
            </div>
            <input
              type="number"
              required
              min="1"
              max={selectedTransferLine?.availableForTransfer}
              value={transferData.quantity}
              onChange={(e) => {
                const quantity = e.target.value;
                setTransferData({ ...transferData, quantity });
                setActionError(
                  selectedTransferLine &&
                    Number(quantity) > selectedTransferLine.availableForTransfer
                    ? `Only ${selectedTransferLine.availableForTransfer} units remain available for QA. Reduce the transfer quantity or record more good production first.`
                    : ""
                );
              }}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
            />
          </div>
          <div>
            <label className="block text-[#94a3b8] font-medium mb-1">Handoff Notes</label>
            <textarea
              rows="2"
              value={transferData.notes}
              onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#1e2a4a]">
            <Button
              variant="secondary"
              onClick={() => {
                setIsTransferModalOpen(false);
                setActionError("");
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? "Transferring..." : "Transfer to QA Queue"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Log Downtime */}
      <Modal
        isOpen={isDowntimeModalOpen}
        onClose={() => setIsDowntimeModalOpen(false)}
        title="Record Station Downtime"
        size="md"
      >
        <form onSubmit={handleDowntimeSubmit} className="space-y-4 text-xs">
          {actionError && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}
          <div>
            <label className="block text-[#94a3b8] font-medium mb-1">Select Work Order</label>
            <select
              required
              value={downtimeData.workOrderId}
              onChange={(e) => setDowntimeData({ ...downtimeData, workOrderId: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
            >
              {runningLines.map((l) => (
                <option key={l.workOrderId} value={l.workOrderId}>
                  {l.workOrderNo} - {l.product}
                </option>
              ))}
            </select>
          </div>
          <div>
            <CustomDropdown
              label="Machine / Station"
              required
              category="machine"
              categoryLabel="Machine / Station"
              options={refData.machines}
              value={downtimeData.machineId}
              onChange={(val) => setDowntimeData({ ...downtimeData, machineId: val })}
              placeholder="-- Select Machine / Station --"
            />
          </div>
          <div>
            <label className="block text-[#94a3b8] font-medium mb-1">Duration (Minutes)</label>
            <input
              type="number"
              required
              min="1"
              value={downtimeData.durationMinutes}
              onChange={(e) => setDowntimeData({ ...downtimeData, durationMinutes: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
            />
          </div>
          <div>
            <CustomDropdown
              label="Reason / Root Cause"
              required
              category="downtimeReason"
              categoryLabel="Downtime Reason"
              value={downtimeData.reason}
              onChange={(val) => setDowntimeData({ ...downtimeData, reason: val })}
              placeholder="-- Select Downtime Reason --"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#1e2a4a]">
            <Button variant="secondary" onClick={() => setIsDowntimeModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? "Logging..." : "Log Downtime"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Log Scrap */}
      <Modal
        isOpen={isScrapModalOpen}
        onClose={() => setIsScrapModalOpen(false)}
        title="Log Material Scrap against Work Order"
        size="md"
      >
        <form onSubmit={handleScrapSubmit} className="space-y-4 text-xs">
          {actionError && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}
          <div>
            <label className="block text-[#94a3b8] font-medium mb-1">Select Work Order</label>
            <select
              required
              value={scrapData.workOrderId}
              onChange={(e) => setScrapData({ ...scrapData, workOrderId: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
            >
              {runningLines.map((l) => (
                <option key={l.workOrderId} value={l.workOrderId}>
                  {l.workOrderNo} - {l.product}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[#94a3b8] font-medium mb-1">Scrap Quantity</label>
            <input
              type="number"
              required
              value={scrapData.quantity}
              onChange={(e) => setScrapData({ ...scrapData, quantity: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2 focus:outline-none focus:border-[#3b82f6]"
            />
          </div>
          <div>
            <CustomDropdown
              label="Scrap Reason"
              required
              category="scrapReason"
              categoryLabel="Scrap Reason"
              value={scrapData.reason}
              onChange={(val) => setScrapData({ ...scrapData, reason: val })}
              placeholder="-- Select Scrap Reason --"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#1e2a4a]">
            <Button variant="secondary" onClick={() => setIsScrapModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? "Recording..." : "Record Scrap"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Update Production Completion */}
      <Modal
        isOpen={Boolean(completionOrder)}
        onClose={() => !completionSubmitting && setCompletionOrder(null)}
        title="Update Production Completion"
        subtitle={completionOrder ? `Manually record actual shop-floor completion for ${completionOrder.workOrderNo}` : ""}
      >
        {completionOrder && (
          <form onSubmit={handleCompletionSubmit} className="space-y-4 text-xs">
            {completionError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
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
                  value={completionOrder.workOrderNo}
                  className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#94a3b8] rounded-lg px-3 py-2 text-xs cursor-not-allowed font-mono select-none"
                />
              </div>
              <div>
                <label className="block font-medium mb-1 text-[#94a3b8]">Product Name</label>
                <input
                  type="text"
                  readOnly
                  value={completionOrder.product}
                  title={completionOrder.product}
                  className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#94a3b8] rounded-lg px-3 py-2 text-xs cursor-not-allowed truncate select-none"
                />
              </div>
              <div>
                <label className="block font-medium mb-1 text-[#94a3b8]">Product SKU</label>
                <input
                  type="text"
                  readOnly
                  value={completionOrder.productSku || "—"}
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
                  value={`${completionOrder.targetQty} ${completionOrder.uom}`}
                  className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] font-semibold rounded-lg px-3 py-2 text-xs cursor-not-allowed select-none"
                />
              </div>
              <div>
                <label className="block font-medium mb-1 text-[#94a3b8]">Previously Completed Quantity</label>
                <input
                  type="text"
                  readOnly
                  value={`${completionOrder.producedQty} ${completionOrder.uom}`}
                  className="w-full bg-[#0a1020] border border-[#1e2a4a] text-emerald-400 font-semibold rounded-lg px-3 py-2 text-xs cursor-not-allowed select-none"
                />
              </div>
            </div>

            {/* Current Pending Notice */}
            <div className="p-2.5 rounded-lg bg-[#0a1020] border border-[#1e2a4a] flex items-center justify-between text-xs">
              <span className="text-[#94a3b8]">Pending Quantity:</span>
              <span className="font-bold text-amber-400">{completionOrder.pendingQty} {completionOrder.uom}</span>
            </div>

            {/* Additional Completed Quantity */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-medium text-[#94a3b8]">
                  Additional Completed Quantity <span className="text-rose-400">*</span>
                </label>
                <span className="text-[10px] text-[#64748b]">
                  Max additional: <strong className="text-amber-400">{completionOrder.pendingQty} {completionOrder.uom}</strong>
                </span>
              </div>
              <input
                type="number"
                min={isWholeUnit(completionOrder.uom) ? "1" : "0.001"}
                max={completionOrder.pendingQty > 0 ? completionOrder.pendingQty : undefined}
                step={isWholeUnit(completionOrder.uom) ? "1" : "any"}
                required
                disabled={completionOrder.pendingQty <= 0 || completionSubmitting}
                value={completionForm.quantityNow}
                onChange={(e) => {
                  setCompletionForm({ ...completionForm, quantityNow: e.target.value });
                  if (completionError) setCompletionError("");
                }}
                placeholder={completionOrder.pendingQty > 0 ? `Enter additional completed quantity (${completionOrder.uom})...` : "Work order is already fully completed"}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#3b82f6] disabled:opacity-50"
              />
            </div>

            {/* Live Dynamic Preview if quantity entered */}
            {Number(completionForm.quantityNow) > 0 && (
              <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs space-y-1">
                <div className="flex justify-between text-[#94a3b8]">
                  <span>Total Completed (Projected):</span>
                  <span className="font-bold text-emerald-400">
                    {completionOrder.producedQty + Number(completionForm.quantityNow)} {completionOrder.uom}
                  </span>
                </div>
                <div className="flex justify-between text-[#94a3b8]">
                  <span>Pending Quantity (Projected):</span>
                  <span className="font-bold text-amber-400">
                    {Math.max(0, completionOrder.targetQty - (completionOrder.producedQty + Number(completionForm.quantityNow)))} {completionOrder.uom}
                  </span>
                </div>
                <div className="flex justify-between text-[#94a3b8]">
                  <span>Completion Percentage (Projected):</span>
                  <span className="font-bold text-blue-400">
                    {completionOrder.targetQty > 0
                      ? Math.min(100, Math.round(((completionOrder.producedQty + Number(completionForm.quantityNow)) / completionOrder.targetQty) * 100))
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
                onClick={() => setCompletionOrder(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                loading={completionSubmitting}
                disabled={completionSubmitting || completionOrder.pendingQty <= 0 || !completionForm.quantityNow}
              >
                Save Completion
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
