import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import ERPSidebar from "./components/ERPSidebar";
import ERPNavbar from "./components/ERPNavbar";
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
          const status = error?.response?.status || error?.status;
          if (status === 401) {
            authService.logout();
            navigate("/login", { state: { from: location }, replace: true });
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, [navigate]);

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
          onClose={handleClose}
          user={userProfile}
          userError={userError}
        />

        {/* Dynamic Main Content Workspace */}
        <main className="flex-1 min-h-0 min-w-0 w-full overflow-y-auto overflow-x-hidden p-3 sm:p-6 lg:p-8 bg-[#070e1e] text-[#f1f5f9]">
                    <Outlet context={{ onOpenQuickAction: handleOpenQuickAction }} />
        </main>
      </div>

    </div>
  );
}
