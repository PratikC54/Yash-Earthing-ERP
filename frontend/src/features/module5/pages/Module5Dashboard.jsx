import React, { useEffect, useState } from 'react';
import { module5Api } from '../api/module5Api';
import { CyberCard } from '../components/CyberUI';
import {
  FolderKanban,
  Wrench,
  Headset,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

export default function Module5Dashboard({ onNavigate }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await module5Api.getDashboardMetrics();
      setMetrics(data?.data || data || {});
    } catch (err) {
      console.error('Failed to load Module 5 dashboard metrics:', err);
      setError('Unable to fetch live metrics from ERP server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1e2a4a]">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950/60 border border-cyan-500/30 rounded-lg text-cyan-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Module 5: Project, Installation & Service
                <span className="text-xs font-mono uppercase bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800">
                  Live Operations
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                End-to-end execution of earthing installations, quality certification, and after-sales service.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMetrics}
            className="text-xs bg-[#10182f] border border-[#1e2a4a] text-slate-300 hover:text-white px-3 py-1.5 rounded transition-colors"
          >
            Refresh Metrics
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-lg text-rose-300 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <CyberCard className="relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Total Projects
            </span>
            <FolderKanban className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {loading ? '...' : metrics?.totalProjects || 0}
            </span>
            <span className="text-xs text-cyan-400 font-mono">
              {metrics?.activeProjects || 0} active
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-[#1e2a4a] flex items-center justify-between text-xs text-slate-400">
            <span>Completed: {metrics?.completedProjects || 0}</span>
            <button
              onClick={() => onNavigate?.('m5-projects')}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </CyberCard>

        {/* Installations Scheduled */}
        <CyberCard className="relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Scheduled Sites
            </span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {loading ? '...' : metrics?.scheduledInstallations || 0}
            </span>
            <span className="text-xs text-amber-400 font-mono">
              {metrics?.testingInstallations || 0} testing
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-[#1e2a4a] flex items-center justify-between text-xs text-slate-400">
            <span>Total Sites: {metrics?.totalInstallations || 0}</span>
            <button
              onClick={() => onNavigate?.('m5-installations')}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
            >
              Manage <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </CyberCard>

        {/* Successful Handovers */}
        <CyberCard className="relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Handovers Completed
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {loading ? '...' : metrics?.completedInstallations || 0}
            </span>
            <span className="text-xs text-emerald-400 font-mono">Certified</span>
          </div>
          <div className="mt-4 pt-3 border-t border-[#1e2a4a] flex items-center justify-between text-xs text-slate-400">
            <span>≤ 2.0 Ω compliant</span>
            <span className="text-emerald-400 font-medium">100% Verified</span>
          </div>
        </CyberCard>

        {/* Active Support Tickets */}
        <CyberCard className="relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Open Service Tickets
            </span>
            <Headset className="w-5 h-5 text-rose-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {loading ? '...' : metrics?.openTickets || 0}
            </span>
            <span className="text-xs text-rose-400 font-mono">
              {metrics?.inProgressTickets || 0} in progress
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-[#1e2a4a] flex items-center justify-between text-xs text-slate-400">
            <span>Total Tickets: {metrics?.totalTickets || 0}</span>
            <button
              onClick={() => onNavigate?.('m5-service')}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
            >
              Resolve <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </CyberCard>
      </div>

      {/* Operational Workflow Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CyberCard className="lg:col-span-2">
          <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-cyan-400" />
            Module 5 Operational Lifecycle
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            Standards-based earthing execution pipeline with strict resistance gates and customer verification.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-[#0a1020] border border-[#1e2a4a] rounded-lg">
              <span className="font-mono text-cyan-400 block mb-1 font-bold">1. PROJECT INITIALIZATION</span>
              <p className="text-slate-400">
                Created directly against approved Sales Orders. Evaluates BOM requirements and alerts on material shortages in real-time.
              </p>
            </div>
            <div className="p-3 bg-[#0a1020] border border-[#1e2a4a] rounded-lg">
              <span className="font-mono text-cyan-400 block mb-1 font-bold">2. TESTING & HANDOVER</span>
              <p className="text-slate-400">
                Site pits drilled, chemical compound backfilled, and earthing resistance measured. System blocks handover if resistance &gt; 2.0 Ω.
              </p>
            </div>
            <div className="p-3 bg-[#0a1020] border border-[#1e2a4a] rounded-lg">
              <span className="font-mono text-cyan-400 block mb-1 font-bold">3. SERVICE & WARRANTY</span>
              <p className="text-slate-400">
                Post-installation tickets, dynamic 1-year warranty detection, parts consumption logging, and SLA tracking for earthing grids.
              </p>
            </div>
          </div>
        </CyberCard>

        {/* Quick Actions */}
        <CyberCard>
          <h2 className="text-base font-semibold text-white mb-4">Quick Navigation</h2>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => onNavigate?.('m5-projects')}
              className="w-full text-left p-3 rounded-lg bg-[#0a1020] border border-[#1e2a4a] hover:border-cyan-500/50 hover:bg-[#152342] transition-colors flex items-center justify-between"
            >
              <div>
                <div className="font-semibold text-sm text-white">Project Register</div>
                <div className="text-xs text-slate-400">Track tasks & material stock check</div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-cyan-400" />
            </button>

            <button
              onClick={() => onNavigate?.('m5-installations')}
              className="w-full text-left p-3 rounded-lg bg-[#0a1020] border border-[#1e2a4a] hover:border-cyan-500/50 hover:bg-[#152342] transition-colors flex items-center justify-between"
            >
              <div>
                <div className="font-semibold text-sm text-white">Site Installations</div>
                <div className="text-xs text-slate-400">Earth test verification & customer signoff</div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-cyan-400" />
            </button>

            <button
              onClick={() => onNavigate?.('m5-service')}
              className="w-full text-left p-3 rounded-lg bg-[#0a1020] border border-[#1e2a4a] hover:border-cyan-500/50 hover:bg-[#152342] transition-colors flex items-center justify-between"
            >
              <div>
                <div className="font-semibold text-sm text-white">Service Desk & Warranty</div>
                <div className="text-xs text-slate-400">Tickets, warranty status, maintenance logs</div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </CyberCard>
      </div>
    </div>
  );
}
