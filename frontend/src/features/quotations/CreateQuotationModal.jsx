import { useState } from "react";
import { X, Plus, Trash2, FileText } from "lucide-react";

export default function CreateQuotationModal({ isOpen, onClose, leads = [], onSubmit }) {
  const [selectedLeadId, setSelectedLeadId] = useState(() => leads[0]?.id || "");
  const [items, setItems] = useState([
    {
      productId: 1,
      sku: "YGGI501F",
      name: "GI Earthing Electrode",
      description:
        'YASH Make "GI Earthing Electrode" Chemical Earthing System Outer Electrode Dia 50MM & 1 FEET Long, Tightly Filled with Crystalline Conductor Mixture, Hot Dip Galvanized Along with Digital Bag of Back Fill Compound 5KG',
      quantity: 1,
      rate: 2150,
      gstPercent: 18,
    },
  ]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [freightAmount, setFreightAmount] = useState(0);
  const [paymentTerms, setPaymentTerms] = useState("100% Advance against PI");
  const [deliveryTerms, setDeliveryTerms] = useState("Ex-Works Pune / Road Transport");

  if (!isOpen) return null;

  const currentLead = leads.find((l) => String(l.id) === String(selectedLeadId)) || leads[0];

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        productId: 2,
        sku: "ESE-LA",
        name: "ESE Lightning Arrester",
        description: "Yash ESE Lightning Arrester with 107m protection radius",
        quantity: 1,
        rate: 142000,
        gstPercent: 18,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, idx) => idx !== index));
    }
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, [field]: value } : it))
    );
  };

  const subtotal = items.reduce((acc, it) => acc + Number(it.quantity || 1) * Number(it.rate || 0), 0);
  const taxable = Math.max(0, subtotal - Number(discountAmount || 0) + Number(freightAmount || 0));
  const cgst = taxable * 0.09;
  const sgst = taxable * 0.09;
  const grandTotal = taxable + cgst + sgst;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentLead) {
      alert("Please select an active lead or customer.");
      return;
    }

    if (onSubmit) {
      onSubmit({
        leadId: currentLead.id,
        customerId: currentLead.customerId || 1,
        items,
        subtotal,
        discountAmount: Number(discountAmount),
        freightAmount: Number(freightAmount),
        taxableAmount: taxable,
        gstPercent: 18,
        gstAmount: cgst + sgst,
        total: grandTotal,
        paymentTerms,
        deliveryTerms,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#10182f] border border-[#1e2a4a] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0d1424] shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-cyan-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Issue Official Quotation</h2>
              <p className="text-[11px] text-slate-400">
                Action by Back Officer (BO → Sales Rep → Client)
              </p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Select Lead */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Select Finalized Lead / Customer *
              </label>
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="w-full bg-[#0a1020] text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} · {l.customerName} ({l.productName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Client Contact Details
              </label>
              <div className="bg-[#0a1020] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-400">
                {currentLead?.contactName || "Contact Person"} | {currentLead?.phone || "No phone"} | {currentLead?.city || "Pune"}
              </div>
            </div>
          </div>

          {/* Line Items Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white uppercase text-[11px] tracking-wider">
                Quotation Line Items
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="bg-[#0a1020] border border-slate-800 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                >
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] text-slate-400 mb-1">Item SKU / Name</label>
                    <input
                      type="text"
                      value={it.name}
                      onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                      className="w-full bg-[#10182f] text-slate-100 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[10px] text-slate-400 mb-1">Description / Spec</label>
                    <input
                      type="text"
                      value={it.description}
                      onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                      className="w-full bg-[#10182f] text-slate-100 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-400 mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={it.quantity}
                      onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                      className="w-full bg-[#10182f] text-slate-100 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-400 mb-1">Rate (₹)</label>
                    <input
                      type="number"
                      value={it.rate}
                      onChange={(e) => handleItemChange(idx, "rate", e.target.value)}
                      className="w-full bg-[#10182f] text-slate-100 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700"
                    />
                  </div>

                  <div className="sm:col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={items.length === 1}
                      className="p-1.5 text-slate-400 hover:text-red-400 disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Discounts, Freight & Calculation Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="w-full bg-[#0a1020] text-slate-100 text-xs px-3.5 py-2 rounded-xl border border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Freight (₹)</label>
                  <input
                    type="number"
                    value={freightAmount}
                    onChange={(e) => setFreightAmount(e.target.value)}
                    className="w-full bg-[#0a1020] text-slate-100 text-xs px-3.5 py-2 rounded-xl border border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Payment Terms</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full bg-[#0a1020] text-slate-100 text-xs px-3.5 py-2 rounded-xl border border-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Delivery Terms</label>
                <input
                  type="text"
                  value={deliveryTerms}
                  onChange={(e) => setDeliveryTerms(e.target.value)}
                  className="w-full bg-[#0a1020] text-slate-100 text-xs px-3.5 py-2 rounded-xl border border-slate-800"
                />
              </div>
            </div>

            <div className="bg-[#0a1020] border border-slate-800 rounded-xl p-4 space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-300 text-xs">
                <span>Subtotal:</span>
                <span>₹ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300 text-xs">
                <span>Discount:</span>
                <span>- ₹ {Number(discountAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300 text-xs">
                <span>Taxable Amount:</span>
                <span>₹ {taxable.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300 text-xs">
                <span>GST (18% - 9% CGST + 9% SGST):</span>
                <span>₹ {(cgst + sgst).toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-sm font-bold text-cyan-300">
                <span>GRAND TOTAL:</span>
                <span>₹ {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
            >
              Generate Quotation & Render HTML
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
