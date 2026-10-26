import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Search,
  FolderKanban,
  Wrench,
  Headset,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Building2,
  User,
} from "lucide-react";
import { module5Api } from "../../api/module5Api";

const STATUS_STYLES = {
  // Projects
  DRAFT: "bg-slate-700/50 text-slate-300 border-slate-600",
  SURVEY_PENDING: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  PLANNED: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  IN_PROGRESS: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  ON_HOLD: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  COMPLETED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  CANCELLED: "bg-slate-700/50 text-slate-400 border-slate-600",

  // Installations
  SCHEDULED: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  TESTING: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  HANDOVER_PENDING: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  BLOCKED: "bg-rose-500/20 text-rose-300 border-rose-500/30",

  // Service Tickets
  OPEN: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  ASSIGNED: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  WAITING_PARTS: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  RESOLVED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  CLOSED: "bg-slate-700/50 text-slate-400 border-slate-600",
};

export default function M5KpiDetailDrawer({
  isOpen,
  kpiKey,
  onClose,
  onNavigate,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !kpiKey) return;
    setSearchQuery("");
    fetchKpiData(kpiKey);
  }, [isOpen, kpiKey]);

  const fetchKpiData = async (key) => {
    setLoading(true);
    setError(null);
    try {
      if (key === "projects" || key === "active-projects") {
        const res = await module5Api.getProjects({
          status: key === "active-projects" ? "IN_PROGRESS" : undefined,
        });
        const list = res?.projects || res?.data || (Array.isArray(res) ? res : []);
        setRecords(Array.isArray(list) ? list : []);
      } else if (key === "installations" || key === "scheduled-sites") {
        const res = await module5Api.getInstallations({
          status: key === "scheduled-sites" ? "SCHEDULED" : undefined,
        });
        const list = res?.installations || res?.data || (Array.isArray(res) ? res : []);
        setRecords(Array.isArray(list) ? list : []);
      } else if (key === "completed-handovers") {
        const res = await module5Api.getInstallations({ status: "COMPLETED" });
        const list = res?.installations || res?.data || (Array.isArray(res) ? res : []);
        setRecords(Array.isArray(list) ? list : []);
      } else if (key === "service-tickets" || key === "open-tickets") {
        const res = await module5Api.getServiceTickets({
          status: key === "open-tickets" ? "OPEN" : undefined,
        });
        const list = res?.tickets || res?.data || (Array.isArray(res) ? res : []);
        setRecords(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error("Failed to load KPI detail data:", err);
      setError("Failed to fetch underlying records.");
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase();
    return records.filter((r) => {
      const code = (r.projectCode || r.installationNo || r.ticketNo || "").toLowerCase();
      const name = (r.name || r.issue || r.project?.name || "").toLowerCase();
      const customer = (r.customer?.name || r.project?.customer?.name || "").toLowerCase();
      return code.includes(q) || name.includes(q) || customer.includes(q);
    });
  }, [records, searchQuery]);

  if (!isOpen) return null;

  const getTitle = () => {
    switch (kpiKey) {
      case "projects":
        return { label: "Project Portfolio", icon: FolderKanban, target: "m5-projects" };
      case "active-projects":
        return { label: "Active Field Projects", icon: FolderKanban, target: "m5-projects" };
      case "scheduled-sites":
      case "installations":
        return { label: "Site Installations & Tests", icon: Clock, target: "m5-installations" };
      case "completed-handovers":
        return { label: "Certified Handovers (Compliant Grounding)", icon: CheckCircle2, target: "m5-installations" };
      case "open-tickets":
      case "service-tickets":
        return { label: "Support & Warranty Tickets", icon: Headset, target: "m5-service" };
      default:
        return { label: "Detail Breakdown", icon: FolderKanban, target: "m5-projects" };
    }
  };

  const info = getTitle();
  const IconComponent = info.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-2xs animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-[#0f172a] border-l border-[#1e2a4a] shadow-2xl flex flex-col text-slate-100">
          {/* Header */}
          <div className="p-5 border-b border-[#1e2a4a] bg-[#0b1329] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
                <IconComponent className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-wide">{info.label}</h2>
                <p className="text-xs text-slate-400">
                  {filteredRecords.length} records retrieved
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search bar */}
          <div className="p-4 border-b border-[#1e2a4a] bg-[#10182f]">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by code, project, or customer..."
                className="w-full bg-[#0a1020] text-xs text-slate-100 placeholder-slate-500 pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 bg-slate-800/40 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>{error}</span>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No matching records found.
              </div>
            ) : (
              filteredRecords.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-[#10182f] border border-[#1e2a4a] hover:border-cyan-500/40 rounded-xl transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      {item.projectCode || item.installationNo || item.ticketNo}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        STATUS_STYLES[item.status] || "bg-slate-800 text-slate-300 border-slate-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-white">
                    {item.name || item.issue || item.project?.name}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <div className="flex items-center space-x-1.5 truncate">
                      <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">
                        {item.customer?.name || item.project?.customer?.name || "Client Site"}
                      </span>
                    </div>

                    {item.customerSignoffName ? (
                      <div className="flex items-center space-x-1.5 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Sign-off: {item.customerSignoffName}</span>
                      </div>
                    ) : item.testResults?.earthResistanceOhms !== undefined ? (
                      <div className="flex items-center space-x-1.5 font-mono text-cyan-300">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>{item.testResults.earthResistanceOhms} Ohms</span>
                      </div>
                    ) : item.scheduledAt ? (
                      <div className="flex items-center space-x-1.5 text-slate-400">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{new Date(item.scheduledAt).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1.5 text-slate-400">
                        <User className="w-3.5 h-3.5 shrink-0" />
                        <span>{item.owner?.name || item.assignedTo?.name || "Unassigned"}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Navigation */}
          <div className="p-4 border-t border-[#1e2a4a] bg-[#0b1329] flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Module 5 Live Register</span>
            <button
              onClick={() => {
                onClose();
                onNavigate?.(info.target);
              }}
              className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
            >
              <span>Open Full Register</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

