import React, { useState, useEffect, useCallback } from "react";
import { Plus, ShieldAlert, AlertCircle, RefreshCw } from "lucide-react";
import ModuleHeader from "../components/shared/ModuleHeader";
import NonConformanceTable from "../components/quality/NonConformanceTable";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import qualityService from "../services/qualityService";
import { validateQuantityInput, validateRequiredField, validateMinLength } from "../utils/formValidation";

export default function NonConformancePage() {
  const [ncrs, setNcrs] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [isNcrModalOpen, setIsNcrModalOpen] = useState(false);
  const [isScrapModalOpen, setIsScrapModalOpen] = useState(false);

  const [ncrFormData, setNcrFormData] = useState({
    inspectionId: "",
    defectType: "",
    severity: "",
    description: "",
    rootCause: "",
    proposedAction: "",
  });

  const [scrapFormData, setScrapFormData] = useState({
    inspectionId: "",
    quantity: "",
    reason: "",
    scrapCost: "",
  });

  const loadNcrs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ncrRes, insRes] = await Promise.all([
        qualityService.listNonConformances(),
        qualityService.getInspectionReport(),
      ]);
      const ncrList = ncrRes?.data || (Array.isArray(ncrRes) ? ncrRes : []);
      const insList = insRes?.data || (Array.isArray(insRes) ? insRes : []);
      setNcrs(ncrList);
      setInspections(insList);
      if (insList.length > 0) {
        setNcrFormData((prev) => ({ ...prev, inspectionId: insList[0].id }));
        setScrapFormData((prev) => ({ ...prev, inspectionId: insList[0].id }));
      }
    } catch (err) {
      console.error("Failed to load NCR list:", err);
      setError(err?.message || "Failed to load non-conformance records from database.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNcrs();
  }, [loadNcrs]);

  const handleNcrSubmit = async (e) => {
    e.preventDefault();
    setActionError("");

    if (!ncrFormData.inspectionId) {
      setActionError("Please select an inspection.");
      return;
    }
    if (!ncrFormData.severity) {
      setActionError("Please select defect severity.");
      return;
    }
    if (!ncrFormData.defectType) {
      setActionError("Please select a defect type.");
      return;
    }
    const descErr = validateMinLength(ncrFormData.description, 5, "Defect description");
    if (descErr) {
      setActionError(descErr);
      return;
    }
    const causeErr = validateMinLength(ncrFormData.rootCause, 5, "Root cause");
    if (causeErr) {
      setActionError(causeErr);
      return;
    }
    if (!ncrFormData.proposedAction) {
      setActionError("Please select a proposed disposition/action.");
      return;
    }

    setSubmitting(true);
    try {
      await qualityService.recordNonConformance({
        ...ncrFormData,
        inspectionId: Number(ncrFormData.inspectionId),
      });
      setIsNcrModalOpen(false);
      setNcrFormData({
        inspectionId: inspections[0]?.id || "",
        defectType: "",
        severity: "",
        description: "",
        rootCause: "",
        proposedAction: "",
      });
      await loadNcrs();
    } catch (err) {
      setActionError(err?.message || "Failed to record NCR.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleScrapSubmit = async (e) => {
    e.preventDefault();
    setActionError("");

    if (!scrapFormData.inspectionId) {
      setActionError("Please select an inspection.");
      return;
    }
    const qtyErr = validateQuantityInput(scrapFormData.quantity, {
      uom: "NOS",
      allowZero: false,
      fieldName: "Scrap quantity",
    });
    if (qtyErr) {
      setActionError(qtyErr);
      return;
    }
    const reasonErr = validateMinLength(scrapFormData.reason, 3, "Scrap reason");
    if (reasonErr) {
      setActionError(reasonErr);
      return;
    }
    if (scrapFormData.scrapCost !== undefined && scrapFormData.scrapCost !== "" && scrapFormData.scrapCost !== null) {
      const costErr = validateQuantityInput(scrapFormData.scrapCost, {
        allowZero: true,
        fieldName: "Estimated scrap cost",
      });
      if (costErr) {
        setActionError(costErr);
        return;
      }
    }

    setSubmitting(true);
    try {
      await qualityService.approveScrap({
        ...scrapFormData,
        inspectionId: Number(scrapFormData.inspectionId),
        quantity: Number(scrapFormData.quantity),
        scrapCost: Number(scrapFormData.scrapCost || 0),
      });
      setIsScrapModalOpen(false);
      await loadNcrs();
    } catch (err) {
      setActionError(err?.message || "Failed to record scrap authorization.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Non-Conformance Reports (NCR) & CAPA"
        subtitle="Manage product deviations, root cause analyses, corrective actions, and scrap write-offs."
        breadcrumbs={[
          { label: "Production & Quality", to: "/production-quality/planning" },
          { label: "Non-Conformance" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={ShieldAlert}
              onClick={() => setIsScrapModalOpen(true)}
            >
              Authorize Scrap
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsNcrModalOpen(true)}
            >
              Log New NCR
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
            onClick={loadNcrs}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-semibold cursor-pointer transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Active Non-Conformances">
          <p className="text-2xl font-bold text-red-400">{ncrs.length}</p>
          <p className="text-xs text-[#94a3b8] mt-1">Pending investigation & rework</p>
        </Card>
        <Card title="Open CAPA Directives">
          <p className="text-2xl font-bold text-amber-400">
            {ncrs.filter((n) => n.proposedAction === "REWORK").length}
          </p>
          <p className="text-xs text-[#94a3b8] mt-1">Active corrective re-processing directives</p>
        </Card>
        <Card title="Scrap Disposition / Defective">
          <p className="text-2xl font-bold text-[#2DD4BF]">
            {ncrs.filter((n) => n.proposedAction === "SCRAP").length} Units
          </p>
          <p className="text-xs text-[#94a3b8] mt-1">Authorized scrap write-offs</p>
        </Card>
      </div>

      {/* NCRs Table */}
      <NonConformanceTable ncrs={ncrs} loading={loading} />

      {/* Log NCR Modal */}
      <Modal
        isOpen={isNcrModalOpen}
        onClose={() => setIsNcrModalOpen(false)}
        title="Log Non-Conformance Report (NCR)"
        subtitle="Document defect severity, immediate containment, and root cause"
      >
        <form onSubmit={handleNcrSubmit} className="space-y-4 text-xs">
          {actionError && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1 text-[#94a3b8]">Select Inspection</label>
              <select
                value={ncrFormData.inspectionId}
                onChange={(e) => setNcrFormData({ ...ncrFormData, inspectionId: e.target.value })}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#3b82f6]"
                required
              >
                {inspections.length === 0 ? (
                  <option value="" disabled>No inspections available</option>
                ) : (
                  inspections.map((ins) => (
                    <option key={ins.id} value={ins.id}>
                      {ins.inspectionNo || "—"} — {ins.productName || "—"} (WO: {ins.workOrderNo || "—"})
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1 text-[#94a3b8]">Severity</label>
              <select
                value={ncrFormData.severity}
                onChange={(e) => setNcrFormData({ ...ncrFormData, severity: e.target.value })}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#3b82f6]"
                required
              >
                <option value="" disabled>Select severity</option>
                <option value="CRITICAL">Critical (Safety / Electrical Spec)</option>
                <option value="MAJOR">Major (Dimensional / Coating)</option>
                <option value="MINOR">Minor (Cosmetic / Packaging)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1 text-[#94a3b8]">Defect Classification <span className="text-[#3b82f6] text-[10px]">(Standard Defect Codes)</span></label>
            <select
              value={ncrFormData.defectType}
              onChange={(e) => setNcrFormData({ ...ncrFormData, defectType: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#3b82f6]"
              required
            >
              <option value="">-- Select Defect Code --</option>
              <option value="COATING_PEELING">COATING_PEELING · Coating Adhesion Failure / Peeling</option>
              <option value="METALLURGICAL_DEFECT">METALLURGICAL_DEFECT · Metallurgical Defect / Core Flaw</option>
              <option value="DIMENSIONAL_OUT_OF_SPEC">DIMENSIONAL_OUT_OF_SPEC · Critical Dimensional Variance</option>
              <option value="HIGH_RESISTANCE">HIGH_RESISTANCE · Electrical Resistance Exceeds Spec</option>
              <option value="SURFACE_PITTING">SURFACE_PITTING · Severe Surface Porosity / Pitting</option>
              <option value="THREAD_STRIPPING">THREAD_STRIPPING · Terminal Thread Stripping</option>
              <option value="BENT_ROD">BENT_ROD · Core Mechanical Straightness Deviation</option>
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1 text-[#94a3b8]">Detailed Description</label>
            <textarea
              rows="2"
              placeholder="Provide exact measurements and quarantine location..."
              value={ncrFormData.description}
              onChange={(e) => setNcrFormData({ ...ncrFormData, description: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] placeholder-[#64748b] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#3b82f6]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1 text-[#94a3b8]">Initial Root Cause Hypothesis</label>
              <select
                value={ncrFormData.rootCause}
                onChange={(e) => setNcrFormData({ ...ncrFormData, rootCause: e.target.value })}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#3b82f6]"
              >
                <option value="">-- Select Suspected Root Cause --</option>
                <option value="Plating immersion temperature variance">Plating immersion temperature variance</option>
                <option value="Raw material copper rod alloy impurity">Raw material copper rod alloy impurity</option>
                <option value="Die wear on thread roller">Die wear on thread roller</option>
                <option value="Surface oxidation prior to electroplating">Surface oxidation prior to electroplating</option>
                <option value="Handling damage during inter-station transport">Handling damage during inter-station transport</option>
                <option value="Current density fluctuation during electrodeposition">Current density fluctuation during electrodeposition</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1 text-[#94a3b8]">Proposed Disposition</label>
              <select
                value={ncrFormData.proposedAction}
                onChange={(e) => setNcrFormData({ ...ncrFormData, proposedAction: e.target.value })}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#3b82f6]"
                required
              >
                <option value="" disabled>Select disposition</option>
                <option value="REWORK">Rework</option>
                <option value="SCRAP">Scrap</option>
                <option value="CONCESSION">Concession / Down-rate</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#1e2a4a]">
            <Button variant="secondary" size="sm" onClick={() => setIsNcrModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={submitting}>
              Log NCR
            </Button>
          </div>
        </form>
      </Modal>

      {/* Authorize Scrap Modal */}
      <Modal
        isOpen={isScrapModalOpen}
        onClose={() => setIsScrapModalOpen(false)}
        title="Authorize Scrap Write-Off"
        subtitle="Permanent disposal authorization for non-recoverable units"
      >
        <form onSubmit={handleScrapSubmit} className="space-y-4 text-xs">
          {actionError && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1 text-[#94a3b8]">Select Inspection</label>
              <select
                value={scrapFormData.inspectionId}
                onChange={(e) => setScrapFormData({ ...scrapFormData, inspectionId: e.target.value })}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#3b82f6]"
                required
              >
                {inspections.length === 0 ? (
                  <option value={scrapFormData.inspectionId}>Inspection #{scrapFormData.inspectionId}</option>
                ) : (
                  inspections.map((ins) => (
                    <option key={ins.id} value={ins.id}>
                      {ins.inspectionNo || "—"} — {ins.productName || "—"} (WO: {ins.workOrderNo || "—"})
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1 text-[#94a3b8]">Quantity to Scrap</label>
              <input
                type="number"
                min="1"
                value={scrapFormData.quantity}
                onChange={(e) => setScrapFormData({ ...scrapFormData, quantity: e.target.value })}
                className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#3b82f6]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1 text-[#94a3b8]">Scrap Justification Reason</label>
            <select
              value={scrapFormData.reason}
              onChange={(e) => setScrapFormData({ ...scrapFormData, reason: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#3b82f6]"
              required
            >
              <option value="">-- Select Scrap Reason --</option>
              <option value="Non-recoverable plating delamination">Non-recoverable plating delamination</option>
              <option value="Radial structural crack">Radial structural crack</option>
              <option value="Severe wall thinning post-pickling">Severe wall thinning post-pickling</option>
              <option value="Failed metallurgical core composition">Failed metallurgical core composition</option>
              <option value="Severe dimension failure non-reworkable">Severe dimension failure non-reworkable</option>
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1 text-[#94a3b8]">Estimated Cost Impact (INR)</label>
            <input
              type="number"
              min="0"
              value={scrapFormData.scrapCost}
              onChange={(e) => setScrapFormData({ ...scrapFormData, scrapCost: e.target.value })}
              className="w-full bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#3b82f6]"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#1e2a4a]">
            <Button variant="secondary" size="sm" onClick={() => setIsScrapModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" type="submit" loading={submitting}>
              Authorize Scrap
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
