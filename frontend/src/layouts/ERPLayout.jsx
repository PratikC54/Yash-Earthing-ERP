import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import ERPSidebar from "./components/ERPSidebar";
import ERPNavbar from "./components/ERPNavbar";
import ModuleTabs from "../features/production_quality/components/shared/ModuleTabs";
import authService from "../services/authService";

export default function ERPLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [user, setUser] = useState(() => authService.getStoredUser());
  const [userError, setUserError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If not authenticated, immediately redirect to login
    if (!authService.isAuthenticated()) {
      navigate("/login", { state: { from: location }, replace: true });
      return;
    }

    let isMounted = true;
    authService
      .getCurrentUser()
      .then((currentUser) => {
        if (isMounted) setUser(currentUser);
      })
      .catch((error) => {
        if (isMounted) {
          setUserError(error.message || "Unable to load account details.");
          if (error.status === 401) {
            navigate("/login", { state: { from: location }, replace: true });
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, [location, navigate]);

  const initials = user?.name
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const userProfile = user ? { ...user, initials } : null;

  const handleClose = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      const parentPath = location.pathname.slice(0, location.pathname.lastIndexOf("/"));
      navigate(parentPath || "/pq/dashboard");
    }
  };

  const handleOpenQuickAction = (type) => {
    const destinations = {
      work_order: "/pq/work-orders",
      inspection: "/pq/inspections",
      ncr: "/pq/non-conformance",
    };
    const destination = destinations[type];
    if (destination) navigate(destination);
  };

  return (
    <div className="w-screen h-screen flex overflow-hidden bg-[#070e1e] font-sans antialiased selection:bg-[#3b82f6] selection:text-white">
      {/* 1. Fixed Left Sidebar */}
      <ERPSidebar
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        user={userProfile}
      />

      {/* 2. Main Area: Navbar (fixed) + Main Workspace (independently scrollable) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden lg:pl-[268px] transition-all duration-300">
        {/* Fixed Top Navbar */}
        <ERPNavbar
          onToggleMobileSidebar={() => setIsMobileOpen((prev) => !prev)}
          onOpenQuickAction={handleOpenQuickAction}
          user={userProfile}
          userError={userError}
        />

        {/* Dynamic Main Content Workspace */}
        <main className="flex-1 min-h-0 min-w-0 w-full overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#070e1e] text-[#f1f5f9]">
          <div className="mb-4">
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex items-center gap-2 rounded-lg border border-[#1e2a4a] bg-[#10182f] px-3 py-2 text-xs font-semibold text-[#94a3b8] transition hover:bg-slate-800/40 hover:text-[#f1f5f9]"
              aria-label="Close and return to the previous or parent page"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>
          <div className="mb-6">
            <ModuleTabs />
          </div>
          <Outlet context={{ onOpenQuickAction: handleOpenQuickAction }} />
        </main>
      </div>

    </div>
  );
}
