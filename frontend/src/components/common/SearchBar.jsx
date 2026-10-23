import React from "react";
import { Search, X } from "lucide-react";

/**
 * Reusable SearchBar Component with Reference Navy Theme
 */
export default function SearchBar({
  value = "",
  onChange,
  onClear,
  placeholder = "Search records...",
  className = "",
  size = "md",
}) {
  const sizeClasses = {
    sm: "py-1 pl-8 pr-7 text-xs",
    md: "py-2 pl-9 pr-8 text-xs sm:text-sm",
    lg: "py-2.5 pl-10 pr-9 text-base",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5 left-2.5",
    md: "w-4 h-4 left-3",
    lg: "w-4.5 h-4.5 left-3.5",
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search
        className={`absolute text-[#64748b] pointer-events-none ${
          iconSizes[size] || iconSizes.md
        }`}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-[#0a1020] text-[#f1f5f9] placeholder-[#64748b] rounded-xl border border-[#1e2a4a] focus:outline-none focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6] transition shadow-inner ${
          sizeClasses[size] || sizeClasses.md
        }`}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            if (onClear) onClear();
            else if (onChange) onChange("");
          }}
          className="absolute right-2.5 p-0.5 rounded-full text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-slate-800/40 transition cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
