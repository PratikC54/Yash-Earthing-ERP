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
  onLogout,
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
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0d1424] text-xs text-slate-200 placeholder-slate-500 pl-8 pr-3 py-1.5 rounded-lg border border-slate-700/60 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        {sections.map((section) => {
          const filteredItems = section.items.filter((item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
          )

          if (filteredItems.length === 0 && searchQuery) {
            return null
          }

          return (
            <div key={section.id} className="space-y-1">
              <div className="px-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {section.title}
              </div>

              <div className="space-y-0.5 mt-1">
                {filteredItems.map((item) => {
                  const Icon = iconMap[item.icon] || LayoutGrid
                  const isActive = activeModuleId === item.id

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectModule(item)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-white' : 'text-slate-400'
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
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow">
              {user?.initials || 'U'}
            </div>
            <div className="min-w-0 text-left">
              <div className="text-xs font-semibold text-white truncate max-w-[100px]">
                {user?.name || 'User'}
              </div>
              <div className="text-[11px] text-slate-400 truncate max-w-[100px]">
                {user?.role || 'Staff'}
              </div>
            </div>
          </div>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
