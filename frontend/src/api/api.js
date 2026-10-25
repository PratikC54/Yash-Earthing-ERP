import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "/api",
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
    let message =
      error.response?.data?.message ||
      error.message ||
      "An unexpected API error occurred.";

    if (
      status === 502 ||
      status === 503 ||
      status === 504 ||
      error.code === "ECONNREFUSED" ||
      error.code === "ERR_NETWORK"
    ) {
      message = `Backend server unreachable (${status || error.code || "Gateway Error"}). Please ensure the API server is running.`;
    }

    if (status === 401) {
      localStorage.removeItem("yash_auth_token");
      localStorage.removeItem("yash_auth_user");
      sessionStorage.removeItem("yash_auth_token");
    }

    if (import.meta.env.DEV) {
      // Diagnostic logging without credentials or sensitive request bodies
      const method = error.config?.method?.toUpperCase() || "REQUEST";
      const url = error.config?.url || "";
      console.error(`[API ${method} ${url}] (${status || error.code || "ERR"}): ${message}`);
    }

    return Promise.reject(error);
  },
);

export default api;
