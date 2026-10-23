import React from "react";

const statusConfig = {
  // Common / Vendor
  ACTIVE: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200/60", dot: "bg-emerald-500", label: "Active" },
  INACTIVE: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200/60", dot: "bg-rose-500", label: "Inactive" },

  // PR / RFQ
  DRAFT: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200/70", dot: "bg-slate-400", label: "Draft" },
  SUBMITTED: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200/60", dot: "bg-amber-500", label: "Submitted" },
  APPROVED: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200/60", dot: "bg-emerald-500", label: "Approved" },
  REJECTED: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200/60", dot: "bg-rose-500", label: "Rejected" },
  CONVERTED: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200/60", dot: "bg-purple-500", label: "Converted" },

  // RFQ specific
  SENT: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200/60", dot: "bg-blue-500", label: "Sent" },
  QUOTATIONS_RECEIVED: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200/60", dot: "bg-indigo-500", label: "Quotes Received" },
  EVALUATED: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200/60", dot: "bg-cyan-500", label: "Evaluated" },
  AWARDED: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200/60", dot: "bg-emerald-500", label: "Awarded" },
  CANCELLED: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200/60", dot: "bg-rose-500", label: "Cancelled" },

  // PO specific
  PENDING_APPROVAL: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200/60", dot: "bg-amber-500", label: "Pending Approval" },
  PARTIALLY_RECEIVED: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200/60", dot: "bg-sky-500", label: "Partially Received" },
  RECEIVED: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200/60", dot: "bg-teal-500", label: "Received" },
  CLOSED: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200/70", dot: "bg-slate-400", label: "Closed" },

  // Goods Receipt specific
  UNDER_INSPECTION: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200/60", dot: "bg-amber-500", label: "Under Inspection" },
  ACCEPTED: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200/60", dot: "bg-emerald-500", label: "Accepted" },
  PARTIALLY_ACCEPTED: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200/60", dot: "bg-blue-500", label: "Partially Accepted" },
};

export default function StatusBadge({ status }) {
  const norm = String(status || "").toUpperCase();
  const cfg = statusConfig[norm] || {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200/70",
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
