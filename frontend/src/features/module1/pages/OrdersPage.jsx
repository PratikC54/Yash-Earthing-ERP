import KpiSection from "../../../components/common/KpiSection";
import { useState, useEffect, useCallback } from "react";
import { Boxes, CheckCircle2, AlertTriangle, ArrowRight, Trash2 } from "lucide-react";
import FilterBar from "../components/FilterBar";
import CreateSalesOrderModal from "../components/CreateSalesOrderModal";
import InventoryCheckModal from "../components/InventoryCheckModal";
import module1Service from "../services/module1Service";
import { exportToExcel, importFromExcel } from "../utils/excelUtils";

export default function OrdersPage({ onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedQuoteForSO, setSelectedQuoteForSO] = useState(null);
  const [inventoryCheckResult, setInventoryCheckResult] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [orderRes, quoteRes] = await Promise.allSettled([
        module1Service.getOrders({ search: searchQuery, status: statusFilter }),
        module1Service.getQuotations({ limit: 50 }),
      ]);

      if (orderRes.status === "fulfilled" && orderRes.value?.success && orderRes.value?.data?.orders) {
        setOrders(orderRes.value.data.orders);
      }
      if (quoteRes.status === "fulfilled" && quoteRes.value?.success && quoteRes.value?.data?.quotations) {
        setQuotations(quoteRes.value.data.quotations);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create Sales Order (Sales Manager action)
  const handleCreateSalesOrder = async (orderData) => {
    try {
      const res = await module1Service.createSalesOrder(orderData);
      if (res?.success) {
        setIsCreateModalOpen(false);
        fetchData();
        alert(res.message);
      }
    } catch (err) {
      console.error("Create Sales Order error:", err);
      alert(err.response?.data?.message || "Failed to create Sales Order");
    }
  };

  // Check Inventory Stock
  const handleCheckInventory = async (orderId) => {
    try {
      const res = await module1Service.checkInventory(orderId);
      if (res?.success && res.data) {
        setInventoryCheckResult(res.data);
        fetchData();
      }
    } catch (err) {
      console.error("Check inventory error:", err);
      alert(err.response?.data?.message || "Failed to check inventory");
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
      Date: new Date(o.createdAt).toLocaleDateString(),
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
    <div className="min-h-full">
      {/* Workflow Process Strip */}
      <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-4 mb-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[11px]">
              1
            </span>
            <span className="font-semibold text-slate-200">Customer PO Issued (BO)</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[11px]">
              2
            </span>
            <span className="font-semibold text-slate-200">Sales Order Released (Sales Manager)</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold flex items-center justify-center text-[11px]">
              3
            </span>
            <span className="font-semibold text-slate-200">Standard Product Inventory Check</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[11px]">
              4
            </span>
            <span className="font-semibold text-emerald-400">Ready for Factory & Dispatch Desk</span>
          </div>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <KpiSection title="Sales Orders & Dispatch Overview" className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            CONFIRMED SALES ORDERS
          </div>
          <div className="text-3xl font-black text-white">{orders.length}</div>
          <div className="text-xs text-blue-400 mt-1">Authorized by Sales Manager</div>
        </div>

        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            TOTAL ORDER VALUE
          </div>
          <div className="text-3xl font-black text-emerald-400">
            {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
              totalValue
            )}
          </div>
          <div className="text-xs text-emerald-400/80 mt-1">Confirmed customer commitments</div>
        </div>

        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            INVENTORY STOCK RESERVED
          </div>
          <div className="text-3xl font-black text-cyan-400">{reservedCount}</div>
          <div className="text-xs text-cyan-400/80 mt-1">Standard products in stock</div>
        </div>

        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            READY FOR DISPATCH
          </div>
          <div className="text-3xl font-black text-amber-400">{readyDispatchCount}</div>
          <div className="text-xs text-amber-400/80 mt-1">Waiting dispatch handover</div>
        </div>
        </div>
      </KpiSection>

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

      {/* Table Card */}
      <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">
            Sales Orders & Dispatch Fulfilment Register
          </h3>
          <span className="text-xs text-slate-400">Authorized by Sales Manager</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0b1329] text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <th className="py-3 px-4">SO NUMBER</th>
                <th className="py-3 px-4">CUSTOMER / CLIENT</th>
                <th className="py-3 px-4">CUSTOMER PO REF</th>
                <th className="py-3 px-4">PRODUCT SUMMARY</th>
                <th className="py-3 px-4">TOTAL AMOUNT</th>
                <th className="py-3 px-4">INVENTORY STATUS</th>
                <th className="py-3 px-4">DISPATCH STATUS</th>
                <th className="py-3 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    Loading sales orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    No sales orders recorded yet. Click "Issue Sales Order" to release an order.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-300">{o.orderNumber}</td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-xs">{o.customer?.name || "Customer"}</div>
                      <div className="text-[10px] text-slate-400">{o.deliveryLocation}</div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">
                      {o.customerPONumber || "CPO Confirmed"}
                    </td>

                    <td className="py-3 px-4 text-slate-200">
                      <div>{o.productSummary || "GI Earthing Electrode"}</div>
                      <div className="text-[10px] text-slate-400">Qty: {o.quantitySummary || "1"}</div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-white">
                      ₹ {Number(o.grandTotal || o.totalAmount || 0).toFixed(2)}
                    </td>

                    <td className="py-3 px-4">
                      {o.stockReserved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Stock Reserved</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Stock Check Pending</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          o.dispatchStatus === "READY_FOR_DISPATCH"
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                            : "bg-blue-500/10 text-blue-300 border-blue-500/30"
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
                          onClick={() => handleCheckInventory(o.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          <Boxes className="w-3.5 h-3.5" />
                          <span>Check Inventory</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(o.id, o.orderNumber)}
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

      {/* Create Sales Order Modal */}
      <CreateSalesOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        quotation={selectedQuoteForSO}
        onSubmit={handleCreateSalesOrder}
      />

      {/* Inventory Stock Verification Modal */}
      <InventoryCheckModal
        isOpen={Boolean(inventoryCheckResult)}
        onClose={() => setInventoryCheckResult(null)}
        checkResult={inventoryCheckResult}
        onNavigate={onNavigate}
      />
    </div>
  );
}
