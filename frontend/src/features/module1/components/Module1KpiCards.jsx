import { PhoneCall, PhoneOff, UserX, PhoneMissed, Users } from "lucide-react";
import KpiSection from "../../../components/common/KpiSection";

export default function Module1KpiCards({ stats, leads = [], loading = false }) {
  const isLoading = loading;

  // Derive counts either from API stats or directly calculated from leads dataset
  const totalLeads = stats?.totalLeads ?? (Array.isArray(leads) ? leads.length : 0);

  // If stats provides call counts, use them; otherwise count from leads' callLogs
  let answered = stats?.callAnswered;
  let notAnswered = stats?.callNotAnswered;
  let notInterested = stats?.notInterested;
  let invalidNumber = stats?.invalidNumber;

  if (answered === undefined && Array.isArray(leads)) {
    answered = 0;
    notAnswered = 0;
    notInterested = 0;
    invalidNumber = 0;

    leads.forEach((l) => {
      if (Array.isArray(l.callLogs) && l.callLogs.length > 0) {
        l.callLogs.forEach((log) => {
          const out = String(log.outcome || "").toUpperCase();
          if (out === "ANSWERED" || out === "QUOTATION_REQUESTED") answered++;
          else if (out === "BUSY" || out === "DID_NOT_CONNECT" || out === "CUT_OFF" || out === "FOLLOW_UP_SCHEDULED") notAnswered++;
          else if (out === "NOT_INTERESTED") notInterested++;
          else if (out === "WRONG_NUMBER" || out === "INVALID_NUMBER") invalidNumber++;
        });
      } else {
        // Fallback checking stage
        if (l.stage === "REQUIREMENT_CAPTURED" || l.stage === "QUOTATION_REQUESTED" || l.stage === "ORDER_CONFIRMED" || l.stage === "PO_RECEIVED") {
          answered++;
        }
      }
    });
  }

  answered = Number(answered || 0);
  notAnswered = Number(notAnswered || 0);
  notInterested = Number(notInterested || 0);
  invalidNumber = Number(invalidNumber || 0);

  // Calculate percentages relative to total leads (or total calls)
  const baseCount = totalLeads > 0 ? totalLeads : 1;
  const answeredPct = Math.round((answered / baseCount) * 100);
  const notAnsweredPct = Math.round((notAnswered / baseCount) * 100);
  const notInterestedPct = Math.round((notInterested / baseCount) * 100);
  const invalidPct = Math.round((invalidNumber / baseCount) * 100);

  // Threshold rule: If Call Answered > 70%, it turns bright GREEN!
  const isAnsweredHighGreen = answeredPct >= 70;

  const kpis = [
    {
      id: "total",
      label: "TOTAL LEADS",
      value: totalLeads,
      detail: "All active customer enquiries",
      pct: null,
      icon: Users,
      cardBg: "bg-white border-slate-200/90",
      valueColor: "text-slate-900",
      badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    },
    {
      id: "answered",
      label: "CALL ANSWERED",
      value: answered,
      detail: isAnsweredHighGreen ? "High engagement (>70%)" : `${answeredPct}% of total leads`,
      pct: `${answeredPct}%`,
      icon: PhoneCall,
      // Dynamic green styling when answered > 70%
      cardBg: isAnsweredHighGreen
        ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400/40"
        : "bg-white border-slate-200/90",
      valueColor: isAnsweredHighGreen ? "text-emerald-700 font-black" : "text-slate-900",
      badgeColor: isAnsweredHighGreen
        ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold"
        : "bg-slate-100 text-slate-700 border-slate-200",
    },
    {
      id: "not_answered",
      label: "CALL NOT ANSWERED",
      value: notAnswered,
      detail: `${notAnsweredPct}% missed / busy callbacks`,
      pct: `${notAnsweredPct}%`,
      icon: PhoneMissed,
      cardBg: "bg-white border-slate-200/90",
      valueColor: notAnsweredPct > 40 ? "text-amber-600" : "text-slate-900",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    },
    {
      id: "not_interested",
      label: "NOT INTERESTED",
      value: notInterested,
      detail: `${notInterestedPct}% drop-off enquiries`,
      pct: `${notInterestedPct}%`,
      icon: UserX,
      cardBg: "bg-white border-slate-200/90",
      valueColor: "text-slate-900",
      badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
    },
    {
      id: "invalid_number",
      label: "INVALID NUMBER",
      value: invalidNumber,
      detail: `${invalidPct}% wrong/invalid phone`,
      pct: `${invalidPct}%`,
      icon: PhoneOff,
      cardBg: "bg-white border-slate-200/90",
      valueColor: "text-slate-900",
      badgeColor: "bg-red-50 text-red-800 border-red-200",
    },
  ];

  return (
    <KpiSection title="Lead Engagement & Calling KPIs" className="mb-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.id}
              className={`border rounded-2xl p-4 shadow-xs transition-all duration-200 hover:shadow-md flex flex-col justify-between ${kpi.cardBg}`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider truncate">
                    {kpi.label}
                  </span>
                  <div className="p-1 rounded-md bg-slate-100 text-slate-600 shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>

                {isLoading ? (
                  <div className="h-8 w-16 bg-slate-200 rounded animate-pulse my-1" />
                ) : (
                  <div className="flex items-baseline justify-between gap-1.5">
                    <span className={`text-2xl sm:text-3xl font-black ${kpi.valueColor}`}>
                      {kpi.value}
                    </span>
                    {kpi.pct && (
                      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${kpi.badgeColor}`}>
                        {kpi.pct}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-500 font-medium mt-2 truncate">
                {isLoading ? (
                  <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
                ) : (
                  kpi.detail
                )}
              </div>
            </div>
          );
        })}
      </div>
    </KpiSection>
  );
}
