import KpiSection from "../../../components/common/KpiSection";
import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Building,
  Shield,
  Briefcase,
  Eye,
  Edit2,
  UserX,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  HardHat,
  BadgeCheck,
  UserCheck,
  UserMinus,
  BriefcaseBusiness,
} from 'lucide-react';

export default function EmployeeDirectory({
  employees = [],
  departments = [],
  selectedDepartment = 'ALL',
  onSelectDepartment,
  searchQuery,
  onSearchChange,
  employmentTypeFilter,
  onEmploymentTypeChange,
  activeStatusFilter,
  onActiveStatusChange,
  onViewEmployee,
  onEditEmployee,
  onDeactivateEmployee,
  onOpenCreateModal,
  pagination = { page: 1, limit: 10, total: 0, totalPages: 1 },
  onPageChange,
  isLoading = false,
}) {
  const activeCount = employees.filter((e) => e.isActive).length;
  const staffCount = employees.filter((e) => e.employmentType === 'Full-Time').length;
  const labourCount = employees.filter((e) => e.employmentType !== 'Full-Time').length;

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#141d30] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                7.1 Workforce & Employee Directory
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage full-time staff, factory workers, supervisors, and contract labour rosters
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition active:scale-95 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Worker / Employee</span>
        </button>
      </div>

      {/* High-level KPI Matrix Cards */}
      <KpiSection title="Workforce & Headcount KPIs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800 flex items-center space-x-3 shadow-lg">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Workforce
            </div>
            <div className="text-xl font-extrabold text-white mt-0.5">
              {pagination.total || employees.length}
            </div>
          </div>
        </div>

        <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800 flex items-center space-x-3 shadow-lg">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Active Members
            </div>
            <div className="text-xl font-extrabold text-emerald-400 mt-0.5">
              {activeCount}
            </div>
          </div>
        </div>

        <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800 flex items-center space-x-3 shadow-lg">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BriefcaseBusiness className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Full-Time Staff
            </div>
            <div className="text-xl font-extrabold text-indigo-300 mt-0.5">
              {staffCount}
            </div>
          </div>
        </div>

        <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800 flex items-center space-x-3 shadow-lg">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <HardHat className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Factory Labour
            </div>
            <div className="text-xl font-extrabold text-amber-300 mt-0.5">
              {labourCount}
            </div>
          </div>
        </div>
        </div>
      </KpiSection>

      {/* Department Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
        <button
          onClick={() => onSelectDepartment('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${
            selectedDepartment === 'ALL'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-[#141d30] text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          All Departments ({pagination.total || employees.length})
        </button>
        {Array.from(new Set([...departments, ...employees.map((e) => e.department).filter(Boolean)]))
          .sort()
          .map((dept) => (
            <button
              key={dept}
              onClick={() => onSelectDepartment(dept)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${
                selectedDepartment === dept
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-[#141d30] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {dept}
            </button>
          ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by code, name, designation, or department..."
            className="w-full bg-[#0d1424] text-xs text-slate-200 placeholder-slate-500 pl-9 pr-4 py-2.5 rounded-lg border border-slate-750 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Employment Type Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={employmentTypeFilter}
            onChange={(e) => onEmploymentTypeChange(e.target.value)}
            className="bg-[#0d1424] text-xs text-slate-300 border border-slate-750 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Employment Types</option>
            <option value="Full-Time">Full-Time (Office/Staff)</option>
            <option value="Contract">Contract</option>
            <option value="Daily-Wage">Daily-Wage (Labour)</option>
            <option value="Labour">Direct Labour</option>
          </select>

          {/* Active / Inactive Filter */}
          <select
            value={activeStatusFilter}
            onChange={(e) => onActiveStatusChange(e.target.value)}
            className="bg-[#0d1424] text-xs text-slate-300 border border-slate-750 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Deactivated (Archived)</option>
          </select>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-[#141d30] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0d1424] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-semibold whitespace-nowrap">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Employee Name</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Base Salary</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-normal">
              {isLoading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading workforce directory...</span>
                    </div>
                  </td>
                </tr>
              ) : employees.length > 0 ? (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-300 whitespace-nowrap">
                      {emp.employeeCode}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-white">{emp.fullName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">ID: #{emp.id}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-slate-300">
                        {emp.email || emp.user?.email || <span className="text-slate-600">—</span>}
                      </div>
                      <div className="text-[11px] text-cyan-400 font-mono">
                        {emp.phone || emp.user?.phone || 'No phone'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      {emp.department || 'General'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {emp.designation || 'Staff'}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-400 whitespace-nowrap">
                      {emp.salary ? `₹${Number(emp.salary).toLocaleString('en-IN')}` : <span className="text-slate-500">—</span>}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {emp.employmentType}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {emp.isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3 shrink-0" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 inline-flex items-center space-x-1">
                          <XCircle className="w-3 h-3 shrink-0" />
                          <span>Deactivated</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center space-x-1.5">
                        <button
                          onClick={() => onViewEmployee(emp)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                          title="View Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditEmployee(emp)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition cursor-pointer"
                          title="Edit Record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {emp.isActive && (
                          <button
                            onClick={() => onDeactivateEmployee(emp)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition cursor-pointer"
                            title="Deactivate Worker"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-500">
                    No workforce members match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-[#0d1424] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </div>
            <div className="flex space-x-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => onPageChange(pagination.page - 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition cursor-pointer flex items-center space-x-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => onPageChange(pagination.page + 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition cursor-pointer flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
