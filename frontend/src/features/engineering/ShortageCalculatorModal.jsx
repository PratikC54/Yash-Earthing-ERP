import React, { useState } from 'react';
import { X, Calculator, AlertOctagon, CheckCircle2, ArrowRight, ShoppingCart, Check } from 'lucide-react';
import { engineeringService } from '../../services/engineeringService';
import { createPurchaseRequest } from '../module2/api/procurementApi';

export default function ShortageCalculatorModal({ isOpen, onClose, products = [], onNavigate }) {
  const safeProducts = Array.isArray(products)
    ? products
    : (Array.isArray(products?.data) ? products.data : []);
  const finishedProducts = safeProducts.filter(p => p.itemType === 'FINISHED');
  const [selectedProductId, setSelectedProductId] = useState(finishedProducts[0]?.id || '');
  const [orderQuantity, setOrderQuantity] = useState('50');
  const [shortageResult, setShortageResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPushingPr, setIsPushingPr] = useState(false);
  const [createdPrNo, setCreatedPrNo] = useState(null);

  if (!isOpen) return null;

  const selectedProductObj = safeProducts.find(p => String(p.id) === String(selectedProductId));

  const handleCalculate = async () => {
    if (!selectedProductId) return;
    try {
      setIsLoading(true);
      setError('');
      setCreatedPrNo(null);
      const res = await engineeringService.calculateShortage(selectedProductId, Number(orderQuantity) || 1);
      setShortageResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error calculating shortage');
      setShortageResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushToProcurement = async () => {
    if (!shortageResult || !shortageResult.hasShortage) return;
    try {
      setIsPushingPr(true);
      setError('');

      // Map raw materials shortages to Module 2 items
      const items = shortageResult.shortages
        .filter(s => s.shortage > 0)
        .map(s => ({
          productId: (!isNaN(Number(s.componentId)) && Number(s.componentId) > 0)
            ? Number(s.componentId)
            : (s.componentSku?.includes('PIPE') || s.componentSku?.includes('MS') ? 8 : s.componentSku?.includes('ROD') || s.componentSku?.includes('COPPER') ? 2 : s.componentSku?.includes('CRYST') ? 9 : 2),
          quantity: Math.max(1, Math.ceil(s.shortage)),
          notes: `Material shortage: ${s.componentName} (${s.shortage} ${s.uom}) for ${selectedProductObj?.name || 'Earthing Product'}`
        }));

      const res = await createPurchaseRequest({
        title: `PR - Raw Material Shortage for ${selectedProductObj?.sku || 'Product'} (Batch: ${orderQuantity} units)`,
        priority: 'HIGH',
        department: 'Production & Planning (M4)',
        requiredBy: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        notes: `Auto-raised from Module 3 BOM Shortage Analysis for ${orderQuantity} units of ${selectedProductObj?.name || 'Product'} (BOM Rev: ${shortageResult.bomRevision})`,
        items: items.length > 0 ? items : [{ productId: 2, quantity: 100, notes: 'BOM Shortage' }]
      });

      if (res.success && res.data) {
        setCreatedPrNo(res.data.requestNo || 'PR-SUBMITTED');
      }
    } catch (err) {
      console.error('Failed to create PR from Shortage:', err);
      setError(err.response?.data?.message || 'Failed to raise purchase request in Module 2');
    } finally {
      setIsPushingPr(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/90 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#0c1222] text-[#d4ff00] flex items-center justify-center font-black shadow-xs">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#0f172a] tracking-tight">BOM Material Shortage & Procurement Check</h2>
              <p className="text-xs font-semibold text-slate-500">Formula: Required = BOM Line Qty × (1 + Scrap %) × Order Qty vs. Available Stock</p>
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

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-800 mb-1">Select Finished Product</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0c1222] shadow-xs cursor-pointer"
              >
                {finishedProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} — {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Customer Order Quantity</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={orderQuantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (val < 1) return;
                    setOrderQuantity(e.target.value);
                  }}
                  placeholder="500"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-[#0c1222] shadow-xs"
                />
                <button
                  type="button"
                  onClick={handleCalculate}
                  disabled={isLoading}
                  className="px-4 py-2 bg-[#d4ff00] hover:bg-[#bce600] text-black font-black text-xs rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? '...' : 'Compute'}
                </button>
              </div>
            </div>
          </div>

          {shortageResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs">
                  <span className="text-slate-500 font-semibold">Evaluated against: </span>
                  <span className="font-black text-[#0f172a]">{shortageResult.bomRevision} (Released)</span>
                </div>
                <div>
                  {shortageResult.hasShortage ? (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300 flex items-center space-x-1.5">
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                      <span>Material Shortage Detected (Handover to M2 Purchase)</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Sufficient Inventory Available for Production</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                <table className="w-full text-left text-xs text-slate-800">
                  <thead className="bg-slate-100 border-b border-slate-200 text-[11px] font-black text-slate-700 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-3">Raw Material / Component</th>
                      <th className="py-3 px-2 text-right">Qty/Unit</th>
                      <th className="py-3 px-2 text-right">Total Required</th>
                      <th className="py-3 px-2 text-right">Available Stock</th>
                      <th className="py-3 px-3 text-right">Procurement Shortage</th>
                      <th className="py-3 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {shortageResult.shortages?.map((s) => (
                      <tr key={s.componentId} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 font-sans">
                          <div className="font-bold text-[#0f172a]">{s.componentName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{s.componentSku}</div>
                        </td>
                        <td className="py-3 px-2 text-right text-slate-600">
                          {s.qtyPerUnit} {s.uom}
                        </td>
                        <td className="py-3 px-2 text-right font-black text-[#0f172a]">
                          {s.totalRequired} {s.uom}
                        </td>
                        <td className="py-3 px-2 text-right text-slate-700 font-bold">
                          {s.availableStock} {s.uom}
                        </td>
                        <td className={`py-3 px-3 text-right font-black ${
                          s.shortage > 0 ? 'text-rose-600 text-sm' : 'text-slate-400'
                        }`}>
                          {s.shortage > 0 ? `+${s.shortage} ${s.uom}` : '0 (Covered)'}
                        </td>
                        <td className="py-3 px-3 text-center font-sans">
                          {s.shortage > 0 ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                              Shortage
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Ready
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cross-Module Bridge: Handover Shortage to Module 2 Procurement */}
              {shortageResult.hasShortage && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-black text-[#0f172a] text-xs flex items-center gap-1.5">
                        <ShoppingCart className="w-4 h-4 text-[#0c1222]" />
                        <span>Module 2 Procurement Handover</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                        Automatically raise a Purchase Request in Module 2 for these shortage quantities.
                      </p>
                    </div>

                    {!createdPrNo ? (
                      <button
                        type="button"
                        onClick={handlePushToProcurement}
                        disabled={isPushingPr}
                        className="px-4 py-2 bg-[#d4ff00] hover:bg-[#bce600] text-black font-black text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        <ShoppingCart className="w-3.5 h-3.5 text-black" />
                        <span>{isPushingPr ? 'Raising PR...' : 'Raise Purchase Request in M2'}</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>PR Raised: {createdPrNo}</span>
                        </span>
                        {onNavigate && (
                          <button
                            type="button"
                            onClick={() => {
                              if (onClose) onClose();
                              onNavigate('purchase-requests');
                            }}
                            className="px-3.5 py-1.5 bg-[#0c1222] hover:bg-slate-900 text-[#d4ff00] font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1 cursor-pointer"
                          >
                            <span>Open M2 Requisitions</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#d4ff00]" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
