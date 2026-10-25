import React, { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Reusable Modal Dialog Component with Reference Navy Theme
 */
export default function Modal({
  isOpen = false,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "max-w-lg",
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full ${maxWidth} bg-[#10182f] rounded-2xl shadow-2xl border border-[#1e2a4a] overflow-hidden z-10 animate-in zoom-in-95 duration-150 text-[#f1f5f9] max-h-[92vh] flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4.5 border-b border-[#1e2a4a] bg-[#0b172d] shrink-0">
          <div>
            <h3 className="text-base font-bold text-[#f1f5f9] tracking-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-[#94a3b8] mt-0.5">{subtitle}</p>
            )}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-slate-800/40 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto text-[#f1f5f9] flex-1 min-h-0">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-[#0a1020] border-t border-[#1e2a4a] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
