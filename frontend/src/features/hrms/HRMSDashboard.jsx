import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/api';
import EmployeeDirectory from './employees/EmployeeDirectory';
import EmployeeModal from './employees/EmployeeModal';
import EmployeeProfileDrawer from './employees/EmployeeProfileDrawer';
import AttendanceManager from './attendance/AttendanceManager';
import TaskManager from './tasks/TaskManager';
import PerformanceManager from './performance/PerformanceManager';
import PayrollManager from './payroll/PayrollManager';
import ManufacturingIntegration from './manufacturing/ManufacturingIntegration';
import { AlertTriangle } from 'lucide-react';

export default function HRMSDashboard({ initialTab = 'employees' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync active view directly when selected from sidebar navigation
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Employee State
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([
    'Production',
    'Quality Control',
    'Sales',
    'Procurement',
    'Labour Pool',
  ]);
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('ALL');
  const [activeStatusFilter, setActiveStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Modal / Drawer state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Fetch Departments from backend
  const fetchDepartments = useCallback(async () => {
    try {
      const res = await apiClient.get('/hrms/employees/departments');
      if (res.data?.success && res.data.data?.length > 0) {
        setDepartments(res.data.data);
      }
    } catch (err) {
      console.warn('Departments fetch warning:', err.message);
    }
  }, []);

  // Fetch Employees
  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        department: selectedDepartment !== 'ALL' ? selectedDepartment : undefined,
        employmentType: employmentTypeFilter !== 'ALL' ? employmentTypeFilter : undefined,
        isActive: activeStatusFilter !== '' ? activeStatusFilter : undefined,
        search: searchQuery || undefined,
      };

      const res = await apiClient.get('/hrms/employees', { params });
      if (res.data?.success) {
        setEmployees(res.data.data);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      console.warn('Employees fetch warning:', err.message);
      setApiError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    selectedDepartment,
    employmentTypeFilter,
    activeStatusFilter,
    searchQuery,
  ]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    if (activeTab === 'employees') {
      fetchEmployees();
    }
  }, [fetchEmployees, activeTab]);

  // Handlers
  const handleCreateEmployee = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleEditEmployee = (emp) => {
    setEditingEmployee(emp);
    setIsModalOpen(true);
  };

  const handleViewEmployee = (emp) => {
    setViewingEmployee(emp);
    setIsProfileOpen(true);
  };

  const handleSaveEmployee = async (formData) => {
    try {
      if (editingEmployee) {
        await apiClient.put(`/hrms/employees/${editingEmployee.id}`, formData);
      } else {
        await apiClient.post('/hrms/employees', formData);
      }
      setIsModalOpen(false);
      fetchEmployees();
      fetchDepartments();
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message);
    }
  };

  const handleDeactivateEmployee = async (emp) => {
    if (window.confirm(`Are you sure you want to deactivate employee ${emp.fullName}? Historical records will be preserved.`)) {
      try {
        await apiClient.delete(`/hrms/employees/${emp.id}`, {
          data: { reason: 'Deactivated from HRMS Directory' },
        });
        fetchEmployees();
      } catch (err) {
        alert(err.response?.data?.message || err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Backend Status Notice if PostgreSQL is offline */}
      {apiError && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-start space-x-3 text-xs">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
          <div>
            <div className="font-semibold text-amber-200">Database Connection Notice</div>
            <p className="mt-0.5 text-amber-300/80">
              The backend API is running on port 5000. When PostgreSQL is connected, employee records and updates synchronize live.
            </p>
          </div>
        </div>
      )}

      {/* Submodule Views - Driven Exclusively by Left Sidebar */}
      {activeTab === 'employees' && (
        <EmployeeDirectory
          employees={employees}
          departments={departments}
          selectedDepartment={selectedDepartment}
          onSelectDepartment={(dept) => {
            setSelectedDepartment(dept);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          employmentTypeFilter={employmentTypeFilter}
          onEmploymentTypeChange={(t) => {
            setEmploymentTypeFilter(t);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          activeStatusFilter={activeStatusFilter}
          onActiveStatusChange={(s) => {
            setActiveStatusFilter(s);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          onViewEmployee={handleViewEmployee}
          onEditEmployee={handleEditEmployee}
          onDeactivateEmployee={handleDeactivateEmployee}
          onOpenCreateModal={handleCreateEmployee}
          pagination={pagination}
          onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
          isLoading={isLoading}
        />
      )}

      {activeTab === 'attendance' && <AttendanceManager />}
      {activeTab === 'tasks' && <TaskManager />}
      {activeTab === 'performance' && <PerformanceManager />}
      {activeTab === 'payroll' && <PayrollManager />}
      {activeTab === 'manufacturing' && <ManufacturingIntegration />}

      {/* Modals & Drawers */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEmployee}
        employee={editingEmployee}
        departments={departments}
      />

      <EmployeeProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        employee={viewingEmployee}
      />
    </div>
  );
}
