import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Gauge,
  ClipboardList,
  CalendarCheck,
  FileCheck2,
  Truck,
  Layers,
  RotateCcw,
} from "lucide-react";

const tabs = [
  { name: "Production Overview", to: "/pq/dashboard", altTo: "/production/dashboard", icon: Gauge },
  { name: "Work Orders", to: "/production/work-orders", altTo: "/production-quality/work-orders", icon: ClipboardList },
  { name: "Production Planning", to: "/production/planning", altTo: "/production-quality/planning", icon: CalendarCheck },
  { name: "Shop-Floor Tracking", to: "/production/tracking", altTo: "/production-quality/shop-floor", icon: Layers },
  { name: "Quality Inspections", to: "/quality/inspections", altTo: "/production-quality/inspections", icon: FileCheck2 },
  { name: "Dispatch", to: "/pq/dispatch", altTo: "/production-quality/dispatch", icon: Truck },
  { name: "CAPA / Rework", to: "/quality/capa", altTo: "/production-quality/rework", icon: RotateCcw },
];

/**
 * Reusable Module 4 Navigation Tab Bar
 * Mobile-responsive with horizontal touch scroll.
 */
export default function ModuleTabs() {
  const location = useLocation();
  const currentPath = location.pathname.replace(/\/$/, "");

  return (
    <div className="w-full min-w-0 max-w-full border-b border-[#1e2a4a] overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth touch-pan-x scrollbar-thin">
      <nav className="flex w-max min-w-full flex-nowrap items-center gap-1.5 pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            currentPath === tab.to ||
            currentPath === tab.altTo ||
            currentPath.startsWith(tab.to) ||
            currentPath.startsWith(tab.altTo);

          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={`inline-flex shrink-0 items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 -mb-px cursor-pointer ${
                isActive
                  ? "border-[#3b82f6] text-[#3b82f6] bg-[#10182f] shadow-sm font-bold"
                  : "border-transparent text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#10182f]/50"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
