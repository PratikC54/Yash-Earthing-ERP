import React, { useState } from 'react';
import { X, Plus, Trash2, CheckCircle2, AlertTriangle, ShieldAlert, GitCommit, Calculator } from 'lucide-react';

export default function BOMEditorModal({
  isOpen,
  onClose,
  bom,
  product,
  availableComponents,
  costingPolicy,
  onSaveItems,
  onSubmitRevision,
  onApproveRevision,
  onRejectRevision,
  onReleaseRevision,
  onCreateNextRev
}) {
  const [activeRevIndex, setActiveRevIndex] = useState(bom?.revisions?.length ? bom.revisions.length - 1 : 0);
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
  const labourCost = Number(costingPolicy?.labourCostPerUnit || 140);
  const overheadCost = (materialCost + labourCost) * (Number(costingPolicy?.overheadPercent || 12) / 100);
  const totalEstimatedCost = materialCost + labourCost + overheadCost;
  const suggestedPrice = totalEstimatedCost * (1 + Number(costingPolicy?.targetMarginPercent || 28) / 100);

  const handleAddItem = () => {
    const defaultComp = availableComponents[0] || {};
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
      const comp = availableComponents.find(c => String(c.id) === String(value)) || {};
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
      setError(err.response?.data?.message || err.message || 'Error saving items');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRelease = async () => {
    if (!window.confirm(`Are you sure you want to officially RELEASE ${currentRev.revisionCode}? This will freeze the cost snapshot at ₹${totalEstimatedCost.toFixed(2)} and supersede previous revisions.`)) return;
    try {
      setIsProcessing(true);
      setError('');
      await onReleaseRevision(currentRev.id);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error releasing revision');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#1a233a] border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden text-slate-200">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-[#141d30]">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-900/50 text-blue-400 font-bold border border-blue-500/30">
                {bom.bomCode}
              </span>
              <h2 className="text-base font-bold text-white tracking-wide">{bom.title}</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Target Product: <span className="text-white font-medium">{product?.sku} — {product?.name}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Revision Tabs */}
        <div className="px-6 py-3 bg-[#111928] border-b border-slate-800 flex items-center justify-between overflow-x-auto">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-400 mr-2">Revisions:</span>
            {bom.revisions?.map((rev, idx) => (
              <button
                key={rev.id}
                onClick={() => {
                  setActiveRevIndex(idx);
                  setItems(rev.items || []);
                  setShowRejectBox(false);
                  setShowNextRevBox(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                  idx === activeRevIndex
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <span>{rev.revisionCode}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                  rev.status === 'RELEASED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' :
                  rev.status === 'DRAFT' ? 'bg-amber-950 text-amber-400 border border-amber-500/40' :
                  rev.status === 'IN_REVIEW' ? 'bg-purple-950 text-purple-400 border border-purple-500/40' :
                  rev.status === 'APPROVED' ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/40' :
                  'bg-slate-900 text-slate-500'
                }`}>
                  {rev.status}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowNextRevBox(!showNextRevBox)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>+ New Revision</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-xs bg-red-950/60 border border-red-500/50 text-red-200 rounded-lg flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* New Revision Prompt Box */}
          {showNextRevBox && (
            <div className="p-4 bg-indigo-950/30 border border-indigo-500/40 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Create Next Sequential Revision</h4>
              <p className="text-xs text-slate-300">
                Clones current BOM into a new DRAFT revision. Previous released revisions remain preserved and active until the new revision is reviewed and released.
              </p>
              <input
                type="text"
                value={nextRevReason}
                onChange={(e) => setNextRevReason(e.target.value)}
                placeholder="Reason for change (e.g. Optimized scrap allowance, replaced clamp hardware)..."
                className="w-full bg-[#101726] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowNextRevBox(false)}
                  className="px-3 py-1.5 bg-slate-800 text-xs text-slate-300 rounded-lg"
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
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-lg shadow-md transition"
                >
                  Confirm Clone to Next Revision
                </button>
              </div>
            </div>
          )}

          {/* Status banner */}
          <div className="p-3.5 rounded-xl bg-[#141d30] border border-slate-800 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-sm">{currentRev.revisionCode}</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  isReleased ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  isDraft ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  isInReview ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                  isApproved ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                  'bg-slate-700 text-slate-400'
                }`}>
                  {currentRev.status}
                </span>
                {isReleased && (
                  <span className="text-[11px] text-emerald-400/90 font-medium flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Official shop-floor release. Locked & immutable.</span>
                  </span>
                )}
                {isSuperseded && (
                  <span className="text-[11px] text-slate-400 font-medium">
                    (Superseded by a newer release. Locked for historical record).
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-[11px]">
                Reason / Scope: <span className="text-slate-300">{currentRev.changeReason || 'Standard production specification'}</span>
              </p>
            </div>

            {/* Workflow Action Buttons */}
            <div className="flex items-center space-x-2">
              {isDraft && (
                <>
                  <button
                    disabled={isProcessing}
                    onClick={handleSaveDraft}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
                  >
                    Save Draft Items
                  </button>
                  <button
                    disabled={isProcessing}
                    onClick={() => onSubmitRevision(currentRev.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow transition"
                  >
                    Submit for Review
                  </button>
                </>
              )}

              {isInReview && (
                <>
                  <button
                    disabled={isProcessing}
                    onClick={() => setShowRejectBox(!showRejectBox)}
                    className="px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-500/50 text-red-300 hover:bg-red-900/60 text-xs font-semibold transition"
                  >
                    Reject
                  </button>
                  <button
                    disabled={isProcessing}
                    onClick={() => onApproveRevision(currentRev.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition"
                  >
                    Approve BOM
                  </button>
                </>
              )}

              {isApproved && (
                <button
                  disabled={isProcessing}
                  onClick={handleRelease}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Officially Release for Factory</span>
                </button>
              )}
            </div>
          </div>

          {/* Rejection comment form */}
          {showRejectBox && (
            <div className="p-3 bg-red-950/30 border border-red-500/40 rounded-xl space-y-2">
              <label className="block text-xs font-semibold text-red-300">Mandatory Rejection Comment</label>
              <input
                type="text"
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="State technical or financial reason for rejecting this BOM..."
                className="w-full bg-[#101726] border border-red-900 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
              />
              <div className="flex justify-end space-x-2">
                <button onClick={() => setShowRejectBox(false)} className="px-3 py-1 bg-slate-800 text-xs rounded text-slate-300">Cancel</button>
                <button
                  onClick={() => {
                    if (!rejectComment.trim()) return alert('Comment is mandatory.');
                    onRejectRevision(currentRev.id, rejectComment);
                    setShowRejectBox(false);
                  }}
                  className="px-3 py-1 bg-red-600 hover:bg-red-500 text-xs font-semibold text-white rounded"
                >
                  Send Back to Draft
                </button>
              </div>
            </div>
          )}

          {/* Component Lines Table */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Bill of Material Items ({items.length} Component lines)
              </h3>
              {isDraft && (
                <button
                  onClick={handleAddItem}
                  className="px-3 py-1 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 text-xs font-semibold flex items-center space-x-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              )}
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#121a2c]">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#141d30] border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Raw Material / Component</th>
                    <th className="py-2.5 px-2 text-right">Quantity</th>
                    <th className="py-2.5 px-2">UoM</th>
                    <th className="py-2.5 px-2 text-right">Rate (₹)</th>
                    <th className="py-2.5 px-2 text-right">Scrap %</th>
                    <th className="py-2.5 px-3 text-right">Line Cost (₹)</th>
                    {isDraft && <th className="py-2.5 px-2 text-center">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {items.map((it, idx) => (
                    <tr key={it.id || idx} className="hover:bg-slate-800/30 transition">
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-sans">
                        {isDraft ? (
                          <select
                            value={it.componentProductId}
                            onChange={(e) => handleItemChange(idx, 'componentProductId', e.target.value)}
                            className="w-full bg-[#101726] border border-slate-700 rounded px-2 py-1 text-xs text-white font-sans focus:outline-none focus:border-blue-500"
                          >
                            {availableComponents.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.sku} — {c.name} (₹{c.rate}/{c.uom})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div>
                            <div className="font-semibold text-white">{it.componentName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{it.componentSku}</div>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {isDraft ? (
                          <input
                            type="number"
                            min="0.001"
                            step="any"
                            value={it.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-20 bg-[#101726] border border-slate-700 rounded px-2 py-1 text-xs text-right text-white focus:outline-none"
                          />
                        ) : (
                          <span className="font-bold text-white">{it.quantity}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-slate-400 text-[11px] font-sans">{it.uom}</td>
                      <td className="py-2.5 px-2 text-right text-slate-300">
                        {isDraft ? (
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={it.unitRate}
                            onChange={(e) => handleItemChange(idx, 'unitRate', e.target.value)}
                            className="w-20 bg-[#101726] border border-slate-700 rounded px-2 py-1 text-xs text-right text-cyan-300 focus:outline-none"
                          />
                        ) : (
                          <span>₹{Number(it.unitRate).toFixed(2)}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {isDraft ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={it.scrapPercent}
                            onChange={(e) => handleItemChange(idx, 'scrapPercent', e.target.value)}
                            className="w-16 bg-[#101726] border border-slate-700 rounded px-2 py-1 text-xs text-right text-amber-300 focus:outline-none"
                          />
                        ) : (
                          <span className="text-amber-400">{it.scrapPercent}%</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                        ₹{Number(it.lineCost).toFixed(2)}
                      </td>
                      {isDraft && (
                        <td className="py-2.5 px-2 text-center font-sans">
                          <button
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-950/40 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={isDraft ? 8 : 7} className="py-6 text-center text-slate-500 font-sans">
                        No component items in this BOM draft. Click "+ Add Line Item" to select raw materials.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Frozen Cost Snapshot OR Dynamic Costing Breakdown */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#141d30] to-[#121c33] border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Calculator className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {currentRev.costSnapshot ? 'Frozen Cost Snapshot (Locked at Release)' : 'Live Estimated Cost & Margin Guidance'}
                </h4>
              </div>
              <span className="text-[10px] text-slate-400">
                Formula: (Material + Labour ₹{costingPolicy?.labourCostPerUnit}) × (1 + Overhead {costingPolicy?.overheadPercent}%)
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono text-center">
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-sans">Raw Material Cost</div>
                <div className="text-sm font-bold text-white mt-1">₹{materialCost.toFixed(2)}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-sans">Shopfloor Labour</div>
                <div className="text-sm font-bold text-slate-300 mt-1">₹{labourCost.toFixed(2)}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-sans">Overhead ({costingPolicy?.overheadPercent}%)</div>
                <div className="text-sm font-bold text-slate-300 mt-1">₹{overheadCost.toFixed(2)}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-500/40">
                <div className="text-[10px] text-blue-300 uppercase font-sans">Total Factory Cost</div>
                <div className="text-sm font-bold text-blue-400 mt-1">₹{totalEstimatedCost.toFixed(2)}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40">
                <div className="text-[10px] text-emerald-300 uppercase font-sans">Suggested M1 Price (+{costingPolicy?.targetMarginPercent}%)</div>
                <div className="text-sm font-bold text-emerald-400 mt-1">₹{suggestedPrice.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
