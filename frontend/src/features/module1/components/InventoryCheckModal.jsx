import { X, CheckCircle, AlertTriangle, Boxes, ArrowRight, Loader2, Clock } from "lucide-react";

export default function InventoryCheckModal({ isOpen, onClose, checkResult, onConfirmReserve, onNavigate, isLoading = false }) {
  if (!isOpen) return null;

  const {
    orderNumber = "SO-VERIFY",
    stockReserved = false,
    items = [],
    message = "",
    checkedAt,
  } = checkResult || {};

  // Proper status computation: true ONLY if stock was reserved AND there is no shortage
  const hasShortage = items.some((it) => !it.inStock || Number(it.shortage) > 0);
  const isReady = Boolean(stockReserved) && !hasShortage;

  const handleGoToModule3 = () => {
    if (onClose) onClose();
    if (onNavigate) onNavigate('m3-boms');
  };

  const handleGoToModule2 = () => {
    if (onClose) onClose();
    if (onNavigate) onNavigate('purchase-requests');
  };

  const formattedTime = new Date(checkedAt || Date.now()).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const formattedDate = new Date(checkedAt || Date.now()).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden my-auto text-slate-800 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0c1222] text-[#d4ff00] flex items-center justify-center shadow-xs">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#0f172a]">Inventory Stock Verification</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[11px] font-semibold text-slate-500">
                  Order: <span className="font-mono text-slate-900 font-bold">{orderNumber}</span>
                </p>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {formattedDate}, {formattedTime}
                </span>
              </div>
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

        {/* Loading State for fast perceived loading */}
        {isLoading ? (
          <div className="p-10 space-y-4 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-600 mx-auto" />
            <div className="space-y-1">
              <div className="text-sm font-bold text-slate-900">Verifying Warehouse Stock Levels...</div>
              <p className="text-xs text-slate-500">Scanning real-time inventory records against order requirements</p>
            </div>
            <div className="space-y-2 pt-2 max-w-sm mx-auto">
              <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
            </div>
          </div>
        ) : (
          /* Content Body */
          <div className="p-6 space-y-4 text-xs">
            {/* Status Alert Banner */}
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                isReady
                  ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-medium"
                  : "bg-amber-50 border-amber-300 text-amber-950 font-medium"
              }`}
            >
              {isReady ? (
                <CheckCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-black text-sm mb-1 text-slate-900">
                  {isReady ? "Stock Available & Ready for Dispatch!" : "Inventory Shortage Detected"}
                </div>
                <p className="text-slate-700 leading-relaxed text-xs">
                  {message || (isReady
                    ? "Standard product inventory verified! Required quantity is available. Stock has been reserved."
                    : "Some or all items exceed available physical inventory. Production or procurement required.")}
                </p>
              </div>
            </div>

            {/* Itemized Inventory Matrix */}
            <div>
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Standard Products Stock Verification</span>
                <span className="text-[10px] text-slate-500 font-normal font-mono">Live ERP Stock</span>
              </div>
              <div className="space-y-2.5">
                {items.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 text-xs">
                    No individual line items found. Order verified at summary level.
                  </div>
                ) : (
                  items.map((it, idx) => (
                    <div
                      key={it.productId || idx}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{it.productName}</div>
                        <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                          Ordered: <span className="font-mono text-slate-900 font-bold">{it.orderedQuantity}</span> units | Current Physical Stock: <span className="font-mono text-emerald-700 font-bold">{it.availableStock}</span> units
                        </div>
                      </div>

                      <div>
                        {it.inStock && it.shortage === 0 ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            In Stock (Available)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                            Shortage: {it.shortage} units
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Next Workflow Steps */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 space-y-2 text-xs text-slate-800">
              <span className="font-bold text-blue-900 block">Fulfilment Workflow Next Step:</span>
              <div className="flex items-center gap-1.5 text-blue-950 font-medium">
                <ArrowRight className="w-3.5 h-3.5 shrink-0 text-blue-700" />
                <span>
                  {isReady
                    ? "Stock verified in warehouse stores. Ready for delivery document & dispatch."
                    : "Insufficient finished inventory. Proceed to Module 3 (BOM Material Shortage) or Module 2 (Procurement Requisition)."}
                </span>
              </div>

              {/* Direct Cross-Module Jump Buttons on Shortage */}
              {!isReady && onNavigate && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-blue-200/60">
                  <button
                    type="button"
                    onClick={handleGoToModule3}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg font-bold transition cursor-pointer text-xs"
                  >
                    <span>Explode BOM in Module 3</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleGoToModule2}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300 rounded-lg font-bold transition cursor-pointer text-xs"
                  >
                    <span>Raise Requisition in Module 2</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
              {onConfirmReserve && (
                <button
                  type="button"
                  onClick={onConfirmReserve}
                  className="px-5 py-2.5 bg-[#d4ff00] hover:bg-[#bce600] text-black text-xs font-black rounded-xl shadow-md transition cursor-pointer"
                >
                  Confirm Reservation & Dispatch Ready
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
