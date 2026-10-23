import { useRef } from "react";
import { Search, Download, Upload, Plus } from "lucide-react";

export default function FilterBar({
  searchQuery,
  onSearchChange,
  placeholder = "Search customer, code, phone, product...",
  filters = [],
  onFilterChange,
  onExportExcel,
  onImportExcel,
  primaryActionLabel,
  onPrimaryAction,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onImportExcel) {
      onImportExcel(file);
    }
    // Reset value so same file can be selected again
    e.target.value = "";
  };

  return (
    <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
      {/* Left Search input */}
      <div className="relative flex-1 w-full min-w-0 sm:min-w-[240px]">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#0a1020] text-slate-100 placeholder-slate-500 text-xs sm:text-sm pl-10 pr-4 py-2 sm:py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition shadow-inner"
        />
      </div>

      {/* Right Filters & Buttons */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        {/* Dynamic Select Filters */}
        {filters.map((filter) => (
          <div key={filter.id} className="relative flex-1 sm:flex-initial min-w-[120px]">
            <select
              value={filter.value}
              onChange={(e) => onFilterChange(filter.id, e.target.value)}
              className="w-full sm:w-auto bg-[#0a1020] text-slate-200 text-xs font-medium px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition cursor-pointer appearance-none pr-7 sm:pr-8 shadow-inner"
            >
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#10182f] text-slate-100">
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
              ▼
            </div>
          </div>
        ))}

        {/* Hidden Excel File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx,.xls,.csv"
          className="hidden"
        />

        {/* Import Excel Button */}
        {onImportExcel && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Import records from Excel or CSV file"
            className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700/80 transition shadow-sm cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span>Import</span>
          </button>
        )}

        {/* Export Excel Button */}
        {onExportExcel && (
          <button
            type="button"
            onClick={onExportExcel}
            title="Export filtered records to Excel .xlsx"
            className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700/80 transition shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export</span>
          </button>
        )}

        {/* Primary Action Button */}
        {primaryActionLabel && onPrimaryAction && (
          <button
            type="button"
            onClick={onPrimaryAction}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white rounded-xl text-xs font-semibold tracking-wide shadow-md shadow-blue-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{primaryActionLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
}
