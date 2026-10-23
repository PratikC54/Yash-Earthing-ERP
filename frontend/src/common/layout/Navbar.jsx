import React from 'react'
import { Search, Bell, Sparkles, Menu } from 'lucide-react'

export default function Navbar({ activeModule = 'Procurement Dashboard', activeSubModule, onSearch, onToggleMobileSidebar }) {
  return (
    <header className="bg-[#0b172d] border-b border-[#1b2f56] px-4 sm:px-6 py-3.5 flex items-center justify-between transition-colors duration-200 shadow-md shrink-0">
      {/* Left side: Hamburger button + Breadcrumb */}
      <div className="flex items-center space-x-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Open navigation menu"
          className="lg:hidden p-1.5 rounded-xl bg-[#0a1020] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm truncate">
          <span className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors cursor-pointer">
            Yash ERP
          </span>
          <span className="text-slate-600">/</span>
          <span className="text-white font-semibold tracking-tight truncate">
            {activeModule}
          </span>
          {activeSubModule && activeSubModule !== activeModule && (
            <>
              <span className="text-slate-600">/</span>
              <span className="text-slate-400 font-medium truncate">
                {activeSubModule}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right Controls: Search bar & Notifications */}
      <div className="flex items-center space-x-2 sm:space-x-3.5 shrink-0">
        {/* Search input with keyboard shortcut (hidden on small mobile screens to prevent overflow) */}
        <div className="relative hidden md:block w-52 sm:w-72 lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Yash ERP..."
            onChange={(e) => onSearch && onSearch(e.target.value)}
            className="w-full bg-[#0a1020] text-slate-100 placeholder-slate-400 text-xs sm:text-sm pl-9 pr-12 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition shadow-inner"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-800/90 border border-slate-700 rounded shadow-xs">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Notifications Icon Button */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative p-2 rounded-xl bg-[#0a1020] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#0b172d]" />
        </button>

        {/* System Status Pill */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-xl bg-[#10182f] border border-[#1e2a4a] text-xs text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-medium text-slate-300">Module 2</span>
        </div>
      </div>
    </header>
  )
}
