import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add authentication headers here if your ERP uses Bearer tokens.
    // If authentication uses HTTP-only cookies, withCredentials
    // allows the browser to send cookies where permitted.

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "An unexpected API error occurred.";

    console.error("API Error:", message);

    return Promise.reject(error);
  },
);

export default api;
