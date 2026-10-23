import { useState, useEffect } from "react";
import { X, Plus, Trash2, FileText, AlertCircle, Percent, Truck } from "lucide-react";
import { engineeringService } from "../../../services/engineeringService";

const CATALOG_PRODUCTS = [
  {
    productId: 1,
    sku: "YGGI501F",
    name: "GI Earthing Electrode",
    description: 'YASH Make "GI Earthing Electrode" Chemical Earthing System Outer Electrode Dia 50MM & 1 FEET Long, Hot Dip Galvanized with 5KG Backfill',
    rate: 2150,
    gstPercent: 18,
  },
  {
    productId: 2,
    sku: "SKU-CBE-50-3M",
    name: "Copper Bonded Earthing Electrode 50mm x 3m",
    description: "Premium dual-pipe chemical earthing electrode with crystalline mineral paste filling (250 Microns Copper)",
    rate: 3450,
    gstPercent: 18,
  },
  {
    productId: 3,
    sku: "SKU-CP-48-3M",
    name: "Pure Copper Chemical Earthing Electrode 48mm x 3m",
    description: "100% Electrolytic ETP copper pipe chemical electrode for high critical substation earthing",
    rate: 7800,
    gstPercent: 18,
  },
  {
    productId: 4,
    sku: "ESE-LA-107M",
    name: "ESE Lightning Arrester 107m Terminal",
    description: "Yash Early Streamer Emission active lightning protection terminal (Tested to NFC 17-102:2011)",
    rate: 142000,
    gstPercent: 18,
  },
  {
    productId: 5,
    sku: "BFC-25KG",
    name: "Ground Enhancing Compound (Backfill 25kg)",
    description: "Carbon and bentonite based low resistivity conductivity backfill material (<0.05 ohm-m)",
    rate: 850,
    gstPercent: 18,
  },
  {
    productId: 6,
    sku: "PIT-FRP-5T",
    name: "Heavy Duty FRP Earth Pit Inspection Chamber",
    description: "Factory molded non-conductive FRP pit cover with 5-ton load capacity and testing terminal access",
    rate: 1150,
    gstPercent: 18,
  },
  {
    productId: 7,
    sku: "CU-STRIP-25X3",
    name: "Bare Electrolytic Copper Strip 25x3mm",
    description: "High conductivity annealed copper earthing tape per kg/meter",
    rate: 980,
    gstPercent: 18,
  }
];

const STANDARD_PAYMENT_TERMS = [
  "100% Advance against PI",
  "50% Advance, 50% Against Dispatch Notice",
  "Net 15 Days from Invoice Date",
  "Net 30 Days from Invoice Date",
  "Net 45 Days (Utility / Govt EPC)"
];

const STANDARD_DELIVERY_TERMS = [
  "Ex-Works Pune / Road Transport",
  "FOR Destination / Site Delivered",
  "Door Delivery via VRL / TCI Freight",
  "Immediate Factory Handover (Customer Vehicle)"
];

export default function CreateQuotationModal({ isOpen, onClose, leads = [], onSubmit }) {
  const [selectedLeadId, setSelectedLeadId] = useState(() => leads[0]?.id || "");
  const [catalogProducts, setCatalogProducts] = useState(CATALOG_PRODUCTS);
  const [items, setItems] = useState([
    {
      productId: 1,
      sku: "YGGI501F",
      name: "GI Earthing Electrode",
      description: 'YASH Make "GI Earthing Electrode" Chemical Earthing System Outer Electrode Dia 50MM & 1 FEET Long, Hot Dip Galvanized with 5KG Backfill',
      quantity: 1,
      rate: 2150,
      gstPercent: 18,
    },
  ]);

  // Dynamically load active catalog products from Module 3 (Engineering Master)
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    engineeringService
      .getProducts()
      .then((res) => {
        const prods = res?.products || res?.data || (Array.isArray(res) ? res : []);
        if (isMounted && prods.length > 0) {
          const finished = prods.filter(
            (p) => p.status !== "ARCHIVED" && p.itemType !== "RAW_MATERIAL"
          );
          if (finished.length > 0) {
            setCatalogProducts(
              finished.map((p) => ({
                productId: p.id,
                sku: p.sku,
                name: p.name,
                description: p.description || p.material || p.name,
                rate: Number(p.rate) || 2000,
                gstPercent: Number(p.gstPercent) || 18,
              }))
            );
          }
        }
      })
      .catch((err) => {
        console.warn("Using fallback catalog products:", err);
      });
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Discount configuration with presets
  const [discountType, setDiscountType] = useState("PERCENT_0"); // PERCENT_0, PERCENT_2, PERCENT_5, PERCENT_10, PERCENT_15, CUSTOM
  const [customDiscount, setCustomDiscount] = useState(0);

  // Freight configuration with presets
  const [freightType, setFreightType] = useState("EX_WORKS_0"); // EX_WORKS_0, LOCAL_450, MH_1200, INTERSTATE_2500, HEAVY_4500, CUSTOM
  const [customFreight, setCustomFreight] = useState(0);

  const [paymentTerms, setPaymentTerms] = useState("100% Advance against PI");
  const [deliveryTerms, setDeliveryTerms] = useState("Ex-Works Pune / Road Transport");

  if (!isOpen) return null;

  const currentLead = leads.find((l) => String(l.id) === String(selectedLeadId)) || leads[0];

  // Calculate Subtotal strictly >= 0
  const subtotal = items.reduce(
    (acc, it) => acc + Math.max(1, Number(it.quantity || 1)) * Math.max(0, Number(it.rate || 0)),
    0
  );

  // Derive active discount (Capped at Subtotal & strictly Non-Negative)
  let rawDiscount = 0;
  if (discountType === "PERCENT_2") rawDiscount = Math.round((subtotal * 2) / 100);
  else if (discountType === "PERCENT_5") rawDiscount = Math.round((subtotal * 5) / 100);
  else if (discountType === "PERCENT_10") rawDiscount = Math.round((subtotal * 10) / 100);
  else if (discountType === "PERCENT_15") rawDiscount = Math.round((subtotal * 15) / 100);
  else if (discountType === "CUSTOM") rawDiscount = Math.max(0, Number(customDiscount || 0));

  const discountAmount = Math.min(subtotal, Math.max(0, rawDiscount));

  // Derive active freight (strictly Non-Negative, capped at ₹50,000)
  let rawFreight = 0;
  if (freightType === "EX_WORKS_0") rawFreight = 0;
  else if (freightType === "LOCAL_450") rawFreight = 450;
  else if (freightType === "MH_1200") rawFreight = 1200;
  else if (freightType === "INTERSTATE_2500") rawFreight = 2500;
  else if (freightType === "HEAVY_4500") rawFreight = 4500;
  else if (freightType === "CUSTOM") rawFreight = Math.max(0, Number(customFreight || 0));

  const freightAmount = Math.min(50000, Math.max(0, rawFreight));

  // Taxable amount strictly >= 0
  const taxable = Math.max(0, subtotal - discountAmount + freightAmount);
  const cgst = taxable * 0.09;
  const sgst = taxable * 0.09;
  const grandTotal = taxable + cgst + sgst;

  const handleAddItem = () => {
    const nextProd = catalogProducts[1] || catalogProducts[0];
    setItems((prev) => [
      ...prev,
      {
        productId: nextProd.productId,
        sku: nextProd.sku,
        name: nextProd.name,
        description: nextProd.description,
        quantity: 1,
        rate: nextProd.rate,
        gstPercent: 18,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, idx) => idx !== index));
    }
  };

  const handleProductSelect = (index, prodSku) => {
    const selected = catalogProducts.find((p) => p.sku === prodSku);
    if (!selected) return;
    setItems((prev) =>
      prev.map((it, idx) =>
        idx === index
          ? {
              ...it,
              productId: selected.productId,
              sku: selected.sku,
              name: selected.name,
              description: selected.description,
              rate: selected.rate,
            }
          : it
      )
    );
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== index) return it;
        if (field === "quantity") {
          return { ...it, quantity: Math.max(1, parseInt(value, 10) || 1) };
        }
        if (field === "rate") {
          return { ...it, rate: Math.max(0, parseFloat(value) || 0) };
        }
        return { ...it, [field]: value };
      })
    );
  };

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
        discountAmount,
        freightAmount,
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
      <div className="bg-[#10182f] border border-[#1e2a4a] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0d1424] shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-cyan-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Issue Official Quotation</h2>
              <p className="text-[11px] text-slate-400">
                Action by Back Officer (BO → Sales Rep → Client) · Governed by Statutory Rules
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
                className="w-full bg-[#0a1020] text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-400 shadow-inner"
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
              <div className="bg-[#0a1020] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-300 font-mono shadow-inner">
                {currentLead?.contactName || "Contact Person"} | {currentLead?.phone || "No phone"} | {currentLead?.city || "Pune"}
              </div>
            </div>
          </div>

          {/* Line Items Builder with Product Catalog Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white uppercase text-[11px] tracking-wider">
                Quotation Line Items (from Standard Catalog)
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Product</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="bg-[#0a1020] border border-slate-800 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                >
                  {/* Product Catalog Dropdown */}
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] text-slate-400 mb-1">Select Catalog Product</label>
                    <select
                      value={it.sku || ""}
                      onChange={(e) => handleProductSelect(idx, e.target.value)}
                      className="w-full bg-[#10182f] text-cyan-300 font-bold text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-cyan-400"
                    >
                      {catalogProducts.map((prod) => (
                        <option key={prod.sku} value={prod.sku}>
                          {prod.name} (₹{prod.rate.toLocaleString("en-IN")})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description / Spec */}
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] text-slate-400 mb-1">Description / Spec</label>
                    <input
                      type="text"
                      value={it.description}
                      onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                      className="w-full bg-[#10182f] text-slate-200 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700"
                    />
                  </div>

                  {/* Quantity (min 1, no negative) */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-400 mb-1">Qty (min 1)</label>
                    <input
                      type="number"
                      min="1"
                      value={it.quantity}
                      onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                      className="w-full bg-[#10182f] text-white font-bold text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 font-mono"
                    />
                  </div>

                  {/* Rate (₹) (min 0, no negative, expanded width) */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-400 mb-1">Rate (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={it.rate}
                      onChange={(e) => handleItemChange(idx, "rate", e.target.value)}
                      className="w-full bg-[#10182f] text-cyan-300 font-bold text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={items.length === 1}
                      className="p-1.5 text-slate-400 hover:text-red-400 disabled:opacity-30 cursor-pointer"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Validated Commercial Terms: Discount, Freight, Payment & Delivery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-3">
              {/* Discount Selector & Safe Range */}
              <div className="bg-[#0a1020] border border-slate-800 p-3 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Commercial Discount</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Max: ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="bg-[#10182f] text-slate-200 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 font-medium"
                  >
                    <option value="PERCENT_0">0% (Standard Price)</option>
                    <option value="PERCENT_2">2% (Contractor Rate)</option>
                    <option value="PERCENT_5">5% (Volume Partner)</option>
                    <option value="PERCENT_10">10% (Special Deal)</option>
                    <option value="PERCENT_15">15% (Management Approval)</option>
                    <option value="CUSTOM">Custom ₹ (Up to Subtotal)</option>
                  </select>

                  {discountType === "CUSTOM" ? (
                    <input
                      type="number"
                      min="0"
                      max={subtotal}
                      value={customDiscount}
                      onChange={(e) => {
                        const val = Math.min(subtotal, Math.max(0, Number(e.target.value) || 0));
                        setCustomDiscount(val);
                      }}
                      placeholder={`Max ₹${subtotal}`}
                      className="bg-[#10182f] text-cyan-300 font-bold text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 font-mono"
                    />
                  ) : (
                    <div className="bg-[#10182f] text-slate-300 font-mono text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center justify-between">
                      <span>Applied:</span>
                      <span className="text-emerald-400 font-bold">-₹{discountAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Freight Selector & Standard Logistics */}
              <div className="bg-[#0a1020] border border-slate-800 p-3 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-400" />
                    <span>Freight & Transport (INR)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Non-negative
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={freightType}
                    onChange={(e) => setFreightType(e.target.value)}
                    className="bg-[#10182f] text-slate-200 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 font-medium"
                  >
                    <option value="EX_WORKS_0">Ex-Works Pune (₹0)</option>
                    <option value="LOCAL_450">Local Pune/PCMC (₹450)</option>
                    <option value="MH_1200">Maharashtra Hub (₹1,200)</option>
                    <option value="INTERSTATE_2500">Inter-State Door (₹2,500)</option>
                    <option value="HEAVY_4500">Heavy Direct Site (₹4,500)</option>
                    <option value="CUSTOM">Custom Freight (₹)</option>
                  </select>

                  {freightType === "CUSTOM" ? (
                    <input
                      type="number"
                      min="0"
                      max="50000"
                      value={customFreight}
                      onChange={(e) => {
                        const val = Math.min(50000, Math.max(0, Number(e.target.value) || 0));
                        setCustomFreight(val);
                      }}
                      placeholder="Max ₹50,000"
                      className="bg-[#10182f] text-cyan-300 font-bold text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 font-mono"
                    />
                  ) : (
                    <div className="bg-[#10182f] text-slate-300 font-mono text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center justify-between">
                      <span>Freight:</span>
                      <span className="text-white font-bold">+₹{freightAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment & Delivery Terms Dropdowns */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Payment Terms</label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full bg-[#0a1020] text-slate-200 text-xs px-2.5 py-2 rounded-xl border border-slate-800"
                  >
                    {STANDARD_PAYMENT_TERMS.map((term) => (
                      <option key={term} value={term}>
                        {term}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Delivery Terms</label>
                  <select
                    value={deliveryTerms}
                    onChange={(e) => setDeliveryTerms(e.target.value)}
                    className="w-full bg-[#0a1020] text-slate-200 text-xs px-2.5 py-2 rounded-xl border border-slate-800"
                  >
                    {STANDARD_DELIVERY_TERMS.map((term) => (
                      <option key={term} value={term}>
                        {term}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Live Statutory Calculation Summary Card */}
            <div className="bg-[#0a1020] border border-slate-800 rounded-xl p-4 space-y-2 font-mono flex flex-col justify-between shadow-inner">
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-300 text-xs">
                  <span>Gross Product Subtotal:</span>
                  <span className="font-bold text-white">₹ {subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-300 text-xs">
                  <span>Less: Commercial Discount:</span>
                  <span className="font-bold text-amber-300">- ₹ {discountAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-300 text-xs">
                  <span>Add: Logistics & Freight:</span>
                  <span className="font-bold text-cyan-300">+ ₹ {freightAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-1 border-t border-slate-800 flex justify-between text-slate-200 text-xs font-bold">
                  <span>Taxable Base Value:</span>
                  <span className="text-white">₹ {taxable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>CGST (9%) — Intra-State:</span>
                  <span>₹ {cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>SGST (9%) — Intra-State:</span>
                  <span>₹ {sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-cyan-500/30 flex justify-between items-center text-sm font-black text-cyan-300 bg-cyan-950/20 p-2.5 rounded-lg border border-cyan-500/20">
                <span className="font-sans text-xs uppercase tracking-wide text-white">Grand Total (inc GST):</span>
                <span className="text-base text-cyan-300 font-mono">₹ {grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition cursor-pointer"
            >
              Generate Quotation & Render HTML
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
