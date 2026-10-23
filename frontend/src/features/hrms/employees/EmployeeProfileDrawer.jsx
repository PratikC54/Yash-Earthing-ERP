import React from 'react';
import {
  X,
  Building,
  Briefcase,
  Calendar,
  CreditCard,
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
  HardHat,
  BadgeCheck,
  Shield,
} from 'lucide-react';

export default function EmployeeProfileDrawer({
  isOpen,
  onClose,
  employee,
}) {
  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity">
      <div className="w-full max-w-md bg-[#141d30] border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-800 bg-[#0d1424] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-900/40">
              {employee.fullName?.slice(0, 2) || 'EM'}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{employee.fullName}</h3>
              <div className="text-xs font-mono text-cyan-400 mt-0.5">
                {employee.employeeCode}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          {/* Status Badge & Employment Category */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0d1424] border border-slate-800">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Current Status
              </span>
              <div className="mt-1 flex items-center space-x-1.5 font-semibold">
                {employee.isActive ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Active Workforce Member</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span className="text-rose-400">Deactivated (Historical Record)</span>
                  </>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Type
              </span>
              <span className="mt-1 inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {employee.employmentType || 'Full-Time'}
              </span>
            </div>
          </div>

          {/* Core Assignment */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
              Department & Position
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#0d1424] border border-slate-800/80">
                <div className="flex items-center space-x-2 text-slate-400 mb-1">
                  <Building className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[10px] uppercase">Department</span>
                </div>
                <div className="font-semibold text-white">
                  {employee.department || 'Not Assigned'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0d1424] border border-slate-800/80">
                <div className="flex items-center space-x-2 text-slate-400 mb-1">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[10px] uppercase">Designation</span>
                </div>
                <div className="font-semibold text-white">
                  {employee.designation || 'Staff'}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
              Contact Information
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#0d1424] border border-slate-800/80">
                <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Phone Number</span>
                <div className="font-semibold text-cyan-400 font-mono text-xs">
                  {employee.phone || employee.user?.phone || 'Not provided'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#0d1424] border border-slate-800/80">
                <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Email Address</span>
                <div className="font-medium text-slate-200 text-xs truncate" title={employee.email || employee.user?.email || 'N/A'}>
                  {employee.email || employee.user?.email || 'No email registered'}
                </div>
              </div>
            </div>
          </div>

          {/* Compensation & Salary */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
              Compensation & Pay
            </h4>
            <div className="p-3.5 rounded-xl bg-[#0d1424] border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Base Assigned Salary</span>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                  {employee.salary ? `₹${Number(employee.salary).toLocaleString('en-IN')}` : 'Not assigned'}
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                {employee.employmentType || 'Regular'} Rate
              </span>
            </div>
          </div>

          {/* Account & Login Linkage */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
              System Account Linkage
            </h4>
            <div className="p-3.5 rounded-xl bg-[#0d1424] border border-slate-800">
              {employee.user ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                    <BadgeCheck className="w-4 h-4" />
                    <span>Linked to ERP Login Account</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <div>
                      Email: <span className="text-white">{employee.user.email}</span>
                    </div>
                    <div>
                      Role: <span className="text-cyan-400 font-mono">{employee.user.role}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-slate-400">
                  <HardHat className="w-4 h-4 text-amber-500" />
                  <span>
                    No individual login account required. This worker is managed via Supervisor
                    Rosters.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Attendance History Summary */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider flex items-center justify-between">
              <span>Recent Attendance Activity</span>
              <span className="text-blue-400 lowercase font-normal">
                {employee.recentAttendanceCount || 0} logged days
              </span>
            </h4>
            {employee.attendanceHistory && employee.attendanceHistory.length > 0 ? (
              <div className="space-y-1.5">
                {employee.attendanceHistory.map((att) => (
                  <div
                    key={att.id}
                    className="p-2.5 rounded-lg bg-[#0d1424] border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(att.workDate).toLocaleDateString()}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        att.status === 'Present'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {att.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#0d1424] border border-slate-800 text-center text-slate-500">
                No recent attendance events recorded.
              </div>
            )}
          </div>

          {/* Date of Joining */}
          <div className="flex items-center space-x-2 text-slate-400 pt-2 border-t border-slate-800 text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>
              Joining Date:{' '}
              {employee.dateOfJoining
                ? new Date(employee.dateOfJoining).toLocaleDateString()
                : 'Not recorded'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
