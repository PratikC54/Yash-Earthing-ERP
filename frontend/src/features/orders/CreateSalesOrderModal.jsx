import { useState, useEffect } from "react";
import { X, ShieldCheck, ShoppingCart, Loader2, Clock, Calendar } from "lucide-react";

export default function CreateSalesOrderModal({
  isOpen,
  onClose,
  quotation,
  onSubmit,
  isLoading = false,
  availableQuotations = [],
  onSelectQuotation,
}) {
  const [orderNumber, setOrderNumber] = useState(() => `SO-2026-${String(Date.now()).slice(-3)}`);
  const [deliveryLocation, setDeliveryLocation] = useState("Direct Factory Dispatch - Site Destination");
  const [remarks, setRemarks] = useState("Sales Order officially approved and released to Factory by Sales Manager");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));

  // Live real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update order number whenever modal opens fresh
  useEffect(() => {
    if (isOpen) {
      setOrderNumber(`SO-2026-${String(Date.now()).slice(-3)}`);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const customerName = quotation?.customer?.name || quotation?.lead?.customerName || "Customer";
  const totalAmount = Number(quotation?.total || 2537);
  const currentDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit({
          orderNumber,
          quotationId: quotation?.id || null,
          customerId: quotation?.customerId || 1,
          customerPONumber: quotation?.customerPONumber || `CPO-${String(Date.now()).slice(-4)}`,
          proformaInvoiceNumber: quotation?.proformaInvoiceNumber || null,
          productSummary: quotation?.items?.[0]?.product?.name || "GI Earthing Electrode",
          quantitySummary: String(quotation?.items?.[0]?.quantity || "1"),
          totalAmount,
          deliveryLocation,
          remarks,
          createdAt: new Date().toISOString(),
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-auto text-slate-800 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0c1222] text-[#d4ff00] flex items-center justify-center shadow-xs">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#0f172a]">Issue Official Sales Order (SO)</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[11px] font-semibold text-slate-500">Action by Sales Manager</p>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-100 font-mono font-bold px-1.5 py-0.2 rounded">
                  <Clock className="w-3 h-3 text-emerald-700" />
                  Live IST: {currentDate} {currentTime}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice */}
        <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center gap-2.5 text-xs text-emerald-950 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            Sales Manager authorization for commercial commitment and factory dispatch handover.
          </span>
        </div>

        {/* Select Linked Approved Quotation if multiple available */}
        {availableQuotations.length > 1 && onSelectQuotation && (
          <div className="mx-6 mt-3">
            <label className="block text-slate-700 font-bold mb-1 text-[11px]">
              Select Approved Quotation Reference
            </label>
            <select
              value={quotation?.id || ""}
              onChange={(e) => {
                const found = availableQuotations.find((q) => String(q.id) === String(e.target.value));
                if (found) onSelectQuotation(found);
              }}
              className="w-full bg-white text-slate-900 text-xs px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none focus:border-[#0c1222] shadow-xs"
              style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
            >
              {availableQuotations.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.quotationNo} · {q.customer?.name || q.lead?.customerName} (₹{Number(q.total || 0).toLocaleString("en-IN")})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Sales Order Number *
              </label>
              {isLoading ? (
                <div className="h-10 bg-slate-100 rounded-xl border border-slate-200 animate-pulse flex items-center px-3.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 mr-2" />
                  <span className="text-slate-400 font-mono text-xs">Generating SO number...</span>
                </div>
              ) : (
                <input
                  type="text"
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full bg-white text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0c1222] font-mono font-bold shadow-xs"
                  style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                />
              )}
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Total Order Value (₹)
              </label>
              {isLoading ? (
                <div className="h-10 bg-emerald-50/60 rounded-xl border border-emerald-200 animate-pulse flex items-center px-3.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 mr-2" />
                  <span className="text-emerald-700 font-mono text-xs">Calculating value...</span>
                </div>
              ) : (
                <input
                  type="text"
                  readOnly
                  value={`₹ ${totalAmount.toFixed(2)}`}
                  className="w-full bg-emerald-50/60 text-emerald-800 text-xs px-3.5 py-2.5 rounded-xl border border-emerald-300 font-mono font-black shadow-xs"
                  style={{ backgroundColor: '#f0fdf4', color: '#065f46' }}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Customer / Client</label>
              {isLoading ? (
                <div className="h-10 bg-slate-50 rounded-xl border border-slate-200 animate-pulse flex items-center px-3.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 mr-2" />
                  <span className="text-slate-400 text-xs">Loading customer info...</span>
                </div>
              ) : (
                <input
                  type="text"
                  readOnly
                  value={customerName}
                  className="w-full bg-slate-50 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold"
                  style={{ backgroundColor: '#f8fafc', color: '#1e293b' }}
                />
              )}
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Customer PO Reference</label>
              {isLoading ? (
                <div className="h-10 bg-slate-50 rounded-xl border border-slate-200 animate-pulse flex items-center px-3.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 mr-2" />
                  <span className="text-slate-400 font-mono text-xs">Verifying PO...</span>
                </div>
              ) : (
                <input
                  type="text"
                  readOnly
                  value={quotation?.customerPONumber || "CPO Confirmed"}
                  className="w-full bg-slate-50 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                  style={{ backgroundColor: '#f8fafc', color: '#1e293b' }}
                />
              )}
            </div>
          </div>

          {/* Real-Time IST Release Stamp */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <span className="text-slate-600 font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Release Timestamp (Real-Time):</span>
            </span>
            <span className="font-mono font-bold text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-xs">
              {currentDate} · {currentTime}
            </span>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Delivery Destination & Transport Mode
            </label>
            <input
              type="text"
              value={deliveryLocation}
              onChange={(e) => setDeliveryLocation(e.target.value)}
              className="w-full bg-white text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0c1222] font-semibold shadow-xs"
              style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Sales Manager Remarks</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full bg-white text-slate-900 text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0c1222] font-medium shadow-xs"
              style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="px-5 py-2.5 bg-[#d4ff00] hover:bg-[#bce600] text-black text-xs font-black rounded-xl shadow-md transition cursor-pointer flex items-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Issuing Sales Order & Releasing...</span>
                </>
              ) : (
                <span>Issue Sales Order & Release</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
