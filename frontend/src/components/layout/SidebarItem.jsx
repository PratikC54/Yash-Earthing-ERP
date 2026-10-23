import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Wrench,
  Factory,
  Package,
  Headphones,
  Settings,
  ChevronDown,
  ChevronRight,
  Circle,
} from "lucide-react";

// Icon lookup dictionary
const iconMap = {
  LayoutDashboard,
  ShoppingCart,
  Wrench,
  Factory,
  Package,
  Headphones,
  Settings,
};

/**
 * SidebarItem component supporting both single-link items and expandable parent groups.
 */
export default function SidebarItem({
  item,
  isExpanded,
  onToggle,
  currentPath,
  onNavigate,
}) {
  const IconComponent = iconMap[item.icon] || LayoutDashboard;
  const hasChildren = Array.isArray(item.children) && item.children.length > 0;

  // Check if any child submodule matches the current URL (including nested routes)
  const isAnyChildActive =
    hasChildren &&
    item.children.some(
      (child) =>
        currentPath === child.path ||
        currentPath.startsWith(child.path + "/")
    );

  // Single module without submodules (e.g. Dashboard, Settings)
  if (!hasChildren) {
    const isDirectActive =
      currentPath === item.path ||
      (item.path !== "/" && currentPath.startsWith(item.path + "/"));

    return (
      <div className="px-2 py-0.5">
        <NavLink
          to={item.path}
          onClick={onNavigate}
          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
            isDirectActive
              ? "bg-blue-600/20 text-white font-semibold shadow-inner border border-blue-500/30"
              : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <IconComponent
              className={`w-4 h-4 shrink-0 transition-colors ${
                isDirectActive ? "text-blue-400" : "text-slate-400"
              }`}
            />
            <span className="truncate">{item.label}</span>
          </div>
          {isDirectActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
          )}
        </NavLink>
      </div>
    );
  }

  // Parent module with submodules (expandable accordion)
  return (
    <div className="px-2 py-0.5">
      {/* Module Header Toggle Button */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`submenu-${item.id}`}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer select-none ${
          isAnyChildActive
            ? "bg-blue-600/20 text-white font-semibold shadow-inner border border-blue-500/30"
            : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <IconComponent
            className={`w-4 h-4 shrink-0 transition-colors ${
              isAnyChildActive ? "text-blue-400" : "text-slate-400"
            }`}
          />
          <span className="truncate">{item.label}</span>
        </div>

        <div className="flex items-center pl-2 shrink-0">
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 transition-transform duration-200" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 transition-transform duration-200" />
          )}
        </div>
      </button>

      {/* Smooth Expand/Collapse Submodule Container via CSS Grid */}
      <div
        id={`submenu-${item.id}`}
        role="region"
        aria-label={`${item.label} submodules`}
        className={`grid transition-all duration-200 ease-in-out ${
          isExpanded ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pl-3 pr-1 space-y-0.5 border-l border-slate-700/60 ml-5 my-0.5">
            {item.children.map((child) => {
              const isChildActive =
                currentPath === child.path ||
                currentPath.startsWith(child.path + "/");

              return (
                <NavLink
                  key={child.path}
                  to={child.path}
                  onClick={onNavigate}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isChildActive
                      ? "bg-blue-600/25 text-blue-300 font-semibold border-l-2 border-blue-400 pl-2 shadow-2xs"
                      : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                  }`}
                >
                  <Circle
                    className={`w-1.5 h-1.5 shrink-0 transition-colors ${
                      isChildActive
                        ? "fill-blue-400 text-blue-400"
                        : "fill-transparent text-slate-600"
                    }`}
                  />
                  <span className="truncate">{child.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
