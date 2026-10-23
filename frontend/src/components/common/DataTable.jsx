import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import Loader from "./Loader";

/**
 * Reusable DataTable Component with Reference Navy Theme
 */
export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = "No records found",
  pagination = true,
  itemsPerPage = 10,
  className = "",
  onRowClick,
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = pagination
    ? data.slice(startIndex, startIndex + itemsPerPage)
    : data;

  return (
    <div
      className={`w-full overflow-hidden border border-[#1e2a4a] rounded-2xl bg-[#10182f] shadow-md ${className}`}
    >
      <div className="w-full overflow-x-auto scrollbar-thin">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#1e2a4a] bg-[#0b1329] text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  className={`px-4 py-3 whitespace-nowrap ${
                    col.headerClassName || ""
                  } ${
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                      ? "text-center"
                      : "text-left"
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2a4a] text-[#f1f5f9]">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <Loader label="Loading table records..." />
                </td>
              </tr>
            ) : currentData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-[#94a3b8]"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="w-8 h-8 text-[#64748b]" />
                    <p className="text-xs font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              currentData.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={col.key || colIdx}
                      className={`px-4 py-3 whitespace-nowrap ${
                        col.className || ""
                      } ${
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                          ? "text-center"
                          : "text-left"
                      }`}
                    >
                      {col.render ? col.render(row, rowIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && data.length > itemsPerPage && (
        <div className="flex items-center justify-between px-4 py-3 bg-[#0a1020] border-t border-[#1e2a4a] text-xs text-[#94a3b8]">
          <span>
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + itemsPerPage, data.length)} of {data.length}{" "}
            entries
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded bg-[#10182f] border border-[#1e2a4a] text-[#f1f5f9] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800/40 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono font-bold text-[#f1f5f9]">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded bg-[#10182f] border border-[#1e2a4a] text-[#f1f5f9] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800/40 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
