import { useState, useEffect } from "react";
import { X, UserPlus, ShieldCheck, Plus, Trash2, Package } from "lucide-react";
import module1Service from "../services/module1Service";

export default function CreateLeadModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    customerName: "",
    contactName: "",
    phone: "",
    email: "",
    city: "Pune",
    state: "Maharashtra",
    source: "MANUAL",
    priority: "HIGH",
    requirement: "Standard earthing & lightning protection enquiry",
  });

  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedItems, setSelectedItems] = useState([
    {
      productId: 4,
      productName: "ESE Lightning Arrester",
      productSku: "ESE-LA",
      variant: "Protection radius 107 m",
      quantity: 1,
      unitPrice: 142000,
    },
  ]);

  useEffect(() => {
    if (!isOpen) return;
    async function loadProducts() {
      try {
        const res = await module1Service.getProductsCatalog();
        if (res?.success && res.data?.length > 0) {
          setAvailableProducts(res.data);
          // Set first product default if selectedItems empty
          if (selectedItems.length === 0) {
            const p = res.data[0];
            setSelectedItems([
              {
                productId: p.id,
                productName: p.name,
                productSku: p.sku,
                variant: p.variant || "Standard",
                quantity: 1,
                unitPrice: Number(p.listPrice || 0),
              },
            ]);
          }
        }
      } catch {
        // Fallback standard products catalog
        setAvailableProducts([
          { id: 1, name: "Copper Bonding Receptacle 172mm", sku: "YEC-CBR-172", listPrice: 1500, variant: "Heavy Duty" },
          { id: 2, name: "Electrolytic Copper Rod 99.9%", sku: "RM-COPPER-ROD-99", listPrice: 850, variant: "99.9% Pure" },
          { id: 3, name: "GI Earthing Electrode", sku: "YGI501F", listPrice: 2150, variant: "50mm Dia x 1m" },
          { id: 4, name: "ESE Lightning Arrester", sku: "ESE-LA", listPrice: 142000, variant: "Radius 107m" },
          { id: 5, name: "Copper Plate", sku: "YEC-CP-001", listPrice: 4200, variant: "600x600x3mm" },
        ]);
      }
    }
    loadProducts();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductSelect = (index, productId) => {
    const prod = availableProducts.find((p) => String(p.id) === String(productId));
    if (!prod) return;
    setSelectedItems((prev) =>
      prev.map((it, idx) =>
        idx === index
          ? {
              ...it,
              productId: prod.id,
              productName: prod.name,
              productSku: prod.sku,
              variant: prod.variant || "Standard",
              unitPrice: Number(prod.listPrice || 0),
            }
          : it
      )
    );
  };

  const handleItemQuantityChange = (index, qty) => {
    const quantity = Math.max(1, Number(qty) || 1);
    setSelectedItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, quantity } : it))
    );
  };

  const handleAddItem = () => {
    const defaultProd = availableProducts[0] || {
      id: 3,
      name: "GI Earthing Electrode",
      sku: "YGI501F",
      variant: "50mm Dia x 1m",
      listPrice: 2150,
    };
    setSelectedItems((prev) => [
      ...prev,
      {
        productId: defaultProd.id,
        productName: defaultProd.name,
        productSku: defaultProd.sku,
        variant: defaultProd.variant || "Standard",
        quantity: 1,
        unitPrice: Number(defaultProd.listPrice || 0),
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (selectedItems.length > 1) {
      setSelectedItems((prev) => prev.filter((_, idx) => idx !== index));
    }
  };

  const totalCalculatedValue = selectedItems.reduce(
    (acc, it) => acc + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 1),
    0
  );

  const totalQuantity = selectedItems.reduce(
    (acc, it) => acc + (Number(it.quantity) || 1),
    0
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.phone) {
      alert("Please provide customer company and phone number.");
      return;
    }
    if (selectedItems.length === 0) {
      alert("Please add at least one product requirement.");
      return;
    }

    if (onSubmit) {
      onSubmit({
        ...formData,
        items: selectedItems,
        productName: selectedItems.map((i) => i.productName).join(", "),
        productSku: selectedItems[0]?.productSku || "MULTIPLE",
        variant: selectedItems[0]?.variant || "Standard",
        quantity: totalQuantity,
        expectedValue: totalCalculatedValue,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#10182f] border border-[#1e2a4a] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0d1424] shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-cyan-400 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Capture Inbound Lead</h2>
              <p className="text-[11px] text-slate-400">
                Supports multiple product selection · Automatically assigned to Sales Consultant
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

        {/* Notice */}
        <div className="mx-6 mt-4 p-3 rounded-xl bg-blue-950/40 border border-blue-600/30 flex items-center gap-2.5 text-xs text-blue-200 shrink-0">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Automatic round-robin assignment to certified <b>SALES_CONSULTANT</b> enabled.</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Customer / Company details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Company / Customer Name *
              </label>
              <input
                type="text"
                name="customerName"
                required
                value={formData.customerName}
                onChange={handleChange}
                placeholder="e.g. SuryaGrid Projects Pvt Ltd"
                className="w-full bg-[#0a1020] text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                placeholder="e.g. Amit Kulkarni"
                className="w-full bg-[#0a1020] text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mobile Number *
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98230 44121"
                className="w-full bg-[#0a1020] text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Corporate Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contact@suryagrid.com"
                className="w-full bg-[#0a1020] text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                City & State
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Pune"
                className="w-full bg-[#0a1020] text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Lead Source
              </label>
              <select
                name="source"
                value={formData.source}
                onChange={handleChange}
                className="w-full bg-[#0a1020] text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="INDIAN_MART">IndiaMART</option>
                <option value="TRADE_INDIA">TradeIndia</option>
                <option value="EXPORT_INDIA">ExportIndia</option>
                <option value="JUSTDIAL">Justdial</option>
                <option value="GOOGLE_ADS">Google Ads</option>
                <option value="META_ADS">Meta Ads</option>
                <option value="WEBSITE">Website</option>
                <option value="MANUAL">Manual Inbound</option>
                <option value="REFERRAL">Referral</option>
              </select>
            </div>
          </div>

          {/* Multiple Products Requirement Builder */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-cyan-400" />
                <span>Product Requirements ({selectedItems.length} items)</span>
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {selectedItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#0a1020] border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3"
                >
                  <div className="flex-1 w-full sm:w-auto">
                    <label className="block text-[10px] text-slate-400 mb-0.5">Product from Catalog *</label>
                    <select
                      value={item.productId || ""}
                      onChange={(e) => handleProductSelect(idx, e.target.value)}
                      className="w-full bg-[#10182f] text-slate-100 text-xs px-2.5 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {availableProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) {p.listPrice ? `· ₹${Number(p.listPrice).toFixed(0)}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24 sm:w-24">
                    <label className="block text-[10px] text-slate-400 mb-0.5">Qty (Units)</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemQuantityChange(idx, e.target.value)}
                      className="w-full bg-[#10182f] text-slate-100 text-xs px-2.5 py-2 rounded-lg border border-slate-700 text-center font-mono font-bold"
                    />
                  </div>

                  <div className="w-28 sm:w-28 text-right">
                    <label className="block text-[10px] text-slate-400 mb-0.5">Estimated</label>
                    <div className="text-xs font-mono font-bold text-cyan-300 py-1.5">
                      ₹ {(Number(item.unitPrice) * Number(item.quantity || 1)).toFixed(0)}
                    </div>
                  </div>

                  {selectedItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer shrink-0 mt-3 sm:mt-0"
                      title="Remove product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Total Summary */}
            <div className="mt-3 p-3 bg-blue-950/20 border border-blue-500/30 rounded-xl flex items-center justify-between">
              <span className="text-slate-300 font-semibold">Total Estimated Requirement Value:</span>
              <span className="text-sm font-black text-cyan-400 font-mono">
                {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(totalCalculatedValue)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Requirement & Technical Notes
            </label>
            <textarea
              name="requirement"
              rows={2}
              value={formData.requirement}
              onChange={handleChange}
              placeholder="Enter site details, specifications, delivery expectations..."
              className="w-full bg-[#0a1020] text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
            >
              Save & Auto-Assign Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
