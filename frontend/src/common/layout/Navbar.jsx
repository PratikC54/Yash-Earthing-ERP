import { useState } from 'react'
import { Search, Sparkles, UserCheck, Plus, Menu, Building2 } from 'lucide-react'

export default function Navbar({
  activeModule = 'Dashboard',
  activeSubModule,
  onSearch,
  onScopeChange,
  isAdmin = false,
  user,
  onOpenAdminApprovals,
  onOpenTrace,
  onQuickAdd,
  onToggleSidebar,
  onToggleMobileSidebar,
}) {
  const [searchScope, setSearchScope] = useState('ALL')
  const handleToggle = onToggleSidebar || onToggleMobileSidebar

  const handleScopeChange = (e) => {
    const val = e.target.value
    setSearchScope(val)
    if (onScopeChange) onScopeChange(val)
  }

  return (
    <header className="sticky top-0 z-30 bg-[#0b172d] border-b border-[#1b2f56] px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between transition-colors duration-200 shadow-xl shrink-0">
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
          <span className="hidden md:inline text-slate-400 font-medium">
            Yash Group ERP
          </span>
          <span className="hidden md:inline text-slate-600">/</span>
          <span className="text-white font-bold tracking-tight truncate">
            {activeModule}
          </span>
          {activeSubModule && activeSubModule !== activeModule && (
            <>
              <span className="text-slate-600">/</span>
              <span className="text-cyan-400 font-semibold truncate">
                {activeSubModule}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right Controls: Company Role Badge, Search with Filter, Trace, Quick Add, Approvals */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Company & Management Role Badge */}
        <div className="hidden xl:flex items-center space-x-2 px-2.5 py-1 rounded-xl bg-[#0a1428] border border-[#1b2f56] text-xs shadow-inner">
          <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="font-bold text-slate-200">Management Control</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-900/60 text-cyan-300 border border-blue-500/40 uppercase">
            {user?.role || 'ADMIN'}
          </span>
        </div>

        {/* Trace Job Action */}
        {onOpenTrace && (
          <button
            type="button"
            onClick={onOpenTrace}
            className="hidden md:flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#0a1428] hover:bg-slate-800 text-slate-200 hover:text-white border border-[#1b2f56] text-xs font-semibold transition cursor-pointer"
            title="Trace any job or customer order across ERP"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Trace Job</span>
          </button>
        )}

        {/* Quick Add */}
        {onQuickAdd && (
          <button
            type="button"
            onClick={onQuickAdd}
            className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/30 cursor-pointer"
            title="Quick action"
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
            className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-cyan-300 border border-blue-500/40 text-xs font-semibold transition cursor-pointer"
            title="Review pending user registrations"
          >
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Approvals</span>
          </button>
        )}

        {/* Search Bar with Integrated Module Scope Filter */}
        <div className="flex items-center rounded-xl bg-[#0a1020] border border-[#1b2f56] overflow-hidden shadow-inner w-44 sm:w-60 md:w-80">
          <select
            value={searchScope}
            onChange={handleScopeChange}
            className="bg-[#0e1b34] text-slate-300 text-[11px] font-semibold px-2 py-1.5 border-r border-[#1b2f56] focus:outline-none cursor-pointer shrink-0 hidden sm:block"
          >
            <option value="ALL">All Modules</option>
            <option value="M1">M1 · Sales</option>
            <option value="M2">M2 · Procurement</option>
            <option value="M3">M3 · Product</option>
            <option value="M6">M6 · Finance</option>
          </select>

          <div className="relative flex-1 flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search record, SKU, SO..."
              onChange={(e) => onSearch && onSearch(e.target.value)}
              className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-xs pl-8 pr-2.5 py-1.5 focus:outline-none transition"
            />
          </div>
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
