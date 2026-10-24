import { useState, useEffect, useCallback } from "react";
import { PhoneCall, MessageSquare } from "lucide-react";
import FilterBar from "../components/FilterBar";
import LogCallModal from "../components/LogCallModal";
import module1Service from "../services/module1Service";
import { exportToExcel, importFromExcel } from "../utils/excelUtils";

export default function FollowupPage() {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [callModalLead, setCallModalLead] = useState(null);

  const fetchFollowups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await module1Service.getFollowups({ search: searchQuery });
      if (res?.success && res?.data) {
        setFollowups(res.data);
      }
    } catch (err) {
      console.error("Failed to load follow-ups:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchFollowups();
  }, [fetchFollowups]);

  const handleExportExcel = () => {
    const exportData = followups.map((f) => ({
      "Lead Code": f.code,
      Customer: f.customerName,
      Contact: f.contactName || "",
      Phone: f.phone || "",
      Product: f.productName || "",
      "Follow-up Date": f.nextFollowUpAt ? new Date(f.nextFollowUpAt).toLocaleString() : "",
      Stage: f.stage,
      Priority: f.priority,
      "Assigned Consultant": f.assignedTo?.name || f.assignedByName || "",
      Notes: f.lastActivityNote || "",
    }));
    exportToExcel(exportData, "Yash_Followup_Register", "Followups");
  };

  const handleImportExcel = (file) => {
    importFromExcel(file, (data) => {
      alert(`Imported ${data.length} records. (Demo simulation)`);
    });
  };

  const handleLogCallSubmit = async (leadId, callData) => {
    try {
      await module1Service.logCall(leadId, callData);
      setCallModalLead(null);
      fetchFollowups();
    } catch (err) {
      console.error("Log call error:", err);
    }
  };

  // KPIs calculation
  const now = new Date();
  const dueTodayCount = followups.filter((f) => {
    if (!f.nextFollowUpAt) return false;
    const d = new Date(f.nextFollowUpAt);
    return d.toDateString() === now.toDateString();
  }).length;

  const overdueCount = followups.filter((f) => {
    if (!f.nextFollowUpAt) return false;
    return new Date(f.nextFollowUpAt) < now;
  }).length;

  return (
    <div className="min-h-full">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            TOTAL SCHEDULED FOLLOW-UPS
          </div>
          {loading ? (
            <div className="h-8 w-16 bg-slate-200/80 rounded animate-pulse my-1" />
          ) : (
            <div className="text-3xl font-black text-white">{followups.length}</div>
          )}
          {loading ? (
            <div className="h-3 w-32 bg-slate-200/60 rounded animate-pulse mt-1" />
          ) : (
            <div className="text-xs text-blue-400 mt-1">Active customer callbacks</div>
          )}
        </div>

        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            DUE TODAY
          </div>
          {loading ? (
            <div className="h-8 w-16 bg-slate-200/80 rounded animate-pulse my-1" />
          ) : (
            <div className="text-3xl font-black text-amber-400">{dueTodayCount}</div>
          )}
          {loading ? (
            <div className="h-3 w-32 bg-slate-200/60 rounded animate-pulse mt-1" />
          ) : (
            <div className="text-xs text-amber-400/80 mt-1">Immediate action required</div>
          )}
        </div>

        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            OVERDUE CALLBACKS
          </div>
          {loading ? (
            <div className="h-8 w-16 bg-slate-200/80 rounded animate-pulse my-1" />
          ) : (
            <div className="text-3xl font-black text-red-400">{overdueCount}</div>
          )}
          {loading ? (
            <div className="h-3 w-32 bg-slate-200/60 rounded animate-pulse mt-1" />
          ) : (
            <div className="text-xs text-red-400/80 mt-1">Missed customer schedule</div>
          )}
        </div>

        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            CONVERSION SUCCESS
          </div>
          {loading ? (
            <div className="h-8 w-16 bg-slate-200/80 rounded animate-pulse my-1" />
          ) : (
            <div className="text-3xl font-black text-emerald-400">72%</div>
          )}
          {loading ? (
            <div className="h-3 w-32 bg-slate-200/60 rounded animate-pulse mt-1" />
          ) : (
            <div className="text-xs text-emerald-400/80 mt-1">Callback to quotation rate</div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search follow-ups by customer, code, contact..."
        filters={[
          {
            id: "status",
            value: statusFilter,
            options: [
              { value: "ALL", label: "All Follow-ups" },
              { value: "TODAY", label: "Due Today" },
              { value: "OVERDUE", label: "Overdue" },
              { value: "UPCOMING", label: "Upcoming" },
            ],
          },
        ]}
        onFilterChange={(_, val) => setStatusFilter(val)}
        onExportExcel={handleExportExcel}
        onImportExcel={handleImportExcel}
      />

      {/* Table Card */}
      <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">
            Customer Follow-up & Callback Register
          </h3>
          <span className="text-xs text-slate-400">Auto-generated upon call attempts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0b1329] text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <th className="py-3 px-4">LEAD CODE</th>
                <th className="py-3 px-4">CUSTOMER / COMPANY</th>
                <th className="py-3 px-4">PRODUCT INTEREST</th>
                <th className="py-3 px-4">SCHEDULED FOLLOW-UP</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4">ASSIGNED REP</th>
                <th className="py-3 px-4">LAST ACTIVITY</th>
                <th className="py-3 px-4 text-center">DIRECT ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading && followups.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4"><div className="h-4 w-16 bg-slate-200/80 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-32 bg-slate-200/80 rounded" /><div className="h-3 w-20 bg-slate-200/50 rounded mt-1" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-28 bg-slate-200/80 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-24 bg-slate-200/70 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-5 w-20 bg-slate-200/70 rounded-full" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-24 bg-slate-200/60 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-24 bg-slate-200/50 rounded" /></td>
                    <td className="py-3 px-4 text-center"><div className="h-6 w-20 bg-slate-200/60 rounded-lg mx-auto" /></td>
                  </tr>
                ))
              ) : followups.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    No scheduled follow-ups pending.
                  </td>
                </tr>
              ) : (
                followups.map((f) => {
                  const fDate = f.nextFollowUpAt ? new Date(f.nextFollowUpAt) : new Date();
                  const isOverdue = fDate < now;
                  const isToday = fDate.toDateString() === now.toDateString();

                  return (
                    <tr key={f.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-300">{f.code}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-xs">{f.customerName}</div>
                        <div className="text-[11px] text-slate-400">{f.contactName} ({f.phone})</div>
                      </td>
                      <td className="py-3 px-4 text-slate-200">{f.productName}</td>
                      <td className="py-3 px-4 font-mono">
                        {fDate.toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            isOverdue
                              ? "bg-red-500/10 text-red-300 border-red-500/30"
                              : isToday
                              ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                              : "bg-blue-500/10 text-blue-300 border-blue-500/30"
                          }`}
                        >
                          {isOverdue ? "Overdue" : isToday ? "Due Today" : "Upcoming"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{f.assignedTo?.name || f.assignedByName}</td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{f.lastActivityNote || "Callback scheduled"}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <a
                            href={`tel:${f.phone?.replace(/\s/g, "")}`}
                            className="p-1.5 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/40 rounded-lg transition"
                            title="Call customer directly"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/${f.phone?.replace(/\D/g, "")}?text=${encodeURIComponent(
                              `Hello ${f.contactName || f.customerName}, following up from Yash Earthing Solutions regarding your enquiry for ${f.productName}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-green-600/20 text-green-300 hover:bg-green-600/40 rounded-lg transition"
                            title="Send WhatsApp follow-up"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => setCallModalLead(f)}
                            className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-cyan-300 border border-blue-500/40 rounded-lg text-[11px] font-bold transition cursor-pointer"
                          >
                            Log Call
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Call Modal */}
      <LogCallModal
        isOpen={Boolean(callModalLead)}
        onClose={() => setCallModalLead(null)}
        lead={callModalLead}
        onSubmit={handleLogCallSubmit}
      />
    </div>
  );
}
