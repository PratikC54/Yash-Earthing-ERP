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
      className={`bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all duration-200 ${className}`}
    >
      {(title || subtitle || action) && (
        <div
          className={`px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4 ${headerClassName}`}
        >
          <div>
            {title && (
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-600 font-semibold mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      <div className={`p-5 text-slate-800 ${bodyClassName}`}>{children}</div>

      {footer && (
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-600 font-medium">
          {footer}
        </div>
      )}
    </div>
  );
}
