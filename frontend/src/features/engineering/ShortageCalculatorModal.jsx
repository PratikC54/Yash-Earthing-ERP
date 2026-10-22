import React, { useState } from 'react';
import { X, Calculator, AlertOctagon, CheckCircle2, ArrowRight } from 'lucide-react';
import { engineeringService } from '../../services/engineeringService';

export default function ShortageCalculatorModal({ isOpen, onClose, products }) {
  if (!isOpen) return null;

  const finishedProducts = products.filter(p => p.itemType === 'FINISHED');
  const [selectedProductId, setSelectedProductId] = useState(finishedProducts[0]?.id || '');
  const [orderQuantity, setOrderQuantity] = useState('500');
  const [shortageResult, setShortageResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCalculate = async () => {
    if (!selectedProductId) return;
    try {
      setIsLoading(true);
      setError('');
      const res = await engineeringService.calculateShortage(selectedProductId, Number(orderQuantity) || 1);
      setShortageResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error calculating shortage');
      setShortageResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#1a233a] border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden text-slate-200">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-[#141d30]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">BOM Material Shortage & Procurement Check</h2>
              <p className="text-xs text-slate-400">Formula: Required = BOM Line Qty × (1 + Scrap %) × Order Qty vs. Available Stock</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-xs bg-red-950/60 border border-red-500/50 text-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#141d30] p-4 rounded-xl border border-slate-800">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Select Finished Product</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-[#101726] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {finishedProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} — {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Order Quantity</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(e.target.value)}
                  placeholder="500"
                  className="w-full bg-[#101726] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={handleCalculate}
                  disabled={isLoading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg shadow-md transition disabled:opacity-50"
                >
                  {isLoading ? '...' : 'Compute'}
                </button>
              </div>
            </div>
          </div>

          {shortageResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#111928] border border-slate-800">
                <div className="text-xs">
                  <span className="text-slate-400">Evaluated against: </span>
                  <span className="font-bold text-white">{shortageResult.bomRevision} (Released)</span>
                </div>
                <div>
                  {shortageResult.hasShortage ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-950/80 text-red-400 border border-red-500/50 flex items-center space-x-1.5">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      <span>Material Shortage Detected (Handover to M2 Purchase)</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Sufficient Inventory Available for Production</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#121a2c]">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#141d30] border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Raw Material / Component</th>
                      <th className="py-2.5 px-2 text-right">Qty/Unit</th>
                      <th className="py-2.5 px-2 text-right">Total Required</th>
                      <th className="py-2.5 px-2 text-right">Available Stock</th>
                      <th className="py-2.5 px-3 text-right">Procurement Shortage</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {shortageResult.shortages?.map((s) => (
                      <tr key={s.componentId} className="hover:bg-slate-800/30 transition">
                        <td className="py-2.5 px-3 font-sans">
                          <div className="font-semibold text-white">{s.componentName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{s.componentSku}</div>
                        </td>
                        <td className="py-2.5 px-2 text-right text-slate-400">
                          {s.qtyPerUnit} {s.uom}
                        </td>
                        <td className="py-2.5 px-2 text-right font-bold text-white">
                          {s.totalRequired} {s.uom}
                        </td>
                        <td className="py-2.5 px-2 text-right text-slate-300">
                          {s.availableStock} {s.uom}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-bold ${
                          s.shortage > 0 ? 'text-red-400 text-sm' : 'text-slate-500'
                        }`}>
                          {s.shortage > 0 ? `+${s.shortage} ${s.uom}` : '0 (Covered)'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans">
                          {s.shortage > 0 ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/60 text-red-300 border border-red-500/40">
                              Shortage
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                              Ready
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
