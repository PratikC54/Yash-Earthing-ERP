import api from '../api/api';

const AUTH_PREFIX = '/auth';

export const authService = {
  getToken() {
    return (
      localStorage.getItem('yash_auth_token') ||
      sessionStorage.getItem('yash_auth_token') ||
      null
    );
  },

  getStoredUser() {
    try {
      const stored = localStorage.getItem('yash_auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return Boolean(this.getToken());
  },

  async login(email, password) {
    const response = await api.post(`${AUTH_PREFIX}/login`, { email, password });
    const data = response.data;
    const token = data?.data?.token || data?.token;
    const user = data?.data?.user || data?.user;

    if (token) {
      localStorage.setItem('yash_auth_token', token);
    }
    if (user) {
      localStorage.setItem('yash_auth_user', JSON.stringify(user));
    }
    return data;
  },

  async register(userData) {
    const response = await api.post(`${AUTH_PREFIX}/register`, userData);
    return response.data;
  },

  async checkStatus(email) {
    const response = await api.get(`${AUTH_PREFIX}/status`, {
      params: { email },
    });
    return response.data;
  },

  async getMe() {
    const response = await api.get(`${AUTH_PREFIX}/me`);
    const data = response.data;
    const user = data?.data?.user || data?.data;
    if (user) {
      localStorage.setItem('yash_auth_user', JSON.stringify(user));
    }
    return data;
  },

  async getCurrentUser() {
    const res = await this.getMe();
    return res?.data?.user || res?.data || this.getStoredUser();
  },

  async logout() {
    try {
      const response = await api.post(`${AUTH_PREFIX}/logout`);
      return response.data;
    } finally {
      localStorage.removeItem('yash_auth_token');
      localStorage.removeItem('yash_auth_user');
      sessionStorage.removeItem('yash_auth_token');
    }
  },

  async getPendingUsers() {
    const response = await api.get(`${AUTH_PREFIX}/pending`);
    return response.data;
  },

  async approveUser(userId) {
    const response = await api.post(`${AUTH_PREFIX}/approve/${userId}`);
    return response.data;
  },

  async rejectUser(userId) {
    const response = await api.post(`${AUTH_PREFIX}/reject/${userId}`);
    return response.data;
  },

  async devQuickApprove(email) {
    const response = await api.post(`${AUTH_PREFIX}/dev-quick-approve`, { email });
    return response.data;
  },
};

export default authService;
