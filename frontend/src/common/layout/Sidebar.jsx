import React, { useState } from 'react'
import {
  LayoutGrid,
  Search,
  Globe,
  PlusCircle,
  ChevronRight,
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
} from 'lucide-react'

// Icon mapping helper
const iconMap = {
  LayoutGrid: LayoutGrid,
  Sun: Sun,
  Truck: Truck,
  ShoppingCart: ShoppingCart,
  Landmark: Landmark,
  Users: Users,
  Box: Box,
  Layers: Layers,
  ShieldCheck: ShieldCheck,
  Activity: Activity,
}

export default function Sidebar({
  sections,
  activeModuleId,
  onSelectModule,
  onOpenAddModuleModal,
  user,
}) {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <aside className="w-64 bg-[#141d30] text-slate-300 flex flex-col h-full border-r border-slate-800/90 select-none shrink-0 transition-all duration-200">
      {/* Top Branding */}
      <div className="px-5 py-5 flex items-center space-x-3 border-b border-slate-800/60">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-900/30">
          <Globe className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-white font-bold text-base tracking-tight leading-none">
            Meridian
          </div>
          <div className="text-[10px] font-semibold text-cyan-400/90 tracking-wider mt-1 uppercase">
            ERP Cloud
          </div>
        </div>
      </div>

      {/* Quick Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full bg-[#0d1424] text-xs text-slate-200 placeholder-slate-400 pl-8 pr-8 py-2 rounded-lg border border-slate-750 focus:outline-none focus:ring-1 focus:ring-blue-500/60 focus:border-blue-500 transition"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1 py-0.5 text-[9px] font-semibold text-slate-400 bg-slate-800 rounded border border-slate-700">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Main Navigation Items (Single Module without any submodules) */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {sections.map((section) => {
          const filteredItems = section.items.filter((item) => {
            if (!searchQuery) return true
            return item.name.toLowerCase().includes(searchQuery.toLowerCase())
          })

          if (filteredItems.length === 0) return null

          return (
            <div key={section.id} className="space-y-1.5">
              {/* Section Header Title */}
              {section.title && (
                <div className="px-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  {section.title}
                </div>
              )}

              {/* Module Items (Single-level modules, NO submodules) */}
              <div className="space-y-1">
                {filteredItems.map((item) => {
                  const IconComponent = iconMap[item.icon] || LayoutGrid
                  const isActive = activeModuleId === item.id || (!activeModuleId && item.active)

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectModule(item)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                        isActive
                          ? 'bg-blue-600/20 text-white font-semibold shadow-inner border border-blue-500/30'
                          : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <IconComponent
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-blue-400' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Dynamic Module Addition Button */}
        <div className="pt-2 px-1">
          <button
            type="button"
            onClick={onOpenAddModuleModal}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 border border-dashed border-slate-700 hover:border-blue-400 rounded-lg text-xs font-medium text-slate-400 hover:text-blue-300 hover:bg-slate-800/40 transition cursor-pointer group"
          >
            <FolderPlus className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition" />
            <span>+ Add Module</span>
          </button>
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-[#0f1728]">
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition cursor-pointer">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow">
              {user.initials}
            </div>
            <div className="min-w-0 text-left">
              <div className="text-xs font-semibold text-white truncate">
                {user.name}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {user.role}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </div>
      </div>
    </aside>
  )
}
