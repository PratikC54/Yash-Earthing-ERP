import React, { useState, useEffect, useCallback } from "react";
import {
  Layers,
  Search,
  Plus,
  Eye,
  CheckCircle2,
  Send,
  X,
  FileCheck,
  Building,
  Calendar,
  AlertCircle,
  Trash2,
} from "lucide-react";
import * as api from "../api/procurementApi";
import StatusBadge from "../components/common/StatusBadge";
import { LoadingSkeleton, EmptyState, ErrorAlert } from "../components/common/StateFeedback";
import DeliveryDatePicker from "../components/common/DeliveryDatePicker";
import QuantityControl from "../components/common/QuantityControl";

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionSuccess, setActionSuccess] = useState(null);

  // Detail drawer
  const [selectedPo, setSelectedPo] = useState(null);

  // Create PO Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [vendorsList, setVendorsList] = useState([]);
  const [poItems, setPoItems] = useState([
    { productId: 1, quantity: 100, unitPrice: 200, taxPercent: 18 },
  ]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getPurchaseOrders({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      });
      if (res.success) {
        setOrders(res.orders || []);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load Purchase Orders");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const openCreateModal = async () => {
    try {
      const res = await api.getVendors({ isActive: true });
      if (res.success) {
        setVendorsList(res.vendors || res.data || []);
      }
      setIsCreateOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePo = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const vendorId = Number(formData.get("vendorId"));
    const expectedDate = formData.get("expectedDate") || null;
    const notes = formData.get("notes")?.trim() || null;

    try {
      const res = await api.createPurchaseOrder({
        vendorId,
        expectedDate,
        notes,
        items: poItems,
      });
      if (res.success) {
        setActionSuccess(`Purchase Order ${res.data.poNumber} created successfully.`);
        setIsCreateOpen(false);
        fetchOrders();
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create Purchase Order");
    }
  };

  const handleUpdateStatus = async (poId, status) => {
    try {
      const res = await api.updatePurchaseOrderStatus(poId, status);
      if (res.success) {
        setActionSuccess(`Purchase order status updated to ${status}.`);
        fetchOrders();
        if (selectedPo && selectedPo.id === poId) {
          setSelectedPo(res.data);
        }
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to update status to ${status}`);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-[#edf1f7] text-slate-800 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/60 shadow-2xs">
              <Layers className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              Purchase Orders & Commitments
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
            Commercial binding orders, authorization workflows, vendor dispatch, and receipt tracking
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#141d30] text-white hover:bg-slate-800 active:scale-98 transition shadow-sm cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Purchase Order</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && <ErrorAlert message={error} onRetry={fetchOrders} />}

      {/* Filter & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search PO number, vendor name..."
            className="w-full bg-[#f8fafc] text-xs text-slate-800 placeholder-slate-400 pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#f8fafc] text-xs text-slate-700 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="APPROVED">Approved</option>
          <option value="SENT">Sent to Vendor</option>
          <option value="PARTIALLY_RECEIVED">Partially Received</option>
          <option value="RECEIVED">Received</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {/* PO Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] overflow-hidden">
        {loading ? (
          <LoadingSkeleton rows={5} />
        ) : orders.length === 0 ? (
          <EmptyState
            title="No Purchase Orders found"
            message="Create or award an RFQ to generate purchase orders."
            actionLabel="New Purchase Order"
            onAction={openCreateModal}
            icon={Layers}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  <th className="py-3 px-4 font-semibold">PO NUMBER</th>
                  <th className="py-3 px-4 font-semibold">VENDOR</th>
                  <th className="py-3 px-4 font-semibold">ORDER DATE</th>
                  <th className="py-3 px-4 font-semibold">EXPECTED DELIVERY</th>
                  <th className="py-3 px-4 font-semibold text-right">TOTAL AMOUNT (₹)</th>
                  <th className="py-3 px-4 font-semibold">STATUS</th>
                  <th className="py-3 px-4 font-semibold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((po) => (
                  <tr
                    key={po.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => setSelectedPo(po)}
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-blue-600">
                      {po.poNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>{po.vendor?.name}</div>
                      <span className="text-[10px] font-mono text-slate-400">{po.vendor?.code}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(po.orderDate || po.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : "Flexible"}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 text-right">
                      ₹{Number(po.total).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={po.status} />
                    </td>
                    <td
                      className="py-3 px-4 text-right space-x-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {po.status === "DRAFT" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(po.id, "PENDING_APPROVAL")}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold border border-blue-200/60 hover:bg-blue-100 transition cursor-pointer text-[11px]"
                        >
                          Submit Approval
                        </button>
                      )}
                      {po.status === "PENDING_APPROVAL" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(po.id, "APPROVED")}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60 hover:bg-emerald-100 transition cursor-pointer text-[11px]"
                        >
                          Approve
                        </button>
                      )}
                      {po.status === "APPROVED" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(po.id, "SENT")}
                          className="px-2.5 py-1 rounded-lg bg-[#141d30] text-white font-semibold hover:bg-slate-800 transition cursor-pointer text-[11px] inline-flex items-center space-x-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Dispatch PO</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedPo(po)}
                        className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PO Detail Drawer */}
      {selectedPo && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-2xs transition-all animate-in fade-in">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-base font-bold text-blue-600">{selectedPo.poNumber}</span>
                    <StatusBadge status={selectedPo.status} />
                  </div>
                  <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                    Issued to {selectedPo.vendor?.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPo(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Financial Totals */}
              <div className="grid grid-cols-3 gap-2 my-5 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Subtotal</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    ₹{Number(selectedPo.subtotal || 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Taxes (GST)</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    ₹{Number(selectedPo.taxAmount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200/70">
                  <span className="text-[10px] text-blue-600 uppercase font-bold block">Total Amount</span>
                  <span className="font-mono font-bold text-blue-900 text-sm">
                    ₹{Number(selectedPo.total || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Ordered Items & Receipt Progress
                </span>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedPo.items?.map((item) => (
                    <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                      <div className="flex justify-between items-center font-semibold text-slate-800">
                        <span>{item.product?.name || `Product #${item.productId}`}</span>
                        <span className="font-mono font-bold">
                          ₹{(Number(item.quantity) * Number(item.unitPrice)).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500 text-[11px] mt-1">
                        <span>
                          Ordered: {Number(item.quantity)} | Received: {Number(item.receivedQuantity)}
                        </span>
                        <span>Unit: ₹{Number(item.unitPrice)} (+{Number(item.taxPercent)}% GST)</span>
                      </div>
                      {/* Receipt progress bar */}
                      <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                        <div
                          style={{
                            width: `${Math.min(100, (Number(item.receivedQuantity) / Number(item.quantity)) * 100)}%`,
                          }}
                          className="h-full bg-blue-600 rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPo.notes && (
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Terms & Notes
                  </span>
                  <p className="mt-1 text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                    {selectedPo.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center space-x-2">
              {selectedPo.status === "DRAFT" && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedPo.id, "PENDING_APPROVAL")}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition cursor-pointer text-xs text-center"
                >
                  Submit for Approval
                </button>
              )}
              {selectedPo.status === "PENDING_APPROVAL" && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedPo.id, "APPROVED")}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition cursor-pointer text-xs text-center"
                >
                  Approve Order
                </button>
              )}
              {selectedPo.status === "APPROVED" && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedPo.id, "SENT")}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#141d30] hover:bg-slate-800 text-white font-semibold transition cursor-pointer text-xs text-center"
                >
                  Send to Vendor
                </button>
              )}
              {selectedPo.status === "RECEIVED" && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedPo.id, "CLOSED")}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-semibold transition cursor-pointer text-xs text-center"
                >
                  Close Purchase Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create PO Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl p-6 text-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create Direct Purchase Order</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Supplier <span className="text-rose-500">*</span></label>
                <select
                  name="vendorId"
                  required
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="">Choose a registered supplier...</option>
                  {vendorsList.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.code})
                    </option>
                  ))}
                </select>
              </div>

              <DeliveryDatePicker
                label="Expected Delivery Date"
                name="expectedDate"
                required={true}
              />

              {/* Items List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-700 font-semibold">PO Line Items</label>
                  <button
                    type="button"
                    onClick={() =>
                      setPoItems([
                        ...poItems,
                        { productId: 1, quantity: 50, unitPrice: 200, taxPercent: 18 },
                      ])
                    }
                    className="text-emerald-600 hover:text-emerald-800 font-semibold flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {poItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700 text-xs">Item #{idx + 1}</span>
                        {poItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setPoItems(poItems.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition"
                            title="Remove line item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">Product ID</label>
                          <input
                            type="number"
                            value={item.productId}
                            onChange={(e) => {
                              const copy = [...poItems];
                              copy[idx].productId = Math.max(1, Number(e.target.value) || 1);
                              setPoItems(copy);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-semibold"
                            required
                            min="1"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">Quantity</label>
                          <QuantityControl
                            value={item.quantity}
                            min={1}
                            onChange={(val) => {
                              const copy = [...poItems];
                              copy[idx].quantity = val;
                              setPoItems(copy);
                            }}
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">Unit Price (₹)</label>
                          <input
                            type="number"
                            value={item.unitPrice}
                            min="0"
                            step="0.01"
                            onChange={(e) => {
                              const copy = [...poItems];
                              copy[idx].unitPrice = Math.max(0, parseFloat(e.target.value) || 0);
                              setPoItems(copy);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-800"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">GST Slab</label>
                          <select
                            value={item.taxPercent}
                            onChange={(e) => {
                              const copy = [...poItems];
                              copy[idx].taxPercent = Number(e.target.value);
                              setPoItems(copy);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-800 cursor-pointer"
                          >
                            <option value={0}>0% (Exempt)</option>
                            <option value={5}>5% (Concessional)</option>
                            <option value={12}>12% (Standard Low)</option>
                            <option value={18}>18% (Standard General)</option>
                          </select>
                        </div>
                      </div>

                      {/* Computed Line Total */}
                      <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-200/50 text-slate-500">
                        <span>
                          Taxable: ₹{(item.quantity * item.unitPrice).toFixed(2)} + GST: ₹{((item.quantity * item.unitPrice * item.taxPercent) / 100).toFixed(2)}
                        </span>
                        <span className="font-bold text-slate-800 font-mono">
                          Line Total: ₹{(item.quantity * item.unitPrice * (1 + item.taxPercent / 100)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Grand Total Summary */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-900">Total Purchase Order Value:</span>
                <span className="font-bold font-mono text-emerald-950 text-sm">
                  ₹{poItems.reduce((acc, it) => acc + it.quantity * it.unitPrice * (1 + it.taxPercent / 100), 0).toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Delivery Instructions / Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="e.g. Standard unloading at Main Raw Material Bay"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

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
                  className="px-5 py-2 rounded-xl bg-[#141d30] hover:bg-slate-800 text-white font-semibold transition cursor-pointer shadow-sm"
                >
                  Create Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
