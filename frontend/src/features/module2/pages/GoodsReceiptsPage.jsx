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

  // Create GRN Modal (Stage 1: Gate Entry)
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [openPos, setOpenPos] = useState([]);
  const [selectedPoForGrn, setSelectedPoForGrn] = useState(null);
  const [grnItems, setGrnItems] = useState([]);
  const [transporterName, setTransporterName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [challanNumber, setChallanNumber] = useState("");
  const [gateNotes, setGateNotes] = useState("");

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

  // Open Create GRN Modal (Stage 1: Gate Entry)
  const openCreateModal = async () => {
    setTransporterName("");
    setVehicleNumber("");
    setChallanNumber("");
    setGateNotes("");
    try {
      const res = await api.getPurchaseOrders();
      if (res.success) {
        const eligible = (res.orders || []).filter(
          (p) => p.status === "SENT" || p.status === "APPROVED" || p.status === "PARTIALLY_RECEIVED"
        );
        setOpenPos(eligible.length > 0 ? eligible : res.orders || []);
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
        transporterName: transporterName.trim() || undefined,
        vehicleNumber: vehicleNumber.trim() || undefined,
        challanNumber: challanNumber.trim() || undefined,
        notes: gateNotes.trim() || undefined,
        items: grnItems.map((item) => ({
          productId: item.productId,
          receivedQuantity: Number(item.receivedQuantity),
          batchNumber: item.batchNumber || null,
        })),
      });

      if (res.success) {
        setActionSuccess(`GRN ${res.data.grnNumber} generated at gate. Material quarantined for Quality Inspection.`);
        setIsCreateOpen(false);
        fetchReceipts();
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create Goods Receipt");
    }
  };

  // Open Inspection Modal (Stage 2: QC Inspection)
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
          rejectionReason: "",
          batchNumber: it.batchNumber || `LOT-${Date.now().toString().slice(-4)}`,
        }))
      );
    }
  };

  // Post Inspection & Stock
  const handlePostInspection = async (e) => {
    e.preventDefault();
    if (!inspectingGrn) return;

    // Check mandatory rejection reason
    for (const item of inspectionItems) {
      if (item.rejectedQuantity > 0 && (!item.rejectionReason || !item.rejectionReason.trim())) {
        setError(`Please specify a rejection reason for ${item.productName}`);
        return;
      }
      if (Math.abs(item.acceptedQuantity + item.rejectedQuantity - item.receivedQuantity) > 0.0001) {
        setError(`Accepted + Rejected must equal Received (${item.receivedQuantity}) for ${item.productName}`);
        return;
      }
    }

    try {
      setSubmittingInspection(true);
      setError(null);
      const res = await api.inspectAndPostGoodsReceipt(inspectingGrn.id, {
        status: "ACCEPTED",
        items: inspectionItems.map((it) => ({
          itemId: it.itemId,
          acceptedQuantity: Number(it.acceptedQuantity),
          rejectedQuantity: Number(it.rejectedQuantity),
          rejectionReason: it.rejectionReason?.trim() || undefined,
          batchNumber: it.batchNumber || null,
        })),
      });

      if (res.success) {
        setActionSuccess(res.message);
        setInspectingGrn(null);
        fetchReceipts();
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post inspection and stock update");
    } finally {
      setSubmittingInspection(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-[#070e1e] text-slate-100 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-cyan-400 flex items-center justify-center border border-blue-500/20 shadow-2xs">
              <Truck className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
              Goods Receipts (GRN) & Quality Inspection
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-normal mt-1">
            Inbound delivery intake, physical verification, quality acceptance/rejection, and atomic inventory posting
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/30 active:scale-98 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Goods Receipt (GRN)</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && <ErrorAlert message={error} onRetry={fetchReceipts} />}

      {/* Filter & Search */}
      <div className="bg-[#10182f] rounded-2xl p-4 border border-[#1e2a4a] flex flex-col md:flex-row gap-3 items-center justify-between shadow-lg">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search GRN number, PO number..."
            className="w-full bg-[#0a1020] text-xs text-slate-100 placeholder-slate-500 pl-8 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#0a1020] text-xs text-slate-200 px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500 cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="UNDER_INSPECTION">Under Inspection</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="PARTIALLY_ACCEPTED">Partially Accepted</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* GRN Table */}
      <div className="bg-[#10182f] rounded-2xl border border-[#1e2a4a] shadow-lg overflow-hidden">
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
                <tr className="border-b border-slate-800 bg-[#0b1329] text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  <th className="py-3 px-4 font-semibold">GRN NUMBER</th>
                  <th className="py-3 px-4 font-semibold">PO NUMBER</th>
                  <th className="py-3 px-4 font-semibold">SUPPLIER</th>
                  <th className="py-3 px-4 font-semibold">RECEIVED DATE</th>
                  <th className="py-3 px-4 font-semibold">LINE ITEMS</th>
                  <th className="py-3 px-4 font-semibold">STATUS</th>
                  <th className="py-3 px-4 font-semibold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {receipts.map((grn) => (
                  <tr key={grn.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs">
                      <div className="font-bold text-cyan-300">{grn.grnNumber}</div>
                      {grn.notes && (
                        <div className="text-[10px] text-slate-400 font-sans truncate max-w-xs" title={grn.notes}>
                          {grn.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-cyan-300">
                      {grn.purchaseOrder?.poNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {grn.purchaseOrder?.vendor?.name || "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {new Date(grn.receivedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-slate-200 font-medium">
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
                          className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 font-semibold transition cursor-pointer text-[11px] inline-flex items-center space-x-1 shadow-2xs"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                          <span>Inspect & Post</span>
                        </button>
                      ) : (
                        <span className="text-emerald-400 text-[11px] font-semibold">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-2xs p-4">
          <div className="bg-[#10182f] border border-[#1e2a4a] w-full max-w-lg rounded-2xl shadow-2xl p-6 text-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Receive Inbound Shipment (GRN)</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGrn} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Select Purchase Order
                </label>
                <select
                  required
                  onChange={(e) => handleSelectPo(e.target.value)}
                  className="w-full bg-[#0a1020] border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
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
                <div className="bg-[#0a1020] p-3 rounded-xl border border-slate-800 space-y-3">
                  <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
                    Stage 1 — Gate Entry Details
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-medium mb-1">
                        Transporter Name
                      </label>
                      <input
                        type="text"
                        value={transporterName}
                        onChange={(e) => setTransporterName(e.target.value)}
                        placeholder="e.g. VRL Logistics"
                        className="w-full bg-[#10182f] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-medium mb-1">
                        Vehicle / Truck No
                      </label>
                      <input
                        type="text"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                        placeholder="e.g. MH-12-AB-1234"
                        className="w-full bg-[#10182f] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-medium mb-1">
                        Delivery Challan No
                      </label>
                      <input
                        type="text"
                        value={challanNumber}
                        onChange={(e) => setChallanNumber(e.target.value)}
                        placeholder="e.g. DC-9872"
                        className="w-full bg-[#10182f] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1">
                      Gate Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={gateNotes}
                      onChange={(e) => setGateNotes(e.target.value)}
                      placeholder="e.g. Seal intact, unloaded at Bay 2"
                      className="w-full bg-[#10182f] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}

              {selectedPoForGrn && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-2">
                    Delivered Quantities
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {grnItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-[#0a1020] p-2.5 rounded-xl border border-slate-800"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold block text-white truncate">
                            {item.productName}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
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
                            className="w-full bg-[#10182f] border border-slate-700 rounded-lg px-2 py-1 font-mono font-bold text-cyan-300"
                            required
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedPoForGrn}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-md shadow-blue-600/30 transition cursor-pointer disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-2xs p-4">
          <div className="bg-[#10182f] border border-[#1e2a4a] w-full max-w-xl rounded-2xl shadow-2xl p-6 text-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">
                  Quality Inspection & Inventory Posting
                </h3>
                <span className="font-mono text-xs text-cyan-300 font-bold">{inspectingGrn.grnNumber}</span>
              </div>
              <button
                type="button"
                onClick={() => setInspectingGrn(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePostInspection} className="mt-4 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-cyan-300 text-xs flex items-center space-x-2">
                <Boxes className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  Accepted quantities will be posted atomically into usable physical inventory and logged in the inventory movement ledger.
                </span>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {inspectionItems.map((item, idx) => (
                  <div
                    key={item.itemId}
                    className="p-3 bg-[#0a1020] rounded-xl border border-slate-800 space-y-2"
                  >
                    <div className="flex justify-between items-center font-semibold text-white">
                      <span>{item.productName}</span>
                      <span className="font-mono text-slate-400 text-[11px]">
                        Received: {item.receivedQuantity}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] font-semibold text-emerald-400 block">
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
                          className="w-full bg-[#10182f] border border-slate-700 rounded-lg px-2 py-1 font-bold text-emerald-400 font-mono"
                          min="0"
                          max={item.receivedQuantity}
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-rose-400 block">
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
                          className="w-full bg-[#10182f] border border-slate-700 rounded-lg px-2 py-1 font-bold text-rose-400 font-mono"
                          min="0"
                          max={item.receivedQuantity}
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 block">
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
                          placeholder="e.g. BATCH-2026-X"
                          className="w-full bg-[#10182f] border border-slate-700 rounded-lg px-2 py-1 font-mono text-cyan-300 font-bold"
                        />
                      </div>
                    </div>

                    {item.rejectedQuantity > 0 && (
                      <div className="pt-2 border-t border-slate-800/80">
                        <label className="block text-[10px] font-semibold text-rose-400 mb-1">
                          Rejection Reason <span className="text-rose-500">* (Mandatory)</span>
                        </label>
                        <select
                          required
                          value={item.rejectionReason || ""}
                          onChange={(e) => {
                            const copy = [...inspectionItems];
                            copy[idx].rejectionReason = e.target.value;
                            setInspectionItems(copy);
                          }}
                          className="w-full bg-[#10182f] border border-rose-500/50 rounded-lg px-2 py-1.5 text-xs text-rose-200 focus:outline-none focus:border-rose-400 cursor-pointer"
                        >
                          <option value="">Select rejection reason...</option>
                          <option value="Damaged in transit / Broken packaging">Damaged in transit / Broken packaging</option>
                          <option value="Dimension or tolerance mismatch">Dimension or tolerance mismatch</option>
                          <option value="Substandard material / Failed purity test">Substandard material / Failed purity test</option>
                          <option value="Expired / Surface oxidation & corrosion">Expired / Surface oxidation & corrosion</option>
                          <option value="Incorrect specification supplied">Incorrect specification supplied</option>
                          <option value="Missing mill test certificate / documentation">Missing mill test certificate / documentation</option>
                          <option value="Other non-conformance">Other non-conformance</option>
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setInspectingGrn(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInspection}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-md shadow-blue-600/30 transition cursor-pointer disabled:opacity-50 inline-flex items-center space-x-1.5"
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
