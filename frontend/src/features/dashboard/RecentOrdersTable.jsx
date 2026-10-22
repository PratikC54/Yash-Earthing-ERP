import React from 'react'

export default function RecentOrdersTable({ orders }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Running':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span>Running</span>
          </span>
        )
      case 'Quality Check':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Quality Check</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            <span>{status}</span>
          </span>
        )
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Recent Production Orders
        </h3>
        <span className="text-xs text-slate-400 font-normal">
          312 active across 4 lines
        </span>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              <th className="pb-3 font-semibold">ORDER</th>
              <th className="pb-3 font-semibold">PRODUCT</th>
              <th className="pb-3 font-semibold">QTY</th>
              <th className="pb-3 font-semibold">WORK CENTER</th>
              <th className="pb-3 font-semibold">STATUS</th>
              <th className="pb-3 font-semibold text-right">DUE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <tr
                key={order.orderId}
                className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
              >
                <td className="py-3.5 font-semibold text-blue-600 font-mono">
                  {order.orderId}
                </td>
                <td className="py-3.5">
                  <div className="font-semibold text-slate-800">
                    {order.productName}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {order.sku}
                  </div>
                </td>
                <td className="py-3.5 font-mono text-slate-700 font-medium">
                  {order.quantity}
                </td>
                <td className="py-3.5 text-slate-600 font-medium">
                  {order.workCenter}
                </td>
                <td className="py-3.5">
                  {getStatusBadge(order.status)}
                </td>
                <td className="py-3.5 text-right font-medium text-slate-600">
                  {order.dueDate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
