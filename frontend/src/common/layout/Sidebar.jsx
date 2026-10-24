import { useState } from 'react'
import {
  LayoutGrid,
  Search,
  Globe,
  Box,
  Layers,
  ShieldCheck,
  Activity,
  Sun,
  Truck,
  ShoppingCart,
  Landmark,
  Users,
  LogOut,
  PhoneCall,
  PhoneForwarded,
  FileText,
  Sparkles,
  X,
  TrendingUp,
  Settings,
  IndianRupee,
  Clock,
  CheckSquare,
  Award,
  CreditCard,
  Briefcase,
  Factory,
  ClipboardList,
  Target,
  CheckCircle2,
  Gauge,
  Wrench,
  FolderKanban,
  Headset,
  AlertTriangle,
} from 'lucide-react'

// Icon mapping helper
const iconMap = {
  LayoutGrid,
  Users,
  PhoneForwarded,
  PhoneCall,
  FileText,
  ShoppingCart,
  Landmark,
  Layers,
  Box,
  Sun,
  Activity,
  ShieldCheck,
  Truck,
  Globe,
  TrendingUp,
  Settings,
  IndianRupee,
  Clock,
  CheckSquare,
  Award,
  CreditCard,
  Briefcase,
  Factory,
  ClipboardList,
  Target,
  CheckCircle2,
  Gauge,
  Wrench,
  FolderKanban,
  Headset,
  AlertTriangle,
}

export default function Sidebar({
  sections,
  activeModuleId,
  onSelectModule,
  user,
  onLogout,
  isOpen = false,
  onClose,
}) {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 bg-[#0c1222] text-slate-100 flex flex-col h-full border-r border-[#1a233a] select-none shrink-0 transition-transform duration-300 shadow-xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Branding */}
        <div className="px-5 py-4 border-b border-[#1a233a] flex items-center justify-between bg-[#0a0f1d] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-black text-[#d4ff00] flex items-center justify-center shadow-sm ring-2 ring-[#d4ff00] font-black text-base tracking-wider shrink-0">
              YG
            </div>
            <div className="min-w-0">
              <div className="text-white font-black text-sm tracking-tight leading-snug">
                Yash Group ERP
              </div>
              <div className="text-[10px] font-extrabold text-[#d4ff00] tracking-wider uppercase truncate">
                V3 · ENTERPRISE CONTROL
              </div>
            </div>
          </div>

          {/* Close button on mobile */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Workflow Pipeline Pill */}
        <div className="mx-4 mt-3 px-3 py-2 rounded-xl bg-[#142018] border border-emerald-500/30 text-slate-200 leading-snug shrink-0 shadow-xs">
          <div className="flex items-center space-x-1.5 text-[#d4ff00] font-bold mb-0.5 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-[#d4ff00] shrink-0" />
            <span className="tracking-wide">Workflow Pipeline</span>
          </div>
          <span className="text-[10px] text-emerald-200/90 font-medium block">
            Lead → Quote → Revise → PI → PO → SO → Dispatch
          </span>
        </div>

        {/* Quick Search */}
        <div className="px-4 py-2.5 border-b border-[#1a233a] shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search modules & tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#131b2e] text-xs text-white placeholder-slate-400 pl-8 pr-3 py-2 rounded-xl border border-[#22304e] focus:outline-none focus:bg-[#18233c] focus:ring-2 focus:ring-[#d4ff00] focus:border-[#d4ff00] transition"
            />
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {sections.map((section) => {
            const filteredItems = section.items.filter((item) =>
              item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (item.desc && item.desc.toLowerCase().includes(searchQuery.toLowerCase()))
            )

            if (filteredItems.length === 0) return null

            return (
              <div key={section.id} className="space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400/90 flex items-center justify-between sidebar-section-title">
                  <span>{section.title}</span>
                </div>

                <div className="space-y-1">
                  {filteredItems.map((item) => {
                    const IconComponent = iconMap[item.icon] || LayoutGrid
                    const isActive = activeModuleId === item.id

                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-sidebar-btn="true"
                        data-sidebar-active={isActive ? "true" : "false"}
                        onClick={() => {
                          onSelectModule(item)
                          if (onClose) onClose()
                        }}
                        data-sidebar-active={isActive ? "true" : "false"}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-left transition-all duration-150 group cursor-pointer ${
                          isActive
                            ? 'bg-[#d4ff00] text-black font-black shadow-md ring-2 ring-[#d4ff00]'
                            : 'bg-transparent text-white hover:text-white hover:bg-[#18253d] font-bold'
                        }`}
                      >
                        <div
                          className={`sidebar-icon-wrap w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isActive
                              ? 'bg-black/10 text-black border border-black/20'
                              : 'bg-[#18253d] text-slate-200 border border-slate-700/60 group-hover:text-white group-hover:bg-[#202f4e]'
                          }`}
                        >
                          <IconComponent className={`w-4 h-4 ${isActive ? 'text-black stroke-[2.5]' : 'text-slate-100 group-hover:text-white stroke-[2]'}`} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span
                              className={`sidebar-item-name text-[13px] truncate leading-tight ${
                                isActive ? 'text-black font-black' : 'text-white font-extrabold group-hover:text-white'
                              }`}
                            >
                              {item.name}
                            </span>
                            {item.badge && (
                              <span
                                data-sidebar-badge="true"
                                className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                                  isActive
                                    ? 'bg-black text-[#d4ff00] border border-black/40 shadow-xs'
                                    : 'bg-[#182942] text-[#d4ff00] border border-[#d4ff00]/40'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.desc && (
                            <p
                              className={`sidebar-item-desc text-[11px] truncate mt-0.5 ${
                                isActive ? 'text-black font-black' : 'text-slate-200 font-medium group-hover:text-white'
                              }`}
                            >
                              {item.desc}
                            </p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-[#1a233a] bg-[#0a0f1d] shrink-0">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#11182a] border border-[#1e2a44] shadow-xs">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-black text-[#d4ff00] font-black text-xs flex items-center justify-center shrink-0 shadow-xs ring-1 ring-[#d4ff00]">
                {user?.initials || 'YG'}
              </div>
              <div className="min-w-0 text-left">
                <div className="text-xs font-extrabold text-white truncate max-w-[120px]">
                  {user?.name || 'Staff User'}
                </div>
                <div className="text-[10px] text-[#d4ff00] font-bold truncate max-w-[120px]">
                  {user?.role || 'BACK_OFFICER'}
                </div>
              </div>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
