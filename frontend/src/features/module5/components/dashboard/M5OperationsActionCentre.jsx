import React, { useState } from "react";
import {
  Wrench,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  ChevronRight,
  Clock,
  Sparkles,
} from "lucide-react";

export default function M5OperationsActionCentre({ tasks = [], onNavigate }) {
  const [filterRole, setFilterRole] = useState("ALL");

  const filteredTasks = tasks.filter((t) => {
    if (filterRole === "ALL") return true;
    return t.role === filterRole;
  });

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case "CRITICAL":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      case "HIGH":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      default:
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "RESISTANCE_TEST_DUE":
        return <Wrench className="w-4 h-4 text-cyan-400" />;
      case "HANDOVER_SIGN_OFF_DUE":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "INSTALLATION_BLOCKED":
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case "TICKET_UNASSIGNED":
        return <UserCheck className="w-4 h-4 text-amber-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-blue-400" />;
    }
  };

  const handleAction = (task) => {
    if (task.targetModule === "installations") {
      onNavigate?.("m5-installations");
    } else if (task.targetModule === "service") {
      onNavigate?.("m5-service");
    } else {
      onNavigate?.("m5-projects");
    }
  };

  return (
    <div className="bg-[#10182f] border border-[#1e2a4a] rounded-xl p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e2a4a]">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Operations Action Centre
            </h3>
            <p className="text-[11px] text-slate-400">
              Live tasks requiring testing, handover sign-offs, or engineer dispatch
            </p>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center space-x-1 bg-[#0a1020] p-1 rounded-lg border border-[#1e2a4a] text-xs">
          {["ALL", "ENGINEER", "PROJECT_MANAGER", "SERVICE_EXECUTIVE"].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`px-2.5 py-1 rounded transition text-[11px] font-medium cursor-pointer ${
                filterRole === r
                  ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {r === "ALL" ? "All Tasks" : r.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No pending action items for this filter. All installations and service queues are up to date!
          </div>
        ) : (
          filteredTasks.map((t) => (
            <div
              key={t.id}
              className="p-3 bg-[#0a1020] border border-[#1e2a4a] hover:border-cyan-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-[#10182f] border border-slate-800 shrink-0 mt-0.5">
                  {getIcon(t.type)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">{t.title}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold border uppercase ${getUrgencyBadge(
                        t.urgency
                      )}`}
                    >
                      {t.urgency}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{t.subtitle}</div>
                </div>
              </div>

              <button
                onClick={() => handleAction(t)}
                className="self-end sm:self-center px-3 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-semibold flex items-center space-x-1 transition cursor-pointer shrink-0"
              >
                <span>{t.actionLabel}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

