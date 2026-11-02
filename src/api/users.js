import axios from "axios";
import { API_BASE } from "./client.js";

const USERS_URL = `${API_BASE}/users`;

function getAuthConfig() {
  const token = localStorage.getItem("roamly-token");
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
}

/**
 * Admin: Fetch aggregate user management statistics
 */
export async function getUserStats() {
  const response = await axios.get(`${USERS_URL}/stats`, getAuthConfig());
  return response.data;
}

/**
 * Admin: Fetch paginated list of users with search, role, status, and sorting filters
 * @param {Object} params { search, role, status, sort, page, limit }
 */
export async function getUsers(params = {}) {
  const response = await axios.get(USERS_URL, {
    ...getAuthConfig(),
    params
  });
  return response.data;
}

/**
 * Admin: Fetch full details for a specific user
 * @param {number|string} id User ID
 */
export async function getUserById(id) {
  const response = await axios.get(`${USERS_URL}/${id}`, getAuthConfig());
  return response.data;
}

/**
 * Admin: Activate or deactivate a user account
 * @param {number|string} id User ID
 * @param {boolean} isActive Target activation state
 */
export async function updateUserStatus(id, isActive) {
  const response = await axios.patch(
    `${USERS_URL}/${id}/status`,
    { isActive },
    getAuthConfig()
  );
  return response.data;
}

/**
 * Admin: Update user role (promote to admin or demote to user)
 * @param {number|string} id User ID
 * @param {string} role 'admin' | 'user'
 */
export async function updateUserRole(id, role) {
  const response = await axios.patch(
    `${USERS_URL}/${id}/role`,
    { role },
    getAuthConfig()
  );
  return response.data;
}

/**
 * Admin: Delete a user account (safe soft-delete by default, or hard-delete)
 * @param {number|string} id User ID
 * @param {Object} options { hard: boolean }
 */
export async function deleteUser(id, options = {}) {
  const response = await axios.delete(`${USERS_URL}/${id}`, {
    ...getAuthConfig(),
    params: { hard: Boolean(options.hard) }
  });
  return response.data;
}

const usersApi = {
  getUserStats,
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser
};

export default usersApi;
