import { X, CheckCircle, AlertTriangle, Boxes, ArrowRight } from "lucide-react";

export default function InventoryCheckModal({ isOpen, onClose, checkResult, onConfirmReserve }) {
  if (!isOpen || !checkResult) return null;

  const {
    orderNumber,
    stockReserved,
    dispatchStatus,
    items = [],
    message,
  } = checkResult;

  const isReady = stockReserved || dispatchStatus === "READY_FOR_DISPATCH";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#10182f] border border-[#1e2a4a] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0d1424]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Inventory Stock Verification</h2>
              <p className="text-[11px] text-slate-400">
                Order: <span className="font-mono text-cyan-300 font-bold">{orderNumber}</span>
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

        {/* Status Alert Banner */}
        <div className="p-6 space-y-4 text-xs">
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              isReady
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                : "bg-amber-950/40 border-amber-500/40 text-amber-200"
            }`}
          >
            {isReady ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold text-sm mb-1 text-white">
                {isReady ? "Stock Available & Ready for Dispatch!" : "Inventory Shortage Detected"}
              </div>
              <p className="text-slate-300 leading-relaxed">{message}</p>
            </div>
          </div>

          {/* Itemized Inventory Matrix */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Standard Products Stock Verification
            </div>
            <div className="space-y-2.5">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="bg-[#0a1020] border border-slate-800 rounded-xl p-3.5 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-white text-xs">{it.productName}</div>
                    <div className="text-[11px] text-slate-400">
                      Ordered: <span className="font-mono text-white font-bold">{it.orderedQuantity}</span> units | Current Physical Stock: <span className="font-mono text-cyan-300 font-bold">{it.availableStock}</span> units
                    </div>
                  </div>

                  <div>
                    {it.inStock ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        In Stock (Available)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-300 border border-red-500/30">
                        Shortage: {it.shortage} units
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Workflow Steps */}
          <div className="bg-[#0a1020] border border-slate-800 rounded-xl p-3.5 space-y-1.5 text-[11px] text-slate-400">
            <span className="font-bold text-slate-200 block mb-1">Fulfilment Workflow Next Step:</span>
            <div className="flex items-center gap-1.5 text-cyan-300">
              <ArrowRight className="w-3.5 h-3.5" />
              <span>
                {isReady
                  ? "Stock reserved in warehouse. Ready for handover to Factory & Dispatch Desk (Operations Module)."
                  : "Production replenishment request has been forwarded to Manufacturing & Work Orders desk."}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl cursor-pointer"
            >
              Close
            </button>
            {onConfirmReserve && (
              <button
                type="button"
                onClick={onConfirmReserve}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                Confirm Reservation & Dispatch Ready
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
