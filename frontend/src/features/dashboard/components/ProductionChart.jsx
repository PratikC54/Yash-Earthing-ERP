import React, { useState } from 'react'

export default function ProductionChart({ data }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)

  const yTicks = [100, 75, 50, 25, 0]
  const chartHeight = 170

  return (
    <div className="bg-[#10182f] rounded-2xl p-5 border border-[#1e2a4a] shadow-md flex flex-col justify-between">
      {/* Header and Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="text-sm font-bold text-[#f1f5f9] tracking-tight">
          Production Output vs. Plan
        </h3>
        <div className="flex items-center space-x-4 text-xs font-medium text-[#94a3b8]">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#3b82f6]" />
            <span>Output</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#1e2a4a] border border-[#3b82f6]/40" />
            <span>Plan</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      {data.length === 0 ? (
        <p className="py-12 text-center text-xs text-[#94a3b8]">
          No production output data available.
        </p>
      ) : (
      <div className="relative pt-2">
        {/* Y Axis Grid lines */}
        <div className="flex flex-col justify-between" style={{ height: `${chartHeight}px` }}>
          {yTicks.map((tick) => (
            <div key={tick} className="flex items-center w-full">
              <span className="w-6 text-[10px] text-[#64748b] font-mono text-right pr-2">
                {tick}
              </span>
              <div className="flex-1 border-b border-[#1e2a4a] border-dashed" />
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
                  <div className="absolute -top-11 z-20 bg-[#0a1020] border border-[#1e2a4a] text-[#f1f5f9] text-[11px] rounded-md px-2 py-1 shadow-lg pointer-events-none whitespace-nowrap">
                    <span className="font-semibold text-[#f1f5f9]">{item.month}: </span>
                    <span className="text-[#3b82f6]">Out {item.output}%</span> |{' '}
                    <span className="text-[#94a3b8]">Plan {item.plan}%</span>
                  </div>
                )}

                {/* Paired Bars */}
                <div className="flex items-end space-x-1">
                  {/* Plan bar */}
                  <div
                    style={{ height: `${planHeight}px` }}
                    className="w-2 sm:w-2.5 bg-[#1e2a4a] border border-[#3b82f6]/30 rounded-t-sm transition-all duration-300 group-hover:brightness-125"
                  />
                  {/* Output bar */}
                  <div
                    style={{ height: `${outputHeight}px` }}
                    className="w-2 sm:w-2.5 bg-[#3b82f6] rounded-t-sm transition-all duration-300 group-hover:brightness-110"
                  />
                </div>

                {/* Month label */}
                <span className="text-[10px] font-medium text-[#64748b] mt-2 group-hover:text-[#f1f5f9] transition">
                  {item.month}
                </span>
              </div>
            )
          })}
        </div>
      </div>
      )}
    </div>
  )
}
