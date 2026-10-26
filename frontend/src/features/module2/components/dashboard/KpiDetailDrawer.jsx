import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  X,
  Search,
  ShoppingCart,
  Layers,
  Clock,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Package,
  Calendar,
  Building2,
  FileText,
  RefreshCw,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import * as api from "../../api/procurementApi";

// Status configuration map for accurate visual badges
const STATUS_STYLES = {
  // Requisitions
  DRAFT: "bg-slate-700/50 text-slate-300 border-slate-600",
  SUBMITTED: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  APPROVED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  REJECTED: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  CONVERTED: "bg-blue-500/20 text-blue-300 border-blue-500/30",

  // RFQs
  SENT: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  QUOTATIONS_RECEIVED: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  EVALUATED: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  AWARDED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  CANCELLED: "bg-slate-700/50 text-slate-400 border-slate-600",

  // Purchase Orders
  PENDING_APPROVAL: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  PARTIALLY_RECEIVED: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  RECEIVED: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  CLOSED: "bg-slate-700/50 text-slate-400 border-slate-600",
};

export default function KpiDetailDrawer({
  isOpen,
  kpiKey,
  onClose,
  onNavigate,
  dashboardMetrics,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rawRecords, setRawRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch drawer detail records when opened or kpiKey changes
  const fetchDrawerRecords = useCallback(async () => {
    if (!kpiKey) return;
    setLoading(true);
    setError(null);
    setSearchQuery("");

    try {
      if (kpiKey === "open-prs") {
        // Backend listPurchaseRequests supports status query or fetches all with limit: 100
        const res = await api.getPurchaseRequests({ limit: 100 });
        const all = res?.data?.requests || res?.requests || [];
        // Reconcile with Dashboard definition: status in ["DRAFT", "SUBMITTED", "APPROVED"]
        const filtered = all.filter((r) =>
          ["DRAFT", "SUBMITTED", "APPROVED"].includes(r.status)
        );
        setRawRecords(filtered);
      } else if (kpiKey === "active-rfqs") {
        // Backend listRfqs supports limit: 100
        const res = await api.getRfqs({ limit: 100 });
        const all = res?.data?.rfqs || res?.rfqs || [];
        // Reconcile with Dashboard definition: status in ["SENT", "QUOTATIONS_RECEIVED", "EVALUATED"]
        const filtered = all.filter((r) =>
          ["SENT", "QUOTATIONS_RECEIVED", "EVALUATED"].includes(r.status)
        );
        setRawRecords(filtered);
      } else if (kpiKey === "pending-approvals") {
        // Backend listPurchaseOrders supports status filter
        const res = await api.getPurchaseOrders({
          status: "PENDING_APPROVAL",
          limit: 100,
        });
        const all = res?.data?.orders || res?.orders || [];
        setRawRecords(all.filter((o) => o.status === "PENDING_APPROVAL"));
      } else if (kpiKey === "open-po-value") {
        // Backend listPurchaseOrders: Dashboard definition status in ["APPROVED", "SENT", "PARTIALLY_RECEIVED"]
        const res = await api.getPurchaseOrders({ limit: 100 });
        const all = res?.data?.orders || res?.orders || [];
        const filtered = all.filter((o) =>
          ["APPROVED", "SENT", "PARTIALLY_RECEIVED"].includes(o.status)
        );
        setRawRecords(filtered);
      } else if (kpiKey === "overdue-pos") {
        // Backend listPurchaseOrders: status in ["APPROVED", "SENT", "PARTIALLY_RECEIVED"] and expectedDate < now
        const res = await api.getPurchaseOrders({ limit: 100 });
        const all = res?.data?.orders || res?.orders || [];
        const now = new Date();
        const filtered = all.filter(
          (o) =>
            ["APPROVED", "SENT", "PARTIALLY_RECEIVED"].includes(o.status) &&
            o.expectedDate &&
            new Date(o.expectedDate) < now
        );
        setRawRecords(filtered);
      } else if (kpiKey === "low-stock") {
        // Backend listInventory supports lowStockOnly: true and computes available = physical - reserved <= reorderLevel
        const res = await api.getInventory({ lowStockOnly: true, limit: 100 });
        const all = res?.data?.inventory || res?.inventory || [];
        setRawRecords(all);
      }
    } catch (err) {
      console.error("Error fetching KPI drawer records:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load drawer records. Please check connectivity."
      );
    } finally {
      setLoading(false);
    }
  }, [kpiKey]);

  useEffect(() => {
    if (isOpen) {
      fetchDrawerRecords();
    }
  }, [isOpen, fetchDrawerRecords]);

  // Client-side search filtering across supported fields
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return rawRecords;
    const q = searchQuery.toLowerCase().trim();

    return rawRecords.filter((rec) => {
      if (kpiKey === "open-prs") {
        const reqNo = rec.requestNo?.toLowerCase() || "";
        const notes = rec.notes?.toLowerCase() || "";
        const itemNames = (rec.items || [])
          .map((i) => i.product?.name?.toLowerCase() || "")
          .join(" ");
        return reqNo.includes(q) || notes.includes(q) || itemNames.includes(q);
      }
      if (kpiKey === "active-rfqs") {
        const rfqNo = rec.rfqNo?.toLowerCase() || "";
        const prNo = rec.purchaseRequest?.requestNo?.toLowerCase() || "";
        return rfqNo.includes(q) || prNo.includes(q);
      }
      if (
        kpiKey === "pending-approvals" ||
        kpiKey === "open-po-value" ||
        kpiKey === "overdue-pos"
      ) {
        const poNum = rec.poNumber?.toLowerCase() || "";
        const vName = rec.vendor?.name?.toLowerCase() || "";
        const vCode = rec.vendor?.code?.toLowerCase() || "";
        return poNum.includes(q) || vName.includes(q) || vCode.includes(q);
      }
      if (kpiKey === "low-stock") {
        const sku = rec.product?.sku?.toLowerCase() || "";
        const name = rec.product?.name?.toLowerCase() || "";
        return sku.includes(q) || name.includes(q);
      }
      return true;
    });
  }, [rawRecords, searchQuery, kpiKey]);

  // Calculate reconciled totals where applicable
  const reconciledFinancialTotal = useMemo(() => {
    if (kpiKey === "open-po-value" || kpiKey === "pending-approvals") {
      return rawRecords.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    }
    return 0;
  }, [rawRecords, kpiKey]);

  if (!isOpen) return null;

  // Metadata by KPI Key
  const KPI_METADATA = {
    "open-prs": {
      title: "Open Purchase Requisitions",
      subtitle: "Requisitions in pipeline awaiting RFQ or supplier quotation",
      icon: ShoppingCart,
      iconColor: "text-cyan-400 bg-blue-500/10 border-blue-500/20",
      targetModule: "purchase-requests",
      registerLabel: "Go to Requisitions Register",
      dashboardExpected: dashboardMetrics?.procurement?.openRequisitions,
    },
    "active-rfqs": {
      title: "Active Requests for Quotation (RFQs)",
      subtitle: "RFQs sent to vendors or under commercial evaluation",
      icon: Layers,
      iconColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      targetModule: "purchase-requests",
      registerLabel: "Go to RFQ Register",
      dashboardExpected: dashboardMetrics?.procurement?.activeRfqs,
    },
    "pending-approvals": {
      title: "Pending Purchase Order Approvals",
      subtitle: "Orders drafted and awaiting management sign-off",
      icon: Clock,
      iconColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      targetModule: "purchase-orders",
      registerLabel: "Go to PO Register",
      dashboardExpected: dashboardMetrics?.procurement?.pendingApprovals,
    },
    "open-po-value": {
      title: "Committed Open Purchase Orders",
      subtitle: "Legally issued orders currently in transit or partial delivery",
      icon: TrendingUp,
      iconColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      targetModule: "purchase-orders",
      registerLabel: "Go to PO Register",
      dashboardExpected: dashboardMetrics?.procurement?.openPoValue,
      isCurrency: true,
    },
    "overdue-pos": {
      title: "Overdue Purchase Deliveries",
      subtitle: "Orders where expected delivery date has passed without complete receipt",
      icon: AlertTriangle,
      iconColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      targetModule: "purchase-orders",
      registerLabel: "Go to PO Register",
      dashboardExpected: dashboardMetrics?.procurement?.overduePurchases,
    },
    "low-stock": {
      title: "Critical & Low Stock Items",
      subtitle: "Raw materials and products where available stock is below reorder level",
      icon: Package,
      iconColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      targetModule: "inventory",
      registerLabel: "Go to Stock Ledger",
      dashboardExpected: dashboardMetrics?.inventory?.lowStockItemCount,
    },
  };

  const meta = KPI_METADATA[kpiKey] || {
    title: "KPI Detail",
    subtitle: "Underlying audit records",
    icon: FileText,
    iconColor: "text-cyan-400 bg-blue-500/10 border-blue-500/20",
    targetModule: "purchase-orders",
    registerLabel: "Go to Module Register",
  };

  const IconComponent = meta.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-2xs transition-all animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#10182f] border-l border-[#1e2a4a] text-slate-100 w-full max-w-xl h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs ${meta.iconColor}`}
              >
                <IconComponent className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight leading-snug">
                  {meta.title}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 leading-tight">
                  {meta.subtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close drawer (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Metric Summary Bar */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-medium">Reconciled Count:</span>
              <span className="font-mono font-bold text-cyan-300 bg-blue-950/60 border border-blue-500/30 px-2 py-0.5 rounded-md">
                {rawRecords.length} records
              </span>
            </div>

            {meta.isCurrency && (
              <div className="flex items-center space-x-2">
                <span className="text-slate-400 font-medium">Total Value:</span>
                <span className="font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-0.5 rounded-md">
                  ₹{reconciledFinancialTotal.toLocaleString()}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={fetchDrawerRecords}
              className="p-1 rounded text-slate-400 hover:text-cyan-300 transition cursor-pointer"
              title="Refresh Drawer Records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            </button>
          </div>

          {/* Search Box */}
          <div className="mt-3 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, name, vendor, or item..."
              className="w-full bg-[#0a1020] border border-slate-700/80 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-[11px] text-slate-400 hover:text-white absolute right-3 top-2 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Middle Content List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-[#0a1020] border border-slate-800 animate-pulse space-y-2.5"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-28 bg-slate-700/60 rounded" />
                    <div className="h-4 w-16 bg-slate-700/60 rounded-full" />
                  </div>
                  <div className="h-3 w-40 bg-slate-800/80 rounded" />
                  <div className="h-3 w-2/3 bg-slate-800/60 rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs text-center space-y-2">
              <p className="font-semibold">{error}</p>
              <button
                type="button"
                onClick={fetchDrawerRecords}
                className="px-3 py-1 bg-rose-900/50 hover:bg-rose-900 rounded-lg text-white font-medium transition cursor-pointer"
              >
                Retry Fetch
              </button>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <Package className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-medium text-slate-300">
                {searchQuery
                  ? "No matching records found for your search."
                  : "No active records found for this KPI."}
              </p>
              <p className="text-[11px] text-slate-500">
                All workflows in this category are up to date.
              </p>
            </div>
          ) : (
            filteredRecords.map((item) => {
              // Card rendering by KPI Type
              if (kpiKey === "open-prs") {
                const totalUnits = (item.items || []).reduce(
                  (s, i) => s + (Number(i.quantity) || 0),
                  0
                );
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-[#0a1020] border border-slate-800 hover:border-blue-500/40 transition-colors space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm font-bold text-cyan-300">
                          {item.requestNo}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            STATUS_STYLES[item.status] || "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>

                    {item.notes && (
                      <p className="text-xs text-slate-300 italic line-clamp-1">
                        "{item.notes}"
                      </p>
                    )}

                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 flex items-center justify-between">
                      <span>
                        Items:{" "}
                        <strong className="text-slate-200">
                          {item.items?.length || 0} SKU(s)
                        </strong>{" "}
                        ({totalUnits} Total Units)
                      </span>
                      {item.requiredBy && (
                        <span>
                          Required by:{" "}
                          <strong className="text-amber-300">
                            {new Date(item.requiredBy).toLocaleDateString()}
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>
                );
              }

              if (kpiKey === "active-rfqs") {
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-[#0a1020] border border-slate-800 hover:border-indigo-500/40 transition-colors space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm font-bold text-indigo-300">
                          {item.rfqNo}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            STATUS_STYLES[item.status] || "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300">
                      {item.purchaseRequest ? (
                        <span>
                          Linked PR:{" "}
                          <strong className="text-cyan-300 font-mono">
                            {item.purchaseRequest.requestNo}
                          </strong>
                        </span>
                      ) : (
                        <span className="text-slate-500">Standalone RFQ</span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 flex items-center justify-between">
                      <span>
                        Vendor Bids:{" "}
                        <strong className="text-slate-200">
                          {item._count?.responses || item.responses?.length || 0} received
                        </strong>
                      </span>
                      {item.dueAt && (
                        <span>
                          Due Date:{" "}
                          <strong className="text-amber-300 font-mono">
                            {new Date(item.dueAt).toLocaleDateString()}
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>
                );
              }

              if (
                kpiKey === "pending-approvals" ||
                kpiKey === "open-po-value" ||
                kpiKey === "overdue-pos"
              ) {
                const totalAmt = Number(item.total) || 0;
                const isOverdue =
                  item.expectedDate && new Date(item.expectedDate) < new Date();
                const daysOverdue = isOverdue
                  ? Math.floor(
                      (new Date() - new Date(item.expectedDate)) /
                        (1000 * 60 * 60 * 24)
                    )
                  : 0;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-[#0a1020] border border-slate-800 hover:border-emerald-500/40 transition-colors space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm font-bold text-white">
                          {item.poNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            STATUS_STYLES[item.status] || "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        ₹{totalAmt.toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 flex items-center space-x-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-200">
                        {item.vendor?.name || `Vendor #${item.vendorId}`}
                      </span>
                      {item.vendor?.code && (
                        <span className="text-[10px] font-mono text-cyan-300">
                          ({item.vendor.code})
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 flex items-center justify-between">
                      <span>
                        Created:{" "}
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : "—"}
                      </span>

                      {item.expectedDate && (
                        <span>
                          Expected:{" "}
                          <strong
                            className={
                              isOverdue ? "text-rose-400 font-bold" : "text-slate-300"
                            }
                          >
                            {new Date(item.expectedDate).toLocaleDateString()}
                          </strong>
                          {isOverdue && (
                            <span className="text-rose-400 ml-1 font-bold">
                              ({daysOverdue}d late)
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }

              if (kpiKey === "low-stock") {
                const physical = Number(item.physicalQuantity) || 0;
                const reserved = Number(item.reservedQuantity) || 0;
                const available = Number(item.availableQuantity ?? physical - reserved);
                const reorder = Number(item.reorderLevel) || 0;
                const isZero = available <= 0;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-[#0a1020] border border-slate-800 hover:border-amber-500/40 transition-colors space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold text-amber-300">
                          {item.product?.sku}
                        </span>
                        <h4 className="text-xs font-semibold text-white mt-0.5">
                          {item.product?.name}
                        </h4>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          isZero
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {isZero ? "OUT OF STOCK" : "REORDER NEEDED"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1 border-t border-slate-800/80">
                      <div className="p-1.5 rounded-lg bg-slate-900">
                        <span className="text-slate-400 block text-[9px] uppercase">
                          Physical
                        </span>
                        <span className="font-mono font-bold text-white">
                          {physical} {item.product?.unitOfMeasure || "UOM"}
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-900">
                        <span className="text-slate-400 block text-[9px] uppercase">
                          Reserved
                        </span>
                        <span className="font-mono font-bold text-amber-400">
                          {reserved}
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-amber-950/30 border border-amber-500/20">
                        <span className="text-amber-400 block text-[9px] uppercase font-bold">
                          Free Stock
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            isZero ? "text-rose-400" : "text-amber-300"
                          }`}
                        >
                          {available} vs {reorder} Min
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              return null;
            })
          )}
        </div>

        {/* Bottom Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-[#0c1427] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onNavigate) {
                onNavigate(meta.targetModule);
              }
            }}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition cursor-pointer shadow-md"
          >
            <span>{meta.registerLabel}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

