// Resilient in-memory fallback user store for serverless/preview environments
// when MySQL is unreachable or unconfigured.

const memoryUsersByEmail = new Map();
const memoryUsersById = new Map();

// Seed default administrator and demo user
const seedUsers = [
  {
    id: 1,
    name: "Roamly Administrator",
    first_name: "Roamly",
    last_name: "Admin",
    email: "admin@roamly.com",
    phone: "+91 9876543210",
    travel_preferences: ["Nature & Mountains", "Adventure", "Beaches"],
    // Hash for 'Admin@123'
    password: "$2b$10$92BxFV9OUNyBOGEt5gFGu.RE9j0jyY1FasRsY5dddvyK2LRB8LUtO",
    role: "admin",
    is_active: 1,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    name: "Demo Traveler",
    first_name: "Demo",
    last_name: "Traveler",
    email: "demo@roamly.com",
    phone: "+91 9123456780",
    travel_preferences: ["Beaches", "Peace"],
    // Hash for 'Demo@1234'
    password: "$2b$10$5t11VUXUb3/vRxsMksWXJuEstuEGfO81bCyCipA5fvQfZMsEfSvAe",
    role: "user",
    is_active: 1,
    created_at: new Date().toISOString()
  }
];

seedUsers.forEach((u) => {
  memoryUsersByEmail.set(u.email.toLowerCase(), u);
  memoryUsersById.set(u.id, u);
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
      id: user.id || Date.now(),
      created_at: user.created_at || new Date().toISOString()
    };
    const emailKey = String(userToSave.email).trim().toLowerCase();
    memoryUsersByEmail.set(emailKey, userToSave);
    memoryUsersById.set(userToSave.id, userToSave);
    return userToSave;
  }
};
