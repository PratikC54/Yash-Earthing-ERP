import React from 'react'
import { Search, Sparkles, UserCheck, Plus, Menu, Bell } from 'lucide-react'

export default function Navbar({
  activeModule = 'Dashboard',
  activeSubModule,
  onSearch,
  isAdmin = false,
  onOpenAdminApprovals,
  onOpenTrace,
  onQuickAdd,
  onToggleSidebar,
  onToggleMobileSidebar,
}) {
  const handleToggle = onToggleSidebar || onToggleMobileSidebar

  return (
    <header className="bg-[#0b172d] border-b border-[#1b2f56] px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between transition-colors duration-200 shadow-md shrink-0">
      {/* Mobile Menu Button + Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
        {handleToggle && (
          <button
            type="button"
            onClick={handleToggle}
            className="lg:hidden p-1.5 rounded-lg bg-[#071325] hover:bg-slate-800 text-slate-300 hover:text-white border border-[#1b2f56] transition cursor-pointer shrink-0"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-4 h-4 text-cyan-400" />
          </button>
        )}

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
              <span className="text-cyan-400 font-medium truncate">
                {activeSubModule}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right Controls: Trace Job, Quick Add, Search bar, Admin Approvals */}
      <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
        {/* Trace Job Action */}
        {onOpenTrace && (
          <button
            type="button"
            onClick={onOpenTrace}
            className="hidden md:flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#071325] hover:bg-slate-800 text-slate-200 hover:text-white border border-[#1b2f56] text-xs font-semibold transition cursor-pointer"
            title="Trace any job or customer order across Module 1"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Trace Job</span>
          </button>
        )}

        {/* Quick Add Lead */}
        {onQuickAdd && (
          <button
            type="button"
            onClick={onQuickAdd}
            className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            title="Quickly capture and auto-assign inbound lead"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quick Add</span>
          </button>
        )}

        {/* Admin Approvals Quick Access */}
        {isAdmin && onOpenAdminApprovals && (
          <button
            type="button"
            onClick={onOpenAdminApprovals}
            className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-cyan-300 border border-blue-500/40 text-xs font-medium transition cursor-pointer"
            title="Review pending user registrations"
          >
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Approvals</span>
          </button>
        )}

        {/* Quick Search input */}
        <div className="relative w-32 sm:w-48 md:w-64">
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Yash ERP..."
            onChange={(e) => onSearch && onSearch(e.target.value)}
            className="w-full bg-[#071325] text-slate-100 placeholder-slate-400 text-xs pl-8 sm:pl-9 pr-2.5 py-1.5 rounded-lg border border-[#1b2f56] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition shadow-inner"
          />
        </div>

        {/* System Status Pill */}
        <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-[#071325] border border-[#1b2f56] text-xs text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-200">ERP Active</span>
        </div>
      </div>
    </header>
  )
}
