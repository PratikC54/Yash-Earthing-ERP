import { useState, useEffect, useCallback, useMemo } from "react";
import { PhoneCall, Trash2, UserPlus, Clock, X, FileText } from "lucide-react";
import Module1KpiCards from "../components/Module1KpiCards";
import FilterBar from "../components/FilterBar";
import CreateLeadModal from "../components/CreateLeadModal";
import LogCallModal from "../components/LogCallModal";
import module1Service from "../services/module1Service";
import { useAuth } from "../../auth/useAuth";
import { exportToExcel, importFromExcel } from "../utils/excelUtils";

export default function LeadsPage({ onNavigateToQuotation, globalSearch = "" }) {
  const { user } = useAuth();
  const canReassign = user?.role === "ADMIN" || user?.role === "SALES_MANAGER";

  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(globalSearch || "");
  const [selectedStage, setSelectedStage] = useState("ALL");
  const [selectedSource, setSelectedSource] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL");

  useEffect(() => {
    if (globalSearch !== undefined && globalSearch !== null) {
      setSearchQuery(globalSearch);
    }
  }, [globalSearch]);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [callModalLead, setCallModalLead] = useState(null);
  const [selectedLeadDetails, setSelectedLeadDetails] = useState(null);
  const [reassignModalLead, setReassignModalLead] = useState(null);
  const [selectedConsultantId, setSelectedConsultantId] = useState("");
  const [consultantsList, setConsultantsList] = useState([]);

  // Fetch pipeline stats once (or on mutation), not on every search keystroke
  const fetchStats = useCallback(async () => {
    try {
      const statsRes = await module1Service.getPipelineStats();
      if (statsRes?.success && statsRes?.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.warn("Could not load pipeline stats:", err);
    }
  }, []);

  // Fetch full leads batch
  const fetchLeads = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await module1Service.getLeads({ limit: 150 });
      if (res?.success && res?.data?.leads) {
        setLeads(res.data.leads);
      }
    } catch (err) {
      console.error("Failed to fetch leads data:", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  const fetchData = useCallback(() => {
    fetchLeads(false);
    fetchStats();
  }, [fetchLeads, fetchStats]);

  useEffect(() => {
    fetchLeads(true);
    fetchStats();
  }, [fetchLeads, fetchStats]);

  // Optional background search sync when user searches remotely (debounced)
  useEffect(() => {
    const term = searchQuery.trim();
    if (!term || term.length < 2) return;

    const timer = setTimeout(async () => {
      try {
        const res = await module1Service.getLeads({ search: term, limit: 100 });
        if (res?.success && Array.isArray(res?.data?.leads)) {
          setLeads((prev) => {
            const existingIds = new Set(prev.map((l) => l.id));
            const newRecords = res.data.leads.filter((l) => !existingIds.has(l.id));
            return newRecords.length > 0 ? [...newRecords, ...prev] : prev;
          });
        }
      } catch (err) {
        console.warn("Background lead search:", err);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Zero-latency instant in-memory filtering (0ms)
  const displayedLeads = useMemo(() => {
    let result = leads;

    if (selectedStage && selectedStage !== "ALL") {
      result = result.filter((l) => l.stage === selectedStage);
    }

    if (selectedSource && selectedSource !== "ALL") {
      result = result.filter((l) => l.source === selectedSource);
    }

    if (selectedPriority && selectedPriority !== "ALL") {
      result = result.filter((l) => l.priority === selectedPriority);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((l) =>
        (l.code && l.code.toLowerCase().includes(q)) ||
        (l.customerName && l.customerName.toLowerCase().includes(q)) ||
        (l.contactName && l.contactName.toLowerCase().includes(q)) ||
        (l.phone && l.phone.toLowerCase().includes(q)) ||
        (l.productName && l.productName.toLowerCase().includes(q)) ||
        (l.productSku && l.productSku.toLowerCase().includes(q)) ||
        (l.city && l.city.toLowerCase().includes(q)) ||
        (l.requirement && l.requirement.toLowerCase().includes(q))
      );
    }

    return result;
  }, [leads, selectedStage, selectedSource, selectedPriority, searchQuery]);

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
      <Module1KpiCards stats={stats} loading={loading} />

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
            <span className="text-xs text-slate-400">
              ({displayedLeads.length} {displayedLeads.length === 1 ? 'record' : 'records'})
            </span>
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
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4"><div className="h-4 w-16 bg-slate-200/80 rounded" /><div className="h-3 w-12 bg-slate-200/50 rounded mt-1" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-32 bg-slate-200/80 rounded" /><div className="h-3 w-24 bg-slate-200/50 rounded mt-1" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-28 bg-slate-200/80 rounded" /><div className="h-3 w-16 bg-slate-200/50 rounded mt-1" /></td>
                    <td className="py-3 px-4"><div className="h-5 w-20 bg-slate-200/70 rounded-full" /></td>
                    <td className="py-3 px-4"><div className="h-5 w-24 bg-slate-200/70 rounded-full" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-20 bg-slate-200/80 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-24 bg-slate-200/60 rounded" /></td>
                    <td className="py-3 px-4 text-center"><div className="h-6 w-16 bg-slate-200/60 rounded-lg mx-auto" /></td>
                  </tr>
                ))
              ) : displayedLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No leads found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                displayedLeads.map((l) => (
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-auto text-slate-800 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0c1222] text-[#d4ff00] flex items-center justify-center shadow-xs">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#0f172a]">Lead Details: {selectedLeadDetails.code}</h3>
                  <p className="text-[11px] font-semibold text-slate-500">{selectedLeadDetails.customerName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLeadDetails(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Company</span>
                  <span className="font-bold text-slate-900 text-xs">{selectedLeadDetails.customerName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Contact</span>
                  <span className="font-semibold text-slate-800 text-xs">{selectedLeadDetails.contactName}</span>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">{selectedLeadDetails.phone}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Email</span>
                  <span className="text-slate-700 font-medium">{selectedLeadDetails.email || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Location</span>
                  <span className="text-slate-800 font-medium">{selectedLeadDetails.city || "—"}, {selectedLeadDetails.state || "—"}</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-blue-900 block mb-0.5">Primary Requirement</span>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-900">{selectedLeadDetails.productName}</span>
                  <span className="font-bold font-mono text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md">Total Qty: {selectedLeadDetails.quantity}</span>
                </div>
              </div>

              {/* Items Breakdown if multiple */}
              {selectedLeadDetails.items && selectedLeadDetails.items.length > 0 && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-2 shadow-xs">
                  <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">Detailed Product Line Items:</div>
                  <div className="space-y-1">
                    {selectedLeadDetails.items.map((it, idx) => (
                      <div key={it.id || idx} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0 text-slate-800">
                        <span className="font-medium">• {it.productName || it.product?.name} <span className="text-slate-500 text-[11px]">({it.productSku || it.product?.sku})</span></span>
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">Qty: {it.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Assigned Consultant:</span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {selectedLeadDetails.assignedTo?.name || selectedLeadDetails.assignedByName}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Current Stage:</span>
                  <div className="mt-0.5">
                    <span className="px-2 py-0.5 bg-slate-100 border border-slate-300 text-slate-900 rounded font-bold text-[11px]">
                      {selectedLeadDetails.stage}
                    </span>
                  </div>
                </div>
              </div>

              {selectedLeadDetails.lastActivityNote && (
                <div className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-medium">
                  <span className="font-bold text-slate-900 block mb-0.5">Activity Notes:</span>
                  {selectedLeadDetails.lastActivityNote}
                </div>
              )}

              {/* Previous Call Logs in Detail View */}
              <div className="pt-3 border-t border-slate-200">
                <div className="font-bold text-slate-800 mb-2 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Previous Call Logs ({selectedLeadDetails.callLogs?.length || 0})</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">Call records</span>
                </div>
                {selectedLeadDetails.callLogs && selectedLeadDetails.callLogs.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedLeadDetails.callLogs.map((log) => (
                      <div key={log.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="flex justify-between items-center text-slate-900 font-bold">
                          <span>
                            Outcome:{" "}
                            <span className={log.outcome === "ANSWERED" || log.quoteRequested ? "text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded text-[11px]" : "text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded text-[11px]"}>
                              {log.outcome}
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono font-medium">
                            {new Date(log.loggedAt || log.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {log.discussionHighlights && (
                          <p className="text-slate-700 italic font-medium bg-white p-1.5 rounded border border-slate-200 mt-1">
                            "{log.discussionHighlights}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 italic text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    No calls logged yet for this lead.
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedLeadDetails(null)}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition cursor-pointer text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = selectedLeadDetails;
                  setSelectedLeadDetails(null);
                  setCallModalLead(target);
                }}
                className="px-5 py-2 bg-[#d4ff00] hover:bg-[#bce600] text-black font-black rounded-xl shadow-md transition cursor-pointer text-xs flex items-center gap-1.5"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Log Call Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Reassign Modal */}
      {reassignModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden my-auto text-slate-800 animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0c1222] text-[#d4ff00] flex items-center justify-center shadow-xs">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#0f172a]">Manual Lead Reassignment</h3>
                  <p className="text-[11px] font-semibold text-slate-500">{reassignModalLead.code}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReassignModalLead(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReassignSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 text-xs">{reassignModalLead.code} · {reassignModalLead.customerName}</div>
                <div className="text-[11px] text-slate-600 mt-1">
                  Currently assigned to: <span className="font-bold text-slate-900">{reassignModalLead.assignedTo?.name || reassignModalLead.assignedByName}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5 text-xs">Select New Consultant *</label>
                <select
                  value={selectedConsultantId}
                  onChange={(e) => setSelectedConsultantId(e.target.value)}
                  className="w-full bg-white text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-none focus:border-[#0c1222] shadow-xs"
                  style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
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

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setReassignModalLead(null)}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#d4ff00] hover:bg-[#bce600] text-black font-black rounded-xl shadow-md transition cursor-pointer text-xs"
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
