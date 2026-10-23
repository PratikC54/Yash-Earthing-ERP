import React from "react";

const statuses = [
  { id: "ALL", label: "All Orders" },
  { id: "DRAFT", label: "Draft" },
  { id: "PLANNED", label: "Planned" },
  { id: "READY_FOR_PRODUCTION", label: "Ready" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "ON_HOLD", label: "On Hold" },
  { id: "COMPLETED", label: "Completed" },
  { id: "CANCELLED", label: "Cancelled" },
];

/**
 * Filter Chips component for Work Orders with Tailwind CSS
 */
export default function WorkOrderFilters({ activeStatus = "ALL", onSelectStatus }) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
      {statuses.map((s) => {
        const isActive = activeStatus === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelectStatus && onSelectStatus(s.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
              isActive
                ? "bg-[#3b82f6] text-white border-[#3b82f6] shadow-sm"
                : "bg-[#10182f] text-[#94a3b8] border-[#1e2a4a] hover:bg-slate-800/40 hover:text-[#f1f5f9]"
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
