import React, { useState, useEffect } from "react";
import {
  X,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Package,
  Calendar,
  FileText,
  ExternalLink,
  Layers,
} from "lucide-react";
import * as api from "../../api/procurementApi";

export default function RestockModal({
  isOpen,
  item,
  onClose,
  onSuccess,
  onNavigate,
}) {
  const [suggestedQty, setSuggestedQty] = useState(0);
  const [notes, setNotes] = useState("");
  const [requiredBy, setRequiredBy] = useState("");
  const [existingPr, setExistingPr] = useState(null);
  const [checkingPr, setCheckingPr] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [allowDuplicate, setAllowDuplicate] = useState(false);

  // Compute calculated suggested quantity and check open PRs
  useEffect(() => {
    if (!isOpen || !item) return;

    setError(null);
    setAllowDuplicate(false);

    // Derived values
    const physical = Number(item.physicalQuantity) || 0;
    const reserved = Number(item.reservedQuantity) || 0;
    const available = Number(item.availableQuantity ?? physical - reserved);
    const reorder = Number(item.reorderLevel) || 10;

    // Deficit formula: Deficit = reorder - available; Suggested = Deficit + Reorder buffer
    const deficit = Math.max(0, reorder - available);
    const calculated = deficit + reorder;
    setSuggestedQty(calculated > 0 ? calculated : reorder);

    // Default requiredBy: 7 days from today
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);
    setRequiredBy(in7Days.toISOString().split("T")[0]);

    setNotes(`Automated stock replenishment for ${item.product?.name || item.name} (Available: ${available}, Reorder: ${reorder})`);

    // Check for open PRs covering this product ID
    const pId = item.productId || item.product?.id || item.id;
    if (pId) {
      setCheckingPr(true);
      api
        .getPurchaseRequests({ limit: 100 })
        .then((res) => {
          const prs = res?.data?.requests || res?.requests || [];
          const openPr = prs.find(
            (p) =>
              ["DRAFT", "SUBMITTED", "APPROVED"].includes(p.status) &&
              p.items?.some((i) => i.productId === pId)
          );
          setExistingPr(openPr || null);
        })
        .catch((err) => console.error("Error checking open PRs:", err))
        .finally(() => setCheckingPr(false));
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const physical = Number(item.physicalQuantity) || 0;
  const reserved = Number(item.reservedQuantity) || 0;
  const available = Number(item.availableQuantity ?? physical - reserved);
  const reorder = Number(item.reorderLevel) || 10;
  const deficit = Math.max(0, reorder - available);
  const pId = item.productId || item.product?.id || item.id;
  const pName = item.product?.name || item.name;
  const pSku = item.product?.sku || item.sku;
  const pUom = item.product?.unitOfMeasure || "UOM";

  const handleCreateDraftPr = async (e) => {
    e.preventDefault();

    if (!suggestedQty || Number(suggestedQty) <= 0) {
      setError("Please specify a valid quantity greater than 0.");
      return;
    }

    if (existingPr && !allowDuplicate) {
      setError("An open requisition already covers this product. Please check the override checkbox to proceed.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        requiredBy: requiredBy ? new Date(requiredBy).toISOString() : null,
        notes: notes.trim() || undefined,
        items: [
          {
            productId: Number(pId),
            quantity: Number(suggestedQty),
            notes: `Auto-restock (Deficit: ${deficit}, Buffer: ${reorder})`,
          },
        ],
      };

      const res = await api.createPurchaseRequest(payload);
      if (res.success || res.requestNo || res.id) {
        if (onSuccess) {
          onSuccess(`Draft Requisition created successfully for ${pName}`);
        }
        onClose();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to create draft requisition.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs transition-all animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#10182f] border border-[#1e2a4a] text-slate-100 rounded-2xl w-full max-w-lg shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>⚡ Restock Material</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  DRAFT REQUISITION
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate prefilled draft purchase request for low stock item
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Open Requisition Alert */}
        {existingPr && (
          <div className="my-4 p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-2">
            <div className="flex items-center justify-between font-bold">
              <div className="flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Open Requisition Found for this Item</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 font-mono">
                {existingPr.status}
              </span>
            </div>
            <p className="text-[11px] text-amber-300/90 leading-relaxed">
              Requisition <strong className="font-mono text-white">{existingPr.requestNo}</strong> is already open for this product. Avoid duplicating company expenditure unless this is an additional demand.
            </p>
            <div className="pt-1 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onNavigate) onNavigate("purchase-requests");
                }}
                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 inline-flex items-center space-x-1 cursor-pointer"
              >
                <span>View Existing PR #{existingPr.requestNo}</span>
                <ExternalLink className="w-3 h-3" />
              </button>

              <label className="flex items-center space-x-2 cursor-pointer text-[11px] text-slate-300">
                <input
                  type="checkbox"
                  checked={allowDuplicate}
                  onChange={(e) => setAllowDuplicate(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                />
                <span>Allow additional PR</span>
              </label>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="my-3 p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateDraftPr} className="space-y-4 my-4">
          {/* Item Context Cards */}
          <div className="p-3.5 rounded-xl bg-[#0a1020] border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-mono font-bold text-cyan-300">{pSku}</span>
                <h4 className="font-bold text-white text-sm">{pName}</h4>
              </div>
              <span className="text-slate-400 text-xs font-medium">UOM: <strong className="text-slate-200">{pUom}</strong></span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-2 border-t border-slate-800">
              <div className="p-1.5 rounded-lg bg-slate-900">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Physical</span>
                <span className="font-mono font-bold text-slate-200">{physical}</span>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-900">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Reserved</span>
                <span className="font-mono font-bold text-amber-400">{reserved}</span>
              </div>
              <div className="p-1.5 rounded-lg bg-rose-950/30 border border-rose-500/20">
                <span className="text-rose-300 block text-[9px] uppercase font-bold">Free Stock</span>
                <span className="font-mono font-bold text-rose-400">{available} vs {reorder} Min</span>
              </div>
            </div>
          </div>

          {/* Suggested Quantity Input with Explanatory breakdown */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-200">
                Suggested Order Quantity ({pUom})
              </label>
              <span className="text-[11px] text-cyan-400 font-medium">
                Deficit ({deficit}) + Safety Buffer ({reorder})
              </span>
            </div>
            <input
              type="number"
              min="1"
              step="any"
              value={suggestedQty}
              onChange={(e) => setSuggestedQty(e.target.value)}
              className="w-full bg-[#0a1020] border border-slate-700 rounded-xl px-3.5 py-2 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              required
            />
            <p className="text-[10px] text-slate-400 leading-tight">
              Calculated to bring free stock back to double the configured reorder threshold. You may freely modify this number based on minimum batch orders.
            </p>
          </div>

          {/* Required By Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 block">
              Required Delivery Date
            </label>
            <input
              type="date"
              value={requiredBy}
              onChange={(e) => setRequiredBy(e.target.value)}
              className="w-full bg-[#0a1020] border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Requisition Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 block">
              Requisition Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add justification or specific supplier notes..."
              className="w-full bg-[#0a1020] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          {/* Safety Disclosure Note */}
          <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/20 text-[11px] text-cyan-300/90 leading-relaxed">
            ℹ️ <strong>Safety Policy:</strong> Clicking "Create Draft PR" generates a non-binding <code>DRAFT</code> requisition. It does not issue a Purchase Order or commit financial spend until approved by a Procurement Officer.
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (existingPr && !allowDuplicate)}
              className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-md ${
                submitting || (existingPr && !allowDuplicate)
                  ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                  : "bg-cyan-500 hover:bg-cyan-400 text-slate-950"
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{submitting ? "Creating Draft..." : "Create Draft PR"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

