import { useState } from "react";
import {
  X,
  PhoneCall,
  CheckCircle2,
  Clock,
  Volume2,
  UserCheck,
  Loader2,
  UserX,
  PhoneOff,
} from "lucide-react";

export default function LogCallModal({ isOpen, onClose, lead, onSubmit }) {
  const [outcome, setOutcome] = useState("ANSWERED");
  const [durationMinutes, setDurationMinutes] = useState(3);
  const [followUpDate, setFollowUpDate] = useState(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !lead) return null;

  const isSuccessOutcome = outcome === "ANSWERED" || outcome === "QUOTATION_REQUESTED";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(lead.id, {
          outcome,
          durationMinutes: Number(durationMinutes),
          notes,
          followUpDate: !isSuccessOutcome ? followUpDate : null,
          succeeded: isSuccessOutcome,
          quotationRequested: isSuccessOutcome,
          loggedAt: new Date().toISOString(),
        });
      }
    } finally {
      setIsSubmitting(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-auto text-slate-800 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#0f172a]">Call Customer & Finalize Enquiry</h2>
              <p className="text-[11px] font-semibold text-slate-500">
                Action by Sales Consultant: {lead.assignedByName || "Sales Consultant"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Previous Call Logs Section */}
        {lead.callLogs && lead.callLogs.length > 0 && (
          <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-200 max-h-40 overflow-y-auto">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Previous Call Logs ({lead.callLogs.length})</span>
              <span className="text-[10px] text-slate-500 font-medium">History</span>
            </div>
            <div className="space-y-2">
              {lead.callLogs.map((log) => (
                <div key={log.id} className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Outcome: <span className={log.outcome === "ANSWERED" || log.quoteRequested ? "text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-bold" : "text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-bold"}>{log.outcome}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.loggedAt || log.createdAt).toLocaleDateString()} {new Date(log.loggedAt || log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {log.discussionHighlights && (
                    <div className="text-slate-600 italic bg-slate-50 p-1.5 rounded-lg border border-slate-100 text-[11px]">
                      "{log.discussionHighlights}"
                    </div>
                  )}
                  {log.nextFollowUpAt && (
                    <div className="text-amber-700 font-semibold text-[10px]">
                      Follow-up scheduled: {new Date(log.nextFollowUpAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customer Quick Dial Banner */}
        <div className="p-3.5 mx-6 mt-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-900">{lead.customerName}</div>
            <div className="text-[11px] text-slate-600 font-medium mt-0.5">
              {lead.contactName} | <span className="font-mono font-bold text-slate-900">{lead.phone}</span>
            </div>
          </div>
          <a
            href={`tel:${lead.phone?.replace(/\s/g, "")}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call Now</span>
          </a>
        </div>

        {/* Calling Assistant Box */}
        <div className="mx-6 mt-2.5 p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start justify-between gap-3 text-xs text-slate-800">
          <div>
            <span className="font-bold text-blue-900 block mb-0.5">Calling Script Assistant</span>
            <p className="text-[11px] text-blue-950 leading-relaxed font-medium">
              Verify requirement for <b className="text-slate-900">{lead.productName}</b> (Qty: {lead.quantity}). Confirm if customer needs quotation or technical discussion.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSpeakScript}
            className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg shrink-0 cursor-pointer transition"
            title="Read Script Aloud"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* Outcome Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Call Result / Outcome *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setOutcome("ANSWERED")}
                className={`py-2 px-2.5 rounded-xl text-xs transition flex flex-col items-center justify-center gap-1 cursor-pointer text-center ${
                  outcome === "ANSWERED"
                    ? "bg-emerald-50 text-emerald-800 border-2 border-emerald-500 font-extrabold shadow-2xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-bold"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Answered</span>
              </button>

              <button
                type="button"
                onClick={() => setOutcome("BUSY")}
                className={`py-2 px-2.5 rounded-xl text-xs transition flex flex-col items-center justify-center gap-1 cursor-pointer text-center ${
                  outcome === "BUSY"
                    ? "bg-amber-50 text-amber-800 border-2 border-amber-500 font-extrabold shadow-2xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-bold"
                }`}
              >
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Not Answered</span>
              </button>

              <button
                type="button"
                onClick={() => setOutcome("NOT_INTERESTED")}
                className={`py-2 px-2.5 rounded-xl text-xs transition flex flex-col items-center justify-center gap-1 cursor-pointer text-center ${
                  outcome === "NOT_INTERESTED"
                    ? "bg-rose-50 text-rose-800 border-2 border-rose-500 font-extrabold shadow-2xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-bold"
                }`}
              >
                <UserX className="w-4 h-4 text-rose-600" />
                <span>Not Interested</span>
              </button>

              <button
                type="button"
                onClick={() => setOutcome("WRONG_NUMBER")}
                className={`py-2 px-2.5 rounded-xl text-xs transition flex flex-col items-center justify-center gap-1 cursor-pointer text-center ${
                  outcome === "WRONG_NUMBER"
                    ? "bg-red-50 text-red-800 border-2 border-red-500 font-extrabold shadow-2xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-bold"
                }`}
              >
                <PhoneOff className="w-4 h-4 text-red-600" />
                <span>Invalid No.</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Duration (min)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full bg-white text-slate-900 text-xs px-3 py-2 rounded-xl border border-slate-300 font-bold focus:outline-none focus:border-blue-600 shadow-2xs"
              />
            </div>

            {isSuccessOutcome ? (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 flex items-center gap-1.5 font-medium leading-tight">
                <UserCheck className="w-4 h-4 shrink-0 text-emerald-700" />
                <span>Handover to Back Officer for Quotation!</span>
              </div>
            ) : outcome === "NOT_INTERESTED" || outcome === "WRONG_NUMBER" ? (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-900 font-medium leading-tight">
                <span>Lead will be updated with outcome & no callback scheduled.</span>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Follow-up Callback Date
                </label>
                <input
                  type="datetime-local"
                  required
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full bg-white text-slate-900 text-xs px-2.5 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none focus:border-blue-600 shadow-2xs"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Discussion Notes & Customer Details
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record customer specifications, delivery requirements, price expectations discussed..."
              className="w-full bg-white text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 font-medium shadow-2xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 text-xs font-black rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2 disabled:opacity-60 text-white ${
                isSuccessOutcome
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : outcome === "NOT_INTERESTED" || outcome === "WRONG_NUMBER"
                  ? "bg-slate-800 hover:bg-slate-900"
                  : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>
                  {isSuccessOutcome
                    ? "Finalize & Request Quotation"
                    : outcome === "NOT_INTERESTED" || outcome === "WRONG_NUMBER"
                    ? "Save Call Outcome"
                    : "Schedule Follow-up"}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
