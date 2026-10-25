import { useState, useEffect, useCallback, useMemo } from "react";
import { PhoneCall, Trash2, UserPlus, Clock, X, FileText, Calendar, Filter } from "lucide-react";
import Module1KpiCards from "../components/Module1KpiCards";
import Module1TodoWidget from "../components/Module1TodoWidget";
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

  // Fetch pipeline stats
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

  // Debounced search sync
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

  // Zero-latency instant in-memory filtering
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
    <div className="flex flex-col min-h-full space-y-4">
      {/* Mobile-first reordering: In mobile view (order-2 md:order-1), KPIs and FilterBar are below data table */}
      <div className="order-2 md:order-1">
        {/* Color-coded Top KPIs (Total Leads, Call Answered, Call Not Answered, Not Interested, Invalid Number) */}
        <Module1KpiCards stats={stats} leads={leads} loading={loading} />

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
      </div>

      {/* Main Content Area: Data Table on Left (spans across to 2nd last KPI) & To-Do Widget on Right */}
      <div className="order-1 md:order-2 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Data Table Column (Lg: 8 or 9 cols) */}
        <div className="lg:col-span-8 xl:col-span-9 bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <h3 className="text-xs font-black text-slate-900 tracking-wider uppercase">
                Customer Leads & Enquiries Register
              </h3>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
                {displayedLeads.length} {displayedLeads.length === 1 ? "record" : "records"}
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-3 px-3.5">LEAD CODE</th>
                  <th className="py-3 px-3.5">CUSTOMER & PHONE</th>
                  <th className="py-3 px-3.5">PRODUCT & QTY</th>
                  <th className="py-3 px-3.5">SOURCE</th>
                  <th className="py-3 px-3.5">STAGE</th>
                  <th className="py-3 px-3.5">EXPECTED VALUE</th>
                  <th className="py-3 px-3.5">ASSIGNED REP</th>
                  <th className="py-3 px-3.5 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && leads.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3 px-3.5"><div className="h-4 w-16 bg-slate-200 rounded" /></td>
                      <td className="py-3 px-3.5"><div className="h-4 w-32 bg-slate-200 rounded" /><div className="h-3 w-24 bg-slate-100 rounded mt-1" /></td>
                      <td className="py-3 px-3.5"><div className="h-4 w-28 bg-slate-200 rounded" /></td>
                      <td className="py-3 px-3.5"><div className="h-5 w-20 bg-slate-200 rounded-full" /></td>
                      <td className="py-3 px-3.5"><div className="h-5 w-24 bg-slate-200 rounded-full" /></td>
                      <td className="py-3 px-3.5"><div className="h-4 w-20 bg-slate-200 rounded" /></td>
                      <td className="py-3 px-3.5"><div className="h-4 w-24 bg-slate-200 rounded" /></td>
                      <td className="py-3 px-3.5 text-center"><div className="h-6 w-16 bg-slate-200 rounded mx-auto" /></td>
                    </tr>
                  ))
                ) : displayedLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                      No leads found matching your search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  displayedLeads.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. Lead Code & Date */}
                      <td className="py-3 px-3.5">
                        <div className="font-mono font-bold text-blue-700">{l.code}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(l.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </div>
                      </td>

                      {/* 2. Customer & Phone WITH DIRECT QUICK-CALL BUTTON */}
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900 text-xs">{l.customerName}</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-0.5">
                          <span className="font-mono font-semibold text-slate-700">{l.phone || "No phone"}</span>
                          {/* QUICK CALL BUTTON DIRECTLY AT RIGHT OF PHONE NUMBER */}
                          {l.phone && (
                            <button
                              type="button"
                              onClick={() => setCallModalLead(l)}
                              className="inline-flex items-center justify-center p-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border border-emerald-200 transition cursor-pointer shadow-2xs"
                              title={`Direct Call: ${l.phone}`}
                            >
                              <PhoneCall className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 3. Product & Qty */}
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-slate-800">{l.productName || "Product"}</div>
                        <div className="text-[10px] text-slate-500">Qty: {Number(l.quantity || 1).toFixed(0)}</div>
                      </td>

                      {/* 4. Source Badge */}
                      <td className="py-3 px-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {l.source?.replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* 5. Stage Badge */}
                      <td className="py-3 px-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            l.stage === "PO_RECEIVED" || l.stage === "ORDER_CONFIRMED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : l.stage === "QUOTATION_REQUESTED" || l.stage === "QUOTATION_SENT"
                              ? "bg-amber-50 text-amber-800 border-amber-300"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {l.stage?.replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* 6. Expected Value */}
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-800">
                        {Number(l.expectedValue || 0) > 0 ? (
                          new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                            maximumFractionDigits: 0,
                          }).format(Number(l.expectedValue))
                        ) : (
                          <span className="text-amber-600 font-sans text-[11px] font-semibold">To be quoted</span>
                        )}
                      </td>

                      {/* 7. Assigned Rep */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center justify-between gap-1">
                          <div>
                            <div className="text-xs text-slate-900 font-bold">
                              {l.assignedTo?.name || l.assignedByName || "Sales Consultant"}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {l.assignedTo?.role || "SALES_CONSULTANT"}
                            </div>
                          </div>
                          {canReassign && (
                            <button
                              type="button"
                              onClick={() => openReassignModal(l)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                              title="Reassign lead"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 8. Actions */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setCallModalLead(l)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
                            title="Call customer & finalize"
                          >
                            <PhoneCall className="w-3 h-3" />
                            <span>Call</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedLeadDetails(l)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition cursor-pointer"
                          >
                            View
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteLead(l.id, l.code)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
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

        {/* Right Column: Daily To-Do widget (below last 2 KPIs) */}
        <div className="lg:col-span-4 xl:col-span-3">
          <Module1TodoWidget title="Leads Actions" pageType="leads" items={displayedLeads} />
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

      {/* View & Action Lead Details Modal */}
      {selectedLeadDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase">
                  Lead Details: {selectedLeadDetails.code}
                </h3>
                <p className="text-xs text-slate-500 font-medium">{selectedLeadDetails.customerName}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLeadDetails(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Contact Person</span>
                  <span className="font-bold text-slate-900">{selectedLeadDetails.contactName || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Phone Number</span>
                  <span className="font-mono font-bold text-slate-900">{selectedLeadDetails.phone || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Product Requested</span>
                  <span className="font-semibold text-slate-900">{selectedLeadDetails.productName || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Quantity</span>
                  <span className="font-bold text-slate-900">{selectedLeadDetails.quantity || 1} Units</span>
                </div>
              </div>

              {selectedLeadDetails.requirement && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase mb-1">Requirement Notes</span>
                  <p className="text-slate-800 leading-relaxed font-medium">{selectedLeadDetails.requirement}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    const lead = selectedLeadDetails;
                    setSelectedLeadDetails(null);
                    setCallModalLead(lead);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call & Log Outcome</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Lead Modal */}
      {reassignModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 uppercase">
                Reassign Lead: {reassignModalLead.code}
              </h3>
              <button
                type="button"
                onClick={() => setReassignModalLead(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReassignSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Sales Consultant</label>
                <select
                  value={selectedConsultantId}
                  onChange={(e) => setSelectedConsultantId(e.target.value)}
                  className="w-full bg-white text-slate-800 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-2xs"
                >
                  <option value="">Select consultant...</option>
                  {consultantsList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setReassignModalLead(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-2xs"
                >
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
