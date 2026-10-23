import React from "react";
import { Loader2 } from "lucide-react";

/**
 * Reusable Loader Component with Yash Group ERP dark-blue theme
 */
export default function Loader({
  label = "Loading...",
  size = "md",
  className = "",
  fullPage = false,
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const content = (
    <div className={`flex flex-col items-center justify-center gap-2.5 ${className}`}>
      <Loader2
        className={`animate-spin text-[#3B82F6] ${
          sizeClasses[size] || sizeClasses.md
        }`}
      />
      {label && (
        <span className="text-xs font-semibold text-[#94a3b8] tracking-wide">
          {label}
        </span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070e1e]/80 backdrop-blur-xs">
        {content}
      </div>
    );
  }

  return content;
}
