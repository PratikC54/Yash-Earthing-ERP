import React, { useState, useEffect } from 'react';
import apiClient from '../../../services/api';
import {
  Banknote,
  AlertTriangle,
  ShieldAlert,
  FileCheck,
  CheckCircle,
  XCircle,
  RotateCcw,
  IndianRupee,
  FileSpreadsheet,
  Wallet,
  ShieldCheck,
  PlusCircle,
  User,
  MinusCircle,
  ArrowDownCircle,
  BadgeAlert,
} from 'lucide-react';

// Preset fine violation cases with predefined standard amounts
export const FINE_PRESET_CASES = [
  {
    category: 'SAFETY_VIOLATION_GOGGLES',
    label: 'Not wearing safety goggles / helmet',
    amount: 500,
    description: 'Violation of factory floor PPE safety regulations (Lathe/Bonding)',
  },
  {
    category: 'LATE_COMING',
    label: 'Late coming / Shift delay (>30 mins)',
    amount: 200,
    description: 'Unscheduled late arrival to factory shift',
  },
  {
    category: 'UNAUTHORIZED_ABSENCE',
    label: 'Unauthorized absence / Missing shift',
    amount: 1000,
    description: 'Absence without prior approval or intimation to supervisor',
  },
  {
    category: 'RAW_MATERIAL_DAMAGE',
    label: 'Material / Tool mishandling or wastage',
    amount: 1500,
    description: 'Damaged copper strips/rods or incorrect machine tooling scrap',
  },
  {
    category: 'FACTORY_RULES_INFRACTION',
    label: 'Smoking / Mobile phone use on production floor',
    amount: 300,
    description: 'Use of personal mobile device or smoking inside hazardous area',
  },
  {
    category: 'CUSTOM_FINE',
    label: 'Other disciplinary infraction (Custom amount)',
    amount: 0,
    description: 'Disciplinary penalty recorded by management',
  },
];

export default function PayrollManager() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [basicSalary, setBasicSalary] = useState('25000');
  const [payableDays, setPayableDays] = useState('30');
  const [payrollDraft, setPayrollDraft] = useState(null);
  const [finesList, setFinesList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  // Fine Add Modal / Form State
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [customFineAmount, setCustomFineAmount] = useState(FINE_PRESET_CASES[0].amount);
  const [fineRemarks, setFineRemarks] = useState(FINE_PRESET_CASES[0].description);
  const [isSubmittingFine, setIsSubmittingFine] = useState(false);

  // Fetch registered employees
  const fetchEmployees = async () => {
    try {
      const res = await apiClient.get('/hrms/employees');
      if (res.data?.success && res.data.data?.length > 0) {
        setEmployees(res.data.data);
        const first = res.data.data[0];
        setSelectedEmpId(String(first.id));
        setBasicSalary(String(first.salary || 25000));
      } else {
        // Fallback default list
        const defaults = [
          { id: 1, fullName: 'Rohan Patel', employeeCode: 'EMP-101', department: 'Production', salary: 32000 },
          { id: 2, fullName: 'Suresh Kumar', employeeCode: 'EMP-102', department: 'Labour Pool', salary: 18000 },
          { id: 3, fullName: 'Anjali Sharma', employeeCode: 'EMP-103', department: 'Quality Control', salary: 38000 },
          { id: 4, fullName: 'Rakesh', employeeCode: 'EMP-204', department: 'Management', salary: 45000 },
        ];
        setEmployees(defaults);
        setSelectedEmpId('1');
        setBasicSalary('32000');
      }
    } catch (err) {
      const defaults = [
        { id: 1, fullName: 'Rohan Patel', employeeCode: 'EMP-101', department: 'Production', salary: 32000 },
        { id: 2, fullName: 'Suresh Kumar', employeeCode: 'EMP-102', department: 'Labour Pool', salary: 18000 },
        { id: 3, fullName: 'Anjali Sharma', employeeCode: 'EMP-103', department: 'Quality Control', salary: 38000 },
        { id: 4, fullName: 'Rakesh', employeeCode: 'EMP-204', department: 'Management', salary: 45000 },
      ];
      setEmployees(defaults);
      setSelectedEmpId('1');
      setBasicSalary('32000');
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // When selected employee changes, update salary and fetch their fines & payroll
  const handleSelectEmployee = (empId) => {
    setSelectedEmpId(empId);
    const found = employees.find((e) => String(e.id) === String(empId));
    if (found && found.salary) {
      setBasicSalary(String(found.salary));
    }
  };

  // Fetch fines for currently selected employee
  const fetchFines = async (empId = selectedEmpId) => {
    if (!empId) return;
    try {
      const res = await apiClient.get('/hrms/payroll/fines', {
        params: { employeeId: Number(empId) },
      });
      if (res.data?.success) {
        setFinesList(res.data.data);
      }
    } catch (err) {
      console.warn('Fines fetch failed:', err.message);
    }
  };

  // Calculate payroll and net salary after deductions
  const handleCalculatePayroll = async (empId = selectedEmpId, salary = basicSalary, days = payableDays) => {
    if (!empId) return;
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const res = await apiClient.post('/hrms/payroll/generate', {
        employeeId: Number(empId),
        basicSalary: Number(salary),
        payableDays: Number(days),
      });
      if (res.data?.success) {
        setPayrollDraft(res.data.data);
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.message || err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEmpId) {
      fetchFines(selectedEmpId);
      handleCalculatePayroll(selectedEmpId, basicSalary, payableDays);
    }
  }, [selectedEmpId, basicSalary, payableDays]);

  // When fine preset dropdown changes
  const handleCaseChange = (idx) => {
    setSelectedCaseIdx(idx);
    const preset = FINE_PRESET_CASES[idx];
    setCustomFineAmount(preset.amount);
    setFineRemarks(preset.description);
  };

  // Submit and apply fine against employee
  const handleApplyFine = async (e) => {
    e.preventDefault();
    if (!selectedEmpId) return;
    setIsSubmittingFine(true);
    setStatusMsg(null);

    const preset = FINE_PRESET_CASES[selectedCaseIdx];
    try {
      const res = await apiClient.post('/hrms/payroll/fines', {
        employeeId: Number(selectedEmpId),
        category: preset.category,
        amount: Number(customFineAmount),
        description: fineRemarks || preset.label,
        approved: true, // Directly approved so it deducts immediately from salary
      });

      if (res.data?.success) {
        setStatusMsg({
          type: 'success',
          text: `Fine of ₹${customFineAmount} applied successfully! Net salary updated.`,
        });
        // Refresh fines list and recalculate payroll with new deduction
        await fetchFines(selectedEmpId);
        await handleCalculatePayroll(selectedEmpId, basicSalary, payableDays);
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.message || err.message });
    } finally {
      setIsSubmittingFine(false);
    }
  };

  // Fine Action: Dispute / Approve / Reverse
  const handleFineAction = async (fineId, action) => {
    try {
      const res = await apiClient.patch(`/hrms/payroll/fines/${fineId}/status`, {
        action,
        reason: action === 'DISPUTE' ? 'Employee disputing incident' : 'Supervisor resolution',
      });
      if (res.data?.success) {
        setStatusMsg({ type: 'success', text: `Fine status updated: ${action}` });
        await fetchFines(selectedEmpId);
        await handleCalculatePayroll(selectedEmpId, basicSalary, payableDays);
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.message || err.message });
    }
  };

  const currentEmployee = employees.find((e) => String(e.id) === String(selectedEmpId));
  const approvedDeductionsTotal = finesList
    .filter((f) => f.status === 'APPROVED')
    .reduce((sum, f) => sum + (Number(f.approvedAmount || f.amount) || 0), 0);
  const disputedFinesCount = finesList.filter((f) => f.status === 'DISPUTED').length;

  return (
    <div className="space-y-6">
      {/* Employee Selector Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-[#141d30]/60 border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <Banknote className="w-5 h-5 text-emerald-400" />
            <span>7.6 Employee Payroll & Fine Deductions Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Select any employee to view their assigned salary, apply standard fine cases with deductions, and track net pay.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Employee Dropdown */}
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Select Employee</label>
            <select
              value={selectedEmpId}
              onChange={(e) => handleSelectEmployee(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:border-emerald-500 min-w-48 font-medium"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.employeeCode} - {emp.department})
                </option>
              ))}
            </select>
          </div>

          {/* Assigned Basic Salary */}
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Assigned Salary (₹)</label>
            <input
              type="number"
              value={basicSalary}
              onChange={(e) => setBasicSalary(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 w-32 focus:outline-none focus:border-emerald-500 font-bold text-emerald-400"
            />
          </div>

          {/* Payable Days */}
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Payable Days</label>
            <input
              type="number"
              value={payableDays}
              onChange={(e) => setPayableDays(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 w-24 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-col justify-end">
            <button
              onClick={() => handleCalculatePayroll(selectedEmpId, basicSalary, payableDays)}
              disabled={isLoading}
              className="px-4 py-2 mt-auto bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-lg shadow-emerald-600/30"
            >
              {isLoading ? 'Recalculating...' : 'Refresh Payroll'}
            </button>
          </div>
        </div>
      </div>

      {/* Selected Employee Quick Overview Badge */}
      {currentEmployee && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900/40 to-[#141d30] border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600/30 border border-emerald-400 flex items-center justify-center text-sm font-bold text-emerald-300">
              {currentEmployee.fullName?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-slate-100 font-bold text-sm flex items-center space-x-2">
                <span>{currentEmployee.fullName}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {currentEmployee.employeeCode}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-900/50 text-emerald-300 border border-emerald-600/30">
                  {currentEmployee.department}
                </span>
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                Designation: <span className="text-slate-200">{currentEmployee.designation || 'Staff'}</span> | Employment: <span className="text-slate-200">{currentEmployee.employmentType || 'Full-Time'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-right">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Assigned Base Salary</div>
              <div className="text-lg font-bold text-white">₹{Number(basicSalary).toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Approved Fines</div>
              <div className="text-lg font-bold text-rose-400">-₹{approvedDeductionsTotal.toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Net Payable Salary</div>
              <div className="text-xl font-extrabold text-emerald-400">
                ₹{Math.max(0, Number(basicSalary) - approvedDeductionsTotal).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Base Salary</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2">₹{Number(basicSalary).toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-400 mt-1">Monthly Gross Rate</div>
        </div>

        <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Payable Days</span>
            <FileSpreadsheet className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-blue-400 mt-2">{payableDays} / 30 Days</div>
          <div className="text-[11px] text-slate-400 mt-1">Attendance Reconciled</div>
        </div>

        <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Deductions</span>
            <ArrowDownCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-400 mt-2">₹{approvedDeductionsTotal}</div>
          <div className="text-[11px] text-slate-400 mt-1">Deducted from Salary</div>
        </div>

        <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Net Take-Home Pay</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-2">
            ₹{Math.max(0, Number(basicSalary) - approvedDeductionsTotal).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Post Fine Deductions</div>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded-xl border text-xs ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Main Row: Apply Fine Case Panel & Breakdown Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Fine Case Selection Form */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[#141d30]/70 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-rose-400">
            <BadgeAlert className="w-5 h-5" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Apply Fine Against {currentEmployee?.fullName || 'Employee'}
            </h3>
          </div>
          <p className="text-[11px] text-slate-400">
            Choose violation case from preset rules with predefined deduction amounts, or enter a custom amount.
          </p>

          <form onSubmit={handleApplyFine} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Violation Case & Predefined Penalty
              </label>
              <select
                value={selectedCaseIdx}
                onChange={(e) => handleCaseChange(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 cursor-pointer focus:outline-none focus:border-rose-500"
              >
                {FINE_PRESET_CASES.map((preset, idx) => (
                  <option key={preset.category} value={idx}>
                    {preset.label} {preset.amount > 0 ? `(₹${preset.amount})` : '(Custom)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Deduction Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={customFineAmount}
                    onChange={(e) => setCustomFineAmount(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 text-rose-400 font-bold text-xs rounded-xl pl-7 pr-3 py-2.5 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Impact on Salary
                </label>
                <div className="w-full bg-rose-950/30 border border-rose-800/40 rounded-xl px-3 py-2 text-xs text-rose-300 font-semibold flex items-center justify-between">
                  <span>Deduction:</span>
                  <span>-₹{Number(customFineAmount || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Incident Description / Remarks
              </label>
              <textarea
                rows="2"
                value={fineRemarks}
                onChange={(e) => setFineRemarks(e.target.value)}
                placeholder="Details of the violation incident..."
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 focus:outline-none focus:border-rose-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingFine || !customFineAmount || customFineAmount <= 0}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-rose-600/30 flex items-center justify-center space-x-2"
            >
              <MinusCircle className="w-4 h-4" />
              <span>{isSubmittingFine ? 'Applying Fine...' : `Apply Fine & Deduct ₹${customFineAmount}`}</span>
            </button>
          </form>
        </div>

        {/* Fines History Table for Selected Employee */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-[#141d30]/70 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Fines & Deductions History ({currentEmployee?.fullName})</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              Active Records: {finesList.length}
            </span>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {finesList.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                No fines or deductions recorded for this employee.
              </div>
            ) : (
              finesList.map((f) => (
                <div
                  key={f.id}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs hover:border-slate-700 transition"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-200 flex items-center space-x-2">
                      <span>{f.description}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          f.status === 'APPROVED'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : f.status === 'DISPUTED'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {f.status === 'APPROVED' ? 'DEDUCTED' : f.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Date: {f.incidentDate} | Penalty Amount:{' '}
                      <strong className="text-rose-400">₹{f.amount}</strong>
                      {f.approvedBy && <span className="text-slate-400 ml-2">(By {f.approvedBy})</span>}
                      {f.disputeReason && (
                        <div className="text-amber-400 text-[10px] mt-0.5">Dispute: {f.disputeReason}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {f.status === 'REPORTED' && (
                      <button
                        onClick={() => handleFineAction(f.id, 'DISPUTE')}
                        className="px-2.5 py-1 bg-amber-600/30 hover:bg-amber-600 text-amber-300 hover:text-white rounded-lg transition text-[11px]"
                      >
                        Dispute
                      </button>
                    )}
                    {f.status !== 'APPROVED' && (
                      <button
                        onClick={() => handleFineAction(f.id, 'APPROVE')}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition text-[11px] font-semibold"
                      >
                        Approve & Deduct
                      </button>
                    )}
                    {f.status === 'APPROVED' && (
                      <button
                        onClick={() => handleFineAction(f.id, 'REVERSE')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition text-[11px]"
                      >
                        Reverse
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
