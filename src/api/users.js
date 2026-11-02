import apiClient from "./client.js";

/**
 * Admin: Fetch aggregate user management statistics
 */
export async function getUserStats() {
  const response = await apiClient.get("/users/stats");
  return response.data;
}

/**
 * Admin: Fetch paginated list of users with search, role, status, and sorting filters
 * @param {Object} params { search, role, status, sort, page, limit }
 */
export async function getUsers(params = {}) {
  const response = await apiClient.get("/users", { params });
  return response.data;
}

/**
 * Admin: Fetch full details for a specific user
 * @param {number|string} id User ID
 */
export async function getUserById(id) {
  const response = await apiClient.get(`/users/${id}`);
  return response.data;
}

/**
 * Admin: Activate or deactivate a user account
 * @param {number|string} id User ID
 * @param {boolean} isActive Target activation state
 */
export async function updateUserStatus(id, isActive) {
  const response = await apiClient.patch(`/users/${id}/status`, { isActive });
  return response.data;
}

/**
 * Admin: Update user role (promote to admin or demote to user)
 * @param {number|string} id User ID
 * @param {string} role 'admin' | 'user'
 */
export async function updateUserRole(id, role) {
  const response = await apiClient.patch(`/users/${id}/role`, { role });
  return response.data;
}

/**
 * Admin: Delete a user account (safe soft-delete by default, or hard-delete)
 * @param {number|string} id User ID
 * @param {Object} options { hard: boolean }
 */
export async function deleteUser(id, options = {}) {
  const response = await apiClient.delete(`/users/${id}`, {
    params: { hard: Boolean(options?.hard) }
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
