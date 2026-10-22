import { useState } from "react";
import { X, PhoneCall, CheckCircle2, Clock, Volume2, UserCheck } from "lucide-react";

export default function LogCallModal({ isOpen, onClose, lead, onSubmit }) {
  const [outcome, setOutcome] = useState("ANSWERED");
  const [durationMinutes, setDurationMinutes] = useState(3);
  const [followUpDate, setFollowUpDate] = useState(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [notes, setNotes] = useState("");

  if (!isOpen || !lead) return null;

  const isSuccessOutcome = outcome === "ANSWERED" || outcome === "QUOTATION_REQUESTED";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(lead.id, {
        outcome,
        durationMinutes: Number(durationMinutes),
        notes,
        followUpDate: !isSuccessOutcome ? followUpDate : null,
        succeeded: isSuccessOutcome,
      });
    }
  };

  const handleSpeakScript = () => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const text = `Good morning ${lead.contactName || lead.customerName}. I am calling from Yash Earthing Solutions regarding your enquiry for ${lead.productName || "Earthing equipment"}. May I confirm your site requirements, quantity and delivery schedule?`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#10182f] border border-[#1e2a4a] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0d1424]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Call Customer & Finalize Enquiry</h2>
              <p className="text-[11px] text-slate-400">
                Action by Sales Consultant: {lead.assignedByName || "Sales Consultant"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Quick Dial Banner */}
        <div className="p-4 mx-6 mt-4 bg-[#0a1020] border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-white">{lead.customerName}</div>
            <div className="text-[11px] text-slate-400">
              {lead.contactName} | <span className="font-mono text-cyan-300">{lead.phone}</span>
            </div>
          </div>
          <a
            href={`tel:${lead.phone?.replace(/\s/g, "")}`}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md transition"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call Now</span>
          </a>
        </div>

        {/* Calling Assistant Box */}
        <div className="mx-6 mt-3 p-3 bg-blue-950/30 border border-blue-600/30 rounded-xl flex items-start justify-between gap-3 text-xs text-slate-300">
          <div>
            <span className="font-semibold text-blue-200 block mb-0.5">Calling Script Assistant</span>
            <p className="text-[11px] text-slate-400 leading-snug">
              Verify requirement for <b>{lead.productName}</b> (Qty: {lead.quantity}). Confirm if customer needs quotation or technical discussion.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSpeakScript}
            className="p-1.5 bg-blue-600/20 text-cyan-300 hover:bg-blue-600/40 rounded-lg shrink-0 cursor-pointer"
            title="Read Script Aloud"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* Outcome Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-2 items-center">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Call Result / Outcome *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOutcome("ANSWERED")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border text-left transition flex items-center justify-between ${
                    isSuccessOutcome
                      ? "bg-emerald-600/20 text-emerald-300 border-emerald-500/40 shadow-sm"
                      : "bg-[#0a1020] text-slate-400 border-slate-800 hover:bg-slate-800"
                  }`}
                >
                  <span>Connected</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setOutcome("BUSY")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border text-left transition flex items-center justify-between ${
                    !isSuccessOutcome
                      ? "bg-amber-600/20 text-amber-300 border-amber-500/40 shadow-sm"
                      : "bg-[#0a1020] text-slate-400 border-slate-800 hover:bg-slate-800"
                  }`}
                >
                  <span>Busy/Failed</span>
                  <Clock className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Duration (min)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full bg-[#0a1020] text-slate-100 text-xs px-3 py-2 rounded-xl border border-slate-800"
              />
            </div>
          </div>

          {/* Conditional Workflow Instructions */}
          {isSuccessOutcome ? (
            <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
              <UserCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>
                Enquiry will be marked as <b>QUOTATION_REQUESTED</b> and handed over to <b>BACK_OFFICER</b> to generate official estimate!
              </span>
            </div>
          ) : (
            <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl space-y-2">
              <div className="text-xs text-amber-200 font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Call failed. Follow-up will be issued automatically:</span>
              </div>
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">
                  Scheduled Follow-up Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full bg-[#0a1020] text-slate-100 text-xs px-3 py-2 rounded-lg border border-slate-700"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Discussion Notes & Customer Details
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record technical specifications, delivery requirements, price expectations discussed..."
              className="w-full bg-[#0a1020] text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer ${
                isSuccessOutcome
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-amber-600 hover:bg-amber-500"
              }`}
            >
              {isSuccessOutcome ? "Finalize & Request Quotation" : "Schedule Follow-up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
