import React, { useState } from 'react';
import { X, Plus, Trash2, CheckCircle2, AlertTriangle, GitCommit, Calculator, Lock, RefreshCw, Send, ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth';

export default function BOMEditorModal({
  isOpen,
  onClose,
  bom,
  product,
  availableComponents = [],
  costingPolicy,
  onSaveItems,
  onSubmitRevision,
  onApproveRevision,
  onRejectRevision,
  onReleaseRevision,
  onCreateNextRev
}) {
  const { user } = useAuth?.() || {};
  const userRole = (user?.role || '').toUpperCase();
  const isAdminOrLead = [
    'ADMIN',
    'SUPER_ADMIN',
    'ENGINEERING_HEAD',
    'TECHNICAL_DIRECTOR',
    'RND_ENGINEER',
    'PRODUCTION_MANAGER'
  ].includes(userRole) || userRole === 'ADMIN' || !userRole;

  const [activeRevIndex, setActiveRevIndex] = useState(
    bom?.revisions?.length ? bom.revisions.length - 1 : 0
  );
  const [items, setItems] = useState(bom?.revisions?.[activeRevIndex]?.items || []);
  const [rejectComment, setRejectComment] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [nextRevReason, setNextRevReason] = useState('');
  const [showNextRevBox, setShowNextRevBox] = useState(false);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !bom) return null;

  const currentRev = bom.revisions?.[activeRevIndex] || {};
  const isDraft = currentRev.status === 'DRAFT';
  const isReleased = currentRev.status === 'RELEASED';
  const isSuperseded = currentRev.status === 'SUPERSEDED';
  const isInReview = currentRev.status === 'IN_REVIEW';
  const isApproved = currentRev.status === 'APPROVED';

  // Live material cost calculation
  const materialCost = items.reduce((sum, it) => sum + (Number(it.lineCost) || 0), 0);
  const labourCost = Number(costingPolicy?.labourCostPerUnit || 108);
  const overheadPercent = Number(costingPolicy?.overheadPercent || 12);
  const overheadCost = (materialCost + labourCost) * (overheadPercent / 100);
  const totalEstimatedCost = materialCost + labourCost + overheadCost;
  const targetMarginPercent = Number(costingPolicy?.targetMarginPercent || 28);
  const suggestedPrice = totalEstimatedCost * (1 + targetMarginPercent / 100);

  const safeComponents = Array.isArray(availableComponents)
    ? availableComponents
    : (Array.isArray(availableComponents?.data) ? availableComponents.data : []);

  const handleAddItem = () => {
    const defaultComp = safeComponents[0] || {};
    const newItem = {
      id: `new_${Date.now()}`,
      componentProductId: defaultComp.id || '',
      componentSku: defaultComp.sku || '',
      componentName: defaultComp.name || '',
      quantity: 1,
      uom: defaultComp.uom || 'NOS',
      unitRate: Number(defaultComp.rate || 0),
      scrapPercent: 1.0,
      lineCost: Number(defaultComp.rate || 0) * 1.01,
      note: ''
    };
    setItems([...items, newItem]);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    const item = { ...updated[index] };

    if (field === 'componentProductId') {
      const comp = safeComponents.find(c => String(c.id) === String(value)) || {};
      item.componentProductId = value;
      item.componentSku = comp.sku || '';
      item.componentName = comp.name || '';
      item.uom = comp.uom || 'NOS';
      item.unitRate = Number(comp.rate || 0);
    } else if (field === 'quantity') {
      const parsedQty = parseFloat(value);
      item.quantity = isNaN(parsedQty) || parsedQty <= 0 ? 0.001 : parsedQty;
    } else if (field === 'scrapPercent') {
      const parsedScrap = parseFloat(value);
      item.scrapPercent = isNaN(parsedScrap) ? 0 : Math.min(100, Math.max(0, parsedScrap));
    } else if (field === 'unitRate') {
      const parsedRate = parseFloat(value);
      item.unitRate = isNaN(parsedRate) || parsedRate < 0 ? 0 : parsedRate;
    } else {
      item[field] = value;
    }

    // Recalculate line cost: qty * (1 + scrap%) * rate
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.unitRate) || 0;
    const scrap = Number(item.scrapPercent) || 0;
    item.lineCost = qty * (1 + scrap / 100) * rate;

    updated[index] = item;
    setItems(updated);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    try {
      setIsProcessing(true);
      setError('');
      await onSaveItems(currentRev.id, items);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save items');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRelease = async () => {
    try {
      setIsProcessing(true);
      setError('');
      await onReleaseRevision(currentRev.id, {
        rawMaterialCost: materialCost,
        labourCost,
        overheadCost,
        totalCost: totalEstimatedCost,
        suggestedPrice,
        frozenAt: new Date().toISOString()
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to release revision');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/90 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="bg-[#0c1222] text-[#d4ff00] font-mono font-black text-xs px-3 py-1.5 rounded-xl shadow-xs">
              {bom.bomCode}
            </span>
            <div>
              <h2 className="text-sm font-black text-[#0f172a] tracking-tight">
                Target Product: {product?.sku} — {product?.name}
              </h2>
              {bom.connectedSource && bom.connectedSource !== 'CATALOG' && (
                <div className="text-[11px] font-semibold text-purple-700 flex items-center space-x-1 mt-0.5">
                  <span>Connected Origin:</span>
                  <span className="font-bold underline">{bom.connectedSourceRef || bom.orderNo || bom.workOrderNo}</span>
                  {bom.customerName && <span>({bom.customerName})</span>}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Revisions Tab Strip */}
        <div className="px-6 py-2.5 border-b border-slate-200 bg-slate-100/70 flex justify-between items-center gap-2 overflow-x-auto">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600">Revisions:</span>
            {bom.revisions?.map((rev, idx) => (
              <button
                key={rev.id || idx}
                onClick={() => {
                  setActiveRevIndex(idx);
                  setItems(rev.items || []);
                  setShowRejectBox(false);
                  setShowNextRevBox(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition cursor-pointer ${
                  idx === activeRevIndex
                    ? 'bg-[#0c1222] text-[#d4ff00] shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <span>{rev.revisionCode}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                  rev.status === 'RELEASED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                  rev.status === 'DRAFT' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                  rev.status === 'IN_REVIEW' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                  rev.status === 'APPROVED' ? 'bg-cyan-100 text-cyan-800 border border-cyan-300' :
                  'bg-slate-200 text-slate-600'
                }`}>
                  {rev.status}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowNextRevBox(!showNextRevBox)}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-bold flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>+ New Revision</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* New Revision Prompt Box */}
          {showNextRevBox && (
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3">
              <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                Create Next Sequential Revision
              </h4>
              <p className="text-xs text-indigo-900 font-medium leading-relaxed">
                Clones this current recipe into a new DRAFT revision. Previous released revisions remain preserved and active until the new revision is reviewed and released.
              </p>
              <input
                type="text"
                value={nextRevReason}
                onChange={(e) => setNextRevReason(e.target.value)}
                placeholder="Reason for change (e.g. Optimized scrap allowance, upgraded raw electrode copper grade)..."
                className="w-full bg-white border border-indigo-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#0c1222] shadow-xs"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowNextRevBox(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={isProcessing}
                  onClick={async () => {
                    await onCreateNextRev(bom.id, nextRevReason);
                    setShowNextRevBox(false);
                    setNextRevReason('');
                  }}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-xs font-black text-white rounded-xl shadow-xs transition cursor-pointer"
                >
                  Confirm Clone to Next Revision
                </button>
              </div>
            </div>
          )}

          {/* Status Banner Card */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs transition ${
            isReleased ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' :
            isDraft ? 'bg-amber-50/80 border-amber-200 text-amber-950' :
            isInReview ? 'bg-purple-50/80 border-purple-200 text-purple-950' :
            isApproved ? 'bg-cyan-50/80 border-cyan-200 text-cyan-950' :
            'bg-slate-100 border-slate-200 text-slate-800'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center space-x-2.5">
                <span className="font-black text-[#0f172a] text-sm">{currentRev.revisionCode}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase ${
                  isReleased ? 'bg-emerald-200 text-emerald-900' :
                  isDraft ? 'bg-amber-200 text-amber-900' :
                  isInReview ? 'bg-purple-200 text-purple-900' :
                  isApproved ? 'bg-cyan-200 text-cyan-900' :
                  'bg-slate-300 text-slate-800'
                }`}>
                  {currentRev.status}
                </span>

                {isReleased && (
                  <span className="text-[11px] text-emerald-800 font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Official shop-floor release. Locked & immutable.</span>
                  </span>
                )}
                {isSuperseded && (
                  <span className="text-[11px] text-slate-600 font-semibold">
                    (Superseded by a newer release. Preserved for audit record).
                  </span>
                )}
                {isInReview && (
                  <span className="text-[11px] text-purple-800 font-bold flex items-center space-x-1">
                    <Send className="w-3.5 h-3.5 text-purple-600" />
                    <span>Submitted for Enterprise Admin & Technical Lead authorization.</span>
                  </span>
                )}
              </div>
              <p className="text-slate-700 text-xs font-medium">
                Reason / Scope: <span className="font-bold text-slate-900">{currentRev.changeReason || 'Standard production specification'}</span>
              </p>
            </div>

            {/* Workflow Action Buttons */}
            <div className="flex items-center space-x-2">
              {isDraft && (
                <>
                  <button
                    disabled={isProcessing}
                    onClick={handleSaveDraft}
                    className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    Save Draft Items
                  </button>
                  <button
                    disabled={isProcessing}
                    onClick={() => onSubmitRevision(currentRev.id)}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-xs transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit for Review</span>
                  </button>
                </>
              )}

              {isInReview && (
                <>
                  {isAdminOrLead ? (
                    <>
                      <button
                        disabled={isProcessing}
                        onClick={() => setShowRejectBox(!showRejectBox)}
                        className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-300 text-rose-700 hover:bg-rose-100 text-xs font-bold transition cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        disabled={isProcessing}
                        onClick={() => onApproveRevision(currentRev.id)}
                        className="px-4 py-2 rounded-xl bg-[#d4ff00] hover:bg-[#bce600] text-black text-xs font-black shadow-xs transition cursor-pointer flex items-center space-x-1.5"
                      >
                        <ShieldCheck className="w-4 h-4 text-black" />
                        <span>Approve BOM</span>
                      </button>
                    </>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-purple-100 border border-purple-300 text-purple-900 text-xs font-bold">
                      Awaiting Admin Approval
                    </span>
                  )}
                </>
              )}

              {isApproved && (
                <button
                  disabled={isProcessing}
                  onClick={handleRelease}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Officially Release for Factory</span>
                </button>
              )}
            </div>
          </div>

          {/* Rejection comment form */}
          {showRejectBox && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2.5">
              <label className="block text-xs font-bold text-rose-900">
                Mandatory Rejection Comment / Revision Notes
              </label>
              <input
                type="text"
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="State technical or financial reason for returning this BOM to draft..."
                className="w-full bg-white border border-rose-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-rose-600 shadow-xs"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowRejectBox(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!rejectComment.trim()) return alert('Comment is mandatory.');
                    onRejectRevision(currentRev.id, rejectComment);
                    setShowRejectBox(false);
                  }}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-xs font-black text-white rounded-xl shadow-xs"
                >
                  Send Back to Draft
                </button>
              </div>
            </div>
          )}

          {/* Component Lines Table */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-[#0f172a] uppercase tracking-wider">
                Bill of Material Items ({items.length} Component lines)
              </h3>
              {isDraft && (
                <button
                  onClick={handleAddItem}
                  className="px-3.5 py-1.5 rounded-xl bg-[#0c1222] hover:bg-slate-900 text-[#d4ff00] text-xs font-bold flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              )}
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-100 border-b border-slate-200 text-[11px] font-black text-slate-700 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-3">Raw Material / Component</th>
                    <th className="py-3 px-2 text-right">Quantity</th>
                    <th className="py-3 px-2">UoM</th>
                    <th className="py-3 px-2 text-right">Rate (₹)</th>
                    <th className="py-3 px-2 text-right">Scrap %</th>
                    <th className="py-3 px-3 text-right">Line Cost (₹)</th>
                    {isDraft && <th className="py-3 px-2 text-center">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {items.map((it, idx) => (
                    <tr key={it.id || idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 text-slate-400 font-bold text-xs">{idx + 1}</td>
                      <td className="py-3 px-3 font-sans">
                        {isDraft ? (
                          <select
                            value={it.componentProductId}
                            onChange={(e) => handleItemChange(idx, 'componentProductId', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#0c1222] shadow-xs cursor-pointer"
                          >
                            {safeComponents.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.sku} — {c.name} (₹{Number(c.rate || 0).toLocaleString('en-IN')}/{c.uom})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div>
                            <div className="font-bold text-[#0f172a] text-xs">{it.componentName}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{it.componentSku}</div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {isDraft ? (
                          <input
                            type="number"
                            min="0.001"
                            step="any"
                            value={it.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-24 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-right text-slate-900 font-bold focus:outline-none focus:border-[#0c1222] shadow-xs"
                          />
                        ) : (
                          <span className="font-black text-[#0f172a] text-xs">{it.quantity}</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-slate-600 font-bold text-[11px] font-sans">{it.uom}</td>
                      <td className="py-3 px-2 text-right text-slate-800 font-bold">
                        {isDraft ? (
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={it.unitRate}
                            onChange={(e) => handleItemChange(idx, 'unitRate', e.target.value)}
                            className="w-24 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-right text-slate-900 font-bold focus:outline-none focus:border-[#0c1222] shadow-xs"
                          />
                        ) : (
                          <span>₹{Number(it.unitRate).toFixed(2)}</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {isDraft ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={it.scrapPercent}
                            onChange={(e) => handleItemChange(idx, 'scrapPercent', e.target.value)}
                            className="w-20 bg-amber-50 border border-amber-300 rounded-xl px-2 py-1.5 text-xs text-right text-amber-950 font-bold focus:outline-none focus:border-amber-500 shadow-xs"
                          />
                        ) : (
                          <span className="text-amber-800 font-bold">{it.scrapPercent}%</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-emerald-700 text-xs">
                        ₹{Number(it.lineCost).toFixed(2)}
                      </td>
                      {isDraft && (
                        <td className="py-3 px-2 text-center font-sans">
                          <button
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={isDraft ? 8 : 7} className="py-8 text-center text-slate-500 font-sans text-xs font-semibold">
                        No component items in this BOM draft. Click "+ Add Line Item" to select raw materials.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cost Snapshot / Guidance Cards - High Contrast Light Theme */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Calculator className="w-4 h-4 text-slate-800" />
                <h4 className="text-xs font-black text-[#0f172a] uppercase tracking-wider">
                  {currentRev.costSnapshot ? 'Frozen Cost Snapshot (Locked at Release)' : 'Live Estimated Cost & Margin Guidance'}
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Formula: (Material + Labour ₹{labourCost}) × (1 + Overhead {overheadPercent}%)
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono text-center">
              
              {/* 1. Raw Material Cost */}
              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="text-[10px] text-slate-500 uppercase font-sans font-bold tracking-wider">
                  Raw Material Cost
                </div>
                <div className="text-base font-black text-slate-900 mt-1">
                  ₹{materialCost.toFixed(2)}
                </div>
              </div>

              {/* 2. Shopfloor Labour */}
              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="text-[10px] text-slate-500 uppercase font-sans font-bold tracking-wider">
                  Shopfloor Labour
                </div>
                <div className="text-base font-black text-slate-900 mt-1">
                  ₹{labourCost.toFixed(2)}
                </div>
              </div>

              {/* 3. Overhead */}
              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="text-[10px] text-slate-500 uppercase font-sans font-bold tracking-wider">
                  Overhead ({overheadPercent}%)
                </div>
                <div className="text-base font-black text-slate-900 mt-1">
                  ₹{overheadCost.toFixed(2)}
                </div>
              </div>

              {/* 4. Total Factory Cost - Acid Lime Pill */}
              <div className="p-3 rounded-xl bg-[#d4ff00]/20 border-2 border-[#d4ff00] shadow-xs">
                <div className="text-[10px] text-slate-900 uppercase font-sans font-black tracking-wider">
                  Total Factory Cost
                </div>
                <div className="text-lg font-black text-[#0f172a] mt-1">
                  ₹{totalEstimatedCost.toFixed(2)}
                </div>
              </div>

              {/* 5. Suggested M1 Price */}
              <div className="p-3 rounded-xl bg-purple-50 border-2 border-purple-200 shadow-xs">
                <div className="text-[10px] text-purple-900 uppercase font-sans font-black tracking-wider">
                  Suggested M1 Price (+{targetMarginPercent}%)
                </div>
                <div className="text-lg font-black text-purple-950 mt-1">
                  ₹{suggestedPrice.toFixed(2)}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
