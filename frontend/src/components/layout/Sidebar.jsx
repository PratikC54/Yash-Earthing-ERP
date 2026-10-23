import React, { useState } from "react";
import {
  LayoutGrid,
  Search,
  Globe,
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
  LogOut,
  PhoneCall,
  PhoneForwarded,
  FileText,
  Sparkles,
  X,
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
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 bg-gradient-to-b from-[#07162c] via-[#0b1f3a] to-[#08172e] text-slate-200 flex flex-col h-full border-r border-[#1a2c4e] select-none shrink-0 transition-transform duration-300 shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Branding matching Demo HTML */}
        <div className="px-5 py-4 border-b border-[#1b2d50] flex items-center justify-between">
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

          {/* Close button on mobile */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Workflow mini-badge from Demo HTML */}
        <div className="mx-4 mt-3 px-2.5 py-1.5 rounded-lg bg-blue-950/40 border border-blue-500/20 text-[10px] text-slate-300 leading-snug">
          <div className="flex items-center space-x-1.5 text-cyan-300 font-bold mb-0.5">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Workflow Pipeline</span>
          </div>
          <span className="text-[9.5px] text-slate-400">
            Lead → Quote → Revise → PI → PO → SO → Dispatch
          </span>
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

            if (filteredItems.length === 0) return null

            return (
              <div key={section.id} className="space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400/90 flex items-center justify-between">
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
                        onClick={() => {
                          onSelectModule(item)
                          if (onClose) onClose()
                        }}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-left transition-all duration-150 group cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md shadow-blue-600/30 ring-1 ring-white/20'
                            : 'text-slate-300 hover:text-white hover:bg-[#122240]/80'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-[#122240] text-slate-400 group-hover:text-cyan-400 group-hover:bg-[#162c52]'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold truncate leading-tight">
                              {item.name}
                            </span>
                            {item.badge && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                                  isActive
                                    ? 'bg-white/25 text-white'
                                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                }`}
                              >
                                {item.badge}
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
    </>
  )
}
