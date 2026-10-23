import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import { financeService } from '../../services/financeService';

export default function CreateVendorBillModal({ isOpen, onClose, onBillCreated }) {
  const [vendorId, setVendorId] = useState('ven_hindalco');
  const [billNo, setBillNo] = useState('');
  const [poNumber, setPoNumber] = useState('PO-2026-031');
  const [grnNumber, setGrnNumber] = useState('GRN-2026-089');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [taxableAmount, setTaxableAmount] = useState('');
  const [gstAmount, setGstAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const vendors = [
    { id: 'ven_hindalco', name: 'Hindalco Industries Ltd (Copper Division)', terms: 'Net 30 Days' },
    { id: 'ven_jindal', name: 'Jindal Stainless Steel Hisar Ltd', terms: 'Net 15 Days' }
  ];

  const handleTaxableChange = (val) => {
    setTaxableAmount(val);
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      setGstAmount((Math.round(num * 0.18 * 100) / 100).toString());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!billNo.trim() || !taxableAmount) {
      setError('Vendor Bill Number and Taxable Amount are mandatory.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await financeService.createVendorBill({
        vendorId,
        billNo: billNo.trim(),
        poNumber,
        grnNumber,
        billDate,
        dueDate: dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        taxableAmount: Number(taxableAmount),
        gstAmount: Number(gstAmount) || 0
      });

      onBillCreated();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to enter vendor bill.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-[#141d30] text-white p-5 flex justify-between items-center border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-600 text-white uppercase tracking-wider">
                M6.2 Payables
              </span>
              <h2 className="text-base font-bold">Enter Vendor Bill & 3-Way Match</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Verify vendor invoices against M2 Purchase Orders and GRN Goods Received receipts.
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Vendor Master</label>
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-800 focus:border-blue-500 focus:outline-none"
            >
              {vendors.map(v => (
                <option key={v.id} value={v.id}>{v.name} ({v.terms})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vendor Invoice / Bill No</label>
              <input
                type="text"
                value={billNo}
                onChange={(e) => setBillNo(e.target.value)}
                placeholder="e.g. HINDALCO/INV/8991"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bill Date</label>
              <input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Linked Purchase Order (M2 PO)</label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="e.g. PO-2026-031"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Goods Receipt Note (M2 GRN)</label>
              <input
                type="text"
                value={grnNumber}
                onChange={(e) => setGrnNumber(e.target.value)}
                placeholder="e.g. GRN-2026-089"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Taxable Goods Value (₹)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={taxableAmount}
                onChange={(e) => handleTaxableChange(e.target.value)}
                placeholder="e.g. 125000"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">GST Amount (18% ₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={gstAmount}
                onChange={(e) => setGstAmount(e.target.value)}
                placeholder="e.g. 22500"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 3-Way Match Policy Notice */}
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-start space-x-2 text-[11px] text-purple-900">
            <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Automated 3-Way Match Guard:</strong>
              <p className="mt-0.5 text-purple-800">
                The system will automatically cross-verify billed quantity against physical GRN inspection and contracted PO rates. Bills with mismatch exceeding tolerance (2% qty, 1% rate) cannot be approved without Admin override.
              </p>
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
              className="px-5 py-2.5 font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-md transition flex items-center space-x-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{submitting ? 'Verifying Match & Submitting...' : 'Submit Vendor Bill'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
