import KpiSection from "../../components/common/KpiSection";
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

export default function FinanceDashboard({ initialTab = 'invoices', globalSearch = '' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // invoices, receipts, payables, costing, settings

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (globalSearch !== undefined && globalSearch !== null) {
      setSearchQuery(globalSearch);
      setSearchQueryReceipts(globalSearch);
      setSearchQueryPayables(globalSearch);
      setSearchQueryCosting(globalSearch);
    }
  }, [globalSearch]);
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

  const handleDeleteInvoice = async (inv) => {
    if (currentRole !== 'ADMIN') {
      alert('Permission Denied: Only Admin users can delete statutory GST invoices.');
      return;
    }
    if (!window.confirm(`Permanently delete invoice ${inv.invoiceNo}? Invoiced quantities will be restored on sales order.`)) {
      return;
    }

    try {
      await financeService.deleteInvoice(inv.id);
      showNotification(`Invoice ${inv.invoiceNo} successfully deleted.`);
      loadAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete invoice.');
    }
  };

  const handleDeleteJobCosting = async (jc) => {
    if (currentRole !== 'ADMIN') {
      alert('Permission Denied: Only Admin users can delete job costing records.');
      return;
    }
    const orderRef = jc.orderNo || jc.jobRef || 'job';
    if (!window.confirm(`Permanently delete job costing record for ${orderRef}?`)) {
      return;
    }

    try {
      if (jc.id) {
        await financeService.deleteProfitabilityItem(jc.id);
      }
      showNotification(`Job costing record ${orderRef} deleted.`);
      loadAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete job costing record.');
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
    const invNo = (inv.invoiceNo || '').toLowerCase();
    const custName = (inv.customerSnapshot?.name || inv.customerName || inv.customer?.name || '').toLowerCase();
    const ordNo = (inv.orderNo || '').toLowerCase();
    const poNo = (inv.poNumber || '').toLowerCase();
    const gstin = (inv.customerSnapshot?.gstin || '').toLowerCase();
    const stat = (inv.status || '').toLowerCase();
    const derStat = (inv.derivedStatus || '').toLowerCase();

    const matchesSearch = !q ||
      invNo.includes(q) ||
      custName.includes(q) ||
      ordNo.includes(q) ||
      poNo.includes(q) ||
      gstin.includes(q) ||
      stat.includes(q) ||
      derStat.includes(q);

    let matchesStatus = true;
    const invStatusUpper = (inv.status || '').toUpperCase().replace(/\s+/g, '_');
    const invDerivedUpper = (inv.derivedStatus || '').toUpperCase().replace(/\s+/g, '_');
    const numBal = Number(inv.balanceAmount) || 0;
    const numPaid = Number(inv.paidAmount) || 0;
    const isPaid = (numBal <= 0 && (numPaid > 0 || Number(inv.grandTotal) > 0)) || invStatusUpper === 'PAID' || invDerivedUpper === 'PAID';
    const isPartPaid = (numPaid > 0 && numBal > 0) || invStatusUpper.includes('PART') || invDerivedUpper.includes('PART');
    const isOverdue = Boolean(inv.isOverdue || invStatusUpper.includes('OVERDUE') || invDerivedUpper.includes('OVERDUE'));

    if (!statusFilter || statusFilter === 'ALL') {
      matchesStatus = true;
    } else if (statusFilter === 'PAID') {
      matchesStatus = isPaid;
    } else if (statusFilter === 'PART_PAID') {
      matchesStatus = isPartPaid && !isPaid;
    } else if (statusFilter === 'ISSUED') {
      matchesStatus = (numPaid === 0 && numBal > 0 && !isOverdue) ||
        invStatusUpper === 'ISSUED' || invStatusUpper === 'PENDING' || invDerivedUpper === 'ISSUED';
    } else if (statusFilter === 'OVERDUE') {
      matchesStatus = isOverdue && !isPaid;
    } else if (statusFilter === 'CANCELLED') {
      matchesStatus = invStatusUpper === 'CANCELLED' || invStatusUpper === 'VOID' || invDerivedUpper === 'CANCELLED';
    } else {
      matchesStatus = invStatusUpper === statusFilter || invDerivedUpper === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  // Filtered receipts
  const filteredReceipts = receipts.filter(rec => {
    const q = searchQueryReceipts.toLowerCase().trim();
    const recNo = (rec.receiptNo || '').toLowerCase();
    const refNo = (rec.referenceNo || '').toLowerCase();
    const custId = (rec.customerId || '').toLowerCase();
    const bnk = (rec.bank || '').toLowerCase();
    const notes = (rec.notes || '').toLowerCase();
    const meth = (rec.method || '').toLowerCase();

    const matchesSearch = !q ||
      recNo.includes(q) ||
      refNo.includes(q) ||
      custId.includes(q) ||
      bnk.includes(q) ||
      notes.includes(q) ||
      meth.includes(q);

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
    const billNo = (vb.billNo || '').toLowerCase();
    const vendorName = (vb.vendorName || '').toLowerCase();
    const poNo = (vb.poNumber || '').toLowerCase();
    const grnNo = (vb.grnNumber || '').toLowerCase();
    const matchRes = (vb.matchResult || '').toLowerCase();
    const stat = (vb.status || '').toLowerCase();

    const matchesSearch = !q ||
      billNo.includes(q) ||
      vendorName.includes(q) ||
      poNo.includes(q) ||
      grnNo.includes(q) ||
      matchRes.includes(q) ||
      stat.includes(q);

    let matchesStatus = true;
    if (statusFilterPayables === 'ALL') {
      matchesStatus = true;
    } else if (statusFilterPayables === 'MATCHED') {
      matchesStatus = vb.matchResult === 'MATCHED';
    } else if (statusFilterPayables === 'MISMATCH') {
      matchesStatus = vb.matchResult === 'MISMATCH' || vb.matchResult === 'PRICE_MISMATCH' || vb.matchResult === 'QTY_MISMATCH';
    } else if (statusFilterPayables === 'PENDING_VERIFICATION') {
      matchesStatus = vb.matchResult?.includes('PENDING') || vb.status?.includes('PENDING') || vb.matchResult === 'PENDING_VERIFICATION';
    } else if (statusFilterPayables === 'APPROVED') {
      matchesStatus = vb.status === 'APPROVED';
    } else {
      matchesStatus = vb.matchResult === statusFilterPayables || vb.status === statusFilterPayables;
    }

    return matchesSearch && matchesStatus;
  });

  // Filtered job costing
  const filteredJobCosting = jobCosting.filter(jc => {
    const q = searchQueryCosting.toLowerCase().trim();
    const ordNo = (jc.orderNo || '').toLowerCase();
    const jobRef = (jc.jobRef || '').toLowerCase();
    const custName = (jc.customerName || '').toLowerCase();
    const prod = (jc.product || '').toLowerCase();

    const matchesSearch = !q ||
      ordNo.includes(q) ||
      jobRef.includes(q) ||
      custName.includes(q) ||
      prod.includes(q);

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

  // Strict Enterprise RBAC check: only ADMIN can access Module 6
  if (currentRole !== 'ADMIN') {
    return (
      <div className="p-8 max-w-2xl mx-auto my-16 text-center bg-[#10182f] border border-red-500/30 rounded-2xl shadow-2xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-white">Access Denied: Module 6 Restricted</h2>
        <p className="text-slate-300 text-sm mt-2">
          Finance & Commercial operations are strictly restricted to System Administrators only. Your current role is <span className="font-mono text-cyan-300 font-bold">{currentRole}</span>.
        </p>
        <p className="text-slate-500 text-xs mt-3">
          Please contact your administrator if you require commercial audit or billing clearance.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">


      {/* Success Notification Banner */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Module Title Banner & Strategic Handshake Strip */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-[#d4ff00] text-black border border-lime-400 tracking-wider">
                MODULE 6
              </span>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Finance & Commercial — Billing, Collections & Margins
              </h1>
            </div>
            <p className="text-xs text-slate-600 font-semibold mt-1">
              Final operational link in 10-step ERP: GST Invoicing from M1/M2 Dispatches, Receivables Ageing, 3-Way Payables Match & Job Margins.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsExtractModalOpen(true)}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold rounded-xl text-xs shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-slate-700" />
              <span>Smart Import (CSV/Excel)</span>
            </button>

            {canCreate && (
              <>
                <button
                  onClick={() => setIsInvoiceModalOpen(true)}
                  className="px-3.5 py-2 bg-[#d4ff00] hover:bg-[#c2ed00] text-black font-black border border-lime-400 rounded-xl text-xs shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Generate Invoice</span>
                </button>
                <button
                  onClick={() => setIsReceiptModalOpen(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <IndianRupee className="w-4 h-4" />
                  <span>+ Record Receipt</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Relational Process Flow Strip */}
        <div className="mt-5 pt-4 border-t border-slate-200 flex items-center space-x-3 text-xs overflow-x-auto pb-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 shrink-0">
            Workflow Stream:
          </span>
          <div className="flex items-center space-x-2 shrink-0">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-bold flex items-center space-x-1.5">
              <span>01. Billing Plan & Eligibility (M1/M2)</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 font-bold flex items-center space-x-1.5">
              <span>02. GST Tax Invoice (CGST/SGST/IGST)</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center space-x-1.5">
              <span>03. Collections, TDS & Ageing</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200 font-bold flex items-center space-x-1.5">
              <span>04. 3-Way Match Payables (M2)</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold flex items-center space-x-1.5">
              <span>05. Job Costing & Margins (M3)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Module 6 Overview Fast Navigation Strips (Billing, Payables, Costing & Margins) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between shadow-xs cursor-pointer ${
            activeTab === 'invoices' || activeTab === 'receipts'
              ? 'bg-lime-50/80 border-2 border-lime-400 text-slate-900 ring-2 ring-lime-400/30'
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900">Billing & Receivables</div>
              <div className="text-[11px] text-slate-600 font-bold">Invoices · Collections · Ageing</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => setActiveTab('payables')}
          className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between shadow-xs cursor-pointer ${
            activeTab === 'payables'
              ? 'bg-lime-50/80 border-2 border-lime-400 text-slate-900 ring-2 ring-lime-400/30'
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900">Payables & Expenses</div>
              <div className="text-[11px] text-slate-600 font-bold">Vendor Bills · PO Checks · 3-Way Match</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => setActiveTab('costing')}
          className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between shadow-xs cursor-pointer ${
            activeTab === 'costing'
              ? 'bg-lime-50/80 border-2 border-lime-400 text-slate-900 ring-2 ring-lime-400/30'
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900">Costing, Ledger & MIS</div>
              <div className="text-[11px] text-slate-600 font-bold">Job Margin · Realization · Financial MIS</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Critical Actions Feed Banner */}
      {dashboardData?.criticalActions?.length > 0 && currentRole !== 'SALES_OWNER' && (
        <div className="bg-amber-50/70 border border-amber-300 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 text-amber-800 font-black text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Critical Action Center ({dashboardData.criticalActions.length} Pending Items)</span>
            </div>
            <span className="text-[11px] text-amber-800 font-mono font-bold">Live ERP Governance Feed</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {dashboardData.criticalActions.map((act) => (
              <div key={act.id} className="p-2.5 bg-white border border-slate-200 rounded-xl flex justify-between items-center text-slate-800 shadow-xs">
                <div>
                  <div className="font-extrabold text-slate-900">{act.title}</div>
                  <div className="text-[11px] text-slate-600 font-bold">{act.customer} · Amount: <strong className="font-mono text-blue-700 font-black">₹{act.amount.toLocaleString('en-IN')}</strong></div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                  ACTION DUE
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4 Live Operational KPI Cards (Matching Module 1 / Module 3 Cyber Steel Theme) */}
      <KpiSection title="Financial & Operational Performance">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1: Revenue */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-wider">Taxable Revenue (Net)</div>
            {loading ? (
              <div className="h-7 w-28 bg-slate-200/80 rounded animate-pulse mt-1" />
            ) : (
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                ₹{kpis.totalRevenue.toLocaleString('en-IN')}
              </div>
            )}
            <div className="text-[11px] text-emerald-700 font-bold mt-1">Active Billing · Dispatches</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5 text-blue-700" />
          </div>
        </div>

        {/* KPI 2: Receivables */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-wider">Outstanding Receivables</div>
            {loading ? (
              <div className="h-7 w-28 bg-slate-200/80 rounded animate-pulse mt-1" />
            ) : (
              <div className="text-2xl font-black text-amber-700 mt-1 font-mono">
                ₹{kpis.totalReceivables.toLocaleString('en-IN')}
              </div>
            )}
            <div className="text-[11px] text-rose-700 font-bold mt-1">
              Overdue: ₹{kpis.overdueReceivables.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5 text-amber-700" />
          </div>
        </div>

        {/* KPI 3: Vendor Payables */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-wider">Vendor Payables (3-Way)</div>
            {loading ? (
              <div className="h-7 w-28 bg-slate-200/80 rounded animate-pulse mt-1" />
            ) : (
              <div className="text-2xl font-black text-purple-950 mt-1 font-mono">
                {canViewPayables ? `₹${kpis.totalPayables.toLocaleString('en-IN')}` : 'RESTRICTED'}
              </div>
            )}
            <div className="text-[11px] text-slate-600 font-bold mt-1">
              Advance: <span className="text-purple-900 font-extrabold">₹{kpis.unallocatedCredit.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-900 border border-purple-200 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5 text-purple-900" />
          </div>
        </div>

        {/* KPI 4: Job Costing / Margin */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-wider">Gross Profit Margin</div>
            {loading ? (
              <div className="h-7 w-20 bg-slate-200/80 rounded animate-pulse mt-1" />
            ) : (
              <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
                {canViewMargins ? `${kpis.avgMarginPercent}%` : 'RESTRICTED'}
              </div>
            )}
            <div className="text-[11px] text-slate-600 font-bold mt-1">
              {canViewMargins ? 'BOM Snapshot vs Actuals' : 'Proprietary Costing'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
            <Percent className="w-5 h-5 text-emerald-700" />
          </div>
        </div>
        </div>
      </KpiSection>

      {/* Main Tab Controls (Clean High-Contrast Tabs) */}
      <div className="flex border-b border-slate-200 space-x-2 text-xs font-bold overflow-x-auto bg-white p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`py-2.5 px-4 rounded-lg transition flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeTab === 'invoices'
              ? 'bg-slate-900 text-white font-black shadow-xs'
              : 'text-slate-600 hover:text-black hover:bg-slate-100 font-bold'
          }`}
        >
          <FileText className={`w-4 h-4 ${activeTab === 'invoices' ? 'text-white' : 'text-slate-500 group-hover:text-black'}`} />
          <span>Invoices & Billing</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'invoices' ? 'bg-slate-800 text-[#d4ff00]' : 'bg-slate-100 text-slate-700'
          }`}>
            {filteredInvoices.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('receipts')}
          className={`py-2.5 px-4 rounded-lg transition flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeTab === 'receipts'
              ? 'bg-slate-900 text-white font-black shadow-xs'
              : 'text-slate-600 hover:text-black hover:bg-slate-100 font-bold'
          }`}
        >
          <IndianRupee className={`w-4 h-4 ${activeTab === 'receipts' ? 'text-white' : 'text-slate-500 group-hover:text-black'}`} />
          <span>Collections & Ageing</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'receipts' ? 'bg-slate-800 text-[#d4ff00]' : 'bg-slate-100 text-slate-700'
          }`}>
            {filteredReceipts.length}
          </span>
        </button>

        {canViewPayables && (
          <button
            onClick={() => setActiveTab('payables')}
            className={`py-2.5 px-4 rounded-lg transition flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeTab === 'payables'
                ? 'bg-slate-900 text-white font-black shadow-xs'
                : 'text-slate-600 hover:text-black hover:bg-slate-100 font-bold'
            }`}
          >
            <Building2 className={`w-4 h-4 ${activeTab === 'payables' ? 'text-white' : 'text-slate-500 group-hover:text-black'}`} />
            <span>Payables & 3-Way Match</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'payables' ? 'bg-slate-800 text-[#d4ff00]' : 'bg-slate-100 text-slate-700'
            }`}>
              {filteredVendorBills.length}
            </span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('costing')}
          className={`py-2.5 px-4 rounded-lg transition flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeTab === 'costing'
              ? 'bg-slate-900 text-white font-black shadow-xs'
              : 'text-slate-600 hover:text-black hover:bg-slate-100 font-bold'
          }`}
        >
          <Percent className={`w-4 h-4 ${activeTab === 'costing' ? 'text-white' : 'text-slate-500 group-hover:text-black'}`} />
          <span>Costing & Job Margins</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'costing' ? 'bg-slate-800 text-[#d4ff00]' : 'bg-slate-100 text-slate-700'
          }`}>
            {filteredJobCosting.length}
          </span>
        </button>

        {canViewSettings && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2.5 px-4 rounded-lg transition flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-slate-900 text-white font-black shadow-xs'
                : 'text-slate-600 hover:text-black hover:bg-slate-100 font-bold'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Financial Settings</span>
          </button>
        )}
      </div>

      {/* ==================== TAB 1: INVOICES & RECEIVABLES ==================== */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Action & Filter Toolbar */}
          <div className="bg-[#10182f] p-4 rounded-2xl border border-[#1e2a4a] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search invoice no, customer, order..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white text-slate-900 border border-slate-300 rounded-xl placeholder:text-slate-400 font-medium focus:border-[#0c1222] focus:outline-none shadow-xs"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 text-xs bg-white text-slate-800 border border-slate-300 rounded-xl focus:border-[#0c1222] focus:outline-none font-bold shadow-xs cursor-pointer hover:border-slate-400 transition"
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
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold rounded-xl text-xs transition flex items-center space-x-1 cursor-pointer"
                title="Export complete details to Excel-safe CSV (No ##### on dates)"
              >
                <FileDown className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export CSV</span>
              </button>

              {canCreate && (
                <button
                  onClick={() => setIsInvoiceModalOpen(true)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-600/30 transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Invoice from Dispatch</span>
                </button>
              )}
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl overflow-hidden shadow-xl text-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0b1329] border-b border-slate-800 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
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
                <tbody className="divide-y divide-slate-800/80">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-3 px-4"><div className="h-4 w-24 bg-slate-200/80 rounded" /><div className="h-3 w-16 bg-slate-200/50 rounded mt-1" /></td>
                        <td className="py-3 px-4"><div className="h-4 w-36 bg-slate-200/80 rounded" /><div className="h-3 w-28 bg-slate-200/50 rounded mt-1" /></td>
                        <td className="py-3 px-3"><div className="h-4 w-20 bg-slate-200/60 rounded" /></td>
                        <td className="py-3 px-3"><div className="h-4 w-16 bg-slate-200/60 rounded" /></td>
                        <td className="py-3 px-3 text-right"><div className="h-4 w-16 bg-slate-200/80 rounded ml-auto" /></td>
                        <td className="py-3 px-3 text-right"><div className="h-4 w-16 bg-slate-200/80 rounded ml-auto" /></td>
                        <td className="py-3 px-3 text-right"><div className="h-4 w-16 bg-slate-200/80 rounded ml-auto" /></td>
                        <td className="py-3 px-3 text-center"><div className="h-5 w-16 bg-slate-200/70 rounded mx-auto" /></td>
                        <td className="py-3 px-4 text-center"><div className="h-6 w-16 bg-slate-200/60 rounded mx-auto" /></td>
                      </tr>
                    ))
                  ) : filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-300">
                        {inv.invoiceNo}
                        <div className="text-[10px] text-slate-400 font-normal">{inv.invoiceDate}</div>
                        {inv.isDisputed && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold rounded">
                            Disputed
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{inv.customerSnapshot?.name || inv.customerName || 'Customer'}</div>
                        <div className="text-[10px] text-cyan-200/80 font-mono">
                          GSTIN: {inv.customerSnapshot?.gstin || '—'} · {inv.taxType === 'INTER_STATE' ? 'IGST 18%' : 'CGST+SGST 18%'}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-200">
                        <div className="text-white font-medium">{inv.orderNo}</div>
                        <div className="text-[10px] text-slate-400">{inv.poNumber}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className={`font-mono ${inv.isOverdue ? 'text-rose-400 font-bold' : 'text-slate-200'}`}>
                          {inv.dueDate}
                        </div>
                        {inv.isOverdue && (
                          <span className="text-[10px] font-bold text-rose-400">
                            {inv.overdueDays}d overdue
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-200">
                        ₹{Number(inv.taxableTotal).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        ₹{Number(inv.grandTotal).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span className={inv.balanceAmount > 0 ? (inv.isOverdue ? 'text-rose-400 font-bold' : 'text-amber-300 font-bold') : 'text-emerald-400 font-bold'}>
                          ₹{Number(inv.balanceAmount).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          inv.status === 'CANCELLED'
                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                            : inv.derivedStatus === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : inv.derivedStatus?.includes('OVERDUE') || inv.isOverdue
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : inv.derivedStatus === 'PART_PAID'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-cyan-300 border border-blue-500/30'
                        }`}>
                          {inv.status === 'CANCELLED' ? 'CANCELLED' : inv.derivedStatus?.replace(/_/g, ' ') || inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleDownloadInvoicePdf(inv.id)}
                            title="Download Statutory GST Tax Invoice (PDF)"
                            className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-cyan-300 border border-blue-500/30 rounded font-bold text-[10px] transition inline-flex items-center space-x-1 cursor-pointer"
                          >
                            <Printer className="w-3 h-3" />
                            <span>PDF</span>
                          </button>

                          <button
                            onClick={() => handleToggleDispute(inv)}
                            title="Toggle Commercial Dispute Status"
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded font-semibold text-[10px] transition cursor-pointer"
                          >
                            {inv.isDisputed ? 'Resolved' : 'Dispute'}
                          </button>

                          {canDelete && inv.status !== 'CANCELLED' && inv.paidAmount === 0 && (
                            <button
                              onClick={() => handleCancelInvoice(inv)}
                              title="Cancel / Void Invoice"
                              className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded font-semibold text-[10px] transition cursor-pointer"
                            >
                              Void
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => handleDeleteInvoice(inv)}
                              title="Permanently Delete Invoice"
                              className="p-1 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan="9" className="py-8 text-center text-slate-400 font-medium">
                        No invoices found matching the current search query or filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: RECEIPTS & COLLECTIONS ==================== */}
      {activeTab === 'receipts' && (
        <div className="space-y-6">
          {/* Action & Filter Toolbar for Tab 2 */}
          <div className="bg-[#10182f] p-4 rounded-2xl border border-[#1e2a4a] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search customer, receipt no, UTR, bank..."
                  value={searchQueryReceipts}
                  onChange={(e) => setSearchQueryReceipts(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#0a1020] text-slate-100 border border-slate-800 rounded-xl placeholder:text-slate-500 font-medium focus:border-cyan-400 focus:outline-none shadow-inner"
                />
              </div>

              <select
                value={methodFilterReceipts}
                onChange={(e) => setMethodFilterReceipts(e.target.value)}
                className="px-3 py-1.5 text-xs bg-[#0a1020] text-slate-200 border border-slate-800 rounded-xl focus:border-cyan-400 focus:outline-none font-medium shadow-inner cursor-pointer"
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
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold rounded-xl text-xs transition flex items-center space-x-1 cursor-pointer"
                title="Export complete customer ageing analysis to Excel CSV"
              >
                <FileDown className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export Ageing</span>
              </button>

              {canCreate && (
                <button
                  onClick={() => setIsReceiptModalOpen(true)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30 transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Record Payment</span>
                </button>
              )}
            </div>
          </div>

          {/* Customer Ageing Matrix */}
          <div className="bg-[#10182f] p-5 rounded-2xl border border-[#1e2a4a] shadow-xl space-y-3 text-slate-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white">Customer Receivables Ageing Matrix</h3>
                <p className="text-xs text-slate-400">Live breakdown of customer debt across statutory ageing periods</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0b1329] border-b border-slate-800 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
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
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {filteredAgeing.map((ag) => (
                    <tr key={ag.customerId} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-sans font-bold text-white">{ag.customerName}</td>
                      <td className="py-3 px-3 text-right text-slate-300">₹{Number(ag.current).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-right text-amber-400">₹{Number(ag.days1_30).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-right text-orange-400">₹{Number(ag.days31_60).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-right text-rose-400">₹{Number(ag.days61_90).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-right text-rose-400 font-bold">₹{Number(ag.days90Plus).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-right font-bold text-cyan-300">₹{Number(ag.totalOutstanding).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                        ₹{Number(ag.creditLimit - ag.totalOutstanding).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  {filteredAgeing.length === 0 && (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-slate-400 font-medium font-sans">
                        No customer ageing records found matching search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Receipt Register Table */}
          <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl overflow-hidden shadow-xl text-slate-200">
            <div className="p-4 border-b border-slate-800 font-bold text-sm text-white">
              Verified Receipt Register (Collections & TDS Logs)
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b1329] border-b border-slate-800 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
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
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {filteredReceipts.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-cyan-300">{rec.receiptNo}</td>
                    <td className="py-3 px-4 font-sans font-semibold text-white">
                      {rec.customerId?.replace('cust_', '').toUpperCase()}
                    </td>
                    <td className="py-3 px-3 text-slate-300">{rec.receivedOn}</td>
                    <td className="py-3 px-3 font-sans text-slate-300">
                      {rec.method} ({rec.bank})
                    </td>
                    <td className="py-3 px-3 text-slate-300">{rec.referenceNo}</td>
                    <td className="py-3 px-3 text-right font-bold text-white">₹{Number(rec.amount).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 text-right font-bold text-cyan-300">
                      {rec.unallocatedAmount > 0 ? `₹${Number(rec.unallocatedAmount).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="py-3 px-3 text-center font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteReceipt(rec)}
                          title="Reverse & Delete Receipt"
                          className="p-1 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredReceipts.length === 0 && (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-400 font-medium font-sans">
                      No payment receipts found matching current search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: PAYABLES & VENDOR BILLS ==================== */}
      {activeTab === 'payables' && canViewPayables && (
        <div className="space-y-4">
          {/* Action & Filter Toolbar for Tab 3 */}
          <div className="bg-[#10182f] p-4 rounded-2xl border border-[#1e2a4a] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search vendor, bill no, PO, GRN..."
                  value={searchQueryPayables}
                  onChange={(e) => setSearchQueryPayables(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#0a1020] text-slate-100 border border-slate-800 rounded-xl placeholder:text-slate-500 font-medium focus:border-cyan-400 focus:outline-none shadow-inner"
                />
              </div>

              <select
                value={statusFilterPayables}
                onChange={(e) => setStatusFilterPayables(e.target.value)}
                className="px-3 py-1.5 text-xs bg-[#0a1020] text-slate-200 border border-slate-800 rounded-xl focus:border-cyan-400 focus:outline-none font-medium shadow-inner cursor-pointer"
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
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold rounded-xl text-xs transition flex items-center space-x-1 cursor-pointer"
                title="Export complete vendor payables to Excel CSV"
              >
                <FileDown className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export Payables</span>
              </button>

              {canCreate && (
                <button
                  onClick={() => setIsVendorBillModalOpen(true)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-600/30 transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Enter Vendor Bill</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl overflow-hidden shadow-xl text-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b1329] border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
              <tbody className="divide-y divide-slate-800/80">
                {filteredVendorBills.map((vb) => (
                  <tr key={vb.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{vb.vendorName}</div>
                      <div className="font-mono text-[11px] text-cyan-300">{vb.billNo}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      <div>{vb.poNumber}</div>
                      <div className="text-[10px] text-slate-400">{vb.grnNumber}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">{vb.dueDate}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-white">₹{Number(vb.totalAmount).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-red-400">₹{Number(vb.balanceAmount).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        vb.matchResult === 'MATCHED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {vb.matchResult}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        vb.status === 'APPROVED'
                          ? 'bg-blue-500/20 text-cyan-300 border border-blue-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {vb.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {vb.balanceAmount > 0 && vb.matchResult === 'MATCHED' && (
                          <button
                            onClick={() => handlePayVendor(vb.id, vb.balanceAmount)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] transition cursor-pointer"
                          >
                            Pay
                          </button>
                        )}
                        {canCreate && vb.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleUpdateVendorBillStatus(vb.id, 'APPROVED')}
                            className="px-2.5 py-1 bg-blue-600/20 text-cyan-300 border border-blue-500/30 hover:bg-blue-600/30 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteVendorBill(vb)}
                            title="Delete Vendor Bill"
                            className="p-1 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 rounded transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredVendorBills.length === 0 && (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400 font-medium">
                      No vendor bills found matching the current search query or filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: JOB COSTING & MARGINS ==================== */}
      {activeTab === 'costing' && (
        <div className="space-y-4">
          {/* Header Title Banner matching unified Cyber Steel Theme */}
          <div className="bg-[#10182f] p-4 rounded-2xl border border-[#1e2a4a] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-slate-200">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-black text-white tracking-tight">
                  Job Costing, Ledger & Profitability Register
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Controlled Register
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time job gross margin tracking, direct material allocations & commercial realization
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
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#0a1020] text-slate-100 border border-slate-800 rounded-xl placeholder:text-slate-500 font-medium focus:border-cyan-400 focus:outline-none shadow-inner"
                />
              </div>

              <select
                value={statusFilterCosting}
                onChange={(e) => setStatusFilterCosting(e.target.value)}
                className="px-3 py-1.5 text-xs bg-[#0a1020] text-slate-200 border border-slate-800 rounded-xl focus:border-cyan-400 focus:outline-none font-medium shadow-inner cursor-pointer"
              >
                <option value="ALL">All Margin Statuses</option>
                <option value="HIGH">High Margin (≥ 50%)</option>
                <option value="MEDIUM">Target Margin (30%–49%)</option>
                <option value="LOW">Low Margin (&lt; 30%)</option>
              </select>

              <button
                onClick={handleExportJobCostingCsv}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold rounded-xl text-xs transition flex items-center space-x-1 shrink-0 cursor-pointer"
                title="Export complete job costing and margins to CSV"
              >
                <FileDown className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Exact Register Table */}
          <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl overflow-hidden shadow-xl text-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0b1329] border-b border-slate-800 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
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
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
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
                      <tr key={jc.id || orderNo} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-cyan-300 font-mono">{orderNo}</div>
                          <div className="text-[11px] text-white font-medium">{customerName}</div>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-200">
                          {product}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-white">
                          ₹{rev.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-200">
                          ₹{mat.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-200">
                          ₹{prod.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-200">
                          ₹{log.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-200">
                          ₹{inst.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                          ₹{gp.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            margin >= 30 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {margin}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center space-x-1.5">
                            <button
                              onClick={() => setActiveLedgerItem(jc)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold text-[11px] border border-slate-700 transition cursor-pointer"
                            >
                              Ledger
                            </button>
                            <button
                              onClick={() => setActivePlItem(jc)}
                              className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-cyan-300 rounded font-semibold text-[11px] border border-blue-500/30 transition cursor-pointer"
                            >
                              P&L
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => setActiveEditItem(jc)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded font-semibold text-[11px] transition inline-flex items-center space-x-1 cursor-pointer"
                            >
                              <span>✎ Edit</span>
                            </button>
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteJobCosting(jc)}
                                title="Delete Job Costing Record"
                                className="p-1 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredJobCosting.length === 0 && (
                    <tr>
                      <td colSpan="11" className="py-8 text-center text-slate-400 font-medium">
                        No job costing records found matching the current search query or filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-[#0b1329] border-t border-slate-800 text-[11px] text-slate-400 flex flex-col md:flex-row md:items-center justify-between gap-1">
              <span>Records are secured in the register. Use ✎ Edit to adjust live job allocations, or Trash to remove.</span>
              <span className="font-mono font-bold text-cyan-300 shrink-0">{filteredJobCosting.length} Jobs Tracked</span>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: ADMIN CONFIGURATION & LIVE PROFILE CRUD ==================== */}
      {activeTab === 'settings' && canViewSettings && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Company Legal Profile Form */}
          <div className="bg-[#10182f] p-5 rounded-2xl border border-[#1e2a4a] shadow-xl space-y-4 text-slate-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span>Statutory Company & Bank Profile</span>
              </h3>
              {currentRole === 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => setIsEditingSettings(!isEditingSettings)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1 cursor-pointer transition"
                >
                  <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isEditingSettings ? 'Cancel' : 'Edit Profile'}</span>
                </button>
              )}
            </div>

            {isEditingSettings ? (
              <form onSubmit={handleSaveCompanySettings} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Legal Company Name:</label>
                  <input
                    type="text"
                    value={companyForm.legalName}
                    onChange={(e) => setCompanyForm({ ...companyForm, legalName: e.target.value })}
                    className="w-full p-2 bg-[#0a1020] border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-400 font-semibold shadow-inner"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">GSTIN:</label>
                    <input
                      type="text"
                      value={companyForm.gstin}
                      onChange={(e) => setCompanyForm({ ...companyForm, gstin: e.target.value })}
                      className="w-full p-2 bg-[#0a1020] border border-slate-800 rounded-xl text-slate-100 font-mono focus:outline-none focus:border-cyan-400 shadow-inner"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">PAN:</label>
                    <input
                      type="text"
                      value={companyForm.pan}
                      onChange={(e) => setCompanyForm({ ...companyForm, pan: e.target.value })}
                      className="w-full p-2 bg-[#0a1020] border border-slate-800 rounded-xl text-slate-100 font-mono focus:outline-none focus:border-cyan-400 shadow-inner"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Bank Name:</label>
                  <input
                    type="text"
                    value={companyForm.bankName}
                    onChange={(e) => setCompanyForm({ ...companyForm, bankName: e.target.value })}
                    className="w-full p-2 bg-[#0a1020] border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-400 shadow-inner"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Account No:</label>
                    <input
                      type="text"
                      value={companyForm.accountNumber}
                      onChange={(e) => setCompanyForm({ ...companyForm, accountNumber: e.target.value })}
                      className="w-full p-2 bg-[#0a1020] border border-slate-800 rounded-xl text-slate-100 font-mono focus:outline-none focus:border-cyan-400 shadow-inner"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">IFSC Code:</label>
                    <input
                      type="text"
                      value={companyForm.ifsc}
                      onChange={(e) => setCompanyForm({ ...companyForm, ifsc: e.target.value })}
                      className="w-full p-2 bg-[#0a1020] border border-slate-800 rounded-xl text-slate-100 font-mono focus:outline-none focus:border-cyan-400 shadow-inner"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  Save Statutory Profile
                </button>
              </form>
            ) : (
              <div className="text-xs space-y-2 text-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-400">Legal Registered Name:</span>
                  <span className="font-bold text-white">{settings?.companyProfile?.legalName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Statutory GSTIN:</span>
                  <span className="font-mono font-bold text-cyan-300">{settings?.companyProfile?.gstin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Permanent Account Number (PAN):</span>
                  <span className="font-mono font-bold text-white">{settings?.companyProfile?.pan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Home State (Place of Supply Base):</span>
                  <span className="font-bold text-white">{settings?.companyProfile?.stateName} (Code: {settings?.companyProfile?.stateCode})</span>
                </div>
                <div className="pt-2 border-t border-slate-800">
                  <div className="font-bold text-white mb-1">Bank Remittance Account:</div>
                  <div className="font-mono text-slate-300">
                    {settings?.companyProfile?.bankDetails?.bankName} · A/C: {settings?.companyProfile?.bankDetails?.accountNumber}<br />
                    IFSC: {settings?.companyProfile?.bankDetails?.ifsc} · UPI: {settings?.companyProfile?.bankDetails?.upiId}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Number Series Configuration */}
          <div className="bg-[#10182f] p-5 rounded-2xl border border-[#1e2a4a] shadow-xl space-y-3 text-slate-200">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Active Gapless Number Series</span>
            </h3>
            <div className="divide-y divide-slate-800 text-xs">
              {settings?.numberSeries?.map((s) => (
                <div key={s.id} className="py-2 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white">{s.docType}</div>
                    <div className="font-mono text-[11px] text-slate-400">{s.format}</div>
                  </div>
                  <div className="font-mono font-bold text-cyan-300">Next: #{s.nextNo}</div>
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
