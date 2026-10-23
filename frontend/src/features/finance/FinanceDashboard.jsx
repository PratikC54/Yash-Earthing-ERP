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
  ArrowRight,
  TrendingUp,
  Percent,
  Landmark,
  Building2,
  Calendar,
  AlertCircle,
  Users,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  Edit3,
  Lock,
  Unlock,
  FileDown,
  UploadCloud,
  X,
  ChevronRight
} from 'lucide-react';
import { financeService } from '../../services/financeService';
import { useAuth } from '../auth';
import GenerateInvoiceModal from './GenerateInvoiceModal';
import RecordReceiptModal from './RecordReceiptModal';
import CreateVendorBillModal from './CreateVendorBillModal';
import SmartDataExtractionModal from './SmartDataExtractionModal';
import EditRegisterItemModal from './EditRegisterItemModal';

export default function FinanceDashboard() {
  const [activeTab, setActiveTab] = useState('invoices'); // invoices, receipts, payables, costing, settings
  const [dashboardData, setDashboardData] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [ageingList, setAgeingList] = useState([]);
  const [vendorBills, setVendorBills] = useState([]);
  const [jobCosting, setJobCosting] = useState([]);
  const [settings, setSettings] = useState(null);

  // Search & Filter states for each tab
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQueryReceipts, setSearchQueryReceipts] = useState('');
  const [methodFilterReceipts, setMethodFilterReceipts] = useState('ALL');
  const [searchQueryPayables, setSearchQueryPayables] = useState('');
  const [statusFilterPayables, setStatusFilterPayables] = useState('ALL');
  const [searchQueryCosting, setSearchQueryCosting] = useState('');
  const [statusFilterCosting, setStatusFilterCosting] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Role-Based Access Control from real authenticated session
  const auth = useAuth?.() || {};
  const currentRole = auth.user?.role || 'ADMIN';

  // Modals state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isVendorBillModalOpen, setIsVendorBillModalOpen] = useState(false);
  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false);

  // Job Costing, Ledger & Profitability Register Modals
  const [activeEditItem, setActiveEditItem] = useState(null);
  const [activeLedgerItem, setActiveLedgerItem] = useState(null);
  const [activePlItem, setActivePlItem] = useState(null);

  // Admin Settings live editing form
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [companyForm, setCompanyForm] = useState({
    legalName: '',
    gstin: '',
    pan: '',
    stateCode: '27',
    stateName: 'Maharashtra',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    upiId: ''
  });

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

      if (setRes.data?.companyProfile) {
        setCompanyForm({
          legalName: setRes.data.companyProfile.legalName || '',
          gstin: setRes.data.companyProfile.gstin || '',
          pan: setRes.data.companyProfile.pan || '',
          stateCode: setRes.data.companyProfile.stateCode || '27',
          stateName: setRes.data.companyProfile.stateName || 'Maharashtra',
          bankName: setRes.data.companyProfile.bankDetails?.bankName || '',
          accountNumber: setRes.data.companyProfile.bankDetails?.accountNumber || '',
          ifsc: setRes.data.companyProfile.bankDetails?.ifsc || '',
          upiId: setRes.data.companyProfile.bankDetails?.upiId || ''
        });
      }
    } catch (err) {
      console.error('Failed to load finance records:', err);
      setError('Unable to load finance records from local database.');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Statutory PDF Download Trigger (Official GST Rule 46 Tax Invoice)
  const handleDownloadInvoicePdf = (invId) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
    window.open(`${baseUrl}/finance/invoices/${invId}/pdf?download=true`, '_blank');
  };

  // ===================== CRUD: INVOICES =====================
  const handleToggleDispute = async (inv) => {
    const isNowDisputed = !inv.isDisputed;
    let reason = '';
    if (isNowDisputed) {
      reason = prompt('Enter commercial or dispatch reason for dispute:', inv.disputeReason || 'Rate or quantity discrepancy under verification');
      if (reason === null) return;
    }

    try {
      await financeService.updateInvoice(inv.id, {
        isDisputed: isNowDisputed,
        disputeReason: isNowDisputed ? reason : null
      });
      showNotification(`Invoice ${inv.invoiceNo} dispute status updated.`);
      loadAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update invoice.');
    }
  };

  const handleCancelInvoice = async (inv) => {
    if (currentRole !== 'ADMIN') {
      alert('Permission Denied: Only Admin users can cancel or void statutory GST invoices.');
      return;
    }
    const reason = prompt(`Cancellation reason for ${inv.invoiceNo}:`, 'Order revised by client / Re-invoicing required');
    if (!reason) return;

    try {
      await financeService.cancelInvoice(inv.id, reason);
      showNotification(`Invoice ${inv.invoiceNo} cancelled. Invoiced quantity restored on sales order.`);
      loadAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel invoice.');
    }
  };

  // ===================== CRUD: RECEIPTS =====================
  const handleDeleteReceipt = async (rec) => {
    if (currentRole !== 'ADMIN') {
      alert('Permission Denied: Only Admin users can delete or reverse verified payment receipts.');
      return;
    }
    if (!window.confirm(`Reverse receipt ${rec.receiptNo} of ₹${rec.amount.toLocaleString('en-IN')}? Invoice balances will be automatically restored.`)) {
      return;
    }

    try {
      await financeService.deleteReceipt(rec.id);
      showNotification(`Receipt ${rec.receiptNo} reversed and invoice balance restored.`);
      loadAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete receipt.');
    }
  };

  // ===================== CRUD: VENDOR BILLS =====================
  const handleUpdateVendorBillStatus = async (billId, status) => {
    try {
      await financeService.updateVendorBill(billId, { status });
      showNotification(`Vendor bill status updated to ${status}.`);
      loadAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update vendor bill.');
    }
  };

  const handleDeleteVendorBill = async (bill) => {
    if (currentRole !== 'ADMIN') {
      alert('Permission Denied: Only Admin users can delete vendor bills.');
      return;
    }
    if (!window.confirm(`Delete vendor bill ${bill.billNo}?`)) return;

    try {
      await financeService.deleteVendorBill(bill.id);
      showNotification(`Vendor bill ${bill.billNo} removed.`);
      loadAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete vendor bill.');
    }
  };

  const handlePayVendor = async (billId, amount) => {
    if (currentRole === 'AUDITOR' || currentRole === 'SALES_OWNER') {
      alert('Permission Denied: Only Finance Manager and Admin can release vendor disbursements.');
      return;
    }
    const ref = prompt('Enter Bank Payment UTR / Transaction Reference:');
    if (!ref) return;
    try {
      await financeService.recordVendorPayment({
        billId,
        amount,
        referenceNo: ref,
        tdsDeduction: Math.round(amount * 0.001) // Section 194Q TDS @ 0.1%
      });
      showNotification(`Vendor payment recorded with reference ${ref}.`);
      loadAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process vendor payment.');
    }
  };

  // ===================== CRUD: COMPANY PROFILE SETTINGS =====================
  const handleSaveCompanySettings = async (e) => {
    e.preventDefault();
    if (currentRole !== 'ADMIN') {
      alert('Permission Denied: Only Admin users can modify Statutory Company Profile.');
      return;
    }

    try {
      await financeService.updateCompanyProfile({
        legalName: companyForm.legalName,
        gstin: companyForm.gstin,
        pan: companyForm.pan,
        stateCode: companyForm.stateCode,
        stateName: companyForm.stateName,
        bankDetails: {
          bankName: companyForm.bankName,
          accountNumber: companyForm.accountNumber,
          ifsc: companyForm.ifsc,
          upiId: companyForm.upiId
        }
      });
      setIsEditingSettings(false);
      showNotification('Company Profile and Bank details saved to local database.');
      loadAllData();
    } catch (err) {
      alert('Failed to update company settings.');
    }
  };

  // ===================== EXCEL-SAFE CSV EXPORT (FIXES ######## DATE ISSUE) =====================
  const exportToExcelSafeCsv = (filename, headers, rowData) => {
    if (!rowData || !rowData.length) return;

    const csvRows = [
      headers.join(','),
      ...rowData.map(r => r.join(','))
    ];

    const csvContent = csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification(`Exported ${rowData.length} records to ${filename}`);
  };

  const handleExportInvoicesCsv = () => {
    const headers = [
      'Invoice_No',
      'Invoice_Date',
      'Customer_Name',
      'Customer_GSTIN',
      'Place_Of_Supply',
      'Sales_Order_No',
      'Customer_PO_No',
      'Taxable_Value_INR',
      'CGST_INR',
      'SGST_INR',
      'IGST_INR',
      'Grand_Total_INR',
      'Paid_Amount_INR',
      'Balance_Due_INR',
      'Payment_Due_Date',
      'Billing_Status'
    ];

    const rows = filteredInvoices.map(inv => [
      `"${inv.invoiceNo || ''}"`,
      // Excel-safe text format: ="" prevents Excel from rendering ##### on date column
      `="${inv.invoiceDate || ''}"`,
      `"${(inv.customerSnapshot?.name || '').replace(/"/g, '""')}"`,
      `"${inv.customerSnapshot?.gstin || ''}"`,
      `"${inv.placeOfSupply || '27'}"`,
      `"${inv.orderNo || ''}"`,
      `"${inv.poNumber || ''}"`,
      Number(inv.taxableTotal || 0),
      Number(inv.cgstTotal || 0),
      Number(inv.sgstTotal || 0),
      Number(inv.igstTotal || 0),
      Number(inv.grandTotal || 0),
      Number(inv.paidAmount || 0),
      Number(inv.balanceAmount || 0),
      // Excel-safe text format: ="" prevents Excel from rendering ##### on due date
      `="${inv.dueDate || ''}"`,
      `"${inv.derivedStatus || inv.status || 'ISSUED'}"`
    ]);

    exportToExcelSafeCsv(`GST_Invoices_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  const handleExportAgeingCsv = () => {
    const headers = [
      'Customer_Name',
      'Current_Not_Due_INR',
      'Days_1_30_INR',
      'Days_31_60_INR',
      'Days_61_90_INR',
      'Days_90_Plus_INR',
      'Total_Outstanding_INR',
      'Credit_Limit_INR',
      'Credit_Headroom_INR'
    ];

    const rows = ageingList.map(ag => [
      `"${(ag.customerName || '').replace(/"/g, '""')}"`,
      Number(ag.current || 0),
      Number(ag.days1_30 || 0),
      Number(ag.days31_60 || 0),
      Number(ag.days61_90 || 0),
      Number(ag.days90Plus || 0),
      Number(ag.totalOutstanding || 0),
      Number(ag.creditLimit || 0),
      Number((ag.creditLimit || 0) - (ag.totalOutstanding || 0))
    ]);

    exportToExcelSafeCsv(`Receivables_Ageing_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  const handleExportVendorBillsCsv = () => {
    const headers = [
      'Bill_No',
      'Bill_Date',
      'Vendor_Name',
      'PO_Number',
      'GRN_Number',
      'Taxable_Amount_INR',
      'GST_Amount_INR',
      'Total_Amount_INR',
      'Paid_Amount_INR',
      'Balance_Due_INR',
      'Due_Date',
      '3_Way_Match_Status',
      'Approval_Status'
    ];

    const rows = filteredVendorBills.map(vb => [
      `"${vb.billNo || ''}"`,
      `="${vb.billDate || ''}"`,
      `"${(vb.vendorName || '').replace(/"/g, '""')}"`,
      `"${vb.poNumber || ''}"`,
      `"${vb.grnNumber || ''}"`,
      Number(vb.taxableAmount || 0),
      Number(vb.gstAmount || 0),
      Number(vb.totalAmount || 0),
      Number(vb.paidAmount || 0),
      Number(vb.balanceAmount || 0),
      `="${vb.dueDate || ''}"`,
      `"${vb.matchResult || 'PENDING'}"`,
      `"${vb.status || 'DRAFT'}"`
    ]);

    exportToExcelSafeCsv(`Vendor_Payables_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  const handleExportJobCostingCsv = () => {
    const headers = [
      'SO_Order_No',
      'Customer_Name',
      'Product',
      'Revenue_INR',
      'Material_Cost_INR',
      'Production_Cost_INR',
      'Logistics_Cost_INR',
      'Installation_Cost_INR',
      'Gross_Profit_INR',
      'Margin_Percent'
    ];

    const rows = filteredJobCosting.map(jc => [
      `"${jc.orderNo || jc.jobRef || ''}"`,
      `"${(jc.customerName || '').replace(/"/g, '""')}"`,
      `"${(jc.product || '').replace(/"/g, '""')}"`,
      Number(jc.revenue ?? jc.taxableRevenue ?? 0),
      Number(jc.material ?? jc.materialCost ?? 0),
      Number(jc.production ?? jc.labourCost ?? 0),
      Number(jc.logistics ?? 0),
      Number(jc.installation ?? 0),
      Number(jc.grossProfit ?? jc.grossMargin ?? 0),
      `"${jc.marginPercent ?? jc.grossMarginPercent ?? 0}%"`
    ]);

    exportToExcelSafeCsv(`Job_Costing_Profitability_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  // Filtered invoices by role & search
  const filteredInvoices = invoices.filter(inv => {
    if (currentRole === 'SALES_OWNER') {
      const allowed = ['cust_tata_power', 'cust_adani_solar', 'cust_suryagrid', 'cust_pragati', 'cust_greenarc'];
      if (!allowed.includes(inv.customerId)) return false;
    }

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      inv.invoiceNo?.toLowerCase().includes(q) ||
      inv.customerSnapshot?.name?.toLowerCase().includes(q) ||
      (inv.orderNo && inv.orderNo.toLowerCase().includes(q)) ||
      (inv.poNumber && inv.poNumber.toLowerCase().includes(q)) ||
      (inv.customerSnapshot?.gstin && inv.customerSnapshot.gstin.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === 'ALL' ||
      inv.derivedStatus === statusFilter ||
      inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Filtered receipts
  const filteredReceipts = receipts.filter(rec => {
    const q = searchQueryReceipts.toLowerCase().trim();
    const matchesSearch = !q ||
      rec.receiptNo?.toLowerCase().includes(q) ||
      rec.referenceNo?.toLowerCase().includes(q) ||
      rec.customerId?.toLowerCase().includes(q) ||
      rec.bank?.toLowerCase().includes(q) ||
      rec.notes?.toLowerCase().includes(q);

    const matchesMethod = methodFilterReceipts === 'ALL' || rec.method === methodFilterReceipts;
    return matchesSearch && matchesMethod;
  });

  // Filtered ageing list
  const filteredAgeing = ageingList.filter(ag => {
    const q = searchQueryReceipts.toLowerCase().trim();
    return !q ||
      ag.customerName?.toLowerCase().includes(q) ||
      ag.customerId?.toLowerCase().includes(q);
  });

  // Filtered vendor bills
  const filteredVendorBills = vendorBills.filter(vb => {
    const q = searchQueryPayables.toLowerCase().trim();
    const matchesSearch = !q ||
      vb.billNo?.toLowerCase().includes(q) ||
      vb.vendorName?.toLowerCase().includes(q) ||
      vb.poNumber?.toLowerCase().includes(q) ||
      vb.grnNumber?.toLowerCase().includes(q);

    const matchesStatus =
      statusFilterPayables === 'ALL' ||
      vb.matchResult === statusFilterPayables ||
      vb.status === statusFilterPayables;

    return matchesSearch && matchesStatus;
  });

  // Filtered job costing
  const filteredJobCosting = jobCosting.filter(jc => {
    const q = searchQueryCosting.toLowerCase().trim();
    const matchesSearch = !q ||
      (jc.orderNo && jc.orderNo.toLowerCase().includes(q)) ||
      (jc.jobRef && jc.jobRef.toLowerCase().includes(q)) ||
      (jc.customerName && jc.customerName.toLowerCase().includes(q)) ||
      (jc.product && jc.product.toLowerCase().includes(q));

    const marginPct = Number(jc.marginPercent ?? jc.grossMarginPercent ?? 0);
    const matchesStatus =
      statusFilterCosting === 'ALL' ||
      (statusFilterCosting === 'HIGH' && marginPct >= 50) ||
      (statusFilterCosting === 'MEDIUM' && marginPct >= 30 && marginPct < 50) ||
      (statusFilterCosting === 'LOW' && marginPct < 30);

    return matchesSearch && matchesStatus;
  });

  const kpis = dashboardData?.kpis || {
    totalRevenue: 427500,
    totalReceivables: 184530,
    overdueReceivables: 53550,
    totalPayables: 230100,
    avgMarginPercent: 73.1,
    unallocatedCredit: 50000,
    dsoDays: 28
  };

  // Role permissions
  const canCreate = currentRole === 'ADMIN' || currentRole === 'FINANCE_MGR' || currentRole === 'ACCOUNTS_EXEC';
  const canDelete = currentRole === 'ADMIN';
  const canViewMargins = currentRole === 'ADMIN' || currentRole === 'FINANCE_MGR';
  const canViewPayables = currentRole !== 'SALES_OWNER';
  const canViewSettings = currentRole === 'ADMIN' || currentRole === 'FINANCE_MGR';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">


      {/* Success Notification Banner */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Module Title Banner & Strategic Handshake Strip (Matching Module 3 UI/UX) */}
      <div className="bg-[#141d30] border border-slate-800 rounded-2xl p-6 shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-600 text-white tracking-wider">
                MODULE 6
              </span>
              <h1 className="text-xl font-extrabold tracking-tight">
                Finance & Commercial — Billing, Collections & Margins
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Final operational link in 10-step ERP: GST Invoicing from M1/M2 Dispatches, Receivables Ageing, 3-Way Payables Match & Job Margins.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsExtractModalOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 font-bold rounded-xl text-xs shadow-sm transition flex items-center space-x-1.5"
            >
              <UploadCloud className="w-4 h-4 text-cyan-400" />
              <span>Smart Import (CSV/Excel)</span>
            </button>

            {canCreate && (
              <>
                <button
                  onClick={() => setIsInvoiceModalOpen(true)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 transition flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Generate Invoice</span>
                </button>
                <button
                  onClick={() => setIsReceiptModalOpen(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center space-x-1.5"
                >
                  <IndianRupee className="w-4 h-4" />
                  <span>+ Record Receipt</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Relational Process Flow Strip */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center space-x-3 text-xs overflow-x-auto pb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
            Workflow Stream:
          </span>
          <div className="flex items-center space-x-2 shrink-0">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold flex items-center space-x-1.5">
              <span>01. Billing Plan & Eligibility (M1/M2)</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-semibold flex items-center space-x-1.5">
              <span>02. GST Tax Invoice (CGST/SGST/IGST)</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center space-x-1.5">
              <span>03. Collections, TDS & Ageing</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 font-semibold flex items-center space-x-1.5">
              <span>04. 3-Way Match Payables (M2)</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold flex items-center space-x-1.5">
              <span>05. Job Costing & Margins (M3)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Module 6 Overview Fast Navigation Strips (Billing, Payables, Costing & Margins) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between shadow-sm ${
            activeTab === 'invoices' || activeTab === 'receipts'
              ? 'bg-blue-50/90 border-blue-400 ring-1 ring-blue-400'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Billing & Receivables</div>
              <div className="text-[11px] text-slate-500 font-medium">Invoice · collections</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => setActiveTab('payables')}
          className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between shadow-sm ${
            activeTab === 'payables'
              ? 'bg-purple-50/90 border-purple-400 ring-1 ring-purple-400'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Payables & Expenses</div>
              <div className="text-[11px] text-slate-500 font-medium">Vendor bills · expense</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => setActiveTab('costing')}
          className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between shadow-sm ${
            activeTab === 'costing'
              ? 'bg-emerald-50/90 border-emerald-400 ring-1 ring-emerald-400'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Costing, Margin & MIS</div>
              <div className="text-[11px] text-slate-500 font-medium">Job margin · cash · trends</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Critical Actions Feed Banner */}
      {dashboardData?.criticalActions?.length > 0 && currentRole !== 'SALES_OWNER' && (
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
                  <div className="text-[11px] text-slate-500 font-medium">{act.customer} · Amount: <strong className="font-mono text-red-600">₹{act.amount.toLocaleString('en-IN')}</strong></div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                  ACTION DUE
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4 Live Operational KPI Cards (Matching Module 3 Card Design) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1: Revenue */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Taxable Revenue (Net)</div>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
              ₹{kpis.totalRevenue.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">Active Billing · Dispatches</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Receivables */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Outstanding Receivables</div>
            <div className="text-2xl font-black text-amber-700 mt-1 font-mono">
              ₹{kpis.totalReceivables.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-red-600 font-semibold mt-1">
              Overdue: ₹{kpis.overdueReceivables.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Vendor Payables */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Vendor Payables (3-Way)</div>
            <div className="text-2xl font-black text-purple-900 mt-1 font-mono">
              {canViewPayables ? `₹${kpis.totalPayables.toLocaleString('en-IN')}` : 'RESTRICTED'}
            </div>
            <div className="text-[11px] text-blue-600 font-semibold mt-1">
              Advance: ₹{kpis.unallocatedCredit.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Job Costing / Margin */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gross Profit Margin</div>
            <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
              {canViewMargins ? `${kpis.avgMarginPercent}%` : 'RESTRICTED'}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              {canViewMargins ? 'BOM Snapshot vs Actuals' : 'Proprietary Costing'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Percent className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Tab Controls (Exact Module 3 Underlined Tab Design) */}
      <div className="flex border-b border-slate-200 space-x-1 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`py-3 px-4 border-b-2 transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'invoices'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>M6.1 Invoices & Billing ({filteredInvoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('receipts')}
          className={`py-3 px-4 border-b-2 transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'receipts'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <IndianRupee className="w-4 h-4" />
          <span>M6.1 Collections & Ageing ({filteredReceipts.length})</span>
        </button>

        {canViewPayables && (
          <button
            onClick={() => setActiveTab('payables')}
            className={`py-3 px-4 border-b-2 transition flex items-center space-x-2 shrink-0 ${
              activeTab === 'payables'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>M6.2 Payables & 3-Way Match ({filteredVendorBills.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('costing')}
          className={`py-3 px-4 border-b-2 transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'costing'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>M6.3 Costing & Job Margins ({filteredJobCosting.length})</span>
        </button>

        {canViewSettings && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-4 border-b-2 transition flex items-center space-x-2 shrink-0 ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Admin Settings</span>
          </button>
        )}
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
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white text-slate-900 border border-slate-300 rounded-lg placeholder:text-slate-500 font-medium focus:border-blue-600 focus:outline-none shadow-sm"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white text-slate-900 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none font-medium shadow-sm"
              >
                <option value="ALL">All Statuses</option>
                <option value="ISSUED">Issued (Unpaid)</option>
                <option value="PART_PAID">Part Paid</option>
                <option value="PAID">Paid in Full</option>
                <option value="OVERDUE">Overdue Only</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportInvoicesCsv}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold rounded-lg text-xs transition flex items-center space-x-1"
                title="Export complete details to Excel-safe CSV (No ##### on dates)"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              {canCreate && (
                <button
                  onClick={() => setIsInvoiceModalOpen(true)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs shadow-sm transition flex items-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Invoice from Dispatch</span>
                </button>
              )}
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
                      {inv.isDisputed && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-bold rounded">
                          Disputed
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{inv.customerSnapshot?.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        GSTIN: {inv.customerSnapshot?.gstin} · {inv.taxType === 'INTER_STATE' ? 'IGST 18%' : 'CGST+SGST 18%'}
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
                      ₹{Number(inv.taxableTotal).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{Number(inv.grandTotal).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      <span className={inv.balanceAmount > 0 ? (inv.isOverdue ? 'text-red-600' : 'text-amber-700') : 'text-emerald-700'}>
                        ₹{Number(inv.balanceAmount).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        inv.status === 'CANCELLED'
                          ? 'bg-slate-200 text-slate-600'
                          : inv.derivedStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.derivedStatus?.includes('OVERDUE')
                          ? 'bg-red-100 text-red-800'
                          : inv.derivedStatus === 'PART_PAID'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {inv.status === 'CANCELLED' ? 'CANCELLED' : inv.derivedStatus?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleDownloadInvoicePdf(inv.id)}
                          title="Download Statutory GST Tax Invoice (PDF)"
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-bold text-[10px] transition inline-flex items-center space-x-1"
                        >
                          <Printer className="w-3 h-3" />
                          <span>PDF</span>
                        </button>

                        <button
                          onClick={() => handleToggleDispute(inv)}
                          title="Toggle Commercial Dispute Status"
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[10px] transition"
                        >
                          {inv.isDisputed ? 'Resolved' : 'Dispute'}
                        </button>

                        {canDelete && inv.status !== 'CANCELLED' && inv.paidAmount === 0 && (
                          <button
                            onClick={() => handleCancelInvoice(inv)}
                            title="Cancel / Void Invoice"
                            className="p-1 hover:bg-red-50 text-red-600 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
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
          {/* Action & Filter Toolbar for Tab 2 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search customer, receipt no, UTR, bank..."
                  value={searchQueryReceipts}
                  onChange={(e) => setSearchQueryReceipts(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white text-slate-900 border border-slate-300 rounded-lg placeholder:text-slate-500 font-medium focus:border-blue-600 focus:outline-none shadow-sm"
                />
              </div>

              <select
                value={methodFilterReceipts}
                onChange={(e) => setMethodFilterReceipts(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white text-slate-900 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none font-medium shadow-sm"
              >
                <option value="ALL">All Payment Methods</option>
                <option value="NEFT">NEFT Transfer</option>
                <option value="RTGS">RTGS Transfer</option>
                <option value="UPI">UPI Instant</option>
                <option value="CHEQUE">Bank Cheque</option>
                <option value="CASH">Cash Deposit</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportAgeingCsv}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold rounded-lg text-xs transition flex items-center space-x-1"
                title="Export complete customer ageing analysis to Excel CSV"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Export Ageing</span>
              </button>

              {canCreate && (
                <button
                  onClick={() => setIsReceiptModalOpen(true)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-sm transition flex items-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Record Payment</span>
                </button>
              )}
            </div>
          </div>

          {/* Customer Ageing Matrix */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Customer Receivables Ageing Matrix</h3>
                <p className="text-xs text-slate-500">Live breakdown of customer debt across statutory ageing periods</p>
              </div>
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
                  {filteredAgeing.map((ag) => (
                    <tr key={ag.customerId} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-sans font-bold text-slate-900">{ag.customerName}</td>
                      <td className="py-3 px-3 text-right text-slate-700">₹{Number(ag.current).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-right text-amber-700">₹{Number(ag.days1_30).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-right text-orange-700">₹{Number(ag.days31_60).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-right text-rose-700">₹{Number(ag.days61_90).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-right text-red-700 font-bold">₹{Number(ag.days90Plus).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">₹{Number(ag.totalOutstanding).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-right text-emerald-700 font-bold">
                        ₹{Number(ag.creditLimit - ag.totalOutstanding).toLocaleString('en-IN')}
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
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredReceipts.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-emerald-700">{rec.receiptNo}</td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                      {rec.customerId?.replace('cust_', '').toUpperCase()}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{rec.receivedOn}</td>
                    <td className="py-3 px-3 font-sans text-slate-700">
                      {rec.method} ({rec.bank})
                    </td>
                    <td className="py-3 px-3 text-slate-600">{rec.referenceNo}</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">₹{Number(rec.amount).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 text-right font-bold text-blue-700">
                      {rec.unallocatedAmount > 0 ? `₹${Number(rec.unallocatedAmount).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="py-3 px-3 text-center font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteReceipt(rec)}
                          title="Reverse & Delete Receipt"
                          className="p-1 hover:bg-red-50 text-red-600 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* ==================== TAB 3: PAYABLES & VENDOR BILLS ==================== */}
      {activeTab === 'payables' && canViewPayables && (
        <div className="space-y-4">
          {/* Action & Filter Toolbar for Tab 3 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search vendor, bill no, PO, GRN..."
                  value={searchQueryPayables}
                  onChange={(e) => setSearchQueryPayables(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white text-slate-900 border border-slate-300 rounded-lg placeholder:text-slate-500 font-medium focus:border-blue-600 focus:outline-none shadow-sm"
                />
              </div>

              <select
                value={statusFilterPayables}
                onChange={(e) => setStatusFilterPayables(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white text-slate-900 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none font-medium shadow-sm"
              >
                <option value="ALL">All Match Statuses</option>
                <option value="MATCHED">Matched (3-Way Verified)</option>
                <option value="MISMATCH">Price / Qty Mismatch</option>
                <option value="PENDING_VERIFICATION">Pending Verification</option>
                <option value="APPROVED">Approved for Payment</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportVendorBillsCsv}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold rounded-lg text-xs transition flex items-center space-x-1"
                title="Export complete vendor payables to Excel CSV"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Export Payables</span>
              </button>

              {canCreate && (
                <button
                  onClick={() => setIsVendorBillModalOpen(true)}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs shadow-sm transition flex items-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Enter Vendor Bill</span>
                </button>
              )}
            </div>
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
                {filteredVendorBills.map((vb) => (
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
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">₹{Number(vb.totalAmount).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-red-600">₹{Number(vb.balanceAmount).toLocaleString('en-IN')}</td>
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
                      <div className="flex items-center justify-center space-x-1">
                        {vb.balanceAmount > 0 && vb.matchResult === 'MATCHED' && (
                          <button
                            onClick={() => handlePayVendor(vb.id, vb.balanceAmount)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[10px] transition"
                          >
                            Pay
                          </button>
                        )}
                        {canCreate && vb.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleUpdateVendorBillStatus(vb.id, 'APPROVED')}
                            className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[10px] font-bold"
                          >
                            Approve
                          </button>
                        )}
                        {canDelete && vb.paidAmount === 0 && (
                          <button
                            onClick={() => handleDeleteVendorBill(vb)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
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
          {/* Header Title Banner matching user specification */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-black text-slate-900 tracking-tight">
                  Job Costing, Ledger & Profitability Register
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  Controlled register
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Operational data is view-only until Edit is selected
              </p>
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search record, customer, SO, owner..."
                  value={searchQueryCosting}
                  onChange={(e) => setSearchQueryCosting(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white text-slate-900 border border-slate-300 rounded-lg placeholder:text-slate-500 font-medium focus:border-blue-600 focus:outline-none shadow-sm"
                />
              </div>

              <select
                value={statusFilterCosting}
                onChange={(e) => setStatusFilterCosting(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white text-slate-900 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none font-medium shadow-sm"
              >
                <option value="ALL">All Status / Priority</option>
                <option value="HIGH">High Margin (≥ 50%)</option>
                <option value="MEDIUM">Target Margin (30%–49%)</option>
                <option value="LOW">Low Margin (&lt; 30%)</option>
              </select>

              <button
                onClick={handleExportJobCostingCsv}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold rounded-lg text-xs transition flex items-center space-x-1 shrink-0"
                title="Export complete job costing and margins to CSV"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>⇩ Export</span>
              </button>
            </div>
          </div>

          {/* Exact Register Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">SO / Customer</th>
                    <th className="py-3 px-3">Product</th>
                    <th className="py-3 px-3 text-right">Revenue</th>
                    <th className="py-3 px-3 text-right">Material</th>
                    <th className="py-3 px-3 text-right">Production</th>
                    <th className="py-3 px-3 text-right">Logistics</th>
                    <th className="py-3 px-3 text-right">Installation</th>
                    <th className="py-3 px-3 text-right">Gross Profit</th>
                    <th className="py-3 px-3 text-center">Margin</th>
                    <th className="py-3 px-3 text-center">Accounts View</th>
                    <th className="py-3 px-4 text-center">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredJobCosting.map((jc) => {
                    const orderNo = jc.orderNo || jc.jobRef || 'SO-REF';
                    const customerName = jc.customerName || 'Customer';
                    const product = jc.product || 'Standard Earthing Assembly';
                    const rev = Number(jc.revenue ?? jc.taxableRevenue ?? 0);
                    const mat = Number(jc.material ?? jc.materialCost ?? 0);
                    const prod = Number(jc.production ?? jc.labourCost ?? 0);
                    const log = Number(jc.logistics ?? 0);
                    const inst = Number(jc.installation ?? 0);
                    const gp = Number(jc.grossProfit ?? jc.grossMargin ?? 0);
                    const margin = Number(jc.marginPercent ?? jc.grossMarginPercent ?? 0);

                    return (
                      <tr key={jc.id || orderNo} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 font-mono">{orderNo}</div>
                          <div className="text-[11px] text-slate-500 font-medium">{customerName}</div>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-800">
                          {product}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          ₹{rev.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          ₹{mat.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          ₹{prod.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          ₹{log.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          ₹{inst.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                          ₹{gp.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-black text-slate-900">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            margin >= 30 ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {margin}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center space-x-1.5">
                            <button
                              onClick={() => setActiveLedgerItem(jc)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px] border border-slate-200 transition"
                            >
                              Ledger
                            </button>
                            <button
                              onClick={() => setActivePlItem(jc)}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-semibold text-[11px] border border-blue-200 transition"
                            >
                              P&L
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setActiveEditItem(jc)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded font-semibold text-[11px] transition inline-flex items-center space-x-1"
                          >
                            <span>✎ Edit</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col md:flex-row md:items-center justify-between gap-1">
              <span>Records are intentionally read-only in the table. Use ✎ Edit to open the complete typed form; phone, WhatsApp, email, website and document buttons remain direct actions.</span>
              <span className="font-mono font-bold text-slate-600 shrink-0">{filteredJobCosting.length} Jobs Tracked</span>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: ADMIN CONFIGURATION & LIVE PROFILE CRUD ==================== */}
      {activeTab === 'settings' && canViewSettings && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Company Legal Profile Form */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Statutory Company & Bank Profile</span>
              </h3>
              {currentRole === 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => setIsEditingSettings(!isEditingSettings)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center space-x-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingSettings ? 'Cancel' : 'Edit Profile'}</span>
                </button>
              )}
            </div>

            {isEditingSettings ? (
              <form onSubmit={handleSaveCompanySettings} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Legal Company Name:</label>
                  <input
                    type="text"
                    value={companyForm.legalName}
                    onChange={(e) => setCompanyForm({ ...companyForm, legalName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">GSTIN:</label>
                    <input
                      type="text"
                      value={companyForm.gstin}
                      onChange={(e) => setCompanyForm({ ...companyForm, gstin: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">PAN:</label>
                    <input
                      type="text"
                      value={companyForm.pan}
                      onChange={(e) => setCompanyForm({ ...companyForm, pan: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bank Name:</label>
                  <input
                    type="text"
                    value={companyForm.bankName}
                    onChange={(e) => setCompanyForm({ ...companyForm, bankName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Account No:</label>
                    <input
                      type="text"
                      value={companyForm.accountNumber}
                      onChange={(e) => setCompanyForm({ ...companyForm, accountNumber: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">IFSC Code:</label>
                    <input
                      type="text"
                      value={companyForm.ifsc}
                      onChange={(e) => setCompanyForm({ ...companyForm, ifsc: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
                >
                  Save Statutory Profile
                </button>
              </form>
            ) : (
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
            )}
          </div>

          {/* Number Series Configuration */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Active Gapless Number Series</span>
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {settings?.numberSeries?.map((s) => (
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

      <SmartDataExtractionModal
        isOpen={isExtractModalOpen}
        onClose={() => setIsExtractModalOpen(false)}
        onImportSuccess={loadAllData}
      />

      {/* Dynamic Item Edit Modal for Both Billing & Profitability */}
      <EditRegisterItemModal
        isOpen={Boolean(activeEditItem)}
        onClose={() => setActiveEditItem(null)}
        item={activeEditItem}
        onSaved={() => {
          setActiveEditItem(null);
          showNotification('Register updated successfully in local database.');
          loadAllData();
        }}
      />

      {/* Accounts View: General Ledger Popup Modal */}
      {activeLedgerItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden text-xs">
            <div className="bg-[#141d30] text-white p-4 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Accounts Double-Entry View</span>
                <h3 className="text-base font-extrabold">{activeLedgerItem.orderNo || activeLedgerItem.jobRef} · General Ledger</h3>
                <p className="text-[11px] text-slate-300 mt-0.5">{activeLedgerItem.customerName} · {activeLedgerItem.product}</p>
              </div>
              <button onClick={() => setActiveLedgerItem(null)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Account Title & Classification</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Debit (₹)</th>
                    <th className="py-2.5 px-3 text-right">Credit (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-800">Trade Receivables Control Account</td>
                    <td className="py-2.5 px-3 font-sans text-blue-700 font-semibold">Asset</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">₹{(activeLedgerItem.revenue || 0).toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">—</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-800">Sales & Operating Revenue</td>
                    <td className="py-2.5 px-3 font-sans text-emerald-700 font-semibold">Income</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">—</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">₹{(activeLedgerItem.revenue || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-800">Raw Material Consumption (BOM)</td>
                    <td className="py-2.5 px-3 font-sans text-amber-700 font-semibold">Expense</td>
                    <td className="py-2.5 px-3 text-right text-slate-800">₹{(activeLedgerItem.material || 0).toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">—</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-800">Direct Labour & Production Overheads</td>
                    <td className="py-2.5 px-3 font-sans text-amber-700 font-semibold">Expense</td>
                    <td className="py-2.5 px-3 text-right text-slate-800">₹{(activeLedgerItem.production || 0).toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">—</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-800">Logistics & Freight Outward</td>
                    <td className="py-2.5 px-3 font-sans text-amber-700 font-semibold">Expense</td>
                    <td className="py-2.5 px-3 text-right text-slate-800">₹{(activeLedgerItem.logistics || 0).toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">—</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-800">Site Earthing Installation Expense</td>
                    <td className="py-2.5 px-3 font-sans text-amber-700 font-semibold">Expense</td>
                    <td className="py-2.5 px-3 text-right text-slate-800">₹{(activeLedgerItem.installation || 0).toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">—</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold font-sans">
                    <td className="py-2.5 px-3">Direct Cost Control (Payables/WIP)</td>
                    <td className="py-2.5 px-3 text-purple-700 font-semibold">Contra</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">—</td>
                    <td className="py-2.5 px-3 text-right font-mono text-purple-900">
                      ₹{((activeLedgerItem.material || 0) + (activeLedgerItem.production || 0) + (activeLedgerItem.logistics || 0) + (activeLedgerItem.installation || 0)).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex justify-between items-center font-mono">
                <span className="font-sans font-bold text-blue-900">Net Job Profit Contribution:</span>
                <span className="text-base font-black text-emerald-700">₹{(activeLedgerItem.grossProfit || 0).toLocaleString('en-IN')} ({activeLedgerItem.marginPercent || 0}%)</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button onClick={() => setActiveLedgerItem(null)} className="px-4 py-1.5 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 transition">
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accounts View: Job Profit & Loss (P&L) Popup Modal */}
      {activePlItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden text-xs">
            <div className="bg-[#141d30] text-white p-4 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Statement of Profit & Loss</span>
                <h3 className="text-base font-extrabold">{activePlItem.orderNo || activePlItem.jobRef} · Job Margin Analysis</h3>
                <p className="text-[11px] text-slate-300 mt-0.5">{activePlItem.customerName}</p>
              </div>
              <button onClick={() => setActivePlItem(null)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 font-mono">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="font-sans font-bold text-slate-900">Total Contract Revenue</span>
                <span className="font-bold text-slate-900 text-sm">₹{(activePlItem.revenue || 0).toLocaleString('en-IN')}</span>
              </div>

              <div className="space-y-1.5 pt-1 text-slate-600 font-sans">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cost of Goods Sold (COGS Breakdown):</div>
                <div className="flex justify-between font-mono text-xs">
                  <span>(-) Direct Material (Copper/Steel/Compound):</span>
                  <span>₹{(activePlItem.material || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-mono text-xs">
                  <span>(-) Factory Production & Labour:</span>
                  <span>₹{(activePlItem.production || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-mono text-xs">
                  <span>(-) Surface Logistics & Freight:</span>
                  <span>₹{(activePlItem.logistics || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-mono text-xs">
                  <span>(-) Testing & Site Installation:</span>
                  <span>₹{(activePlItem.installation || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between font-mono font-bold text-red-600">
                <span className="font-sans">Total Direct Job Costs:</span>
                <span>
                  ₹{((activePlItem.material || 0) + (activePlItem.production || 0) + (activePlItem.logistics || 0) + (activePlItem.installation || 0)).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center pt-3 font-mono">
                <div>
                  <div className="font-sans font-bold text-emerald-950">Gross Job Profit:</div>
                  <div className="font-sans text-[10px] text-emerald-700">Gross Margin %: {activePlItem.marginPercent || 0}%</div>
                </div>
                <div className="text-lg font-black text-emerald-700">
                  ₹{(activePlItem.grossProfit || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button onClick={() => setActivePlItem(null)} className="px-4 py-1.5 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 transition">
                Close P&L
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
