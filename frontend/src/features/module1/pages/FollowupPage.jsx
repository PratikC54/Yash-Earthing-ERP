import { useState, useEffect, useCallback, useMemo } from "react";
import { PhoneCall, MessageSquare, Calendar, Clock, AlertCircle, CheckCircle2, RotateCcw } from "lucide-react";
import KpiSection from "../../../components/common/KpiSection";
import FilterBar from "../components/FilterBar";
import LogCallModal from "../components/LogCallModal";
import Module1TodoWidget from "../components/Module1TodoWidget";
import module1Service from "../services/module1Service";
import { exportToExcel, importFromExcel } from "../utils/excelUtils";

export default function FollowupPage() {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState("");
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
      // Immediately refresh list so succeeded leads vanish from follow-ups
      fetchFollowups();
    } catch (err) {
      console.error("Log call error:", err);
    }
  };

  // Follow-up specific KPIs calculation
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const dueTodayCount = followups.filter((f) => {
    if (!f.nextFollowUpAt) return false;
    const d = new Date(f.nextFollowUpAt);
    return d.toDateString() === now.toDateString();
  }).length;

  const overdueCount = followups.filter((f) => {
    if (!f.nextFollowUpAt) return false;
    return new Date(f.nextFollowUpAt) < now && new Date(f.nextFollowUpAt).toDateString() !== now.toDateString();
  }).length;

  const upcomingCount = followups.filter((f) => {
    if (!f.nextFollowUpAt) return false;
    return new Date(f.nextFollowUpAt) > now && new Date(f.nextFollowUpAt).toDateString() !== now.toDateString();
  }).length;

  // Filter follow-ups by dropdown status filter & calendar date picker
  const filteredFollowups = useMemo(() => {
    let result = followups;

    // Filter by Calendar Date if selected
    if (selectedCalendarDate) {
      result = result.filter((f) => {
        if (!f.nextFollowUpAt) return false;
        const d = new Date(f.nextFollowUpAt).toISOString().slice(0, 10);
        return d === selectedCalendarDate;
      });
    }

    // Filter by Status dropdown
    if (statusFilter === "TODAY") {
      result = result.filter((f) => {
        if (!f.nextFollowUpAt) return false;
        return new Date(f.nextFollowUpAt).toDateString() === now.toDateString();
      });
    } else if (statusFilter === "OVERDUE") {
      result = result.filter((f) => {
        if (!f.nextFollowUpAt) return false;
        return new Date(f.nextFollowUpAt) < now && new Date(f.nextFollowUpAt).toDateString() !== now.toDateString();
      });
    } else if (statusFilter === "UPCOMING") {
      result = result.filter((f) => {
        if (!f.nextFollowUpAt) return false;
        return new Date(f.nextFollowUpAt) > now && new Date(f.nextFollowUpAt).toDateString() !== now.toDateString();
      });
    }

    return result;
  }, [followups, statusFilter, selectedCalendarDate, now]);

  return (
    <div className="flex flex-col min-h-full space-y-4">
      {/* Mobile-first reordering: In mobile view (order-2 md:order-1), KPIs and FilterBar are below table */}
      <div className="order-2 md:order-1">
        {/* Followup-specific 4 KPI Cards */}
        <KpiSection title="Customer Follow-up & Callback KPIs" className="mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                <span>TOTAL SCHEDULED</span>
                <Clock className="w-3.5 h-3.5 text-blue-600" />
              </div>
              {loading ? (
                <div className="h-8 w-16 bg-slate-200 rounded animate-pulse my-1" />
              ) : (
                <div className="text-2xl sm:text-3xl font-black text-slate-900">{followups.length}</div>
              )}
              <div className="text-[11px] text-blue-600 font-semibold mt-1">Pending client callbacks</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                <span>DUE TODAY</span>
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
              </div>
              {loading ? (
                <div className="h-8 w-16 bg-slate-200 rounded animate-pulse my-1" />
              ) : (
                <div className="text-2xl sm:text-3xl font-black text-amber-600">{dueTodayCount}</div>
              )}
              <div className="text-[11px] text-amber-700 font-semibold mt-1">Action required today</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                <span>OVERDUE CALLBACKS</span>
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              </div>
              {loading ? (
                <div className="h-8 w-16 bg-slate-200 rounded animate-pulse my-1" />
              ) : (
                <div className="text-2xl sm:text-3xl font-black text-rose-600">{overdueCount}</div>
              )}
              <div className="text-[11px] text-rose-700 font-semibold mt-1">Missed customer schedule</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                <span>UPCOMING SCHEDULE</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              {loading ? (
                <div className="h-8 w-16 bg-slate-200 rounded animate-pulse my-1" />
              ) : (
                <div className="text-2xl sm:text-3xl font-black text-emerald-700">{upcomingCount}</div>
              )}
              <div className="text-[11px] text-emerald-700 font-semibold mt-1">Future follow-up queue</div>
            </div>
          </div>
        </KpiSection>

        {/* Filter and Search Bar with Calendar Date Filter */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs mb-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <input
              type="text"
              placeholder="Search by customer, contact, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 text-slate-800 text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 font-medium flex-1 min-w-[200px]"
            />

            {/* Dropdown status filter (working with instant filter) */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white text-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Follow-ups</option>
              <option value="TODAY">Due Today</option>
              <option value="OVERDUE">Overdue</option>
              <option value="UPCOMING">Upcoming</option>
            </select>

            {/* Calendar Date Picker for scheduled dates */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-300">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <input
                type="date"
                value={selectedCalendarDate}
                onChange={(e) => setSelectedCalendarDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                title="Filter by follow-up scheduled date"
              />
              {selectedCalendarDate && (
                <button
                  type="button"
                  onClick={() => setSelectedCalendarDate("")}
                  className="p-0.5 text-slate-400 hover:text-slate-700 text-xs font-black cursor-pointer"
                  title="Clear calendar filter"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition cursor-pointer shrink-0"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* Main Content Area: Data Table on Left & To-Do Widget on Right */}
      <div className="order-1 md:order-2 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Table Column (Lg: 8 or 9 cols) */}
        <div className="lg:col-span-8 xl:col-span-9 bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <h3 className="text-xs font-black text-slate-900 tracking-wider uppercase">
                Customer Follow-up & Callback Register
              </h3>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
                {filteredFollowups.length} {filteredFollowups.length === 1 ? "record" : "records"}
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Auto-generated upon call attempts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-3 px-3.5">LEAD CODE</th>
                  <th className="py-3 px-3.5">CUSTOMER & PHONE</th>
                  <th className="py-3 px-3.5">PRODUCT INTEREST</th>
                  <th className="py-3 px-3.5">SCHEDULED FOLLOW-UP</th>
                  <th className="py-3 px-3.5">STATUS</th>
                  <th className="py-3 px-3.5">ASSIGNED REP</th>
                  <th className="py-3 px-3.5">LAST ACTIVITY</th>
                  <th className="py-3 px-3.5 text-center">DIRECT ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && followups.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3 px-3.5"><div className="h-4 w-16 bg-slate-200 rounded" /></td>
                      <td className="py-3 px-3.5"><div className="h-4 w-32 bg-slate-200 rounded" /></td>
                      <td className="py-3 px-3.5"><div className="h-4 w-28 bg-slate-200 rounded" /></td>
                      <td className="py-3 px-3.5"><div className="h-4 w-24 bg-slate-200 rounded" /></td>
                      <td className="py-3 px-3.5"><div className="h-5 w-20 bg-slate-200 rounded-full" /></td>
                      <td className="py-3 px-3.5"><div className="h-4 w-24 bg-slate-200 rounded" /></td>
                      <td className="py-3 px-3.5"><div className="h-4 w-24 bg-slate-200 rounded" /></td>
                      <td className="py-3 px-3.5 text-center"><div className="h-6 w-20 bg-slate-200 rounded mx-auto" /></td>
                    </tr>
                  ))
                ) : filteredFollowups.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                      No scheduled follow-ups pending for selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredFollowups.map((f) => {
                    const fDate = f.nextFollowUpAt ? new Date(f.nextFollowUpAt) : new Date();
                    const isOverdue = fDate < now && fDate.toDateString() !== now.toDateString();
                    const isToday = fDate.toDateString() === now.toDateString();

                    return (
                      <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3.5 font-mono font-bold text-blue-700">{f.code}</td>
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-900 text-xs">{f.customerName}</div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-0.5">
                            <span className="font-mono font-semibold">{f.phone}</span>
                            {/* QUICK CALL BUTTON DIRECTLY AT RIGHT OF PHONE NUMBER */}
                            {f.phone && (
                              <button
                                type="button"
                                onClick={() => setCallModalLead(f)}
                                className="inline-flex items-center justify-center p-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border border-emerald-200 transition cursor-pointer shadow-2xs"
                                title={`Direct Call: ${f.phone}`}
                              >
                                <PhoneCall className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-slate-800 font-semibold">{f.productName}</td>
                        <td className="py-3 px-3.5 font-mono text-slate-700 font-semibold">
                          {fDate.toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              isOverdue
                                ? "bg-rose-50 text-rose-700 border-rose-300"
                                : isToday
                                ? "bg-amber-50 text-amber-800 border-amber-300"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {isOverdue ? "Overdue" : isToday ? "Due Today" : "Upcoming"}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-slate-700 font-medium">{f.assignedTo?.name || f.assignedByName}</td>
                        <td className="py-3 px-3.5 text-slate-500 max-w-xs truncate">{f.lastActivityNote || "Callback scheduled"}</td>
                        <td className="py-3 px-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <a
                              href={`https://wa.me/${f.phone?.replace(/\D/g, "")}?text=${encodeURIComponent(
                                `Hello ${f.contactName || f.customerName}, following up from Yash Earthing Solutions regarding your enquiry for ${f.productName}.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg transition"
                              title="Send WhatsApp follow-up"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => setCallModalLead(f)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer shadow-2xs"
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

        {/* Right Column: Daily To-Do widget */}
        <div className="lg:col-span-4 xl:col-span-3">
          <Module1TodoWidget title="Follow-up Actions" pageType="followups" items={filteredFollowups} />
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
