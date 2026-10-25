import React, { useState } from 'react';
import { X, FileText, Upload } from 'lucide-react';

export default function AddDrawingModal({ isOpen, onClose, products = [], onDrawingCreated }) {
  const safeProducts = Array.isArray(products)
    ? products
    : (Array.isArray(products?.data) ? products.data : []);

  if (!isOpen) return null;

  const [drawingNo, setDrawingNo] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('FABRICATION');
  const [productId, setProductId] = useState(safeProducts[0]?.id || '');
  const [changeReason, setChangeReason] = useState('Initial production drawing release approved by engineering.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!drawingNo.trim() || !title.trim()) {
      setError('Drawing Number and Title are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onDrawingCreated({
        drawingNo: drawingNo.trim().toUpperCase(),
        title: title.trim(),
        type,
        productId: productId || null,
        changeReason: changeReason.trim()
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error creating drawing');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/90 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#0c1222] text-[#d4ff00] flex items-center justify-center font-black shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#0f172a] tracking-tight">Register Engineering Drawing</h2>
              <p className="text-xs font-semibold text-slate-500">Strict revision control (Production sees only Released revisions)</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Drawing Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={drawingNo}
                onChange={(e) => setDrawingNo(e.target.value)}
                placeholder="e.g. YASH-ENG-DWG-801"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 uppercase font-mono font-bold focus:outline-none focus:border-[#0c1222] shadow-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Drawing Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0c1222] shadow-xs cursor-pointer"
              >
                <option value="FABRICATION">FABRICATION (Shop-Floor)</option>
                <option value="GENERAL_ARRANGEMENT">GENERAL_ARRANGEMENT (GA)</option>
                <option value="INSTALLATION">INSTALLATION & SITE</option>
                <option value="DATASHEET">TECHNICAL DATASHEET</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Drawing Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 50mm Electrode Internal Slotted Diffusion Holes Cross Section"
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0c1222] shadow-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Link to Target Product Master
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0c1222] shadow-xs cursor-pointer"
            >
              <option value="">-- General / Multi-product --</option>
              {safeProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Change Reason / Scope of Release
            </label>
            <textarea
              rows={2}
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
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
              <Upload className="w-4 h-4 text-black" />
              <span>{isSubmitting ? 'Registering...' : 'Register & Release Drawing'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
