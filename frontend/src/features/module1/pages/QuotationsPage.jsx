import { useState, useEffect, useCallback } from "react";
import { Eye, Trash2 } from "lucide-react";
import FilterBar from "../components/FilterBar";
import QuotationModal from "../components/QuotationModal";
import CreateQuotationModal from "../components/CreateQuotationModal";
import CustomerPOModal from "../components/CustomerPOModal";
import module1Service from "../services/module1Service";
import { exportToExcel, importFromExcel } from "../utils/excelUtils";

export default function QuotationsPage({ onNavigateToOrders }) {
  const [quotations, setQuotations] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals state
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [poModalQuotation, setPoModalQuotation] = useState(null);

  // Fetch quotations batch
  const fetchQuotations = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const quoteRes = await module1Service.getQuotations({ limit: 150 });
      if (quoteRes?.success && quoteRes?.data?.quotations) {
        setQuotations(quoteRes.data.quotations);
      }
    } catch (err) {
      console.error("Failed to fetch quotations:", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  // Fetch leads for modal dropdown (only needed on mount)
  const fetchLeads = useCallback(async () => {
    try {
      const leadsRes = await module1Service.getLeads({ limit: 100 });
      if (leadsRes?.success && leadsRes?.data?.leads) {
        setLeads(leadsRes.data.leads);
      }
    } catch (err) {
      console.warn("Failed to fetch leads for modal:", err);
    }
  }, []);

  const fetchData = useCallback(() => {
    fetchQuotations(false);
    fetchLeads();
  }, [fetchQuotations, fetchLeads]);

  useEffect(() => {
    fetchQuotations(true);
    fetchLeads();
  }, [fetchQuotations, fetchLeads]);

  // Debounced background sync for remote search if needed
  useEffect(() => {
    const term = searchQuery.trim();
    if (!term || term.length < 2) return;

    const timer = setTimeout(async () => {
      try {
        const res = await module1Service.getQuotations({ search: term });
        if (res?.success && Array.isArray(res?.data?.quotations)) {
          setQuotations((prev) => {
            const existingIds = new Set(prev.map((q) => q.id));
            const newRecords = res.data.quotations.filter((q) => !existingIds.has(q.id));
            return newRecords.length > 0 ? [...newRecords, ...prev] : prev;
          });
        }
      } catch (err) {
        console.warn("Background quotation search:", err);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Zero-latency instant in-memory filtering (0ms)
  const displayedQuotations = useMemo(() => {
    let result = quotations;

    if (statusFilter && statusFilter !== "ALL") {
      result = result.filter((q) => q.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((item) =>
        (item.quotationNo && item.quotationNo.toLowerCase().includes(q)) ||
        (item.proformaInvoiceNumber && item.proformaInvoiceNumber.toLowerCase().includes(q)) ||
        (item.customerPONumber && item.customerPONumber.toLowerCase().includes(q)) ||
        (item.customer?.name && item.customer.name.toLowerCase().includes(q)) ||
        (item.lead?.customerName && item.lead.customerName.toLowerCase().includes(q)) ||
        (item.lead?.contactName && item.lead.contactName.toLowerCase().includes(q))
      );
    }

    return result;
  }, [quotations, statusFilter, searchQuery]);

  // Create Quotation (Back Officer action)
  const handleCreateQuotation = async (formData) => {
    try {
      const res = await module1Service.createQuotation(formData);
      if (res?.success) {
        setIsCreateModalOpen(false);
        fetchData();
        // Automatically open the generated quotation in HTML viewer!
        setSelectedQuotation(res.data);
      }
    } catch (err) {
      console.error("Create quotation failed:", err);
      const friendlyMsg =
        err.response?.data?.message ||
        "Failed to prepare quotation. Please verify that this lead does not already have an active quotation.";
      alert(friendlyMsg);
    }
  };

  // Revise Quotation (Client Negotiation)
  const handleReviseQuotation = async (id, negotiationData) => {
    try {
      const res = await module1Service.reviseQuotation(id, negotiationData);
      if (res?.success) {
        fetchData();
        setSelectedQuotation(res.data);
        alert(res.message || "Quotation revised successfully with negotiated terms.");
      }
    } catch (err) {
      console.error("Revise quotation failed:", err);
      alert(err.response?.data?.message || "Failed to revise quotation. Please check the values entered.");
    }
  };

  // Finalize as Proforma Invoice (PI)
  const handleFinalizePI = async (id) => {
    try {
      const res = await module1Service.finalizeProformaInvoice(id);
      if (res?.success) {
        fetchData();
        setSelectedQuotation(res.data);
        alert(res.message || "Quotation confirmed and finalized as Proforma Invoice (PI).");
      }
    } catch (err) {
      console.error("Finalize PI failed:", err);
      alert(err.response?.data?.message || "Failed to finalize Proforma Invoice.");
    }
  };

  // Issue Customer PO
  const handleIssueCustomerPOSubmit = async (quotationId, poData) => {
    try {
      const res = await module1Service.issueCustomerPO(quotationId, poData);
      if (res?.success) {
        setPoModalQuotation(null);
        if (selectedQuotation?.id === quotationId) {
          setSelectedQuotation(res.data);
        }
        fetchData();
        if (onNavigateToOrders) {
          const jump = confirm(
            "Customer PO recorded successfully! Would you like to view Sales Orders & Invoicing now?"
          );
          if (jump) onNavigateToOrders();
        }
      }
    } catch (err) {
      console.error("Issue Customer PO error:", err);
      alert(err.response?.data?.message || "Failed to record Customer Purchase Order.");
    }
  };

  // Delete Quotation
  const handleDeleteQuotation = async (id) => {
    if (!confirm("Are you sure you want to delete this quotation?")) return;
    try {
      await module1Service.deleteQuotation(id);
      setSelectedQuotation(null);
      fetchQuotationsAndLeads();
    } catch (err) {
      console.error("Delete quotation error:", err);
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    const exportData = quotations.map((q) => ({
      "Quote No": q.quotationNo,
      Revision: `Rev-${q.revision || 0}`,
      Customer: q.customer?.name || q.lead?.customerName || "",
      Status: q.status,
      "PI Number": q.proformaInvoiceNumber || "",
      "Customer PO": q.customerPONumber || "",
      "Subtotal (INR)": Number(q.subtotal || 0),
      "Discount (INR)": Number(q.discountAmount || 0),
      "Taxable (INR)": Number(q.taxableAmount || 0),
      "GST (INR)": Number(q.gstAmount || 0),
      "Total (INR)": Number(q.total || 0),
      "Prepared By": q.preparedBy || "Back Officer",
      Date: new Date(q.createdAt).toLocaleDateString(),
    }));
    exportToExcel(exportData, "Yash_Quotations_Register", "Quotations");
  };

  const handleImportExcel = (file) => {
    importFromExcel(file, (data) => {
      alert(`Imported ${data.length} quotations. (Demo simulation)`);
    });
  };

  // Stats
  const totalValue = quotations.reduce((acc, q) => acc + Number(q.total || 0), 0);
  const piCount = quotations.filter((q) => Boolean(q.proformaInvoiceNumber)).length;
  const poCount = quotations.filter((q) => Boolean(q.customerPONumber)).length;

  return (
    <div className="min-h-full">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            TOTAL QUOTATIONS ISSUED
          </div>
          {loading ? (
            <div className="h-8 w-16 bg-slate-200/80 rounded animate-pulse my-1" />
          ) : (
            <div className="text-3xl font-black text-white">{quotations.length}</div>
          )}
          {loading ? (
            <div className="h-3 w-32 bg-slate-200/60 rounded animate-pulse mt-1" />
          ) : (
            <div className="text-xs text-blue-400 mt-1">Official commercial estimates</div>
          )}
        </div>

        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            TOTAL QUOTED VALUE
          </div>
          {loading ? (
            <div className="h-8 w-24 bg-slate-200/80 rounded animate-pulse my-1" />
          ) : (
            <div className="text-3xl font-black text-cyan-400">
              {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
                totalValue
              )}
            </div>
          )}
          {loading ? (
            <div className="h-3 w-32 bg-slate-200/60 rounded animate-pulse mt-1" />
          ) : (
            <div className="text-xs text-cyan-400/80 mt-1">Active commercial pipeline</div>
          )}
        </div>

        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            PROFORMA INVOICES (PI)
          </div>
          {loading ? (
            <div className="h-8 w-16 bg-slate-200/80 rounded animate-pulse my-1" />
          ) : (
            <div className="text-3xl font-black text-emerald-400">{piCount}</div>
          )}
          {loading ? (
            <div className="h-3 w-32 bg-slate-200/60 rounded animate-pulse mt-1" />
          ) : (
            <div className="text-xs text-emerald-400/80 mt-1">Accepted & finalized offers</div>
          )}
        </div>

        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            CUSTOMER PO RECEIVED
          </div>
          {loading ? (
            <div className="h-8 w-16 bg-slate-200/80 rounded animate-pulse my-1" />
          ) : (
            <div className="text-3xl font-black text-amber-400">{poCount}</div>
          )}
          {loading ? (
            <div className="h-3 w-32 bg-slate-200/60 rounded animate-pulse mt-1" />
          ) : (
            <div className="text-xs text-amber-400/80 mt-1">Ready for Sales Order release</div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search quotations by quote no, customer, PI..."
        filters={[
          {
            id: "status",
            value: statusFilter,
            options: [
              { value: "ALL", label: "All Statuses" },
              { value: "DRAFT", label: "Draft" },
              { value: "SENT", label: "Sent to Client" },
              { value: "ACCEPTED", label: "Accepted / PI" },
              { value: "REJECTED", label: "Rejected" },
            ],
          },
        ]}
        onFilterChange={(_, val) => setStatusFilter(val)}
        onExportExcel={handleExportExcel}
        onImportExcel={handleImportExcel}
        primaryActionLabel="Issue Quotation"
        onPrimaryAction={() => setIsCreateModalOpen(true)}
      />

      {/* Table Card */}
      <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">
            Commercial Quotations & Estimates Register
          </h3>
          <span className="text-xs text-slate-400">Issued by Back Officer (BO)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0b1329] text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <th className="py-3 px-4">QUOTE NO</th>
                <th className="py-3 px-4">REVISION</th>
                <th className="py-3 px-4">CUSTOMER / CLIENT</th>
                <th className="py-3 px-4">SUBTOTAL</th>
                <th className="py-3 px-4">GST (18%)</th>
                <th className="py-3 px-4">GRAND TOTAL</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4">PREPARED BY</th>
                <th className="py-3 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading && quotations.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4"><div className="h-4 w-20 bg-slate-200/80 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-12 bg-slate-200/60 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-36 bg-slate-200/80 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-16 bg-slate-200/70 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-16 bg-slate-200/70 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-20 bg-slate-200/80 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-5 w-20 bg-slate-200/70 rounded-full" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-24 bg-slate-200/60 rounded" /></td>
                    <td className="py-3 px-4 text-center"><div className="h-6 w-24 bg-slate-200/60 rounded-lg mx-auto" /></td>
                  </tr>
                ))
              ) : displayedQuotations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500">
                    No quotations found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                displayedQuotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-300">
                      {q.quotationNo}
                      {q.proformaInvoiceNumber && (
                        <div className="text-[10px] text-emerald-400 font-semibold">
                          PI: {q.proformaInvoiceNumber}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">Rev-{q.revision || 0}</td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-xs">
                        {q.customer?.name || q.lead?.customerName || "Customer"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {q.customerPONumber ? `PO: ${q.customerPONumber}` : "No PO yet"}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono">₹ {Number(q.taxableAmount || q.subtotal).toFixed(2)}</td>

                    <td className="py-3 px-4 font-mono text-slate-400">₹ {Number(q.gstAmount || 0).toFixed(2)}</td>

                    <td className="py-3 px-4 font-mono font-bold text-white text-xs">
                      ₹ {Number(q.total || 0).toFixed(2)}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          q.status === "ACCEPTED"
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                            : q.status === "SENT"
                            ? "bg-blue-500/10 text-blue-300 border-blue-500/30"
                            : "bg-slate-800 text-slate-300 border-slate-700"
                        }`}
                      >
                        {q.proformaInvoiceNumber ? "PI FINALIZED" : q.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      <div className="font-semibold text-white">{q.preparedBy?.split("(")[0]?.trim() || "Back Officer"}</div>
                      <div className="text-[10px] text-cyan-400 font-mono">
                        {q.preparedBy?.includes("(")
                          ? q.preparedBy.split("(")[1]?.replace(")", "")
                          : "BACK_OFFICER"}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* HTML View / Estimate Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedQuotation(q)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-cyan-300 border border-blue-500/40 rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Estimate</span>
                        </button>

                        {/* Customer PO Button */}
                        {!q.customerPONumber && (
                          <button
                            type="button"
                            onClick={() => setPoModalQuotation(q)}
                            className="px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-semibold transition cursor-pointer"
                            title="Record Customer Purchase Order"
                          >
                            + PO
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteQuotation(q.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
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

      {/* Quotation HTML Viewer & Stepper Modal (Matching Image 2) */}
      <QuotationModal
        isOpen={Boolean(selectedQuotation)}
        onClose={() => setSelectedQuotation(null)}
        quotation={selectedQuotation}
        onRevise={handleReviseQuotation}
        onFinalizePI={handleFinalizePI}
        onIssueCustomerPO={(quoteId) => {
          const q = quotations.find((it) => it.id === quoteId) || selectedQuotation;
          setPoModalQuotation(q);
        }}
        onDelete={handleDeleteQuotation}
      />

      {/* Create Quotation Modal */}
      <CreateQuotationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        leads={leads}
        onSubmit={handleCreateQuotation}
      />

      {/* Customer PO Modal */}
      <CustomerPOModal
        isOpen={Boolean(poModalQuotation)}
        onClose={() => setPoModalQuotation(null)}
        quotation={poModalQuotation}
        onSubmit={handleIssueCustomerPOSubmit}
      />
    </div>
  );
}
