import axios from "axios";

/**
 * Resolves the API Base URL intelligently across local and production environments:
 * 1. Explicit environment variable VITE_API_URL (e.g. from Vercel Project Settings)
 * 2. In production without VITE_API_URL: defaults to '/api' so requests are sent to the
 *    same origin (avoiding mixed-content and CORS issues, routed via vercel.json rewrites)
 * 3. In development: defaults to 'http://localhost:5000/api'
 */
export function resolveApiBase() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  return import.meta.env.PROD ? "/api" : "http://localhost:5000/api";
}

export const API_BASE = resolveApiBase();

/**
 * Formats network and API errors into human-friendly messages for mobile and desktop users.
 */
export function formatApiError(error) {
  if (!error) return "An unexpected error occurred. Please try again.";

  // Native Safari / WebKit fetch error when mixed content or server is unreachable
  if (
    error.name === "TypeError" &&
    (error.message?.includes("Load failed") ||
      error.message?.includes("fetch") ||
      error.message?.includes("NetworkError"))
  ) {
    return "Unable to connect to Roamly servers. Please check your internet connection or verify the backend service is running.";
  }

  // Axios network error (offline, refused, timeout)
  if (error.code === "ERR_NETWORK" || error.message?.includes("Network Error")) {
    return "Unable to connect to Roamly servers. Please check your internet connection or verify the backend service is running.";
  }

  if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
    return "Server response timed out. The server may be waking up — please try again in a few moments.";
  }

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

const apiClient = axios.create({
  baseURL: API_BASE,
  // 45-second timeout to accommodate cloud host cold-starts (e.g. Render / Railway free tier)
  timeout: 45000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach JWT token automatically
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
