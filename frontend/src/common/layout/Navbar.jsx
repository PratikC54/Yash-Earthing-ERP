import { Search, Bell, Sparkles, UserCheck } from 'lucide-react'

export default function Navbar({
  activeModule = 'Dashboard',
  activeSubModule,
  onSearch,
  isAdmin = false,
  onOpenAdminApprovals,
}) {
  return (
    <header className="bg-[#0b172d] border-b border-[#1b2f56] px-6 py-3.5 flex items-center justify-between transition-colors duration-200 shadow-md shrink-0">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm">
        <span className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer font-medium">
          Yash Group ERP
        </span>
        <span className="text-slate-600">/</span>
        <span className="text-white font-semibold tracking-tight">
          {activeModule}
        </span>
        {activeSubModule && activeSubModule !== activeModule && (
          <>
            <span className="text-slate-600">/</span>
            <span className="text-cyan-400 font-medium">
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

        {/* Quick Search input */}
        <div className="relative w-64 sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Yash ERP (leads, quotes, SO)..."
            onChange={(e) => onSearch && onSearch(e.target.value)}
            className="w-full bg-[#071325] text-slate-100 placeholder-slate-400 text-xs pl-9 pr-10 py-2 rounded-lg border border-[#1b2f56] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition shadow-inner"
          />
        </div>

        {/* Notifications Icon Button */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative p-2 rounded-lg bg-[#071325] hover:bg-slate-800 text-slate-300 hover:text-white border border-[#1b2f56] transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0b172d]" />
        </button>

        {/* System Status Pill */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#071325] border border-[#1b2f56] text-xs text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-200">Module 1 Active</span>
        </div>
      </div>
    </header>
  )
}
