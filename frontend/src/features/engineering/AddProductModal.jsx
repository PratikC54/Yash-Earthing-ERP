import React, { useState } from 'react';
import { X, Plus, Package, ShieldCheck } from 'lucide-react';

export default function AddProductModal({ isOpen, onClose, onProductCreated, categories = [] }) {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat_electrode');
  const [itemType, setItemType] = useState('FINISHED');
  const [material, setMaterial] = useState('');
  const [size, setSize] = useState('');
  const [length, setLength] = useState('');
  const [finish, setFinish] = useState('250 Microns Copper Coating');
  const [uom, setUom] = useState('NOS');
  const [rate, setRate] = useState('');
  const [gstPercent, setGstPercent] = useState(18); // Fixed Indian GST standard slab
  const [description, setDescription] = useState('');
  const [referenceImage, setReferenceImage] = useState('https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!sku.trim() || !name.trim()) {
      setError('SKU and Product Name are mandatory.');
      return;
    }

    const cleanSku = sku.trim().toUpperCase();
    if (!/^[A-Z0-9_-]+$/.test(cleanSku)) {
      setError('SKU can only contain uppercase letters, numbers, hyphens, and underscores (e.g. SKU-CBE-50-3M).');
      return;
    }

    const numRate = Number(rate);
    if (isNaN(numRate) || numRate <= 0) {
      setError('List Rate must be a positive number greater than 0.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onProductCreated({
        sku: cleanSku,
        name: name.trim(),
        categoryId,
        itemType,
        material: material.trim() || 'Standard Metallurgy',
        size: size.trim(),
        length: length.trim(),
        finish: finish.trim(),
        uom,
        rate: numRate,
        gstPercent: Number(gstPercent),
        description: description.trim(),
        referenceImage: referenceImage.trim()
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/90 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#0c1222] text-[#d4ff00] flex items-center justify-center font-black shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#0f172a] tracking-tight">Add New Product Master (SKU)</h2>
              <p className="text-xs font-semibold text-slate-500">Validated master record for Sales (M1), Stores (M2), and Production (M4)</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Product SKU <span className="text-rose-500">*</span> (Permanent Alphanumeric)
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="e.g. SKU-CBE-50-3M"
                pattern="[A-Z0-9_-]+"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0c1222] shadow-xs uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0c1222] shadow-xs cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Official Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Yash Copper Bonded Earthing Electrode 50mm x 3m"
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0c1222] shadow-xs"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Item Master Type</label>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0c1222] shadow-xs cursor-pointer"
              >
                <option value="FINISHED">FINISHED (Sellable)</option>
                <option value="COMPONENT">COMPONENT (Sub-assembly)</option>
                <option value="RAW_MATERIAL">RAW_MATERIAL (Bulk)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Outer Diameter / Size</label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="e.g. 50 mm / 17.2 mm"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0c1222] shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Total Length</label>
              <input
                type="text"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                placeholder="e.g. 3.0 meter"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0c1222] shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Conductor Material</label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="e.g. 99.9% Electrolytic Copper on Mild Steel"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0c1222] shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Surface Finish / Plating</label>
              <input
                type="text"
                value={finish}
                onChange={(e) => setFinish(e.target.value)}
                placeholder="e.g. 250 Microns Copper Bond"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0c1222] shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Unit of Measure (UoM)</label>
              <select
                value={uom}
                onChange={(e) => setUom(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0c1222] shadow-xs cursor-pointer"
              >
                <option value="NOS">NOS (Numbers)</option>
                <option value="METER">METER</option>
                <option value="KG">KG (Kilograms)</option>
                <option value="BAG">BAG</option>
                <option value="SET">SET</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                List Rate (₹ excl. GST) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={rate}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (val < 0) return;
                  setRate(e.target.value);
                }}
                placeholder="3450"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0c1222] shadow-xs"
                required
              />
            </div>

            {/* Indian GST Slabs Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                GST Tax Slab (Fixed) <span className="text-rose-500">*</span>
              </label>
              <select
                value={gstPercent}
                onChange={(e) => setGstPercent(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0c1222] shadow-xs cursor-pointer"
              >
                <option value={18}>18% — Standard Electrical & Electrodes</option>
                <option value={28}>28% — Advanced Surge & High Voltage</option>
                <option value={12}>12% — Fabricated Hardware & Trays</option>
                <option value={5}>5% — Ground Enhancing Minerals</option>
                <option value={0}>0% — Exempt</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Reference Image URL</label>
            <input
              type="url"
              value={referenceImage}
              onChange={(e) => setReferenceImage(e.target.value)}
              placeholder="https://..."
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0c1222] shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Engineering & Application Notes</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Technical summary, soil conditions, test standards compliance..."
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0c1222] shadow-xs"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#d4ff00] hover:bg-[#bce600] text-black text-xs font-black shadow-md flex items-center space-x-1.5 transition disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-black" />
              <span>{isSubmitting ? 'Validating...' : 'Save & Register SKU'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
