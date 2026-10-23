import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, IndianRupee, Landmark } from 'lucide-react';
import { financeService } from '../../services/financeService';

export default function RecordReceiptModal({ isOpen, onClose, onReceiptRecorded, invoices = [] }) {
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [receivedOn, setReceivedOn] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState('NEFT');
  const [referenceNo, setReferenceNo] = useState('');
  const [bank, setBank] = useState('HDFC Bank Ltd');
  const [tdsDeduction, setTdsDeduction] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedAllocations, setSelectedAllocations] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Filter open unpaid invoices for selected customer
  const openInvoices = invoices.filter(inv => 
    (!customerId || inv.customerId === customerId) && inv.balanceAmount > 0 && inv.status !== 'DRAFT'
  );

  // Derive unique customers from open invoices
  const customerList = Array.from(new Set(invoices.map(i => i.customerId))).map(cid => {
    const inv = invoices.find(i => i.customerId === cid);
    return { id: cid, name: inv?.customerSnapshot?.name || cid };
  });

  useEffect(() => {
    if (customerList.length > 0 && !customerId) {
      setCustomerId(customerList[0].id);
    }
  }, [customerList]);

  // Auto-allocate funds when amount changes
  const handleAutoAllocate = () => {
    let remaining = Number(amount) || 0;
    const allocMap = {};
    openInvoices.forEach(inv => {
      if (remaining > 0) {
        const canTake = Math.min(remaining, inv.balanceAmount);
        allocMap[inv.id] = canTake;
        remaining -= canTake;
      } else {
        allocMap[inv.id] = 0;
      }
    });
    setSelectedAllocations(allocMap);
  };

  const handleManualAllocChange = (invId, val) => {
    const num = Math.max(0, Number(val));
    setSelectedAllocations(prev => ({
      ...prev,
      [invId]: num
    }));
  };

  const totalAllocated = Object.values(selectedAllocations).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const unallocatedAmount = Math.max(0, (Number(amount) || 0) - totalAllocated);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmt = Number(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setError('Please enter a valid receipt amount.');
      return;
    }
    if (!referenceNo.trim()) {
      setError('Bank transaction reference / UTR number is mandatory.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const allocationsArray = Object.entries(selectedAllocations)
        .filter(([_, val]) => Number(val) > 0)
        .map(([invId, val]) => ({ invoiceId: invId, amount: Number(val) }));

      const deductionsArray = [];
      const numTds = Number(tdsDeduction);
      if (!isNaN(numTds) && numTds > 0) {
        deductionsArray.push({
          type: "TDS_194C",
          description: "Tax Deducted at Source by customer under Section 194C",
          amount: numTds
        });
      }

      await financeService.recordReceipt({
        customerId,
        receivedOn,
        method,
        referenceNo: referenceNo.trim(),
        bank,
        amount: numAmt,
        notes,
        allocations: allocationsArray,
        deductions: deductionsArray
      });

      onReceiptRecorded();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to record receipt.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-[#141d30] text-white p-5 flex justify-between items-center border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-600 text-white uppercase tracking-wider">
                M6.1 Collection
              </span>
              <h2 className="text-base font-bold">Record Customer Receipt & Invoice Allocation</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Apply NEFT / RTGS payments, allocate against outstanding invoices, and capture TDS deductions.
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 mx-6 mt-4 flex items-center space-x-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Customer Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Paying Customer</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg font-bold focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none shadow-sm"
            >
              {customerList.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Payment Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Amount Received (₹)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 150000"
                required
                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg font-mono font-bold text-sm placeholder:text-slate-500 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg font-medium focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none shadow-sm"
              >
                <option value="NEFT">NEFT (National Electronic Fund Transfer)</option>
                <option value="RTGS">RTGS (Real Time Gross Settlement)</option>
                <option value="UPI">UPI / Instant Bank Payment</option>
                <option value="CHEQUE">Bank Cheque (Subject to clearance)</option>
                <option value="CASH">Cash Deposit</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bank UTR / Transaction Reference</label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g. HDFCN2628591024"
                required
                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg font-mono placeholder:text-slate-500 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Date</label>
              <input
                type="date"
                value={receivedOn}
                onChange={(e) => setReceivedOn(e.target.value)}
                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none shadow-sm"
              />
            </div>
          </div>

          {/* Deductions Capture */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2">
            <div className="font-bold text-amber-900 flex justify-between items-center">
              <span>Customer Tax Deduction (TDS Sec 194C / 194Q)</span>
              <span className="text-[10px] text-amber-700 font-normal">Optional</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={tdsDeduction}
                onChange={(e) => setTdsDeduction(e.target.value)}
                placeholder="TDS Amount (₹), e.g. 3000"
                className="w-full px-3 py-1.5 border border-amber-300 rounded-lg bg-white text-slate-900 font-mono placeholder:text-slate-500 focus:border-blue-600 focus:outline-none shadow-sm"
              />
            </div>
          </div>

          {/* Invoice Allocation Table */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Allocate Across Open Invoices
              </label>
              <button
                type="button"
                onClick={handleAutoAllocate}
                className="text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                Auto-Allocate FIFO
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto bg-white">
              {openInvoices.map(inv => (
                <div key={inv.id} className="p-2.5 flex justify-between items-center bg-slate-50/50 hover:bg-slate-50">
                  <div>
                    <div className="font-mono font-bold text-blue-700">{inv.invoiceNo}</div>
                    <div className="text-[10px] text-slate-500">
                      Total: ₹{inv.grandTotal.toLocaleString()} · <span className="text-red-600 font-bold">Bal: ₹{inv.balanceAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500">Allocate:</span>
                    <input
                      type="number"
                      min="0"
                      max={inv.balanceAmount}
                      value={selectedAllocations[inv.id] || ''}
                      onChange={(e) => handleManualAllocChange(inv.id, e.target.value)}
                      placeholder="₹0"
                      className="w-24 px-2 py-1 text-right font-mono font-bold bg-white text-slate-900 border border-slate-300 rounded-md placeholder:text-slate-500 focus:border-blue-600 focus:outline-none shadow-sm"
                    />
                  </div>
                </div>
              ))}
              {openInvoices.length === 0 && (
                <div className="p-4 text-center text-slate-400">
                  No open unpaid invoices found for this customer.
                </div>
              )}
            </div>

            {/* Allocation Math Summary */}
            <div className="mt-2 p-2 bg-slate-100 rounded-lg flex justify-between text-[11px] font-mono text-slate-700">
              <span>Allocated: <strong>₹{totalAllocated.toLocaleString()}</strong></span>
              <span>Unallocated Advance Credit: <strong className="text-emerald-700">₹{unallocatedAmount.toLocaleString()}</strong></span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Recording Receipt...' : 'Record Receipt & Update Balances'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
