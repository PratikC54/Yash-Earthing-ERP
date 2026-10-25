import React, { useState, useEffect } from 'react';
import { module5Api } from '../api/module5Api';
import { CyberCard, CyberButton, CyberInput, CyberSelect, StatusBadge } from '../components/CyberUI';
import {
  FolderKanban,
  Plus,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  Layers,
  ChevronRight,
  X,
  Package,
} from 'lucide-react';

export default function ProjectRegisterPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // New Project Form State
  const [formData, setFormData] = useState({
    name: '',
    salesOrderId: '',
    customerId: '',
    siteName: '',
    siteAddressText: '',
  });

  // New Task Form State
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
  });

  useEffect(() => {
    loadProjects();
  }, [search, statusFilter]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await module5Api.getProjects({ search, status: statusFilter });
      const list = res?.projects || res?.data || (Array.isArray(res) ? res : []);
      setProjects(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load projects', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = async (id) => {
    try {
      const res = await module5Api.getProjectById(id);
      setSelectedProject(res.data);
      setIsDetailOpen(true);
    } catch (err) {
      console.error('Failed to load project details', err);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await module5Api.createProject({
        name: formData.name,
        salesOrderId: Number(formData.salesOrderId),
        customerId: Number(formData.customerId),
        siteName: formData.siteName,
        siteAddress: { address: formData.siteAddressText },
      });
      setIsNewProjectModalOpen(false);
      setFormData({ name: '', salesOrderId: '', customerId: '', siteName: '', siteAddressText: '' });
      loadProjects();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create project');
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      await module5Api.addTask(selectedProject.id, taskData);
      setTaskData({ title: '', description: '', priority: 'MEDIUM' });
      // Refresh details
      const res = await module5Api.getProjectById(selectedProject.id);
      setSelectedProject(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add task');
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    if (!selectedProject) return;
    try {
      await module5Api.updateTaskStatus(selectedProject.id, taskId, newStatus);
      const res = await module5Api.getProjectById(selectedProject.id);
      setSelectedProject(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1e2a4a]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-cyan-400" />
            M5.1 Project Register
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track earthing site projects, BOM material availability vs Inventory, and site task execution.
          </p>
        </div>
        <CyberButton onClick={() => setIsNewProjectModalOpen(true)}>
          <Plus className="w-4 h-4" /> Create Project
        </CyberButton>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by project code, project name, or site..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#0a1020] border border-[#1e2a4a] rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#0a1020] border border-[#1e2a4a] rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">DRAFT</option>
          <option value="SURVEY_PENDING">SURVEY PENDING</option>
          <option value="PLANNED">PLANNED</option>
          <option value="IN_PROGRESS">IN PROGRESS</option>
          <option value="COMPLETED">COMPLETED</option>
        </select>
      </div>

      {/* Projects Table */}
      <div className="bg-[#10182f] border border-[#1e2a4a] rounded-lg overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#0b1329] border-b border-[#1e2a4a] text-xs uppercase font-medium text-slate-400">
              <tr>
                <th className="py-3 px-4">Project Code</th>
                <th className="py-3 px-4">Project Name</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Site Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Installations</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a4a]">
              {loading ? (
                Array.from({ length: 5 }).map((_, rIdx) => (
                  <tr key={`skel-proj-${rIdx}`} className="animate-pulse">
                    <td className="py-3 px-4"><div className="h-4 w-20 bg-slate-200/80 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-36 bg-slate-200/80 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-28 bg-slate-200/60 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-32 bg-slate-200/60 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-16 bg-slate-200/70 rounded-full" /></td>
                    <td className="py-3 px-4 text-center"><div className="h-4 w-10 bg-slate-200/60 rounded mx-auto" /></td>
                    <td className="py-3 px-4 text-right"><div className="h-4 w-12 bg-slate-200/60 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : (!projects || projects.length === 0) ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    No projects found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                (projects || []).map((proj) => (
                  <tr
                    key={proj.id}
                    onClick={() => handleSelectProject(proj.id)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-cyan-400 font-medium">
                      {proj.projectCode}
                    </td>
                    <td className="py-3 px-4 font-medium text-white">{proj.name}</td>
                    <td className="py-3 px-4 text-slate-300">
                      {proj.customer?.name || `Customer #${proj.customerId}`}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{proj.siteName || '—'}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={proj.status} />
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {proj.installations?.length || 0}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectProject(proj.id);
                        }}
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center justify-end gap-1 font-medium ml-auto"
                      >
                        Details <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project Details Modal / Drawer */}
      {isDetailOpen && selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/70 flex justify-end">
          <div className="w-full max-w-2xl bg-[#10182f] border-l border-[#1e2a4a] h-full overflow-y-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#1e2a4a]">
              <div>
                <span className="font-mono text-xs text-cyan-400 block font-semibold">
                  {selectedProject.projectCode}
                </span>
                <h2 className="text-xl font-bold text-white mt-1">{selectedProject.name}</h2>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* General Info */}
            <div className="grid grid-cols-2 gap-4 text-sm bg-[#0a1020] p-4 rounded-lg border border-[#1e2a4a]">
              <div>
                <span className="text-xs text-slate-400 block">Customer</span>
                <span className="text-white font-medium">
                  {selectedProject.customer?.name || `ID: ${selectedProject.customerId}`}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Status</span>
                <StatusBadge status={selectedProject.status} />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Sales Order</span>
                <span className="font-mono text-cyan-400">
                  {selectedProject.salesOrder?.orderNumber || `SO #${selectedProject.salesOrderId}`}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Site Location</span>
                <span className="text-slate-300">{selectedProject.siteName || 'Not specified'}</span>
              </div>
            </div>

            {/* Material Requirement Check vs Inventory */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
                <Package className="w-4 h-4 text-cyan-400" />
                Material Stock Availability (BOM vs Inventory)
              </h3>
              <div className="bg-[#0a1020] border border-[#1e2a4a] rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#0b1329] border-b border-[#1e2a4a] text-slate-400 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Item / Product</th>
                      <th className="py-2.5 px-3 text-right">Required</th>
                      <th className="py-2.5 px-3 text-right">Available</th>
                      <th className="py-2.5 px-3 text-right">Shortage</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2a4a]">
                    {(selectedProject.materialCheck || selectedProject.materialRequirements)?.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-3 px-3 text-center text-slate-500">
                          No line items attached to this sales order.
                        </td>
                      </tr>
                    ) : (
                      (selectedProject.materialCheck || selectedProject.materialRequirements)?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3 font-medium text-white">{item.name || item.productName}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{item.requiredQuantity}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-cyan-400">
                            {item.availableStock}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-rose-400">
                            {item.shortageQuantity > 0 ? item.shortageQuantity : '0'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {item.status === 'SHORTAGE' || item.isShortage ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-950 text-rose-400 border border-rose-800">
                                SHORTAGE
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                                AVAILABLE
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tasks / Work Breakdown Structure */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
                <span>Site Execution Tasks</span>
                <span className="text-xs font-mono text-cyan-400">
                  {selectedProject.tasks?.length || 0} tasks
                </span>
              </h3>

              {/* Task List */}
              <div className="space-y-2 mb-4">
                {selectedProject.tasks?.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-500 bg-[#0a1020] rounded border border-[#1e2a4a]">
                    No tasks added yet. Add a work item below.
                  </div>
                ) : (
                  selectedProject.tasks?.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-[#0a1020] border border-[#1e2a4a] rounded flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white block">{task.title}</span>
                        {task.description && (
                          <span className="text-slate-400 block mt-0.5">{task.description}</span>
                        )}
                        <span className="text-[10px] text-cyan-400 font-mono mt-1 inline-block">
                          Priority: {task.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={task.status} />
                        {task.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleTaskStatusChange(task.id, 'COMPLETED')}
                            className="text-emerald-400 hover:text-emerald-300 p-1 rounded hover:bg-slate-800"
                            title="Mark as Completed"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Task Form */}
              <form onSubmit={handleAddTask} className="p-3 bg-[#0a1020] border border-[#1e2a4a] rounded-lg space-y-3">
                <span className="text-xs font-semibold text-cyan-400 block">Add Milestone Task</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Task Title (e.g. Earth pit excavation)"
                    value={taskData.title}
                    onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                    required
                    className="bg-[#10182f] border border-[#1e2a4a] rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <select
                    value={taskData.priority}
                    onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })}
                    className="bg-[#10182f] border border-[#1e2a4a] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="LOW">Low Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <CyberButton type="submit" variant="secondary" className="w-full text-xs">
                  <Plus className="w-3.5 h-3.5" /> Add Task
                </CyberButton>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#10182f] border border-[#1e2a4a] rounded-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2a4a]">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-cyan-400" />
                Initialize New Project
              </h2>
              <button
                onClick={() => setIsNewProjectModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3">
              <CyberInput
                label="Project Name"
                placeholder="e.g. Tata Steel Plant Earthing Grid"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <CyberInput
                  label="Sales Order ID"
                  placeholder="e.g. 1"
                  type="number"
                  value={formData.salesOrderId}
                  onChange={(e) => setFormData({ ...formData, salesOrderId: e.target.value })}
                  required
                />
                <CyberInput
                  label="Customer ID"
                  placeholder="e.g. 1"
                  type="number"
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  required
                />
              </div>
              <CyberInput
                label="Site / Factory Name"
                placeholder="e.g. Jamshedpur Plot 4"
                value={formData.siteName}
                onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
              />
              <CyberInput
                label="Site Address"
                placeholder="e.g. Phase 2 Industrial Area"
                value={formData.siteAddressText}
                onChange={(e) => setFormData({ ...formData, siteAddressText: e.target.value })}
              />

              <div className="pt-2 flex justify-end gap-2">
                <CyberButton
                  variant="secondary"
                  onClick={() => setIsNewProjectModalOpen(false)}
                >
                  Cancel
                </CyberButton>
                <CyberButton type="submit">Create Project</CyberButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
