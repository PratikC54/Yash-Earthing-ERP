import React, { useState } from 'react';
import apiClient from '../../../services/api';
import {
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Sliders,
  Calendar,
  Star,
  Activity,
  CheckSquare,
  ShieldCheck,
  Target,
} from 'lucide-react';

export default function PerformanceManager() {
  const [employeeId, setEmployeeId] = useState('1');
  const [employeesList, setEmployeesList] = useState([]);
  const [performanceData, setPerformanceData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLeaderboard = async () => {
    try {
      const res = await apiClient.get('/hrms/performance/leaderboard');
      if (res.data?.success && res.data.data) {
        setLeaderboard(res.data.data);
      }
    } catch (e) {
      console.warn('Leaderboard fetch note:', e.message);
    }
  };

  // Load active employee list for selection & leaderboard
  React.useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await apiClient.get('/hrms/employees', { params: { limit: 50, isActive: true } });
        if (res.data?.success && res.data.data?.length > 0) {
          setEmployeesList(res.data.data);
          const defaultId = String(res.data.data[0].id);
          setEmployeeId(defaultId);
        }
      } catch (e) {}
    }
    loadEmployees();
    fetchLeaderboard();
  }, []);

  React.useEffect(() => {
    if (employeeId) {
      fetchPerformance();
    }
  }, [employeeId]);

  const fetchPerformance = async () => {
    if (!employeeId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/hrms/performance/employees/${employeeId}`);
      if (res.data?.success) {
        setPerformanceData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setPerformanceData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#141d30]/60 border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>7.4 Employee Performance Evaluation & Scoring Matrix</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configurable weighted scoring across Attendance, Task Delivery, Targets, and Quality Adherence
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:border-blue-500 min-w-44"
            >
              {employeesList.length > 0 ? (
                employeesList.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeCode} - {emp.department})
                  </option>
                ))
              ) : (
                <>
                  <option value="1">Rohan Patel (EMP-101)</option>
                  <option value="2">Suresh Kumar (EMP-102)</option>
                  <option value="3">Anjali Sharma (EMP-103)</option>
                  <option value="4">Rakesh (EMP-204)</option>
                </>
              )}
            </select>
          </div>
          <button
            onClick={fetchPerformance}
            disabled={isLoading || !employeeId}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-lg shadow-blue-600/30"
          >
            {isLoading ? 'Calculating...' : 'Evaluate Score'}
          </button>
        </div>
      </div>

      {/* Evaluated Employee Badge */}
      {performanceData?.employee && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-[#141d30] border border-blue-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-600/30 border border-blue-400 flex items-center justify-center text-sm font-bold text-white">
              {performanceData.employee.fullName?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center space-x-2">
                <span>{performanceData.employee.fullName}</span>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                  {performanceData.employee.employeeCode}
                </span>
              </div>
              <div className="text-slate-400 mt-0.5">
                {performanceData.employee.designation || 'Staff'} • {performanceData.employee.department}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Evaluation Target</span>
            <span className="text-emerald-400 font-bold">Active Workforce Record</span>
          </div>
        </div>
      )}

      {/* 4-Card Scoring Weight Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Attendance</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">30% Weight</span>
          </div>
          {isLoading ? (
            <div className="h-7 w-16 bg-slate-200/80 rounded animate-pulse my-2" />
          ) : (
            <div className="text-xl font-bold text-white mt-2">
              {performanceData?.evaluation?.breakdown?.attendance?.score !== null && performanceData?.evaluation?.breakdown?.attendance?.score !== undefined
                ? `${performanceData.evaluation.breakdown.attendance.score}%`
                : '93%'}
            </div>
          )}
          <div className="text-[11px] text-slate-400 mt-1">Punctuality & Presence</div>
        </div>

        <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Task Delivery</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">40% Weight</span>
          </div>
          {isLoading ? (
            <div className="h-7 w-16 bg-slate-200/80 rounded animate-pulse my-2" />
          ) : (
            <div className="text-xl font-bold text-white mt-2">
              {performanceData?.evaluation?.breakdown?.tasks?.score !== null && performanceData?.evaluation?.breakdown?.tasks?.score !== undefined
                ? `${performanceData.evaluation.breakdown.tasks.score}%`
                : '90%'}
            </div>
          )}
          <div className="text-[11px] text-slate-400 mt-1">On-time Completion Ratio</div>
        </div>

        <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Targets</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">20% Weight</span>
          </div>
          {isLoading ? (
            <div className="h-7 w-16 bg-slate-200/80 rounded animate-pulse my-2" />
          ) : (
            <div className="text-xl font-bold text-white mt-2">
              {performanceData?.evaluation?.breakdown?.targets?.score !== null && performanceData?.evaluation?.breakdown?.targets?.score !== undefined
                ? `${performanceData.evaluation.breakdown.targets.score}%`
                : '88%'}
            </div>
          )}
          <div className="text-[11px] text-slate-400 mt-1">Production Milestones</div>
        </div>

        <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Quality</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">10% Weight</span>
          </div>
          {isLoading ? (
            <div className="h-7 w-16 bg-slate-200/80 rounded animate-pulse my-2" />
          ) : (
            <div className="text-xl font-bold text-white mt-2">
              {performanceData?.evaluation?.breakdown?.quality?.score !== null && performanceData?.evaluation?.breakdown?.quality?.score !== undefined
                ? `${performanceData.evaluation.breakdown.quality.score}%`
                : '98%'}
            </div>
          )}
          <div className="text-[11px] text-slate-400 mt-1">Zero-Defect Audit Pass</div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Performance Score Display */}
      {performanceData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Main Score Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-[#141d30] border border-slate-800 flex flex-col items-center justify-center text-center shadow-xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Composite Rating
            </span>
            <div className="text-5xl font-extrabold text-blue-400 mt-3">
              {performanceData.evaluation.finalScore}
              <span className="text-2xl text-slate-500 font-normal">/100</span>
            </div>
            <div className="mt-3 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {performanceData.evaluation.ratingBand.replace(/_/g, ' ')}
            </div>
            {performanceData.evaluation.hasInsufficientData && (
              <p className="mt-3 text-[11px] text-amber-400/90 flex items-center space-x-1">
                <HelpCircle className="w-3.5 h-3.5 inline" />
                <span>Notice: Calculated with partial data</span>
              </p>
            )}
          </div>

          {/* Breakdown Cards */}
          <div className="md:col-span-2 p-6 rounded-2xl bg-[#141d30]/60 border border-slate-800 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Scoring Indicator Breakdown
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-slate-300 font-medium mb-1">
                  <span>Attendance & Punctuality (Weight: 30%)</span>
                  <span>{performanceData.evaluation.breakdown.attendance.score ?? 'N/A'}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${performanceData.evaluation.breakdown.attendance.score || 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 font-medium mb-1">
                  <span>Task Delivery & On-Time Ratio (Weight: 40%)</span>
                  <span>{performanceData.evaluation.breakdown.tasks.score ?? 'N/A'}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${performanceData.evaluation.breakdown.tasks.score || 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 font-medium mb-1">
                  <span>Sales / Target Fulfillment (Weight: 20%)</span>
                  <span>{performanceData.evaluation.breakdown.targets.score ?? 'Insufficient Data'}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${performanceData.evaluation.breakdown.targets.score || 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 font-medium mb-1">
                  <span>Quality Adherence & Zero Defects (Weight: 10%)</span>
                  <span>{performanceData.evaluation.breakdown.quality.score ?? 'Insufficient Data'}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full"
                    style={{ width: `${performanceData.evaluation.breakdown.quality.score || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PERFORMANCE LEADERBOARD TABLE */}
      <div className="p-6 rounded-2xl bg-[#141d30]/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Workforce Performance Leaderboard (Ranked Highest to Lowest)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Top performers ranked automatically across Attendance, Task Delivery, Targets, and Quality scores.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Top Performers First
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0d1424] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Rank</th>
                <th className="px-4 py-3">Employee Name</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Designation</th>
                <th className="px-4 py-3">Attendance</th>
                <th className="px-4 py-3">Task Delivery</th>
                <th className="px-4 py-3">Rating Band</th>
                <th className="px-5 py-3 text-right">Composite Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {leaderboard.map((emp, index) => (
                <tr
                  key={emp.id}
                  onClick={() => setEmployeeId(String(emp.id))}
                  className={`hover:bg-slate-800/40 cursor-pointer transition ${
                    String(employeeId) === String(emp.id) ? 'bg-blue-900/20 border-l-2 border-blue-500' : ''
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                        index === 0
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/40'
                          : index === 1
                          ? 'bg-slate-300 text-slate-950'
                          : index === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      #{index + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-white flex items-center space-x-2">
                    <span>{emp.fullName}</span>
                    <span className="text-[10px] font-mono font-normal text-slate-400">
                      ({emp.employeeCode})
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-300">{emp.department}</td>
                  <td className="px-4 py-3.5 text-slate-400">{emp.designation || 'Staff'}</td>
                  <td className="px-4 py-3.5 text-emerald-400 font-semibold">
                    {emp.breakdown?.attendance?.score ?? 90}%
                  </td>
                  <td className="px-4 py-3.5 text-blue-400 font-semibold">
                    {emp.breakdown?.tasks?.score ?? 85}%
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {emp.ratingBand.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-extrabold text-base text-amber-400">
                    {emp.score}/100
                  </td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                Array.from({ length: 4 }).map((_, rIdx) => (
                  <tr key={`skel-pm-${rIdx}`} className="animate-pulse">
                    <td className="px-5 py-3.5"><div className="h-4 w-6 bg-slate-200/80 rounded" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-32 bg-slate-200/80 rounded" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-20 bg-slate-200/60 rounded" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-16 bg-slate-200/60 rounded" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-12 bg-slate-200/60 rounded" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-12 bg-slate-200/60 rounded" /></td>
                    <td className="px-4 py-3.5"><div className="h-5 w-20 bg-slate-200/70 rounded-full" /></td>
                    <td className="px-5 py-3.5 text-right"><div className="h-5 w-12 bg-slate-200/80 rounded ml-auto" /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
