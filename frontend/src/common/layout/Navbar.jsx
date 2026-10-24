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
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-xs shrink-0 gap-2">
      {/* Mobile Menu Button + Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
        {handleToggle && (
          <button
            type="button"
            onClick={handleToggle}
            className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition cursor-pointer shrink-0 active:scale-95"
            aria-label="Toggle Navigation"
            title="Open Navigation Drawer"
          >
            <Menu className="w-4 h-4 text-slate-800" />
          </button>
        )}

        <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm truncate">
          <span className="hidden sm:inline text-slate-500 font-bold">
            Yash Group ERP
          </span>
          <span className="hidden sm:inline text-slate-300 font-bold">/</span>
          <span className="text-slate-900 font-black tracking-tight truncate">
            {activeModule}
          </span>
          {activeSubModule && activeSubModule !== activeModule && (
            <>
              <span className="text-slate-300 hidden sm:inline font-bold">/</span>
              <span className="text-emerald-700 font-extrabold truncate hidden sm:inline">
                {activeSubModule}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right Controls: Acid Theme Accurate Controls */}
      <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
        {/* Company & Management Role Badge */}
        <div className="hidden 2xl:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs shadow-xs">
          <Building2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <span className="font-extrabold text-slate-700">Management</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black bg-[#d4ff00] text-black border border-lime-400 uppercase">
            {user?.role || 'ADMIN'}
          </span>
        </div>

        {/* Trace Job Action */}
        {onOpenTrace && (
          <button
            type="button"
            onClick={onOpenTrace}
            className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
            title="Trace any job or customer order across ERP"
          >
            <Search className="w-3.5 h-3.5 text-slate-700 stroke-[2.5]" />
            <span className="hidden lg:inline">Trace Job</span>
          </button>
        )}

        {/* Quick Add (Acid Highlight Button) */}
        {onQuickAdd && (
          <button
            type="button"
            onClick={onQuickAdd}
            className="flex items-center space-x-1 px-3.5 py-1.5 rounded-xl bg-[#d4ff00] hover:bg-[#bfe600] text-black text-xs font-black transition shadow-xs border border-lime-400 cursor-pointer active:scale-95 shrink-0"
            title="Quickly add customer lead or requirement"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">Quick Add</span>
          </button>
        )}

        {/* Admin Approvals Quick Access */}
        {isAdmin && onOpenAdminApprovals && (
          <button
            type="button"
            onClick={onOpenAdminApprovals}
            className="hidden sm:flex items-center space-x-1 sm:space-x-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-extrabold transition cursor-pointer active:scale-95 shadow-xs"
            title="Review pending user registrations"
          >
            <UserCheck className="w-3.5 h-3.5 text-sky-700" />
            <span className="hidden lg:inline">Approvals</span>
          </button>
        )}

        {/* Search Bar with Integrated Module Scope Filter */}
        <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shadow-inner w-36 sm:w-56 md:w-64 lg:w-72">
          <select
            value={searchScope}
            onChange={handleScopeChange}
            className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-1.5 border-r border-slate-200 focus:outline-none cursor-pointer shrink-0 hidden md:block"
          >
            <option value="ALL">All Modules</option>
            <option value="M1">M1 · Sales</option>
            <option value="M2">M2 · Procurement</option>
            <option value="M3">M3 · Product</option>
            <option value="M4">M4 · Production</option>
            <option value="M5">M5 · Service</option>
            <option value="M6">M6 · Finance</option>
            <option value="M7">M7 · HRMS</option>
          </select>

          <div className="relative flex-1 flex items-center min-w-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              onChange={(e) => onSearch && onSearch(e.target.value)}
              className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-xs pl-8 pr-2.5 py-1.5 focus:outline-none transition min-w-0 font-medium"
            />
          </div>
        </div>

        {/* System Active Indicator */}
        <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 shadow-xs font-black">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Active</span>
        </div>
      </div>
    </header>
  )
}
