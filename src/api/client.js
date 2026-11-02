import axios from "axios";

export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach token automatically
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("roamly-token");
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: graceful 401 handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token is expired or invalidated on server
      const currentToken = localStorage.getItem("roamly-token");
      if (currentToken) {
        localStorage.removeItem("roamly-token");
        localStorage.removeItem("roamly-user");
        window.dispatchEvent(new CustomEvent("roamly:unauthorized"));
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
