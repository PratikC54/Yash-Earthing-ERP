import {
  Sparkles,
  Box,
  ShoppingCart,
  Landmark,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'

const iconComponents = {
  sparkles: Sparkles,
  cube: Box,
  cart: ShoppingCart,
  bank: Landmark,
}

export default function KpiCards({ metrics }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {metrics.map((item) => {
        const IconComponent = iconComponents[item.iconType] || Sparkles
        const isPositive = item.changeType === 'positive'

        return (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] transition-all duration-200 flex flex-col justify-between"
          >
            {/* Header: Title and Icon */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                {item.title}
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50/90 text-blue-600 flex items-center justify-center border border-blue-100/60 shadow-2xs">
                <IconComponent className="w-4 h-4" />
              </div>
            </div>

            {/* Value */}
            <div className="my-2.5">
              <div className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight leading-none">
                {item.value}
              </div>
            </div>

            {/* Footer: Trend Pill & Explanation */}
            <div className="flex items-center space-x-2 text-xs">
              <span
                className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md font-semibold text-[11px] ${
                  isPositive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                    : 'bg-rose-50 text-rose-700 border border-rose-200/70'
                }`}
              >
                {isPositive ? (
                  <ArrowUp className="w-3 h-3 stroke-[2.5]" />
                ) : (
                  <ArrowDown className="w-3 h-3 stroke-[2.5]" />
                )}
                <span>{item.change}</span>
              </span>
              <span className="text-slate-500 text-[11px] font-normal truncate">
                {item.subtext}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
