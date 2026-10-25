import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  Plus,
  ChevronDown,
  ChevronRight,
  Layers,
  LogOut,
  X
} from "lucide-react";
import NotificationBell from "./NotificationBell";
import { findNavItemByPath } from "../../config/navigationConfig";
import authService from "../../services/authService";

export default function ERPNavbar({
  onToggleMobileSidebar = () => {},
  onOpenQuickAction = () => {},
  onClose = null,
  user = null,
  userError = "",
}) {
  const location = useLocation();

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const quickAddRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close popovers on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (quickAddRef.current && !quickAddRef.current.contains(event.target)) {
        setIsQuickAddOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute breadcrumbs dynamically based on path
  const currentNavItem = findNavItemByPath(location.pathname);

  return (
    <header className="sticky top-0 z-30 h-16 sm:h-[70px] bg-[#0b172d] border-b border-[#1b2f56] px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 select-none shrink-0 shadow-sm">
      {/* 1. LEFT: Mobile Sidebar Trigger + Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#1e2a4a]/50 transition-colors"
          aria-label="Toggle Navigation Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dynamic Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm overflow-hidden whitespace-nowrap">
          <Link
            to="/pq/dashboard"
            className="text-[#94a3b8] hover:text-white font-medium transition-colors flex items-center gap-1.5 shrink-0"
          >
            <span className="font-extrabold text-[#3b82f6] bg-[#10182f] px-1.5 py-0.5 rounded border border-[#1e2a4a] text-[11px] shrink-0">
              YG
            </span>
            <span className="hidden sm:inline text-[#f1f5f9]">Yash Group ERP</span>
          </Link>

          <ChevronRight className="w-3.5 h-3.5 text-[#64748b] shrink-0" />

          {currentNavItem?.parentLabel ? (
            <>
              <span className="text-[#94a3b8] truncate hidden md:inline">
                {currentNavItem.parentLabel}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-[#64748b] shrink-0 hidden md:inline" />
              <span className="text-[#f1f5f9] font-semibold truncate bg-[#10182f] px-2 py-0.5 rounded border border-[#1e2a4a]">
                {currentNavItem.label}
              </span>
            </>
          ) : (
            <span className="text-[#f1f5f9] font-semibold truncate bg-[#10182f] px-2 py-0.5 rounded border border-[#1e2a4a]">
              {currentNavItem ? currentNavItem.label : "Production & Quality"}
            </span>
          )}
        </nav>
      </div>

      {/* 2. CENTER: Quick Add */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end lg:justify-center max-w-xl">
        {/* Quick Add Button */}
        <div ref={quickAddRef} className="relative">
          <button
            type="button"
            onClick={() => setIsQuickAddOpen((prev) => !prev)}
            className="flex items-center gap-1.5 h-9.5 px-3 rounded-lg bg-[#3b82f6] hover:bg-blue-600 text-white text-xs sm:text-sm font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50 cursor-pointer"
            title="Create New ERP Record"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Quick Add</span>
          </button>

          {isQuickAddOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-[#10182f] border border-[#1e2a4a] rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8] border-b border-[#1e2a4a]">
                Create Record
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsQuickAddOpen(false);
                  onOpenQuickAction("work_order");
                }}
                className="w-full px-3 py-2 text-left text-xs text-[#f1f5f9] hover:bg-slate-800/40 hover:text-[#3b82f6] transition-colors flex items-center gap-2.5 cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                <span>New Work Order</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsQuickAddOpen(false);
                  onOpenQuickAction("inspection");
                }}
                className="w-full px-3 py-2 text-left text-xs text-[#f1f5f9] hover:bg-slate-800/40 hover:text-[#3b82f6] transition-colors flex items-center gap-2.5 cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                <span>Log Quality Inspection</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. RIGHT: Active Module Pill + User Profile */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Active Module Indicator */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#10182f] border border-[#1e2a4a] text-[11px]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF] animate-pulse" />
          <span className="text-[#94a3b8]">Active:</span>
          <span className="text-[#f1f5f9] font-semibold">
            {currentNavItem?.parentLabel || currentNavItem?.label || "Production & Quality"}
          </span>
        </div>

        {/* Smart Alerts & Notification Bell */}
        <NotificationBell />

        {/* User Profile Card / Dropdown */}
        <div ref={userMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1 sm:px-2 sm:py-1.5 rounded-lg hover:bg-slate-800/40 transition-colors focus:outline-none cursor-pointer"
            aria-label="User Account Menu"
          >
            {/* Avatar Circle */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-xs text-white ring-2 ring-[#1e2a4a]">
              {user?.initials || "—"}
            </div>

            {/* User Info */}
            <div className="hidden md:flex flex-col text-left leading-none">
              <span className="text-xs font-semibold text-[#f1f5f9] flex items-center gap-1">
                {user?.name || "—"}
              </span>
              <span className="text-[11px] text-[#94a3b8] mt-0.5">
                {user?.role || "—"}
              </span>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-[#94a3b8] hidden md:block" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-[#10182f] border border-[#1e2a4a] rounded-xl shadow-2xl py-1.5 z-50">
              <div className="px-3.5 py-2.5 border-b border-[#1e2a4a] bg-[#0a1020]">
                <div className="text-xs font-semibold text-[#f1f5f9]">{user?.name || "—"}</div>
                {user?.email && (
                  <div className="text-[11px] text-[#94a3b8]">{user.email}</div>
                )}
                {user?.department && (
                  <div className="mt-1.5 text-[10px] font-medium text-[#2DD4BF] bg-[#2DD4BF]/10 px-2 py-0.5 rounded border border-[#2DD4BF]/30 inline-block">
                    {user.department}
                  </div>
                )}
                {userError && (
                  <div className="mt-1 text-[10px] text-rose-300">{userError}</div>
                )}
              </div>

              <div className="py-1">
                <Link
                  to="/pq/dashboard"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="w-full px-3.5 py-2 text-left text-xs text-[#f1f5f9] hover:bg-slate-800/40 flex items-center gap-2"
                >
                  <Layers className="w-3.5 h-3.5 text-[#94a3b8]" />
                  <span>Operations Overview</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    authService.logout();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Close Button moved to suitable place in top header */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#1e2a4a] bg-[#10182f] text-xs font-semibold text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-slate-800/60 hover:border-slate-600 transition cursor-pointer"
            title="Close and return to the previous or parent page"
            aria-label="Close and return to the previous or parent page"
          >
            <X className="w-3.5 h-3.5 text-[#94a3b8]" />
            <span className="hidden sm:inline">Close</span>
          </button>
        )}
      </div>
    </header>
  );
}
