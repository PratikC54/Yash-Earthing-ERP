import React from "react";
import { RotateCcw } from "lucide-react";
import SearchBar from "../../../../components/common/SearchBar";
import Button from "../../../../components/common/Button";

/**
 * Reusable FilterPanel with Tailwind CSS
 */
export default function FilterPanel({
  searchTerm = "",
  onSearchChange,
  statusFilter = "ALL",
  onStatusChange,
  statusOptions = [],
  priorityFilter = "ALL",
  onPriorityChange,
  priorityOptions = [],
  onReset,
  children,
}) {
  return (
    <div className="bg-[#10182f] p-4 rounded-xl border border-[#1e2a4a] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* Search Input */}
      <div className="w-full md:w-72">
        <SearchBar
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Filter by WO#, product, customer..."
          size="sm"
        />
      </div>

      {/* Select Dropdowns & Custom Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        {statusOptions.length > 0 && (
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange && onStatusChange(e.target.value)}
            className="bg-[#0a1020] text-xs font-medium text-[#f1f5f9] border border-[#1e2a4a] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#3b82f6] cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {priorityOptions.length > 0 && (
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange && onPriorityChange(e.target.value)}
            className="bg-[#0a1020] text-xs font-medium text-[#f1f5f9] border border-[#1e2a4a] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#3b82f6] cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            {priorityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {children}

        {onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            icon={RotateCcw}
            title="Reset Filters"
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
