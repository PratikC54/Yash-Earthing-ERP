import React, { useState, useMemo } from "react";
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertOctagon,
  FileText,
} from "lucide-react";

export const initialRecords = [];

export default function DashboardDataTable({
  filterStageId = null,
  onViewRecord = () => {},
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sortField, setSortField] = useState("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const filteredData = useMemo(() => {
    return initialRecords.filter((item) => {
      // Stage filter from workflow
      if (filterStageId && item.stage !== filterStageId) {
        return false;
      }
      // Type filter
      if (typeFilter !== "ALL" && item.type !== typeFilter) {
        return false;
      }
      // Search filter
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesCode = item.code.toLowerCase().includes(q);
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesClient = item.clientOrLine.toLowerCase().includes(q);
        if (!matchesCode && !matchesTitle && !matchesClient) {
          return false;
        }
      }
      return true;
    });
  }, [filterStageId, typeFilter, searchTerm]);

  // Sorting
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / rowsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, currentPage]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "IN_PROGRESS":
        return {
          bg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
          icon: Clock,
          label: "In Progress",
        };
      case "DISPATCH_READY":
      case "APPROVED":
        return {
          bg: "bg-emerald-500/10 text-[#2DD4BF] border-emerald-500/30",
          icon: CheckCircle2,
          label: status.replace("_", " "),
        };
      case "FOLLOW_UP_DUE":
      case "SUBMITTED":
        return {
          bg: "bg-amber-500/10 text-[#FACC15] border-amber-500/30",
          icon: AlertTriangle,
          label: status.replace("_", " "),
        };
      case "UNDER_REVIEW":
        return {
          bg: "bg-rose-500/10 text-[#F87171] border-rose-500/30",
          icon: AlertOctagon,
          label: "Under Review",
        };
      default:
        return {
          bg: "bg-slate-500/10 text-[#94a3b8] border-slate-500/30",
          icon: FileText,
          label: status.replace("_", " "),
        };
    }
  };

  return (
    <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-md space-y-4">
      {/* Table Top Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#f1f5f9]">
            Operational Work Registry
          </h3>
          <p className="text-[11px] text-[#94a3b8]">
            Unified pipeline tracking across active sales inquiries, work orders & quality gates
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-48 sm:w-60">
            <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search record or client..."
              className="w-full bg-[#0a1020] text-[#f1f5f9] placeholder-[#64748b] text-xs pl-8 pr-3 py-1.5 rounded-lg border border-[#1e2a4a] focus:outline-none focus:border-[#3b82f6]"
            />
          </div>

          <div className="inline-flex rounded-lg bg-[#0a1020] p-1 border border-[#1e2a4a]">
            {["ALL", "Work Order", "Sales Lead", "Quotation", "Quality Inspection"].map(
              (type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setTypeFilter(type);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                    typeFilter === type
                      ? "bg-[#3b82f6] text-white"
                      : "text-[#94a3b8] hover:text-[#f1f5f9]"
                  }`}
                >
                  {type === "ALL" ? "All Types" : type}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Active Filter Stage Notice */}
      {filterStageId && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#15203c] border border-[#3b82f6]/50 text-xs text-[#f1f5f9]">
          <span>
            Filtering by workflow stage:{" "}
            <strong className="text-[#3b82f6] capitalize">
              {filterStageId.replace(/-/g, " ")}
            </strong>
          </span>
          <button
            type="button"
            onClick={() => onViewRecord(null)}
            className="text-[11px] font-semibold text-[#94a3b8] hover:text-white underline cursor-pointer"
          >
            Clear stage filter
          </button>
        </div>
      )}

      {/* Data Table */}
      <div className="overflow-x-auto rounded-xl border border-[#1e2a4a] scrollbar-thin">
        <table className="w-full text-left text-xs text-[#94a3b8]">
          <thead className="bg-[#0b1329] text-[#94a3b8] uppercase font-bold text-[10px] tracking-wider border-b border-[#1e2a4a]">
            <tr>
              <th
                className="py-3 px-4 cursor-pointer hover:text-white select-none"
                onClick={() => handleSort("code")}
              >
                <div className="flex items-center gap-1">
                  <span>Record ID</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-white select-none"
                onClick={() => handleSort("title")}
              >
                <div className="flex items-center gap-1">
                  <span>Title & Product Spec</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Line / Client</th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-white select-none"
                onClick={() => handleSort("valueOrQty")}
              >
                <div className="flex items-center gap-1">
                  <span>Volume / Value</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2a4a] bg-[#10182f]">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#94a3b8]">
                  No records match the current filter or search criteria.
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => {
                const badge = getStatusBadge(row.status);
                const BadgeIcon = badge.icon;
                return (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#f1f5f9] whitespace-nowrap">
                      {row.code}
                      <span className="block text-[9.5px] font-sans font-normal text-[#64748b]">
                        {row.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#f1f5f9] font-medium max-w-xs truncate">
                      {row.title}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-[#94a3b8]">
                      {row.clientOrLine}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-[#f1f5f9] whitespace-nowrap">
                      {row.valueOrQty}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.priority === "CRITICAL"
                            ? "bg-rose-500/20 text-[#F87171] border border-rose-500/40"
                            : row.priority === "HIGH"
                            ? "bg-amber-500/20 text-[#FACC15] border border-amber-500/40"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                        }`}
                      >
                        {row.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold border ${badge.bg}`}
                      >
                        <BadgeIcon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onViewRecord(row)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0a1020] hover:bg-[#3b82f6] hover:text-white text-[#94a3b8] border border-[#1e2a4a] text-xs font-semibold transition cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between text-xs text-[#94a3b8] pt-1">
        <span>
          Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
          {Math.min(currentPage * rowsPerPage, sortedData.length)} of{" "}
          {sortedData.length} records
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg bg-[#0a1020] border border-[#1e2a4a] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#15203c] text-[#f1f5f9] transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 text-xs font-semibold text-[#f1f5f9]">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg bg-[#0a1020] border border-[#1e2a4a] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#15203c] text-[#f1f5f9] transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
