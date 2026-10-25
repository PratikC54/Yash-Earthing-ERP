import { useState, useEffect, useCallback, useMemo } from "react";
import { Eye, Trash2, FileCheck, ShoppingCart, Plus } from "lucide-react";
import KpiSection from "../../../components/common/KpiSection";
import FilterBar from "../components/FilterBar";
import QuotationModal from "../components/QuotationModal";
import CreateQuotationModal from "../components/CreateQuotationModal";
import CustomerPOModal from "../components/CustomerPOModal";
import Module1TodoWidget from "../components/Module1TodoWidget";
import module1Service from "../services/module1Service";
import { exportToExcel, importFromExcel } from "../utils/excelUtils";

export default function QuotationsPage({ onNavigateToOrders }) {
  const [quotations, setQuotations] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [poModalQuotation, setPoModalQuotation] = useState(null);

  const fetchQuotations = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await module1Service.getQuotations();
      if (res?.success && res?.data?.quotations) {
        setQuotations(res.data.quotations);
      }
    } catch (err) {
      console.error("Failed to load quotations:", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    try {
      const leadsRes = await module1Service.getLeads({ limit: 100 });
      if (leadsRes?.success && leadsRes?.data?.leads) {
        setLeads(leadsRes.data.leads);
      }
    } catch (err) {
      console.warn("Could not load leads for quotation create:", err);
    }
  }, []);

  const fetchData = useCallback(() => {
    fetchQuotations(false);
  }, [fetchQuotations]);

  useEffect(() => {
    fetchQuotations(true);
  }, [fetchQuotations]);

  useEffect(() => {
    if (isCreateModalOpen && leads.length === 0) {
      fetchLeads();
    }
  }, [isCreateModalOpen, leads.length, fetchLeads]);

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

  const handleCreateQuotation = async (formData) => {
    try {
      const res = await module1Service.createQuotation(formData);
      if (res?.success) {
        setIsCreateModalOpen(false);
        fetchData();
        setSelectedQuotation(res.data);
      }
    } catch (err) {
      console.error("Create quotation error:", err);
      alert(err.response?.data?.message || "Failed to create quotation.");
    }
  };

  const handleReviseQuotation = async (id, payload) => {
    try {
      const res = await module1Service.reviseQuotation(id, payload);
      if (res?.success) {
        setSelectedQuotation(res.data);
        fetchData();
      }
    } catch (err) {
      console.error("Revise quotation error:", err);
    }
  };

  const handleFinalizePI = async (id) => {
    try {
      const res = await module1Service.finalizePI(id);
      if (res?.success) {
        setSelectedQuotation(res.data);
        fetchData();
      }
    } catch (err) {
      console.error("Finalize PI error:", err);
    }
  };

  const handleIssueCustomerPOSubmit = async (quotationId, poData) => {
    try {
      const res = await module1Service.recordCustomerPO(quotationId, poData);
      if (res?.success) {
        setPoModalQuotation(null);
        setSelectedQuotation(null);
        fetchData();
        if (onNavigateToOrders) {
          const jump = confirm(
            "Customer PO recorded successfully! Would you like to view Sales Orders now?"
          );
          if (jump) onNavigateToOrders();
        }
      }
    } catch (err) {
      console.error("Issue Customer PO error:", err);
      alert(err.response?.data?.message || "Failed to record Customer Purchase Order.");
    }
  };

  const handleDeleteQuotation = async (id) => {
    if (!confirm("Are you sure you want to delete this quotation?")) return;
    try {
      await module1Service.deleteQuotation(id);
      setSelectedQuotation(null);
      fetchData();
    } catch (err) {
      console.error("Delete quotation error:", err);
    }
  };

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

  const totalValue = quotations.reduce((acc, q) => acc + Number(q.total || 0), 0);
  const piCount = quotations.filter((q) => Boolean(q.proformaInvoiceNumber)).length;
  const poCount = quotations.filter((q) => Boolean(q.customerPONumber)).length;

  return (
    <div className="flex flex-col min-h-full space-y-4">
      {/* Mobile-first reordering: In mobile view (order-2 md:order-1), KPIs and FilterBar are below table */}
      <div className="order-2 md:order-1">
        {/* 4 Light-themed KPI Cards */}
        <KpiSection title="Commercial Quotations & Estimates Overview" className="mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                TOTAL QUOTATIONS
              </div>
              {loading ? (
                <div className="h-8 w-16 bg-slate-200 rounded animate-pulse my-1" />
              ) : (
                <div className="text-2xl sm:text-3xl font-black text-slate-900">{quotations.length}</div>
              )}
              <div className="text-[11px] text-blue-600 font-semibold mt-1">Official commercial estimates</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                TOTAL QUOTED PIPELINE
              </div>
              {loading ? (
                <div className="h-8 w-24 bg-slate-200 rounded animate-pulse my-1" />
              ) : (
                <div className="text-2xl sm:text-3xl font-black text-blue-700">
                  {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
                    totalValue
                  )}
                </div>
              )}
              <div className="text-[11px] text-slate-500 font-medium mt-1">Active commercial value</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                PROFORMA INVOICES (PI)
              </div>
              {loading ? (
                <div className="h-8 w-16 bg-slate-200 rounded animate-pulse my-1" />
              ) : (
                <div className="text-2xl sm:text-3xl font-black text-emerald-700">{piCount}</div>
              )}
              <div className="text-[11px] text-emerald-700 font-semibold mt-1">Accepted & finalized offers</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                CUSTOMER PO RECEIVED
              </div>
              {loading ? (
                <div className="h-8 w-16 bg-slate-200 rounded animate-pulse my-1" />
              ) : (
                <div className="text-2xl sm:text-3xl font-black text-amber-600">{poCount}</div>
              )}
              <div className="text-[11px] text-amber-700 font-semibold mt-1">Ready for Sales Order</div>
            </div>
          </div>
        </KpiSection>

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
      </div>

      {/* Main Content Area: Data Table on Left & To-Do Widget on Right */}
      <div className="order-1 md:order-2 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Table Column (Lg: 8 or 9 cols) */}
        <div className="lg:col-span-8 xl:col-span-9 bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <h3 className="text-xs font-black text-slate-900 tracking-wider uppercase">
                Commercial Quotations & Estimates Register
              </h3>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
                {displayedQuotations.length} {displayedQuotations.length === 1 ? "record" : "records"}
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Issued by Back Officer (BO)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-3 px-3.5">QUOTE NO</th>
                  <th className="py-3 px-3.5">REVISION</th>
                  <th className="py-3 px-3.5">CUSTOMER / CLIENT</th>
                  <th className="py-3 px-3.5">TAXABLE AMOUNT</th>
                  <th className="py-3 px-3.5">GST (18%)</th>
                  <th className="py-3 px-3.5">GRAND TOTAL</th>
                  <th className="py-3 px-3.5">STATUS</th>
                  <th className="py-3 px-3.5">PREPARED BY</th>
                  <th className="py-3 px-3.5 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && quotations.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3 px-3.5"><div className="h-4 w-20 bg-slate-200 rounded" /></td>
                      <td className="py-3 px-3.5"><div className="h-4 w-12 bg-slate-100 rounded" /></td>
                      <td className="py-3 px-3.5"><div className="h-4 w-36 bg-slate-200 rounded" /></td>
                      <td className="py-3 px-3.5"><div className="h-4 w-16 bg-slate-200 rounded" /></td>
                      <td className="py-3 px-3.5"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                      <td className="py-3 px-3.5"><div className="h-4 w-20 bg-slate-200 rounded" /></td>
                      <td className="py-3 px-3.5"><div className="h-5 w-20 bg-slate-200 rounded-full" /></td>
                      <td className="py-3 px-3.5"><div className="h-4 w-24 bg-slate-200 rounded" /></td>
                      <td className="py-3 px-3.5 text-center"><div className="h-6 w-24 bg-slate-200 rounded mx-auto" /></td>
                    </tr>
                  ))
                ) : displayedQuotations.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                      No quotations found matching your search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  displayedQuotations.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3.5 font-mono font-bold text-blue-700">
                        {q.quotationNo}
                        {q.proformaInvoiceNumber && (
                          <div className="text-[10px] text-emerald-700 font-semibold">
                            PI: {q.proformaInvoiceNumber}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3.5 font-mono text-slate-600 font-semibold">Rev-{q.revision || 0}</td>

                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900 text-xs">
                          {q.customer?.name || q.lead?.customerName || "Customer"}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {q.customerPONumber ? `PO: ${q.customerPONumber}` : "No PO yet"}
                        </div>
                      </td>

                      <td className="py-3 px-3.5 font-mono text-slate-700">₹ {Number(q.taxableAmount || q.subtotal).toFixed(2)}</td>

                      <td className="py-3 px-3.5 font-mono text-slate-500">₹ {Number(q.gstAmount || 0).toFixed(2)}</td>

                      <td className="py-3 px-3.5 font-mono font-black text-slate-900 text-xs">
                        ₹ {Number(q.total || 0).toFixed(2)}
                      </td>

                      <td className="py-3 px-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            q.status === "ACCEPTED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : q.status === "SENT"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {q.proformaInvoiceNumber ? "PI FINALIZED" : q.status}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-slate-700">
                        <div className="font-bold text-slate-900 text-xs">{q.preparedBy?.split("(")[0]?.trim() || "Back Officer"}</div>
                        <div className="text-[10px] text-blue-600 font-mono font-medium">
                          {q.preparedBy?.includes("(")
                            ? q.preparedBy.split("(")[1]?.replace(")", "")
                            : "BACK_OFFICER"}
                        </div>
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedQuotation(q)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
                            title="View official HTML estimate & PDF"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteQuotation(q.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Delete quotation"
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

        {/* Right Column: Daily To-Do widget */}
        <div className="lg:col-span-4 xl:col-span-3">
          <Module1TodoWidget title="Quotation Actions" pageType="quotations" items={displayedQuotations} />
        </div>
      </div>

      {/* Official HTML Quotation & PDF Modal */}
      <QuotationModal
        isOpen={Boolean(selectedQuotation)}
        onClose={() => setSelectedQuotation(null)}
        quotation={selectedQuotation}
        onRevise={handleReviseQuotation}
        onFinalizePI={handleFinalizePI}
        onIssueCustomerPO={(qId) => {
          const target = quotations.find((q) => q.id === qId) || selectedQuotation;
          setPoModalQuotation(target);
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
