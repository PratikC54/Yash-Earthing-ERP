import React, { useState, useEffect, useCallback } from "react";
import {
  Truck,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  PackageCheck,
  ShieldCheck,
  AlertTriangle,
  Boxes,
} from "lucide-react";
import * as api from "../api/procurementApi";
import StatusBadge from "../components/common/StatusBadge";
import { LoadingSkeleton, EmptyState, ErrorAlert } from "../components/common/StateFeedback";

export default function GoodsReceiptsPage() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionSuccess, setActionSuccess] = useState(null);

  // Create GRN Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [openPos, setOpenPos] = useState([]);
  const [selectedPoForGrn, setSelectedPoForGrn] = useState(null);
  const [grnItems, setGrnItems] = useState([]);

  // Inspection Modal
  const [inspectingGrn, setInspectingGrn] = useState(null);
  const [inspectionItems, setInspectionItems] = useState([]);
  const [submittingInspection, setSubmittingInspection] = useState(false);

  const fetchReceipts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getGoodsReceipts({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      });
      if (res.success) {
        setReceipts(res.receipts || []);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load Goods Receipts");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  // Open Create GRN Modal
  const openCreateModal = async () => {
    try {
      const res = await api.getPurchaseOrders({ status: "SENT" });
      if (res.success) {
        setOpenPos(res.orders || []);
      }
      setIsCreateOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectPo = (poId) => {
    const po = openPos.find((p) => p.id === Number(poId));
    setSelectedPoForGrn(po);
    if (po && po.items) {
      setGrnItems(
        po.items.map((it) => {
          const remaining = Number(it.quantity) - Number(it.receivedQuantity || 0);
          return {
            productId: it.productId,
            productName: it.product?.name || `Product #${it.productId}`,
            orderedQuantity: Number(it.quantity),
            receivedQuantity: Math.max(0, remaining),
            batchNumber: `BAT-${Date.now().toString().slice(-4)}`,
          };
        })
      );
    }
  };

  const handleCreateGrn = async (e) => {
    e.preventDefault();
    if (!selectedPoForGrn) return;

    try {
      const res = await api.createGoodsReceipt({
        purchaseOrderId: selectedPoForGrn.id,
        items: grnItems.map((item) => ({
          productId: item.productId,
          receivedQuantity: Number(item.receivedQuantity),
          batchNumber: item.batchNumber || null,
        })),
      });

      if (res.success) {
        setActionSuccess(`GRN ${res.data.grnNumber} generated. Ready for Quality Inspection.`);
        setIsCreateOpen(false);
        fetchReceipts();
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create Goods Receipt");
    }
  };

  // Open Inspection Modal
  const openInspectionModal = (grn) => {
    setInspectingGrn(grn);
    if (grn.items) {
      setInspectionItems(
        grn.items.map((it) => ({
          itemId: it.id,
          productName: it.product?.name || `Product #${it.productId}`,
          receivedQuantity: Number(it.receivedQuantity),
          acceptedQuantity: Number(it.receivedQuantity), // Default all accepted
          rejectedQuantity: 0,
          batchNumber: it.batchNumber || `LOT-${Date.now().toString().slice(-4)}`,
        }))
      );
    }
  };

  // Post Inspection & Stock
  const handlePostInspection = async (e) => {
    e.preventDefault();
    if (!inspectingGrn) return;

    try {
      setSubmittingInspection(true);
      const res = await api.inspectAndPostGoodsReceipt(inspectingGrn.id, {
        status: "ACCEPTED",
        items: inspectionItems.map((it) => ({
          itemId: it.itemId,
          acceptedQuantity: Number(it.acceptedQuantity),
          rejectedQuantity: Number(it.rejectedQuantity),
          batchNumber: it.batchNumber || null,
        })),
      });

      if (res.success) {
        setActionSuccess(res.message);
        setInspectingGrn(null);
        fetchReceipts();
        setTimeout(() => setActionSuccess(null), 3500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post inspection and stock update");
    } finally {
      setSubmittingInspection(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-[#edf1f7] text-slate-800 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/60 shadow-2xs">
              <Truck className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              Goods Receipts (GRN) & Quality Inspection
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
            Inbound delivery intake, physical verification, quality acceptance/rejection, and atomic inventory posting
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#141d30] text-white hover:bg-slate-800 active:scale-98 transition shadow-sm cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Goods Receipt (GRN)</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && <ErrorAlert message={error} onRetry={fetchReceipts} />}

      {/* Filter & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search GRN number, PO number..."
            className="w-full bg-[#f8fafc] text-xs text-slate-800 placeholder-slate-400 pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#f8fafc] text-xs text-slate-700 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="UNDER_INSPECTION">Under Inspection</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="PARTIALLY_ACCEPTED">Partially Accepted</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* GRN Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] overflow-hidden">
        {loading ? (
          <LoadingSkeleton rows={5} />
        ) : receipts.length === 0 ? (
          <EmptyState
            title="No Goods Receipts logged"
            message="Record an inbound delivery against an issued Purchase Order to begin inspection."
            actionLabel="New Goods Receipt"
            onAction={openCreateModal}
            icon={Truck}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  <th className="py-3 px-4 font-semibold">GRN NUMBER</th>
                  <th className="py-3 px-4 font-semibold">PO NUMBER</th>
                  <th className="py-3 px-4 font-semibold">SUPPLIER</th>
                  <th className="py-3 px-4 font-semibold">RECEIVED DATE</th>
                  <th className="py-3 px-4 font-semibold">LINE ITEMS</th>
                  <th className="py-3 px-4 font-semibold">STATUS</th>
                  <th className="py-3 px-4 font-semibold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipts.map((grn) => (
                  <tr key={grn.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-blue-600">
                      {grn.grnNumber}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {grn.purchaseOrder?.poNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {grn.purchaseOrder?.vendor?.name || "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(grn.receivedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {grn.items?.length || 0} items
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={grn.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {grn.status === "UNDER_INSPECTION" ? (
                        <button
                          type="button"
                          onClick={() => openInspectionModal(grn)}
                          className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition cursor-pointer text-[11px] inline-flex items-center space-x-1 shadow-2xs"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Inspect & Post</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-semibold">
                          Posted to Stock ✓
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create GRN Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl p-6 text-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Receive Inbound Shipment (GRN)</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGrn} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Select Purchase Order
                </label>
                <select
                  required
                  onChange={(e) => handleSelectPo(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Choose an open purchase order...</option>
                  {openPos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.poNumber} — {p.vendor?.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPoForGrn && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-2">
                    Delivered Quantities
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {grnItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/70"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold block text-slate-800 truncate">
                            {item.productName}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Ordered: {item.orderedQuantity}
                          </span>
                        </div>
                        <div className="w-28">
                          <input
                            type="number"
                            value={item.receivedQuantity}
                            onChange={(e) => {
                              const copy = [...grnItems];
                              copy[idx].receivedQuantity = Number(e.target.value);
                              setGrnItems(copy);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold"
                            required
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedPoForGrn}
                  className="px-5 py-2 rounded-xl bg-[#141d30] hover:bg-slate-800 text-white font-semibold transition cursor-pointer shadow-sm disabled:opacity-50"
                >
                  Generate GRN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QC Inspection & Stock Posting Dialog */}
      {inspectingGrn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4">
          <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl shadow-2xl p-6 text-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Quality Inspection & Inventory Posting
                </h3>
                <span className="font-mono text-xs text-blue-600">{inspectingGrn.grnNumber}</span>
              </div>
              <button
                type="button"
                onClick={() => setInspectingGrn(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePostInspection} className="mt-4 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/60 text-blue-900 text-xs flex items-center space-x-2">
                <Boxes className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Accepted quantities will be posted atomically into usable physical inventory and logged in the inventory movement ledger.
                </span>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {inspectionItems.map((item, idx) => (
                  <div
                    key={item.itemId}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2"
                  >
                    <div className="flex justify-between items-center font-semibold text-slate-900">
                      <span>{item.productName}</span>
                      <span className="font-mono text-slate-500 text-[11px]">
                        Received: {item.receivedQuantity}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] font-semibold text-emerald-700 block">
                          Accepted Qty
                        </span>
                        <input
                          type="number"
                          value={item.acceptedQuantity}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const copy = [...inspectionItems];
                            copy[idx].acceptedQuantity = val;
                            copy[idx].rejectedQuantity = Math.max(0, item.receivedQuantity - val);
                            setInspectionItems(copy);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-emerald-700"
                          min="0"
                          max={item.receivedQuantity}
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-rose-700 block">
                          Rejected Qty
                        </span>
                        <input
                          type="number"
                          value={item.rejectedQuantity}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const copy = [...inspectionItems];
                            copy[idx].rejectedQuantity = val;
                            copy[idx].acceptedQuantity = Math.max(0, item.receivedQuantity - val);
                            setInspectionItems(copy);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-rose-700"
                          min="0"
                          max={item.receivedQuantity}
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-slate-500 block">
                          Batch / Heat No
                        </span>
                        <input
                          type="text"
                          value={item.batchNumber}
                          onChange={(e) => {
                            const copy = [...inspectionItems];
                            copy[idx].batchNumber = e.target.value;
                            setInspectionItems(copy);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setInspectingGrn(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInspection}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition cursor-pointer shadow-sm disabled:opacity-50 inline-flex items-center space-x-1.5"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>{submittingInspection ? "Posting..." : "Confirm & Post Stock"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
