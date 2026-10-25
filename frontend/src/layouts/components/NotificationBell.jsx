import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  AlertTriangle,
  Flame,
  Wrench,
  FileCheck,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import notificationService from "../../services/notificationService";

export default function NotificationBell() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Poll unread count every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationService.getUnreadCount();
      if (res?.success && typeof res.data?.unreadCount === "number") {
        setUnreadCount(res.data.unreadCount);
      }
    } catch (_) {
      // ignore transient poll failure
    }
  };

  const loadRecentNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getRecentNotifications(8);
      if (res?.success && res.data) {
        setNotifications(res.data);
        if (typeof res.unreadCount === "number") {
          setUnreadCount(res.unreadCount);
        } else if (typeof res.meta?.unreadCount === "number") {
          setUnreadCount(res.meta.unreadCount);
        }
      }
    } catch (_) {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      loadRecentNotifications();
    }
    setIsOpen((prev) => !prev);
  };

  const handleMarkAsRead = async (e, notif) => {
    e.stopPropagation();
    if (notif.status === "READ") return;

    try {
      await notificationService.markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, status: "READ" } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (_) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, status: "READ" })));
      setUnreadCount(0);
    } catch (_) {}
  };

  const handleNotificationClick = async (notif) => {
    if (notif.status === "UNREAD") {
      try {
        await notificationService.markAsRead(notif.id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (_) {}
    }
    setIsOpen(false);

    if (notif.link) {
      navigate(notif.link);
    } else if (notif.workOrderId) {
      navigate(`/pq/work-orders/${notif.workOrderId}`);
    } else if (notif.inspectionId) {
      navigate(`/pq/inspections/${notif.inspectionId}`);
    }
  };

  const formatTimeAgo = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return "Just now";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "CRITICAL":
        return <span className="text-[9px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">Critical</span>;
      case "HIGH":
        return <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">High</span>;
      case "MEDIUM":
        return <span className="text-[9px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">Medium</span>;
      default:
        return <span className="text-[9px] font-medium uppercase tracking-wider text-slate-400 bg-slate-500/10 px-1.5 py-0.5 rounded border border-slate-500/20">Low</span>;
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case "DEADLINE_APPROACHING":
      case "WORK_ORDER_OVERDUE":
        return <Clock className="w-3.5 h-3.5 text-amber-400" />;
      case "PRODUCTION_COMPLETED":
      case "REWORK_COMPLETED":
        return <Check className="w-3.5 h-3.5 text-emerald-400" />;
      case "INSPECTION_FAILED":
      case "CRITICAL_DEFECT":
        return <Flame className="w-3.5 h-3.5 text-rose-400" />;
      case "MACHINE_BREAKDOWN":
        return <Wrench className="w-3.5 h-3.5 text-amber-400" />;
      case "INSPECTION_OVERDUE":
        return <FileCheck className="w-3.5 h-3.5 text-orange-400" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="relative p-2 rounded-lg text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#1e2a4a]/50 transition-colors focus:outline-none cursor-pointer"
        aria-label="View ERP Alerts & Notifications"
        title="Smart Alerts & Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black text-white bg-rose-500 rounded-full ring-2 ring-[#0b172d] animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Popover */}
      {isOpen && (
        <div className="absolute -right-12 sm:right-0 top-full mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 bg-[#0e172a] border border-[#1e2a4a] rounded-2xl shadow-2xl overflow-hidden z-50 text-[#f1f5f9] animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="px-4 py-3 bg-[#0b1324] border-b border-[#1e2a4a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Smart Alerts</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List Area */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#1e2a4a]/60">
            {loading && (
              <div className="py-8 text-center text-xs text-[#94a3b8]">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading alerts...
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="py-8 text-center text-xs text-[#64748b]">
                <Bell className="w-6 h-6 mx-auto mb-1 text-[#1e2a4a]" />
                <p>No notifications yet</p>
              </div>
            )}

            {!loading &&
              notifications.map((notif) => {
                const isUnread = notif.status === "UNREAD";
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`px-4 py-3 hover:bg-[#131f38] transition-colors cursor-pointer flex items-start gap-3 relative ${
                      isUnread ? "bg-blue-500/5" : ""
                    }`}
                  >
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 absolute left-2 top-4" />
                    )}

                    <div className="p-2 rounded-lg bg-[#080d1a] border border-[#1e2a4a] shrink-0 mt-0.5">
                      {getEventIcon(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-semibold text-white truncate">
                          {notif.title}
                        </span>
                        {getPriorityBadge(notif.priority)}
                      </div>
                      <p className="text-[11px] text-[#94a3b8] line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="flex items-center justify-between mt-1.5 text-[10px] text-[#64748b]">
                        <span>{formatTimeAgo(notif.createdAt)}</span>
                        {isUnread && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsRead(e, notif)}
                            className="text-blue-400 hover:text-blue-300 font-medium"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Footer View All */}
          <div className="p-2.5 bg-[#0b1324] border-t border-[#1e2a4a] text-center">
            <Link
              to="/pq/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1.5 transition-colors py-1"
            >
              <span>View All Alerts & Escalations</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
