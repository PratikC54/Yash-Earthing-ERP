import { useState, useEffect } from "react";
import { X, UserPlus, ShieldCheck, Plus, Trash2, Package, ChevronDown, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import module1Service from "../services/module1Service";

export const COUNTRY_CODES = [
  { code: "+91", country: "India", flag: "🇮🇳", digits: 10, placeholder: "98230 44121" },
  { code: "+1", country: "USA / Canada", flag: "🇺🇸", digits: 10, placeholder: "202 555 0143" },
  { code: "+971", country: "UAE", flag: "🇦🇪", digits: 9, placeholder: "50 123 4567" },
  { code: "+44", country: "UK", flag: "🇬🇧", digits: 10, placeholder: "7911 123456" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦", digits: 9, placeholder: "50 123 4567" },
  { code: "+65", country: "Singapore", flag: "🇸🇬", digits: 8, placeholder: "8123 4567" },
  { code: "+974", country: "Qatar", flag: "🇶🇦", digits: 8, placeholder: "3312 3456" },
  { code: "+968", country: "Oman", flag: "🇴🇲", digits: 8, placeholder: "9123 4567" },
  { code: "+965", country: "Kuwait", flag: "🇰🇼", digits: 8, placeholder: "5123 4567" },
  { code: "+61", country: "Australia", flag: "🇦🇺", digits: 9, placeholder: "412 345 678" },
  { code: "+49", country: "Germany", flag: "🇩🇪", digits: 10, placeholder: "151 12345678" },
];

export default function CreateLeadModal({ isOpen, onClose, onSubmit }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const [selectedCountryCode, setSelectedCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);

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

  const selectedCountry =
    COUNTRY_CODES.find((c) => c.code === selectedCountryCode) || COUNTRY_CODES[0];

  const validatePhone = (num, code) => {
    const clean = (num || "").trim();
    if (!clean) return "Mobile number is required";
    if (code === "+91") {
      if (clean.length !== 10) {
        return "Indian mobile number must be exactly 10 digits";
      }
      if (!/^[6-9]/.test(clean)) {
        return "Valid Indian mobile number must start with 6, 7, 8, or 9";
      }
      if (!/^[6-9]\d{9}$/.test(clean)) {
        return "Please enter a valid 10-digit number";
      }
    } else {
      const targetCountry = COUNTRY_CODES.find((c) => c.code === code) || COUNTRY_CODES[0];
      if (clean.length !== targetCountry.digits) {
        return `${targetCountry.country} number must be exactly ${targetCountry.digits} digits`;
      }
      if (!/^\d+$/.test(clean)) {
        return "Please enter valid digits only";
      }
    }
    return "";
  };

  const handlePhoneChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    const maxDigits = selectedCountry.digits;
    const truncated = rawVal.slice(0, maxDigits);
    setPhoneNumber(truncated);

    if (phoneTouched || truncated.length > 0) {
      setPhoneError(validatePhone(truncated, selectedCountryCode));
    }
  };

  const handleCountryChange = (e) => {
    const newCode = e.target.value;
    setSelectedCountryCode(newCode);
    const targetCountry = COUNTRY_CODES.find((c) => c.code === newCode) || COUNTRY_CODES[0];
    const truncated = phoneNumber.slice(0, targetCountry.digits);
    setPhoneNumber(truncated);
    if (phoneTouched || truncated.length > 0) {
      setPhoneError(validatePhone(truncated, newCode));
    }
  };

  const isValidPhone = phoneNumber.length > 0 && !validatePhone(phoneNumber, selectedCountryCode);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName) {
      alert("Please provide customer company name.");
      return;
    }
    const phoneErr = validatePhone(phoneNumber, selectedCountryCode);
    if (phoneErr) {
      setPhoneTouched(true);
      setPhoneError(phoneErr);
      alert(phoneErr);
      return;
    }
    if (selectedItems.length === 0) {
      alert("Please add at least one product requirement.");
      return;
    }

    const fullPhone = `${selectedCountryCode} ${phoneNumber.trim()}`;

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit({
          ...formData,
          phone: fullPhone,
          items: selectedItems,
          productName: selectedItems.map((i) => i.productName).join(", "),
          productSku: selectedItems[0]?.productSku || "MULTIPLE",
          variant: selectedItems[0]?.variant || "Standard",
          quantity: totalQuantity,
          expectedValue: totalCalculatedValue,
          createdAt: new Date().toISOString(),
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-800 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0c1222] text-[#d4ff00] flex items-center justify-center shadow-xs">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#0f172a]">Capture Inbound Lead</h2>
              <p className="text-[11px] font-semibold text-slate-500">
                Supports multiple product selection · Automatically assigned to Sales Consultant
              </p>
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

        {/* Notice */}
        <div className="mx-6 mt-4 p-3 rounded-xl bg-lime-50/90 border border-lime-300 flex items-center gap-2.5 text-xs text-lime-950 shrink-0 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Automatic round-robin assignment to certified <b className="font-bold text-black">SALES_CONSULTANT</b> enabled.</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Customer / Company details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Company / Customer Name *
              </label>
              <input
                type="text"
                name="customerName"
                required
                value={formData.customerName}
                onChange={handleChange}
                placeholder="e.g. SuryaGrid Projects Pvt Ltd"
                className="w-full bg-white text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0c1222] font-semibold shadow-xs"
                style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                placeholder="e.g. Amit Kulkarni"
                className="w-full bg-white text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0c1222] font-semibold shadow-xs"
                style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Mobile Number *
                </label>
                <span
                  className={`text-[10px] font-mono ${
                    phoneNumber.length === selectedCountry.digits
                      ? isValidPhone
                        ? "text-emerald-600 font-bold"
                        : "text-amber-600 font-bold"
                      : phoneNumber.length > 0
                      ? "text-slate-600 font-semibold"
                      : "text-slate-400"
                  }`}
                >
                  {phoneNumber.length}/{selectedCountry.digits} digits
                </span>
              </div>
              <div className="flex items-stretch gap-1.5">
                {/* Country Code Dropdown */}
                <div className="relative shrink-0 w-[125px]">
                  <select
                    value={selectedCountryCode}
                    onChange={handleCountryChange}
                    className="w-full h-full appearance-none bg-white text-slate-900 text-xs pl-3 pr-7 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0c1222] cursor-pointer font-bold shadow-xs"
                    title="Select Country Code"
                    style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                  >
                    {COUNTRY_CODES.map((item) => (
                      <option
                        key={item.code}
                        value={item.code}
                        className="bg-white text-slate-900 font-bold py-1.5"
                        style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                      >
                        {item.flag} {item.code} ({item.country})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Phone Number Input */}
                <div className="relative flex-1">
                  <input
                    type="tel"
                    inputMode="numeric"
                    required
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    onBlur={() => {
                      setPhoneTouched(true);
                      setPhoneError(validatePhone(phoneNumber, selectedCountryCode));
                    }}
                    placeholder={selectedCountry.placeholder}
                    maxLength={selectedCountry.digits}
                    className={`w-full bg-white text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border font-mono font-bold tracking-wide focus:outline-none shadow-xs ${
                      phoneTouched && phoneError
                        ? "border-rose-400 focus:border-rose-500 bg-rose-50/50 text-rose-900"
                        : isValidPhone
                        ? "border-emerald-500 focus:border-emerald-600 bg-emerald-50/30 text-slate-900"
                        : "border-slate-300 focus:border-[#0c1222] text-slate-900"
                    }`}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                  />
                  {isValidPhone && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  )}
                </div>
              </div>

              {/* Validation helper / error text */}
              {phoneTouched && phoneError ? (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-600 font-bold">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{phoneError}</span>
                </p>
              ) : selectedCountryCode === "+91" ? (
                <p className="mt-1 text-[10px] text-slate-500 font-medium">
                  Enter 10-digit Indian mobile number (starts with 6, 7, 8, or 9)
                </p>
              ) : (
                <p className="mt-1 text-[10px] text-slate-500 font-medium">
                  {selectedCountry.country}: {selectedCountry.digits} digits required
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Corporate Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contact@suryagrid.com"
                className="w-full bg-white text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0c1222] font-semibold shadow-xs"
                style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                City & State
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Pune"
                className="w-full bg-white text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0c1222] font-semibold shadow-xs"
                style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lead Source
              </label>
              <select
                name="source"
                value={formData.source}
                onChange={handleChange}
                className="w-full bg-white text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0c1222] font-bold shadow-xs cursor-pointer"
                style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
              >
                <option value="INDIAN_MART" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>IndiaMART</option>
                <option value="TRADE_INDIA" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>TradeIndia</option>
                <option value="EXPORT_INDIA" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>ExportIndia</option>
                <option value="JUSTDIAL" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>Justdial</option>
                <option value="GOOGLE_ADS" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>Google Ads</option>
                <option value="META_ADS" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>Meta Ads</option>
                <option value="WEBSITE" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>Website</option>
                <option value="MANUAL" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>Manual Inbound</option>
                <option value="REFERRAL" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>Referral</option>
              </select>
            </div>
          </div>

          {/* Multiple Products Requirement Builder */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-600" />
                <span>Product Requirements ({selectedItems.length} items)</span>
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer px-2 py-0.5 rounded-md hover:bg-blue-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {selectedItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3"
                >
                  <div className="flex-1 w-full sm:w-auto">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Product from Catalog *</label>
                    <select
                      value={item.productId || ""}
                      onChange={(e) => handleProductSelect(idx, e.target.value)}
                      className="w-full bg-white text-slate-900 text-xs px-2.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0c1222] font-semibold shadow-xs cursor-pointer"
                      style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                    >
                      {availableProducts.map((p) => (
                        <option key={p.id} value={p.id} style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
                          {p.name} ({p.sku}) {p.listPrice ? `· ₹${Number(p.listPrice).toFixed(0)}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24 sm:w-24">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Qty (Units)</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemQuantityChange(idx, e.target.value)}
                      className="w-full bg-white text-slate-900 text-xs px-2.5 py-2 rounded-xl border border-slate-300 text-center font-mono font-bold shadow-xs focus:outline-none focus:border-[#0c1222]"
                      style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                    />
                  </div>

                  <div className="w-28 sm:w-28 text-right">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Estimated</label>
                    <div className="text-xs font-mono font-black text-slate-900 py-1.5">
                      ₹ {(Number(item.unitPrice) * Number(item.quantity || 1)).toFixed(0)}
                    </div>
                  </div>

                  {selectedItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0 mt-3 sm:mt-0"
                      title="Remove product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Total Summary */}
            <div className="mt-3 p-3 bg-lime-50/80 border border-lime-300 rounded-xl flex items-center justify-between">
              <span className="text-slate-800 font-bold">Total Estimated Requirement Value:</span>
              <span className="text-sm font-black text-slate-900 font-mono">
                {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(totalCalculatedValue)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Requirement & Technical Notes
            </label>
            <textarea
              name="requirement"
              rows={2}
              value={formData.requirement}
              onChange={handleChange}
              placeholder="Enter site details, specifications, delivery expectations..."
              className="w-full bg-white text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0c1222] font-medium shadow-xs"
              style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5 shrink-0">
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
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#d4ff00] hover:bg-[#bce600] text-black text-xs font-black rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Saving & Assigning...</span>
                </>
              ) : (
                <span>Save & Auto-Assign Lead</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
