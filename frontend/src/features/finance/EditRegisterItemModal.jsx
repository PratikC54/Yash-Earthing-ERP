import React, { useState, useEffect } from 'react';
import {
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  Building2,
  IndianRupee,
  ShieldCheck,
  Save,
  Percent,
  Calculator
} from 'lucide-react';
import { financeService } from '../../services/financeService';

export default function EditRegisterItemModal({ isOpen, onClose, item, onSaved }) {
  const isProfitability = Boolean(
    item && (item.product !== undefined || item.material !== undefined || item.grossProfit !== undefined)
  );

  // Unified Register Form State
  const [formData, setFormData] = useState({
    invoiceNo: '',
    taxable: 0,
    gst: 0,
    invoiceValue: 0,
    paid: 0,
    dueDate: '',
    dueDisplay: '',
    status: '',
    notes: ''
  });

  // Profitability Costing Form State
  const [costData, setCostData] = useState({
    revenue: 0,
    material: 0,
    production: 0,
    logistics: 0,
    installation: 0,
    status: 'Healthy',
    notes: ''
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      if (isProfitability) {
        setCostData({
          revenue: Math.max(0, Number(item.revenue) || 0),
          material: Math.max(0, Number(item.material) || 0),
          production: Math.max(0, Number(item.production) || 0),
          logistics: Math.max(0, Number(item.logistics) || 0),
          installation: Math.max(0, Number(item.installation) || 0),
          status: item.status || 'Healthy',
          notes: item.notes || ''
        });
      } else {
        setFormData({
          invoiceNo: item.invoiceNo === '—' ? '' : item.invoiceNo,
          taxable: Math.max(0, Number(item.taxable) || 0),
          gst: Math.max(0, Number(item.gst) || 0),
          invoiceValue: Math.max(0, Number(item.invoiceValue) || 0),
          paid: Math.max(0, Number(item.paid) || 0),
          dueDate: item.dueDate || '',
          dueDisplay: item.dueDisplay || '',
          status: item.status || '—',
          notes: item.notes || ''
        });
      }
      setError('');
    }
  }, [item, isProfitability]);

  if (!isOpen || !item) return null;

  // Billing Handlers with strict positive validation
  const handleTaxableChange = (val) => {
    const num = Math.max(0, Number(val) || 0);
    const computedGst = Math.round(num * 0.18);
    setFormData(prev => ({
      ...prev,
      taxable: num,
      gst: computedGst,
      invoiceValue: prev.invoiceValue > 0 ? prev.invoiceValue : Math.round(num + computedGst)
    }));
  };

  const handleInvoiceValueChange = (val) => {
    const num = Math.max(0, Number(val) || 0);
    setFormData(prev => ({ ...prev, invoiceValue: num }));
  };

  const handlePaidChange = (val) => {
    const num = Math.max(0, Number(val) || 0);
    setFormData(prev => ({ ...prev, paid: num }));
  };

  const computedBalance = Math.max(0, (Number(formData.invoiceValue) || 0) - (Number(formData.paid) || 0));

  // Profitability Handlers
  const totalCost = (Number(costData.material) || 0) +
    (Number(costData.production) || 0) +
    (Number(costData.logistics) || 0) +
    (Number(costData.installation) || 0);
  const grossProfit = Math.max(0, (Number(costData.revenue) || 0) - totalCost);
  const marginPct = (Number(costData.revenue) || 0) > 0
    ? Math.round((grossProfit / (Number(costData.revenue) || 1)) * 100) + '%'
    : '0%';

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');

      if (isProfitability) {
        await financeService.updateProfitabilityItem(item.id || item.orderNo, {
          revenue: Number(costData.revenue),
          material: Number(costData.material),
          production: Number(costData.production),
          logistics: Number(costData.logistics),
          installation: Number(costData.installation),
          status: costData.status,
          notes: costData.notes
        });
      } else {
        if (formData.paid > formData.invoiceValue && formData.invoiceValue > 0) {
          setError('Paid amount cannot exceed the Total Invoice Value.');
          setSaving(false);
          return;
        }

        let derivedDisplay = formData.dueDisplay;
        if (formData.dueDate) {
          const d = new Date(formData.dueDate);
          derivedDisplay = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        }

        await financeService.updateUnifiedRegisterItem(item.id, {
          invoiceNo: formData.invoiceNo.trim() || '—',
          taxable: Number(formData.taxable),
          gst: Number(formData.gst),
          invoiceValue: Number(formData.invoiceValue),
          paid: Number(formData.paid),
          balance: computedBalance,
          dueDate: formData.dueDate,
          dueDisplay: derivedDisplay,
          status: formData.status,
          notes: formData.notes.trim()
        });
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save register record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="bg-[#141d30] text-white p-5 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              {isProfitability ? <Calculator className="w-5 h-5 text-purple-400" /> : <FileText className="w-5 h-5 text-blue-400" />}
            </div>
            <div>
              <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                {isProfitability ? 'Job Costing & Profitability Edit' : 'Controlled Register Edit'}
              </div>
              <h2 className="text-lg font-bold">
                {item.customerName} · {item.orderNo}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Info Strip */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <div className="text-slate-500 font-medium">{isProfitability ? 'Product / SKU:' : 'Customer GSTIN:'}</div>
            <div className="font-mono font-bold text-slate-800">{isProfitability ? item.product : (item.gstin || '27AAACY1234F1Z5')}</div>
          </div>
          <div>
            <div className="text-slate-500 font-medium">Sales Owner:</div>
            <div className="font-bold text-slate-800">{item.owner || 'Vikram Malhotra'}</div>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href="tel:+919822011991"
              title="Call Customer"
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 hover:text-blue-600 hover:border-blue-300 font-semibold flex items-center space-x-1 transition"
            >
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>Call</span>
            </a>
            <a
              href="https://wa.me/919822011991"
              target="_blank"
              rel="noreferrer"
              title="WhatsApp Payment Reminder"
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 hover:text-emerald-600 hover:border-emerald-300 font-semibold flex items-center space-x-1 transition"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </a>
            <a
              href="mailto:billing@suryagrid.com"
              title="Email Formal Invoice"
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 hover:text-indigo-600 hover:border-indigo-300 font-semibold flex items-center space-x-1 transition"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              <span>Email</span>
            </a>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isProfitability ? (
            /* ================= PROFITABILITY / COSTING FORM ================= */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Billed Revenue (Taxable Value ₹):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={costData.revenue}
                    onChange={(e) => setCostData({ ...costData, revenue: Math.max(0, Number(e.target.value) || 0) })}
                    className="w-full text-xs font-mono font-bold p-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:bg-white focus:text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Profitability Category:
                  </label>
                  <select
                    value={costData.status}
                    onChange={(e) => setCostData({ ...costData, status: e.target.value })}
                    className="w-full text-xs font-bold p-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:bg-white focus:text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="Healthy">Healthy Margin (Target &ge;30%)</option>
                    <option value="Draft">Draft / Under Production</option>
                    <option value="Unassigned">Not Created / Unassigned</option>
                  </select>
                </div>
              </div>

              {/* 4 Cost Centers */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 pb-1 border-b border-slate-200">
                  Cost Breakdown (Actuals vs BOM)
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Material (Stores):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={costData.material}
                      onChange={(e) => setCostData({ ...costData, material: Math.max(0, Number(e.target.value) || 0) })}
                      className="w-full text-xs font-mono font-bold p-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:bg-white focus:text-slate-900 focus:border-blue-600 focus:outline-none text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Production (Wages):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={costData.production}
                      onChange={(e) => setCostData({ ...costData, production: Math.max(0, Number(e.target.value) || 0) })}
                      className="w-full text-xs font-mono font-bold p-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:bg-white focus:text-slate-900 focus:border-blue-600 focus:outline-none text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Logistics (Freight):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={costData.logistics}
                      onChange={(e) => setCostData({ ...costData, logistics: Math.max(0, Number(e.target.value) || 0) })}
                      className="w-full text-xs font-mono font-bold p-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:bg-white focus:text-slate-900 focus:border-blue-600 focus:outline-none text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Installation / Testing:
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={costData.installation}
                      onChange={(e) => setCostData({ ...costData, installation: Math.max(0, Number(e.target.value) || 0) })}
                      className="w-full text-xs font-mono font-bold p-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:bg-white focus:text-slate-900 focus:border-blue-600 focus:outline-none text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Live Gross Profit & Margin Card */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between font-mono">
                <div>
                  <div className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider font-sans">
                    Total Actual Cost:
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    ₹{totalCost.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider font-sans">
                    Computed Gross Profit:
                  </div>
                  <div className="text-base font-black text-emerald-800 mt-0.5">
                    ₹{grossProfit.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider font-sans">
                    Gross Margin %:
                  </div>
                  <div className="text-xl font-black text-emerald-700 mt-0.5">
                    {marginPct}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cost Audit & Variance Notes:
                </label>
                <textarea
                  rows={2}
                  value={costData.notes}
                  onChange={(e) => setCostData({ ...costData, notes: e.target.value })}
                  placeholder="e.g. Copper price locked at ₹780/kg, installation crew wages verified..."
                  className="w-full text-xs p-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:bg-white focus:text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none font-medium"
                />
              </div>
            </div>
          ) : (
            /* ================= UNIFIED BILLING REGISTER FORM ================= */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Invoice Number / Series:
                  </label>
                  <input
                    type="text"
                    value={formData.invoiceNo}
                    onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                    placeholder="e.g. INV-116 or INV-DRAFT"
                    className="w-full text-xs font-mono font-bold p-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:bg-white focus:text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Leave blank or dash if awaiting dispatch release</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Operational Billing Status:
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full text-xs font-bold p-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:bg-white focus:text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="—">Pending Billing (—)</option>
                    <option value="Pending">Pending (Draft Issued)</option>
                    <option value="Part Paid">Part Paid</option>
                    <option value="Paid in Full">Paid in Full</option>
                    <option value="Overdue">Overdue Follow-up</option>
                    <option value="Disputed">Under Commercial Dispute</option>
                  </select>
                </div>
              </div>

              {/* Financials Row with Strict Positive Validation & Auto GST */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Taxable Material Value (₹):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.taxable}
                    onChange={(e) => handleTaxableChange(e.target.value)}
                    className="w-full text-xs font-mono font-bold p-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:bg-white focus:text-slate-900 focus:border-blue-600 focus:outline-none text-right"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    GST Amount (18% Statutory):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.gst}
                    onChange={(e) => setFormData({ ...formData, gst: Math.max(0, Number(e.target.value) || 0) })}
                    className="w-full text-xs font-mono p-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:bg-white focus:text-slate-900 focus:border-blue-600 focus:outline-none text-right"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-900 mb-1">
                    Billed Invoice Value (₹):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.invoiceValue}
                    onChange={(e) => handleInvoiceValueChange(e.target.value)}
                    className="w-full text-xs font-mono font-bold p-2 bg-white text-blue-900 border border-blue-400 rounded-lg focus:bg-white focus:text-blue-900 focus:border-blue-600 focus:outline-none text-right"
                  />
                </div>
              </div>

              {/* Collection & Balance Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                    Total Amount Paid / Received (₹):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.paid}
                    onChange={(e) => handlePaidChange(e.target.value)}
                    className="w-full text-xs font-mono font-bold p-2 bg-white text-emerald-800 border border-emerald-300 rounded-lg focus:bg-white focus:text-emerald-800 focus:border-blue-600 focus:outline-none text-right"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Remaining Outstanding Balance (₹):
                  </label>
                  <div className="w-full text-xs font-mono font-extrabold p-2 bg-white border border-slate-300 rounded-lg text-right text-red-600">
                    ₹{computedBalance.toLocaleString('en-IN')}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Statutory Payment Due Date:
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full text-xs font-mono p-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:bg-white focus:text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Operational & Dispatch Follow-up Notes:
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Milestone sign-off received, part payment credited via NEFT..."
                  className="w-full text-xs p-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:bg-white focus:text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none font-medium"
                />
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex justify-between items-center pt-3 border-t border-slate-200">
            <span className="text-[11px] text-slate-500">
              Updates will synchronize with live accounts receivable ledger and ageing.
            </span>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md transition disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Record'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
