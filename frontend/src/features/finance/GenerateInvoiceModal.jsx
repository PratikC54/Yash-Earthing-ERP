import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, ShieldAlert, FileText, ArrowRight } from 'lucide-react';
import { financeService } from '../../services/financeService';

export default function GenerateInvoiceModal({ isOpen, onClose, onInvoiceCreated }) {
  const [billableOrders, setBillableOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [paymentTermsId, setPaymentTermsId] = useState('term_net30');
  const [poNumber, setPoNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadBillableOrders();
    } else {
      setSelectedOrder(null);
      setSelectedItems([]);
      setError('');
    }
  }, [isOpen]);

  const loadBillableOrders = async () => {
    try {
      setLoading(true);
      const res = await financeService.getBillableOrders();
      setBillableOrders(res.data || []);
      if (res.data?.length > 0) {
        handleSelectOrder(res.data[0]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch billable dispatch orders.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setPoNumber(order.poNumber || '');
    // Initialize items with eligible quantities
    const items = (order.items || []).filter(it => it.eligibleQty > 0).map(it => ({
      productId: it.productId,
      sku: it.sku,
      description: it.description,
      hsn: it.hsn || '85359090',
      qty: it.eligibleQty,
      eligibleQty: it.eligibleQty,
      rate: it.rate,
      uom: it.uom
    }));
    setSelectedItems(items);
  };

  const handleQtyChange = (idx, val) => {
    const num = Math.max(0, Math.min(Number(val), selectedItems[idx].eligibleQty));
    setSelectedItems(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], qty: num };
      return copy;
    });
  };

  // Calculations
  const isInterState = selectedOrder?.customerStateCode && selectedOrder.customerStateCode !== '27';
  const taxableTotal = selectedItems.reduce((sum, it) => sum + (it.qty * it.rate), 0);
  const gstRate = 0.18;
  const gstAmount = Math.round(taxableTotal * gstRate * 100) / 100;
  const grandTotal = Math.round(taxableTotal + gstAmount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (selectedOrder.hasOpenQcHold) {
      setError('Cannot invoice this order: Active QC Hold flagged by Production M4.');
      return;
    }
    if (selectedItems.every(it => it.qty === 0)) {
      setError('At least one item must have a quantity greater than 0.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await financeService.createInvoice({
        salesOrderId: selectedOrder.orderId,
        customerId: selectedOrder.customerId,
        items: selectedItems.filter(it => it.qty > 0),
        paymentTermsId,
        poNumber,
        notes
      });
      onInvoiceCreated();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create and issue invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#141d30] text-white p-5 flex justify-between items-center border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-600 text-white uppercase tracking-wider">
                M6.1 Invoicing
              </span>
              <h2 className="text-base font-bold">Generate GST Tax Invoice from Delivered Order</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Pull approved dispatch quantities from M1/M2 and apply exact statutory GST splits.
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 mx-6 mt-4 flex items-center space-x-2 text-xs text-red-700">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Step 1: Select Candidate Order */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              1. Select Billable Order (Upstream M1 Sales & M2 Dispatch)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {billableOrders.map(so => (
                <div
                  key={so.orderId}
                  onClick={() => handleSelectOrder(so)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition relative ${
                    selectedOrder?.orderId === so.orderId
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-bold text-blue-700">{so.orderNo}</span>
                    {so.hasOpenQcHold ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700 flex items-center space-x-1">
                        <ShieldAlert className="w-3 h-3" />
                        <span>QC HOLD</span>
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>READY</span>
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-1.5 truncate">{so.customerName}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">PO: {so.poNumber || 'N/A'}</div>
                  <div className="text-[11px] text-slate-600 font-bold mt-2">
                    Billable Value: <span className="font-mono text-slate-900">₹{so.totalEligibleValue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QC Hold Warning Banner */}
          {selectedOrder?.hasOpenQcHold && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">INVOICING BLOCKED BY M4 QUALITY CONTROL:</strong>
                <p className="mt-0.5">
                  This order has an active QC Hold ({selectedOrder.qcHoldReason}). As per ERP compliance rule #7, goods on QC hold cannot be billed until factory sign-off.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Line Item Selection & Quantities */}
          {selectedOrder && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. Dispatched Line Items (Eligible for Invoicing)
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  Place of Supply: <strong>State {selectedOrder.customerStateCode} ({isInterState ? 'Inter-State IGST 18%' : 'Intra-State CGST 9% + SGST 9%'})</strong>
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-2 text-center">HSN</th>
                      <th className="py-2.5 px-2 text-right">Eligible Qty</th>
                      <th className="py-2.5 px-2 text-center" style={{ width: '120px' }}>Invoice Qty</th>
                      <th className="py-2.5 px-2 text-right">Unit Rate</th>
                      <th className="py-2.5 px-3 text-right">Taxable Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedItems.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900">{it.description}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{it.sku}</div>
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-slate-600">{it.hsn}</td>
                        <td className="py-3 px-2 text-right font-mono font-bold text-slate-700">
                          {it.eligibleQty} {it.uom}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max={it.eligibleQty}
                            value={it.qty}
                            onChange={(e) => handleQtyChange(idx, e.target.value)}
                            disabled={selectedOrder.hasOpenQcHold}
                            className="w-20 px-2 py-1 text-center font-mono font-bold border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-slate-700">₹{it.rate}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-blue-900">
                          ₹{(it.qty * it.rate).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 3: Terms & Commercial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Terms</label>
                <select
                  value={paymentTermsId}
                  onChange={(e) => setPaymentTermsId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-medium"
                >
                  <option value="term_net30">Net 30 Days (Standard Commercial)</option>
                  <option value="term_net15">Net 15 Days (EPC Solar Standard)</option>
                  <option value="term_advance">100% Advance Payment</option>
                  <option value="term_milestone">Milestone: 40% Adv / 50% Dispatch / 10% Testing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer PO Reference</label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="e.g. PO-TP-2026-8819"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dispatch / Transport Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="LR No / Vehicle No / Delivery site notes"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Live GST Calculation Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider pb-1 border-b border-slate-200">
                Statutory GST Computation Summary
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Taxable Goods Value:</span>
                <span className="font-mono font-bold text-slate-900">₹{taxableTotal.toLocaleString()}</span>
              </div>
              {!isInterState ? (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Central GST (CGST @ 9%):</span>
                    <span className="font-mono font-bold text-slate-800">₹{(gstAmount / 2).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>State GST (SGST @ 9%):</span>
                    <span className="font-mono font-bold text-slate-800">₹{(gstAmount / 2).toLocaleString()}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-slate-600">
                  <span>Integrated GST (IGST @ 18%):</span>
                  <span className="font-mono font-bold text-slate-800">₹{gstAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                <span>Grand Total Receivable:</span>
                <span className="font-mono text-base text-blue-700">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedOrder || selectedOrder.hasOpenQcHold || taxableTotal <= 0}
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 rounded-xl shadow-md transition flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>{submitting ? 'Generating Official Invoice...' : 'Generate & Issue GST Tax Invoice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
