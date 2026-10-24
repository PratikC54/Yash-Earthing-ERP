import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Eye,
  Edit,
  X,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import productionService from "../services/productionService";
import CustomDropdown from "../../../components/common/CustomDropdown";
import {
  getTodayDateString,
  validatePastDate,
  validateQuantityInput,
} from "../utils/formValidation";

export const initialWorkOrders = [];

const getDefaultNewOrder = () => ({
  salesOrderId: "",
  productId: "",
  productName: "",
  bomReference: "",
  plannedQuantity: "",
  priority: "MEDIUM",
  assignedLine: "",
  plannedStartDate: "",
  plannedCompletionDate: "",
  status: "PLANNED",
});

export default function WorkOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewedOrder, setViewedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);

  const [newOrder, setNewOrder] = useState(getDefaultNewOrder);
  const [refData, setRefData] = useState({
    salesOrders: [],
    products: [],
    productionLines: [
      "Line A · Continuous Coating",
      "Line B · Automated Threading",
      "Line C · Finishing & Inspection",
      "Line D · Chemical Treatment",
    ],
  });

  useEffect(() => {
    async function fetchRefData() {
      try {
        const res = await productionService.getReferenceData();
        const data = res?.data || res;
        if (data && (data.salesOrders || data.products)) {
          setRefData((prev) => ({
            ...prev,
            ...data,
          }));
        }
      } catch (err) {
        console.error("Could not fetch reference data for work order form:", err);
      }
    }
    fetchRefData();
  }, []);

  const handleSelectSalesOrder = (soId) => {
    const found = refData.salesOrders.find((s) => String(s.id) === String(soId));
    if (found) {
      const firstItem = found.items?.[0];
      const matchedProd = firstItem ? refData.products.find((p) => String(p.id) === String(firstItem.productId)) : null;
      setNewOrder((prev) => ({
        ...prev,
        salesOrderId: found.id,
          productId: firstItem?.productId || matchedProd?.id || "",
          productName: firstItem?.productName || matchedProd?.name || "",
          plannedQuantity: firstItem?.quantity || prev.plannedQuantity,
          bomReference: matchedProd?.bomRevisions?.[0]?.revision || "",
      }));
    } else {
      setNewOrder((prev) => ({ ...prev, salesOrderId: soId }));
    }
  };

  const handleSelectProduct = (prodId) => {
    const found = refData.products.find((p) => String(p.id) === String(prodId));
    if (found) {
      setNewOrder((prev) => ({
        ...prev,
        productId: found.id,
        productName: found.name,
        bomReference: found.bomRevisions?.[0]?.revision || "",
      }));
    } else {
      setNewOrder((prev) => ({ ...prev, productId: prodId }));
    }
  };

  const loadWorkOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productionService.listWorkOrders({ limit: 100 });
      const rawList = res?.data || (Array.isArray(res) ? res : []);
      const normalized = rawList.map((item) => ({
        id: item.id,
        workOrderNumber: item.workOrderNo || "",
        productName:
          item.bomRevision?.product?.name ||
          item.items?.[0]?.product?.name ||
          item.salesOrder?.productSummary ||
          item.productName ||
          "",
        bomReference: item.bomRevision?.revision || "",
        plannedQuantity: Number(item.plannedQuantity || 0),
        producedQuantity: Number(item.goodQuantity ?? item.producedQuantity ?? 0),
        priority: item.priority || "",
        assignedLine: item.assignedLine || "",
        plannedStartDate: item.plannedStart
          ? new Date(item.plannedStart).toISOString().slice(0, 10)
          : "",
        plannedCompletionDate: item.plannedEnd
          ? new Date(item.plannedEnd).toISOString().slice(0, 10)
          : "",
        status: item.status || "",
        customer: item.salesOrder?.customer?.name || "",
      }));
      setOrders(normalized);
    } catch (err) {
      console.error("Failed to load work orders:", err);
      setError(err?.message || "Failed to load live work orders from the ERP server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkOrders();
  }, [loadWorkOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          o.workOrderNumber.toLowerCase().includes(q) ||
          o.productName.toLowerCase().includes(q) ||
          o.bomReference.toLowerCase().includes(q) ||
          o.assignedLine.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orders, statusFilter, searchTerm]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionError("");

    if (!newOrder.salesOrderId) {
      setActionError("Please select a Sales Order reference.");
      return;
    }

    if (!newOrder.productId) {
      setActionError("Please select a target Product.");
      return;
    }

    const qtyErr = validateQuantityInput(newOrder.plannedQuantity, {
      fieldName: "Planned quantity",
      allowZero: false,
    });
    if (qtyErr) {
      setActionError(qtyErr);
      return;
    }

    if (newOrder.plannedStartDate) {
      const startErr = validatePastDate(newOrder.plannedStartDate, "Planned start date");
      if (startErr) {
        setActionError(startErr);
        return;
      }
    }

    if (newOrder.plannedCompletionDate) {
      const endErr = validatePastDate(newOrder.plannedCompletionDate, "Planned completion date");
      if (endErr) {
        setActionError(endErr);
        return;
      }
    }

    if (newOrder.plannedStartDate && newOrder.plannedCompletionDate) {
      if (newOrder.plannedCompletionDate < newOrder.plannedStartDate) {
        setActionError("Planned completion date cannot be earlier than planned start date.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        salesOrderId: Number(newOrder.salesOrderId),
        productId: Number(newOrder.productId),
        plannedQuantity: Number(newOrder.plannedQuantity),
        priority: newOrder.priority || "MEDIUM",
        assignedLine: newOrder.assignedLine || null,
        notes: newOrder.productName,
      };
      if (newOrder.plannedStartDate) {
        payload.plannedStart = new Date(newOrder.plannedStartDate).toISOString();
      }
      if (newOrder.plannedCompletionDate) {
        payload.plannedEnd = new Date(newOrder.plannedCompletionDate).toISOString();
      }
      await productionService.createWorkOrder(payload);
      setIsCreateModalOpen(false);
      setNewOrder(getDefaultNewOrder());
      await loadWorkOrders();
    } catch (err) {
      setActionError(err?.message || "Failed to create work order on ERP server.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError("");
    try {
      await productionService.updateWorkOrder(editingOrder.id, {
        priority: editingOrder.priority,
        assignedLine: editingOrder.assignedLine || null,
        notes: editingOrder.productName,
        plannedQuantity: Number(editingOrder.plannedQuantity),
      });
      setEditingOrder(null);
      await loadWorkOrders();
    } catch (err) {
      setActionError(err?.message || "Failed to update work order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#10182f] border border-[#1e2a4a] p-5 sm:p-6 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30">
              MODULE 4 · WORK ORDERS
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#f1f5f9] tracking-tight">
            Work Order Management
          </h1>
          <p className="text-xs sm:text-sm text-[#94a3b8] mt-1">
            Create, schedule, track fabrication status, and inspect BOM material allocation.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#3b82f6] hover:bg-blue-600 text-white transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create Work Order</span>
        </button>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-4 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by WO#, Product, BOM..."
            className="w-full bg-[#0a1020] text-[#f1f5f9] placeholder-[#64748b] text-xs pl-9 pr-3 py-2 rounded-lg border border-[#1e2a4a] focus:outline-none focus:border-[#3b82f6]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
          {["ALL", "PLANNED", "IN_PROGRESS", "COMPLETED", "DRAFT"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                statusFilter === st
                  ? "bg-[#3b82f6] text-white"
                  : "bg-[#0a1020] text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-slate-800/40 border border-[#1e2a4a]"
              }`}
            >
              {st === "ALL" ? "All Orders" : st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert with Retry */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadWorkOrders}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-semibold cursor-pointer transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Main Work Orders Table with All Required Columns (Section 6) */}
      <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-md">
        <div className="overflow-x-auto rounded-xl border border-[#1e2a4a] scrollbar-thin">
          <table className="w-full text-left text-xs text-[#94a3b8]">
            <thead className="bg-[#0b1329] text-[#94a3b8] uppercase font-bold text-[10px] tracking-wider border-b border-[#1e2a4a]">
              <tr>
                <th className="py-3 px-3.5 whitespace-nowrap">WO Number</th>
                <th className="py-3 px-3.5">Product Name</th>
                <th className="py-3 px-3.5 whitespace-nowrap">BOM Reference</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Planned Qty</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Produced Qty</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Priority</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Assigned Line</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Start Date</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Completion Date</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Status</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a4a]">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-[#94a3b8]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-[#3b82f6]" />
                      <span className="text-xs">Loading live work orders from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-[#94a3b8]">
                    No work orders found matching the filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((wo) => {
                  const progress = wo.plannedQuantity > 0
                    ? Math.round((wo.producedQuantity / wo.plannedQuantity) * 100)
                    : 0;
                  return (
                    <tr
                      key={wo.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-3.5 font-mono font-bold text-[#f1f5f9] whitespace-nowrap">
                        <Link
                          to={`/pq/work-orders/${wo.id}`}
                          className="hover:text-[#3b82f6] hover:underline"
                        >
                          {wo.workOrderNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-3.5 text-[#f1f5f9] font-medium max-w-[220px] truncate" title={wo.productName}>
                        {wo.productName || "—"}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-[11px] text-[#94a3b8] whitespace-nowrap">
                        {wo.bomReference || "—"}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-semibold text-[#f1f5f9] whitespace-nowrap">
                        {wo.plannedQuantity.toLocaleString()}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-[#2DD4BF] whitespace-nowrap">
                        {wo.producedQuantity.toLocaleString()} ({progress}%)
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            wo.priority === "CRITICAL"
                              ? "bg-rose-500/20 text-[#F87171] border border-rose-500/40"
                              : wo.priority === "HIGH"
                              ? "bg-amber-500/20 text-[#FACC15] border border-amber-500/40"
                              : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                          }`}
                        >
                          {wo.priority || "—"}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap text-[#94a3b8]">
                        {wo.assignedLine || "—"}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-[11px] whitespace-nowrap">
                        {wo.plannedStartDate || "—"}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-[11px] whitespace-nowrap">
                        {wo.plannedCompletionDate || "—"}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold border ${
                            wo.status === "COMPLETED"
                              ? "bg-emerald-500/10 text-[#2DD4BF] border-emerald-500/30"
                              : wo.status === "IN_PROGRESS"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                              : wo.status === "CANCELLED"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                              : "bg-amber-500/10 text-[#FACC15] border-amber-500/30"
                          }`}
                        >
                          {wo.status || "—"}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/pq/work-orders/${wo.id}`}
                            title="View Full Details & Lifecycle Actions"
                            className="p-1.5 rounded-lg bg-[#0a1020] hover:bg-[#3b82f6] hover:text-white text-[#94a3b8] border border-[#1e2a4a] transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setViewedOrder(wo)}
                            title="Quick View"
                            className="p-1.5 rounded-lg bg-[#0a1020] hover:bg-[#3b82f6] hover:text-white text-[#94a3b8] border border-[#1e2a4a] transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingOrder(wo)}
                            title="Edit Work Order"
                            className="p-1.5 rounded-lg bg-[#0a1020] hover:bg-[#2DD4BF] hover:text-slate-900 text-[#94a3b8] border border-[#1e2a4a] transition cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Work Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#10182f] border border-[#1e2a4a] rounded-2xl shadow-2xl p-6 text-[#f1f5f9] space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2a4a] pb-3">
              <h3 className="text-base font-bold text-[#f1f5f9]">
                Create Work Order
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#94a3b8] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              {/* Sales Order Dropdown */}
              <div>
                <label className="block text-[#94a3b8] font-semibold mb-1">
                  Sales Order <span className="text-[#3b82f6] text-[10px]">(Choose Existing Order)</span>
                </label>
                <select
                  required
                  className="w-full bg-[#0a1020] border border-[#1e2a4a] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#3b82f6]"
                  value={newOrder.salesOrderId}
                  onChange={(e) => handleSelectSalesOrder(e.target.value)}
                >
                  <option value="">-- Select Confirmed Sales Order --</option>
                  {refData.salesOrders.map((so) => (
                    <option key={so.id} value={so.id}>
                      {so.orderNumber} · {so.customerName} ({so.items?.length || 0} items)
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Selection Dropdown */}
              <div>
                <label className="block text-[#94a3b8] font-semibold mb-1">
                  Product <span className="text-[#3b82f6] text-[10px]">(Choose Existing Catalog Product)</span>
                </label>
                <select
                  required
                  className="w-full bg-[#0a1020] border border-[#1e2a4a] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#3b82f6]"
                  value={newOrder.productId}
                  onChange={(e) => handleSelectProduct(e.target.value)}
                >
                  <option value="">-- Select Product --</option>
                  {refData.products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#94a3b8] font-semibold mb-1">
                    BOM Revision <span className="text-[#3b82f6] text-[10px]">(Existing BOM)</span>
                  </label>
                  <select
                    className="w-full bg-[#0a1020] border border-[#1e2a4a] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#3b82f6]"
                    value={newOrder.bomReference}
                    onChange={(e) =>
                      setNewOrder({ ...newOrder, bomReference: e.target.value })
                    }
                  >
                    <option value="">-- Select BOM Revision --</option>
                    {(() => {
                      const selectedProd = refData.products.find(
                        (p) => String(p.id) === String(newOrder.productId)
                      );
                      const boms = selectedProd?.bomRevisions || [];
                      if (boms.length === 0) {
                        return (
                          <>
                            <option value="BOM-REV-01">BOM-REV-01 (Default)</option>
                            <option value="BOM-REV-02">BOM-REV-02 (Heavy Duty)</option>
                          </>
                        );
                      }
                      return boms.map((b) => (
                        <option key={b.id} value={b.revision}>
                          {b.revision}
                        </option>
                      ));
                    })()}
                  </select>
                </div>
                <div>
                  <label className="block text-[#94a3b8] font-semibold mb-1">
                    Planned Quantity
                  </label>
                  <input
                    required
                    min="1"
                    type="number"
                    className="w-full bg-[#0a1020] border border-[#1e2a4a] rounded-lg px-3 py-2 text-xs text-[#f1f5f9]"
                    value={newOrder.plannedQuantity}
                    onChange={(e) =>
                      setNewOrder({
                        ...newOrder,
                        plannedQuantity: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <CustomDropdown
                    label="Assigned Production Line"
                    category="productionLine"
                    categoryLabel="Production Line"
                    options={refData.productionLines}
                    value={newOrder.assignedLine}
                    onChange={(val) =>
                      setNewOrder({ ...newOrder, assignedLine: val })
                    }
                    placeholder="-- Select Production Line --"
                  />
                </div>
                <div>
                  <label className="block text-[#94a3b8] font-semibold mb-1">
                    Priority
                  </label>
                  <select
                    className="w-full bg-[#0a1020] border border-[#1e2a4a] rounded-lg px-3 py-2 text-xs text-[#f1f5f9]"
                    value={newOrder.priority}
                    onChange={(e) =>
                      setNewOrder({ ...newOrder, priority: e.target.value })
                    }
                  >
                    <option value="">Select priority</option>
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#94a3b8] font-semibold mb-1">
                    Planned Start Date
                  </label>
                  <input
                    type="date"
                    min={getTodayDateString()}
                    className="w-full bg-[#0a1020] border border-[#1e2a4a] rounded-lg px-3 py-2 text-xs text-[#f1f5f9]"
                    value={newOrder.plannedStartDate}
                    onChange={(e) =>
                      setNewOrder({
                        ...newOrder,
                        plannedStartDate: e.target.value,
                      })
                    }
                  />
                  {newOrder.plannedStartDate && validatePastDate(newOrder.plannedStartDate) && (
                    <p className="text-[11px] text-rose-400 mt-0.5">
                      Past dates are not allowed. Please select today or a future date.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[#94a3b8] font-semibold mb-1">
                    Completion Date
                  </label>
                  <input
                    type="date"
                    min={newOrder.plannedStartDate || getTodayDateString()}
                    className="w-full bg-[#0a1020] border border-[#1e2a4a] rounded-lg px-3 py-2 text-xs text-[#f1f5f9]"
                    value={newOrder.plannedCompletionDate}
                    onChange={(e) =>
                      setNewOrder({
                        ...newOrder,
                        plannedCompletionDate: e.target.value,
                      })
                    }
                  />
                  {newOrder.plannedCompletionDate && validatePastDate(newOrder.plannedCompletionDate) && (
                    <p className="text-[11px] text-rose-400 mt-0.5">
                      Past dates are not allowed. Please select today or a future date.
                    </p>
                  )}
                </div>
              </div>

              {actionError && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="pt-3 border-t border-[#1e2a4a] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-[#94a3b8] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-[#3b82f6] hover:bg-blue-600 disabled:opacity-50 text-white cursor-pointer flex items-center gap-1.5"
                >
                  {submitting && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>Save & Issue Work Order</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Work Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#10182f] border border-[#1e2a4a] rounded-2xl shadow-2xl p-6 text-[#f1f5f9] space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2a4a] pb-3">
              <h3 className="text-base font-bold text-[#f1f5f9]">
                Edit {editingOrder.workOrderNumber}
              </h3>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="text-[#94a3b8] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#94a3b8] font-semibold mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  className="w-full bg-[#0a1020] border border-[#1e2a4a] rounded-lg px-3 py-2 text-xs text-[#f1f5f9]"
                  value={editingOrder.productName}
                  onChange={(e) =>
                    setEditingOrder({
                      ...editingOrder,
                      productName: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#94a3b8] font-semibold mb-1">
                    Produced Quantity
                  </label>
                  <input
                    type="number"
                    className="w-full bg-[#0a1020] border border-[#1e2a4a] rounded-lg px-3 py-2 text-xs text-[#f1f5f9]"
                    value={editingOrder.producedQuantity}
                    onChange={(e) =>
                      setEditingOrder({
                        ...editingOrder,
                        producedQuantity: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-[#94a3b8] font-semibold mb-1">
                    Status
                  </label>
                  <select
                    className="w-full bg-[#0a1020] border border-[#1e2a4a] rounded-lg px-3 py-2 text-xs text-[#f1f5f9]"
                    value={editingOrder.status}
                    onChange={(e) =>
                      setEditingOrder({
                        ...editingOrder,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="PLANNED">PLANNED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#94a3b8] font-semibold mb-1">
                  Assigned Production Line <span className="text-[#3b82f6] text-[10px]">(Existing Lines)</span>
                </label>
                <select
                  className="w-full bg-[#0a1020] border border-[#1e2a4a] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#3b82f6]"
                  value={editingOrder.assignedLine || ""}
                  onChange={(e) =>
                    setEditingOrder({
                      ...editingOrder,
                      assignedLine: e.target.value,
                    })
                  }
                >
                  <option value="">-- Select Production Line --</option>
                  {refData.productionLines.map((line) => (
                    <option key={line} value={line}>
                      {line}
                    </option>
                  ))}
                </select>
              </div>

              {actionError && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="pt-3 border-t border-[#1e2a4a] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-[#94a3b8] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-[#2DD4BF] text-slate-900 hover:bg-teal-300 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {submitting && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>Update Work Order</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Work Order Modal */}
      {viewedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-6 text-[#f1f5f9] space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1e2a4a] pb-3">
              <div>
                <span className="text-[10px] font-mono text-[#3b82f6] font-bold">
                  {viewedOrder.bomReference}
                </span>
                <h3 className="text-base font-bold text-[#f1f5f9]">
                  {viewedOrder.workOrderNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewedOrder(null)}
                className="text-[#94a3b8] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-[#f1f5f9] font-semibold">
                {viewedOrder.productName}
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div>
                  <span className="text-[#94a3b8]">Planned Qty:</span>
                  <p className="font-mono font-bold text-[#f1f5f9]">
                    {viewedOrder.plannedQuantity}
                  </p>
                </div>
                <div>
                  <span className="text-[#94a3b8]">Produced Qty:</span>
                  <p className="font-mono font-bold text-[#2DD4BF]">
                    {viewedOrder.producedQuantity}
                  </p>
                </div>
                <div>
                  <span className="text-[#94a3b8]">Assigned Line:</span>
                  <p className="text-[#f1f5f9]">{viewedOrder.assignedLine}</p>
                </div>
                <div>
                  <span className="text-[#94a3b8]">Status:</span>
                  <p className="text-[#3b82f6] font-bold">
                    {viewedOrder.status}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#1e2a4a] flex justify-end">
              <button
                type="button"
                onClick={() => setViewedOrder(null)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-[#3b82f6] text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
