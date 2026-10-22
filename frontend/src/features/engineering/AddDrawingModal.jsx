import React, { useState } from 'react';
import { X, FileText, Upload } from 'lucide-react';

export default function AddDrawingModal({ isOpen, onClose, products, onDrawingCreated }) {
  if (!isOpen) return null;

  const [drawingNo, setDrawingNo] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('FABRICATION');
  const [productId, setProductId] = useState(products[0]?.id || '');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#1a233a] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-200">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-[#141d30]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Register Engineering Drawing</h2>
              <p className="text-xs text-slate-400">Strict revision control (Production sees only Released revisions)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-950/60 border border-red-500/50 text-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Drawing Number <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={drawingNo}
                onChange={(e) => setDrawingNo(e.target.value)}
                placeholder="e.g. YASH-ENG-DWG-801"
                className="w-full bg-[#101726] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white uppercase font-mono focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Drawing Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-[#101726] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="FABRICATION">FABRICATION (Shop-Floor)</option>
                <option value="GENERAL_ARRANGEMENT">GENERAL_ARRANGEMENT (GA)</option>
                <option value="INSTALLATION">INSTALLATION & SITE</option>
                <option value="DATASHEET">TECHNICAL DATASHEET</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Drawing Title <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 50mm Electrode Internal Slotted Diffusion Holes Cross Section"
              className="w-full bg-[#101726] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Link to Target Product Master</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full bg-[#101726] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- General / Multi-product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Change Reason / Scope of Release</label>
            <textarea
              rows={2}
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              className="w-full bg-[#101726] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering...' : 'Register & Release Drawing'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
