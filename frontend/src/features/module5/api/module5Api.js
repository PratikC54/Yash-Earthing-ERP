import api from '../../../api/api';

export const module5Api = {
  // Metrics
  getDashboardMetrics: async () => {
    const res = await api.get('/projects/dashboard/metrics');
    return res.data;
  },

  // M5.1 Projects
  getProjects: async (params = {}) => {
    const res = await api.get('/projects', { params });
    return res.data;
  },

  getProjectById: async (id) => {
    const res = await api.get(`/projects/${id}`);
    return res.data;
  },

  createProject: async (data) => {
    const res = await api.post('/projects', data);
    return res.data;
  },

  updateProject: async (id, data) => {
    const res = await api.patch(`/projects/${id}`, data);
    return res.data;
  },

  addTask: async (projectId, data) => {
    const res = await api.post(`/projects/${projectId}/tasks`, data);
    return res.data;
  },

  updateTaskStatus: async (projectId, taskId, status) => {
    const res = await api.patch(`/projects/${projectId}/tasks/${taskId}/status`, { status });
    return res.data;
  },

  // M5.2 Installations
  getInstallations: async (params = {}) => {
    const res = await api.get('/installations', { params });
    return res.data;
  },

  getInstallationById: async (id) => {
    const res = await api.get(`/installations/${id}`);
    return res.data;
  },

  createInstallation: async (data) => {
    const res = await api.post('/installations', data);
    return res.data;
  },

  scheduleInstallation: async (id, data) => {
    const res = await api.patch(`/installations/${id}/schedule`, data);
    return res.data;
  },

  recordTestResults: async (id, data) => {
    const res = await api.patch(`/installations/${id}/test-results`, data);
    return res.data;
  },

  completeHandover: async (id, data) => {
    const res = await api.patch(`/installations/${id}/handover`, data);
    return res.data;
  },

  // M5.3 Service Tickets
  getServiceTickets: async (params = {}) => {
    const res = await api.get('/service-tickets', { params });
    return res.data;
  },

  getServiceTicketById: async (id) => {
    const res = await api.get(`/service-tickets/${id}`);
    return res.data;
  },

  createServiceTicket: async (data) => {
    const res = await api.post('/service-tickets', data);
    return res.data;
  },

  assignServiceTicket: async (id, data) => {
    const res = await api.patch(`/service-tickets/${id}/assign`, data);
    return res.data;
  },

  resolveServiceTicket: async (id, data) => {
    const res = await api.patch(`/service-tickets/${id}/resolve`, data);
    return res.data;
  },

  updateServiceTicketStatus: async (id, status) => {
    const res = await api.patch(`/service-tickets/${id}/status`, { status });
    return res.data;
  },
};
