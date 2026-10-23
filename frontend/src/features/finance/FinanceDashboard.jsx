import React, { useState, useEffect } from 'react';
import {
  FileText,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  Printer,
  Download,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Percent,
  Landmark,
  Building2,
  Calendar,
  AlertCircle,
  ExternalLink,
  Users,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { financeService } from '../../services/financeService';
import GenerateInvoiceModal from './GenerateInvoiceModal';
import RecordReceiptModal from './RecordReceiptModal';
import CreateVendorBillModal from './CreateVendorBillModal';

export default function FinanceDashboard() {
  const [activeTab, setActiveTab] = useState('invoices'); // invoices, receipts, payables, costing, settings
  const [dashboardData, setDashboardData] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [ageingList, setAgeingList] = useState([]);
  const [vendorBills, setVendorBills] = useState([]);
  const [jobCosting, setJobCosting] = useState([]);
  const [settings, setSettings] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isVendorBillModalOpen, setIsVendorBillModalOpen] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError('');
      const [dashRes, invRes, recRes, ageRes, vbRes, costRes, setRes] = await Promise.all([
        financeService.getDashboardSummary(),
        financeService.getInvoices(),
        financeService.getReceipts(),
        financeService.getAgeingSummary(),
        financeService.getVendorBills(),
        financeService.getJobCosting(),
        financeService.getSettings()
      ]);

      setDashboardData(dashRes.data);
      setInvoices(invRes.data || []);
      setReceipts(recRes.data || []);
      setAgeingList(ageRes.data || []);
      setVendorBills(vbRes.data || []);
      setJobCosting(costRes.data || []);
      setSettings(setRes.data || null);
    } catch (err) {
      console.error('Failed to load finance records:', err);
      setError('Unable to load finance records from server.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoicePdf = (invId) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
    window.open(`${baseUrl}/finance/invoices/${invId}/pdf?download=true`, '_blank');
  };

  const handlePayVendor = async (billId, amount) => {
    const ref = prompt('Enter Bank Payment UTR / Transaction Reference:');
    if (!ref) return;
    try {
      await financeService.recordVendorPayment({
        billId,
        amount,
        referenceNo: ref,
        tdsDeduction: Math.round(amount * 0.001) // Section 194Q TDS @ 0.1%
      });
      loadAllData();
    } catch (err) {
      alert('Failed to process vendor payment.');
    }
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch =
      inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerSnapshot?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.orderNo && inv.orderNo.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      inv.derivedStatus === statusFilter ||
      inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const kpis = dashboardData?.kpis || {
    totalRevenue: 383500,
    totalReceivables: 184530,
    overdueReceivables: 53550,
    totalPayables: 230100,
    avgMarginPercent: 70,
    unallocatedCredit: 50000,
    dsoDays: 28
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Module Title Banner & Strategic Handshake Strip */}
      <div className="bg-[#141d30] border border-slate-800 rounded-2xl p-6 shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-600 text-white tracking-wider">
                MODULE 6
              </span>
              <h1 className="text-xl font-extrabold tracking-tight">
                Finance & Commercial — Accounts, Billing & Profitability
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              End-to-end commercial control layer: GST Invoicing from M1/M2 Dispatches, Receivables Ageing, 3-Way Payables Match & Job Margins.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 transition flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Generate Invoice</span>
            </button>
            <button
              onClick={() => setIsReceiptModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center space-x-1.5"
            >
              <IndianRupee className="w-4 h-4" />
              <span>+ Record Receipt</span>
            </button>
          </div>
        </div>

        {/* Relational Process Flow Strip */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-medium">
          <div className="flex items-center space-x-2 text-blue-400">
            <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-[10px]">1</span>
            <span>Billing Plan & Eligibility (M1/M2)</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <div className="flex items-center space-x-2 text-cyan-400">
            <span className="w-5 h-5 rounded-full bg-cyan-600/30 text-cyan-400 flex items-center justify-center font-bold text-[10px]">2</span>
            <span>GST Tax Invoice (CGST/SGST/IGST)</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <div className="flex items-center space-x-2 text-emerald-400">
            <span className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold text-[10px]">3</span>
            <span>Collections, TDS & Ageing</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <div className="flex items-center space-x-2 text-purple-400">
            <span className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-400 flex items-center justify-center font-bold text-[10px]">4</span>
            <span>3-Way Match Payables (M2)</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <div className="flex items-center space-x-2 text-amber-400">
            <span className="w-5 h-5 rounded-full bg-amber-600/30 text-amber-400 flex items-center justify-center font-bold text-[10px]">5</span>
            <span>Job Costing & Margins (M3)</span>
          </div>
        </div>
      </div>

      {/* Critical Actions Feed Banner */}
      {dashboardData?.criticalActions?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Critical Action Center ({dashboardData.criticalActions.length} Pending Items)</span>
            </div>
            <span className="text-[11px] text-amber-700 font-mono">Live ERP Governance Feed</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {dashboardData.criticalActions.map((act) => (
              <div key={act.id} className="p-2.5 bg-white border border-amber-200/80 rounded-lg flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900">{act.title}</div>
                  <div className="text-[11px] text-slate-500 font-medium">{act.customer} · Amount: <strong className="font-mono text-red-600">₹{act.amount.toLocaleString()}</strong></div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                  ACTION DUE
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4 Live Operational KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* KPI 1: Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Taxable Revenue (Net)</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            ₹{kpis.totalRevenue.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 flex items-center space-x-1">
            <span className="text-emerald-600 font-bold">● Active Billing</span>
            <span>· All delivered dispatches</span>
          </p>
        </div>

        {/* KPI 2: Receivables */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Outstanding Receivables</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-700 font-mono">
            ₹{kpis.totalReceivables.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">
            Overdue past terms: <strong className="text-red-600 font-mono">₹{kpis.overdueReceivables.toLocaleString()}</strong>
          </p>
        </div>

        {/* KPI 3: Payables */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Vendor Payables (3-Way)</span>
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-purple-900 font-mono">
            ₹{kpis.totalPayables.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">
            Matched against M2 GRNs with tolerance
          </p>
        </div>

        {/* KPI 4: Gross Margin */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Average Gross Margin</span>
            <Percent className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono">
            {kpis.avgMarginPercent}%
          </div>
          <p className="text-[11px] text-slate-500">
            M3 BOM Cost Snapshot vs Actual Ledger
          </p>
        </div>
      </div>

      {/* Main Tab Controls */}
      <div className="flex border-b border-slate-200 space-x-1 text-xs font-bold">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`py-3 px-4 border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'invoices'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>M6.1 Invoices & Billing ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('receipts')}
          className={`py-3 px-4 border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'receipts'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <IndianRupee className="w-4 h-4" />
          <span>M6.1 Collections & Ageing ({receipts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payables')}
          className={`py-3 px-4 border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'payables'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>M6.2 Payables & 3-Way Match ({vendorBills.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('costing')}
          className={`py-3 px-4 border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'costing'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>M6.3 Costing & Job Margins</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`py-3 px-4 border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'settings'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Admin Settings</span>
        </button>
      </div>

      {/* ==================== TAB 1: INVOICES & RECEIVABLES ==================== */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Action & Filter Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search invoice no, customer, order..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-700 focus:border-blue-500 focus:outline-none font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="ISSUED">Issued (Unpaid)</option>
                <option value="PART_PAID">Part Paid</option>
                <option value="PAID">Paid in Full</option>
                <option value="OVERDUE">Overdue Only</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsInvoiceModalOpen(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs shadow-sm transition flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Invoice from Dispatch</span>
              </button>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-3">Order / PO</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3 text-right">Taxable Total</th>
                  <th className="py-3 px-3 text-right">Grand Total (inc GST)</th>
                  <th className="py-3 px-3 text-right">Balance Due</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      {inv.invoiceNo}
                      <div className="text-[10px] text-slate-400 font-normal">{inv.invoiceDate}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{inv.customerSnapshot?.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        GSTIN: {inv.customerSnapshot?.gstin} · {inv.taxType === 'INTER_STATE' ? 'IGST 18%' : 'CGST+SGST'}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      <div>{inv.orderNo}</div>
                      <div className="text-[10px] text-slate-500">{inv.poNumber}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className={`font-mono ${inv.isOverdue ? 'text-red-600 font-bold' : 'text-slate-700'}`}>
                        {inv.dueDate}
                      </div>
                      {inv.isOverdue && (
                        <span className="text-[10px] font-bold text-red-600">
                          {inv.overdueDays}d overdue
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      ₹{inv.taxableTotal.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{inv.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      <span className={inv.balanceAmount > 0 ? (inv.isOverdue ? 'text-red-600' : 'text-amber-700') : 'text-emerald-700'}>
                        ₹{inv.balanceAmount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        inv.derivedStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.derivedStatus.includes('OVERDUE')
                          ? 'bg-red-100 text-red-800'
                          : inv.derivedStatus === 'PART_PAID'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {inv.derivedStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDownloadInvoicePdf(inv.id)}
                        title="Download Statutory GST Tax Invoice (PDF)"
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-bold text-[11px] transition inline-flex items-center space-x-1"
                      >
                        <Printer className="w-3 h-3" />
                        <span>GST PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: RECEIPTS & COLLECTIONS ==================== */}
      {activeTab === 'receipts' && (
        <div className="space-y-6">
          {/* Customer Ageing Matrix */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Customer Receivables Ageing Matrix</h3>
                <p className="text-xs text-slate-500">Live breakdown of customer debt across statutory ageing periods</p>
              </div>
              <button
                onClick={() => setIsReceiptModalOpen(true)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-sm transition flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Record Payment</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Customer Entity</th>
                    <th className="py-2.5 px-3 text-right">Current (Not Due)</th>
                    <th className="py-2.5 px-3 text-right">1–30 Days</th>
                    <th className="py-2.5 px-3 text-right">31–60 Days</th>
                    <th className="py-2.5 px-3 text-right">61–90 Days</th>
                    <th className="py-2.5 px-3 text-right">90+ Days</th>
                    <th className="py-2.5 px-3 text-right">Total Outstanding</th>
                    <th className="py-2.5 px-3 text-right">Credit Limit Headroom</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {ageingList.map((ag) => (
                    <tr key={ag.customerId} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-sans font-bold text-slate-900">{ag.customerName}</td>
                      <td className="py-3 px-3 text-right text-slate-700">₹{ag.current.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-amber-700">₹{ag.days1_30.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-orange-700">₹{ag.days31_60.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-rose-700">₹{ag.days61_90.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-red-700 font-bold">₹{ag.days90Plus.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">₹{ag.totalOutstanding.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-emerald-700 font-bold">
                        ₹{(ag.creditLimit - ag.totalOutstanding).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Receipt Register Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-900">
              Verified Receipt Register (Collections & TDS Logs)
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase">
                <tr>
                  <th className="py-3 px-4">Receipt No</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Method & Bank</th>
                  <th className="py-3 px-3 font-mono">UTR / Reference</th>
                  <th className="py-3 px-3 text-right">Amount Received</th>
                  <th className="py-3 px-3 text-right">Unallocated Advance</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {receipts.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-emerald-700">{rec.receiptNo}</td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                      {rec.customerId.replace('cust_', '').toUpperCase()}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{rec.receivedOn}</td>
                    <td className="py-3 px-3 font-sans text-slate-700">
                      {rec.method} ({rec.bank})
                    </td>
                    <td className="py-3 px-3 text-slate-600">{rec.referenceNo}</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">₹{rec.amount.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right font-bold text-blue-700">
                      {rec.unallocatedAmount > 0 ? `₹${rec.unallocatedAmount.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3 px-3 text-center font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: PAYABLES & VENDOR BILLS ==================== */}
      {activeTab === 'payables' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Vendor Bills & 3-Way Match Registry</h2>
              <p className="text-xs text-slate-500">Cross-verified against M2 PO quantities and GRN inspection reports</p>
            </div>
            <button
              onClick={() => setIsVendorBillModalOpen(true)}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs shadow-sm transition flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Enter Vendor Bill</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase">
                <tr>
                  <th className="py-3 px-4">Vendor & Bill No</th>
                  <th className="py-3 px-3">Linked PO / GRN</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3 text-right">Bill Amount</th>
                  <th className="py-3 px-3 text-right">Balance Due</th>
                  <th className="py-3 px-3 text-center">3-Way Match</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendorBills.map((vb) => (
                  <tr key={vb.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{vb.vendorName}</div>
                      <div className="font-mono text-[11px] text-purple-700">{vb.billNo}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      <div>{vb.poNumber}</div>
                      <div className="text-[10px] text-slate-400">{vb.grnNumber}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">{vb.dueDate}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">₹{vb.totalAmount.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-red-600">₹{vb.balanceAmount.toLocaleString()}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        vb.matchResult === 'MATCHED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {vb.matchResult}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        vb.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {vb.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {vb.balanceAmount > 0 && vb.matchResult === 'MATCHED' && (
                        <button
                          onClick={() => handlePayVendor(vb.id, vb.balanceAmount)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-md text-[11px] transition"
                        >
                          Release Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: JOB COSTING & MARGINS ==================== */}
      {activeTab === 'costing' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Job Costing & Gross Margin Analysis (M6.3 Handshake)</h2>
              <p className="text-xs text-slate-500">Cross-compares M3 released BOM frozen cost against live production issues and expenses</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase">
                <tr>
                  <th className="py-3 px-4">Sales Order Job Ref</th>
                  <th className="py-3 px-4">Customer Entity</th>
                  <th className="py-3 px-3 text-right">Taxable Revenue</th>
                  <th className="py-3 px-3 text-right">Material Cost</th>
                  <th className="py-3 px-3 text-right">Labour & Overheads</th>
                  <th className="py-3 px-3 text-right">Total Actual Cost</th>
                  <th className="py-3 px-3 text-right">Actual Gross Margin</th>
                  <th className="py-3 px-3 text-center">Margin % / Completeness</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {jobCosting.map((jc) => (
                  <tr key={jc.jobRef} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-blue-700">{jc.jobRef}</td>
                    <td className="py-3.5 px-4 font-sans font-semibold text-slate-900">{jc.customerName}</td>
                    <td className="py-3.5 px-3 text-right font-bold text-slate-900">₹{jc.taxableRevenue.toLocaleString()}</td>
                    <td className="py-3.5 px-3 text-right text-slate-700">₹{jc.materialCost.toLocaleString()}</td>
                    <td className="py-3.5 px-3 text-right text-slate-700">₹{(jc.labourCost + jc.expenseCost).toLocaleString()}</td>
                    <td className="py-3.5 px-3 text-right font-bold text-purple-900">₹{jc.totalActualCost.toLocaleString()}</td>
                    <td className="py-3.5 px-3 text-right font-bold text-emerald-700">
                      ₹{jc.grossMargin.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 text-center font-sans">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                        jc.isCostComplete
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {jc.statusText}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: ADMIN CONFIGURATION ==================== */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Company Legal Profile */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Company Legal & GST Profile</span>
            </h3>
            <div className="text-xs space-y-2 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Legal Registered Name:</span>
                <span className="font-bold">{settings?.companyProfile?.legalName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Statutory GSTIN:</span>
                <span className="font-mono font-bold text-blue-700">{settings?.companyProfile?.gstin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Permanent Account Number (PAN):</span>
                <span className="font-mono font-bold">{settings?.companyProfile?.pan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Home State (Place of Supply Base):</span>
                <span className="font-bold">{settings?.companyProfile?.stateName} (Code: {settings?.companyProfile?.stateCode})</span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <div className="font-bold text-slate-900 mb-1">Bank Remittance Account:</div>
                <div className="font-mono text-slate-600">
                  {settings?.companyProfile?.bankDetails?.bankName} · A/C: {settings?.companyProfile?.bankDetails?.accountNumber}<br />
                  IFSC: {settings?.companyProfile?.bankDetails?.ifsc} · UPI: {settings?.companyProfile?.bankDetails?.upiId}
                </div>
              </div>
            </div>
          </div>

          {/* Number Series Configuration */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Active Gapless Number Series</span>
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {settings?.numberSeries?.map(s => (
                <div key={s.id} className="py-2 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-800">{s.docType}</div>
                    <div className="font-mono text-[11px] text-slate-500">{s.format}</div>
                  </div>
                  <div className="font-mono font-bold text-blue-700">Next: #{s.nextNo}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <GenerateInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onInvoiceCreated={loadAllData}
      />

      <RecordReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onReceiptRecorded={loadAllData}
        invoices={invoices}
      />

      <CreateVendorBillModal
        isOpen={isVendorBillModalOpen}
        onClose={() => setIsVendorBillModalOpen(false)}
        onBillCreated={loadAllData}
      />
    </div>
  );
}
