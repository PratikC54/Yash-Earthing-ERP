import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

/**
 * Reusable ModuleHeader with Reference Navy Theme
 */
export default function ModuleHeader({
  title,
  subtitle,
  breadcrumbs = [],
  action,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
      <div>
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.label || idx}>
                {crumb.to ? (
                  <Link
                    to={crumb.to}
                    className="hover:text-black transition font-semibold"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-slate-800 font-bold">
                    {crumb.label}
                  </span>
                )}
                {idx < breadcrumbs.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-700 font-medium mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {action && <div className="flex items-center gap-2.5 shrink-0">{action}</div>}
    </div>
  );
}
