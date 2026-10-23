import React from "react";

const statusConfig = {
  // Common / Vendor
  ACTIVE: { bg: "bg-emerald-600/20", text: "text-emerald-300", border: "border-emerald-500/40", dot: "bg-emerald-400", label: "Active" },
  INACTIVE: { bg: "bg-rose-500/10", text: "text-rose-300", border: "border-rose-500/30", dot: "bg-rose-400", label: "Inactive" },

  // PR / RFQ
  DRAFT: { bg: "bg-slate-800/60", text: "text-slate-300", border: "border-slate-700/60", dot: "bg-slate-400", label: "Draft" },
  SUBMITTED: { bg: "bg-amber-500/10", text: "text-amber-300", border: "border-amber-500/30", dot: "bg-amber-400", label: "Submitted" },
  APPROVED: { bg: "bg-emerald-600/20", text: "text-emerald-300", border: "border-emerald-500/40", dot: "bg-emerald-400", label: "Approved" },
  REJECTED: { bg: "bg-rose-500/10", text: "text-rose-300", border: "border-rose-500/30", dot: "bg-rose-400", label: "Rejected" },
  CONVERTED: { bg: "bg-indigo-500/10", text: "text-indigo-300", border: "border-indigo-500/30", dot: "bg-indigo-400", label: "Converted" },

  // RFQ specific
  SENT: { bg: "bg-blue-500/10", text: "text-blue-300", border: "border-blue-500/30", dot: "bg-blue-400", label: "Sent" },
  QUOTATIONS_RECEIVED: { bg: "bg-indigo-500/10", text: "text-indigo-300", border: "border-indigo-500/30", dot: "bg-indigo-400", label: "Quotes Received" },
  EVALUATED: { bg: "bg-cyan-500/10", text: "text-cyan-300", border: "border-cyan-500/30", dot: "bg-cyan-400", label: "Evaluated" },
  AWARDED: { bg: "bg-emerald-600/20", text: "text-emerald-300", border: "border-emerald-500/40", dot: "bg-emerald-400", label: "Awarded" },
  CANCELLED: { bg: "bg-rose-500/10", text: "text-rose-300", border: "border-rose-500/30", dot: "bg-rose-400", label: "Cancelled" },

  // PO specific
  PENDING_APPROVAL: { bg: "bg-amber-500/10", text: "text-amber-300", border: "border-amber-500/30", dot: "bg-amber-400", label: "Pending Approval" },
  PARTIALLY_RECEIVED: { bg: "bg-sky-500/10", text: "text-sky-300", border: "border-sky-500/30", dot: "bg-sky-400", label: "Partially Received" },
  RECEIVED: { bg: "bg-teal-500/10", text: "text-teal-300", border: "border-teal-500/30", dot: "bg-teal-400", label: "Received" },
  CLOSED: { bg: "bg-slate-800/60", text: "text-slate-400", border: "border-slate-700/60", dot: "bg-slate-500", label: "Closed" },

  // Goods Receipt specific
  UNDER_INSPECTION: { bg: "bg-amber-500/10", text: "text-amber-300", border: "border-amber-500/30", dot: "bg-amber-400", label: "Under Inspection" },
  ACCEPTED: { bg: "bg-emerald-600/20", text: "text-emerald-300", border: "border-emerald-500/40", dot: "bg-emerald-400", label: "Accepted" },
  PARTIALLY_ACCEPTED: { bg: "bg-blue-500/10", text: "text-blue-300", border: "border-blue-500/30", dot: "bg-blue-400", label: "Partially Accepted" },
};

export default function StatusBadge({ status }) {
  const norm = String(status || "").toUpperCase();
  const cfg = statusConfig[norm] || {
    bg: "bg-slate-800/60",
    text: "text-slate-300",
    border: "border-slate-700/60",
    dot: "bg-slate-400",
    label: status || "Unknown",
  };

  return (
    <span
      className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border} shadow-2xs whitespace-nowrap`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      <span>{cfg.label}</span>
    </span>
  );
}
