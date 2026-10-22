import React, { useState } from 'react'
import { Filter, Plus } from 'lucide-react'
import KpiCards from './KpiCards'
import ProductionChart from './ProductionChart'
import WarehouseUtilization from './WarehouseUtilization'
import RecentOrdersTable from './RecentOrdersTable'
import OrderModal from './OrderModal'
import {
  kpiMetrics,
  productionChartData,
  warehouseUtilizationData,
  recentProductionOrders,
} from '../../data/dashboardData'

export default function OperationsOverview({ subModuleTitle }) {
  const [orders, setOrders] = useState(recentProductionOrders)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [filterActive, setFilterActive] = useState(false)

  const handleAddOrder = (newOrder) => {
    setOrders((prev) => [newOrder, ...prev])
  }

  const displayedOrders = filterActive
    ? orders.filter((o) => o.status === 'Running')
    : orders

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-[#edf1f7] text-slate-800 min-h-full">
      {/* Page Title & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
            {subModuleTitle || 'Operations Overview'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
            Plant network performance · fiscal period FY26·Q1
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Filters Toggle Button */}
          <button
            type="button"
            onClick={() => setFilterActive((prev) => !prev)}
            className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer shadow-2xs ${
              filterActive
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filters {filterActive && '(Running Only)'}</span>
          </button>

          {/* New Order Primary Button */}
          <button
            type="button"
            onClick={() => setIsOrderModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#141d30] text-white hover:bg-slate-800 active:scale-98 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Order</span>
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

      {/* Modal for creating new orders */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onAddOrder={handleAddOrder}
      />
    </div>
  )
}
