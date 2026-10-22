import { Search, Bell, Sparkles, UserCheck } from 'lucide-react'

export default function Navbar({
  activeModule = 'Dashboard',
  activeSubModule,
  onSearch,
  isAdmin = false,
  onOpenAdminApprovals,
}) {
  return (
    <header className="bg-[#141d30] border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between transition-colors duration-200 shadow-sm shrink-0">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm">
        <span className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer font-medium">
          Meridian
        </span>
        <span className="text-slate-600">/</span>
        <span className="text-white font-semibold tracking-tight">
          {activeModule}
        </span>
        {activeSubModule && activeSubModule !== activeModule && (
          <>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300 font-medium">
              {activeSubModule}
            </span>
          </>
        )}
      </div>

      {/* Right Controls: Search bar, Admin Approvals & Notifications */}
      <div className="flex items-center space-x-3.5">
        {/* Admin Approvals Quick Access */}
        {isAdmin && (
          <button
            type="button"
            onClick={onOpenAdminApprovals}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-cyan-300 border border-blue-500/40 text-xs font-medium transition cursor-pointer"
            title="Review pending user registrations"
          >
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>User Approvals</span>
          </button>
        )}

        {/* Search input with keyboard shortcut */}
        <div className="relative w-72 sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Meridian"
            onChange={(e) => onSearch && onSearch(e.target.value)}
            className="w-full bg-[#0d1424] text-slate-100 placeholder-slate-400 text-sm pl-9 pr-12 py-1.5 rounded-lg border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition shadow-inner"
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
          className="relative p-2 rounded-lg bg-[#0d1424] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[#141d30]" />
        </button>

        {/* System Status Pill */}
        <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-[#0d1424] border border-slate-700/80 text-xs text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-medium text-slate-300">FY26·Q1</span>
        </div>
      </div>
    </header>
  )
}
