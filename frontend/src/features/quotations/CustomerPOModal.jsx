import { useState } from "react";
import { X, FileCheck } from "lucide-react";

export default function CustomerPOModal({ isOpen, onClose, quotation, onSubmit }) {
  const [poNumber, setPoNumber] = useState(() => `CPO-2026-${String(Date.now()).slice(-4)}`);
  const [poDate, setPoDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [deliveryTerms, setDeliveryTerms] = useState("Direct Factory Dispatch / Road Transport");
  const [notes, setNotes] = useState("Customer confirmed official purchase order");

  if (!isOpen || !quotation) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!poNumber) {
      alert("Please provide the Customer Purchase Order (PO) number.");
      return;
    }
    if (onSubmit) {
      onSubmit(quotation.id, {
        poNumber,
        poDate,
        deliveryTerms,
        notes,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden my-auto text-slate-800 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0c1222] text-[#d4ff00] flex items-center justify-center shadow-xs">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#0f172a]">Record Customer Purchase Order</h2>
              <p className="text-[11px] font-semibold text-slate-500">Action by Back Officer (BO)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="mx-6 mt-4 p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-slate-800">
          <div className="font-bold text-blue-900">Linked Quotation: {quotation.quotationNo}</div>
          <div className="text-[11px] text-slate-600 font-medium mt-0.5">
            Client: <span className="font-bold text-slate-900">{quotation.customer?.name || quotation.lead?.customerName || "Customer"}</span> | Total: <span className="font-mono font-bold text-emerald-700">₹{Number(quotation.total || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Customer PO Number *
            </label>
            <input
              type="text"
              required
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              placeholder="e.g. CPO-2026-101"
              className="w-full bg-white text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0c1222] font-mono font-bold shadow-xs"
              style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              PO Receipt Date
            </label>
            <input
              type="date"
              required
              value={poDate}
              onChange={(e) => setPoDate(e.target.value)}
              className="w-full bg-white text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0c1222] font-semibold shadow-xs"
              style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Delivery Scope & Terms
            </label>
            <input
              type="text"
              value={deliveryTerms}
              onChange={(e) => setDeliveryTerms(e.target.value)}
              className="w-full bg-white text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0c1222] font-semibold shadow-xs"
              style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Back Officer Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white text-slate-900 text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0c1222] font-medium shadow-xs"
              style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#d4ff00] hover:bg-[#bce600] text-black text-xs font-black rounded-xl shadow-md transition cursor-pointer"
            >
              Issue Customer PO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
