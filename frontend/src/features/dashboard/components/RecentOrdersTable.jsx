import React from 'react'

export default function RecentOrdersTable({ orders }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Running':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
            <span>Running</span>
          </span>
        )
      case 'Quality Check':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-[#FACC15] border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FACC15]" />
            <span>Quality Check</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-[#94a3b8] border border-slate-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#64748b]" />
            <span>{status}</span>
          </span>
        )
    }
  }

  return (
    <div className="bg-[#10182f] rounded-2xl p-5 border border-[#1e2a4a] shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#f1f5f9] tracking-tight">
          Recent Production Orders
        </h3>
        <span className="text-xs text-[#64748b] font-normal">
          {orders.length} orders
        </span>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto rounded-xl border border-[#1e2a4a]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0b1329]">
            <tr className="border-b border-[#1e2a4a] text-[10px] font-bold tracking-wider text-[#94a3b8] uppercase">
              <th className="py-2.5 px-3 font-semibold">ORDER</th>
              <th className="py-2.5 px-3 font-semibold">PRODUCT</th>
              <th className="py-2.5 px-3 font-semibold">QTY</th>
              <th className="py-2.5 px-3 font-semibold">WORK CENTER</th>
              <th className="py-2.5 px-3 font-semibold">STATUS</th>
              <th className="py-2.5 px-3 font-semibold text-right">DUE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2a4a]">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-[#94a3b8]">
                  No production orders available.
                </td>
              </tr>
            ) : orders.map((order) => (
              <tr
                key={order.orderId}
                className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
              >
                <td className="py-3 px-3 font-semibold text-[#3b82f6] font-mono">
                  {order.orderId}
                </td>
                <td className="py-3 px-3">
                  <div className="font-semibold text-[#f1f5f9]">
                    {order.productName}
                  </div>
                  <div className="text-[11px] text-[#64748b] font-mono">
                    {order.sku}
                  </div>
                </td>
                <td className="py-3 px-3 font-mono text-[#f1f5f9] font-medium">
                  {order.quantity}
                </td>
                <td className="py-3 px-3 text-[#94a3b8] font-medium">
                  {order.workCenter}
                </td>
                <td className="py-3 px-3">
                  {getStatusBadge(order.status)}
                </td>
                <td className="py-3 px-3 text-right font-medium text-[#94a3b8]">
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
