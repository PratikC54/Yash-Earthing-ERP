import React, { useState, useEffect, useCallback } from "react";
import {
  ShoppingCart,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  Send,
  Award,
  Layers,
  ArrowRight,
  TrendingDown,
  X,
  Eye,
  CheckCheck,
  Trash2,
} from "lucide-react";
import * as api from "../api/procurementApi";
import StatusBadge from "../components/common/StatusBadge";
import { LoadingSkeleton, EmptyState, ErrorAlert } from "../components/common/StateFeedback";
import DeliveryDatePicker from "../components/common/DeliveryDatePicker";
import QuantityControl from "../components/common/QuantityControl";

export default function PurchaseRequestsAndRfqsPage() {
  const [activeTab, setActiveTab] = useState("prs"); // "prs" | "rfqs"
  const [prs, setPrs] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // PR creation modal state
  const [isPrModalOpen, setIsPrModalOpen] = useState(false);
  const [prItems, setPrItems] = useState([{ productId: 1, quantity: 100, notes: "" }]);

  // RFQ quote comparison modal state
  const [comparisonModalRfqId, setComparisonModalRfqId] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [loadingComparison, setLoadingComparison] = useState(false);

  // Record quotation modal state
  const [quoteModalRfq, setQuoteModalRfq] = useState(null);
  const [vendorsList, setVendorsList] = useState([]);
  const [quoteItems, setQuoteItems] = useState([]);

  // Fetch PRs
  const fetchPrs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getPurchaseRequests();
      if (res.success) {
        setPrs(res.requests || []);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load Purchase Requests");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch RFQs
  const fetchRfqs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getRfqs();
      if (res.success) {
        setRfqs(res.rfqs || []);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load RFQs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "prs") {
      fetchPrs();
    } else {
      fetchRfqs();
    }
  }, [activeTab, fetchPrs, fetchRfqs]);

  // Load vendors for quotation modal
  const loadVendors = async () => {
    try {
      const res = await api.getVendors({ isActive: true });
      if (res.success) {
        setVendorsList(res.vendors || res.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create PR
  const handleCreatePr = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      requiredBy: formData.get("requiredBy") || null,
      notes: formData.get("notes")?.trim() || null,
      items: prItems.map((item) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
        notes: item.notes || null,
      })),
    };

    try {
      const res = await api.createPurchaseRequest(payload);
      if (res.success) {
        setActionSuccess(`Purchase Request ${res.data.requestNo} created successfully.`);
        setIsPrModalOpen(false);
        setPrItems([{ productId: 1, quantity: 100, notes: "" }]);
        fetchPrs();
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create Purchase Request");
    }
  };

  // Submit / Approve PR
  const handleUpdatePrStatus = async (prId, status) => {
    try {
      const res = await api.updatePurchaseRequest(prId, { status });
      if (res.success) {
        setActionSuccess(`PR status updated to ${status}.`);
        fetchPrs();
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to update PR status to ${status}`);
    }
  };

  // Create RFQ from PR
  const handleCreateRfqFromPr = async (prId) => {
    try {
      const res = await api.createRfq({ purchaseRequestId: prId });
      if (res.success) {
        setActionSuccess(`RFQ ${res.data.rfqNo} generated from PR.`);
        setActiveTab("rfqs");
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create RFQ from PR");
    }
  };

  // Open Quote Modal
  const openQuoteModal = async (rfq) => {
    setQuoteModalRfq(rfq);
    await loadVendors();
    // Default quote items
    const items = rfq.purchaseRequest?.items?.map((it) => ({
      productId: it.productId,
      quantity: Number(it.quantity),
      unitPrice: 150,
      taxPercent: 18,
    })) || [{ productId: 1, quantity: 100, unitPrice: 150, taxPercent: 18 }];
    setQuoteItems(items);
  };

  // Submit Vendor Quotation
  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const vendorId = Number(formData.get("vendorId"));
    const validUntil = formData.get("validUntil") || null;
    const notes = formData.get("notes")?.trim() || null;

    try {
      const res = await api.recordRfqResponse({
        rfqId: quoteModalRfq.id,
        vendorId,
        validUntil,
        notes,
        items: quoteItems,
      });

      if (res.success) {
        setActionSuccess("Vendor quotation recorded successfully.");
        setQuoteModalRfq(null);
        fetchRfqs();
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record quotation");
    }
  };

  // View Quote Comparison
  const openComparisonModal = async (rfqId) => {
    setComparisonModalRfqId(rfqId);
    setLoadingComparison(true);
    try {
      const res = await api.compareRfqQuotes(rfqId);
      if (res.success) {
        setComparisonData(res.data);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load quotation comparison");
    } finally {
      setLoadingComparison(false);
    }
  };

  // Award RFQ
  const handleAwardRfq = async (rfqId, vendorId) => {
    try {
      const res = await api.awardRfq(rfqId, vendorId);
      if (res.success) {
        setActionSuccess(res.message);
        setComparisonModalRfqId(null);
        fetchRfqs();
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to award RFQ");
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-[#070e1e] text-slate-100 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-cyan-400 flex items-center justify-center border border-blue-500/20 shadow-2xs">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
              Requisitions & Sourcing (RFQs)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-normal mt-1">
            Material demand processing, vendor bidding, quote comparative analysis, and award execution
          </p>
        </div>

        {activeTab === "prs" ? (
          <button
            type="button"
            onClick={() => setIsPrModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/30 active:scale-98 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Purchase Request</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleCreateRfqFromPr(null)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/30 active:scale-98 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create RFQ</span>
          </button>
        )}
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && <ErrorAlert message={error} onRetry={activeTab === "prs" ? fetchPrs : fetchRfqs} />}

      {/* Tabs */}
      <div className="flex items-center space-x-3 border-b border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab("prs")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition cursor-pointer border-b-2 ${
            activeTab === "prs"
              ? "border-cyan-400 text-cyan-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Purchase Requests ({prs.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("rfqs")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition cursor-pointer border-b-2 ${
            activeTab === "rfqs"
              ? "border-cyan-400 text-cyan-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          RFQs & Quotations ({rfqs.length})
        </button>
      </div>

      {/* Tab 1: Purchase Requisitions */}
      {activeTab === "prs" && (
        <div className="bg-[#10182f] rounded-2xl border border-[#1e2a4a] shadow-lg overflow-hidden">
          {loading ? (
            <LoadingSkeleton rows={5} />
          ) : prs.length === 0 ? (
            <EmptyState
              title="No Purchase Requests found"
              message="Generate a purchase requisition to initiate raw material sourcing."
              actionLabel="Create Purchase Request"
              onAction={() => setIsPrModalOpen(true)}
              icon={ShoppingCart}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#0b1329] text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    <th className="py-3 px-4 font-semibold">REQUEST NO</th>
                    <th className="py-3 px-4 font-semibold">DATE</th>
                    <th className="py-3 px-4 font-semibold">REQUIRED BY</th>
                    <th className="py-3 px-4 font-semibold">LINE ITEMS</th>
                    <th className="py-3 px-4 font-semibold">STATUS</th>
                    <th className="py-3 px-4 font-semibold text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {prs.map((pr) => (
                    <tr key={pr.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-300">
                        {pr.requestNo}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {new Date(pr.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {pr.requiredBy ? new Date(pr.requiredBy).toLocaleDateString() : "Immediate"}
                      </td>
                      <td className="py-3 px-4 text-slate-200 font-medium">
                        {pr.items?.length || 0} line items
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={pr.status} />
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        {pr.status === "DRAFT" && (
                          <button
                            type="button"
                            onClick={() => handleUpdatePrStatus(pr.id, "SUBMITTED")}
                            className="px-2.5 py-1 rounded-xl bg-blue-500/10 text-cyan-300 font-semibold border border-blue-500/30 hover:bg-blue-500/20 transition cursor-pointer text-[11px]"
                          >
                            Submit
                          </button>
                        )}
                        {pr.status === "SUBMITTED" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdatePrStatus(pr.id, "APPROVED")}
                              className="px-2.5 py-1 rounded-xl bg-emerald-600/20 text-emerald-300 font-semibold border border-emerald-500/40 hover:bg-emerald-600/30 transition cursor-pointer text-[11px]"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdatePrStatus(pr.id, "REJECTED")}
                              className="px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-300 font-semibold border border-rose-500/30 hover:bg-rose-500/20 transition cursor-pointer text-[11px]"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {pr.status === "APPROVED" && (
                          <button
                            type="button"
                            onClick={() => handleCreateRfqFromPr(pr.id)}
                            className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold transition cursor-pointer text-[11px] shadow-sm shadow-blue-600/20"
                          >
                            Generate RFQ
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: RFQs & Quotations */}
      {activeTab === "rfqs" && (
        <div className="bg-[#10182f] rounded-2xl border border-[#1e2a4a] shadow-lg overflow-hidden">
          {loading ? (
            <LoadingSkeleton rows={5} />
          ) : rfqs.length === 0 ? (
            <EmptyState
              title="No RFQs created yet"
              message="Create a Request for Quotation to invite vendor pricing proposals."
              actionLabel="Create RFQ"
              onAction={() => handleCreateRfqFromPr(null)}
              icon={Layers}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#0b1329] text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    <th className="py-3 px-4 font-semibold">RFQ NUMBER</th>
                    <th className="py-3 px-4 font-semibold">ORIGIN PR</th>
                    <th className="py-3 px-4 font-semibold">DUE DATE</th>
                    <th className="py-3 px-4 font-semibold">QUOTES RECEIVED</th>
                    <th className="py-3 px-4 font-semibold">STATUS</th>
                    <th className="py-3 px-4 font-semibold text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {rfqs.map((rfq) => (
                    <tr key={rfq.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-300">
                        {rfq.rfqNo}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-300">
                        {rfq.purchaseRequest?.requestNo || "Standalone"}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {rfq.dueAt ? new Date(rfq.dueAt).toLocaleDateString() : "Open"}
                      </td>
                      <td className="py-3 px-4 text-white font-semibold">
                        {rfq._count?.responses || 0} Quotes
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={rfq.status} />
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        {rfq.status !== "AWARDED" && rfq.status !== "CANCELLED" && (
                          <button
                            type="button"
                            onClick={() => openQuoteModal(rfq)}
                            className="px-2.5 py-1 rounded-xl bg-blue-500/10 text-cyan-300 font-semibold border border-blue-500/30 hover:bg-blue-500/20 transition cursor-pointer text-[11px]"
                          >
                            Log Quote
                          </button>
                        )}
                        {(rfq._count?.responses > 0 || rfq.status === "QUOTATIONS_RECEIVED" || rfq.status === "AWARDED") && (
                          <button
                            type="button"
                            onClick={() => openComparisonModal(rfq.id)}
                            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition cursor-pointer text-[11px]"
                          >
                            Compare & Award
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PR Create Modal */}
      {isPrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-2xs p-4">
          <div className="bg-[#10182f] border border-[#1e2a4a] w-full max-w-lg rounded-2xl shadow-2xl p-6 text-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Create Purchase Requisition</h3>
              <button
                type="button"
                onClick={() => setIsPrModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePr} className="mt-4 space-y-4 text-xs">
              <DeliveryDatePicker
                label="Required Delivery Date"
                name="requiredBy"
                required={true}
              />

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Purpose / Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="e.g. Earthing electrode production batch #2026-B"
                  className="w-full bg-[#0a1020] border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Items List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-300 font-semibold">Material Line Items</label>
                  <button
                    type="button"
                    onClick={() => setPrItems([...prItems, { productId: 1, quantity: 50, notes: "" }])}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {prItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between space-x-3 bg-[#0a1020] p-2.5 rounded-xl border border-slate-800">
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Product ID</label>
                        <input
                          type="number"
                          placeholder="Product ID"
                          value={item.productId}
                          onChange={(e) => {
                            const copy = [...prItems];
                            copy[idx].productId = Math.max(1, Number(e.target.value) || 1);
                            setPrItems(copy);
                          }}
                          className="w-full bg-[#10182f] border border-slate-700 rounded-lg px-2.5 py-1 text-cyan-300 font-mono font-bold"
                          required
                          min="1"
                        />
                      </div>

                      <div className="shrink-0 text-right">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Quantity</label>
                        <QuantityControl
                          value={item.quantity}
                          min={1}
                          onChange={(val) => {
                            const copy = [...prItems];
                            copy[idx].quantity = val;
                            setPrItems(copy);
                          }}
                        />
                      </div>

                      {prItems.length > 1 && (
                        <div className="pt-4">
                          <button
                            type="button"
                            onClick={() => setPrItems(prItems.filter((_, i) => i !== idx))}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                            title="Remove item"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPrModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-md shadow-blue-600/30 transition cursor-pointer"
                >
                  Submit Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Vendor Quotation Modal */}
      {quoteModalRfq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-2xs p-4">
          <div className="bg-[#10182f] border border-[#1e2a4a] w-full max-w-lg rounded-2xl shadow-2xl p-6 text-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                Log Quotation for RFQ: <span className="font-mono text-cyan-300">{quoteModalRfq.rfqNo}</span>
              </h3>
              <button
                type="button"
                onClick={() => setQuoteModalRfq(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitQuote} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Quoting Vendor</label>
                <select
                  name="vendorId"
                  required
                  className="w-full bg-[#0a1020] border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  {vendorsList.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Quotation Valid Until</label>
                <input
                  type="date"
                  name="validUntil"
                  className="w-full bg-[#0a1020] border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 [color-scheme:dark]"
                />
              </div>

              {/* Items Pricing */}
              <div>
                <label className="block text-slate-300 font-semibold mb-2">Item Pricing & Taxes</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {quoteItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-2 bg-[#0a1020] p-2.5 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Quantity</span>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const copy = [...quoteItems];
                            copy[idx].quantity = Number(e.target.value);
                            setQuoteItems(copy);
                          }}
                          className="w-full bg-[#10182f] border border-slate-700 rounded-lg px-2 py-1 text-slate-100 font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Unit Price (₹)</span>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const copy = [...quoteItems];
                            copy[idx].unitPrice = Number(e.target.value);
                            setQuoteItems(copy);
                          }}
                          className="w-full bg-[#10182f] border border-slate-700 rounded-lg px-2 py-1 font-mono font-bold text-cyan-300"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">GST Tax %</span>
                        <input
                          type="number"
                          value={item.taxPercent}
                          onChange={(e) => {
                            const copy = [...quoteItems];
                            copy[idx].taxPercent = Number(e.target.value);
                            setQuoteItems(copy);
                          }}
                          className="w-full bg-[#10182f] border border-slate-700 rounded-lg px-2 py-1 text-slate-100 font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setQuoteModalRfq(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-md shadow-blue-600/30 transition cursor-pointer"
                >
                  Save Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Side-by-Side Quotation Comparison & Award Matrix Modal */}
      {comparisonModalRfqId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-2xs p-4">
          <div className="bg-[#10182f] border border-[#1e2a4a] w-full max-w-4xl rounded-2xl shadow-2xl p-6 text-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">
                  Quotation Comparison & Sourcing Award
                </h3>
                <span className="text-xs text-cyan-300 font-mono font-bold">
                  RFQ: {comparisonData?.rfqNo}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setComparisonModalRfqId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingComparison ? (
              <LoadingSkeleton rows={4} />
            ) : !comparisonData || comparisonData.comparisons?.length === 0 ? (
              <EmptyState
                title="No quotations received yet"
                message="Log quotations from vendors to see side-by-side price and delivery comparisons."
                icon={Layers}
              />
            ) : (
              <div className="mt-5 space-y-5">
                {/* Lowest bidder highlight */}
                {comparisonData.lowestBidder && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <TrendingDown className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold text-emerald-300">
                        Lowest Commercial Bid: {comparisonData.lowestBidder.vendorName}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-emerald-300 text-sm">
                      ₹{comparisonData.lowestBidder.amount.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {comparisonData.comparisons.map((c) => {
                    const isLowest = comparisonData.lowestBidder?.vendorId === c.vendorId;

                    return (
                      <div
                        key={c.responseId}
                        className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                          isLowest
                            ? "bg-blue-950/30 border-blue-500/50 shadow-md shadow-blue-500/10"
                            : "bg-[#0a1020] border-slate-800"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-sm text-white">{c.vendorName}</span>
                            {isLowest && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 font-bold text-[10px]">
                                L1 Bidder
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-xs font-bold text-cyan-300">{c.vendorCode}</span>

                          {/* Vendor stats */}
                          <div className="grid grid-cols-2 gap-2 my-3 text-[11px] bg-[#10182f] p-2.5 rounded-xl border border-slate-800">
                            <div>
                              <span className="text-slate-400 block">On-Time %</span>
                              <span className="font-semibold text-slate-200">
                                {c.onTimeDeliveryPercent ? `${c.onTimeDeliveryPercent}%` : "—"}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Quality</span>
                              <span className="font-semibold text-slate-200">
                                {c.qualityScore ? `${c.qualityScore}%` : "—"}
                              </span>
                            </div>
                          </div>

                          {/* Line item breakdown */}
                          <div className="space-y-1.5 text-xs border-t border-slate-800 pt-2">
                            {c.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between text-slate-300 text-[11px]">
                                <span>{it.quantity} units @ ₹{it.unitPrice}</span>
                                <span className="font-mono font-medium text-cyan-300">₹{it.lineTotal.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Total Quoted</span>
                            <span className="text-base font-bold text-white font-mono">
                              ₹{c.totalAmount.toLocaleString()}
                            </span>
                          </div>

                          {comparisonData.rfqStatus !== "AWARDED" && (
                            <button
                              type="button"
                              onClick={() => handleAwardRfq(comparisonData.rfqId, c.vendorId)}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs transition cursor-pointer shadow-md shadow-blue-600/30"
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>Award PO</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
