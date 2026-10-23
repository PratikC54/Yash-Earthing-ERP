import React from "react";
import {
  Factory,
  Users,
  FileText,
  ShieldCheck,
  AlertOctagon,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function QuickActions({ onAction }) {
  const actions = [
    {
      id: "work-order",
      title: "Create Work Order",
      desc: "Assign fabrication batch to shop-floor line",
      icon: Factory,
      color: "from-blue-600 to-indigo-600",
      textColor: "text-blue-400",
    },
    {
      id: "lead",
      title: "Create Lead",
      desc: "Log enterprise enquiry or EPC contractor",
      icon: Users,
      color: "from-teal-600 to-emerald-600",
      textColor: "text-[#2DD4BF]",
    },
    {
      id: "quotation",
      title: "Record Quotation",
      desc: "Draft rate estimate or tender BOQ pricing",
      icon: FileText,
      color: "from-amber-600 to-yellow-600",
      textColor: "text-[#FACC15]",
    },
    {
      id: "inspection",
      title: "Quality Inspection",
      desc: "Conduct dimensional & copper coating audit",
      icon: ShieldCheck,
      color: "from-purple-600 to-pink-600",
      textColor: "text-purple-400",
    },
    {
      id: "ncr",
      title: "Report Non-Conformance",
      desc: "Flag shop-floor defect or scrap deviation",
      icon: AlertOctagon,
      color: "from-rose-600 to-red-600",
      textColor: "text-[#F87171]",
    },
  ];

  return (
    <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-md">
      <div className="flex items-center justify-between pb-3.5 border-b border-[#1e2a4a] mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#3b82f6]" />
          <h3 className="text-sm font-bold text-[#f1f5f9]">
            Operational Quick Actions
          </h3>
        </div>
        <span className="text-[11px] text-[#94a3b8]">
          Quick access to modules
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              type="button"
              onClick={() => onAction(act.id)}
              className="group text-left p-3.5 rounded-xl bg-[#0a1020] hover:bg-[#15203c] border border-[#1e2a4a] hover:border-[#3b82f6] transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${act.color} flex items-center justify-center text-white shadow-xs`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#94a3b8] group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>

              <div className="mt-3">
                <h4 className="text-xs font-bold text-[#f1f5f9] group-hover:text-blue-300 transition">
                  {act.title}
                </h4>
                <p className="text-[10.5px] text-[#94a3b8] leading-snug mt-1 line-clamp-2">
                  {act.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
