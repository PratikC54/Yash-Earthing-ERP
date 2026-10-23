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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#10182f] border border-[#1e2a4a] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0d1424]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Record Customer Purchase Order</h2>
              <p className="text-[11px] text-slate-400">Action by Back Officer (BO)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="mx-6 mt-4 p-3 bg-blue-950/30 border border-blue-600/30 rounded-xl text-xs text-slate-300">
          <div className="font-semibold text-white">Linked Quotation: {quotation.quotationNo}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Client: {quotation.customer?.name || quotation.lead?.customerName || "Customer"} | Total: ₹{Number(quotation.total || 0).toFixed(2)}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Customer PO Number *
            </label>
            <input
              type="text"
              required
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              placeholder="e.g. CPO-2026-101"
              className="w-full bg-[#0a1020] text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              PO Receipt Date
            </label>
            <input
              type="date"
              required
              value={poDate}
              onChange={(e) => setPoDate(e.target.value)}
              className="w-full bg-[#0a1020] text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Delivery Scope & Terms
            </label>
            <input
              type="text"
              value={deliveryTerms}
              onChange={(e) => setDeliveryTerms(e.target.value)}
              className="w-full bg-[#0a1020] text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Back Officer Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#0a1020] text-slate-100 text-xs px-3.5 py-2 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
            >
              Issue Customer PO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
