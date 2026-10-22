import React, { useState, useEffect } from 'react';
import { X, Settings2, Save } from 'lucide-react';

export default function CostingPolicyModal({ isOpen, onClose, policy, onUpdatePolicy }) {
  if (!isOpen || !policy) return null;

  const [formData, setFormData] = useState({
    name: policy.name || '',
    includeScrap: policy.includeScrap ?? true,
    labourCostPerUnit: policy.labourCostPerUnit || 140,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#1a233a] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-200">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-[#141d30]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold">
              <Settings2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Yash Group Engineering Costing Policy</h2>
              <p className="text-xs text-slate-400">Approved parameters governing BOM costing & margin guidance</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-950/60 border border-red-500/50 text-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Policy Identity / Version Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full bg-[#101726] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Labour Cost Per Unit (₹)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.labourCostPerUnit}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  handleChange('labourCostPerUnit', isNaN(val) || val < 0 ? 0 : val);
                }}
                className="w-full bg-[#101726] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Factory Overhead (%)</label>
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
                className="w-full bg-[#101726] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Sales Margin (%)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.targetMarginPercent}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  handleChange('targetMarginPercent', isNaN(val) || val < 0 ? 0 : val);
                }}
                className="w-full bg-[#101726] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Default GST Rate (%)</label>
              <select
                value={formData.defaultGstPercent}
                onChange={(e) => handleChange('defaultGstPercent', Number(e.target.value))}
                className="w-full bg-[#101726] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value={18}>18% — Standard Engineering Slab</option>
                <option value={28}>28% — Surge & Electronic Protection</option>
                <option value={12}>12% — Fabricated Hardware</option>
                <option value={5}>5% — Ground Minerals</option>
                <option value={0}>0% — Exempt</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-2">
            <label className="flex items-center space-x-3 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={formData.includeScrap}
                onChange={(e) => handleChange('includeScrap', e.target.checked)}
                className="rounded border-slate-700 bg-[#101726] text-cyan-600 focus:ring-0"
              />
              <span className="text-slate-300">Factor scrap allowances directly into material cost calculation</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={formData.requireSeparateApprover}
                onChange={(e) => handleChange('requireSeparateApprover', e.target.checked)}
                className="rounded border-slate-700 bg-[#101726] text-cyan-600 focus:ring-0"
              />
              <span className="text-slate-300">Strict Creator ≠ Approver rule (ISO 9001 audit compliance)</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={formData.requireReleasedDrawingForBom}
                onChange={(e) => handleChange('requireReleasedDrawingForBom', e.target.checked)}
                className="rounded border-slate-700 bg-[#101726] text-cyan-600 focus:ring-0"
              />
              <span className="text-slate-300">Require at least one Released Drawing before a BOM can be Released</span>
            </label>
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
              disabled={isSaving}
              className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/30 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Updating...' : 'Save Parameters'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
