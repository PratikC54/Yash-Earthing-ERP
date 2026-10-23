import React from "react";
import { AlertCircle, FolderOpen, RefreshCw } from "lucide-react";

export function LoadingSkeleton({ rows = 4, className = "" }) {
  return (
    <div className={`space-y-3 animate-pulse p-4 ${className}`}>
      <div className="h-4 bg-slate-800/80 rounded-md w-1/4"></div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-10 bg-[#10182f] border border-[#1e2a4a] rounded-xl w-full"></div>
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
    <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-700/60 bg-[#10182f]">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-600/10 border border-blue-500/20 text-cyan-400 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 stroke-[1.8]" />
      </div>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-600/30 transition cursor-pointer"
        >
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}

export function ErrorAlert({ message, onRetry }) {
  return (
    <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between">
      <div className="flex items-center space-x-2.5 min-w-0">
        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
        <span className="text-xs font-medium truncate">
          {message || "An unexpected error occurred while communicating with the server."}
        </span>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold transition cursor-pointer shrink-0 ml-3"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}
