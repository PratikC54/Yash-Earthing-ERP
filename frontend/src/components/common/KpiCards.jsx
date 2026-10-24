import KpiSection from "./KpiSection";

export default function Module1KpiCards({ stats }) {
  const {
    totalPipelineValue = 7074,
    totalLeads = 49,
    inDiscussion = 11,
    quotesRequested = 1,
    poConfirmed = 0,
  } = stats || {};

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  return (
    <KpiSection title="Pipeline & Enquiries Overview" className="mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Inbound Pipeline */}
        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all duration-200 hover:border-blue-500/40">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            TOTAL INBOUND PIPELINE
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {formatCurrency(totalPipelineValue)}
          </div>
          <div className="text-xs text-blue-400 font-medium mt-1">
            {totalLeads} Total Customer Enquiries
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none" />
        </div>

        {/* 2. In Active Discussion */}
        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all duration-200 hover:border-cyan-500/40">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            IN ACTIVE DISCUSSION
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {inDiscussion}
          </div>
          <div className="text-xs text-cyan-400 font-medium mt-1">
            Contacted & qualified enquiries
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-bl-full pointer-events-none" />
        </div>

        {/* 3. Quotes Requested */}
        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all duration-200 hover:border-amber-500/40">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            QUOTES REQUESTED
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {quotesRequested}
          </div>
          <div className="text-xs text-amber-400 font-medium mt-1">
            Commercial sizing & proposal phase
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />
        </div>

        {/* 4. PO / Confirmed */}
        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all duration-200 hover:border-emerald-500/40">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            PO / CONFIRMED
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {poConfirmed}
          </div>
          <div className="text-xs text-emerald-400 font-medium mt-1">
            Converted to confirmed orders
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
        </div>
      </div>
    </KpiSection>
  );
}
