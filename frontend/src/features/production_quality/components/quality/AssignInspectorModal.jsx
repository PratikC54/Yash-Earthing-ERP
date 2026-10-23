import React, { useState, useEffect } from "react";
import { UserCheck, ShieldCheck, AlertCircle, RefreshCw, X } from "lucide-react";
import Modal from "../../../../components/common/Modal";
import Button from "../../../../components/common/Button";
import qualityService from "../../services/qualityService";
import { formatQuantity } from "../../utils/productionQualityHelpers";

export default function AssignInspectorModal({
  isOpen = false,
  onClose,
  inspection = null,
  onAssigned,
}) {
  const [inspectors, setInspectors] = useState([]);
  const [selectedInspectorId, setSelectedInspectorId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setNotes("");
    setSelectedInspectorId("");

    async function loadInspectors() {
      setLoading(true);
      try {
        const res = await qualityService.getEligibleInspectors();
        const list = res?.data || (Array.isArray(res) ? res : []);
        setInspectors(list);
        if (list.length > 0) {
          // If inspection already has an assigned inspector, preselect them
          if (inspection?.assignedInspectorId) {
            setSelectedInspectorId(String(inspection.assignedInspectorId));
          }
        }
      } catch (err) {
        console.error("Failed to load eligible inspectors:", err);
        setError("Failed to load certified quality inspectors from database.");
      } finally {
        setLoading(false);
      }
    }
    loadInspectors();
  }, [isOpen, inspection]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInspectorId) {
      setError("Please select a qualified Quality Inspector from the list.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await qualityService.assignInspector(inspection.id, {
        inspectorId: Number(selectedInspectorId),
        notes: notes.trim() || undefined,
      });

      if (onAssigned) {
        onAssigned(res?.data || res);
      }
      onClose();
    } catch (err) {
      console.error("Inspector assignment failed:", err);
      setError(
        err?.response?.data?.message || err?.message || "Failed to assign inspector."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!inspection) return null;

  const lotNo = inspection.inspectionNo || inspection.inspectionNumber || "—";
  const woNo = inspection.workOrderNo || inspection.workOrderNumber || inspection.workOrder?.workOrderNo || "—";
  const productName =
    inspection.productName ||
    inspection.product ||
    inspection.workOrder?.bomRevision?.product?.name ||
    "—";
  const sku =
    inspection.sku ||
    inspection.workOrder?.bomRevision?.product?.sku ||
    "";
  const qty = inspection.inspectedQuantity || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Certified Quality Inspector"
      subtitle={`Lot ${lotNo} · Work Order ${woNo}`}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs text-[#f1f5f9]">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Lot Specifications Card */}
        <div className="p-3.5 bg-[#0a1020] rounded-xl border border-[#1e2a4a] space-y-2">
          <div className="flex items-center justify-between border-b border-[#1e2a4a] pb-2 text-[11px] text-[#94a3b8]">
            <span>Production Lot Summary</span>
            <span className="font-mono text-[#3b82f6] font-bold">{lotNo}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#94a3b8] block text-[11px]">Work Order #</span>
              <span className="font-mono text-[#f1f5f9] font-semibold">{woNo}</span>
            </div>
            <div>
              <span className="text-[#94a3b8] block text-[11px]">Quantity Awaiting QC</span>
              <span className="font-mono text-emerald-400 font-bold">
                {formatQuantity(qty)}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-[#94a3b8] block text-[11px]">Product Item</span>
              <span className="font-semibold text-[#f1f5f9]">
                {productName} {sku && <span className="font-mono text-[#94a3b8] text-[11px]">({sku})</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Inspector Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#f1f5f9]">
            Select Eligible Quality Inspector <span className="text-rose-400">*</span>
          </label>
          {loading ? (
            <div className="py-3 text-center text-[#94a3b8] flex items-center justify-center gap-2 bg-[#0a1020] rounded-lg border border-[#1e2a4a]">
              <RefreshCw className="w-4 h-4 animate-spin text-[#3b82f6]" />
              <span>Loading certified inspectors...</span>
            </div>
          ) : (
            <select
              value={selectedInspectorId}
              onChange={(e) => setSelectedInspectorId(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-[#0a1020] border border-[#1e2a4a] rounded-lg text-xs text-[#f1f5f9] focus:outline-hidden focus:border-[#3b82f6] transition"
            >
              <option value="">-- Choose Quality Inspector --</option>
              {inspectors.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role.replace(/_/g, " ")}{u.department ? ` · ${u.department}` : ""})
                </option>
              ))}
            </select>
          )}
          <p className="text-[11px] text-[#94a3b8]">
            Only active users with <span className="text-blue-400 font-medium">QUALITY_INSPECTOR</span> or authorized management roles are eligible.
          </p>
        </div>

        {/* Special Instructions / Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#f1f5f9]">
            Inspection Directives / Notes <span className="text-[#94a3b8] font-normal">(Optional)</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Conduct complete galvanizing thickness & tensile shear test per IS 3043."
            className="w-full px-3 py-2 bg-[#0a1020] border border-[#1e2a4a] rounded-lg text-xs text-[#f1f5f9] placeholder:text-[#64748b] focus:outline-hidden focus:border-[#3b82f6] transition"
          />
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-[#1e2a4a] flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            icon={ShieldCheck}
            disabled={submitting || loading || !selectedInspectorId}
          >
            {submitting ? "Assigning Inspector..." : "Confirm Inspector Assignment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
