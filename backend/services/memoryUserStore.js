// Resilient in-memory fallback user store for serverless/preview environments
// when MySQL is unreachable or unconfigured. Pre-seeded with all existing production accounts.

const memoryUsersByEmail = new Map();
const memoryUsersById = new Map();

let seedUsers = [];
try {
  seedUsers = require("../data/users.json");
} catch (err) {
  seedUsers = [];
}

// Fallback seed admin & demo if users.json is unavailable
if (!seedUsers || seedUsers.length === 0) {
  seedUsers = [
    {
      id: 2,
      name: "Roamly Admin",
      first_name: "Roamly",
      last_name: "Admin",
      email: "admin@roamly.com",
      password: "$2b$12$ygmbu3ij5ZV2SJAd668NAediJu56ajQcIK2fbpuMPMum5H07/oehy", // Admin@123
      role: "admin",
      is_active: 1
    }
  ];
}

seedUsers.forEach((u) => {
  if (u && u.email) {
    const normalized = {
      ...u,
      id: Number(u.id),
      role: u.role || "user",
      is_active: u.is_active !== undefined ? u.is_active : 1
    };
    memoryUsersByEmail.set(normalized.email.toLowerCase(), normalized);
    memoryUsersById.set(normalized.id, normalized);
  }
});

module.exports = {
  findByEmail(email) {
    if (!email) return null;
    return memoryUsersByEmail.get(String(email).trim().toLowerCase()) || null;
  },

  findById(id) {
    if (!id) return null;
    return memoryUsersById.get(Number(id)) || null;
  },

  hasEmail(email) {
    if (!email) return false;
    return memoryUsersByEmail.has(String(email).trim().toLowerCase());
  },

  save(user) {
    const userToSave = {
      ...user,
      id: Number(user.id || Date.now()),
      created_at: user.created_at || new Date().toISOString()
    };
    const emailKey = String(userToSave.email).trim().toLowerCase();
    memoryUsersByEmail.set(emailKey, userToSave);
    memoryUsersById.set(userToSave.id, userToSave);
    return userToSave;
  },

  getAll() {
    return Array.from(memoryUsersById.values());
  }
};
