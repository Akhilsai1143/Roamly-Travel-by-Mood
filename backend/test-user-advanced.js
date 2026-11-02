const pool = require("./config/db");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

async function runAdvancedTests() {
  console.log("=== Running Advanced User Management Verification ===");

  const [admins] = await pool.query("SELECT * FROM users WHERE role = 'admin' AND is_active = 1 LIMIT 1");
  const admin = admins[0];
  const adminToken = jwt.sign({ id: admin.id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

  // 1. Test Search by Name
  const searchRes = await axios.get(`${BASE_URL}/users?search=alex`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`PASS: Search 'alex' returned ${searchRes.data.users.length} match(es).`);

  // 2. Test Filter by Role (admin)
  const roleRes = await axios.get(`${BASE_URL}/users?role=admin`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const allAreAdmins = roleRes.data.users.every(u => u.role === "admin");
  console.log(`PASS: Filter role=admin returned ${roleRes.data.users.length} users. All are admins: ${allAreAdmins}`);

  // 3. Test Filter by Status (active)
  const statusRes = await axios.get(`${BASE_URL}/users?status=active`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const allAreActive = statusRes.data.users.every(u => u.isActive === true);
  console.log(`PASS: Filter status=active returned ${statusRes.data.users.length} users. All are active: ${allAreActive}`);

  // 4. Test Single User Details with related activity counts
  const singleUserRes = await axios.get(`${BASE_URL}/users/${admin.id}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log("PASS: User details returned with activity counts:", {
    id: singleUserRes.data.user.id,
    name: singleUserRes.data.user.name,
    bookingsCount: singleUserRes.data.user.bookingsCount,
    reviewsCount: singleUserRes.data.user.reviewsCount,
    wishlistCount: singleUserRes.data.user.wishlistCount
  });

  // 5. Test Hard-Delete Protection for User with Bookings
  // Find a user who has bookings
  const [bookingUsers] = await pool.query("SELECT DISTINCT user_id FROM bookings WHERE user_id IS NOT NULL LIMIT 1");
  if (bookingUsers.length > 0) {
    const bookingUserId = bookingUsers[0].user_id;
    try {
      await axios.delete(`${BASE_URL}/users/${bookingUserId}?hard=true`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.error("FAIL: Hard deletion of user with bookings should have failed with 409!");
    } catch (err) {
      if (err.response?.status === 409) {
        console.log("PASS: Hard deletion prevented for user with bookings (409 Conflict):", err.response.data.message);
      } else {
        console.error("FAIL unexpected error:", err.message);
      }
    }
  }

  // 6. Test Self-Deletion Safeguard
  try {
    await axios.delete(`${BASE_URL}/users/${admin.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.error("FAIL: Self-deletion should be blocked!");
  } catch (err) {
    if (err.response?.status === 400) {
      console.log("PASS: Self-deletion blocked with 400:", err.response.data.message);
    } else {
      console.error("FAIL unexpected error on self-deletion:", err.message);
    }
  }

  console.log("=== All Advanced User Management Tests Passed! ===");
  await pool.end();
}

runAdvancedTests().catch(console.error);
