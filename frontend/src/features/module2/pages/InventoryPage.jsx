import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Search,
  AlertTriangle,
  History,
  Lock,
  Unlock,
  CheckCircle2,
  X,
  Plus,
  RefreshCw,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import * as api from "../api/procurementApi";
import StatusBadge from "../components/common/StatusBadge";
import { LoadingSkeleton, EmptyState, ErrorAlert } from "../components/common/StateFeedback";

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState("stock"); // "stock" | "movements"
  const [inventoryList, setInventoryList] = useState([]);
  const [movementsList, setMovementsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Reservation / Adjustment Modal
  const [adjustmentModal, setAdjustmentModal] = useState(null);
  const [submittingAdj, setSubmittingAdj] = useState(false);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getInventory({
        search: search.trim() || undefined,
        lowStock: lowStockFilter ? "true" : undefined,
      });
      if (res.success) {
        setInventoryList(res.inventory || []);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load Inventory records");
    } finally {
      setLoading(false);
    }
  }, [search, lowStockFilter]);

  const fetchMovements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getMovements({
        search: search.trim() || undefined,
      });
      if (res.success) {
        setMovementsList(res.movements || []);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load Movement History");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (activeTab === "stock") {
      fetchInventory();
    } else {
      fetchMovements();
    }
  }, [activeTab, fetchInventory, fetchMovements]);

  // Handle Adjustment / Reservation
  const handleRecordAdjustment = async (e) => {
    e.preventDefault();
    if (!adjustmentModal) return;

    const formData = new FormData(e.target);
    const movementType = formData.get("movementType");
    const quantity = Number(formData.get("quantity"));
    const notes = formData.get("notes")?.trim() || null;

    try {
      setSubmittingAdj(true);
      const res = await api.recordInventoryAdjustment({
        productId: adjustmentModal.productId,
        movementType,
        quantity,
        notes,
      });

      if (res.success) {
        setActionSuccess(res.message);
        setAdjustmentModal(null);
        fetchInventory();
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record stock movement");
    } finally {
      setSubmittingAdj(false);
    }
  };

  // Summaries
  const totalPhysical = inventoryList.reduce((acc, item) => acc + item.physicalQuantity, 0);
  const totalReserved = inventoryList.reduce((acc, item) => acc + item.reservedQuantity, 0);
  const totalAvailable = totalPhysical - totalReserved;
  const lowStockCount = inventoryList.filter((item) => item.isLowStock).length;

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-[#edf1f7] text-slate-800 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/60 shadow-2xs">
              <Box className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              Inventory & Material Stock Ledger
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
            Physical stock balances, order reservations, derived available stock, and immutable ledger movements
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && <ErrorAlert message={error} onRetry={activeTab === "stock" ? fetchInventory : fetchMovements} />}

      {/* Stock Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Physical Stock
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">
            {totalPhysical.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Warehouse storage count</span>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Reserved for Work Orders
          </span>
          <div className="text-2xl font-bold text-amber-600 mt-2 font-mono">
            {totalReserved.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Allocated to production</span>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-blue-200/80 bg-blue-50/20 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
            Free Available Stock
          </span>
          <div className="text-2xl font-bold text-blue-900 mt-2 font-mono">
            {totalAvailable.toLocaleString()}
          </div>
          <span className="text-[11px] text-blue-600 font-medium mt-1 block">
            Derived: Physical − Reserved
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Low-Stock Alert Items
          </span>
          <div className="text-2xl font-bold text-rose-600 mt-2 font-mono">
            {lowStockCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Below configured reorder level</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-3 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("stock")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition cursor-pointer border-b-2 ${
            activeTab === "stock"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Stock Balances ({inventoryList.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("movements")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition cursor-pointer border-b-2 ${
            activeTab === "movements"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Movement Ledger History ({movementsList.length})
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SKU, product name, category..."
            className="w-full bg-[#f8fafc] text-xs text-slate-800 placeholder-slate-400 pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
          />
        </div>

        {activeTab === "stock" && (
          <button
            type="button"
            onClick={() => setLowStockFilter(!lowStockFilter)}
            className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer shadow-2xs ${
              lowStockFilter
                ? "bg-rose-50 border-rose-300 text-rose-700"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Show Low Stock Only ({lowStockCount})</span>
          </button>
        )}
      </div>

      {/* Tab 1: Stock Balances Table */}
      {activeTab === "stock" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] overflow-hidden">
          {loading ? (
            <LoadingSkeleton rows={5} />
          ) : inventoryList.length === 0 ? (
            <EmptyState
              title="No inventory records found"
              message="Receive goods via GRN to establish inventory balances."
              icon={Box}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    <th className="py-3 px-4 font-semibold">SKU / CODE</th>
                    <th className="py-3 px-4 font-semibold">PRODUCT NAME</th>
                    <th className="py-3 px-4 font-semibold">LOCATION</th>
                    <th className="py-3 px-4 font-semibold text-right">PHYSICAL</th>
                    <th className="py-3 px-4 font-semibold text-right">RESERVED</th>
                    <th className="py-3 px-4 font-semibold text-right">AVAILABLE</th>
                    <th className="py-3 px-4 font-semibold text-right">REORDER LEVEL</th>
                    <th className="py-3 px-4 font-semibold">HEALTH</th>
                    <th className="py-3 px-4 font-semibold text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventoryList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-blue-600">
                        {item.product?.sku}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {item.product?.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {item.warehouseLocation}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-800 text-right">
                        {item.physicalQuantity}
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-600 text-right">
                        {item.reservedQuantity}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-900 text-right">
                        {item.availableQuantity}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-right">
                        {item.reorderLevel}
                      </td>
                      <td className="py-3 px-4">
                        {item.isLowStock ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-500" />
                            <span>Low Stock</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span>Adequate</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setAdjustmentModal(item)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold transition cursor-pointer text-[11px]"
                        >
                          Manage Stock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Movement Ledger History */}
      {activeTab === "movements" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] overflow-hidden">
          {loading ? (
            <LoadingSkeleton rows={5} />
          ) : movementsList.length === 0 ? (
            <EmptyState
              title="No movement ledger entries"
              message="All inbound receipts, work order reservations, and stock adjustments will be audited here."
              icon={History}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    <th className="py-3 px-4 font-semibold">DATE & TIME</th>
                    <th className="py-3 px-4 font-semibold">PRODUCT</th>
                    <th className="py-3 px-4 font-semibold">MOVEMENT TYPE</th>
                    <th className="py-3 px-4 font-semibold text-right">QUANTITY</th>
                    <th className="py-3 px-4 font-semibold">BATCH / LOT</th>
                    <th className="py-3 px-4 font-semibold">REFERENCE & NOTES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movementsList.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {new Date(m.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div>{m.product?.name}</div>
                        <span className="font-mono text-[10px] text-slate-400">{m.product?.sku}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            m.movementType === "STOCK_IN"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : m.movementType === "RESERVATION"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {m.movementType === "STOCK_IN" ? (
                            <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3 text-amber-600" />
                          )}
                          <span>{m.movementType}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 text-right">
                        {m.movementType === "STOCK_IN" ? `+${Number(m.quantity)}` : `${Number(m.quantity)}`}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {m.batchNumber || "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {m.notes || m.referenceType || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Stock Reservation / Adjustment Modal */}
      {adjustmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl p-6 text-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Stock Allocation & Ledger</h3>
                <span className="font-mono text-xs text-blue-600">
                  {adjustmentModal.product?.name} ({adjustmentModal.product?.sku})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAdjustmentModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordAdjustment} className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 grid grid-cols-2 gap-2 text-center">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Physical</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    {adjustmentModal.physicalQuantity}
                  </span>
                </div>
                <div>
                  <span className="text-blue-600 text-[10px] uppercase font-bold block">Available</span>
                  <span className="font-mono font-bold text-blue-900 text-sm">
                    {adjustmentModal.availableQuantity}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Movement Type</label>
                <select
                  name="movementType"
                  required
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="RESERVATION">Reserve Stock (for Work Order)</option>
                  <option value="RELEASE_RESERVATION">Release Reserved Stock</option>
                  <option value="ADJUSTMENT">Physical Adjustment (Cycle Count)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  required
                  placeholder="e.g. 50"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reason / Reference</label>
                <input
                  type="text"
                  name="notes"
                  placeholder="e.g. Work Order #WO-302 allocation"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAdjustmentModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdj}
                  className="px-5 py-2 rounded-xl bg-[#141d30] hover:bg-slate-800 text-white font-semibold transition cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {submittingAdj ? "Saving..." : "Record Movement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
