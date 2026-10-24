import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

/**
 * Reusable Collapsible KPI Section Container
 * Provides a standardized accessible toggle button ("Hide KPIs" / "Show KPIs")
 * with smooth height collapse animation and full vertical space reclamation.
 */
export default function KpiSection({
  title,
  subtitle,
  children,
  defaultExpanded = true,
  className = "",
  headerClassName = "",
  action = null,
}) {
  const [showKpis, setShowKpis] = useState(defaultExpanded);

  return (
    <section aria-label={title || "Key Performance Indicators"} className={className}>
      <div className={`flex items-center justify-between mb-3 flex-wrap gap-2 ${headerClassName}`}>
        <div className="flex items-center gap-3">
          {title && (
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#94a3b8]">
              {title}
            </h2>
          )}
          {subtitle && (
            <span className="hidden sm:inline-block text-[11px] text-[#64748b]">
              {subtitle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {action}
          <button
            type="button"
            onClick={() => setShowKpis((prev) => !prev)}
            aria-expanded={showKpis}
            aria-label={showKpis ? "Hide KPIs" : "Show KPIs"}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1e2a4a] bg-[#10182f] text-xs font-semibold text-[#94a3b8] hover:text-[#f1f5f9] hover:border-[#3b82f6]/60 hover:bg-slate-800/40 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
          >
            <span>{showKpis ? "Hide KPIs" : "Show KPIs"}</span>
            {showKpis ? (
              <ChevronUp className="w-3.5 h-3.5 text-[#3b82f6]" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-[#3b82f6]" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          showKpis
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </section>
  );
}
