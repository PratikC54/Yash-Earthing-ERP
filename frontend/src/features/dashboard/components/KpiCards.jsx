import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
} from "lucide-react";

export default function KpiCards({ kpis = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {kpis.length === 0 && (
        <p className="text-sm text-[#94a3b8]">No KPI data available.</p>
      )}
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.id}
            className="group relative bg-[#10182f] hover:bg-[#15203c] border border-[#1e2a4a] rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between shadow-md"
          >
            {/* Top Row: Title + Icon Badge */}
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase truncate">
                {kpi.title}
              </span>
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${kpi.accentColor} p-2 flex items-center justify-center text-white shadow-sm shrink-0`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>

            {/* Metric Value */}
            <div className="my-3">
              <div className="text-2xl sm:text-[28px] font-extrabold text-[#f1f5f9] tracking-tight leading-none">
                {kpi.value}
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span
                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold border ${kpi.badgeBg}`}
                >
                  {kpi.isPositive ? (
                    <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
                  )}
                  {kpi.change}
                </span>
              </div>
            </div>

            {/* Description & Link */}
            <div className="pt-2 border-t border-[#1e2a4a] flex items-center justify-between text-xs">
              <p className="text-[11px] text-[#94a3b8] leading-snug truncate pr-2">
                {kpi.description}
              </p>
              {kpi.link && (
                <Link
                  to={kpi.link}
                  className="shrink-0 text-[11px] font-semibold text-[#3b82f6] hover:text-blue-300 flex items-center gap-0.5 transition"
                >
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
