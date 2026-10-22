import React from 'react'

export default function WarehouseUtilization({ warehouses }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Warehouse Utilization
        </h3>
        <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live</span>
        </div>
      </div>

      {/* Progress Bars List */}
      <div className="space-y-4">
        {warehouses.map((item) => (
          <div key={item.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 tracking-tight">
                {item.name}
              </span>
              <span className="font-mono text-slate-500 text-[11px] font-medium">
                {item.percentage}%
              </span>
            </div>
            {/* Progress track */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
              <div
                style={{ width: `${item.percentage}%` }}
                className="h-full bg-blue-600 rounded-full transition-all duration-500 shadow-2xs"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
