import axios from "axios";

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const baseURL = rawBaseUrl.endsWith("/api")
  ? rawBaseUrl
  : `${rawBaseUrl.replace(/\/+$/, "")}/api`;

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request Interceptor: Attach Bearer Token if available
axiosInstance.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("authToken")
        : null;

    if (token && token.trim().length > 0) {
      config.headers.Authorization = `Bearer ${token.trim()}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Extract payload & gracefully handle 401 Unauthorized
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";

    const customMessage =
      error.response?.data?.message ||
      error.response?.data?.error?.message ||
      error.message ||
      "An unexpected ERP service error occurred.";

    // Handle 401 Unauthorized
    if (status === 401) {
      const isAuthEndpoint = url.includes("/auth/login");

      if (!isAuthEndpoint && typeof window !== "undefined") {
        // Clear invalid auth credentials
        window.localStorage.removeItem("authToken");
        window.localStorage.removeItem("authUser");

        // Only redirect to login if not already on the login page
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    // Preserve useful error message without logging credentials
    return Promise.reject({
      status,
      message: customMessage,
      data: error.response?.data,
      originalError: error,
    });
  }
);

export default axiosInstance;
