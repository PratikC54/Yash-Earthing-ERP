import React from "react";

/**
 * Universal Skeleton Loading Components for Yash Earthing ERP
 * Consistent with Executive White / DaisyUI Acid theme
 */

export function Skeleton({ className = "", rounded = "rounded-lg" }) {
  return (
    <div
      className={`animate-pulse bg-slate-200/70 border border-slate-200/40 ${rounded} ${className}`}
    />
  );
}

export function KpiCardSkeleton({ count = 4, className = "" }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-3 w-28 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-xl" />
          </div>
          <Skeleton className="h-8 w-36 rounded-lg mb-2.5" />
          <div className="flex items-center justify-between pt-1">
            <Skeleton className="h-3.5 w-24 rounded-md" />
            <Skeleton className="h-3.5 w-16 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5, className = "" }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs ${className}`}>
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
        <Skeleton className="h-4 w-40 rounded-md" />
        <Skeleton className="h-4 w-20 rounded-md" />
      </div>
      <div className="divide-y divide-slate-100 p-2">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3.5 w-1/3 rounded-md" />
                <Skeleton className="h-2.5 w-1/4 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-5 w-20 rounded-full shrink-0" />
            <Skeleton className="h-6 w-16 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton({ title = "Loading Dashboard Records..." }) {
  return (
    <div className="p-6 max-w-[1780px] mx-auto space-y-6">
      {/* Hero Header Skeleton */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-28 rounded-full" />
              <Skeleton className="h-4 w-36 rounded-md" />
            </div>
            <Skeleton className="h-7 w-72 sm:w-96 rounded-lg" />
            <Skeleton className="h-3.5 w-full max-w-xl rounded-md" />
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Skeleton className="h-9 w-24 rounded-xl" />
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
        </div>
      </div>

      {/* 4 KPI Cards Skeleton */}
      <KpiCardSkeleton count={4} />

      {/* Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TableSkeleton rows={5} />
        </div>
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Skeleton;
