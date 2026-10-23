import React, { useState, useEffect } from 'react';
import { X, Layers, Plus, AlertCircle, Info } from 'lucide-react';

export default function CreateBOMModal({
  isOpen,
  onClose,
  products = [],
  costingPolicy,
  onBomCreated
}) {
  // Finished manufactured products that can have a BOM
  const manufacturedProducts = products.filter(
    (p) => p.itemType === 'FINISHED' || !p.itemType
  );

  const [selectedProductId, setSelectedProductId] = useState(
    manufacturedProducts[0]?.id || ''
  );
  const selectedProduct = products.find((p) => String(p.id) === String(selectedProductId));

  const [bomCode, setBomCode] = useState(
    selectedProduct ? `BOM-${selectedProduct.sku}` : ''
  );
  const [revisionCode, setRevisionCode] = useState('Rev A');
  const [changeNote, setChangeNote] = useState(
    'Initial production release for substation earthing projects.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && manufacturedProducts.length > 0) {
      const current = manufacturedProducts.find((p) => String(p.id) === String(selectedProductId));
      const target = current || manufacturedProducts[0];
      setSelectedProductId(target.id);
      setBomCode(`BOM-${target.sku}`);
      setError('');
    }
  }, [isOpen, products.length]);

  if (!isOpen) return null;

  const handleProductChange = (prodId) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => String(p.id) === String(prodId));
    if (prod) {
      setBomCode(`BOM-${prod.sku}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId) {
      setError('Please select a target finished product.');
      return;
    }
    if (!bomCode.trim()) {
      setError('BOM Code is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onBomCreated({
        productId: selectedProductId,
        bomCode: bomCode.trim(),
        revisionCode: revisionCode.trim() || 'Rev A',
        changeReason: changeNote.trim(),
        title: `Bill of Materials for ${selectedProduct?.name || selectedProduct?.sku}`
      });
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to initialize Bill of Materials'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#141d30] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-[#101726]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                + Create Bill of Materials (BOM)
              </h2>
              <p className="text-xs text-slate-400">
                Module 3: Engineering Master Recipe Formulation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 text-red-200 rounded-xl flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Target Finished Product <span className="text-red-400">*</span>
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full bg-[#0a1020] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              required
            >
              <option value="" disabled>-- Select Finished Product Master --</option>
              {manufacturedProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name} (₹{p.rate})
                </option>
              ))}
            </select>
          </div>

          {/* BOM Code & Revision */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                BOM Code <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={bomCode}
                onChange={(e) => setBomCode(e.target.value)}
                placeholder="e.g. BOM-CBP-600-3M"
                className="w-full bg-[#0a1020] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Initial Revision Code
              </label>
              <input
                type="text"
                value={revisionCode}
                onChange={(e) => setRevisionCode(e.target.value)}
                placeholder="Rev A"
                className="w-full bg-[#0a1020] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Change Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Engineering Change Note / Purpose
            </label>
            <textarea
              rows={3}
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder="e.g. Initial production release for substation earthing projects."
              className="w-full bg-[#0a1020] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Costing Policy notice */}
          <div className="p-3 bg-[#0a1020] border border-slate-800 rounded-xl flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-400 leading-relaxed">
              Upon creating this BOM draft, the recipe editor will open immediately where you can add raw materials, specify scrap %, and review the auto-frozen costing policy (Labour ₹{costingPolicy?.labourCostPerUnit || 250}, Overhead {costingPolicy?.overheadPercent || 12}%).
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center space-x-1.5 transition disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating BOM...' : 'Create BOM & Open Editor'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
