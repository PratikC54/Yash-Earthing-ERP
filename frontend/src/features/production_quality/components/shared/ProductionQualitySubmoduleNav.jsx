import React, { useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { productionQualitySubmodules } from "../../config/submoduleNavConfig";
import "./ProductionQualitySubmoduleNav.css";

/**
 * Checks whether a tab path or any of its aliases matches the current location pathname.
 */
function isTabActive(currentPath, tab) {
  const normCurrent = (currentPath || "").replace(/\/+$/, "") || "/";
  const normTarget = (tab.path || "").replace(/\/+$/, "") || "/";

  // Check direct match
  if (normCurrent === normTarget) return true;

  // Handle dashboard special case: avoid matching every subpath if tab is root/dashboard
  const isDashboardTab = tab.id === "m4-dashboard";

  if (!isDashboardTab && normCurrent.startsWith(normTarget + "/")) {
    return true;
  }

  // Check aliases
  if (Array.isArray(tab.aliases)) {
    for (const alias of tab.aliases) {
      const normAlias = (alias || "").replace(/\/+$/, "");
      if (!normAlias) continue;

      if (normCurrent === normAlias) return true;

      if (!isDashboardTab && normCurrent.startsWith(normAlias + "/")) {
        return true;
      }
    }
  }

  // Dashboard fallback for root or pq root
  if (isDashboardTab) {
    if (normCurrent === "/" || normCurrent === "/production-quality" || normCurrent === "/pq" || normCurrent === "/production") {
      return true;
    }
  }

  return false;
}

/**
 * Horizontal Submodule Navigation Bar for Production & Quality (Module 4)
 * Consistent dark navy style with icons, active tab highlight, and horizontal scroll.
 */
export default function ProductionQualitySubmoduleNav({ className = "" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const activeItemRef = useRef(null);

  // Auto-scroll active item into visible view when location changes
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [location.pathname]);

  return (
    <nav
      className={`production-quality-submodule-nav ${className}`.trim()}
      aria-label="Production and Quality Submodules"
    >
      <div
        ref={scrollContainerRef}
        className="production-quality-submodule-nav__scroll"
        role="tablist"
      >
        {productionQualitySubmodules.map((tab) => {
          const Icon = tab.icon;
          const active = isTabActive(location.pathname, tab);

          return (
            <button
              key={tab.id}
              ref={active ? activeItemRef : null}
              type="button"
              role="tab"
              aria-selected={active}
              aria-current={active ? "page" : undefined}
              title={tab.description || tab.label}
              onClick={() => {
                if (!active) {
                  navigate(tab.path);
                }
              }}
              className={`production-quality-submodule-nav__item ${
                active ? "production-quality-submodule-nav__item--active" : ""
              }`}
            >
              {Icon && <Icon className="production-quality-submodule-nav__icon" aria-hidden="true" />}
              <span className="production-quality-submodule-nav__label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
