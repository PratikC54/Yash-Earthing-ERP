import React from "react";

/**
 * Reusable Card Component with Reference Navy Theme
 */
export default function Card({
  title,
  subtitle,
  action,
  children,
  className = "",
  bodyClassName = "",
  headerClassName = "",
  footer,
}) {
  return (
    <div
      className={`bg-[#10182f] border border-[#1e2a4a] rounded-2xl shadow-md overflow-hidden transition-all duration-200 ${className}`}
    >
      {(title || subtitle || action) && (
        <div
          className={`px-5 py-4 border-b border-[#1e2a4a] flex items-center justify-between gap-4 ${headerClassName}`}
        >
          <div>
            {title && (
              <h3 className="text-sm font-bold text-[#f1f5f9] tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-[#94a3b8] mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      <div className={`p-5 text-[#f1f5f9] ${bodyClassName}`}>{children}</div>

      {footer && (
        <div className="px-5 py-3.5 bg-[#0a1020] border-t border-[#1e2a4a] text-xs text-[#94a3b8]">
          {footer}
        </div>
      )}
    </div>
  );
}
