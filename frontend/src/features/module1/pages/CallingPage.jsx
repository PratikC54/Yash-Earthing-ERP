import { Volume2 } from "lucide-react";

export default function CallingPage() {

  const salesReps = [
    { id: 1, name: "Usha Sawant", role: "Senior Sales Consultant", targetCalls: 30, completedCalls: 26, convertedQuotes: 4, score: 92 },
    { id: 2, name: "Shraddha More", role: "Sales Consultant", targetCalls: 25, completedCalls: 22, convertedQuotes: 3, score: 88 },
    { id: 3, name: "Ashwini Darveshi", role: "Sales Consultant", targetCalls: 25, completedCalls: 20, convertedQuotes: 2, score: 84 },
    { id: 4, name: "Ram Sharma", role: "Technical Sales Specialist", targetCalls: 20, completedCalls: 18, convertedQuotes: 3, score: 90 },
  ];

  const handleSpeak = (text) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="min-h-full">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            DAILY CALLS TARGET
          </div>
          <div className="text-3xl font-black text-white">100</div>
          <div className="text-xs text-blue-400 mt-1">Across 4 sales consultants</div>
        </div>

        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            CALLS DONE TODAY
          </div>
          <div className="text-3xl font-black text-emerald-400">86</div>
          <div className="text-xs text-emerald-400/80 mt-1">86% achievement rate</div>
        </div>

        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            FINALIZED / QUOTES
          </div>
          <div className="text-3xl font-black text-cyan-400">12</div>
          <div className="text-xs text-cyan-400/80 mt-1">Handed over to Back Officer</div>
        </div>

        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            CONVERSION SUCCESS
          </div>
          <div className="text-3xl font-black text-amber-400">13.9%</div>
          <div className="text-xs text-amber-400/80 mt-1">Lead-to-quotation ratio</div>
        </div>
      </div>

      {/* Main Grid: Calling Script & Consultant Targets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Calling Script & Conversation Guide */}
        <div className="lg:col-span-2 bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Sales Consultant Calling Script & Negotiation Playbook
              </h3>
              <p className="text-xs text-slate-400">
                Standard operating procedure for client qualification & enquiry finalization
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                handleSpeak(
                  "Hello, I am calling from Yash Earthing Solutions. We received your requirement for chemical earthing and lightning protection. May I confirm your site location, quantity and required delivery date?"
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 text-cyan-300 border border-blue-500/40 rounded-xl text-xs font-semibold hover:bg-blue-600/30 transition cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Listen SOP</span>
            </button>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="bg-[#0a1020] border border-slate-800 rounded-xl p-3.5 space-y-1">
              <span className="font-bold text-cyan-400 uppercase text-[10px] block">
                Step 1: Introduction & Source Acknowledgment
              </span>
              <p className="italic text-slate-200">
                "Good morning [Contact Person], I am calling from Yash Earthing Solutions regarding your enquiry on IndiaMART/TradeIndia for [Product Name]."
              </p>
            </div>

            <div className="bg-[#0a1020] border border-slate-800 rounded-xl p-3.5 space-y-1">
              <span className="font-bold text-cyan-400 uppercase text-[10px] block">
                Step 2: Technical Scope & Site Verification
              </span>
              <p className="italic text-slate-200">
                "May I confirm your installation location, soil resistivity conditions, electrode diameter (50mm / 17.2mm), and total quantity required?"
              </p>
            </div>

            <div className="bg-[#0a1020] border border-slate-800 rounded-xl p-3.5 space-y-1">
              <span className="font-bold text-cyan-400 uppercase text-[10px] block">
                Step 3: Handover to Back Officer for Commercial Quotation
              </span>
              <p className="italic text-slate-200">
                "Thank you for confirming. I will have our Back Office issue official quotation with compliance certificates (IS 3043:2018 / IEEE 80 / NABL) directly to your WhatsApp and email within 15 minutes."
              </p>
            </div>
          </div>
        </div>

        {/* Right Col: Consultant Target vs Achievement */}
        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Sales Consultant Target Tracker
            </h3>
            <p className="text-xs text-slate-400">Daily calling & quotation quotas</p>
          </div>

          <div className="space-y-4">
            {salesReps.map((rep) => {
              const pct = Math.min(100, Math.round((rep.completedCalls / rep.targetCalls) * 100));
              return (
                <div key={rep.id} className="bg-[#0a1020] border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{rep.name}</div>
                      <div className="text-[10px] text-slate-400">{rep.role}</div>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400">{rep.score}% score</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Calls: {rep.completedCalls} / {rep.targetCalls}</span>
                      <span>Quotes: {rep.convertedQuotes}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
