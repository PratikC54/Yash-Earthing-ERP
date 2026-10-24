import KpiSection from "../../../components/common/KpiSection";
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../services/api';
import {
  MapPin,
  CalendarCheck,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Search,
  Filter,
  Check,
  X,
  RotateCcw,
  Navigation,
} from 'lucide-react';

export default function AttendanceManager() {
  const [subTab, setSubTab] = useState('roster'); // 'roster', 'corrections'
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [metrics, setMetrics] = useState({
    totalWorkforce: 0,
    present: 0,
    absent: 0,
    unreported: 0,
    workDate: new Date().toISOString().slice(0, 10),
  });

  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 10));
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // GPS Check-in State
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsResult, setGpsResult] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  // Roster State
  const [allEmployees, setAllEmployees] = useState([]);
  const [labourWorkers, setLabourWorkers] = useState([]);
  const [rosterCategory, setRosterCategory] = useState('ALL'); // 'ALL' | 'LABOUR_ONLY'
  const [rosterStatusMap, setRosterStatusMap] = useState({});
  const [isSubmittingRoster, setIsSubmittingRoster] = useState(false);

  // Correction Modal
  const [correctingRecord, setCorrectingRecord] = useState(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [newStatus, setNewStatus] = useState('Present');

  // Fetch Attendance List
  const fetchAttendance = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/hrms/attendance', {
        params: {
          date: filterDate,
          status: filterStatus !== 'ALL' ? filterStatus : undefined,
        },
      });
      if (res.data?.success) {
        setAttendanceRecords(res.data.data || []);
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
      }
    } catch (err) {
      console.warn('Attendance fetch note:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [filterDate, filterStatus]);

  // Fetch Workers for Attendance Roster
  const fetchLabourWorkers = useCallback(async () => {
    try {
      const res = await apiClient.get('/hrms/employees', {
        params: { limit: 100, isActive: true },
      });
      if (res.data?.success) {
        const empList = res.data.data || [];
        setAllEmployees(empList);
        setLabourWorkers(empList);

        // Pre-select first employee for GPS check-in if not set
        if (empList.length > 0) {
          setSelectedEmployeeId((prev) => prev || String(empList[0].id));
        }

        // Initialize default roster state as Present
        const initialMap = {};
        empList.forEach((w) => {
          initialMap[w.id] = 'Present';
        });
        setRosterStatusMap(initialMap);
      }
    } catch (err) {
      console.warn('Workers fetch note:', err.message);
    }
  }, []);

  // Filter roster workers when category filter changes
  useEffect(() => {
    if (rosterCategory === 'LABOUR_ONLY') {
      const filtered = allEmployees.filter(
        (e) =>
          e.employmentType === 'Daily-Wage' ||
          e.employmentType === 'Contract' ||
          e.department === 'Production' ||
          e.department === 'Labour Pool' ||
          e.department === 'Installation'
      );
      setLabourWorkers(filtered);
    } else {
      setLabourWorkers(allEmployees);
    }
  }, [rosterCategory, allEmployees]);

  useEffect(() => {
    fetchAttendance();
    fetchLabourWorkers();
  }, [fetchAttendance, fetchLabourWorkers]);

  // Execute GPS Check-In
  const handleGpsCheckIn = () => {
    if (!selectedEmployeeId) {
      setMessage({ type: 'error', text: 'Please select an employee code to clock in.' });
      return;
    }

    if (!navigator.geolocation) {
      setMessage({
        type: 'error',
        text: 'Geolocation is not supported by your browser.',
      });
      return;
    }

    setGpsLoading(true);
    setMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await apiClient.post('/hrms/attendance/check-in', {
            employeeId: Number(selectedEmployeeId),
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });

          if (res.data?.success) {
            setGpsResult(res.data);
            setMessage({
              type: 'success',
              text: `Check-in approved! Validated within geofence perimeter (${res.data.geofence?.distance || 0}m).`,
            });
            fetchAttendance();
          }
        } catch (err) {
          setMessage({ type: 'error', text: err.message });
        } finally {
          setGpsLoading(false);
        }
      },
      (geoError) => {
        setGpsLoading(false);
        setMessage({
          type: 'error',
          text: `Location permission denied or unavailable: ${geoError.message}. Attendance cannot be marked Present without valid coordinates.`,
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Clock Out
  const handleClockOut = async () => {
    if (!selectedEmployeeId) {
      setMessage({ type: 'error', text: 'Please select an employee code to clock out.' });
      return;
    }

    try {
      setGpsLoading(true);
      const res = await apiClient.post('/hrms/attendance/check-out', {
        employeeId: Number(selectedEmployeeId),
      });
      if (res.data?.success) {
        setMessage({
          type: 'success',
          text: `Clocked out successfully! Total recorded hours: ${res.data.data.hoursWorked} hrs.`,
        });
        fetchAttendance();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setGpsLoading(false);
    }
  };

  // Submit Supervisor Labour Roster
  const handleSubmitLabourRoster = async () => {
    setIsSubmittingRoster(true);
    setMessage(null);
    try {
      const rosterItems = Object.entries(rosterStatusMap).map(([empId, status]) => ({
        employeeId: Number(empId),
        status,
        hoursWorked: status === 'Present' ? 8.0 : 0.0,
      }));

      const res = await apiClient.post('/hrms/attendance/labour-roster', {
        workDate: filterDate,
        rosterItems,
      });

      if (res.data?.success) {
        setMessage({
          type: 'success',
          text: `Supervisor roster successfully saved for ${rosterItems.length} workers.`,
        });
        fetchAttendance();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmittingRoster(false);
    }
  };

  // Submit Manual Correction
  const handleApplyCorrection = async (e) => {
    e.preventDefault();
    if (!correctionReason.trim()) {
      alert('A valid reason is required for manual attendance corrections.');
      return;
    }

    try {
      await apiClient.put(`/hrms/attendance/${correctingRecord.id}/correct`, {
        newStatus,
        reason: correctionReason,
      });
      setCorrectingRecord(null);
      setCorrectionReason('');
      fetchAttendance();
      setMessage({
        type: 'success',
        text: 'Attendance record manually corrected and audit entry logged.',
      });
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Attendance KPI Cards */}
      <KpiSection title="Daily Attendance Overview">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Total Registered</div>
          {isLoading ? (
            <div className="h-7 w-16 bg-slate-200/80 rounded animate-pulse my-1" />
          ) : (
            <div className="text-2xl font-bold text-white mt-1">{metrics.totalWorkforce}</div>
          )}
          {isLoading ? (
            <div className="h-3 w-32 bg-slate-200/60 rounded animate-pulse mt-1" />
          ) : (
            <div className="text-[11px] text-slate-500 mt-1">Active workforce members</div>
          )}
        </div>

        <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Present / OnTime</div>
          {isLoading ? (
            <div className="h-7 w-16 bg-slate-200/80 rounded animate-pulse my-1" />
          ) : (
            <div className="text-2xl font-bold text-emerald-400 mt-1">{metrics.present}</div>
          )}
          {isLoading ? (
            <div className="h-3 w-32 bg-slate-200/60 rounded animate-pulse mt-1" />
          ) : (
            <div className="text-[11px] text-emerald-500/80 mt-1">Verified present today</div>
          )}
        </div>

        <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Confirmed Absent</div>
          {isLoading ? (
            <div className="h-7 w-16 bg-slate-200/80 rounded animate-pulse my-1" />
          ) : (
            <div className="text-2xl font-bold text-rose-400 mt-1">{metrics.absent}</div>
          )}
          {isLoading ? (
            <div className="h-3 w-32 bg-slate-200/60 rounded animate-pulse mt-1" />
          ) : (
            <div className="text-[11px] text-rose-500/80 mt-1">Marked absent</div>
          )}
        </div>

        <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Unreported (Pending)</div>
          {isLoading ? (
            <div className="h-7 w-16 bg-slate-200/80 rounded animate-pulse my-1" />
          ) : (
            <div className="text-2xl font-bold text-amber-400 mt-1">{metrics.unreported}</div>
          )}
          {isLoading ? (
            <div className="h-3 w-32 bg-slate-200/60 rounded animate-pulse mt-1" />
          ) : (
            <div className="text-[11px] text-amber-500/80 mt-1">Pending check-in or roster</div>
          )}
        </div>
        </div>
      </KpiSection>

      {/* Action Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setSubTab('roster')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
            subTab === 'roster'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Manual Attendance Roster</span>
        </button>

        <button
          onClick={() => setSubTab('corrections')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
            subTab === 'corrections'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Daily Attendance Log & Corrections</span>
        </button>
      </div>

      {/* Global Alerts */}
      {message && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center space-x-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>
            {typeof message.text === 'object'
              ? message.text?.message || JSON.stringify(message.text)
              : String(message.text || '')}
          </span>
        </div>
      )}

      {/* TAB 1: Manual Attendance Roster */}
      {subTab === 'roster' && (
        <div className="bg-[#141d30] rounded-2xl border border-slate-800 overflow-hidden shadow-xl space-y-4 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Manual Workforce Attendance Roster</h3>
              <p className="text-xs text-slate-400">
                Mark attendance in bulk for factory workers, staff, and supervisors directly.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-[#0d1424] p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setRosterCategory('ALL')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer font-medium ${
                    rosterCategory === 'ALL'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Workforce ({allEmployees.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRosterCategory('LABOUR_ONLY')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer font-medium ${
                    rosterCategory === 'LABOUR_ONLY'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Factory / Labour Pool Only
                </button>
              </div>

              <button
                onClick={handleSubmitLabourRoster}
                disabled={isSubmittingRoster || labourWorkers.length === 0}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isSubmittingRoster ? 'Saving Roster...' : 'Save & Submit Roster'}</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0d1424] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-semibold whitespace-nowrap">
                <tr>
                  <th className="py-3 px-4">Worker Code & Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Base Salary</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-center">Today's Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {labourWorkers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-white">{worker.fullName}</div>
                      <div className="font-mono text-[11px] text-cyan-400">
                        {worker.employeeCode}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-slate-300">
                        {worker.email || worker.user?.email || <span className="text-slate-600">—</span>}
                      </div>
                      <div className="text-[11px] text-cyan-400 font-mono">
                        {worker.phone || worker.user?.phone || 'No phone'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">{worker.department}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-400 whitespace-nowrap">
                      {worker.salary ? `₹${Number(worker.salary).toLocaleString('en-IN')}` : <span className="text-slate-500">—</span>}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                        {worker.employmentType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex rounded-lg bg-[#0d1424] p-1 border border-slate-750">
                        <button
                          type="button"
                          onClick={() =>
                            setRosterStatusMap({ ...rosterStatusMap, [worker.id]: 'Present' })
                          }
                          className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition ${
                            rosterStatusMap[worker.id] === 'Present'
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setRosterStatusMap({ ...rosterStatusMap, [worker.id]: 'Absent' })
                          }
                          className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition ${
                            rosterStatusMap[worker.id] === 'Absent'
                              ? 'bg-rose-600 text-white shadow-md'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {labourWorkers.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-500 text-xs">
                      No workers found in this category. Switch to &quot;All Workforce&quot; above to see all registered staff.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Daily Attendance Log & Corrections */}
      {subTab === 'corrections' && (
        <div className="bg-[#141d30] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          {/* Controls */}
          <div className="p-4 bg-[#0d1424] border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <label className="text-xs text-slate-400 font-medium">Date:</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-[#141d30] text-xs text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-3">
              <label className="text-xs text-slate-400 font-medium">Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-[#141d30] text-xs text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0d1424] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">Check-In</th>
                  <th className="px-4 py-3.5">Check-Out</th>
                  <th className="px-4 py-3.5">Hours</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Correction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, rIdx) => (
                    <tr key={`skel-att-${rIdx}`} className="animate-pulse">
                      <td className="px-5 py-3.5"><div className="h-4 w-28 bg-slate-200/80 rounded mb-1" /><div className="h-3 w-16 bg-slate-200/60 rounded" /></td>
                      <td className="px-4 py-3.5"><div className="h-4 w-24 bg-slate-200/60 rounded" /></td>
                      <td className="px-4 py-3.5"><div className="h-4 w-16 bg-slate-200/60 rounded" /></td>
                      <td className="px-4 py-3.5"><div className="h-4 w-16 bg-slate-200/60 rounded" /></td>
                      <td className="px-4 py-3.5"><div className="h-4 w-12 bg-slate-200/60 rounded" /></td>
                      <td className="px-4 py-3.5"><div className="h-5 w-16 bg-slate-200/70 rounded-full" /></td>
                      <td className="px-5 py-3.5 text-right"><div className="h-4 w-14 bg-slate-200/60 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : attendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-500">
                      No attendance events recorded for this date.
                    </td>
                  </tr>
                ) : (
                  attendanceRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-800/30">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-white">
                          {rec.employee?.fullName || 'Worker'}
                        </div>
                        <div className="font-mono text-[11px] text-cyan-400">
                          {rec.employee?.employeeCode}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">{rec.employee?.department}</td>
                      <td className="px-4 py-3.5 text-slate-400">
                        {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString() : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400">
                        {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString() : '—'}
                      </td>
                      <td className="px-4 py-3.5 font-mono">{rec.hoursWorked || '0.00'}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                            rec.status === 'Present' || rec.status === 'OnTime'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : rec.status === 'Late'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setCorrectingRecord(rec)}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-blue-400 text-xs transition cursor-pointer"
                        >
                          Correct
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Correction Dialog */}
      {correctingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#141d30] border border-slate-750 w-full max-w-md rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-white text-sm">
                Manual Attendance Correction ({correctingRecord.employee?.fullName})
              </h4>
              <button
                onClick={() => setCorrectingRecord(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyCorrection} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">New Attendance Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-[#0d1424] border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                  <option value="Half Day">Half Day</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  Justification / Mandatory Reason *
                </label>
                <textarea
                  required
                  rows="3"
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Field assignment confirmed by Manager / GPS device failure"
                  className="w-full bg-[#0d1424] border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCorrectingRecord(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl"
                >
                  Confirm & Audit Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
