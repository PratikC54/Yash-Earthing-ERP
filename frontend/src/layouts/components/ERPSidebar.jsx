import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Clock,
  PhoneCall,
  FileText,
  CheckCircle2,
  Package,
  BarChart3,
  Boxes,
  FileSpreadsheet,
  Inbox,
  ArrowLeftRight,
  Cpu,
  FileCode,
  Layers,
  CheckSquare,
  Factory,
  Gauge,
  ClipboardList,
  Calendar,
  Activity,
  ShieldAlert,
  AlertOctagon,
  Wrench,
  Truck,
  Compass,
  Navigation,
  UserCheck,
  LifeBuoy,
  Settings,
  ChevronDown,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { navigationSections } from "../../config/navigationConfig";

const iconMap = {
  LayoutDashboard,
  TrendingUp,
  Users,
  Clock,
  PhoneCall,
  FileText,
  CheckCircle2,
  Package,
  BarChart3,
  Boxes,
  FileSpreadsheet,
  Inbox,
  ArrowLeftRight,
  Cpu,
  FileCode,
  Layers,
  CheckSquare,
  Factory,
  Gauge,
  ClipboardList,
  Calendar,
  Activity,
  ShieldAlert,
  AlertOctagon,
  Wrench,
  Truck,
  Compass,
  Navigation,
  UserCheck,
  LifeBuoy,
  Settings,
};

function NavIcon({ name, className = "w-4 h-4 shrink-0" }) {
  const IconComponent = iconMap[name] || Activity;
  return <IconComponent className={className} />;
}

// Helper to compute default state with all modules fully expanded
const getDefaultExpandedState = () => {
  const state = {};
  navigationSections.forEach((sec) => {
    sec.items.forEach((item) => {
      if (item.children) {
        state[item.id] = true;
      }
    });
  });
  return state;
};

export default function ERPSidebar({
  isMobileOpen = false,
  onCloseMobile = () => {},
  collapsed = false,
  user = null,
}) {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  // All module sections are fully expanded by default on application load
  const [expandedModules, setExpandedModules] = useState(getDefaultExpandedState);

  useEffect(() => {
    const currentPath = location.pathname.replace(/\/$/, "");
    navigationSections.forEach((sec) => {
      sec.items.forEach((item) => {
        if (item.children) {
          const hasActiveChild = item.children.some(
            (c) =>
              c.path === currentPath ||
              (c.aliases && c.aliases.includes(currentPath)) ||
              (c.path && currentPath.startsWith(c.path)) ||
              (c.aliases && c.aliases.some((alias) => currentPath.startsWith(alias)))
          );
          if (hasActiveChild) {
            setExpandedModules((prev) => ({ ...prev, [item.id]: true }));
          }
        }
      });
    });
  }, [location.pathname]);

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const isPathActive = (item) => {
    const currentPath = location.pathname.replace(/\/$/, "");
    if (item.path === currentPath) return true;
    if (item.aliases && item.aliases.includes(currentPath)) return true;
    if (item.path && item.path !== "/dashboard" && item.path !== "/pq/dashboard" && currentPath.startsWith(item.path)) return true;
    if (item.aliases && item.aliases.some((alias) => alias !== "/dashboard" && alias !== "/pq/dashboard" && currentPath.startsWith(alias))) return true;
    return false;
  };

  const filteredSections = navigationSections
    .map((section) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return section;

      const filteredItems = section.items
        .map((item) => {
          if (item.children) {
            const matchesModule = item.label.toLowerCase().includes(q);
            const matchingChildren = item.children.filter((child) =>
              child.label.toLowerCase().includes(q)
            );

            if (matchesModule || matchingChildren.length > 0) {
              return {
                ...item,
                children: matchesModule ? item.children : matchingChildren,
              };
            }
            return null;
          } else {
            return item.label.toLowerCase().includes(q) ? item : null;
          }
        })
        .filter(Boolean);

      return {
        ...section,
        items: filteredItems,
      };
    })
    .filter((section) => section.items.length > 0);

  return (
    <>
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-gradient-to-b from-[#07162c] to-[#08172e] border-r border-[#1e2a4a] text-[#f1f5f9] select-none transition-all duration-300 ease-in-out w-[280px] max-w-[85vw] lg:w-[268px] ${
          isMobileOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Sidebar Header with ERP Logo */}
        <div className="h-[72px] px-4 flex items-center justify-between border-b border-[#1e2a4a] shrink-0 bg-[#07162c]">
          <Link
            to="/pq/dashboard"
            onClick={onCloseMobile}
            className="flex items-center gap-3 overflow-hidden group flex-1 mr-2"
          >
            {/* ERP Logo Crest */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-sky-400 p-[1.5px] shadow-lg shadow-blue-950/50 shrink-0 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0b172d] rounded-[10px] flex items-center justify-center">
                <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300 text-lg">
                  YG
                </span>
              </div>
            </div>

            {/* Application Branding & Version Badge - visible on all devices and mobile drawer */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[15px] tracking-tight text-[#f1f5f9] truncate">
                  Yash Group ERP
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#2DD4BF] bg-[#2DD4BF]/10 px-1.5 py-[1px] rounded border border-[#2DD4BF]/20 truncate">
                  V3 — ENTERPRISE CONTROL
                </span>
              </div>
            </div>
          </Link>

          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-slate-800/40 cursor-pointer shrink-0"
            aria-label="Close mobile navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        {!collapsed && (
          <div className="px-3 pt-3 pb-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search submodules..."
                className="w-full bg-[#0a1020] text-[#f1f5f9] placeholder-[#64748b] text-xs pl-8 pr-7 py-2 rounded-lg border border-[#1e2a4a] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-white p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
          {filteredSections.map((section) => (
            <div key={section.id} className="space-y-1">
              {!collapsed && section.title && (
                <div className="px-2.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#64748b] flex items-center justify-between">
                  <span>{section.title}</span>
                </div>
              )}

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const hasChildren = Array.isArray(item.children) && item.children.length > 0;
                  const isExpanded = !!expandedModules[item.id] || searchQuery.length > 0;
                  const isActive = isPathActive(item);

                  if (!hasChildren) {
                    return (
                      <Link
                        key={item.id}
                        to={item.path}
                        onClick={onCloseMobile}
                        className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                          isActive
                            ? "bg-[#10182f] text-[#f1f5f9] border-l-4 border-[#3b82f6] shadow-sm font-semibold border border-[#1e2a4a]"
                            : "text-[#94a3b8] hover:bg-[#10182f]/60 hover:text-[#f1f5f9]"
                        }`}
                        title={item.label}
                      >
                        <NavIcon
                          name={item.icon}
                          className={`w-4 h-4 transition-colors ${
                            isActive
                              ? "text-[#3b82f6]"
                              : "text-[#94a3b8] group-hover:text-[#f1f5f9]"
                          }`}
                        />
                        {!collapsed && (
                          <span className="truncate flex-1">{item.label}</span>
                        )}
                        {!collapsed && item.badge && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500/20 text-[#2DD4BF] border border-emerald-500/30">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  }

                  const hasActiveSub = item.children.some(isPathActive) || isPathActive(item);

                  return (
                    <div key={item.id} className="rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleModule(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          hasActiveSub
                            ? "bg-[#10182f] text-[#f1f5f9] font-semibold border border-[#1e2a4a]"
                            : "text-[#94a3b8] hover:bg-[#10182f]/60 hover:text-[#f1f5f9]"
                        }`}
                        title={item.label}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <NavIcon
                            name={item.icon}
                            className={`w-4 h-4 shrink-0 ${
                              hasActiveSub
                                ? "text-[#3b82f6]"
                                : "text-[#94a3b8]"
                            }`}
                          />
                          {!collapsed && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </div>

                        {!collapsed && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.badge && (
                              <span className="px-1.5 py-0.2 text-[9px] font-semibold rounded bg-[#1e2a4a] text-[#94a3b8] border border-[#1e2a4a]">
                                {item.badge}
                              </span>
                            )}
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-[#94a3b8] transition-transform duration-200" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-[#94a3b8] transition-transform duration-200" />
                            )}
                          </div>
                        )}
                      </button>

                      {!collapsed && isExpanded && (
                        <div className="ml-3 pl-2.5 my-1 border-l border-[#1e2a4a] space-y-0.5 transition-all">
                          {item.children.map((sub) => {
                            const isSubActive = isPathActive(sub);
                            return (
                              <Link
                                key={sub.id}
                                to={sub.path}
                                onClick={onCloseMobile}
                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11.5px] transition-all duration-150 ${
                                  isSubActive
                                    ? "bg-[#10182f] text-[#f1f5f9] font-semibold border-l-2 border-[#3b82f6] pl-2 shadow-xs border border-[#1e2a4a]"
                                    : "text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#10182f]/50"
                                }`}
                              >
                                <NavIcon
                                  name={sub.icon}
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    isSubActive
                                      ? "text-[#3b82f6]"
                                      : "text-[#64748b]"
                                  }`}
                                />
                                <span className="truncate">{sub.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {!collapsed && (
          <div className="p-3 border-t border-[#1e2a4a] shrink-0 bg-[#07162c] space-y-2.5">
            <div className="flex items-center gap-2.5 px-2 py-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-xs text-white shadow-xs">
                {user?.initials || "—"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#f1f5f9] truncate">
                  {user?.name || "—"}
                </p>
                <p className="text-[10px] text-[#94a3b8] truncate">
                  {user?.role || "—"}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
