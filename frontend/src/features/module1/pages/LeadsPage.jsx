import { useState, useEffect, useCallback } from "react";
import { PhoneCall, Trash2, UserPlus, Clock } from "lucide-react";
import Module1KpiCards from "../components/Module1KpiCards";
import FilterBar from "../components/FilterBar";
import CreateLeadModal from "../components/CreateLeadModal";
import LogCallModal from "../components/LogCallModal";
import module1Service from "../services/module1Service";
import { useAuth } from "../../auth/useAuth";
import { exportToExcel, importFromExcel } from "../utils/excelUtils";

export default function LeadsPage({ onNavigateToQuotation }) {
  const { user } = useAuth();
  const canReassign = user?.role === "ADMIN" || user?.role === "SALES_MANAGER";

  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState("ALL");
  const [selectedSource, setSelectedSource] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [callModalLead, setCallModalLead] = useState(null);
  const [selectedLeadDetails, setSelectedLeadDetails] = useState(null);
  const [reassignModalLead, setReassignModalLead] = useState(null);
  const [selectedConsultantId, setSelectedConsultantId] = useState("");
  const [consultantsList, setConsultantsList] = useState([]);

  // Fetch leads and pipeline stats from backend
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, statsRes] = await Promise.allSettled([
        module1Service.getLeads({
          search: searchQuery,
          stage: selectedStage,
          source: selectedSource,
          priority: selectedPriority,
          limit: 100,
        }),
        module1Service.getPipelineStats(),
      ]);

      if (leadsRes.status === "fulfilled" && leadsRes.value?.success && leadsRes.value?.data?.leads) {
        setLeads(leadsRes.value.data.leads);
      }
      if (statsRes.status === "fulfilled" && statsRes.value?.success && statsRes.value?.data) {
        setStats(statsRes.value.data);
      }
    } catch (err) {
      console.error("Failed to fetch leads data:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedStage, selectedSource, selectedPriority]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Create Lead
  const handleCreateLead = async (formData) => {
    try {
      const res = await module1Service.createLead(formData);
      if (res?.success) {
        setIsCreateModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error("Create lead failed:", err);
      alert(err.response?.data?.message || "Failed to create lead");
    }
  };

  // Handle Log Call & Finalize enquiry
  const handleLogCallSubmit = async (leadId, callData) => {
    try {
      const res = await module1Service.logCall(leadId, callData);
      if (res?.success) {
        setCallModalLead(null);
        fetchData();
        if (res.data?.isSuccess && onNavigateToQuotation) {
          // If finalized, offer to jump directly to Quotations page
          const jump = confirm(
            "Call succeeded! Enquiry has been finalized and handed over to Back Officer. Would you like to view Quotations & Estimates now?"
          );
          if (jump) onNavigateToQuotation();
        }
      }
    } catch (err) {
      console.error("Log call failed:", err);
      alert(err.response?.data?.message || "Failed to log call");
    }
  };

  // Handle Manual Reassign Lead
  const openReassignModal = async (lead) => {
    setReassignModalLead(lead);
    setSelectedConsultantId(String(lead.assignedToId || ""));
    try {
      const res = await module1Service.getConsultants();
      if (res?.success && res.data?.users) {
        setConsultantsList(res.data.users);
      }
    } catch {
      // Fallback consultants list
      setConsultantsList([
        { id: 6, name: "Pratik Senapati", role: "SALES_CONSULTANT" },
        { id: 9, name: "Sales Consultant 2", role: "SALES_CONSULTANT" },
        { id: 2, name: "Pratik Senapati (Mgr)", role: "SALES_MANAGER" },
      ]);
    }
  };

  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!reassignModalLead || !selectedConsultantId) return;
    try {
      const chosen = consultantsList.find((c) => String(c.id) === String(selectedConsultantId));
      const res = await module1Service.reassignLead(reassignModalLead.id, {
        assignedToId: Number(selectedConsultantId),
        assignedByName: chosen?.name,
      });
      if (res?.success) {
        alert(res.message || "Lead successfully reassigned!");
        setReassignModalLead(null);
        fetchData();
      }
    } catch (err) {
      console.error("Reassign failed:", err);
      alert(err.response?.data?.message || "Failed to reassign lead");
    }
  };

  // Handle Delete Lead
  const handleDeleteLead = async (id, code) => {
    if (!confirm(`Are you sure you want to delete lead ${code}?`)) return;
    try {
      await module1Service.deleteLead(id);
      fetchData();
    } catch (err) {
      console.error("Delete lead failed:", err);
    }
  };

  // Handle Export to Excel
  const handleExportExcel = () => {
    const exportData = leads.map((l) => ({
      "Lead Code": l.code,
      "Customer / Company": l.customerName,
      "Contact Person": l.contactName || "",
      Phone: l.phone || "",
      Email: l.email || "",
      City: l.city || "",
      State: l.state || "",
      Product: l.productName || "",
      Quantity: l.quantity || 1,
      "Expected Value (INR)": Number(l.expectedValue || 0),
      Source: l.source,
      Stage: l.stage,
      Priority: l.priority,
      "Assigned Consultant": l.assignedTo?.name || l.assignedByName || "Unassigned",
      Created: new Date(l.createdAt).toLocaleDateString(),
    }));
    exportToExcel(exportData, "Yash_Leads_Register", "Leads");
  };

  // Handle Import from Excel
  const handleImportExcel = (file) => {
    importFromExcel(
      file,
      async (importedData) => {
        try {
          const res = await module1Service.bulkImportLeads(importedData);
          if (res?.success) {
            alert(res.message);
            fetchData();
          }
        } catch (err) {
          console.error("Import leads error:", err);
          alert("Failed to import leads from Excel file.");
        }
      },
      (err) => alert("Invalid Excel file format: " + err.message)
    );
  };

  // Filter configuration
  const filterConfigs = [
    {
      id: "stage",
      value: selectedStage,
      options: [
        { value: "ALL", label: "All Stages" },
        { value: "NEW", label: "New Leads" },
        { value: "CONTACTED", label: "Contacted" },
        { value: "QUALIFIED", label: "Qualified" },
        { value: "REQUIREMENT_CAPTURED", label: "Requirement Captured" },
        { value: "QUOTATION_DRAFT", label: "Quote Draft" },
        { value: "QUOTATION_SENT", label: "Quote Sent" },
        { value: "NEGOTIATION", label: "Negotiation" },
        { value: "PO_RECEIVED", label: "PO Received" },
        { value: "CONVERTED", label: "Converted / Closed" },
        { value: "LOST", label: "Lost" },
      ],
    },
    {
      id: "source",
      value: selectedSource,
      options: [
        { value: "ALL", label: "All Sources" },
        { value: "INDIAN_MART", label: "IndiaMART" },
        { value: "TRADE_INDIA", label: "TradeIndia" },
        { value: "EXPORT_INDIA", label: "ExportIndia" },
        { value: "JUSTDIAL", label: "Justdial" },
        { value: "GOOGLE_ADS", label: "Google Ads" },
        { value: "META_ADS", label: "Meta Ads" },
        { value: "WEBSITE", label: "Website" },
        { value: "MANUAL", label: "Manual" },
      ],
    },
    {
      id: "priority",
      value: selectedPriority,
      options: [
        { value: "ALL", label: "All Priorities" },
        { value: "CRITICAL", label: "Critical" },
        { value: "HIGH", label: "High" },
        { value: "MEDIUM", label: "Medium" },
        { value: "LOW", label: "Low" },
      ],
    },
  ];

  const handleFilterChange = (id, val) => {
    if (id === "stage") setSelectedStage(val);
    if (id === "source") setSelectedSource(val);
    if (id === "priority") setSelectedPriority(val);
  };

  return (
    <div className="min-h-full">
      {/* 4 Top KPI Cards */}
      <Module1KpiCards stats={stats} />

      {/* Filter and Search Bar with Import/Export Excel */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search customer, code, phone, product..."
        filters={filterConfigs}
        onFilterChange={handleFilterChange}
        onExportExcel={handleExportExcel}
        onImportExcel={handleImportExcel}
        primaryActionLabel="Add Lead"
        onPrimaryAction={() => setIsCreateModalOpen(true)}
      />

      {/* Main Table Card */}
      <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <h3 className="text-sm font-bold text-white tracking-wide uppercase">
              Sales & CRM Pipeline · Leads & Enquiries
            </h3>
            <span className="text-xs text-slate-400">({leads.length} records)</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Database Sync
          </span>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0b1329] text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <th className="py-3 px-4">LEAD CODE</th>
                <th className="py-3 px-4">CUSTOMER / COMPANY</th>
                <th className="py-3 px-4">PRODUCT & QTY</th>
                <th className="py-3 px-4">SOURCE</th>
                <th className="py-3 px-4">STAGE</th>
                <th className="py-3 px-4">EXPECTED VALUE</th>
                <th className="py-3 px-4">ASSIGNED REP</th>
                <th className="py-3 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading && leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Loading inbound leads pipeline...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No leads found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                leads.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/40 transition">
                    {/* 1. Lead Code & Date */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-cyan-300">{l.code}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(l.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </div>
                    </td>

                    {/* 2. Customer / Company */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-xs">{l.customerName}</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <span className="font-mono text-slate-300">{l.phone || "No phone"}</span>
                      </div>
                    </td>

                    {/* 3. Product & Qty */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{l.productName || "Product"}</div>
                      <div className="text-[10px] text-slate-400">Qty: {Number(l.quantity || 1).toFixed(2)}</div>
                    </td>

                    {/* 4. Source Badge */}
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {l.source?.replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* 5. Stage Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          l.stage === "PO_RECEIVED" || l.stage === "ORDER_CONFIRMED"
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                            : l.stage === "QUOTATION_REQUESTED" || l.stage === "QUOTATION_SENT"
                            ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                            : "bg-blue-500/10 text-blue-300 border-blue-500/30"
                        }`}
                      >
                        {l.stage?.replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* 6. Expected Value */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-200">
                      {Number(l.expectedValue || 0) > 0 ? (
                        new Intl.NumberFormat("en-IN", {
                          style: "currency",
                          currency: "INR",
                          maximumFractionDigits: 0,
                        }).format(Number(l.expectedValue))
                      ) : (
                        <span className="text-amber-400 text-[11px]">To be quoted</span>
                      )}
                    </td>

                    {/* 7. Assigned Rep */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-between gap-1">
                        <div>
                          <div className="text-xs text-white font-medium">
                            {l.assignedTo?.name || l.assignedByName || "Sales Consultant"}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {l.assignedTo?.role || "SALES_CONSULTANT"}
                          </div>
                        </div>
                        {canReassign && (
                          <button
                            type="button"
                            onClick={() => openReassignModal(l)}
                            className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition cursor-pointer"
                            title="Manually reassign lead (Admin / Sales Manager only)"
                          >
                            <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* 8. Actions (Call, View & Action, Delete) */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Quick Call Button */}
                        <button
                          type="button"
                          onClick={() => setCallModalLead(l)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition cursor-pointer"
                          title="Call customer and finalize enquiry"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </button>

                        {/* View & Action Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedLeadDetails(l)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
                        >
                          View & Action
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteLead(l.id, l.code)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Lead Modal */}
      <CreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateLead}
      />

      {/* Log Call Modal */}
      <LogCallModal
        isOpen={Boolean(callModalLead)}
        onClose={() => setCallModalLead(null)}
        lead={callModalLead}
        onSubmit={handleLogCallSubmit}
      />

      {/* Lead Details Drawer / Modal */}
      {selectedLeadDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#10182f] border border-[#1e2a4a] w-full max-w-lg rounded-2xl p-6 text-xs text-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Lead Details: {selectedLeadDetails.code}</h3>
              <button
                type="button"
                onClick={() => setSelectedLeadDetails(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              <div><b>Company:</b> {selectedLeadDetails.customerName}</div>
              <div><b>Contact:</b> {selectedLeadDetails.contactName} ({selectedLeadDetails.phone})</div>
              <div><b>Email:</b> {selectedLeadDetails.email || "N/A"}</div>
              <div><b>Location:</b> {selectedLeadDetails.city}, {selectedLeadDetails.state}</div>
              <div><b>Product Requirement:</b> {selectedLeadDetails.productName} (Total Qty: {selectedLeadDetails.quantity})</div>

              {/* Items Breakdown if multiple */}
              {selectedLeadDetails.items && selectedLeadDetails.items.length > 0 && (
                <div className="p-2.5 bg-[#0a1226] rounded-xl border border-slate-800 text-[11px] space-y-1">
                  <div className="font-bold text-slate-300">Detailed Product Line Items:</div>
                  {selectedLeadDetails.items.map((it, idx) => (
                    <div key={it.id || idx} className="flex justify-between text-slate-300">
                      <span>• {it.productName || it.product?.name} ({it.productSku || it.product?.sku})</span>
                      <span className="font-mono font-bold text-cyan-300">Qty: {it.quantity}</span>
                    </div>
                  ))}
                </div>
              )}

              <div><b>Assigned Consultant:</b> {selectedLeadDetails.assignedTo?.name || selectedLeadDetails.assignedByName} ({selectedLeadDetails.assignedTo?.role || "SALES_CONSULTANT"})</div>
              <div><b>Current Stage:</b> {selectedLeadDetails.stage}</div>
              <div><b>Activity Notes:</b> {selectedLeadDetails.lastActivityNote || "No notes yet"}</div>

              {/* Previous Call Logs in Detail View */}
              <div className="mt-3 pt-3 border-t border-slate-800">
                <div className="font-bold text-cyan-400 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Previous Call Logs ({selectedLeadDetails.callLogs?.length || 0})</span>
                </div>
                {selectedLeadDetails.callLogs && selectedLeadDetails.callLogs.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {selectedLeadDetails.callLogs.map((log) => (
                      <div key={log.id} className="p-2 bg-[#081024] rounded-lg border border-slate-800 text-[11px]">
                        <div className="flex justify-between text-white font-medium">
                          <span>Outcome: <b className={log.outcome === "ANSWERED" || log.quoteRequested ? "text-emerald-400" : "text-amber-400"}>{log.outcome}</b></span>
                          <span className="text-[10px] text-slate-400">{new Date(log.loggedAt || log.createdAt).toLocaleDateString()}</span>
                        </div>
                        {log.discussionHighlights && <p className="text-slate-300 italic mt-0.5">"{log.discussionHighlights}"</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 italic text-[11px]">No calls logged yet for this lead.</div>
                )}
              </div>
            </div>
            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const target = selectedLeadDetails;
                  setSelectedLeadDetails(null);
                  setCallModalLead(target);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
              >
                Log Call Now
              </button>
              <button
                type="button"
                onClick={() => setSelectedLeadDetails(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Manual Reassign Modal */}
      {reassignModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#10182f] border border-[#1e2a4a] w-full max-w-md rounded-2xl p-6 text-xs text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Manual Lead Reassignment</h3>
              <button
                type="button"
                onClick={() => setReassignModalLead(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleReassignSubmit} className="space-y-4 mt-4">
              <div className="p-3 bg-[#0a1226] rounded-xl border border-slate-800">
                <div className="font-semibold text-white">{reassignModalLead.code} · {reassignModalLead.customerName}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Currently assigned to: <span className="text-cyan-300 font-semibold">{reassignModalLead.assignedTo?.name || reassignModalLead.assignedByName}</span></div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select New Consultant *</label>
                <select
                  value={selectedConsultantId}
                  onChange={(e) => setSelectedConsultantId(e.target.value)}
                  className="w-full bg-[#081022] text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Choose User --</option>
                  {consultantsList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReassignModalLead(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-md"
                >
                  Reassign Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
