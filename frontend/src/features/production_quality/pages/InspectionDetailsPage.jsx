import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  Printer,
  Truck,
  QrCode,
  UserCheck,
  UserPlus,
  ShieldAlert,
  Clock,
} from "lucide-react";
import AssignInspectorModal from "../components/quality/AssignInspectorModal";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import StatusBadge from "../../../components/common/StatusBadge";
import Loader from "../../../components/common/Loader";
import Modal from "../../../components/common/Modal";
import qualityService from "../services/qualityService";
import productionService from "../services/productionService";
import CustomDropdown from "../../../components/common/CustomDropdown";
import QRLabelModal from "../components/qr/QRLabelModal";
import {
  getTodayDateString,
  validatePastDate,
  validateQuantityInput,
} from "../utils/formValidation";

export default function InspectionDetailsPage() {
  const { id } = useParams();

  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultsMessage, setResultsMessage] = useState("");

  // Inspection Decision Modals
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isReworkModalOpen, setIsReworkModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Common Decision State
  const [decisionOfficer, setDecisionOfficer] = useState("");
  const [refData, setRefData] = useState({
    users: [
      { id: 1, name: "System Administrator", role: "ADMIN" },
      { id: 2, name: "Quality Officer - Metallurgy", role: "QUALITY_INSPECTOR" },
      { id: 3, name: "Lead Quality Inspector", role: "QUALITY_INSPECTOR" },
    ],
  });

  useEffect(() => {
    async function fetchRef() {
      try {
        const res = await productionService.getReferenceData();
        const data = res?.data || res;
        if (data && data.users) {
          setRefData((prev) => ({ ...prev, ...data }));
          if (data.users.length > 0) {
            setDecisionOfficer((prev) => prev || data.users[0].name);
          }
        }
      } catch (err) {
        console.error("Could not fetch ref data for inspection details:", err);
      }
    }
    fetchRef();
  }, []);

  // PASS Form State
  const [passForm, setPassForm] = useState({
    quantity: "",
    notes: "All physical and metallurgical tolerances meet IS 3043 / IEC 62561 specifications.",
  });

  // REWORK Form State
  const [reworkForm, setReworkForm] = useState({
    quantity: "",
    defectDescription: "",
    rootCause: "Sub-optimal plating immersion timing or surface oxidation",
    correctiveAction: "",
    responsiblePerson: "",
    targetCompletionDate: "",
  });

  // REJECT Form State
  const [rejectForm, setRejectForm] = useState({
    quantity: "",
    defectReason: "",
    defectType: "METALLURGICAL_DEFECT",
    disposalRecommendation: "Quarantine batch for scrap recycling; scrap credit against job order",
  });

  // Configurable Parameters Entry
  const [parameters, setParameters] = useState({
    coatingThicknessMicrons: "",
    coatingThicknessPass: false,
    ohmicResistanceOhms: "",
    ohmicResistancePass: false,
    diameterMm: "",
    diameterPass: false,
    lengthMm: "",
    lengthPass: false,
    visualFinishPass: false,
    inspectorRemarks: "",
  });

  // Quantities calculation
  const inspectedQty = useMemo(() => {
    return Number(inspection?.inspectedQuantity ?? inspection?.quantity ?? 0);
  }, [inspection]);

  const acceptedQty = useMemo(() => {
    return Number(inspection?.acceptedQuantity ?? 0);
  }, [inspection]);

  const reworkQty = useMemo(() => {
    return Number(inspection?.reworkQuantity ?? 0);
  }, [inspection]);

  const rejectedQty = useMemo(() => {
    return Number(inspection?.rejectedQuantity ?? 0);
  }, [inspection]);

  const pendingQty = useMemo(() => {
    return Math.max(0, inspectedQty - (acceptedQty + reworkQty + rejectedQty));
  }, [inspectedQty, acceptedQty, reworkQty, rejectedQty]);

  const dispatchedQty = useMemo(() => {
    return Number(inspection?.dispatchedQuantity ?? 0);
  }, [inspection]);

  const availableToDispatch = useMemo(() => {
    return Math.max(0, acceptedQty - dispatchedQty);
  }, [acceptedQty, dispatchedQty]);

  const isReleased = inspection?.status === "RELEASED";
  const isFullyDecided = pendingQty <= 0 && inspectedQty > 0;
  const isFinalized = isReleased || isFullyDecided;
  const isUnassigned = !inspection?.assignedInspectorId || inspection?.status === "PENDING_ASSIGNMENT";

  const loadInspection = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await qualityService.getInspectionById(id);
      if (res?.data) {
        setInspection(res.data);
        if (res.data.assignedInspector?.name) {
          setDecisionOfficer(res.data.assignedInspector.name);
        } else if (res.data.decisionOfficer) {
          setDecisionOfficer(res.data.decisionOfficer);
        } else {
          setDecisionOfficer("");
        }
        if (res.data.measurements?.parameters) {
          setParameters((prev) => ({ ...prev, ...res.data.measurements.parameters }));
        } else if (res.data.measurements && typeof res.data.measurements === "object") {
          setParameters((prev) => ({ ...prev, ...res.data.measurements }));
        }

        const remaining = Math.max(0, Number(res.data.inspectedQuantity || res.data.quantity || 0) - (Number(res.data.acceptedQuantity || 0) + Number(res.data.reworkQuantity || 0) + Number(res.data.rejectedQuantity || 0)));
        const defaultQty = remaining > 0 ? String(remaining) : "0";

        setPassForm((prev) => ({ ...prev, quantity: defaultQty }));
        setReworkForm((prev) => ({ ...prev, quantity: defaultQty }));
        setRejectForm((prev) => ({ ...prev, quantity: defaultQty }));
      } else {
        throw new Error("No inspection record returned");
      }
    } catch (err) {
      console.error("Failed to load inspection file:", err);
      setError(err?.message || "Failed to load inspection from ERP server.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadInspection();
  }, [loadInspection]);

  const handleSaveResults = async () => {
    if (!inspection || isFinalized) return;

    setActionLoading(true);
    setResultsMessage("");
    setError(null);
    try {
      await qualityService.recordResults(id, {
        acceptedQuantity: Number(inspection.acceptedQuantity || 0),
        rejectedQuantity: Number(inspection.rejectedQuantity || 0),
        measurements: { parameters },
        evidenceNotes: parameters.inspectorRemarks || undefined,
      });
      setResultsMessage("Inspection measurements and checks successfully recorded.");
      await loadInspection();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to save inspection results.");
    } finally {
      setActionLoading(false);
    }
  };

  // ========================================================
  // Decision 1: PASS
  // ========================================================
  const handlePassSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isReleased) {
      alert("Cannot record decision: this inspection lot has already been released to finished goods.");
      setIsPassModalOpen(false);
      return;
    }
    if (pendingQty <= 0) {
      alert("Cannot record decision: all units in this lot have already received a final decision.");
      setIsPassModalOpen(false);
      return;
    }
    if (!decisionOfficer?.trim()) {
      alert("Please select a qualified Quality Officer.");
      return;
    }

    const qtyErr = validateQuantityInput(passForm.quantity, {
      max: pendingQty,
      allowZero: false,
      fieldName: "Pass quantity",
    });
    if (qtyErr) {
      alert(qtyErr);
      return;
    }

    const qty = Number(passForm.quantity);

    setActionLoading(true);
    try {
      // 1. Record parameters if needed
      if (parameters.inspectorRemarks || parameters.coatingThicknessMicrons) {
        try {
          await qualityService.recordResults(id, {
            acceptedQuantity: acceptedQty + qty,
            rejectedQuantity: rejectedQty,
            measurements: { parameters },
            evidenceNotes: parameters.inspectorRemarks || passForm.notes,
          });
        } catch {
          // Continue if recordResults had no changes
        }
      }

      // 2. Submit PASS Decision
      await qualityService.submitDecision(id, {
        decision: "PASS",
        quantity: qty,
        officer: decisionOfficer.trim() || undefined,
        notes: passForm.notes,
      });

      alert(`Quality Decision confirmed: PASS for ${qty} units. Lot released to Dispatch!`);
      setIsPassModalOpen(false);
      await loadInspection();
    } catch (err) {
      console.error("Failed to record PASS decision:", err);
      alert("Failed to confirm PASS: " + (err?.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  // ========================================================
  // Decision 2: REWORK
  // ========================================================
  const handleReworkSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isReleased) {
      alert("Cannot record decision: this inspection lot has already been released to finished goods.");
      setIsReworkModalOpen(false);
      return;
    }
    if (pendingQty <= 0) {
      alert("Cannot record decision: all units in this lot have already received a final decision.");
      setIsReworkModalOpen(false);
      return;
    }
    if (reworkForm.targetCompletionDate) {
      const dateErr = validatePastDate(reworkForm.targetCompletionDate, "Target completion date");
      if (dateErr) {
        alert(dateErr);
        return;
      }
    }

    const qtyErr = validateQuantityInput(reworkForm.quantity, {
      max: pendingQty,
      allowZero: false,
      fieldName: "Rework quantity",
    });
    if (qtyErr) {
      alert(qtyErr);
      return;
    }

    const qty = Number(reworkForm.quantity);

    if (!reworkForm.defectDescription.trim()) {
      alert("A defect description is required when routing for rework.");
      return;
    }

    setActionLoading(true);
    try {
      await qualityService.submitDecision(id, {
        decision: "REWORK",
        quantity: qty,
        defectDescription: reworkForm.defectDescription.trim(),
        correctiveAction: reworkForm.correctiveAction.trim(),
        rootCause: reworkForm.rootCause.trim(),
        responsiblePerson: reworkForm.responsiblePerson.trim(),
        targetCompletionDate: reworkForm.targetCompletionDate,
        officer: decisionOfficer.trim() || undefined,
        notes: `Rework routed to ${reworkForm.responsiblePerson}`,
      });

      alert(`Quality Decision confirmed: REWORK for ${qty} units. Linked CAPA record created!`);
      setIsReworkModalOpen(false);
      await loadInspection();
    } catch (err) {
      console.error("Failed to record REWORK decision:", err);
      alert("Failed to confirm REWORK: " + (err?.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  // ========================================================
  // Decision 3: REJECTED
  // ========================================================
  const handleRejectSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isReleased) {
      alert("Cannot record decision: this inspection lot has already been released to finished goods.");
      setIsRejectModalOpen(false);
      return;
    }
    if (pendingQty <= 0) {
      alert("Cannot record decision: all units in this lot have already received a final decision.");
      setIsRejectModalOpen(false);
      return;
    }
    const qtyErr = validateQuantityInput(rejectForm.quantity, {
      max: pendingQty,
      allowZero: false,
      fieldName: "Rejection quantity",
    });
    if (qtyErr) {
      alert(qtyErr);
      return;
    }

    const qty = Number(rejectForm.quantity);

    if (!rejectForm.defectReason.trim()) {
      alert("A rejection reason / defect description is required.");
      return;
    }

    setActionLoading(true);
    try {
      await qualityService.submitDecision(id, {
        decision: "REJECTED",
        quantity: qty,
        reason: `${rejectForm.defectType}: ${rejectForm.defectReason.trim()}`,
        notes: rejectForm.disposalRecommendation.trim(),
        officer: decisionOfficer.trim() || undefined,
      });

      alert(`Quality Decision confirmed: REJECTED for ${qty} units.`);
      setIsRejectModalOpen(false);
      await loadInspection();
    } catch (err) {
      console.error("Failed to record REJECTED decision:", err);
      alert("Failed to confirm REJECTION: " + (err?.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader label="Loading quality inspection file..." size="lg" />
      </div>
    );
  }

  if (error && !inspection) {
    return (
      <div className="space-y-4 py-12">
        <div className="p-6 bg-[#10182f] border border-rose-500/30 rounded-2xl max-w-lg mx-auto text-center space-y-4">
          <p className="text-sm font-semibold text-rose-300">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/pq/inspections">
              <Button variant="secondary" size="sm">Back to Inspections</Button>
            </Link>
            <Button variant="primary" size="sm" onClick={loadInspection}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#10182f] p-6 rounded-2xl border border-[#1e2a4a] shadow-xs">
        <div className="flex items-center gap-3">
          <Link to="/pq/inspections">
            <button
              type="button"
              className="p-2 rounded-xl border border-[#1e2a4a] text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-slate-800/40 transition cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-[#94a3b8]">{inspection?.inspectionNo || "—"}</span>
              <StatusBadge status={inspection?.status} />
              {availableToDispatch > 0 && (
                <span className="text-xs font-bold text-[#2DD4BF] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  {availableToDispatch} units in Dispatch
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#f1f5f9] tracking-tight">
              Quality Inspection Protocol & Decision Workflow
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            icon={QrCode}
            onClick={() => setIsQRModalOpen(true)}
            title="View & Print Work Order QR Code"
          >
            QR Code
          </Button>
          {availableToDispatch > 0 && (
            <Link to="/pq/dispatch">
              <Button
                variant="primary"
                size="md"
                icon={Truck}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Go to Dispatch
              </Button>
            </Link>
          )}
          <Button
            variant="secondary"
            size="md"
            icon={Printer}
            onClick={() => window.print()}
          >
            Print Protocol
          </Button>
        </div>
      </div>

      {/* Unassigned Inspection Alert Banner */}
      {isUnassigned && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300">Pending Quality Inspector Assignment</p>
              <p className="text-amber-200/80 text-[11px] mt-0.5">
                This production output has been transferred to Quality Inspection, but has not yet been assigned to a certified Quality Inspector. An authorized user must manually assign an inspector before measurement logging or final decisions (Pass/Rework/Reject) can be executed.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={UserPlus}
            className="bg-amber-500 text-black hover:bg-amber-400 font-bold shrink-0 self-start sm:self-center"
            onClick={() => setIsAssignModalOpen(true)}
          >
            Assign Inspector
          </Button>
        </div>
      )}

      {/* Engineering Specs, Batch Traceability, and Decision Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card title="Approved Product Baseline" subtitle="Inherited released drawings & standards">
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-[#94a3b8]">Product Name:</span>
              <p className="font-semibold text-[#f1f5f9]">
                {inspection?.workOrder?.bomRevision?.product?.name || inspection?.product?.name || "—"}
              </p>
            </div>
            <div>
              <span className="text-[#94a3b8]">Drawing Revision:</span>
              <p className="font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded inline-block border border-emerald-500/30">
                {inspection?.workOrder?.bomRevision?.product?.productSpecifications?.[0]?.drawingNumber || inspection?.product?.drawingRevision || "—"}
              </p>
            </div>
            <div>
              <span className="text-[#94a3b8]">Released BOM:</span>
              <p className="font-semibold text-blue-400">
                {inspection?.workOrder?.bomRevision?.revision || inspection?.product?.bomRevision || "—"}
              </p>
            </div>
            <div>
              <span className="text-[#94a3b8]">Quality Standard:</span>
              <p className="font-medium text-[#f1f5f9]">
                {inspection?.workOrder?.bomRevision?.product?.standardMake || inspection?.product?.standard || "—"}
              </p>
            </div>
          </div>
        </Card>

        <Card title="Work Order & Batch Reference" subtitle="Originating manufacturing line">
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-[#94a3b8]">Work Order No:</span>
              <p className="font-mono font-semibold text-[#3b82f6]">
                {inspection?.workOrder?.workOrderNo || inspection?.workOrderNo || "—"}
              </p>
            </div>
            <div>
              <span className="text-[#94a3b8]">Batch / Heat No:</span>
              <p className="font-mono font-semibold text-[#f1f5f9]">
                {inspection?.batchNumber || "—"}
              </p>
            </div>
            <div>
              <span className="text-[#94a3b8]">Total Inspected Quantity:</span>
              <p className="font-bold text-[#f1f5f9] text-sm">
                {inspectedQty} units
              </p>
            </div>
            <div>
              <span className="text-[#94a3b8]">Inspection Station:</span>
              <p className="font-medium text-[#94a3b8]">
                {inspection?.station || "—"}
              </p>
            </div>
            <div className="pt-2 border-t border-[#1e2a4a]">
              <span className="text-[#94a3b8] block">Assigned Quality Inspector:</span>
              <div className="flex items-center justify-between pt-1">
                {!isUnassigned ? (
                  <span className="font-semibold text-[#f1f5f9] flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                    <span>{inspection?.assignedInspector?.name || inspection?.decisionOfficer}</span>
                  </span>
                ) : (
                  <span className="text-[10.5px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                    Unassigned (Pending)
                  </span>
                )}
                {!isFinalized && (
                  <button
                    type="button"
                    onClick={() => setIsAssignModalOpen(true)}
                    className="text-[11px] font-semibold text-[#3b82f6] hover:underline cursor-pointer"
                  >
                    {isUnassigned ? "Assign Now" : "Reassign"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Quality Decision Control" subtitle="Authorized QC Officer Decisions">
          <div className="space-y-3">
            {/* Quantity Conservation Breakdown */}
            <div className="p-3 bg-[#0a1020] rounded-xl border border-[#1e2a4a] space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-[#94a3b8]">
                <span>Total Inspected:</span>
                <span className="font-mono font-bold text-[#f1f5f9]">{inspectedQty}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-400">
                <span>Passed (Available for Dispatch):</span>
                <span className="font-mono font-bold">{acceptedQty}</span>
              </div>
              <div className="flex justify-between items-center text-amber-400">
                <span>In Rework (QC Hold / CAPA):</span>
                <span className="font-mono font-bold">{reworkQty}</span>
              </div>
              <div className="flex justify-between items-center text-rose-400">
                <span>Rejected (Scrap):</span>
                <span className="font-mono font-bold">{rejectedQty}</span>
              </div>
              <div className="flex justify-between items-center text-blue-400 pt-1 border-t border-[#1e2a4a]">
                <span className="font-semibold">Pending Decision:</span>
                <span className="font-mono font-bold">{pendingQty}</span>
              </div>
            </div>

            {/* Decision Officer Info */}
            {inspection?.decisionOfficer && (
              <div className="p-2.5 bg-[#0a1020] rounded-xl border border-[#1e2a4a] text-[11px] text-[#94a3b8] space-y-1">
                <div className="flex items-center gap-1.5 text-[#f1f5f9] font-medium">
                  <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Officer: {inspection.decisionOfficer}</span>
                </div>
                {inspection.decisionAt && (
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    <Clock className="w-3.5 h-3.5 text-[#64748b]" />
                    <span>{new Date(inspection.decisionAt).toLocaleString()}</span>
                  </div>
                )}
                {inspection.decisionNotes && (
                  <p className="text-[10px] text-[#94a3b8] italic">"{inspection.decisionNotes}"</p>
                )}
              </div>
            )}

            {/* Unassigned Action Warning */}
            {isUnassigned && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-semibold">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Action Locked: Assign Inspector First</span>
                </div>
                <p className="text-[11px] text-[#94a3b8]">
                  Quality decisions (Pass/Rework/Reject) cannot be submitted on an unassigned inspection lot.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  icon={UserPlus}
                  className="w-full bg-amber-500 text-black hover:bg-amber-400 font-bold text-xs"
                  onClick={() => setIsAssignModalOpen(true)}
                >
                  Assign Inspector Now
                </Button>
              </div>
            )}

            {/* 3 Explicit Quality Decision Actions */}
            {isReleased && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <span>Released to Finished Goods</span>
                </div>
                <p className="text-[11px] text-[#94a3b8]">
                  This inspection lot has already been accepted and released to finished goods inventory / dispatch. Further inspection decisions cannot be recorded for this lot.
                </p>
              </div>
            )}
            {!isReleased && isFullyDecided && (
              <div className="p-3 bg-slate-500/10 border border-slate-500/30 rounded-xl text-slate-300 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Inspection Complete</span>
                </div>
                <p className="text-[11px] text-[#94a3b8]">
                  All {inspectedQty} units have received final decisions ({acceptedQty} passed, {reworkQty} rework, {rejectedQty} rejected).
                </p>
              </div>
            )}

            <div className="space-y-2 pt-1">
              <Button
                variant="primary"
                size="md"
                disabled={actionLoading || isFinalized || isUnassigned}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2"
                icon={CheckCircle2}
                onClick={() => setIsPassModalOpen(true)}
              >
                1. Pass (Release to Dispatch)
              </Button>
              <Button
                variant="secondary"
                size="md"
                disabled={actionLoading || isFinalized || isUnassigned}
                className="w-full text-amber-400 border-amber-500/30 hover:bg-amber-500/10 flex items-center justify-center gap-2"
                icon={RotateCcw}
                onClick={() => setIsReworkModalOpen(true)}
              >
                2. Rework (Route to CAPA)
              </Button>
              <Button
                variant="danger"
                size="md"
                disabled={actionLoading || isFinalized || isUnassigned}
                className="w-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center gap-2"
                icon={XCircle}
                onClick={() => setIsRejectModalOpen(true)}
              >
                3. Rejected (Log Scrap)
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Physical & Metallurgical Test Parameters */}
      <Card
        title="Physical & Metallurgical Test Parameters"
        subtitle="Record measured values against approved specification thresholds"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Parameter 1: Coating Thickness */}
          <div className="p-4 rounded-xl border border-[#1e2a4a] bg-[#0a1020] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#f1f5f9] text-sm">1. Coating Thickness (Copper Layer)</span>
              <span className="text-[10px] font-semibold text-[#64748b]">Required: ≥ 250 µm</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                disabled={actionLoading}
                value={parameters.coatingThicknessMicrons}
                onChange={(e) => setParameters({ ...parameters, coatingThicknessMicrons: e.target.value === "" ? "" : Number(e.target.value) })}
                className="w-32 bg-[#10182f] border border-[#1e2a4a] rounded-lg p-2 font-mono font-bold text-[#f1f5f9] focus:outline-none focus:border-[#3b82f6]"
              />
              <span className="text-[#94a3b8] font-medium">Microns (µm)</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="checkbox"
                id="coatPass"
                disabled={actionLoading}
                checked={parameters.coatingThicknessPass}
                onChange={(e) => setParameters({ ...parameters, coatingThicknessPass: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded bg-[#10182f] border-[#1e2a4a]"
              />
              <label htmlFor="coatPass" className="text-[#94a3b8] font-medium cursor-pointer">
                Coating thickness meets IS 3043 / UL 467 minimum requirements
              </label>
            </div>
          </div>

          {/* Parameter 2: Ohmic Resistance */}
          <div className="p-4 rounded-xl border border-[#1e2a4a] bg-[#0a1020] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#f1f5f9] text-sm">2. Ohmic Resistance Test</span>
              <span className="text-[10px] font-semibold text-[#64748b]">Required: ≤ 0.500 Ω</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.01"
                disabled={actionLoading}
                value={parameters.ohmicResistanceOhms}
                onChange={(e) => setParameters({ ...parameters, ohmicResistanceOhms: e.target.value === "" ? "" : Number(e.target.value) })}
                className="w-32 bg-[#10182f] border border-[#1e2a4a] rounded-lg p-2 font-mono font-bold text-[#f1f5f9] focus:outline-none focus:border-[#3b82f6]"
              />
              <span className="text-[#94a3b8] font-medium">Ohms (Ω)</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="checkbox"
                id="resPass"
                disabled={actionLoading}
                checked={parameters.ohmicResistancePass}
                onChange={(e) => setParameters({ ...parameters, ohmicResistancePass: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded bg-[#10182f] border-[#1e2a4a]"
              />
              <label htmlFor="resPass" className="text-[#94a3b8] font-medium cursor-pointer">
                Electrical conductivity and dissipation confirmed
              </label>
            </div>
          </div>

          {/* Parameter 3: Dimensions */}
          <div className="p-4 rounded-xl border border-[#1e2a4a] bg-[#0a1020] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#f1f5f9] text-sm">3. Outer Diameter & Length</span>
              <span className="text-[10px] font-semibold text-[#64748b]">Nominal: 14.2mm x 3000mm</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-[#94a3b8] block mb-1">Measured Diameter (mm)</label>
                <input
                  type="number"
                  step="0.1"
                  disabled={actionLoading}
                  value={parameters.diameterMm}
                  onChange={(e) => setParameters({ ...parameters, diameterMm: e.target.value === "" ? "" : Number(e.target.value) })}
                  className="w-full bg-[#10182f] border border-[#1e2a4a] rounded-lg p-2 font-mono font-bold text-[#f1f5f9] focus:outline-none focus:border-[#3b82f6]"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#94a3b8] block mb-1">Measured Length (mm)</label>
                <input
                  type="number"
                  disabled={actionLoading}
                  value={parameters.lengthMm}
                  onChange={(e) => setParameters({ ...parameters, lengthMm: e.target.value === "" ? "" : Number(e.target.value) })}
                  className="w-full bg-[#10182f] border border-[#1e2a4a] rounded-lg p-2 font-mono font-bold text-[#f1f5f9] focus:outline-none focus:border-[#3b82f6]"
                />
              </div>
            </div>
          </div>

          {/* Parameter 4: Visual & Surface Finish */}
          <div className="p-4 rounded-xl border border-[#1e2a4a] bg-[#0a1020] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#f1f5f9] text-sm">4. Visual Finish & Adhesion</span>
              <span className="text-[10px] font-semibold text-[#64748b]">Zero flaking</span>
            </div>
            <p className="text-[#94a3b8] text-xs">
              Bend test inspection: Bend rod through 180° around mandrel. No flaking or cracking of copper coating allowed.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="checkbox"
                id="visualPass"
                disabled={actionLoading}
                checked={parameters.visualFinishPass}
                onChange={(e) => setParameters({ ...parameters, visualFinishPass: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded bg-[#10182f] border-[#1e2a4a]"
              />
              <label htmlFor="visualPass" className="text-[#94a3b8] font-medium cursor-pointer">
                Surface is smooth, glossy, uniform, without voids or pits
              </label>
            </div>
          </div>
        </div>

        {/* Inspector Remarks */}
        <div className="mt-4 pt-4 border-t border-[#1e2a4a]">
          <label className="block text-[#f1f5f9] font-semibold mb-1 text-xs">Certified Quality Inspector Observations</label>
          <textarea
            rows="3"
            disabled={actionLoading}
            value={parameters.inspectorRemarks}
            onChange={(e) => setParameters({ ...parameters, inspectorRemarks: e.target.value })}
            className="w-full bg-[#0a1020] border border-[#1e2a4a] rounded-lg p-2.5 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#3b82f6]"
          />
        </div>

        {resultsMessage && (
          <p role="status" className="mt-3 text-xs font-medium text-emerald-400">
            {resultsMessage}
          </p>
        )}
        {error && inspection && (
          <p role="alert" className="mt-3 text-xs font-medium text-rose-300">
            {error}
          </p>
        )}

        <div className="mt-4 flex justify-end">
          <Button
            variant="primary"
            size="sm"
            icon={CheckCircle2}
            onClick={handleSaveResults}
            loading={actionLoading}
          >
            Save Parameter Measurements
          </Button>
        </div>
      </Card>

      {/* ======================================================== */}
      {/* 1. Modal: PASS Confirmation Dialog                       */}
      {/* ======================================================== */}
      <Modal
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
        title="Confirm Quality Decision: PASS & Release to Dispatch"
        size="md"
      >
        <form onSubmit={handlePassSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-emerald-500/10 text-emerald-300 rounded-xl border border-emerald-500/30 flex items-start gap-3">
            <Award className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-emerald-400">Authorize Quality Pass & Release to Dispatch</p>
              <p className="mt-0.5 text-[#94a3b8]">
                Batch conforms to electrical & mechanical specifications. Passed quantity will be released to the <strong>Dispatch Module</strong> for customer delivery.
              </p>
            </div>
          </div>

          {/* Audit & Context Summary */}
          <div className="p-3 bg-[#0a1020] rounded-xl border border-[#1e2a4a] space-y-2">
            <div className="flex justify-between py-1 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8]">Inspection Reference:</span>
              <span className="font-mono font-bold text-[#f1f5f9]">{inspection?.inspectionNo}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8]">Work Order:</span>
              <span className="font-mono font-semibold text-blue-400">{inspection?.workOrder?.workOrderNo}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8]">Selected Decision:</span>
              <StatusBadge status="PASS" />
            </div>
            <div className="flex justify-between py-1 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8]">Decision Timestamp:</span>
              <span className="font-mono text-[#f1f5f9]">{new Date().toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="block text-[#f1f5f9] font-medium mb-1">
              Quality Officer Name <span className="text-rose-400">*</span> <span className="text-[#3b82f6] text-[10px]">(Existing Personnel)</span>
            </label>
            <select
              value={decisionOfficer}
              onChange={(e) => setDecisionOfficer(e.target.value)}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2.5 focus:outline-none focus:border-[#3b82f6]"
              required
            >
              <option value="">-- Select Quality Officer --</option>
              {refData.users.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name} {u.role ? `(${u.role})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#f1f5f9] font-medium mb-1">
              Quantity to Pass & Release <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={pendingQty > 0 ? pendingQty : 0}
              value={passForm.quantity}
              onChange={(e) => setPassForm({ ...passForm, quantity: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2.5 font-bold font-mono focus:outline-none focus:border-[#3b82f6]"
              required
            />
            <span className="text-[10px] text-[#94a3b8] mt-1 block">
              Pending inspection quantity: {pendingQty} units
            </span>
          </div>

          <div>
            <label className="block text-[#f1f5f9] font-medium mb-1">Decision Remarks / Certificate Notes</label>
            <textarea
              rows="2"
              value={passForm.notes}
              onChange={(e) => setPassForm({ ...passForm, notes: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2.5 focus:outline-none focus:border-[#3b82f6]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#1e2a4a]">
            <Button variant="secondary" onClick={() => setIsPassModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
              loading={actionLoading}
              disabled={actionLoading || isFinalized || !passForm.quantity || Number(passForm.quantity) <= 0 || Number(passForm.quantity) > pendingQty}
              icon={CheckCircle2}
            >
              Confirm PASS & Release to Dispatch
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* 2. Modal: REWORK Confirmation Dialog                     */}
      {/* ======================================================== */}
      <Modal
        isOpen={isReworkModalOpen}
        onClose={() => setIsReworkModalOpen(false)}
        title="Confirm Quality Decision: REWORK & Create CAPA"
        size="md"
      >
        <form onSubmit={handleReworkSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-amber-500/10 text-amber-300 rounded-xl border border-amber-500/30 flex items-start gap-3">
            <RotateCcw className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-amber-400">Route Batch to Rework & Open CAPA</p>
              <p className="mt-0.5 text-[#94a3b8]">
                Affected quantity will be held from Dispatch until corrective rework is executed and reinspected.
              </p>
            </div>
          </div>

          {/* Audit & Context Summary */}
          <div className="p-3 bg-[#0a1020] rounded-xl border border-[#1e2a4a] space-y-2">
            <div className="flex justify-between py-1 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8]">Inspection Reference:</span>
              <span className="font-mono font-bold text-[#f1f5f9]">{inspection?.inspectionNo}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8]">Work Order:</span>
              <span className="font-mono font-semibold text-blue-400">{inspection?.workOrder?.workOrderNo}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8]">Selected Decision:</span>
              <StatusBadge status="HOLD" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#f1f5f9] font-medium mb-1">
                Quality Officer <span className="text-rose-400">*</span>
              </label>
              <select
                value={decisionOfficer}
                onChange={(e) => setDecisionOfficer(e.target.value)}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2.5 focus:outline-none focus:border-[#3b82f6]"
                required
              >
                <option value="">-- Select Quality Officer --</option>
                {refData.users.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} {u.role ? `(${u.role})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[#f1f5f9] font-medium mb-1">
                Rework Quantity <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={pendingQty > 0 ? pendingQty : 0}
                value={reworkForm.quantity}
                onChange={(e) => setReworkForm({ ...reworkForm, quantity: e.target.value })}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2.5 font-bold font-mono focus:outline-none focus:border-[#3b82f6]"
                required
              />
            </div>
          </div>

          <div>
            <CustomDropdown
              label="Defect Description & Cause for Rework"
              required
              category="rejectionReason"
              categoryLabel="Defect Cause"
              value={reworkForm.defectDescription}
              onChange={(val) => setReworkForm({ ...reworkForm, defectDescription: val })}
              placeholder="-- Select Defect Cause --"
            />
          </div>

          <div>
            <CustomDropdown
              label="Corrective Action Required"
              required
              category="correctiveAction"
              categoryLabel="Corrective Action"
              value={reworkForm.correctiveAction}
              onChange={(val) => setReworkForm({ ...reworkForm, correctiveAction: val })}
              placeholder="-- Select Corrective Action --"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#f1f5f9] font-medium mb-1">Assigned Person / Department</label>
              <select
                value={reworkForm.responsiblePerson}
                onChange={(e) => setReworkForm({ ...reworkForm, responsiblePerson: e.target.value })}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2.5 focus:outline-none focus:border-[#3b82f6]"
              >
                <option value="">-- Select Assigned Department / Lead --</option>
                {refData.users.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} {u.role ? `(${u.role})` : ""}
                  </option>
                ))}
                <option value="Production Line Supervisor">Production Line Supervisor</option>
                <option value="Plating Station Lead">Plating Station Lead</option>
                <option value="Machine Shop A">Machine Shop A</option>
                <option value="Electroplating Station">Electroplating Station</option>
              </select>
            </div>
            <div>
              <label className="block text-[#f1f5f9] font-medium mb-1">Target Completion Date</label>
              <input
                type="date"
                min={getTodayDateString()}
                value={reworkForm.targetCompletionDate}
                onChange={(e) => setReworkForm({ ...reworkForm, targetCompletionDate: e.target.value })}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2.5 font-mono focus:outline-none focus:border-[#3b82f6]"
              />
              {reworkForm.targetCompletionDate && validatePastDate(reworkForm.targetCompletionDate) && (
                <p className="text-[11px] text-rose-400 mt-1">
                  Past dates are not allowed. Please select today or a future date.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#1e2a4a]">
            <Button variant="secondary" onClick={() => setIsReworkModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              type="submit"
              className="bg-amber-600 hover:bg-amber-500 text-white"
              loading={actionLoading}
              disabled={actionLoading || isFinalized || !reworkForm.quantity || Number(reworkForm.quantity) <= 0 || Number(reworkForm.quantity) > pendingQty}
              icon={RotateCcw}
            >
              Confirm REWORK & Open CAPA
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* 3. Modal: REJECT Confirmation Dialog                     */}
      {/* ======================================================== */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Confirm Quality Decision: REJECTED & Log Scrap"
        size="md"
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-red-500/10 text-red-300 rounded-xl border border-red-500/30 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-red-400">Mark Items as Failed & Scrap</p>
              <p className="mt-0.5 text-[#94a3b8]">
                Batch failed quality tolerance. The rejected quantity will be quarantined, logged as scrap against Work Order {inspection?.workOrder?.workOrderNo}, and excluded from Dispatch.
              </p>
            </div>
          </div>

          {/* Audit & Context Summary */}
          <div className="p-3 bg-[#0a1020] rounded-xl border border-[#1e2a4a] space-y-2">
            <div className="flex justify-between py-1 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8]">Inspection Reference:</span>
              <span className="font-mono font-bold text-[#f1f5f9]">{inspection?.inspectionNo}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8]">Work Order:</span>
              <span className="font-mono font-semibold text-blue-400">{inspection?.workOrder?.workOrderNo}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1e2a4a]">
              <span className="text-[#94a3b8]">Selected Decision:</span>
              <StatusBadge status="FAIL" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#f1f5f9] font-medium mb-1">
                Quality Officer <span className="text-rose-400">*</span>
              </label>
              <select
                value={decisionOfficer}
                onChange={(e) => setDecisionOfficer(e.target.value)}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2.5 focus:outline-none focus:border-[#3b82f6]"
                required
              >
                <option value="">-- Select Quality Officer --</option>
                {refData.users.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} {u.role ? `(${u.role})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[#f1f5f9] font-medium mb-1">
                Rejected Quantity <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={pendingQty > 0 ? pendingQty : 0}
                value={rejectForm.quantity}
                onChange={(e) => setRejectForm({ ...rejectForm, quantity: e.target.value })}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2.5 font-bold font-mono focus:outline-none focus:border-[#3b82f6]"
                required
              />
            </div>
          </div>

          <div>
            <CustomDropdown
              label="Defect Category"
              category="defectType"
              categoryLabel="Defect Category"
              value={rejectForm.defectType}
              onChange={(val) => setRejectForm({ ...rejectForm, defectType: val })}
              placeholder="-- Select Defect Category --"
            />
          </div>

          <div>
            <CustomDropdown
              label="Rejection Reason & Root Defect Description"
              required
              category="rejectionReason"
              categoryLabel="Rejection Reason"
              value={rejectForm.defectReason}
              onChange={(val) => setRejectForm({ ...rejectForm, defectReason: val })}
              placeholder="-- Select Rejection Defect Cause --"
            />
          </div>

          <div>
            <label className="block text-[#f1f5f9] font-medium mb-1">Scrap Disposal Recommendations</label>
            <select
              value={rejectForm.disposalRecommendation}
              onChange={(e) => setRejectForm({ ...rejectForm, disposalRecommendation: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg p-2.5 focus:outline-none focus:border-[#3b82f6]"
            >
              <option value="Quarantine batch for scrap recycling; scrap credit against job order">Quarantine batch for scrap recycling; scrap credit against job order</option>
              <option value="Melt down for copper reclamation">Melt down for copper reclamation</option>
              <option value="Return to raw material supplier under warranty claim">Return to raw material supplier under warranty claim</option>
              <option value="Permanent disposal per environmental guidelines">Permanent disposal per environmental guidelines</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#1e2a4a]">
            <Button variant="secondary" onClick={() => setIsRejectModalOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              type="submit"
              className="bg-red-600 hover:bg-red-500 text-white"
              loading={actionLoading}
              disabled={actionLoading || isFinalized || !rejectForm.quantity || Number(rejectForm.quantity) <= 0 || Number(rejectForm.quantity) > pendingQty}
              icon={XCircle}
            >
              Confirm REJECTION & Log Scrap
            </Button>
          </div>
        </form>
      </Modal>
      <QRLabelModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        workOrderId={inspection?.workOrderId}
      />
    </div>
  );
}