import apiClient, { formatApiError } from "./client.js";

/**
 * Register a new user account
 * @param {Object} data - { firstName, lastName, email, phone, password, confirmPassword, travelPreferences }
 * @returns {Promise<{message: string, token: string, user: Object}>}
 */
export async function registerUser(data) {
  try {
    const response = await apiClient.post("/auth/register", {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      password: data.password,
      confirmPassword: data.confirmPassword,
      travelPreferences: data.travelPreferences || []
    });
    return response.data;
  } catch (err) {
    const message = formatApiError(err);
    const error = new Error(message);
    error.status = err.response?.status;
    error.response = err.response;
    throw error;
  }
}

/**
 * Quick registration from the welcome popup
 * @param {Object} data - { fullName, email, phone, travelInterest }
 * @returns {Promise<{message: string, token: string, user: Object}>}
 */
export async function welcomeRegisterUser({ fullName, email, phone, travelInterest }) {
  try {
    const response = await apiClient.post("/auth/welcome-register", {
      fullName,
      email,
      phone,
      travelInterest
    });
    return response.data;
  } catch (err) {
    const message = formatApiError(err);
    const error = new Error(message);
    error.status = err.response?.status;
    error.response = err.response;
    throw error;
  }
}

/**
 * Authenticate existing user with email and password
 * @param {Object} credentials - { email, password }
 * @returns {Promise<{message: string, token: string, user: Object}>}
 */
export async function loginUser({ email, password }) {
  try {
    const response = await apiClient.post("/auth/login", {
      email,
      password
    });
    return response.data;
  } catch (err) {
    const message = formatApiError(err);
    const error = new Error(message);
    error.status = err.response?.status;
    error.response = err.response;
    throw error;
  }
}

/**
 * Fetch authenticated user profile using stored JWT token
 * @returns {Promise<Object|null>}
 */
export async function getCurrentUser() {
  const token = localStorage.getItem("roamly-token");
  if (!token) return null;

  try {
    const response = await apiClient.get("/auth/me");
    return response.data?.user || response.data;
  } catch (err) {
    const error = new Error(formatApiError(err));
    error.status = err.response?.status;
    error.response = err.response;
    throw error;
  }
}

/**
 * Update authenticated user personal profile
 * @param {Object} data - { firstName, lastName, phone, travelPreferences }
 * @returns {Promise<{message: string, user: Object}>}
 */
export async function updateProfile(data) {
  try {
    const response = await apiClient.put("/auth/profile", data);
    return response.data;
  } catch (err) {
    const error = new Error(formatApiError(err));
    error.status = err.response?.status;
    error.response = err.response;
    throw error;
  }
}

/**
 * Change authenticated user password
 * @param {Object} data - { currentPassword, newPassword }
 * @returns {Promise<{message: string}>}
 */
export async function changePassword(data) {
  try {
    const response = await apiClient.put("/auth/password", data);
    return response.data;
  } catch (err) {
    const error = new Error(formatApiError(err));
    error.status = err.response?.status;
    error.response = err.response;
    throw error;
  }
}
