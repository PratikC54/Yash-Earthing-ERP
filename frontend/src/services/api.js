import axios from 'axios';

// Shared Axios client pointing to Express backend at port 5000 by default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for consistent error extraction
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred';
    if (error.response?.data) {
      if (typeof error.response.data.message === 'string') {
        message = error.response.data.message;
      } else if (typeof error.response.data.error === 'string') {
        message = error.response.data.error;
      } else if (typeof error.response.data === 'string') {
        message = error.response.data;
      } else {
        message = JSON.stringify(error.response.data);
      }
    } else if (error.message) {
      message = error.message;
    }
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
