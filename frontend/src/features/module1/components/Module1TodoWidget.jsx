import { useState, useMemo } from "react";
import { CheckSquare, Square, Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

export default function Module1TodoWidget({
  title = "Action To-Dos",
  pageType = "leads", // 'leads' | 'followups' | 'quotations' | 'orders'
  items = [],         // Current records on the page (leads, followups, quotations, or orders)
  className = "",
}) {
  // Derive automated action items from the current page's real data
  const dynamicTodos = useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) return [];

    const generated = [];

    if (pageType === "leads") {
      // Find uncontacted / new leads
      const uncontacted = items.filter((l) => l.stage === "NEW");
      if (uncontacted.length > 0) {
        generated.push({
          id: "dyn-leads-new",
          text: `Contact ${uncontacted.length} new customer ${uncontacted.length === 1 ? "enquiry" : "enquiries"} (e.g. ${uncontacted[0].customerName})`,
          priority: "CRITICAL",
          source: "SYSTEM",
        });
      }

      // High value leads to qualify
      const highVal = items.filter((l) => Number(l.expectedValue || 0) >= 50000 && l.stage !== "PO_RECEIVED" && l.stage !== "CONVERTED");
      if (highVal.length > 0) {
        generated.push({
          id: "dyn-leads-highval",
          text: `Prioritize high-value lead ${highVal[0].code} (${highVal[0].customerName}) valued at ₹${Number(highVal[0].expectedValue).toLocaleString("en-IN")}`,
          priority: "HIGH",
          source: "SYSTEM",
        });
      }

      // Leads needing quotation
      const quoteNeeded = items.filter((l) => l.stage === "REQUIREMENT_CAPTURED" || l.stage === "QUALIFIED");
      if (quoteNeeded.length > 0) {
        generated.push({
          id: "dyn-leads-quote",
          text: `Prepare quotation draft for ${quoteNeeded[0].customerName} (${quoteNeeded.length} pending quote handovers)`,
          priority: "HIGH",
          source: "SYSTEM",
        });
      }
    } else if (pageType === "followups") {
      const now = new Date();

      // Overdue callbacks
      const overdue = items.filter((f) => {
        if (!f.nextFollowUpAt) return false;
        const d = new Date(f.nextFollowUpAt);
        return d < now && d.toDateString() !== now.toDateString();
      });
      if (overdue.length > 0) {
        generated.push({
          id: "dyn-fu-overdue",
          text: `URGENT: Call back ${overdue[0].customerName} (${overdue[0].phone}) - Overdue by ${Math.ceil((now - new Date(overdue[0].nextFollowUpAt)) / (1000 * 3600 * 24))}d`,
          priority: "CRITICAL",
          source: "SYSTEM",
        });
      }

      // Due Today callbacks
      const dueToday = items.filter((f) => {
        if (!f.nextFollowUpAt) return false;
        return new Date(f.nextFollowUpAt).toDateString() === now.toDateString();
      });
      if (dueToday.length > 0) {
        generated.push({
          id: "dyn-fu-today",
          text: `Dial scheduled callback for ${dueToday[0].customerName} (${dueToday.length} due today)`,
          priority: "HIGH",
          source: "SYSTEM",
        });
      }

      // WhatsApp follow-ups
      const waPending = items.filter((f) => f.phone);
      if (waPending.length > 0) {
        generated.push({
          id: "dyn-fu-wa",
          text: `Send WhatsApp catalogue & specs to ${waPending[0].customerName}`,
          priority: "MEDIUM",
          source: "SYSTEM",
        });
      }
    } else if (pageType === "quotations") {
      // Draft quotations waiting review/send
      const drafts = items.filter((q) => q.status === "DRAFT");
      if (drafts.length > 0) {
        generated.push({
          id: "dyn-qt-draft",
          text: `Send draft estimate ${drafts[0].quotationNo} to ${drafts[0].customer?.name || drafts[0].lead?.customerName || "client"}`,
          priority: "HIGH",
          source: "SYSTEM",
        });
      }

      // Quotations needing PI finalization
      const needPI = items.filter((q) => (q.status === "SENT" || q.status === "ACCEPTED") && !q.proformaInvoiceNumber);
      if (needPI.length > 0) {
        generated.push({
          id: "dyn-qt-pi",
          text: `Generate Proforma Invoice (PI) for accepted quote ${needPI[0].quotationNo}`,
          priority: "CRITICAL",
          source: "SYSTEM",
        });
      }

      // Quotations with customer PO needing Sales Order
      const withPO = items.filter((q) => q.customerPONumber);
      if (withPO.length > 0) {
        generated.push({
          id: "dyn-qt-so",
          text: `Convert confirmed PO (${withPO[0].customerPONumber}) to authorized Sales Order`,
          priority: "HIGH",
          source: "SYSTEM",
        });
      }
    } else if (pageType === "orders") {
      // Stock check pending
      const stockCheck = items.filter((o) => !o.stockReserved);
      if (stockCheck.length > 0) {
        generated.push({
          id: "dyn-ord-stock",
          text: `Perform physical stock check for order ${stockCheck[0].orderNumber} (${stockCheck.length} pending)`,
          priority: "CRITICAL",
          source: "SYSTEM",
        });
      }

      // Ready for dispatch
      const readyDispatch = items.filter((o) => o.dispatchStatus === "READY_FOR_DISPATCH" || o.dispatchStatus === "WAITING_APPROVAL");
      if (readyDispatch.length > 0) {
        generated.push({
          id: "dyn-ord-dispatch",
          text: `Authorize dispatch manifest & delivery challan for SO ${readyDispatch[0].orderNumber} (${readyDispatch[0].customer?.name || "Client"})`,
          priority: "HIGH",
          source: "SYSTEM",
        });
      }

      // Delivery location verification
      const pendingDelivery = items.filter((o) => !o.deliveryLocation || o.deliveryLocation.includes("Yard") || o.deliveryLocation.includes("TBD"));
      if (pendingDelivery.length > 0) {
        generated.push({
          id: "dyn-ord-address",
          text: `Confirm exact delivery site address & contact person for ${pendingDelivery[0].orderNumber}`,
          priority: "MEDIUM",
          source: "SYSTEM",
        });
      }
    }

    return generated;
  }, [items, pageType]);

  // User-created manual tasks per page stored in localStorage
  const storageKey = `yash_m1_todos_${pageType}`;
  const [manualTodos, setManualTodos] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Track completed IDs across both dynamic and manual tasks
  const [completedMap, setCompletedMap] = useState(() => {
    try {
      const saved = localStorage.getItem(`yash_m1_todos_done_${pageType}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [newText, setNewText] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [isAdding, setIsAdding] = useState(false);

  const toggleTodo = (id) => {
    setCompletedMap((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(`yash_m1_todos_done_${pageType}`, JSON.stringify(next));
      } catch (e) {
        console.warn("Storage error:", e);
      }
      return next;
    });
  };

  const deleteManualTodo = (id) => {
    setManualTodos((prev) => {
      const next = prev.filter((t) => t.id !== id);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (e) {
        console.warn("Storage error:", e);
      }
      return next;
    });
  };

  const handleAddManual = (e) => {
    e.preventDefault();
    if (!newText.trim()) return;
    const item = {
      id: `manual-${Date.now()}`,
      text: newText.trim(),
      priority,
      source: "MANUAL",
      createdAt: new Date().toISOString(),
    };
    const next = [item, ...manualTodos];
    setManualTodos(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch (err) {
      console.warn("Storage error:", err);
    }
    setNewText("");
    setIsAdding(false);
  };

  // Combine dynamic page tasks + manual tasks
  const allTodos = useMemo(() => {
    return [...dynamicTodos, ...manualTodos];
  }, [dynamicTodos, manualTodos]);

  const pendingCount = allTodos.filter((t) => !completedMap[t.id]).length;

  return (
    <div className={`bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200/60 text-blue-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 tracking-tight uppercase">
              {title}
            </h4>
            <p className="text-[10px] text-slate-500 font-medium">
              {pendingCount} pending {pendingCount === 1 ? "task" : "tasks"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding((v) => !v)}
          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition text-xs font-bold flex items-center gap-1 cursor-pointer"
          title="Add custom task"
        >
          <Plus className="w-4 h-4" />
          <span className="text-[11px] hidden sm:inline">Add</span>
        </button>
      </div>

      {/* Add Task Input Form */}
      {isAdding && (
        <form onSubmit={handleAddManual} className="p-3 border-b border-slate-200 bg-slate-50/50 space-y-2">
          <input
            type="text"
            required
            autoFocus
            placeholder="Type task description..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="w-full bg-white text-slate-800 text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 shadow-2xs"
          />
          <div className="flex items-center justify-between gap-2">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="bg-white border border-slate-300 text-slate-700 text-[10px] font-bold rounded-lg px-2 py-1 focus:outline-none"
            >
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-200/60 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-2.5 py-1 text-[10px] font-black bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-2xs"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Todo List */}
      <div className="p-2 space-y-1.5 max-h-[420px] overflow-y-auto flex-1">
        {allTodos.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs font-medium space-y-1">
            <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500/60" />
            <p>No pending action items for this page.</p>
          </div>
        ) : (
          allTodos.map((todo) => {
            const isCompleted = Boolean(completedMap[todo.id]);
            const priorityBadge = {
              CRITICAL: "bg-red-50 text-red-700 border-red-200",
              HIGH: "bg-amber-50 text-amber-700 border-amber-200",
              MEDIUM: "bg-blue-50 text-blue-700 border-blue-200",
              LOW: "bg-slate-100 text-slate-600 border-slate-200",
            }[todo.priority] || "bg-slate-100 text-slate-600 border-slate-200";

            return (
              <div
                key={todo.id}
                className={`group flex items-start gap-2.5 p-2 rounded-xl border transition-all text-xs ${
                  isCompleted
                    ? "bg-slate-50/60 border-slate-200/60 opacity-60"
                    : "bg-white border-slate-200 hover:border-blue-300/80 hover:shadow-2xs"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleTodo(todo.id)}
                  className="mt-0.5 text-slate-400 hover:text-blue-600 shrink-0 cursor-pointer"
                >
                  {isCompleted ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-[11px] leading-tight font-medium ${
                      isCompleted ? "line-through text-slate-400" : "text-slate-800"
                    }`}
                  >
                    {todo.text}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${priorityBadge}`}>
                      {todo.priority}
                    </span>
                    {todo.source === "SYSTEM" && (
                      <span className="text-[9px] text-blue-600 font-semibold bg-blue-50 border border-blue-100 px-1 rounded">
                        Auto
                      </span>
                    )}
                  </div>
                </div>

                {todo.source === "MANUAL" && (
                  <button
                    type="button"
                    onClick={() => deleteManualTodo(todo.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer shrink-0"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
