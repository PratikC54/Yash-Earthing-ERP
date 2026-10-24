import KpiSection from "../../../components/common/KpiSection";

export default function Module1KpiCards({ stats, loading = false }) {
  const {
    totalPipelineValue = 0,
    totalLeads = 0,
    inDiscussion = 0,
    quotesRequested = 0,
    poConfirmed = 0,
  } = stats || {};

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const isLoading = loading || !stats;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Inbound Pipeline */}
      <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all duration-200 hover:border-blue-500/40">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          TOTAL INBOUND PIPELINE
        </div>
        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {isLoading ? (
            <div className="h-8 w-28 bg-slate-200/80 rounded animate-pulse my-1" />
          ) : (
            formatCurrency(totalPipelineValue)
          )}
        </div>
        <div className="text-xs text-blue-400 font-medium mt-1">
          {isLoading ? (
            <div className="h-3 w-36 bg-slate-200/60 rounded animate-pulse" />
          ) : (
            `${totalLeads} Total Customer Enquiries`
          )}
        </div>

      {/* 2. In Active Discussion */}
      <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all duration-200 hover:border-cyan-500/40">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          IN ACTIVE DISCUSSION
        </div>
        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {isLoading ? (
            <div className="h-8 w-16 bg-slate-200/80 rounded animate-pulse my-1" />
          ) : (
            inDiscussion
          )}
        </div>
        <div className="text-xs text-cyan-400 font-medium mt-1">
          {isLoading ? (
            <div className="h-3 w-32 bg-slate-200/60 rounded animate-pulse" />
          ) : (
            "Contacted & qualified enquiries"
          )}
        </div>

      {/* 3. Quotes Requested */}
      <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all duration-200 hover:border-amber-500/40">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          QUOTES REQUESTED
        </div>
        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {isLoading ? (
            <div className="h-8 w-16 bg-slate-200/80 rounded animate-pulse my-1" />
          ) : (
            quotesRequested
          )}
        </div>
        <div className="text-xs text-amber-400 font-medium mt-1">
          {isLoading ? (
            <div className="h-3 w-36 bg-slate-200/60 rounded animate-pulse" />
          ) : (
            "Commercial sizing & proposal phase"
          )}
        </div>

      {/* 4. PO / Confirmed */}
      <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all duration-200 hover:border-emerald-500/40">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          PO / CONFIRMED
        </div>
        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {isLoading ? (
            <div className="h-8 w-16 bg-slate-200/80 rounded animate-pulse my-1" />
          ) : (
            poConfirmed
          )}
        </div>
        <div className="text-xs text-emerald-400 font-medium mt-1">
          {isLoading ? (
            <div className="h-3 w-32 bg-slate-200/60 rounded animate-pulse" />
          ) : (
            "Converted to confirmed orders"
          )}
        </div>
      </div>
    </KpiSection>
  );
}
