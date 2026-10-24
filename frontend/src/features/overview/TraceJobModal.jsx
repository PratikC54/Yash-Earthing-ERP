import { useState } from "react";
import { X, Search, CheckCircle2, Clock, AlertTriangle, ShieldCheck, FileText, ShoppingCart, UserCheck, PackageCheck } from "lucide-react";
import module1Service from "../services/module1Service";

export default function TraceJobModal({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState("LD-261022-001");
  const [loading, setLoading] = useState(false);
  const [traceResult, setTraceResult] = useState(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setTraceResult(null);

    try {
      // Find matching lead
      const res = await module1Service.getLeads({ search: query.trim(), limit: 1 });
      const foundLead = res?.data?.leads?.[0];

      if (foundLead) {
        // Fetch detailed lead with quotations
        const detailRes = await module1Service.getLeadById(foundLead.id);
        setTraceResult(detailRes?.data || foundLead);
      } else {
        // Also check quotations
        const quotesRes = await module1Service.getQuotations({ search: query.trim(), limit: 1 });
        const foundQuote = quotesRes?.data?.quotations?.[0];
        if (foundQuote) {
          setTraceResult({
            isQuotationResult: true,
            quotation: foundQuote,
          });
        } else {
          setError(`No active record found for "${query}". Try searching "LD-261022-001" or customer name.`);
        }
      }
    } catch (err) {
      console.error("Trace search failed:", err);
      setError("Failed to trace enquiry. Please verify the code.");
    } finally {
      setLoading(false);
    }
  };

  const lead = traceResult?.isQuotationResult ? traceResult.quotation?.lead : traceResult;
  const quote = traceResult?.isQuotationResult ? traceResult.quotation : traceResult?.quotations?.[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh] text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-lime-100 text-lime-800 border border-lime-300 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Live Pipeline Job Tracker</h2>
              <p className="text-[11px] text-slate-600 font-medium">
                Trace any customer order, lead code or quotation across Module 1
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 pb-2 shrink-0">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter Lead Code (e.g. LD-261022-001) or customer name..."
                className="w-full bg-slate-50 text-slate-900 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:bg-white focus:ring-2 focus:ring-lime-400 focus:border-slate-900 transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-[#d4ff00] hover:bg-[#c2ed00] disabled:opacity-50 text-black text-xs font-black rounded-xl border border-lime-400 shadow-xs transition cursor-pointer"
            >
              {loading ? "Searching..." : "Trace Now"}
            </button>
          </form>

          {error && (
            <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Trace Content */}
        <div className="p-6 pt-2 overflow-y-auto space-y-5 text-xs">
          {traceResult ? (
            <div className="space-y-4">
              {/* Record Summary Banner */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider block">
                      Tracked Entity: {lead?.code || quote?.quotationNo || "Active Job"}
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">
                      {lead?.customerName || quote?.customer?.name || "Client Enquiry"}
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider">
                    {lead?.stage || quote?.status || "IN_PROGRESS"}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-slate-500 block font-medium">Product:</span>
                    <span className="text-slate-900 font-bold">{lead?.productName || "GI Earthing System"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Quantity:</span>
                    <span className="text-slate-900 font-bold">{lead?.quantity || 1} units</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Assigned Consultant:</span>
                    <span className="text-blue-800 font-bold">{lead?.assignedTo?.name || "Rukhsar Shaikh"}</span>
                  </div>
                </div>
              </div>

              {/* 5-Step Visual Stepper */}
              <div className="space-y-3">
                <div className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">
                  Workflow Progression
                </div>

                <div className="space-y-2.5">
                  {/* Step 1: Inbound Lead */}
                  <div className="p-3 bg-emerald-50/70 border border-emerald-300/80 rounded-xl flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900">1. Inbound Lead Captured</span>
                        <span className="text-[10px] text-emerald-800 font-bold">Completed</span>
                      </div>
                      <p className="text-slate-700 text-[11px] mt-0.5">
                        Inbound source <b className="text-slate-900">{lead?.source || "INDIAMART"}</b>. Auto-assigned to Consultant <b className="text-slate-900">{lead?.assignedTo?.name || "Pratik Senapati"}</b>.
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Qualification & Finalization */}
                  <div className={`p-3 rounded-xl border flex items-start gap-3 ${
                    lead?.stage !== "NEW"
                      ? "bg-emerald-50/70 border-emerald-300/80"
                      : "bg-amber-50/70 border-amber-300/80"
                  }`}>
                    {lead?.stage !== "NEW" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900">2. Consultant Contact & Enquiry Finalization</span>
                        <span className={`text-[10px] font-bold ${lead?.stage !== "NEW" ? "text-emerald-800" : "text-amber-800"}`}>
                          {lead?.stage !== "NEW" ? "Requirement Captured" : "Call in Progress"}
                        </span>
                      </div>
                      <p className="text-slate-700 text-[11px] mt-0.5">
                        {lead?.lastActivityNote || "Consultant connecting with client to finalize product specs & quantities."}
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Back Officer Quotation */}
                  <div className={`p-3 rounded-xl border flex items-start gap-3 ${
                    quote
                      ? "bg-emerald-50/70 border-emerald-300/80"
                      : "bg-slate-50 border-slate-200"
                  }`}>
                    {quote ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900">3. Commercial Quotation (Back Officer)</span>
                        <span className="text-[10px] text-blue-700 font-bold font-mono">
                          {quote ? quote.quotationNo : "Awaiting Finalization"}
                        </span>
                      </div>
                      <p className="text-slate-700 text-[11px] mt-0.5">
                        {quote
                          ? `Total: ₹${Number(quote.total || 0).toLocaleString()} (Rev-${quote.revision || 0}). Tax & GST calculated.`
                          : "Back Officer will issue HTML quotation once enquiry requirements are confirmed."}
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Customer PO */}
                  <div className={`p-3 rounded-xl border flex items-start gap-3 ${
                    quote?.customerPONumber || lead?.stage === "PO_RECEIVED" || lead?.stage === "CONVERTED"
                      ? "bg-emerald-50/70 border-emerald-300/80"
                      : "bg-amber-50/70 border-amber-300/80"
                  }`}>
                    {quote?.customerPONumber || lead?.stage === "PO_RECEIVED" || lead?.stage === "CONVERTED" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900">4. Customer PO & PI Finalization</span>
                        <span className="text-[10px] text-amber-800 font-bold">
                          {quote?.customerPONumber ? `PO: ${quote.customerPONumber}` : "Pending Client PO"}
                        </span>
                      </div>
                      <p className="text-slate-700 text-[11px] mt-0.5">
                        {quote?.customerPONumber
                          ? `Client confirmed PO. Proforma Invoice: ${quote.proformaInvoiceNumber || "Generated"}.`
                          : "Customer reviews commercial terms and issues formal Purchase Order."}
                      </p>
                    </div>
                  </div>

                  {/* Step 5: Sales Order & Inventory Stock Check */}
                  <div className={`p-3 rounded-xl border flex items-start gap-3 ${
                    lead?.stage === "CONVERTED" || quote?.salesOrder
                      ? "bg-emerald-50/70 border-emerald-300/80"
                      : "bg-slate-50 border-slate-200"
                  }`}>
                    {lead?.stage === "CONVERTED" || quote?.salesOrder ? (
                      <PackageCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900">5. Sales Order Release & Stock Check</span>
                        <span className="text-[10px] text-emerald-800 font-bold">
                          {lead?.stage === "CONVERTED" ? "Ready for Dispatch" : "Pending SO Release"}
                        </span>
                      </div>
                      <p className="text-slate-700 text-[11px] mt-0.5">
                        Sales Manager approves Sales Order and runs automated inventory stock check to reserve products for factory dispatch.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons to Jump Directly */}
              <div className="pt-2 flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate && onNavigate("leads");
                  }}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-300 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>View in Leads</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate && onNavigate("quotations");
                  }}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-300 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-600" />
                  <span>View Quotation</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate && onNavigate("orders");
                  }}
                  className="px-3.5 py-2 bg-[#d4ff00] hover:bg-[#c2ed00] text-black text-xs font-black border border-lime-400 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>View Sales Orders</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500">
              <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <div className="font-extrabold text-slate-900 text-sm">Real-time Order & Enquiry Tracking</div>
              <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1 font-medium">
                Enter any lead code, quotation number, or client company name above to trace the complete commercial lifecycle.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
