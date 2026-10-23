export default function WarehouseUtilization({ warehouses, data }) {
  const items = warehouses || data || [];
  return (
    <div className="bg-[#10182f] rounded-2xl p-5 border border-[#1e2a4a] shadow-md flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#f1f5f9] tracking-tight">
          Warehouse Utilization
        </h3>
        <div className="flex items-center space-x-1.5 text-xs text-[#94a3b8] font-medium">
          <span className="w-2 h-2 rounded-full bg-[#2DD4BF] animate-pulse" />
          <span>ERP Data</span>
        </div>
      </div>

      {/* Progress Bars List */}
      <div className="space-y-4">
        {items.length === 0 && (
          <p className="text-xs text-[#94a3b8]">No warehouse data available.</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#f1f5f9] tracking-tight">
                {item.name}
              </span>
              <span className="font-mono text-[#94a3b8] text-[11px] font-medium">
                {item.percentage}%
              </span>
            </div>
            {/* Progress track */}
            <div className="w-full h-2.5 bg-[#0a1020] rounded-full overflow-hidden p-0.5 border border-[#1e2a4a]">
              <div
                style={{ width: `${item.percentage}%` }}
                className="h-full bg-[#3b82f6] rounded-full transition-all duration-500 shadow-2xs"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
