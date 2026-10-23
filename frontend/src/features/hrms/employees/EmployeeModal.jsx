import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, UserCheck } from 'lucide-react';

export default function EmployeeModal({
  isOpen,
  onClose,
  onSave,
  employee = null,
  departments = [],
}) {
  const [formData, setFormData] = useState({
    employeeCode: '',
    fullName: '',
    department: 'Production',
    designation: '',
    employmentType: 'Full-Time',
    dateOfJoining: '',
    salary: '',
    phone: '',
    email: '',
    userId: '',
    isActive: true,
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        employeeCode: employee.employeeCode || '',
        fullName: employee.fullName || '',
        department: employee.department || 'Production',
        designation: employee.designation || '',
        employmentType: employee.employmentType || 'Full-Time',
        dateOfJoining: employee.dateOfJoining ? employee.dateOfJoining.slice(0, 10) : '',
        salary: employee.salary !== null && employee.salary !== undefined ? employee.salary : '',
        phone: employee.phone || employee.user?.phone || '',
        email: employee.email || employee.user?.email || '',
        userId: employee.userId || '',
        isActive: employee.isActive ?? true,
      });
    } else {
      // Default for new worker
      const randomCode = `EMP-${Math.floor(100 + Math.random() * 900)}`;
      setFormData({
        employeeCode: randomCode,
        fullName: '',
        department: departments[0] || 'Production',
        designation: '',
        employmentType: 'Full-Time',
        dateOfJoining: new Date().toISOString().slice(0, 10),
        salary: '',
        phone: '',
        email: '',
        userId: '',
        isActive: true,
      });
    }
    setError('');
  }, [employee, isOpen, departments]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.employeeCode.trim()) {
      setError('Employee Code and Full Name are required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSave({
        ...formData,
        userId: formData.userId ? Number(formData.userId) : null,
        salary: formData.salary !== '' ? Number(formData.salary) : null,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save workforce record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-[#141d30] border border-slate-750 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0d1424]">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">
              {employee ? 'Edit Workforce Member' : 'Register New Workforce Member'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Employee / Worker Code *
              </label>
              <input
                type="text"
                required
                disabled={Boolean(employee)}
                value={formData.employeeCode}
                onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                className="w-full bg-[#0d1424] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                placeholder="e.g. EMP-105 or LBR-020"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full bg-[#0d1424] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="Worker full name"
              />
            </div>
          </div>

          {/* Contact Details (Phone & Email) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-[#0d1424] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g. +91 9876543210"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#0d1424] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g. worker@yashgroup.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full bg-[#0d1424] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="Production">Production / Factory</option>
                <option value="Sales">Sales</option>
                <option value="Quality & Metrology">Quality & Metrology</option>
                <option value="Installation">Installation & Field</option>
                <option value="Procurement">Procurement</option>
                <option value="Engineering">Engineering / BOM</option>
                <option value="Management">Management</option>
                <option value="Labour Workforce">Labour / Contract Workforce</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Designation</label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full bg-[#0d1424] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g. Line Operator, Supervisor, Welder"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Employment Type</label>
              <select
                value={formData.employmentType}
                onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                className="w-full bg-[#0d1424] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="Full-Time">Full-Time (Staff/Engineer)</option>
                <option value="Contract">Contract (Fixed Term)</option>
                <option value="Daily-Wage">Daily-Wage (Labour)</option>
                <option value="Labour">Direct Labour</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Joining Date</label>
              <input
                type="date"
                value={formData.dateOfJoining}
                onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
                className="w-full bg-[#0d1424] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* User Account Linking (Optional for Office/Supervisors, Blank for Labour) */}
          <div className="p-3 rounded-xl bg-[#0d1424] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">ERP User Account Link</span>
              <span className="text-[10px] text-cyan-400 font-medium">Leave blank for non-login workers</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Contract labour and factory workers who do not require ERP login should leave this empty.
            </p>
            <input
              type="number"
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              placeholder="Existing User ID (optional)"
              className="w-full bg-[#141d30] border border-slate-750 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
            />
          </div>

          {/* Base Salary / Pay Structure */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Base Pay Rate (₹ / Period)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              className="w-full bg-[#0d1424] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g. 45000 (Monthly) or 800 (Daily Rate)"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/30 transition disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Member'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
