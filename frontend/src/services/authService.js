import api from '../../api/api'

const AUTH_PREFIX = '/auth'

export const authService = {
  async login(email, password) {
    const response = await api.post(`${AUTH_PREFIX}/login`, { email, password })
    return response.data
  },

  async register(userData) {
    const response = await api.post(`${AUTH_PREFIX}/register`, userData)
    return response.data
  },

  async checkStatus(email) {
    const response = await api.get(`${AUTH_PREFIX}/status`, {
      params: { email },
    })
    return response.data
  },

  async getMe() {
    const response = await api.get(`${AUTH_PREFIX}/me`)
    return response.data
  },

  async logout() {
    try {
      const response = await api.post(`${AUTH_PREFIX}/logout`)
      return response.data
    } finally {
      localStorage.removeItem('yash_auth_token')
      localStorage.removeItem('yash_auth_user')
    }
  },

  async getPendingUsers() {
    const response = await api.get(`${AUTH_PREFIX}/pending`)
    return response.data
  },

  async approveUser(userId) {
    const response = await api.post(`${AUTH_PREFIX}/approve/${userId}`)
    return response.data
  },

  async rejectUser(userId) {
    const response = await api.post(`${AUTH_PREFIX}/reject/${userId}`)
    return response.data
  },

  async devQuickApprove(email) {
    const response = await api.post(`${AUTH_PREFIX}/dev-quick-approve`, { email })
    return response.data
  },
}

export default authService
