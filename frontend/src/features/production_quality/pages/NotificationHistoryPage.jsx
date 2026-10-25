import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Search,
  CheckCheck,
  Filter,
  Clock,
  Flame,
  Wrench,
  FileCheck,
  Check,
  ChevronRight,
  RefreshCw,
  Sliders,
  ShieldAlert,
  ArrowRight,
  Layers,
  QrCode,
} from "lucide-react";
import notificationService from "../../../services/notificationService";
import QRLabelModal from "../components/qr/QRLabelModal";

export default function NotificationHistoryPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [escalationRules, setEscalationRules] = useState([]);
  const [activeTab, setActiveTab] = useState("notifications"); // 'notifications' | 'escalation'
  const [runningChecks, setRunningChecks] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  useEffect(() => {
    loadNotifications(1);
    loadEscalationRules();
  }, [statusFilter, priorityFilter, typeFilter, categoryFilter]);

  const loadNotifications = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
      };
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (typeFilter) params.type = typeFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await notificationService.listNotifications(params);
      if (res?.success) {
        setNotifications(res.data || []);
        if (res.meta) {
          setUnreadCount(res.meta.unreadCount || 0);
          setPagination(res.meta.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
        }
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadEscalationRules = async () => {
    try {
      const res = await notificationService.getEscalationRules();
      if (res?.success && Array.isArray(res.data)) {
        setEscalationRules(res.data);
      }
    } catch (_) {}
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadNotifications(1);
  };

  const handleMarkAsRead = async (notif) => {
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

  const handleRunChecks = async () => {
    try {
      setRunningChecks(true);
      setCheckResult(null);
      const res = await notificationService.runChecks();
      if (res?.success) {
        setCheckResult({
          type: "success",
          message: `Evaluation completed! Evaluated deadlines and escalations.`,
        });
        loadNotifications(1);
      } else {
        setCheckResult({
          type: "error",
          message: res?.message || "Check run failed.",
        });
      }
    } catch (err) {
      setCheckResult({
        type: "error",
        message: err?.response?.data?.message || err?.message || "Check execution failed.",
      });
    } finally {
      setRunningChecks(false);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "CRITICAL":
        return <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">Critical</span>;
      case "HIGH":
        return <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">High</span>;
      case "MEDIUM":
        return <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">Medium</span>;
      default:
        return <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded border border-slate-500/20">Low</span>;
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case "DEADLINE_APPROACHING":
      case "WORK_ORDER_OVERDUE":
        return <Clock className="w-4 h-4 text-amber-400" />;
      case "PRODUCTION_COMPLETED":
      case "REWORK_COMPLETED":
        return <Check className="w-4 h-4 text-emerald-400" />;
      case "INSPECTION_FAILED":
      case "CRITICAL_DEFECT":
        return <Flame className="w-4 h-4 text-rose-400" />;
      case "MACHINE_BREAKDOWN":
        return <Wrench className="w-4 h-4 text-amber-400" />;
      case "INSPECTION_OVERDUE":
        return <FileCheck className="w-4 h-4 text-orange-400" />;
      default:
        return <Bell className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#070d19] text-[#f1f5f9] p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Smart Alerts & Escalation Center
                </h1>
                <p className="text-xs text-[#94a3b8]">
                  Automated shop floor notifications, SLA warnings, and multi-level management escalation
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsQRModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#1e2a4a] hover:bg-slate-700 text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors cursor-pointer border border-[#2b3d68]"
              title="View & Print Work Order QR Code"
            >
              <QrCode className="w-4 h-4 text-blue-400" />
              <span>QR Code</span>
            </button>
            <button
              type="button"
              onClick={handleRunChecks}
              disabled={runningChecks}
              className="px-3.5 py-2 rounded-xl bg-[#1e2a4a] hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              title="Run instant SLA & deadline evaluation"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${runningChecks ? "animate-spin" : ""}`} />
              <span>{runningChecks ? "Evaluating..." : "Run Checks Now"}</span>
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark All Read ({unreadCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Notification Message */}
        {checkResult && (
          <div className={`p-3.5 rounded-xl text-xs flex items-center justify-between ${
            checkResult.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
          }`}>
            <span>{checkResult.message}</span>
            <button
              type="button"
              onClick={() => setCheckResult(null)}
              className="text-[#94a3b8] hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex border-b border-[#1e2a4a] gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("notifications")}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === "notifications"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-[#94a3b8] hover:text-white"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Alerts & History ({pagination.total})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("escalation")}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === "escalation"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-[#94a3b8] hover:text-white"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Escalation Rules ({escalationRules.length})</span>
          </button>
        </div>

        {/* TAB 1: NOTIFICATIONS LIST */}
        {activeTab === "notifications" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-[#0e172a] border border-[#1e2a4a] rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search input */}
              <form onSubmit={handleSearchSubmit} className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search alerts by title or message..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#080d1a] border border-[#1e2a4a] text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-blue-500"
                />
              </form>

              {/* Dropdown Filters */}
              <div className="flex flex-wrap items-center gap-2">
                                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#080d1a] border border-[#1e2a4a] text-xs text-[#94a3b8] focus:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  <option value="WORK_ORDER">Production</option>
                  <option value="QUALITY">Quality</option>
                  <option value="MAINTENANCE">Machine Downtime</option>
                  <option value="ESCALATION">Escalation</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#080d1a] border border-[#1e2a4a] text-xs text-[#94a3b8] focus:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="UNREAD">Unread Only</option>
                  <option value="READ">Read Only</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#080d1a] border border-[#1e2a4a] text-xs text-[#94a3b8] focus:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Priorities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#080d1a] border border-[#1e2a4a] text-xs text-[#94a3b8] focus:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Event Types</option>
                  <option value="DEADLINE_APPROACHING">Approaching Deadline</option>
                  <option value="WORK_ORDER_OVERDUE">Work Order Overdue</option>
                  <option value="PRODUCTION_COMPLETED">Production Completed</option>
                  <option value="INSPECTION_FAILED">Inspection Failed</option>
                  <option value="REWORK_COMPLETED">Rework Completed</option>
                  <option value="MACHINE_BREAKDOWN">Machine Breakdown</option>
                  <option value="INSPECTION_OVERDUE">Inspection Overdue</option>
                  <option value="CRITICAL_DEFECT">Critical Defect</option>
                </select>
              </div>
            </div>

            {/* Notifications Grid / List */}
            <div className="bg-[#0e172a] border border-[#1e2a4a] rounded-2xl overflow-hidden divide-y divide-[#1e2a4a]/60 shadow-lg">
              {loading && (
                <div className="py-16 text-center text-xs text-[#94a3b8]">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  Loading notifications...
                </div>
              )}

              {!loading && notifications.length === 0 && (
                <div className="py-16 text-center text-xs text-[#64748b]">
                  <Bell className="w-8 h-8 mx-auto text-[#1e2a4a] mb-2" />
                  <p className="font-semibold text-white">No notifications matching filters</p>
                  <p className="mt-1">All shop floor and quality alerts are up to date.</p>
                </div>
              )}

              {!loading &&
                notifications.map((notif) => {
                  const isUnread = notif.status === "UNREAD";
                  return (
                    <div
                      key={notif.id}
                      className={`p-4 hover:bg-[#111e36] transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        isUnread ? "bg-blue-500/5" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <div className="p-2.5 rounded-xl bg-[#080d1a] border border-[#1e2a4a] shrink-0 mt-0.5">
                          {getEventIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-white">{notif.title}</span>
                            {getPriorityBadge(notif.priority)}
                            {isUnread && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500 text-white">
                                NEW
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#94a3b8] leading-relaxed">{notif.message}</p>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#64748b] pt-0.5">
                            <span>{new Date(notif.createdAt).toLocaleString()}</span>
                            {notif.workOrderId && (
                              <span>• WO #{notif.workOrderId}</span>
                            )}
                            {notif.inspectionId && (
                              <span>• Inspection #{notif.inspectionId}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {isUnread && (
                          <button
                            type="button"
                            onClick={() => handleMarkAsRead(notif)}
                            className="px-3 py-1.5 rounded-lg bg-[#1e2a4a] hover:bg-slate-700 text-xs text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
                          >
                            Mark Read
                          </button>
                        )}

                        {notif.link && (
                          <Link
                            to={notif.link}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between text-xs text-[#94a3b8] px-2">
                <span>
                  Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => loadNotifications(pagination.page - 1)}
                    className="px-3 py-1.5 rounded-lg bg-[#0e172a] border border-[#1e2a4a] disabled:opacity-40 hover:bg-[#1e2a4a] transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => loadNotifications(pagination.page + 1)}
                    className="px-3 py-1.5 rounded-lg bg-[#0e172a] border border-[#1e2a4a] disabled:opacity-40 hover:bg-[#1e2a4a] transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ESCALATION RULES MATRIX */}
        {activeTab === "escalation" && (
          <div className="space-y-4">
            <div className="bg-[#0e172a] border border-[#1e2a4a] rounded-2xl p-5 shadow-lg">
              <h2 className="text-base font-bold text-white mb-1">Configured Escalation Rules</h2>
              <p className="text-xs text-[#94a3b8] mb-5">
                Multi-level SLA thresholds automatically escalate unresolved shop floor bottlenecks to responsible managers.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {escalationRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-5 rounded-xl bg-[#080d1a] border border-[#1e2a4a] relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none" />
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          Level {rule.level}
                        </span>
                        <span className={`text-[10px] font-bold uppercase ${rule.isActive ? "text-emerald-400" : "text-slate-500"}`}>
                          {rule.isActive ? "Active" : "Disabled"}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mb-1">{rule.name}</h3>
                      <p className="text-xs text-[#94a3b8] mb-4">
                        Target Role: <strong className="text-white">{Array.isArray(rule.targetRoles) ? rule.targetRoles.join(", ") : (rule.targetRoles || rule.targetRole || "MANAGEMENT")}</strong>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#1e2a4a] space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[#94a3b8]">
                        <span>Trigger Window:</span>
                        <span className="font-mono text-white">After {rule.thresholdHours || Math.round((rule.thresholdMinutes || 0)/60) || 24} hour(s)</span>
                      </div>
                      <div className="flex items-center justify-between text-[#94a3b8]">
                        <span>Notification Priority:</span>
                        <span className="font-bold text-amber-400 uppercase">HIGH</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <QRLabelModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
        />
      </div>
    </div>
  );
}