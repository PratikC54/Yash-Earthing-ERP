import React, { useState } from 'react'

export default function ProductionChart({ data }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)

  const yTicks = [100, 75, 50, 25, 0]
  const chartHeight = 170

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col justify-between">
      {/* Header and Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Production Output vs. Plan
        </h3>
        <div className="flex items-center space-x-4 text-xs font-medium text-slate-600">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#2563eb]" />
            <span>Output</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#bfdbfe]" />
            <span>Plan</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative pt-2">
        {/* Y Axis Grid lines */}
        <div className="flex flex-col justify-between" style={{ height: `${chartHeight}px` }}>
          {yTicks.map((tick) => (
            <div key={tick} className="flex items-center w-full">
              <span className="w-6 text-[10px] text-slate-400 font-mono text-right pr-2">
                {tick}
              </span>
              <div className="flex-1 border-b border-slate-100 border-dashed" />
            </div>
          ))}
        </div>

        {/* Bars Container overlaid */}
        <div
          className="absolute inset-x-0 bottom-0 flex items-end justify-between pl-8 pr-3"
          style={{ height: `${chartHeight}px` }}
        >
          {data.map((item, idx) => {
            const planHeight = (item.plan / 100) * (chartHeight - 16)
            const outputHeight = (item.output / 100) * (chartHeight - 16)
            const isHovered = hoveredIdx === idx

            return (
              <div
                key={item.month}
                className="flex flex-col items-center flex-1 group cursor-pointer relative"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Tooltip on hover */}
                {isHovered && (
                  <div className="absolute -top-11 z-20 bg-slate-900 text-white text-[11px] rounded-md px-2 py-1 shadow-lg pointer-events-none whitespace-nowrap">
                    <span className="font-semibold text-slate-200">{item.month}: </span>
                    <span className="text-blue-300">Out {item.output}%</span> |{' '}
                    <span className="text-slate-400">Plan {item.plan}%</span>
                  </div>
                )}

                {/* Paired Bars */}
                <div className="flex items-end space-x-1">
                  {/* Plan bar (Light blue) */}
                  <div
                    style={{ height: `${planHeight}px` }}
                    className="w-2 sm:w-2.5 bg-[#bfdbfe] rounded-t-sm transition-all duration-300 group-hover:brightness-95"
                  />
                  {/* Output bar (Dark blue) */}
                  <div
                    style={{ height: `${outputHeight}px` }}
                    className="w-2 sm:w-2.5 bg-[#2563eb] rounded-t-sm transition-all duration-300 group-hover:brightness-110"
                  />
                </div>

                {/* Month label */}
                <span className="text-[10px] font-medium text-slate-400 mt-2 group-hover:text-slate-800 transition">
                  {item.month}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
