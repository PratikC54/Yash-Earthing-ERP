import { useState } from 'react'
import {
  LayoutGrid,
  Search,
  Globe,
  FolderPlus,
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
}

export default function Sidebar({
  sections,
  activeModuleId,
  onSelectModule,
  onOpenAddModuleModal,
  user,
  onLogout,
}) {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <aside className="w-72 bg-gradient-to-b from-[#07162c] via-[#0b1f3a] to-[#08172e] text-slate-200 flex flex-col h-full border-r border-[#1a2c4e] select-none shrink-0 transition-all duration-200 shadow-2xl z-20">
      {/* Top Branding matching Demo HTML */}
      <div className="px-5 py-4 border-b border-[#1b2d50]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 font-black text-white text-base tracking-wider shrink-0">
            YG
          </div>
          <div className="min-w-0">
            <div className="text-white font-extrabold text-sm tracking-tight leading-snug">
              Yash Group ERP
            </div>
            <div className="text-[10px] font-semibold text-cyan-400/90 tracking-wider uppercase truncate">
              V3 · Enterprise Control
            </div>
          </div>
        </div>

        {/* Workflow mini-badge from Demo HTML */}
        <div className="mt-3 px-2.5 py-1.5 rounded-lg bg-blue-950/40 border border-blue-500/20 text-[10px] text-slate-300 leading-snug">
          <div className="flex items-center space-x-1.5 text-cyan-300 font-bold mb-0.5">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Workflow Pipeline</span>
          </div>
          <span className="text-[9.5px] text-slate-400">
            Lead → Quote → Revise → PI → PO → SO → Dispatch
          </span>
        </div>
      </div>

      {/* Quick Search */}
      <div className="px-4 py-2.5 border-b border-[#15233e]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search modules & tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#071122]/90 text-xs text-slate-200 placeholder-slate-400 pl-8 pr-3 py-1.5 rounded-lg border border-[#1e3258] focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition"
          />
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
        {sections.map((section) => {
          const filteredItems = section.items.filter((item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.desc && item.desc.toLowerCase().includes(searchQuery.toLowerCase()))
          )

          if (filteredItems.length === 0 && searchQuery) {
            return null
          }

          return (
            <div key={section.id} className="space-y-1">
              <div className="px-2.5 text-[9.5px] font-bold text-slate-400 uppercase tracking-widest">
                {section.title}
              </div>

              <div className="space-y-1 mt-1">
                {filteredItems.map((item) => {
                  const Icon = iconMap[item.icon] || LayoutGrid
                  const isActive = activeModuleId === item.id

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectModule(item)}
                      className={`w-full flex items-start space-x-2.5 px-2.5 py-2 rounded-xl text-left transition-all duration-150 cursor-pointer group ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-700/30 font-semibold ring-1 ring-blue-400/50'
                          : 'text-slate-300 hover:text-white hover:bg-[#112344]/70'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition ${
                          isActive
                            ? 'bg-white/20 text-white shadow-inner'
                            : 'bg-slate-800/60 text-slate-400 group-hover:text-blue-300 group-hover:bg-blue-950/60'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs truncate font-medium">
                            {item.name}
                          </span>
                          {item.badge && (
                            <span className="ml-1 px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                              {item.badge}
                            </span>
                          )}
                          {item.isExternal && (
                            <span className="ml-1 text-[8px] font-semibold text-slate-500">
                              Ext
                            </span>
                          )}
                        </div>
                        {item.desc && (
                          <p
                            className={`text-[9.5px] truncate mt-0.5 ${
                              isActive ? 'text-blue-100' : 'text-slate-400'
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

        {/* Dynamic Module Addition Button */}
        {onOpenAddModuleModal && (
          <div className="pt-2 px-1">
            <button
              type="button"
              onClick={onOpenAddModuleModal}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 border border-dashed border-[#223964] hover:border-blue-400 rounded-xl text-xs font-medium text-slate-400 hover:text-blue-300 hover:bg-[#0f203e]/40 transition cursor-pointer group"
            >
              <FolderPlus className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition" />
              <span>+ Add Custom View</span>
            </button>
          </div>
        )}
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-[#1a2d52] bg-[#071325]">
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#0b1b36]/60 border border-[#1b2f56]">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow">
              {user?.initials || 'YG'}
            </div>
            <div className="min-w-0 text-left">
              <div className="text-xs font-bold text-white truncate max-w-[120px]">
                {user?.name || 'Staff User'}
              </div>
              <div className="text-[10px] text-cyan-400 font-medium truncate max-w-[120px]">
                {user?.role || 'BACK_OFFICER'}
              </div>
            </div>
          </div>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
