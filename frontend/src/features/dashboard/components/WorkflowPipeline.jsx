import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Clock,
  PhoneCall,
  FileText,
  PackageCheck,
  Calendar,
  ClipboardList,
  Boxes,
  Factory,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export const salesStages = [
  {
    id: "inbound-leads",
    step: "01",
    label: "Inbound Leads",
    count: null,
    status: "",
    path: "/sales/leads",
    icon: Users,
    color: "text-blue-400",
  },
  {
    id: "follow-ups",
    step: "02",
    label: "Follow-ups",
    count: null,
    status: "",
    path: "/sales/follow-ups",
    icon: Clock,
    color: "text-amber-400",
  },
  {
    id: "consultant-calling",
    step: "03",
    label: "Consultant Calling",
    count: null,
    status: "",
    path: "/sales/targets",
    icon: PhoneCall,
    color: "text-teal-400",
  },
  {
    id: "back-office-quotation",
    step: "04",
    label: "Back Office Quotation",
    count: null,
    status: "",
    path: "/sales/quotations",
    icon: FileText,
    color: "text-indigo-400",
  },
  {
    id: "sales-order-stock",
    step: "05",
    label: "Sales Order & Stock",
    count: null,
    status: "",
    path: "/sales/orders",
    icon: PackageCheck,
    color: "text-emerald-400",
  },
];

export const productionStages = [
  {
    id: "production-planning",
    step: "01",
    label: "Production Planning",
    count: null,
    status: "",
    path: "/production/planning",
    icon: Calendar,
    color: "text-blue-400",
  },
  {
    id: "work-order-creation",
    step: "02",
    label: "Work Order Creation",
    count: null,
    status: "",
    path: "/production/work-orders",
    icon: ClipboardList,
    color: "text-indigo-400",
  },
  {
    id: "material-availability",
    step: "03",
    label: "Material Availability",
    count: null,
    status: "",
    path: "/inventory/stock",
    icon: Boxes,
    color: "text-teal-400",
  },
  {
    id: "production-in-progress",
    step: "04",
    label: "Production In Progress",
    count: null,
    status: "",
    path: "/production/tracking",
    icon: Factory,
    color: "text-amber-400",
  },
  {
    id: "quality-inspection",
    step: "05",
    label: "Quality Inspection",
    count: null,
    status: "",
    path: "/quality/inspections",
    icon: ShieldCheck,
    color: "text-purple-400",
  },
  {
    id: "finished-goods-approval",
    step: "06",
    label: "Finished Goods Approval",
    count: null,
    status: "",
    path: "/dispatch/dashboard",
    icon: CheckCircle2,
    color: "text-emerald-400",
  },
];

export default function WorkflowPipeline({ onSelectStage, activeStageId }) {
  const navigate = useNavigate();
  const [pipelineType, setPipelineType] = useState("sales"); // 'sales' | 'production'

  const stages = pipelineType === "sales" ? salesStages : productionStages;

  const handleStageClick = (stage) => {
    if (onSelectStage) {
      onSelectStage(stage);
    }
  };

  const handleStageNavigate = (e, stage) => {
    e.stopPropagation();
    navigate(stage.path);
  };

  return (
    <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-md">
      {/* Header with Pipeline Type Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1e2a4a]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0a1020] border border-[#1e2a4a] flex items-center justify-center text-[#3b82f6]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#f1f5f9]">
              Enterprise Workflow Pipeline
            </h3>
            <p className="text-[11px] text-[#94a3b8]">
              Click any stage to filter records below or jump to the specialized module
            </p>
          </div>
        </div>

        {/* Pipeline Mode Switcher Tabs */}
        <div className="inline-flex p-1 bg-[#0a1020] rounded-xl border border-[#1e2a4a] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setPipelineType("sales")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              pipelineType === "sales"
                ? "bg-[#3b82f6] text-white shadow-xs"
                : "text-[#94a3b8] hover:text-[#f1f5f9]"
            }`}
          >
            Sales & Order Workflow (M1)
          </button>
          <button
            type="button"
            onClick={() => setPipelineType("production")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              pipelineType === "production"
                ? "bg-[#3b82f6] text-white shadow-xs"
                : "text-[#94a3b8] hover:text-[#f1f5f9]"
            }`}
          >
            Production & Quality Workflow (M4)
          </button>
        </div>
      </div>

      {/* Horizontal Clickable Stages Scroll Area */}
      <div className="pt-4 overflow-x-auto pb-2 scrollbar-thin">
        <div className="flex items-center gap-2 min-w-max">
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isSelected = activeStageId === stage.id;
            return (
              <React.Fragment key={stage.id}>
                {idx > 0 && (
                  <div className="shrink-0 text-[#1e2a4a] px-1">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                )}
                <div
                  onClick={() => handleStageClick(stage)}
                  className={`group relative flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all cursor-pointer min-w-[170px] ${
                    isSelected
                      ? "bg-[#15203c] border-[#3b82f6] shadow-md ring-1 ring-[#3b82f6]"
                      : "bg-[#0a1020] border-[#1e2a4a] hover:border-blue-500/50 hover:bg-[#121c38]"
                  }`}
                >
                  {/* Step & Icon */}
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-bold text-[#64748b] font-mono">
                      {stage.step}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-[#10182f] border border-[#1e2a4a] flex items-center justify-center mt-0.5">
                      <Icon className={`w-4 h-4 ${stage.color}`} />
                    </div>
                  </div>

                  {/* Stage Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-[#f1f5f9] truncate group-hover:text-blue-300">
                        {stage.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1 mt-1">
                      {stage.count !== null && (
                        <span className="text-[11px] font-extrabold text-[#2DD4BF] font-mono">
                          {stage.count}
                        </span>
                      )}
                      {stage.status && (
                        <span className="text-[10px] text-[#94a3b8]">
                          {stage.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Direct Module Jump Arrow */}
                  <button
                    type="button"
                    onClick={(e) => handleStageNavigate(e, stage)}
                    title={`Open ${stage.label} module`}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#3b82f6]/20 text-[#3b82f6] transition"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
