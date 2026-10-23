import { useState } from "react";
import { X, ShieldCheck, ShoppingCart } from "lucide-react";

export default function CreateSalesOrderModal({ isOpen, onClose, quotation, onSubmit }) {
  const [orderNumber, setOrderNumber] = useState(() => `SO-2026-${String(Date.now()).slice(-3)}`);
  const [deliveryLocation, setDeliveryLocation] = useState("Direct Factory Dispatch - Site Destination");
  const [remarks, setRemarks] = useState("Sales Order officially approved and released to Factory by Sales Manager");

  if (!isOpen || !quotation) return null;

  const customerName = quotation.customer?.name || quotation.lead?.customerName || "Customer";
  const totalAmount = Number(quotation.total || 2537);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({
        orderNumber,
        quotationId: quotation.id,
        customerId: quotation.customerId || 1,
        customerPONumber: quotation.customerPONumber || `CPO-${String(Date.now()).slice(-4)}`,
        proformaInvoiceNumber: quotation.proformaInvoiceNumber || null,
        productSummary: quotation.items?.[0]?.product?.name || "GI Earthing Electrode",
        quantitySummary: String(quotation.items?.[0]?.quantity || "1"),
        totalAmount,
        deliveryLocation,
        remarks,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#10182f] border border-[#1e2a4a] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0d1424]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Issue Official Sales Order (SO)</h2>
              <p className="text-[11px] text-slate-400">Action by Sales Manager</p>
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

        {/* Notice */}
        <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Sales Manager authorization for commercial commitment and factory dispatch handover.
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Sales Order Number *
              </label>
              <input
                type="text"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full bg-[#0a1020] text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Total Order Value (₹)
              </label>
              <input
                type="text"
                readOnly
                value={`₹ ${totalAmount.toFixed(2)}`}
                className="w-full bg-[#0a1020] text-cyan-300 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Customer / Client</label>
              <input
                type="text"
                readOnly
                value={customerName}
                className="w-full bg-[#0a1020] text-slate-300 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Customer PO Reference</label>
              <input
                type="text"
                readOnly
                value={quotation.customerPONumber || "CPO Confirmed"}
                className="w-full bg-[#0a1020] text-slate-300 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Delivery Destination & Transport Mode
            </label>
            <input
              type="text"
              value={deliveryLocation}
              onChange={(e) => setDeliveryLocation(e.target.value)}
              className="w-full bg-[#0a1020] text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Sales Manager Remarks</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
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
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
            >
              Issue Sales Order & Release
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
