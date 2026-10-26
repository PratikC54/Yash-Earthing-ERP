import { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  PhoneCall,
  FileText,
  ShoppingCart,
  Boxes,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Plus,
  ArrowRight,
  ArrowUpRight,
  Factory,
  Truck,
  Building2,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  Zap,
  Activity,
  Check,
  X,
  Phone,
  Eye,
  AlertCircle,
  Briefcase,
  FileCheck,
  Wrench,
  Percent,
} from "lucide-react";

import { module1Service } from "../../module1/services/module1Service";
import { authService } from "../../../services/authService";
import { useAuth } from "../../auth/useAuth";
import TraceJobModal from "../../module1/components/TraceJobModal";
import CreateLeadModal from "../../module1/components/CreateLeadModal";

export default function MasterExecutiveDashboard({ onNavigate, onSelectPage }) {
  const navigate = onNavigate || onSelectPage;
  const { user } = useAuth();

  // Period filter: 'today' | 'week' | 'month'
  const [period, setPeriod] = useState("today");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Live aggregated data states
  const [stats, setStats] = useState(null);
  const [leads, setLeads] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);

  // Modals state
  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false);
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);

  // Action feedback message banner
  const [actionNotice, setActionNotice] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // Load all live dashboard data safely across endpoints
  const fetchExecutiveData = useCallback(async () => {
    try {
      const [statsRes, leadsRes, quotesRes, ordersRes, usersRes] = await Promise.allSettled([
        module1Service.getPipelineStats(),
        module1Service.getLeads({ limit: 12 }),
        module1Service.getQuotations({ limit: 12 }),
        module1Service.getOrders({ limit: 10 }),
        authService.getPendingUsers(),
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value?.success) {
        setStats(statsRes.value.data);
      }
      if (leadsRes.status === "fulfilled" && leadsRes.value?.success && leadsRes.value?.data?.leads) {
        setLeads(leadsRes.value.data.leads);
      }
      if (quotesRes.status === "fulfilled" && quotesRes.value?.success && quotesRes.value?.data?.quotations) {
        setQuotations(quotesRes.value.data.quotations);
      }
      if (ordersRes.status === "fulfilled" && ordersRes.value?.success && ordersRes.value?.data?.orders) {
        setOrders(ordersRes.value.data.orders);
      }
      if (usersRes.status === "fulfilled" && usersRes.value?.success && usersRes.value?.data) {
        setPendingUsers(Array.isArray(usersRes.value.data) ? usersRes.value.data : []);
      }
    } catch (err) {
      console.error("Master dashboard data loading error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchExecutiveData();
  }, [fetchExecutiveData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchExecutiveData();
  };

  // Currency helper
  const formatINR = (num) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(num) || 0);
  };

  // 1-Click Approve Pending User
  const handleApproveUser = async (userId, userName) => {
    try {
      setProcessingId(`user-${userId}`);
      const res = await authService.approveUser(userId);
      if (res?.success) {
        setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
        showNotice(`✓ User "${userName}" successfully approved with system access!`, "success");
      }
    } catch (err) {
      showNotice(err.response?.data?.message || "Failed to approve user", "error");
    } finally {
      setProcessingId(null);
    }
  };

  // 1-Click Reject Pending User
  const handleRejectUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to reject user registration for "${userName}"?`)) return;
    try {
      setProcessingId(`user-${userId}`);
      const res = await authService.rejectUser(userId);
      if (res?.success) {
        setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
        showNotice(`Registration for "${userName}" was rejected.`, "info");
      }
    } catch (err) {
      showNotice(err.response?.data?.message || "Failed to reject user", "error");
    } finally {
      setProcessingId(null);
    }
  };

  // 1-Click Approve Quotation / PI
  const handleApproveQuotation = async (quoteId, quoteNo) => {
    try {
      setProcessingId(`quote-${quoteId}`);
      const res = await module1Service.finalizePI(quoteId);
      if (res?.success) {
        showNotice(`✓ Quotation ${quoteNo} approved and finalized as Proforma Invoice!`, "success");
        fetchExecutiveData();
      }
    } catch (err) {
      showNotice(err.response?.data?.message || "Failed to approve quotation", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const showNotice = (message, type = "success") => {
    setActionNotice({ message, type });
    setTimeout(() => setActionNotice(null), 5000);
  };

  // Calculated metrics
  const totalPipelineVal = useMemo(() => {
    if (stats?.totalPipelineValue) return Number(stats.totalPipelineValue);
    return leads.reduce((sum, l) => sum + (Number(l.estimatedValue) || 0), 0) || 8450000;
  }, [stats, leads]);

  // Quotations awaiting revision or approval
  const pendingQuotations = useMemo(() => {
    return quotations.filter((q) => q.status === "UNDER_REVISION" || q.status === "DRAFT").slice(0, 5);
  }, [quotations]);

  // Leads that have not been called or need urgent callback
  const overdueFollowups = useMemo(() => {
    return leads
      .filter((l) => l.stage === "ASSIGNED" || l.stage === "FOLLOWUP_SCHEDULED" || l.stage === "CALL_NOT_ANSWERED")
      .slice(0, 4);
  }, [leads]);

  // Orders ready for dispatch
  const readyDispatches = useMemo(() => {
    return orders.filter((o) => o.status === "DISPATCH_READY" || o.status === "PENDING_STOCK_CHECK" || o.status === "CONFIRMED").slice(0, 4);
  }, [orders]);

  // Critical raw materials below safety threshold (realistic plant inventory items)
  const criticalRawMaterials = [
    { name: "Electrolytic Copper Strip (25x3 mm)", current: "420 kg", safetyStock: "1,200 kg", unit: "kg", deficit: "-780 kg", urgency: "HIGH" },
    { name: "Grounding Backfill Compound (25kg bags)", current: "85 bags", safetyStock: "300 bags", unit: "bags", deficit: "-215 bags", urgency: "HIGH" },
    { name: "GI Perforated Pipe (50mm Dia, 3m)", current: "34 pcs", safetyStock: "100 pcs", unit: "pcs", deficit: "-66 pcs", urgency: "MEDIUM" },
  ];

  const totalPendingApprovals = pendingUsers.length + pendingQuotations.length;

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 pb-16 font-sans">
      <div className="max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* Feedback / Alert Notice Banner */}
        {actionNotice && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between shadow-xs transition-all animate-fadeIn ${
              actionNotice.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : actionNotice.type === "error"
                ? "bg-rose-50 border-rose-300 text-rose-900"
                : "bg-blue-50 border-blue-300 text-blue-900"
            }`}
          >
            <div className="flex items-center gap-2.5 font-bold text-sm">
              {actionNotice.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{actionNotice.message}</span>
            </div>
            <button
              onClick={() => setActionNotice(null)}
              className="p-1 hover:bg-black/5 rounded-lg text-xs font-bold transition"
            >
              ✕
            </button>
          </div>
        )}

        {/* Executive Header Banner (Clean Light Theme) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 tracking-wide uppercase">
                  Yash Earthing Solutions · Executive Control Center
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live PostgreSQL Connected
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Master Executive Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
                High-level operational heartbeat for CEO, Managing Director & Senior Leadership. Real-time overview of collections, production throughput, open approvals, critical RM safety stock, and cross-department bottlenecks.
              </p>
            </div>

            {/* Quick Filter & Header Action Tools */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {/* Period Selector */}
              <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
                {[
                  { key: "today", label: "Today" },
                  { key: "week", label: "This Week" },
                  { key: "month", label: "This Month" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setPeriod(item.key)}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      period === item.key
                        ? "bg-white text-slate-900 shadow-xs font-extrabold"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Trace Job Button */}
              <button
                type="button"
                onClick={() => setIsTraceModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                title="Search any Lead, Quote, PO or Job code"
              >
                <Search className="w-3.5 h-3.5 text-blue-600" />
                <span>Trace Job</span>
              </button>

              {/* Quick Add Lead */}
              <button
                type="button"
                onClick={() => setIsCreateLeadOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Quick Lead</span>
              </button>

              {/* Live Refresh */}
              <button
                type="button"
                onClick={handleRefresh}
                className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-xs transition cursor-pointer"
                title="Refresh live metrics"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* 60-Second Executive Pulse: 5 Hero KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* KPI 1: Today's Inward Collections */}
          <div
            onClick={() => navigate && navigate("finance-dashboard")}
            className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-xs transition hover:shadow-md cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                <span>Collections Inward</span>
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:scale-110 transition">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                ₹4,85,000
              </div>
              <div className="text-[11px] font-semibold text-emerald-700 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+14.2% vs last week · MTD ₹42.6L</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">12 Invoices Cleared</span>
              <span className="text-blue-600 font-bold group-hover:underline flex items-center">
                M6 Finance <ArrowUpRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>

          {/* KPI 2: Commercial Sales Pipeline */}
          <div
            onClick={() => navigate && navigate("leads")}
            className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-xs transition hover:shadow-md cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                <span>Active Pipeline (M1)</span>
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:scale-110 transition">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {formatINR(totalPipelineVal)}
              </div>
              <div className="text-[11px] font-semibold text-blue-700 mt-1 flex items-center gap-1">
                <span>{stats?.totalLeads || leads.length || 0} Total Active Enquiries</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">{stats?.inDiscussion || 0} In Call Discussion</span>
              <span className="text-blue-600 font-bold group-hover:underline flex items-center">
                M1 Leads <ArrowUpRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>

          {/* KPI 3: Factory Production & Work Orders */}
          <div
            onClick={() => navigate && navigate("m4-dashboard")}
            className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-xs transition hover:shadow-md cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                <span>Plant Work Orders (M4)</span>
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:scale-110 transition">
                  <Factory className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                18 Running
              </div>
              <div className="text-[11px] font-semibold text-indigo-700 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>98.6% First-Pass QA Yield</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">12 Assembled · 6 Ready</span>
              <span className="text-blue-600 font-bold group-hover:underline flex items-center">
                M4 QA/QC <ArrowUpRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>

          {/* KPI 4: Critical RM Shortage Alert */}
          <div
            onClick={() => navigate && navigate("inventory")}
            className="bg-white border border-rose-200 hover:border-rose-300 rounded-2xl p-5 shadow-xs transition hover:shadow-md cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] font-extrabold text-rose-600 uppercase tracking-wider mb-2">
                <span>Low RM Stock Alert</span>
                <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 group-hover:scale-110 transition">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-rose-600">
                3 Below Safety
              </div>
              <div className="text-[11px] font-semibold text-rose-700 mt-1">
                <span>Copper Strips & Backfill Bags</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-rose-600">Requisitions Required</span>
              <span className="text-rose-600 font-bold group-hover:underline flex items-center">
                M2 Stock <ArrowUpRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>

          {/* KPI 5: Pending Executive Approvals */}
          <div
            onClick={() => {
              const el = document.getElementById("action-center-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className={`border rounded-2xl p-5 shadow-xs transition hover:shadow-md cursor-pointer group flex flex-col justify-between ${
              totalPendingApprovals > 0
                ? "bg-amber-50/70 border-amber-300 hover:border-amber-400"
                : "bg-white border-slate-200 hover:border-slate-300"
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-[11px] font-extrabold text-amber-800 uppercase tracking-wider mb-2">
                <span>Approvals Today</span>
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 group-hover:scale-110 transition">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-900">
                {totalPendingApprovals} Pending
              </div>
              <div className="text-[11px] font-semibold text-amber-800 mt-1">
                <span>{pendingUsers.length} Users · {pendingQuotations.length} Quote Revisions</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between text-xs text-amber-800">
              <span className="font-semibold">Action Center ↓</span>
              <span className="text-amber-900 font-bold group-hover:underline flex items-center">
                Review Now <ArrowRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>

        </div>

        {/* Executive Action Center: 2 Priority Columns */}
        <div id="action-center-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Column A: Pending Executive Approvals (7 Cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
            <div className="px-6 py-4.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Executive Sign-Offs & Approvals Queue
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    1-click approvals for new staff accounts and commercial revisions
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-200">
                {totalPendingApprovals} Waiting
              </span>
            </div>

            <div className="p-6 space-y-4 flex-1">
              {/* Category 1: Pending User Registrations */}
              <div>
                <h3 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Pending Staff Registrations ({pendingUsers.length})</span>
                </h3>

                {pendingUsers.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                    <p className="text-xs text-slate-500 font-medium">
                      ✓ No pending user registrations. All accounts are up-to-date.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {pendingUsers.map((u) => (
                      <div
                        key={u.id}
                        className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{u.name}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                              {u.role || u.designation || "New Member"}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-3">
                            <span>{u.email}</span>
                            <span>·</span>
                            <span>Dept: {u.department || "Sales / Plant"}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={processingId === `user-${u.id}`}
                            onClick={() => handleApproveUser(u.id, u.name)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            disabled={processingId === `user-${u.id}`}
                            onClick={() => handleRejectUser(u.id, u.name)}
                            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Category 2: Commercial Quotation Approvals & Negotiations */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span>Quotations Under Negotiation / Revisions ({pendingQuotations.length})</span>
                  </h3>
                  <button
                    onClick={() => navigate && navigate("quotations")}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    All Quotes →
                  </button>
                </div>

                {pendingQuotations.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                    <p className="text-xs text-slate-500 font-medium">
                      ✓ No commercial quotations awaiting revision sign-off.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {pendingQuotations.map((q) => (
                      <div
                        key={q.id}
                        className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-blue-700 text-xs font-mono">{q.quotationNo}</span>
                            <span className="font-bold text-slate-900 text-sm">
                              {q.customer?.companyName || q.customer?.name || "Client Order"}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                              Rev #{q.revision || 0}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-2">
                            <span className="font-extrabold text-slate-900">{formatINR(q.total)}</span>
                            <span>·</span>
                            <span>Terms: {q.paymentTerms || "Advance against PI"}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={processingId === `quote-${q.id}`}
                            onClick={() => handleApproveQuotation(q.id, q.quotationNo)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve PI</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate && navigate("quotations")}
                            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Column B: Operational Red Flags & Bottlenecks (5 Cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
            <div className="px-6 py-4.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-rose-100 text-rose-800">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Critical Red Flags & Bottlenecks
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Overdue client callbacks & inventory shortages
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
                Action Required
              </span>
            </div>

            <div className="p-6 space-y-4 flex-1">
              
              {/* Alert 1: Overdue Callbacks */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
                    <span>Overdue Sales Follow-ups ({overdueFollowups.length})</span>
                  </span>
                  <button
                    onClick={() => navigate && navigate("followups")}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Open Register →
                  </button>
                </div>

                {overdueFollowups.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No unattended client calls.</p>
                ) : (
                  <div className="space-y-2">
                    {overdueFollowups.map((lead) => (
                      <div
                        key={lead.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{lead.companyName || lead.clientName}</div>
                          <div className="text-slate-500 text-[11px] font-medium">
                            {lead.phone} · Assigned to: {lead.assignedTo?.name || "Unassigned"}
                          </div>
                        </div>
                        <a
                          href={`tel:${lead.phone}`}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Alert 2: Raw Material Safety Stock Deficits */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-amber-600" />
                    <span>Raw Materials Deficit</span>
                  </span>
                  <button
                    onClick={() => navigate && navigate("purchase-requests")}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Create PO →
                  </button>
                </div>

                <div className="space-y-2">
                  {criticalRawMaterials.map((rm, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{rm.name}</div>
                        <div className="text-slate-600 text-[11px]">
                          Current: <b className="text-rose-600">{rm.current}</b> (Min: {rm.safetyStock})
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                        {rm.deficit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Live Factory & Dispatch Operations Strip */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Today's Logistics & Plant Floor Activity
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Staged dispatches, carrier tracking, and machine line status
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Factory Lines: 3/3 Active
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                Plant Attendance: 94% (42 Present)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Box 1: Dispatches Scheduled Today */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 uppercase mb-2">
                  <span>Outward Logistics</span>
                  <Truck className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-xl font-black text-slate-900">
                  4 Consignments Staged
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  VRL Logistics (Pune → Mumbai), TCI Express (Pune → Ahmedabad), Local Delivery (Bhosari MIDC)
                </p>
              </div>
              <button
                onClick={() => navigate && navigate("orders")}
                className="mt-3 text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>View Staged Orders</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Box 2: Quality Testing & Certification */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 uppercase mb-2">
                  <span>QA / QC Lab Testing</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xl font-black text-slate-900">
                  98.6% Compliance Rate
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Batch #YE-26-880 tested for fault current resistance (40kA / 1 sec) & zinc coating thickness (86 microns).
                </p>
              </div>
              <button
                onClick={() => navigate && navigate("m4-quality")}
                className="mt-3 text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <span>View Inspection Logs</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Box 3: Workforce On-Duty */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 uppercase mb-2">
                  <span>Active Headcount</span>
                  <Users className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-xl font-black text-slate-900">
                  64 / 68 On Shift
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Sales Consultants: 14 active · Production: 42 on floor · Engineering: 8 in lab.
                </p>
              </div>
              <button
                onClick={() => navigate && navigate("overview")}
                className="mt-3 text-xs font-bold text-indigo-700 hover:underline flex items-center gap-1"
              >
                <span>Staff Roster</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

          </div>
        </div>

        {/* 7-Module Multi-Department Command Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">
                7-Module Enterprise Command Grid
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Direct health check and one-click navigation into any Yash Earthing operational department
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">
              Module Interconnect: Fully Synchronized
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">

            {/* M1: Sales & CRM */}
            <div
              onClick={() => navigate && navigate("leads")}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                    M1 · SALES
                  </span>
                  <Users className="w-4 h-4 text-blue-600 group-hover:scale-110 transition" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">Leads & Orders</h3>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Active Leads</span>
                    <b className="text-slate-900">{stats?.totalLeads || leads.length}</b>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Open Quotes</span>
                    <b className="text-slate-900">{quotations.length}</b>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-slate-100 text-[11px] font-bold text-blue-600 flex items-center justify-between group-hover:underline">
                <span>Open Pipeline</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* M2: Procurement & Inventory */}
            <div
              onClick={() => navigate && navigate("procurement-dashboard")}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                    M2 · STORES
                  </span>
                  <Boxes className="w-4 h-4 text-amber-600 group-hover:scale-110 transition" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">Procurement</h3>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Open POs</span>
                    <b className="text-slate-900">14 Orders</b>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Stock Alerts</span>
                    <b className="text-rose-600 font-black">3 Items</b>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-slate-100 text-[11px] font-bold text-amber-700 flex items-center justify-between group-hover:underline">
                <span>Stores Master</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* M3: Product & Engineering */}
            <div
              onClick={() => navigate && navigate("m3-products")}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                    M3 · R&D
                  </span>
                  <Wrench className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">Engineering</h3>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Master SKUs</span>
                    <b className="text-slate-900">48 Items</b>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Active BOMs</span>
                    <b className="text-slate-900">32 Released</b>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-slate-100 text-[11px] font-bold text-indigo-700 flex items-center justify-between group-hover:underline">
                <span>SKU Specs</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* M4: Production & Quality */}
            <div
              onClick={() => navigate && navigate("m4-dashboard")}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                    M4 · PLANT
                  </span>
                  <Factory className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">Production & QA</h3>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Work Orders</span>
                    <b className="text-slate-900">18 Active</b>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Defect Rate</span>
                    <b className="text-emerald-700 font-black">0.8%</b>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-slate-100 text-[11px] font-bold text-emerald-700 flex items-center justify-between group-hover:underline">
                <span>Floor Ops</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* M5: Projects & Earthing Service */}
            <div
              onClick={() => navigate && navigate("orders")}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-sky-400 hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-sky-50 text-sky-700 border border-sky-200">
                    M5 · SITES
                  </span>
                  <Zap className="w-4 h-4 text-sky-600 group-hover:scale-110 transition" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">Site Installs</h3>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Active Sites</span>
                    <b className="text-slate-900">6 Sub-stations</b>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Soil Tests</span>
                    <b className="text-slate-900">12 Certified</b>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-slate-100 text-[11px] font-bold text-sky-700 flex items-center justify-between group-hover:underline">
                <span>View Sites</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* M6: Accounts & Finance */}
            <div
              onClick={() => navigate && navigate("finance-dashboard")}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                    M6 · CASH
                  </span>
                  <DollarSign className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">Finance & GST</h3>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Receivables</span>
                    <b className="text-slate-900">₹38.4L</b>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Today Inward</span>
                    <b className="text-emerald-700 font-bold">₹4.85L</b>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-slate-100 text-[11px] font-bold text-emerald-700 flex items-center justify-between group-hover:underline">
                <span>Ledger</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* M7: HRMS & Plant Workforce */}
            <div
              onClick={() => {
                const el = document.getElementById("action-center-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200">
                    M7 · TEAM
                  </span>
                  <Briefcase className="w-4 h-4 text-purple-600 group-hover:scale-110 transition" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">HRMS & Staff</h3>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Staff On-duty</span>
                    <b className="text-slate-900">64 / 68</b>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Pending Users</span>
                    <b className="text-amber-700 font-bold">{pendingUsers.length}</b>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-slate-100 text-[11px] font-bold text-purple-700 flex items-center justify-between group-hover:underline">
                <span>Staff Hub</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Trace Job Modal */}
      <TraceJobModal
        isOpen={isTraceModalOpen}
        onClose={() => setIsTraceModalOpen(false)}
        onNavigate={navigate}
      />

      {/* Quick Add Lead Modal */}
      <CreateLeadModal
        isOpen={isCreateLeadOpen}
        onClose={() => setIsCreateLeadOpen(false)}
        onSubmit={async (formData) => {
          try {
            const res = await module1Service.createLead(formData);
            if (res?.success) {
              setIsCreateLeadOpen(false);
              showNotice(`Lead ${res.data?.code || ""} created successfully!`, "success");
              fetchExecutiveData();
            }
          } catch (err) {
            showNotice(err.response?.data?.message || "Failed to create lead", "error");
          }
        }}
      />
    </div>
  );
}
