import React from "react";
import { ShieldCheck, CheckCircle2, AlertOctagon, RotateCcw } from "lucide-react";
import Card from "../../../../components/common/Card";
import KpiSection from "../../../../components/common/KpiSection";

export default function QualityStats({ metrics = {} }) {
  const stats = [
    {
      label: "Total Inspections",
      value: metrics.totalInspections ?? 0,
      subtext: "Batches routed to QA",
      icon: ShieldCheck,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    },
    {
      label: "Approved & Released",
      value: metrics.released ?? metrics.approved ?? 0,
      subtext: "Transferred to Finished Goods",
      icon: CheckCircle2,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    },
    {
      label: "Pending & On Hold",
      value: (metrics.pending || 0) + (metrics.hold || 0),
      subtext: "Under test / dimensional review",
      icon: RotateCcw,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    },
    {
      label: "Non-Conformance / Rejected",
      value: (metrics.rejected || 0) + (metrics.openNCRs || 0),
      subtext: "Open NCRs & quarantine lots",
      icon: AlertOctagon,
      color: "text-red-400 bg-red-500/10 border-red-500/30",
    },
  ];

  return (
    <KpiSection title="Quality Performance Indicators">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#94a3b8]">{s.label}</p>
                  <p className="text-2xl font-bold text-[#f1f5f9] mt-1 tracking-tight">
                    {s.value}
                  </p>
                  <p className="text-[11px] text-[#64748b] mt-0.5">{s.subtext}</p>
                </div>
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center border ${s.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </KpiSection>
  );
}
