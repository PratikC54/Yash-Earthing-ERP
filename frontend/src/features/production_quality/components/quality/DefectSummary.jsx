import React from "react";
import Card from "../../../../components/common/Card";

/**
 * DefectSummary Breakdown Component with Tailwind CSS
 */
export default function DefectSummary({
  defects = [
    { type: "Galvanizing Thickness Shortfall", count: 12, percent: 45, severity: "MAJOR" },
    { type: "Thread Pitch Variance", count: 8, percent: 30, severity: "MEDIUM" },
    { type: "Length Deviation (>5mm)", count: 4, percent: 15, severity: "MINOR" },
    { type: "Surface Pit / Scratch", count: 2, percent: 10, severity: "MINOR" },
  ],
}) {
  return (
    <Card
      title="Defect Category Breakdown"
      subtitle="Root cause clustering for current production cycle"
    >
      <div className="space-y-4">
        {defects.map((d) => (
          <div key={d.type} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#f1f5f9]">{d.type}</span>
              <span className="font-semibold text-[#94a3b8]">
                {d.count} units ({d.percent}%)
              </span>
            </div>
            <div className="w-full h-2 bg-[#0a1020] border border-[#1e2a4a] rounded-full overflow-hidden">
              <div
                style={{ width: `${d.percent}%` }}
                className={`h-full rounded-full ${
                  d.severity === "MAJOR"
                    ? "bg-red-500"
                    : d.severity === "MEDIUM"
                    ? "bg-amber-500"
                    : "bg-blue-400"
                }`}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
