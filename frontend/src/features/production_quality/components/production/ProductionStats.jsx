import React from "react";
import { Factory, PlayCircle, PauseCircle, CheckCircle2 } from "lucide-react";
import Card from "../../../../components/common/Card";

export default function ProductionStats({ metrics = {} }) {
  const stats = [
    {
      label: "Total Work Orders",
      value: metrics.totalWorkOrders ?? metrics.total ?? 0,
      subtext: "Current operating cycle",
      icon: Factory,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    },
    {
      label: "In Execution",
      value: metrics.inProgress ?? metrics.running ?? 0,
      subtext: "Active shop floor lines",
      icon: PlayCircle,
      color: "text-[#FACC15] bg-amber-500/10 border-amber-500/30",
    },
    {
      label: "On Hold",
      value: (metrics.onHold || 0) + (metrics.materialHold || 0) + (metrics.qcHold || 0),
      subtext: "Tooling / material checks",
      icon: PauseCircle,
      color: "text-orange-400 bg-orange-500/10 border-orange-500/30",
    },
    {
      label: "Completed & Ready",
      value: (metrics.completed || 0) + (metrics.readyForProduction || 0),
      subtext: "Released or staged for QA",
      icon: CheckCircle2,
      color: "text-[#2DD4BF] bg-emerald-500/10 border-emerald-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <Card key={s.label} className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#94a3b8]">{s.label}</p>
                <p className="text-2xl font-extrabold text-[#f1f5f9] mt-1 tracking-tight">
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
  );
}
