import React, { useState } from 'react'
import { Filter } from 'lucide-react'
import KpiCards from './KpiCards'
import ProductionChart from './ProductionChart'
import WarehouseUtilization from './WarehouseUtilization'
import RecentOrdersTable from './RecentOrdersTable'
import {
  kpiMetrics,
  productionChartData,
  warehouseUtilizationData,
  recentProductionOrders,
} from '../../../data/dashboardData'

export default function OperationsOverview({ subModuleTitle }) {
  const [filterActive, setFilterActive] = useState(false)

  const displayedOrders = filterActive
    ? recentProductionOrders.filter((o) => o.status === 'Running')
    : recentProductionOrders

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-[#070e1e] text-[#f1f5f9] min-h-full">
      {/* Page Title & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#f1f5f9] tracking-tight leading-tight">
            {subModuleTitle || 'Operations Overview'}
          </h1>
          <p className="text-xs sm:text-sm text-[#94a3b8] font-normal mt-0.5">
            Operational data from connected ERP records
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Filters Toggle Button */}
          <button
            type="button"
            onClick={() => setFilterActive((prev) => !prev)}
            className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer shadow-2xs ${
              filterActive
                ? 'bg-[#3b82f6]/10 border-[#3b82f6]/30 text-[#3b82f6]'
                : 'bg-[#10182f] border-[#1e2a4a] text-[#94a3b8] hover:bg-slate-800/40 hover:text-[#f1f5f9]'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-[#94a3b8]" />
            <span>Filters {filterActive && '(Running Only)'}</span>
          </button>

        </div>
      </div>

      {/* KPI Cards Grid */}
      <KpiCards metrics={kpiMetrics} />

      {/* Middle Row: Production Output Chart + Warehouse Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 xl:col-span-8">
          <ProductionChart data={productionChartData} />
        </div>
        <div className="lg:col-span-5 xl:col-span-4">
          <WarehouseUtilization warehouses={warehouseUtilizationData} />
        </div>
      </div>

      {/* Bottom Section: Recent Production Orders Table */}
      <RecentOrdersTable orders={displayedOrders} />

    </div>
  )
}
