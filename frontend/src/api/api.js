import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("yash_auth_token") ||
      sessionStorage.getItem("yash_auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      error.message ||
      "An unexpected API error occurred.";

    if (status === 401) {
      localStorage.removeItem("yash_auth_token");
      localStorage.removeItem("yash_auth_user");
      sessionStorage.removeItem("yash_auth_token");
    }

    console.error("API Error:", message);

    return Promise.reject(error);
  },
);

export default api;
