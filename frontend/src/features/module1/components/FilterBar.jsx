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
    <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
      {/* Left Search input */}
      <div className="relative flex-1 w-full min-w-0 sm:min-w-[240px]">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 text-xs sm:text-sm pl-10 pr-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-lime-400 focus:border-slate-400 transition font-medium"
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
              className="w-full sm:w-auto bg-slate-50 text-slate-800 text-xs font-bold px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 focus:outline-none focus:bg-white transition cursor-pointer appearance-none pr-7 sm:pr-8"
            >
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white text-slate-900 font-medium">
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">
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
            className="flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 transition shadow-xs cursor-pointer active:scale-95"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600 stroke-[2.5]" />
            <span>Import</span>
          </button>
        )}

        {/* Export Excel Button */}
        {onExportExcel && (
          <button
            type="button"
            onClick={onExportExcel}
            title="Export filtered records to Excel .xlsx"
            className="flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 transition shadow-xs cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
            <span>Export</span>
          </button>
        )}

        {/* Primary Action Button (Acid Lime Pop) */}
        {primaryActionLabel && onPrimaryAction && (
          <button
            type="button"
            onClick={onPrimaryAction}
            className="flex items-center gap-1.5 px-4 py-2 sm:py-2.5 bg-[#d4ff00] hover:bg-[#bce600] active:scale-[0.98] text-black rounded-xl text-xs sm:text-sm font-black shadow-xs border border-lime-400 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{primaryActionLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
}
