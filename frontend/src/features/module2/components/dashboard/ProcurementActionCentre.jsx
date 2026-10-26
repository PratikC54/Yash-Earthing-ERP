import React, { useState, useMemo } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  ShoppingCart,
  Layers,
  ShieldCheck,
  Package,
  Zap,
  Filter,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

export default function ProcurementActionCentre({
  actionCentreData = {},
  onNavigate,
  onOpenRestock,
  currentUserRole = "ADMIN", // Fallback to ADMIN for complete managerial oversight
}) {
  const [filterMode, setFilterMode] = useState("all"); // "all" | "my-tasks" | "urgent"

  // Flatten and structure all real dynamic tasks
  const allTasks = useMemo(() => {
    const list = [];

    // 1. Submitted PRs requiring RFQ/buyer review
    (actionCentreData.submittedRequisitions || []).forEach((pr) => {
      list.push({
        id: `PR-${pr.id}`,
        title: pr.title || `Purchase Request ${pr.requestNo} awaiting review`,
        reason: "Requisition submitted by engineering/stores. Ready for vendor quotation broadcast.",
        urgency: "HIGH",
        targetRole: "PROCUREMENT_OFFICER",
        targetModule: "purchase-requests",
        targetId: pr.id,
        actionLabel: "Review Requisition",
        icon: ShoppingCart,
        iconColor: "text-cyan-400 bg-blue-500/10 border-blue-500/20",
      });
    });

    // 2. Overdue RFQs
    (actionCentreData.overdueRfqs || []).forEach((rfq) => {
      list.push({
        id: `RFQ-${rfq.id}`,
        title: rfq.title || `RFQ ${rfq.rfqNo} passed deadline`,
        reason: "Supplier submission window has closed. Ready for price comparison (C-Sheet).",
        urgency: "CRITICAL",
        targetRole: "PROCUREMENT_OFFICER",
        targetModule: "purchase-requests",
        targetId: rfq.id,
        actionLabel: "Evaluate Quotations",
        icon: Layers,
        iconColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      });
    });

    // 3. Pending PO Approvals
    (actionCentreData.pendingApprovalOrders || []).forEach((po) => {
      list.push({
        id: `PO-${po.id}`,
        title: po.title || `PO ${po.poNumber} pending authorization`,
        reason: "Commercial terms drafted above standard buyer limit. Awaiting Director/Admin sign-off.",
        urgency: "HIGH",
        targetRole: "ADMIN",
        targetModule: "purchase-orders",
        targetId: po.id,
        actionLabel: "Authorize PO",
        icon: Clock,
        iconColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      });
    });

    // 4. Receipts Pending Inspection (QC)
    (actionCentreData.pendingInspectionReceipts || []).forEach((grn) => {
      list.push({
        id: `GRN-${grn.id}`,
        title: grn.title || `GRN ${grn.grnNumber} pending quality inspection`,
        reason: "Goods arrived at warehouse. Material quarantined pending metallurgical/dimensional check.",
        urgency: "MEDIUM",
        targetRole: "FACTORY_INWARD_OFFICER",
        targetModule: "goods-receipts",
        targetId: grn.id,
        actionLabel: "Perform QC Check",
        icon: ShieldCheck,
        iconColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      });
    });

    // 5. Critical Low Stock Items
    (actionCentreData.criticalLowStockWarnings || []).forEach((item) => {
      list.push({
        id: `STOCK-${item.productId || item.id}`,
        title: item.title || `Low Stock: ${item.name}`,
        reason: item.existingPr
          ? `Available stock is low, but Requisition ${item.existingPr.requestNo} is already in progress.`
          : `Available stock (${item.availableQuantity}) is at or below minimum buffer (${item.reorderLevel}).`,
        urgency: "CRITICAL",
        targetRole: "PROCUREMENT_OFFICER",
        targetModule: "inventory",
        targetId: item.productId || item.id,
        actionLabel: item.existingPr ? "View Open PR" : "⚡ Restock Now",
        isRestockAction: !item.existingPr,
        existingPr: item.existingPr,
        rawItem: item,
        icon: Package,
        iconColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      });
    });

    return list;
  }, [actionCentreData]);

  // Filter tasks based on active pill
  const filteredTasks = useMemo(() => {
    if (filterMode === "urgent") {
      return allTasks.filter((t) => t.urgency === "CRITICAL");
    }
    if (filterMode === "my-tasks") {
      // Admin sees everything; other roles see their specific role responsibilities
      if (currentUserRole === "ADMIN") return allTasks;
      return allTasks.filter(
        (t) =>
          t.targetRole === currentUserRole ||
          (currentUserRole === "PROCUREMENT_OFFICER" && t.targetRole !== "ADMIN")
      );
    }
    return allTasks;
  }, [allTasks, filterMode, currentUserRole]);

  return (
    <div className="bg-[#10182f] rounded-2xl p-5 border border-[#1e2a4a] shadow-lg space-y-4">
      {/* Header with Title and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
          <h3 className="text-sm font-bold text-white tracking-tight">
            Procurement Action Centre
          </h3>
          <span className="text-[11px] font-mono font-bold bg-blue-950/60 border border-blue-500/30 text-cyan-300 px-2 py-0.5 rounded-full">
            {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1 rounded-xl font-semibold transition cursor-pointer text-[11px] ${
              filterMode === "all"
                ? "bg-cyan-500 text-slate-950 shadow-xs"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            All Actions ({allTasks.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("my-tasks")}
            className={`px-3 py-1 rounded-xl font-semibold transition cursor-pointer text-[11px] ${
              filterMode === "my-tasks"
                ? "bg-cyan-500 text-slate-950 shadow-xs"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            My Role Tasks
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("urgent")}
            className={`px-3 py-1 rounded-xl font-semibold transition cursor-pointer text-[11px] ${
              filterMode === "urgent"
                ? "bg-rose-500 text-white shadow-xs"
                : "bg-slate-800 text-slate-400 hover:text-rose-300"
            }`}
          >
            Critical Only
          </button>
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-400 space-y-1">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
          <p className="font-semibold text-slate-300">
            {filterMode === "urgent"
              ? "No critical procurement escalations at this time."
              : "All operational tasks and material thresholds are up to date."}
          </p>
          <p className="text-[11px] text-slate-500">
            Tasks will generate automatically when requisitions, supplier quotes, or stock levels require action.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => {
            const Icon = task.icon;

            return (
              <div
                key={task.id}
                className="p-3.5 rounded-xl bg-[#0a1020] border border-slate-800 hover:border-blue-500/30 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 group"
              >
                <div className="flex items-start space-x-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 mt-0.5 ${task.iconColor}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.2 rounded font-bold text-[9px] uppercase tracking-wider border shrink-0 ${
                          task.urgency === "CRITICAL"
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                            : task.urgency === "HIGH"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                            : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                        }`}
                      >
                        {task.urgency}
                      </span>
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                        {task.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {task.reason}
                    </p>
                  </div>
                </div>

                {/* Working Next Action Button */}
                <div className="shrink-0 self-end sm:self-center">
                  {task.isRestockAction && onOpenRestock ? (
                    <button
                      type="button"
                      onClick={() => onOpenRestock(task.rawItem)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition cursor-pointer shadow-xs"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>{task.actionLabel}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onNavigate && onNavigate(task.targetModule)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer group-hover:border-cyan-500/50"
                    >
                      <span>{task.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

