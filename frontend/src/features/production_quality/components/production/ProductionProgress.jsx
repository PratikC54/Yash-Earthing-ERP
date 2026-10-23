import React from "react";
import { calculateProgress, formatQuantity } from "../../utils/productionQualityHelpers";

/**
 * Visual Production Progress Bar Component with Yash Group ERP dark-blue theme
 */
export default function ProductionProgress({
  produced = 0,
  planned = 0,
  rejected = 0,
  unit = "NOS",
  showLabels = true,
  className = "",
}) {
  const percentage = calculateProgress(produced, planned);
  const rejectPercentage = calculateProgress(rejected, planned);

  return (
    <div className={`space-y-1 ${className}`}>
      {showLabels && (
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-mono font-bold text-[#2DD4BF]">{percentage}% done</span>
          <span className="text-[#94a3b8] text-[10px]">
            {formatQuantity(produced, unit)} / {formatQuantity(planned, unit)}
          </span>
        </div>
      )}

      {/* Progress Track */}
      <div className="w-full h-2 bg-[#0a1020] rounded-full overflow-hidden flex border border-[#1e2a4a]">
        {/* Good Produced Quantity */}
        <div
          style={{ width: `${Math.min(100, percentage)}%` }}
          className="h-full bg-gradient-to-r from-blue-500 to-[#2DD4BF] transition-all duration-300 rounded-l-full"
          title={`Produced: ${produced}`}
        />
        {/* Rejected Quantity */}
        {rejectPercentage > 0 && (
          <div
            style={{ width: `${Math.min(100 - percentage, rejectPercentage)}%` }}
            className="h-full bg-[#F87171] transition-all duration-300"
            title={`Rejected: ${rejected}`}
          />
        )}
      </div>

      {rejected > 0 && showLabels && (
        <div className="text-[10px] text-[#F87171] font-semibold text-right">
          Scrap: {formatQuantity(rejected, unit)}
        </div>
      )}
    </div>
  );
}
