import axiosInstance from "./axiosInstance";

const TOKEN_KEY = "authToken";
const USER_KEY = "authUser";

const authService = {
  /**
   * Log in with email and password
   */
  login: async (email, password) => {
    const response = await axiosInstance.post("/auth/login", { email, password });
    const { token, user } = response.data || {};

    if (token && typeof window !== "undefined") {
      window.localStorage.setItem(TOKEN_KEY, token);
      if (user) {
        window.localStorage.setItem(USER_KEY, JSON.stringify(user));
      }
    }
    return response.data;
  },

  /**
   * Log out current user and clear credentials
   */
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch {
      // Continue cleanup even if network request fails
    } finally {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(USER_KEY);
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }
  },

  /**
   * Fetch current authenticated user from backend
   */
  getCurrentUser: async () => {
    const response = await axiosInstance.get("/auth/me");
    const user = response.data;
    if (user && typeof window !== "undefined") {
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    return user;
  },

  /**
   * Get stored token
   */
  getToken: () => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Get stored user profile
   */
  getStoredUser: () => {
    if (typeof window === "undefined") return null;
    const str = window.localStorage.getItem(USER_KEY);
    try {
      return str ? JSON.parse(str) : null;
    } catch {
      return null;
    }
  },

  /**
   * Check if authentication token exists
   */
  isAuthenticated: () => {
    if (typeof window === "undefined") return false;
    const token = window.localStorage.getItem(TOKEN_KEY);
    return Boolean(token && token.trim().length > 0);
  },
};

export default authService;
