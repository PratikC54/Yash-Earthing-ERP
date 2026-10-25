import KpiSection from "../../../components/common/KpiSection";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Boxes, CheckCircle2, AlertTriangle, ArrowRight, Trash2, Loader2, ShoppingCart, Clock } from "lucide-react";
import FilterBar from "../components/FilterBar";
import CreateSalesOrderModal from "../components/CreateSalesOrderModal";
import InventoryCheckModal from "../components/InventoryCheckModal";
import Module1TodoWidget from "../components/Module1TodoWidget";
import module1Service from "../services/module1Service";
import { exportToExcel, importFromExcel } from "../utils/excelUtils";

export default function OrdersPage({ onNavigate, globalSearch = "" }) {
  const [orders, setOrders] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState(globalSearch || "");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    if (globalSearch !== undefined && globalSearch !== null) {
      setSearchQuery(globalSearch);
    }
  }, [globalSearch]);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedQuoteForSO, setSelectedQuoteForSO] = useState(null);

  // Instant Inventory Check Modal state
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isInventoryLoading, setIsInventoryLoading] = useState(false);
  const [checkingOrderId, setCheckingOrderId] = useState(null);
  const [inventoryCheckResult, setInventoryCheckResult] = useState(null);

  const fetchOrders = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setError("");
    try {
      const orderRes = await module1Service.getOrders({ limit: 150 });
      if (orderRes?.success && orderRes?.data?.orders) {
        setOrders(orderRes.data.orders);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load sales orders. Check the server and database connection, then retry."
      );
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  const fetchQuotations = useCallback(async () => {
    try {
      const quoteRes = await module1Service.getQuotations({ limit: 50 });
      if (quoteRes?.success && quoteRes?.data?.quotations) {
        setQuotations(quoteRes.data.quotations);
      }
    } catch (err) {
      console.warn("Failed to fetch quotations for SO creation:", err);
    }
  }, []);

  const fetchData = useCallback(() => {
    fetchOrders(false);
  }, [fetchOrders]);

  useEffect(() => {
    fetchOrders(true);
  }, [fetchOrders]);

  useEffect(() => {
    if (isCreateModalOpen && quotations.length === 0) {
      fetchQuotations();
    }
  }, [isCreateModalOpen, quotations.length, fetchQuotations]);

  // Debounced background sync for remote orders
  useEffect(() => {
    const term = searchQuery.trim();
    if (!term || term.length < 2) return;

    const timer = setTimeout(async () => {
      try {
        const res = await module1Service.getOrders({ search: term });
        if (res?.success && Array.isArray(res?.data?.orders)) {
          setOrders((prev) => {
            const existingIds = new Set(prev.map((o) => o.id));
            const newRecords = res.data.orders.filter((o) => !existingIds.has(o.id));
            return newRecords.length > 0 ? [...newRecords, ...prev] : prev;
          });
        }
      } catch (err) {
        console.warn("Background order search:", err);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Zero-latency instant in-memory filtering (0ms)
  const displayedOrders = useMemo(() => {
    let result = orders;

    if (statusFilter && statusFilter !== "ALL") {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((o) =>
        (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
        (o.customerPONumber && o.customerPONumber.toLowerCase().includes(q)) ||
        (o.customer?.name && o.customer.name.toLowerCase().includes(q)) ||
        (o.items && o.items.some((i) => i.productName && i.productName.toLowerCase().includes(q)))
      );
    }

    return result;
  }, [orders, statusFilter, searchQuery]);

  // Create Sales Order (Sales Manager action)
  const handleCreateSalesOrder = async (orderData) => {
    try {
      const res = await module1Service.createSalesOrder(orderData);
      if (res?.success) {
        setIsCreateModalOpen(false);
        await fetchData();
        alert(res.message || "Sales Order issued and released successfully!");
      }
    } catch (err) {
      console.error("Create Sales Order error:", err);
      alert(err.response?.data?.message || "Failed to create Sales Order");
      throw err;
    }
  };

  // Instant Check Inventory Stock (with instant modal display & quick backend resolution)
  const handleCheckInventory = async (order) => {
    setCheckingOrderId(order.id);
    setIsInventoryLoading(true);
    // Open immediately with initial order context to give 0ms instant feedback
    setInventoryCheckResult({
      orderNumber: order.orderNumber,
      orderId: order.id,
      stockReserved: order.stockReserved,
      dispatchStatus: order.dispatchStatus,
      items: [],
      checkedAt: new Date().toISOString(),
    });
    setIsInventoryModalOpen(true);

    try {
      const res = await module1Service.checkInventory(order.id);
      if (res?.success && res.data) {
        setInventoryCheckResult(res.data);
        fetchData();
      }
    } catch (err) {
      console.error("Check inventory error:", err);
      alert(err.response?.data?.message || "Failed to check inventory");
    } finally {
      setIsInventoryLoading(false);
      setCheckingOrderId(null);
    }
  };

  // Delete Order
  const handleDeleteOrder = async (id, orderNumber) => {
    if (!confirm(`Are you sure you want to delete Sales Order ${orderNumber}?`)) return;
    try {
      await module1Service.deleteSalesOrder(id);
      fetchData();
    } catch (err) {
      console.error("Delete order error:", err);
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    const exportData = orders.map((o) => ({
      "Order Number": o.orderNumber,
      Customer: o.customer?.name || "",
      "Customer PO": o.customerPONumber || "",
      "Quote Ref": o.quotation?.quotationNo || "",
      Product: o.productSummary || "GI Earthing Electrode",
      Qty: o.quantitySummary || "1",
      "Total Amount (INR)": Number(o.totalAmount || 0),
      "Stock Reserved": o.stockReserved ? "Yes" : "No",
      "Dispatch Status": o.dispatchStatus,
      "Issued By": o.createdBy?.name || "Sales Manager",
      "Created Date & Time": new Date(o.createdAt).toLocaleString("en-IN"),
    }));
    exportToExcel(exportData, "Yash_Sales_Orders_Register", "SalesOrders");
  };

  const handleImportExcel = (file) => {
    importFromExcel(file, (data) => {
      alert(`Imported ${data.length} orders. (Demo simulation)`);
    });
  };

  // KPIs
  const totalValue = orders.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);
  const reservedCount = orders.filter((o) => o.stockReserved).length;
  const readyDispatchCount = orders.filter((o) => o.dispatchStatus === "READY_FOR_DISPATCH").length;

  return (
    <div className="flex flex-col min-h-full space-y-4">
      {/* Workflow Process Strip */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[11px] shadow-xs">
              1
            </span>
            <span className="font-bold text-slate-800">Customer PO Issued (BO)</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 hidden sm:block" />
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[11px] shadow-xs">
              2
            </span>
            <span className="font-bold text-slate-800">Sales Order Released (Sales Manager)</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 hidden sm:block" />
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold flex items-center justify-center text-[11px] shadow-xs">
              3
            </span>
            <span className="font-bold text-slate-800">Standard Product Inventory Check</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 hidden sm:block" />
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[11px] shadow-xs">
              4
            </span>
            <span className="font-bold text-emerald-800">Ready for Factory & Dispatch Desk</span>
          </div>
        </div>
      </div>

      {/* Mobile-first reordering: KPIs & FilterBar below table on mobile */}
      <div className="order-2 md:order-1">
      {error && (
        <div
          role="alert"
          className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => fetchOrders(true)}
            disabled={loading}
            className="shrink-0 rounded-lg border border-rose-500/30 px-3 py-1.5 font-semibold hover:bg-rose-500/10 disabled:opacity-50"
          >
            {loading ? "Retrying..." : "Retry"}
          </button>
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            CONFIRMED SALES ORDERS
          </div>
          {loading ? (
            <div className="h-8 w-16 bg-slate-200/80 rounded animate-pulse my-1" />
          ) : (
            <div className="text-3xl font-black text-slate-900">{orders.length}</div>
          )}
          {loading ? (
            <div className="h-3 w-32 bg-slate-200/60 rounded animate-pulse mt-1" />
          ) : (
            <div className="text-xs text-blue-700 font-semibold mt-1">Authorized by Sales Manager</div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            TOTAL ORDER VALUE
          </div>
          {loading ? (
            <div className="h-8 w-24 bg-slate-200/80 rounded animate-pulse my-1" />
          ) : (
            <div className="text-3xl font-black text-emerald-700">
              {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
                totalValue
              )}
            </div>
          )}
          {loading ? (
            <div className="h-3 w-36 bg-slate-200/60 rounded animate-pulse mt-1" />
          ) : (
            <div className="text-xs text-slate-600 font-medium mt-1">Confirmed customer commitments</div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            INVENTORY STOCK RESERVED
          </div>
          {loading ? (
            <div className="h-8 w-16 bg-slate-200/80 rounded animate-pulse my-1" />
          ) : (
            <div className="text-3xl font-black text-cyan-700">{reservedCount}</div>
          )}
          {loading ? (
            <div className="h-3 w-32 bg-slate-200/60 rounded animate-pulse mt-1" />
          ) : (
            <div className="text-xs text-cyan-800 font-medium mt-1">Standard products in stock</div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            READY FOR DISPATCH
          </div>
          {loading ? (
            <div className="h-8 w-16 bg-slate-200/80 rounded animate-pulse my-1" />
          ) : (
            <div className="text-3xl font-black text-amber-600">{readyDispatchCount}</div>
          )}
          {loading ? (
            <div className="h-3 w-32 bg-slate-200/60 rounded animate-pulse mt-1" />
          ) : (
            <div className="text-xs text-amber-800 font-medium mt-1">Waiting dispatch handover</div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search orders by SO number, customer, PO..."
        filters={[
          {
            id: "status",
            value: statusFilter,
            options: [
              { value: "ALL", label: "All Dispatch Statuses" },
              { value: "WAITING_APPROVAL", label: "Waiting Approval" },
              { value: "READY_FOR_FACTORY", label: "Ready for Factory" },
              { value: "PACKING", label: "Packing" },
              { value: "READY_FOR_DISPATCH", label: "Ready for Dispatch" },
              { value: "DISPATCHED", label: "Dispatched" },
            ],
          },
        ]}
        onFilterChange={(_, val) => setStatusFilter(val)}
        onExportExcel={handleExportExcel}
        onImportExcel={handleImportExcel}
        primaryActionLabel="Issue Sales Order"
        onPrimaryAction={() => {
          setSelectedQuoteForSO(quotations[0] || null);
          setIsCreateModalOpen(true);
        }}
      />
      </div>

      {/* Main Content Area: Data Table on Left & To-Do Widget on Right */}
      <div className="order-1 md:order-2 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 xl:col-span-9">
      {/* Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center space-x-2.5">
            <h3 className="text-sm font-black text-slate-900 tracking-wide uppercase">
              Sales Orders & Dispatch Fulfilment Register
            </h3>
            {loading && (
              <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 font-semibold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Refreshing...</span>
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 font-medium">Authorized by Sales Manager</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">SO NUMBER & DATE</th>
                <th className="py-3 px-4">CUSTOMER / CLIENT</th>
                <th className="py-3 px-4">CUSTOMER PO REF</th>
                <th className="py-3 px-4">PRODUCT SUMMARY</th>
                <th className="py-3 px-4">TOTAL AMOUNT</th>
                <th className="py-3 px-4">INVENTORY STATUS</th>
                <th className="py-3 px-4">DISPATCH STATUS</th>
                <th className="py-3 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && orders.length === 0 ? (
                Array.from({ length: 5 }).map((_, rIdx) => (
                  <tr key={`skel-ord-${rIdx}`} className="animate-pulse">
                    <td className="py-3 px-4"><div className="h-4 w-28 bg-slate-200/80 rounded mb-1" /><div className="h-3 w-20 bg-slate-200/60 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-32 bg-slate-200/80 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-24 bg-slate-200/60 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-40 bg-slate-200/60 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-16 bg-slate-200/80 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-5 w-20 bg-slate-200/70 rounded-full" /></td>
                    <td className="py-3 px-4"><div className="h-5 w-24 bg-slate-200/70 rounded-full" /></td>
                    <td className="py-3 px-4 text-center"><div className="h-4 w-12 bg-slate-200/60 rounded mx-auto" /></td>
                  </tr>
                ))
              ) : displayedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-slate-800 text-sm">No sales orders found</div>
                      <p className="text-xs text-slate-500 max-w-sm">
                        No orders match your search or filter criteria. Click "Issue Sales Order" above to release and authorize an approved quotation.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition text-slate-800">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900 text-xs">{o.orderNumber}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400 inline shrink-0" />
                        <span>
                          {o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }) : "—"}{" "}
                          ·{" "}
                          {o.createdAt ? new Date(o.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          }) : "—"}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-xs">{o.customer?.name || "Customer"}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{o.deliveryLocation}</div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {o.customerPONumber || "CPO Confirmed"}
                    </td>

                    <td className="py-3 px-4 text-slate-800">
                      <div className="font-medium">{o.productSummary || "GI Earthing Electrode"}</div>
                      <div className="text-[11px] text-slate-500 font-semibold font-mono">Qty: {o.quantitySummary || "1"}</div>
                    </td>

                    <td className="py-3 px-4 font-mono font-black text-slate-900">
                      ₹ {Number(o.grandTotal || o.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-4">
                      {o.stockReserved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Stock Reserved</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Stock Check Pending</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          o.dispatchStatus === "READY_FOR_DISPATCH"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-blue-100 text-blue-800 border-blue-300"
                        }`}
                      >
                        {o.dispatchStatus?.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Check Inventory Button */}
                        <button
                          type="button"
                          disabled={checkingOrderId === o.id}
                          onClick={() => handleCheckInventory(o)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {checkingOrderId === o.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-800" />
                              <span>Checking...</span>
                            </>
                          ) : (
                            <>
                              <Boxes className="w-3.5 h-3.5 text-slate-600" />
                              <span>Check Inventory</span>
                            </>
                          )}
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(o.id, o.orderNumber)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete Order"
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
        <div className="lg:col-span-4 xl:col-span-3">
          <Module1TodoWidget title="Order & Dispatch Actions" pageType="orders" items={displayedOrders} />
        </div>
      </div>

      {/* Create Sales Order Modal */}
      <CreateSalesOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        quotation={selectedQuoteForSO || quotations[0]}
        availableQuotations={quotations}
        onSelectQuotation={setSelectedQuoteForSO}
        isLoading={loading && quotations.length === 0}
        onSubmit={handleCreateSalesOrder}
      />

      {/* Inventory Stock Verification Modal with instant loading */}
      <InventoryCheckModal
        isOpen={isInventoryModalOpen}
        onClose={() => {
          setIsInventoryModalOpen(false);
          setInventoryCheckResult(null);
        }}
        isLoading={isInventoryLoading}
        checkResult={inventoryCheckResult}
        onNavigate={onNavigate}
      />
      </div>
    </div>
  );
}
