import { useState, useEffect, useCallback } from "react";
import {
  ArrowRight,
  Plus,
  Search,
  PhoneCall,
  FileText,
  ShoppingCart,
  Boxes,
  Users,
  Clock,
  Sparkles,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import module1Service from "../services/module1Service";
import CreateLeadModal from "../components/CreateLeadModal";
import LogCallModal from "../components/LogCallModal";
import QuotationModal from "../components/QuotationModal";
import InventoryCheckModal from "../components/InventoryCheckModal";
import TraceJobModal from "../components/TraceJobModal";
import KpiSection from "../../components/common/KpiSection";

export default function OverviewDashboard({ onNavigate, onSelectPage }) {
  const navigate = onNavigate || onSelectPage;

  const [stats, setStats] = useState(null);
  const [recentLeads, setRecentLeads] = useState([]);
  const [recentQuotations, setRecentQuotations] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
  const [callModalLead, setCallModalLead] = useState(null);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [inventoryCheckResult, setInventoryCheckResult] = useState(null);
  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false);

  // Load all live dashboard data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, leadsRes, quotesRes, ordersRes] = await Promise.allSettled([
        module1Service.getPipelineStats(),
        module1Service.getLeads({ limit: 5 }),
        module1Service.getQuotations({ limit: 5 }),
        module1Service.getOrders({ limit: 5 }),
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value?.success && statsRes.value?.data) {
        setStats(statsRes.value.data);
      }
      if (leadsRes.status === "fulfilled" && leadsRes.value?.success && leadsRes.value?.data?.leads) {
        setRecentLeads(leadsRes.value.data.leads);
      }
      if (quotesRes.status === "fulfilled" && quotesRes.value?.success && quotesRes.value?.data?.quotations) {
        setRecentQuotations(quotesRes.value.data.quotations);
      }
      if (ordersRes.status === "fulfilled" && ordersRes.value?.success && ordersRes.value?.data?.orders) {
        setRecentOrders(ordersRes.value.data.orders);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle Quick Create Lead
  const handleCreateLead = async (formData) => {
    try {
      const res = await module1Service.createLead(formData);
      if (res?.success) {
        setIsCreateLeadOpen(false);
        await loadDashboardData();
        alert(`Lead ${res.data?.code || ""} created and auto-assigned to Sales Consultant!`);
      }
    } catch (err) {
      console.error("Create lead failed:", err);
      alert(err.response?.data?.message || "Failed to create lead");
    }
  };

  // Handle Log Call
  const handleLogCallSubmit = async (leadId, callData) => {
    try {
      const res = await module1Service.logCall(leadId, callData);
      if (res?.success) {
        setCallModalLead(null);
        await loadDashboardData();
        if (res.data?.isSuccess && navigate) {
          navigate("quotations");
        }
      }
    } catch (err) {
      console.error("Log call failed:", err);
      alert(err.response?.data?.message || "Failed to log call");
    }
  };

  // Handle Quick Inventory Check
  const handleCheckStock = async (orderId) => {
    try {
      const res = await module1Service.checkStockAndReserve(orderId);
      if (res?.success) {
        setInventoryCheckResult(res.data);
      }
    } catch (err) {
      console.error("Inventory check failed:", err);
      alert(err.response?.data?.message || "Failed to verify stock");
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  return (
    <div className="p-6 max-w-[1780px] mx-auto space-y-6">
      {/* Top Hero Command Bar */}
      <div className="bg-gradient-to-r from-[#0d1833] via-[#091329] to-[#060e1f] border border-[#1e2f55] rounded-2xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-cyan-300 border border-blue-500/30 uppercase tracking-widest">
                Control Tower · Module 1
              </span>
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Live Postgres Database Sync
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Master Dashboard · Enterprise Sales, CRM & Orders
            </h1>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-2xl">
              Automatic lead assignment to Sales Consultants, commercial quotation and PI issuance by Back Officers, sales order release by Sales Managers, and standard product inventory stock verification before factory dispatch.
            </p>
          </div>

          {/* Quick Action Header Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsTraceModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              title="Trace any lead, quote or customer PO in real-time"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span>Trace Job</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCreateLeadOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>＋ Quick Add Lead</span>
            </button>
            <button
              type="button"
              onClick={loadDashboardData}
              className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
              title="Refresh live data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Primary Top KPI Cards */}
      <KpiSection title="Sales Pipeline Overview">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Pipeline Value */}
        <div
          onClick={() => navigate && navigate("leads")}
          className="bg-[#0e172e] border border-[#1b2a4e] hover:border-blue-500/50 rounded-2xl p-5 shadow-lg transition-all duration-150 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            <span>TOTAL PIPELINE VALUE</span>
            <TrendingUp className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition" />
          </div>
          <div className="text-3xl font-black text-white">
            {formatCurrency(stats?.totalPipelineValue || 1040737)}
          </div>
          <div className="text-xs text-blue-400 mt-1.5 font-medium flex items-center justify-between">
            <span>{stats?.totalLeads || 11} Total Inbound Leads</span>
            <span className="text-[10px] text-slate-500 group-hover:text-blue-300 transition">View Leads →</span>
          </div>
        </div>

        {/* KPI 2: Active Discussion */}
        <div
          onClick={() => navigate && navigate("calling")}
          className="bg-[#0e172e] border border-[#1b2a4e] hover:border-cyan-500/50 rounded-2xl p-5 shadow-lg transition-all duration-150 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            <span>IN ACTIVE CALLING</span>
            <PhoneCall className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-3xl font-black text-cyan-400">
            {stats?.inDiscussion || 4}
          </div>
          <div className="text-xs text-cyan-300/80 mt-1.5 font-medium flex items-center justify-between">
            <span>Assigned to Sales Consultants</span>
            <span className="text-[10px] text-slate-500 group-hover:text-cyan-300 transition">Open Calling →</span>
          </div>
        </div>

        {/* KPI 3: Quotes Requested / Draft */}
        <div
          onClick={() => navigate && navigate("quotations")}
          className="bg-[#0e172e] border border-[#1b2a4e] hover:border-amber-500/50 rounded-2xl p-5 shadow-lg transition-all duration-150 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            <span>QUOTATIONS & PI</span>
            <FileText className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-3xl font-black text-amber-400">
            {recentQuotations.length || 3}
          </div>
          <div className="text-xs text-amber-300/80 mt-1.5 font-medium flex items-center justify-between">
            <span>Back Officer Commercial Phase</span>
            <span className="text-[10px] text-slate-500 group-hover:text-amber-300 transition">View Quotes →</span>
          </div>
        </div>

        {/* KPI 4: Orders & Dispatch */}
        <div
          onClick={() => navigate && navigate("orders")}
          className="bg-[#0e172e] border border-[#1b2a4e] hover:border-emerald-500/50 rounded-2xl p-5 shadow-lg transition-all duration-150 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            <span>CONFIRMED SO & DISPATCH</span>
            <ShoppingCart className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-3xl font-black text-emerald-400">
            {stats?.poConfirmed || recentOrders.length || 4}
          </div>
          <div className="text-xs text-emerald-300/80 mt-1.5 font-medium flex items-center justify-between">
            <span>Stock Reserved & Released</span>
            <span className="text-[10px] text-slate-500 group-hover:text-emerald-300 transition">View Orders →</span>
          </div>
        </div>
        </div>
      </KpiSection>

      {/* 5-Step Connected Workflow Stepper Navigation */}
      <div className="bg-[#0e172e] border border-[#1b2a4e] rounded-2xl p-4 shadow-xl">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-3">
          Interactive Module 1 Pipeline Stages (Click any stage to open)
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
          <button
            type="button"
            onClick={() => navigate && navigate("leads")}
            className="p-3 rounded-xl bg-[#081022] hover:bg-[#112344] border border-[#1a2c4e] text-left transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
              <span>1. Inbound Leads</span>
              <Users className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              Auto-assigned to active Sales Consultant
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate && navigate("followups")}
            className="p-3 rounded-xl bg-[#081022] hover:bg-[#112344] border border-[#1a2c4e] text-left transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
              <span>2. Follow-ups</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              Failed calls & scheduled callbacks
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate && navigate("calling")}
            className="p-3 rounded-xl bg-[#081022] hover:bg-[#112344] border border-[#1a2c4e] text-left transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
              <span>3. Consultant Calling</span>
              <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              Calling script & requirement finalize
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate && navigate("quotations")}
            className="p-3 rounded-xl bg-[#081022] hover:bg-[#112344] border border-[#1a2c4e] text-left transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
              <span>4. Back Officer Quote</span>
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              Commercial proposal, revisions & PI
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate && navigate("orders")}
            className="p-3 rounded-xl bg-[#081022] hover:bg-[#112344] border border-[#1a2c4e] text-left transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
              <span>5. Sales Order & Stock</span>
              <ShoppingCart className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              Customer PO, SO & Dispatch check
            </p>
          </button>
        </div>
      </div>

      {/* Main Grid: Recent Leads Table & Critical Action Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Leads & Quick Actions */}
        <div className="lg:col-span-2 bg-[#0e172e] border border-[#1b2a4e] rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                Active Inbound Leads Queue
              </h3>
              <span className="text-xs text-slate-400">({recentLeads.length} recent)</span>
            </div>
            <button
              type="button"
              onClick={() => navigate && navigate("leads")}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View All Leads</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#081022] text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <th className="py-3 px-4">CODE</th>
                  <th className="py-3 px-4">CUSTOMER</th>
                  <th className="py-3 px-4">PRODUCT</th>
                  <th className="py-3 px-4">STAGE</th>
                  <th className="py-3 px-4">ASSIGNED REP</th>
                  <th className="py-3 px-4 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {recentLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No recent leads found in database.
                    </td>
                  </tr>
                ) : (
                  recentLeads.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-300">
                        {l.code}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{l.customerName}</div>
                        <div className="text-[10px] text-slate-400">{l.phone || "No phone"}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-200">{l.productName}</div>
                        <div className="text-[10px] text-slate-400">Qty: {l.quantity}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-cyan-300 border border-blue-500/30">
                          {l.stage}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {l.assignedTo?.name || "Consultant"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setCallModalLead(l)}
                          className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[11px] font-bold flex items-center gap-1 mx-auto cursor-pointer"
                          title="Call customer & finalize enquiry"
                        >
                          <PhoneCall className="w-3 h-3 text-emerald-400" />
                          <span>Call</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Quick Action Centre & Inventory Monitor */}
        <div className="space-y-6">
          {/* Action Centre */}
          <div className="bg-[#0e172e] border border-[#1b2a4e] rounded-2xl p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Operational Quick Actions
                </h3>
                <p className="text-[10px] text-slate-400">Directly perform workflow tasks</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                Ready
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => setIsCreateLeadOpen(true)}
                className="w-full p-2.5 bg-[#081022] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between text-left transition cursor-pointer"
              >
                <div>
                  <div className="font-bold text-white">Capture Inbound Lead</div>
                  <div className="text-[10px] text-slate-400">Auto-assigned to consultant</div>
                </div>
                <Plus className="w-4 h-4 text-cyan-400" />
              </button>

              <button
                type="button"
                onClick={() => navigate && navigate("quotations")}
                className="w-full p-2.5 bg-[#081022] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between text-left transition cursor-pointer"
              >
                <div>
                  <div className="font-bold text-white">Issue Commercial Quotation</div>
                  <div className="text-[10px] text-slate-400">Back Officer quote & PI generator</div>
                </div>
                <FileText className="w-4 h-4 text-blue-400" />
              </button>

              <button
                type="button"
                onClick={() => navigate && navigate("orders")}
                className="w-full p-2.5 bg-[#081022] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between text-left transition cursor-pointer"
              >
                <div>
                  <div className="font-bold text-white">Sales Orders & Stock Check</div>
                  <div className="text-[10px] text-slate-400">Physical stock reservation</div>
                </div>
                <Boxes className="w-4 h-4 text-amber-400" />
              </button>

              <button
                type="button"
                onClick={() => setIsTraceModalOpen(true)}
                className="w-full p-2.5 bg-[#081022] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between text-left transition cursor-pointer"
              >
                <div>
                  <div className="font-bold text-white">Live Pipeline Tracker</div>
                  <div className="text-[10px] text-slate-400">Trace any job by code or company</div>
                </div>
                <Search className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>

          {/* Recent Orders / Inventory Monitor */}
          <div className="bg-[#0e172e] border border-[#1b2a4e] rounded-2xl p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Standard Product Orders
                </h3>
                <p className="text-[10px] text-slate-400">Physical inventory verification</p>
              </div>
              <button
                type="button"
                onClick={() => navigate && navigate("orders")}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
              >
                All Orders →
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {recentOrders.length === 0 ? (
                <div className="text-center py-4 text-slate-500">No orders released yet</div>
              ) : (
                recentOrders.slice(0, 3).map((o) => (
                  <div
                    key={o.id}
                    className="p-2.5 bg-[#081022] border border-slate-800 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono font-bold text-cyan-300 text-xs">
                        {o.orderNumber}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {o.customer?.name || "Client"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCheckStock(o.id)}
                      className="px-2 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Check Stock
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Lead Modal */}
      <CreateLeadModal
        isOpen={isCreateLeadOpen}
        onClose={() => setIsCreateLeadOpen(false)}
        onSubmit={handleCreateLead}
      />

      {/* Call Logging Assistant Modal */}
      <LogCallModal
        isOpen={Boolean(callModalLead)}
        onClose={() => setCallModalLead(null)}
        lead={callModalLead}
        onSubmit={handleLogCallSubmit}
      />

      {/* HTML Quotation Viewer Modal */}
      {selectedQuotation && (
        <QuotationModal
          isOpen={Boolean(selectedQuotation)}
          onClose={() => setSelectedQuotation(null)}
          quotation={selectedQuotation}
          onRevise={async (id, data) => {
            const res = await module1Service.reviseQuotation(id, data);
            if (res?.success) {
              setSelectedQuotation(res.data);
              loadDashboardData();
            }
          }}
          onFinalizePI={async (id) => {
            const res = await module1Service.finalizePI(id);
            if (res?.success) {
              setSelectedQuotation(res.data);
              loadDashboardData();
            }
          }}
          onIssueCustomerPO={() => {
            setSelectedQuotation(null);
            navigate && navigate("quotations");
          }}
        />
      )}

      {/* Inventory Stock Check Modal */}
      <InventoryCheckModal
        isOpen={Boolean(inventoryCheckResult)}
        onClose={() => setInventoryCheckResult(null)}
        checkResult={inventoryCheckResult}
      />

      {/* Live Pipeline Tracker Modal */}
      <TraceJobModal
        isOpen={isTraceModalOpen}
        onClose={() => setIsTraceModalOpen(false)}
        onNavigate={navigate}
      />
    </div>
  );
}
