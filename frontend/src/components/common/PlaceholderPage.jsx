import React from "react";
import { ArrowLeft, Clock, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import Card from "./Card";
import Button from "./Button";

/**
 * Clean ERP placeholder component matching Yash Group ERP dark-blue theme
 */
export default function PlaceholderPage({ title, module, path }) {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#10182f] p-6 rounded-2xl border border-[#1e2a4a] shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/30 mb-2">
            <Clock className="w-3 h-3 text-[#3b82f6]" />
            Enterprise Control Center · Active Workspace
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#f1f5f9] tracking-tight">
            {title || "Feature Module"}
          </h1>
          <p className="text-xs sm:text-sm text-[#94a3b8] mt-1">
            {module || "ERP"} module route:{" "}
            <code className="text-[#2DD4BF] font-mono text-xs">{path}</code>
          </p>
        </div>

        <Link to="/pq/dashboard">
          <Button variant="secondary" size="md" icon={ArrowLeft}>
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Info Card */}
      <Card title={`${title} Workspace`} subtitle={`Registered under ${module} Module`}>
        <div className="py-12 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#0a1020] text-[#3b82f6] flex items-center justify-center mb-4 border border-[#1e2a4a] shadow-xs">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#f1f5f9] mb-1">
            {title} ({module})
          </h3>
          <p className="text-xs text-[#94a3b8] leading-relaxed mb-6">
            This module route is registered and integrated within the unified Yash Group ERP layout. Data tables, lifecycle actions, and operational forms will populate directly from the API service once configured.
          </p>
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0a1020] border border-[#1e2a4a] text-xs text-[#f1f5f9]">
            <span className="w-2 h-2 rounded-full bg-[#2DD4BF] animate-pulse" />
            Active Route: <span className="font-mono font-semibold text-[#2DD4BF]">{path}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
