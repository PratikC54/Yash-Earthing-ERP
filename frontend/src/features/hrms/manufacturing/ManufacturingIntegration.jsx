import React, { useState, useEffect } from 'react';
import apiClient from '../../../services/api';
import {
  Factory,
  Users,
  AlertOctagon,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Layers,
  Wrench,
  UserCheck,
  Calendar,
  Sparkles,
  Info,
} from 'lucide-react';

export default function ManufacturingIntegration() {
  const [employees, setEmployees] = useState([]);
  const [readiness, setReadiness] = useState({
    activeAllocationsCount: 2,
    shiftHandoversCount: 1,
    allocations: [
      {
        id: 1,
        workOrderId: 101,
        workOrderNumber: 'WO-2026-001',
        lineName: 'Copper Bonding Line 1 (Earthing Rods)',
        employeeId: 1,
        employeeName: 'Rohan Patel',
        shift: 'SHIFT_A',
        role: 'Lathe Operator',
        assignedDate: '2026-10-23',
      },
      {
        id: 2,
        workOrderId: 102,
        workOrderNumber: 'WO-2026-002',
        lineName: 'Chemical Compound Mixture Station',
        employeeId: 2,
        employeeName: 'Suresh Kumar',
        shift: 'SHIFT_A',
        role: 'Assembly Technician',
        assignedDate: '2026-10-23',
      },
    ],
  });

  const [staffingRisks, setStaffingRisks] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // New Operator Allocation Form State
  const [allocForm, setAllocForm] = useState({
    workOrderNumber: 'WO-2026-003',
    lineName: 'Testing & Spark QC Bench',
    employeeId: '',
    shift: 'SHIFT_A',
    role: 'Operator',
  });
  const [allocSuccess, setAllocSuccess] = useState(false);

  // Shift Handover Form State
  const [handoverNote, setHandoverNote] = useState({
    workCompletedSummary: 'Completed 350m chemical rod extrusion and bonding. Batch #CB-81 inspected.',
    pendingBlockers: 'Low copper strip rolls in RM Store. Need replenishment before Shift B runs.',
    qcNotes: 'All batches tested for electrical conductivity and passed.',
    fromShift: 'SHIFT_A',
    toShift: 'SHIFT_B',
  });
  const [handoverSuccess, setHandoverSuccess] = useState(false);

  // Fetch employees list
  const fetchEmployees = async () => {
    try {
      const res = await apiClient.get('/hrms/employees');
      if (res.data?.success && res.data.data?.length > 0) {
        setEmployees(res.data.data);
        setAllocForm((prev) => ({ ...prev, employeeId: String(res.data.data[0].id) }));
      } else {
        const defaults = [
          { id: 1, fullName: 'Rohan Patel', employeeCode: 'EMP-101', designation: 'Lathe Operator' },
          { id: 2, fullName: 'Suresh Kumar', employeeCode: 'EMP-102', designation: 'Assembly Technician' },
          { id: 3, fullName: 'Anjali Sharma', employeeCode: 'EMP-103', designation: 'Quality Inspector' },
          { id: 4, fullName: 'Rakesh', employeeCode: 'EMP-204', designation: 'Manager' },
        ];
        setEmployees(defaults);
        setAllocForm((prev) => ({ ...prev, employeeId: '1' }));
      }
    } catch (err) {
      const defaults = [
        { id: 1, fullName: 'Rohan Patel', employeeCode: 'EMP-101', designation: 'Lathe Operator' },
        { id: 2, fullName: 'Suresh Kumar', employeeCode: 'EMP-102', designation: 'Assembly Technician' },
        { id: 3, fullName: 'Anjali Sharma', employeeCode: 'EMP-103', designation: 'Quality Inspector' },
        { id: 4, fullName: 'Rakesh', employeeCode: 'EMP-204', designation: 'Manager' },
      ];
      setEmployees(defaults);
      setAllocForm((prev) => ({ ...prev, employeeId: '1' }));
    }
  };

  const fetchReadiness = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/hrms/manufacturing/readiness');
      if (res.data?.success && res.data.data) {
        setReadiness(res.data.data);
      }
    } catch (err) {
      console.warn('Readiness fetch error:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const checkStaffingRisks = async () => {
    try {
      const res = await apiClient.get('/hrms/manufacturing/staffing-risk', {
        params: { absentIds: '2' },
      });
      if (res.data?.success) {
        setStaffingRisks(res.data.data);
      }
    } catch (err) {
      console.warn('Staffing risk error:', err.message);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchReadiness();
    checkStaffingRisks();
  }, []);

  // Handle New Allocation
  const handleAllocate = async (e) => {
    e.preventDefault();
    const emp = employees.find((x) => String(x.id) === String(allocForm.employeeId));
    try {
      const res = await apiClient.post('/hrms/manufacturing/allocate', {
        workOrderId: Date.now() % 1000,
        workOrderNumber: allocForm.workOrderNumber,
        lineName: allocForm.lineName,
        employeeId: Number(allocForm.employeeId),
        employeeName: emp ? emp.fullName : 'Operator',
        shift: allocForm.shift,
        role: allocForm.role || emp?.designation || 'Operator',
      });

      if (res.data?.success) {
        setAllocSuccess(true);
        fetchReadiness();
        setTimeout(() => setAllocSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Allocation error:', err.message);
    }
  };

  // Handle Shift Handover
  const handleShiftHandover = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/hrms/manufacturing/shift-handover', handoverNote);
      if (res.data?.success) {
        setHandoverSuccess(true);
        fetchReadiness();
        setTimeout(() => setHandoverSuccess(false), 3500);
      }
    } catch (err) {
      console.error('Handover failed:', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Clear Explanation Header */}
      <div className="p-6 rounded-2xl bg-[#141d30]/80 border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <Factory className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <span>7.7 Factory Floor: Workers Shift Allocation & Handover</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage factory workers across production lines (Chemical Earthing Rods, Copper Bonding, Lathe) and log shift transitions.
              </p>
            </div>
          </div>
        </div>

        {/* What this submodule does (Clear Plain-Language Guide) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start space-x-2.5">
            <UserCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-200">1. Assign Workers to Line</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Assign specific workers (Rohan, Suresh, etc.) to factory Work Orders and machine stations.
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start space-x-2.5">
            <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-200">2. Absentee Risk Alert</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                If an assigned operator is absent today, system immediately alerts supervisor to reassign backup staff.
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start space-x-2.5">
            <ArrowRightLeft className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-200">3. Shift Handover Notes</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Morning shift supervisor records completed earthing batches & machine blockers for the next evening shift.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Card Status Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Lines</span>
            <Factory className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2">4 Factory Lines</div>
          <div className="text-[11px] text-slate-400 mt-1">Copper, Bonding, Lathe, QC</div>
        </div>

        <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Workforce Stationed</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-2">
            {readiness?.allocations?.length || 2} Operators
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Active on Work Orders</div>
        </div>

        <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Shift Change</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-blue-400 mt-2">Shift A &rarr; Shift B</div>
          <div className="text-[11px] text-slate-400 mt-1">02:00 PM Handover Window</div>
        </div>

        <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Absence Alert</span>
            <AlertOctagon className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400 mt-2">1 Alert</div>
          <div className="text-[11px] text-slate-400 mt-1">Operator absent on Line 1</div>
        </div>
      </div>

      {/* Staffing Risk Notification Banner */}
      {staffingRisks && staffingRisks.riskAlerts?.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2 text-xs">
          <div className="font-bold flex items-center space-x-2 text-amber-400">
            <AlertOctagon className="w-4 h-4" />
            <span>Factory Line Staffing Risk: Assigned Operator is Absent Today</span>
          </div>
          <div className="space-y-1.5">
            {staffingRisks.riskAlerts.map((risk, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs bg-slate-900/60 p-2.5 rounded-lg border border-slate-800"
              >
                <span>
                  Work Order <strong className="text-white">{risk.workOrderNumber}</strong> ({risk.lineName}): Operator{' '}
                  <strong className="text-rose-400">{risk.missingWorker}</strong> is absent today.
                </span>
                <span className="text-emerald-400 font-semibold mt-1 sm:mt-0 text-[11px] px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40">
                  {risk.recommendedAction}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Operator Allocation Form + Handover Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Panel 1: Assign Worker to Work Order / Station */}
        <div className="p-5 rounded-2xl bg-[#141d30]/70 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Assign Worker to Factory Work Order / Station</span>
          </h3>

          <form onSubmit={handleAllocate} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Select Employee / Operator</label>
                <select
                  value={allocForm.employeeId}
                  onChange={(e) => setAllocForm({ ...allocForm, employeeId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:border-cyan-500"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.employeeCode} - {emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Shift</label>
                <select
                  value={allocForm.shift}
                  onChange={(e) => setAllocForm({ ...allocForm, shift: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:border-cyan-500"
                >
                  <option value="SHIFT_A">Shift A (06:00 AM - 02:00 PM)</option>
                  <option value="SHIFT_B">Shift B (02:00 PM - 10:00 PM)</option>
                  <option value="SHIFT_NIGHT">Night Shift (10:00 PM - 06:00 AM)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Work Order #</label>
                <input
                  type="text"
                  value={allocForm.workOrderNumber}
                  onChange={(e) => setAllocForm({ ...allocForm, workOrderNumber: e.target.value })}
                  placeholder="e.g. WO-2026-003"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Assigned Station / Role</label>
                <input
                  type="text"
                  value={allocForm.role}
                  onChange={(e) => setAllocForm({ ...allocForm, role: e.target.value })}
                  placeholder="e.g. Lathe Operator / Lead"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Factory Line / Machine</label>
              <select
                value={allocForm.lineName}
                onChange={(e) => setAllocForm({ ...allocForm, lineName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:border-cyan-500"
              >
                <option value="Copper Bonding Line 1 (Earthing Rods)">Copper Bonding Line 1 (Earthing Rods)</option>
                <option value="Chemical Compound Mixture Station">Chemical Compound Mixture Station</option>
                <option value="Lathe & Metal Cutting Machine Line 2">Lathe & Metal Cutting Machine Line 2</option>
                <option value="Testing & Spark QC Bench">Testing & Spark QC Bench</option>
              </select>
            </div>

            {allocSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Worker successfully assigned to factory station!</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-cyan-600/30"
            >
              Assign Worker to Line
            </button>
          </form>

          {/* Currently Stationed Operators List */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Station Allocations
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {readiness?.allocations?.map((alloc) => (
                <div
                  key={alloc.id}
                  className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-200">
                      {alloc.workOrderNumber} — {alloc.lineName}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Operator: <span className="text-cyan-300 font-medium">{alloc.employeeName}</span> ({alloc.role}) | {alloc.shift}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    ACTIVE
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel 2: Shift Handover Logger */}
        <div className="p-5 rounded-2xl bg-[#141d30]/70 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
            <span>Shift Handover Log (Supervisor Transition)</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Incoming shift supervisor reads completed rod production, machine hold status, and unresolved blockers.
          </p>

          <form onSubmit={handleShiftHandover} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Outgoing Shift</label>
                <select
                  value={handoverNote.fromShift}
                  onChange={(e) => setHandoverNote({ ...handoverNote, fromShift: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:border-cyan-500"
                >
                  <option value="SHIFT_A">Shift A (Morning 06:00 - 14:00)</option>
                  <option value="SHIFT_B">Shift B (Evening 14:00 - 22:00)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Incoming Shift</label>
                <select
                  value={handoverNote.toShift}
                  onChange={(e) => setHandoverNote({ ...handoverNote, toShift: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:border-cyan-500"
                >
                  <option value="SHIFT_B">Shift B (Evening 14:00 - 22:00)</option>
                  <option value="SHIFT_NIGHT">Night Shift (22:00 - 06:00)</option>
                  <option value="SHIFT_A">Shift A (Morning 06:00 - 14:00)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Work Completed by Shift</label>
              <textarea
                rows="2"
                placeholder="e.g. 500 chemical earthing rods bonded and copper coated..."
                value={handoverNote.workCompletedSummary}
                onChange={(e) =>
                  setHandoverNote({ ...handoverNote, workCompletedSummary: e.target.value })
                }
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Pending Machine Blockers / Holds</label>
              <textarea
                rows="2"
                placeholder="e.g. Lathe Machine #2 belt slippage, copper strip inventory low..."
                value={handoverNote.pendingBlockers}
                onChange={(e) =>
                  setHandoverNote({ ...handoverNote, pendingBlockers: e.target.value })
                }
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {handoverSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Shift Handover successfully logged and signed off by supervisor!</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-cyan-600/30"
            >
              Sign & Save Handover Log
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
