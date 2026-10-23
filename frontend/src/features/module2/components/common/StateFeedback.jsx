import React from "react";
import { AlertCircle, FolderOpen, RefreshCw } from "lucide-react";

export function LoadingSkeleton({ rows = 4, className = "" }) {
  return (
    <div className={`space-y-3 animate-pulse p-4 ${className}`}>
      <div className="h-4 bg-slate-200/80 rounded-md w-1/4"></div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-10 bg-slate-200/60 rounded-xl w-full"></div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  title = "No records found",
  message = "There are currently no items in this category.",
  actionLabel,
  onAction,
  icon: Icon = FolderOpen,
}) {
  return (
    <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-300 bg-white/60">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 stroke-[1.8]" />
      </div>
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#141d30] text-white hover:bg-slate-800 transition cursor-pointer shadow-sm"
        >
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}

export function ErrorAlert({ message, onRetry }) {
  return (
    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between">
      <div className="flex items-center space-x-2.5 min-w-0">
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
        <span className="text-xs font-medium truncate">
          {message || "An unexpected error occurred while communicating with the server."}
        </span>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition shrink-0 cursor-pointer shadow-2xs"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}
