import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import module1Service from "../services/module1Service";

export default function OverviewDashboard({ onSelectPage }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await module1Service.getPipelineStats();
        if (res?.success) setStats(res.data);
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      }
    }
    load();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#101b38] via-[#0d162e] to-[#0a1124] border border-[#1e2a4a] rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest block mb-2">
            M1 · SALES, CRM & ORDER MANAGEMENT CONTROL TOWER
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            One connected workflow: Lead → Quote → Order → Dispatch.
          </h1>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Inbound leads are automatically assigned to Sales Consultants for customer finalization. Back Officers issue formal quotations and customer POs, while Sales Managers authorize Sales Orders and verify standard product inventory before dispatch.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button
              type="button"
              onClick={() => onSelectPage && onSelectPage("leads")}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/30 cursor-pointer flex items-center gap-1.5"
            >
              <span>Manage Inbound Leads</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onSelectPage && onSelectPage("quotations")}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              Quotations & PI
            </button>
            <button
              type="button"
              onClick={() => onSelectPage && onSelectPage("orders")}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              Sales Orders & Dispatch
            </button>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/10 to-transparent pointer-events-none" />
      </div>

      {/* 4 Primary Top KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            TOTAL INBOUND PIPELINE
          </div>
          <div className="text-3xl font-black text-white">
            {formatCurrency(stats?.totalPipelineValue || 7074)}
          </div>
          <div className="text-xs text-blue-400 mt-1">
            {stats?.totalLeads || 49} Total Customer Enquiries
          </div>
        </div>

        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            IN ACTIVE DISCUSSION
          </div>
          <div className="text-3xl font-black text-cyan-400">
            {stats?.inDiscussion || 11}
          </div>
          <div className="text-xs text-cyan-400/80 mt-1">Contacted & qualified enquiries</div>
        </div>

        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            QUOTES REQUESTED
          </div>
          <div className="text-3xl font-black text-amber-400">
            {stats?.quotesRequested || 1}
          </div>
          <div className="text-xs text-amber-400/80 mt-1">Commercial proposal phase</div>
        </div>

        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            PO / CONFIRMED
          </div>
          <div className="text-3xl font-black text-emerald-400">
            {stats?.poConfirmed || 0}
          </div>
          <div className="text-xs text-emerald-400/80 mt-1">Converted to confirmed orders</div>
        </div>
      </div>

      {/* Target vs Achievement & Critical Decision Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Target vs Achievement */}
        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                M1 Commercial Conversion Health
              </h3>
              <p className="text-xs text-slate-400">Target vs actual performance</p>
            </div>
            <span className="text-xs font-bold text-emerald-400">84% On-Track</span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Inbound Lead Qualification</span>
                <span className="font-mono font-bold text-cyan-300">88% (Target: 80%)</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full" style={{ width: "88%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Quotation Turnaround (within 1h)</span>
                <span className="font-mono font-bold text-blue-400">92% (Target: 90%)</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "92%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Quote-to-PO Conversion</span>
                <span className="font-mono font-bold text-emerald-400">68% (Target: 60%)</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "68%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Standard Product Inventory Match</span>
                <span className="font-mono font-bold text-amber-400">82% (Target: 95%)</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: "82%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Critical Action Centre */}
        <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Critical Action Centre
              </h3>
              <p className="text-xs text-slate-400">Decisions requiring attention today</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
              3 Actions Due
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#0a1020] border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Call Finalized: Apex Telecom Infra</div>
                <div className="text-[11px] text-slate-400">Back Officer quotation issue required for ESE Arrester</div>
              </div>
              <button
                type="button"
                onClick={() => onSelectPage && onSelectPage("quotations")}
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold"
              >
                Issue Quote
              </button>
            </div>

            <div className="p-3 bg-[#0a1020] border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Customer PO Confirmed: fundsroom</div>
                <div className="text-[11px] text-slate-400">Sales Order release required by Sales Manager</div>
              </div>
              <button
                type="button"
                onClick={() => onSelectPage && onSelectPage("orders")}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold"
              >
                Release SO
              </button>
            </div>

            <div className="p-3 bg-[#0a1020] border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Inventory Check: SO-2026-118</div>
                <div className="text-[11px] text-slate-400">GI Earthing Electrode stock reservation check</div>
              </div>
              <button
                type="button"
                onClick={() => onSelectPage && onSelectPage("orders")}
                className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-[11px] font-bold"
              >
                Check Stock
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
