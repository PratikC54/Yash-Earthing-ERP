import axios from 'axios'

const API_BASE_URL = '/api/v1/auth'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Attach token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('yash_auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authService = {
  async login(email, password) {
    const response = await api.post('/login', { email, password })
    return response.data
  },

  async register(userData) {
    const response = await api.post('/register', userData)
    return response.data
  },

  async checkStatus(email) {
    const response = await api.get('/status', {
      params: { email },
    })
    return response.data
  },

  async getMe() {
    const response = await api.get('/me')
    return response.data
  },

  async logout() {
    try {
      const response = await api.post('/logout')
      return response.data
    } finally {
      localStorage.removeItem('yash_auth_token')
      localStorage.removeItem('yash_auth_user')
    }
  },

  async getPendingUsers() {
    const response = await api.get('/pending')
    return response.data
  },

  async approveUser(userId) {
    const response = await api.post(`/approve/${userId}`)
    return response.data
  },

  async rejectUser(userId) {
    const response = await api.post(`/reject/${userId}`)
    return response.data
  },

  async devQuickApprove(email) {
    const response = await api.post('/dev-quick-approve', { email })
    return response.data
  },
}

export default authService
