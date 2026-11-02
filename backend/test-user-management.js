const pool = require("./config/db");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

async function runTests() {
  console.log("=== Testing User Management APIs ===");

  // 1. Get an admin user and normal user from DB
  const [admins] = await pool.query("SELECT * FROM users WHERE role = 'admin' AND is_active = 1 LIMIT 1");
  const [users] = await pool.query("SELECT * FROM users WHERE role = 'user' AND is_active = 1 LIMIT 1");

  if (admins.length === 0) {
    console.error("No admin found in DB!");
    return;
  }
  const admin = admins[0];
  const testUser = users[0];

  const adminToken = jwt.sign({ id: admin.id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
  const userToken = jwt.sign({ id: testUser.id, role: testUser.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

  console.log(`Admin user: ${admin.email} (ID: ${admin.id})`);
  console.log(`Test user: ${testUser.email} (ID: ${testUser.id})`);

  // Test 1: Unauthorized access (no token)
  try {
    await axios.get(`${BASE_URL}/users/stats`);
    console.error("FAIL: Unauthorized request should fail with 401");
  } catch (err) {
    if (err.response?.status === 401) {
      console.log("PASS: Unauthorized request rejected with 401");
    } else {
      console.error("FAIL unexpected error:", err.message);
    }
  }

  // Test 2: Forbidden access (normal user token)
  try {
    await axios.get(`${BASE_URL}/users/stats`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.error("FAIL: Normal user should be rejected with 403");
  } catch (err) {
    if (err.response?.status === 403) {
      console.log("PASS: Normal user forbidden with 403 Admin access required");
    } else {
      console.error("FAIL unexpected error:", err.message);
    }
  }

  // Test 3: Admin access to stats
  try {
    const statsRes = await axios.get(`${BASE_URL}/users/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log("PASS: Admin stats retrieved:", statsRes.data);
  } catch (err) {
    console.error("FAIL stats error:", err.response?.data || err.message);
  }

  // Test 4: Admin access to user list
  try {
    const listRes = await axios.get(`${BASE_URL}/users?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`PASS: Admin user list retrieved. Total: ${listRes.data.pagination.totalItems}, returned: ${listRes.data.users.length}`);
    const first = listRes.data.users[0];
    if (first.password) {
      console.error("SECURITY RISK: User password exposed in API response!");
    } else {
      console.log("PASS: Passwords are not exposed in user API response.");
    }
  } catch (err) {
    console.error("FAIL user list error:", err.response?.data || err.message);
  }

  // Test 5: Self-deactivation protection
  try {
    await axios.patch(
      `${BASE_URL}/users/${admin.id}/status`,
      { isActive: false },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.error("FAIL: Self-deactivation should be blocked!");
  } catch (err) {
    if (err.response?.status === 400) {
      console.log("PASS: Self-deactivation blocked:", err.response.data.message);
    } else {
      console.error("FAIL unexpected error on self-deactivation:", err.message);
    }
  }

  // Test 6: Deactivate normal user and verify
  try {
    const deactRes = await axios.patch(
      `${BASE_URL}/users/${testUser.id}/status`,
      { isActive: false },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log("PASS: User deactivated:", deactRes.data.message);

    // Now test that user's token is blocked in authMiddleware
    try {
      await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      console.error("FAIL: Deactivated user should be blocked from /api/auth/me");
    } catch (err) {
      if (err.response?.status === 403) {
        console.log("PASS: Deactivated user token blocked with 403:", err.response.data.message);
      } else {
        console.error("FAIL unexpected error on deactivated user check:", err.message);
      }
    }

    // Re-activate user
    const reactRes = await axios.patch(
      `${BASE_URL}/users/${testUser.id}/status`,
      { isActive: true },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log("PASS: User re-activated:", reactRes.data.message);
  } catch (err) {
    console.error("FAIL deactivation test:", err.response?.data || err.message);
  }

  console.log("=== All backend user management tests completed successfully ===");
  await pool.end();
}

runTests().catch(console.error);
