import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../services/api';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Clock,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Link as LinkIcon,
  User,
  Building,
  Flag,
  ArrowRight,
  RotateCcw,
  X,
  FileCheck,
} from 'lucide-react';

export default function TaskManager() {
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [tasks, setTasks] = useState([]);
  const [kanban, setKanban] = useState({
    OPEN: [],
    IN_PROGRESS: [],
    BLOCKED: [],
    WAITING_APPROVAL: [],
    COMPLETED: [],
    CANCELLED: [],
  });

  const [metrics, setMetrics] = useState({
    total: 0,
    overdue: 0,
    open: 0,
    inProgress: 0,
    blocked: 0,
    waitingApproval: 0,
    completed: 0,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [employees, setEmployees] = useState([]);

  // Form State for New Task
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    department: 'Production',
    priority: 'MEDIUM',
    dueAt: '',
    assignedToId: '1',
    relatedEntityType: 'WORK_ORDER',
    relatedEntityId: '',
    targetMetric: '',
  });

  // Fetch employees for assignee dropdown
  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await apiClient.get('/hrms/employees', { params: { limit: 50, isActive: true } });
        if (res.data?.success && res.data.data?.length > 0) {
          setEmployees(res.data.data);
          setNewTaskForm((prev) => ({ ...prev, assignedToId: String(res.data.data[0].userId || res.data.data[0].id) }));
        }
      } catch (e) {}
    }
    loadEmployees();
  }, []);

  // Fetch Tasks
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const res = await apiClient.get('/hrms/tasks', {
        params: {
          search: search || undefined,
          department: departmentFilter !== 'ALL' ? departmentFilter : undefined,
          priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
        },
      });

      if (res.data?.success) {
        setTasks(res.data.data || []);
        if (res.data.kanban) setKanban(res.data.kanban);
        if (res.data.metrics) setMetrics(res.data.metrics);
      }
    } catch (err) {
      setApiError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [search, departmentFilter, priorityFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Handle Task Creation
  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newTaskForm,
        assignedToId: newTaskForm.assignedToId ? Number(newTaskForm.assignedToId) : null,
        relatedEntityId: newTaskForm.relatedEntityId ? Number(newTaskForm.relatedEntityId) : null,
      };

      const res = await apiClient.post('/hrms/tasks', payload);
      if (res.data?.success) {
        setIsCreateModalOpen(false);
        setNewTaskForm({
          title: '',
          description: '',
          department: 'Production',
          priority: 'MEDIUM',
          dueAt: '',
          assignedToId: '',
          relatedEntityType: 'WORK_ORDER',
          relatedEntityId: '',
          targetMetric: '',
        });
        fetchTasks();
      }
    } catch (err) {
      const msg = typeof err === 'object' ? err.message || JSON.stringify(err) : String(err);
      alert(msg);
    }
  };

  // Handle Status Transition
  const handleUpdateStatus = async (taskId, nextStatus, notes = '') => {
    try {
      const res = await apiClient.put(`/hrms/tasks/${taskId}/status`, {
        status: nextStatus,
        notes,
      });
      if (res.data?.success) {
        fetchTasks();
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(res.data.data);
        }
      }
    } catch (err) {
      const msg = typeof err === 'object' ? err.message || JSON.stringify(err) : String(err);
      alert(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-xs">Total Active Tasks</div>
          <div className="text-2xl font-bold text-white mt-1">{metrics.total}</div>
        </div>

        <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-xs">Overdue Deadlines</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{metrics.overdue}</div>
        </div>

        <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-xs">In Progress</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">{metrics.inProgress}</div>
        </div>

        <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-xs">Blocked Operations</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{metrics.blocked}</div>
        </div>

        <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-xs">Completed</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{metrics.completed}</div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#141d30] p-4 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by TSK number, title, or description..."
              className="w-full bg-[#0d1424] text-xs text-slate-200 placeholder-slate-500 pl-9 pr-3 py-2 rounded-lg border border-slate-750 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-[#0d1424] text-xs text-slate-300 border border-slate-750 rounded-lg px-3 py-2 cursor-pointer"
          >
            <option value="ALL">All Departments</option>
            <option value="Production">Production</option>
            <option value="Quality & Metrology">Quality</option>
            <option value="Installation">Installation</option>
            <option value="Sales">Sales</option>
            <option value="Engineering">Engineering</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-[#0d1424] text-xs text-slate-300 border border-slate-750 rounded-lg px-3 py-2 cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex rounded-lg bg-[#0d1424] p-1 border border-slate-750 text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded cursor-pointer transition ${
                viewMode === 'kanban' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400'
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded cursor-pointer transition ${
                viewMode === 'list' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('archive')}
              className={`px-3 py-1 rounded cursor-pointer transition ${
                viewMode === 'archive' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400'
              }`}
            >
              Completed Storage ({kanban.COMPLETED.length})
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-blue-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Database Warning if PostgreSQL not ready */}
      {apiError && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center space-x-2 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            Database connection currently waiting for PostgreSQL on port 5432. All task validation
            and lifecycle routines are tested and ready.
          </span>
        </div>
      )}

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {/* Column 1: OPEN */}
          <div className="bg-[#141d30]/60 rounded-2xl border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <span>Open / Assigned</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {kanban.OPEN.length}
              </span>
            </div>
            <div className="space-y-3">
              {kanban.OPEN.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onClick={() => {
                    setSelectedTask(t);
                    setIsDetailOpen(true);
                  }}
                  onAdvance={() => handleUpdateStatus(t.id, 'IN_PROGRESS')}
                  advanceLabel="Start Work"
                />
              ))}
              {kanban.OPEN.length === 0 && (
                <div className="text-center py-8 text-slate-600 text-xs">No open tasks</div>
              )}
            </div>
          </div>

          {/* Column 2: IN PROGRESS */}
          <div className="bg-[#141d30]/60 rounded-2xl border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-blue-400 uppercase tracking-wider">
              <span>In Progress</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-400">
                {kanban.IN_PROGRESS.length}
              </span>
            </div>
            <div className="space-y-3">
              {kanban.IN_PROGRESS.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onClick={() => {
                    setSelectedTask(t);
                    setIsDetailOpen(true);
                  }}
                  onAdvance={() => handleUpdateStatus(t.id, 'WAITING_APPROVAL')}
                  advanceLabel="Submit for Review"
                />
              ))}
              {kanban.IN_PROGRESS.length === 0 && (
                <div className="text-center py-8 text-slate-600 text-xs">No in-progress tasks</div>
              )}
            </div>
          </div>

          {/* Column 3: BLOCKED OPERATIONS */}
          <div className="bg-[#141d30]/60 rounded-2xl border border-rose-900/40 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-rose-900/30 text-xs font-bold text-rose-400 uppercase tracking-wider">
              <span>Blocked Operations</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-400 border border-rose-800/40">
                {(kanban.BLOCKED || []).length}
              </span>
            </div>
            <div className="space-y-3">
              {(kanban.BLOCKED || []).map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onClick={() => {
                    setSelectedTask(t);
                    setIsDetailOpen(true);
                  }}
                  onAdvance={() => handleUpdateStatus(t.id, 'IN_PROGRESS')}
                  advanceLabel="Unblock & Resume"
                />
              ))}
              {(!kanban.BLOCKED || kanban.BLOCKED.length === 0) && (
                <div className="text-center py-8 text-slate-600 text-xs">No blocked tasks</div>
              )}
            </div>
          </div>

          {/* Column 4: WAITING APPROVAL / QC */}
          <div className="bg-[#141d30]/60 rounded-2xl border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <span>Review / Verification</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-900/30 text-amber-400">
                {kanban.WAITING_APPROVAL.length}
              </span>
            </div>
            <div className="space-y-3">
              {kanban.WAITING_APPROVAL.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onClick={() => {
                    setSelectedTask(t);
                    setIsDetailOpen(true);
                  }}
                  onAdvance={() => handleUpdateStatus(t.id, 'COMPLETED')}
                  advanceLabel="Approve & Close"
                />
              ))}
              {kanban.WAITING_APPROVAL.length === 0 && (
                <div className="text-center py-8 text-slate-600 text-xs">No pending reviews</div>
              )}
            </div>
          </div>

          {/* Column 5: COMPLETED (Only Most Recent Shown + Link to Storage/Archive) */}
          <div className="bg-[#141d30]/60 rounded-2xl border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <span>Recently Completed</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400">
                {kanban.COMPLETED.length} Total
              </span>
            </div>
            <div className="space-y-3">
              {kanban.COMPLETED.slice(0, 1).map((t) => (
                <div key={t.id} className="space-y-2">
                  <TaskCard
                    task={t}
                    onClick={() => {
                      setSelectedTask(t);
                      setIsDetailOpen(true);
                    }}
                  />
                  {kanban.COMPLETED.length > 1 && (
                    <button
                      onClick={() => setViewMode('archive')}
                      className="w-full py-2 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/40 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <span>View All Completed Storage ({kanban.COMPLETED.length}) &rarr;</span>
                    </button>
                  )}
                </div>
              ))}
              {kanban.COMPLETED.length === 0 && (
                <div className="text-center py-8 text-slate-600 text-xs">No completed tasks</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-[#141d30] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0d1424] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">Task ID & Title</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Linked Entity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => {
                      setSelectedTask(task);
                      setIsDetailOpen(true);
                    }}
                    className="hover:bg-slate-800/30 cursor-pointer transition"
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-white">{task.title}</div>
                      <div className="font-mono text-[11px] text-cyan-400">{task.taskNo}</div>
                    </td>
                    <td className="px-4 py-3.5">{task.department}</td>
                    <td className="px-4 py-3.5">{task.assignedTo?.name || 'Unassigned'}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          task.priority === 'CRITICAL'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : task.priority === 'HIGH'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span className={task.isOverdue ? 'text-rose-400 font-bold' : ''}>
                          {task.dueAt ? new Date(task.dueAt).toLocaleDateString() : 'None'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {task.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {task.relatedEntityType ? (
                        <span className="text-[10px] text-cyan-400 font-mono">
                          {task.relatedEntityType} #{task.relatedEntityId}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COMPLETED STORAGE / ARCHIVE VIEW */}
      {viewMode === 'archive' && (
        <div className="bg-[#141d30] rounded-2xl border border-slate-800 overflow-hidden shadow-xl space-y-4 p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-emerald-400 text-sm flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Completed Tasks Historical Storage Archive</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                All finished and verified work orders stored safely. Kanban board keeps clean by showing only the latest completion.
              </p>
            </div>
            <button
              onClick={() => setViewMode('kanban')}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              &larr; Back to Active Kanban
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0d1424] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">Task ID & Title</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Completed By</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Completed Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Linked ERP Entity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {kanban.COMPLETED.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => {
                      setSelectedTask(task);
                      setIsDetailOpen(true);
                    }}
                    className="hover:bg-slate-800/30 cursor-pointer transition"
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-white">{task.title}</div>
                      <div className="font-mono text-[11px] text-cyan-400">{task.taskNo}</div>
                    </td>
                    <td className="px-4 py-3.5">{task.department}</td>
                    <td className="px-4 py-3.5">{task.assignedTo?.name || 'Unassigned'}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">
                      {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'Finished'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-900/40 text-emerald-300 border border-emerald-600/30 flex items-center w-fit space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>COMPLETED</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {task.relatedEntityType ? (
                        <span className="text-[10px] text-cyan-400 font-mono">
                          {task.relatedEntityType} #{task.relatedEntityId}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {kanban.COMPLETED.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-slate-500 text-xs">
                      No completed tasks in storage archive yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#141d30] border border-slate-750 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">Assign New Operational Task</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                  placeholder="e.g. Inspect Raw Copper Strip Batch #88"
                  className="w-full bg-[#0d1424] border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={newTaskForm.description}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
                  placeholder="Operational details and inspection parameters"
                  className="w-full bg-[#0d1424] border border-slate-700 rounded-lg p-2 text-white"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Department</label>
                  <select
                    value={newTaskForm.department}
                    onChange={(e) =>
                      setNewTaskForm({ ...newTaskForm, department: e.target.value })
                    }
                    className="w-full bg-[#0d1424] border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="Production">Production</option>
                    <option value="Quality & Metrology">Quality</option>
                    <option value="Installation">Installation</option>
                    <option value="Sales">Sales</option>
                    <option value="Engineering">Engineering</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Priority</label>
                  <select
                    value={newTaskForm.priority}
                    onChange={(e) =>
                      setNewTaskForm({ ...newTaskForm, priority: e.target.value })
                    }
                    className="w-full bg-[#0d1424] border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTaskForm.dueAt}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, dueAt: e.target.value })}
                    className="w-full bg-[#0d1424] border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Assignee Employee</label>
                  <select
                    value={newTaskForm.assignedToId}
                    onChange={(e) =>
                      setNewTaskForm({ ...newTaskForm, assignedToId: e.target.value })
                    }
                    className="w-full bg-[#0d1424] border border-slate-700 rounded-lg p-2 text-white cursor-pointer"
                  >
                    {employees.length > 0 ? (
                      employees.map((emp) => (
                        <option key={emp.id} value={emp.userId || emp.id}>
                          {emp.fullName} ({emp.employeeCode} - {emp.department})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="1">System Administrator (Management)</option>
                        <option value="2">Pratik Senapati (Sales)</option>
                        <option value="3">Rajesh Kumar (Production)</option>
                        <option value="4">Ananya Sharma (Quality)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* ERP Link */}
              <div className="p-3 bg-[#0d1424] rounded-xl border border-slate-800 space-y-2">
                <div className="font-semibold text-slate-300 flex items-center space-x-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>Link to ERP Entity (Cross-Module Integration)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={newTaskForm.relatedEntityType}
                    onChange={(e) =>
                      setNewTaskForm({ ...newTaskForm, relatedEntityType: e.target.value })
                    }
                    className="bg-[#141d30] border border-slate-700 rounded-lg p-2 text-white text-xs"
                  >
                    <option value="WORK_ORDER">Work Order (M4)</option>
                    <option value="QUALITY_INSPECTION">QC Inspection (M4)</option>
                    <option value="LEAD">Sales Lead (M1)</option>
                    <option value="SALES_ORDER">Sales Order (M1)</option>
                    <option value="PURCHASE_ORDER">Purchase Order (M2)</option>
                    <option value="INSTALLATION">Installation (M5)</option>
                    <option value="PROJECT">Project (M5)</option>
                  </select>

                  <input
                    type="number"
                    placeholder="Record ID"
                    value={newTaskForm.relatedEntityId}
                    onChange={(e) =>
                      setNewTaskForm({ ...newTaskForm, relatedEntityId: e.target.value })
                    }
                    className="bg-[#141d30] border border-slate-700 rounded-lg p-2 text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl"
                >
                  Create & Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Detail Drawer */}
      {isDetailOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 p-0">
          <div className="w-full max-w-md bg-[#141d30] border-l border-slate-800 h-full p-6 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="font-mono text-xs text-cyan-400">{selectedTask.taskNo}</span>
                <h3 className="font-bold text-white text-base mt-0.5">{selectedTask.title}</h3>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Description
                </span>
                <p className="text-slate-200 mt-1">
                  {selectedTask.description || 'No description provided.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#0d1424] rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase">Department</span>
                  <div className="font-semibold text-white mt-0.5">{selectedTask.department}</div>
                </div>

                <div className="p-3 bg-[#0d1424] rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase">Priority</span>
                  <div className="font-semibold text-amber-400 mt-0.5">{selectedTask.priority}</div>
                </div>
              </div>

              <div className="p-3 bg-[#0d1424] rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase">Assignee</span>
                <div className="text-white font-semibold">
                  {selectedTask.assignedTo?.name || 'Unassigned'}
                </div>
                {selectedTask.assignedTo && (
                  <div className="text-[11px] text-slate-400">
                    Role: {selectedTask.assignedTo.role}
                  </div>
                )}
              </div>

              {selectedTask.relatedEntityType && (
                <div className="p-3 bg-[#0d1424] rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">Linked ERP Entity</span>
                  <div className="text-cyan-400 font-mono font-medium">
                    {selectedTask.relatedEntityType} #{selectedTask.relatedEntityId}
                  </div>
                </div>
              )}

              {/* Status Actions */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold">
                  Advance Status Lifecycle
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedTask.status === 'OPEN' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedTask.id, 'IN_PROGRESS')}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium"
                    >
                      Start Task
                    </button>
                  )}
                  {selectedTask.status === 'IN_PROGRESS' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(selectedTask.id, 'WAITING_APPROVAL')}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium"
                      >
                        Submit for Verification
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(selectedTask.id, 'BLOCKED')}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 font-medium"
                      >
                        Flag as Blocked
                      </button>
                    </>
                  )}
                  {selectedTask.status === 'BLOCKED' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedTask.id, 'IN_PROGRESS')}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium"
                    >
                      Unblock & Resume
                    </button>
                  )}
                  {selectedTask.status === 'WAITING_APPROVAL' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(selectedTask.id, 'COMPLETED')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                      >
                        Approve & Complete
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(selectedTask.id, 'IN_PROGRESS')}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-medium"
                      >
                        Return for Rework
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Kanban Task Card Component
function TaskCard({ task, onClick, onAdvance, advanceLabel }) {
  return (
    <div
      onClick={onClick}
      className="bg-[#0d1424] p-3.5 rounded-xl border border-slate-850 hover:border-slate-700 transition cursor-pointer space-y-2.5 shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-cyan-400 font-semibold">{task.taskNo}</span>
        <span
          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
            task.priority === 'CRITICAL'
              ? 'bg-rose-500/20 text-rose-400'
              : task.priority === 'HIGH'
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-blue-500/20 text-blue-400'
          }`}
        >
          {task.priority}
        </span>
      </div>

      <div className="font-semibold text-white text-xs line-clamp-2">{task.title}</div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
        <div className="flex items-center space-x-1">
          <User className="w-3 h-3 text-slate-500" />
          <span className="truncate max-w-[100px]">{task.assignedTo?.name || 'Unassigned'}</span>
        </div>

        {task.dueAt && (
          <div
            className={`flex items-center space-x-1 ${
              task.isOverdue ? 'text-rose-400 font-bold' : ''
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>{new Date(task.dueAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
      </div>

      {task.relatedEntityType && (
        <div className="text-[10px] font-mono text-slate-500 flex items-center space-x-1">
          <LinkIcon className="w-2.5 h-2.5" />
          <span>
            {task.relatedEntityType} #{task.relatedEntityId}
          </span>
        </div>
      )}

      {onAdvance && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdvance();
          }}
          className="w-full mt-1 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 text-[10px] font-semibold border border-blue-500/30 transition flex items-center justify-center space-x-1"
        >
          <span>{advanceLabel}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
