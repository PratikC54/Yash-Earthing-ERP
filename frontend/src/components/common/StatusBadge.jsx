import React from "react";

/**
 * Reusable StatusBadge Component matching Yash Group ERP dark-blue theme
 * Supports WorkOrder, QualityInspection, NCR, and Priority statuses
 */
export default function StatusBadge({ status, className = "" }) {
  if (!status) return null;

  const normalized = String(status).toUpperCase();

  const statusConfig = {
    // Work Order Lifecycle
    DRAFT: {
      label: "Draft",
      bg: "bg-slate-500/20",
      text: "text-slate-300",
      border: "border-slate-500/40",
      dot: "bg-slate-400",
    },
    PLANNED: {
      label: "Planned",
      bg: "bg-blue-500/20",
      text: "text-blue-300",
      border: "border-blue-500/40",
      dot: "bg-blue-400",
    },
    READY_FOR_PRODUCTION: {
      label: "Ready",
      bg: "bg-teal-500/20",
      text: "text-[#2DD4BF]",
      border: "border-teal-500/40",
      dot: "bg-[#2DD4BF]",
    },
    IN_PROGRESS: {
      label: "In Progress",
      bg: "bg-amber-500/20",
      text: "text-[#FACC15]",
      border: "border-amber-500/40",
      dot: "bg-[#FACC15]",
    },
    ON_HOLD: {
      label: "On Hold",
      bg: "bg-orange-500/20",
      text: "text-orange-300",
      border: "border-orange-500/40",
      dot: "bg-orange-400",
    },
    QC_HOLD: {
      label: "QC Hold",
      bg: "bg-purple-500/20",
      text: "text-purple-300",
      border: "border-purple-500/40",
      dot: "bg-purple-400",
    },
    MATERIAL_HOLD: {
      label: "Material Hold",
      bg: "bg-rose-500/20",
      text: "text-[#F87171]",
      border: "border-rose-500/40",
      dot: "bg-[#F87171]",
    },
    COMPLETED: {
      label: "Completed",
      bg: "bg-emerald-500/20",
      text: "text-emerald-300",
      border: "border-emerald-500/40",
      dot: "bg-emerald-400",
    },
    CANCELLED: {
      label: "Cancelled",
      bg: "bg-red-500/20",
      text: "text-red-300",
      border: "border-red-500/40",
      dot: "bg-red-400",
    },

    // QA Inspection & Decisions
    PASS: {
      label: "Passed",
      bg: "bg-emerald-500/20",
      text: "text-[#2DD4BF]",
      border: "border-emerald-500/40",
      dot: "bg-[#2DD4BF]",
    },
    FAIL: {
      label: "Failed",
      bg: "bg-rose-500/20",
      text: "text-[#F87171]",
      border: "border-rose-500/40",
      dot: "bg-[#F87171]",
    },
    HOLD: {
      label: "QC Hold",
      bg: "bg-amber-500/20",
      text: "text-[#FACC15]",
      border: "border-amber-500/40",
      dot: "bg-[#FACC15]",
    },
    REWORK: {
      label: "In Rework",
      bg: "bg-amber-500/20",
      text: "text-amber-300",
      border: "border-amber-500/40",
      dot: "bg-amber-400",
    },
    RELEASED: {
      label: "Released to FG",
      bg: "bg-emerald-500/20",
      text: "text-emerald-300",
      border: "border-emerald-500/40",
      dot: "bg-emerald-400",
    },
    PASSED: {
      label: "Passed",
      bg: "bg-emerald-500/20",
      text: "text-[#2DD4BF]",
      border: "border-emerald-500/40",
      dot: "bg-[#2DD4BF]",
    },
    APPROVED: {
      label: "Approved",
      bg: "bg-emerald-500/20",
      text: "text-[#2DD4BF]",
      border: "border-emerald-500/40",
      dot: "bg-[#2DD4BF]",
    },
    CONDITIONAL: {
      label: "Conditional",
      bg: "bg-amber-500/20",
      text: "text-[#FACC15]",
      border: "border-amber-500/40",
      dot: "bg-[#FACC15]",
    },
    REJECTED: {
      label: "Rejected",
      bg: "bg-rose-500/20",
      text: "text-[#F87171]",
      border: "border-rose-500/40",
      dot: "bg-[#F87171]",
    },

    // Dispatch Lifecycle
    READY_FOR_DISPATCH: {
      label: "Ready for Dispatch",
      bg: "bg-emerald-500/20",
      text: "text-emerald-400",
      border: "border-emerald-500/40",
      dot: "bg-emerald-400",
    },
    PARTIALLY_DISPATCHED: {
      label: "Partially Dispatched",
      bg: "bg-amber-500/20",
      text: "text-amber-400",
      border: "border-amber-500/40",
      dot: "bg-amber-400",
    },
    FULLY_DISPATCHED: {
      label: "Fully Dispatched",
      bg: "bg-blue-500/20",
      text: "text-blue-400",
      border: "border-blue-500/40",
      dot: "bg-blue-400",
    },
    DISPATCHED: {
      label: "Dispatched",
      bg: "bg-cyan-500/20",
      text: "text-cyan-400",
      border: "border-cyan-500/40",
      dot: "bg-cyan-400",
    },
    IN_TRANSIT: {
      label: "In Transit",
      bg: "bg-sky-500/20",
      text: "text-sky-300",
      border: "border-sky-500/40",
      dot: "bg-sky-400",
    },
    DELIVERED: {
      label: "Delivered",
      bg: "bg-emerald-500/25",
      text: "text-emerald-300",
      border: "border-emerald-500/50",
      dot: "bg-emerald-400",
    },

    // Priority Tokens
    CRITICAL: {
      label: "Critical",
      bg: "bg-rose-500/25",
      text: "text-[#F87171]",
      border: "border-rose-500/50",
      dot: "bg-[#F87171]",
    },
    HIGH: {
      label: "High",
      bg: "bg-amber-500/20",
      text: "text-[#FACC15]",
      border: "border-amber-500/40",
      dot: "bg-[#FACC15]",
    },
    MEDIUM: {
      label: "Medium",
      bg: "bg-blue-500/20",
      text: "text-blue-300",
      border: "border-blue-500/40",
      dot: "bg-blue-400",
    },
    LOW: {
      label: "Low",
      bg: "bg-slate-500/20",
      text: "text-slate-300",
      border: "border-slate-500/40",
      dot: "bg-slate-400",
    },
  };

  const config = statusConfig[normalized] || {
    label: status.replace(/_/g, " "),
    bg: "bg-slate-500/20",
    text: "text-slate-300",
    border: "border-slate-500/40",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
}
