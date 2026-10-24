import React, { useState } from 'react';
import { X, Settings2, Save } from 'lucide-react';

export default function CostingPolicyModal({ isOpen, onClose, policy, onUpdatePolicy }) {
  if (!isOpen || !policy) return null;

  const [formData, setFormData] = useState({
    name: policy.name || '',
    includeScrap: policy.includeScrap ?? true,
    labourCostPerUnit: policy.labourCostPerUnit || 108,
    overheadPercent: policy.overheadPercent || 12,
    targetMarginPercent: policy.targetMarginPercent || 28,
    defaultGstPercent: policy.defaultGstPercent || 18,
    requireSeparateApprover: policy.requireSeparateApprover ?? true,
    requireReleasedDrawingForBom: policy.requireReleasedDrawingForBom ?? false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError('');
      await onUpdatePolicy({
        ...formData,
        labourCostPerUnit: Number(formData.labourCostPerUnit),
        overheadPercent: Number(formData.overheadPercent),
        targetMarginPercent: Number(formData.targetMarginPercent),
        defaultGstPercent: Number(formData.defaultGstPercent)
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update costing policy');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/90 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#0c1222] text-[#d4ff00] flex items-center justify-center font-black shadow-xs">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#0f172a] tracking-tight">Engineering Costing Policy</h2>
              <p className="text-xs font-semibold text-slate-500">Approved parameters governing BOM costing & margin guidance</p>
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

        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Policy Identity / Version Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0c1222] shadow-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Labour Cost Per Unit (₹)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.labourCostPerUnit}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  handleChange('labourCostPerUnit', isNaN(val) || val < 0 ? 0 : val);
                }}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0c1222] shadow-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Factory Overhead (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={formData.overheadPercent}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  handleChange('overheadPercent', isNaN(val) ? 0 : Math.min(100, Math.max(0, val)));
                }}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0c1222] shadow-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Target Sales Margin (%)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.targetMarginPercent}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  handleChange('targetMarginPercent', isNaN(val) || val < 0 ? 0 : val);
                }}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0c1222] shadow-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Default GST Slab (%)</label>
              <select
                value={formData.defaultGstPercent}
                onChange={(e) => handleChange('defaultGstPercent', Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0c1222] shadow-xs cursor-pointer"
              >
                <option value={18}>18% Standard</option>
                <option value={12}>12% Fabricated</option>
                <option value={28}>28% High Voltage</option>
                <option value={5}>5% Minerals</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.includeScrap}
                onChange={(e) => handleChange('includeScrap', e.target.checked)}
                className="rounded border-slate-300 text-black focus:ring-black w-4 h-4 cursor-pointer"
              />
              <span>Incorporate Line-level Scrap % into Cost Rollup</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requireSeparateApprover}
                onChange={(e) => handleChange('requireSeparateApprover', e.target.checked)}
                className="rounded border-slate-300 text-black focus:ring-black w-4 h-4 cursor-pointer"
              />
              <span>Mandate 2-Person Rule (Creator cannot approve own BOM)</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requireReleasedDrawingForBom}
                onChange={(e) => handleChange('requireReleasedDrawingForBom', e.target.checked)}
                className="rounded border-slate-300 text-black focus:ring-black w-4 h-4 cursor-pointer"
              />
              <span>Block BOM Release if Drawing is not Released</span>
            </label>
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
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-[#d4ff00] hover:bg-[#bce600] text-black text-xs font-black shadow-md flex items-center space-x-1.5 transition disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4 text-black" />
              <span>{isSaving ? 'Updating...' : 'Save Parameters'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
