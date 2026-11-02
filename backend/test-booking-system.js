const pool = require("./config/db");

const API_BASE = "http://localhost:5000/api";

async function runTests() {
  console.log("==================================================================");
  console.log("ROAMLY END-TO-END TRIP BOOKING & APPROVAL AUTOMATED TEST SUITE");
  console.log("==================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate as normal user
    console.log("[1] Authenticating normal user (testuser@example.com)...");
    const userLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "testuser@example.com", password: "User@123" })
    });
    const userLoginData = await userLoginRes.json();
    assert(userLoginRes.ok && userLoginData.token, "User login successful with JWT");
    const userToken = userLoginData.token;
    const userId = userLoginData.user.id;

    // 2. Authenticate as admin
    console.log("\n[2] Authenticating admin (admin@roamly.com)...");
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@roamly.com", password: "Admin@123" })
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.ok && adminLoginData.user.role === "admin", "Admin login successful with admin role");
    const adminToken = adminLoginData.token;
    const adminId = adminLoginData.user.id;

    // 3. User creates a valid trip booking
    console.log("\n[3] Submitting trip booking request for Jaipur...");
    const createBookingRes = await fetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userToken}`
      },
      body: JSON.stringify({
        destinationId: 2, // Jaipur
        startDate: "2026-11-20",
        endDate: "2026-11-25",
        travellers: 3,
        contactName: "Roamly Test Traveler",
        contactEmail: "testuser@example.com",
        contactPhone: "+91 9123456789",
        specialRequests: "Heritage fort tour inquiry and vegetarian meals",
        estimatedBudget: 24000
      })
    });
    const createData = await createBookingRes.json();
    assert(createBookingRes.status === 201, "Booking created with 201 Created status");
    assert(Boolean(createData.bookingReference), `Booking reference generated: ${createData.bookingReference}`);
    assert(createData.status === "pending", "Initial booking status is 'pending'");
    const bookingId = createData.booking.id;
    const bookingRef = createData.bookingReference;

    // 4. Verify in MySQL database directly
    console.log("\n[4] Verifying direct MySQL record persistence...");
    const [dbRows] = await pool.query(
      "SELECT * FROM bookings WHERE id = ?",
      [bookingId]
    );
    assert(dbRows.length === 1, "Record exists in MySQL bookings table");
    assert(dbRows[0].booking_reference === bookingRef, "Booking reference matches in MySQL");
    assert(dbRows[0].status === "pending", "MySQL status column is 'pending'");
    assert(dbRows[0].user_id === userId, "MySQL user_id matches authenticated server identity");
    assert(dbRows[0].travellers === 3, "Travellers count accurately saved");

    // 5. User checks own bookings and stats
    console.log("\n[5] Testing user booking list and statistics endpoints...");
    const userBookingsRes = await fetch(`${API_BASE}/bookings/my`, {
      headers: { "Authorization": `Bearer ${userToken}` }
    });
    const userBookingsData = await userBookingsRes.json();
    const userHasBooking = userBookingsData.bookings?.some(b => b.id === bookingId);
    assert(userHasBooking, "User's booking appears in GET /api/bookings/my");

    const userStatsRes = await fetch(`${API_BASE}/bookings/my/stats`, {
      headers: { "Authorization": `Bearer ${userToken}` }
    });
    const userStatsData = await userStatsRes.json();
    assert(userStatsData.pending >= 1, "User stats reflects pending count accurately from database");

    // 6. Security Check: Non-admin calling admin endpoint
    console.log("\n[6] Testing Role-Based Access Control (RBAC security)...");
    const forbiddenRes = await fetch(`${API_BASE}/bookings/admin`, {
      headers: { "Authorization": `Bearer ${userToken}` }
    });
    assert(forbiddenRes.status === 403, "Normal user forbidden from calling GET /api/bookings/admin (403)");

    // 7. Admin views all bookings
    console.log("\n[7] Admin viewing bookings list and stats...");
    const adminBookingsRes = await fetch(`${API_BASE}/bookings/admin`, {
      headers: { "Authorization": `Bearer ${adminToken}` }
    });
    const adminBookingsData = await adminBookingsRes.json();
    const adminHasBooking = adminBookingsData.bookings?.some(b => b.id === bookingId);
    assert(adminHasBooking, "Admin can see the newly created booking request");

    const adminStatsRes = await fetch(`${API_BASE}/bookings/admin/stats`, {
      headers: { "Authorization": `Bearer ${adminToken}` }
    });
    const adminStatsData = await adminStatsRes.json();
    assert(adminStatsData.total >= 1 && adminStatsData.pending >= 1, "Admin stats correctly aggregates all database records");

    // 8. Admin confirms the booking
    console.log(`\n[8] Admin confirming booking #${bookingId}...`);
    const confirmRes = await fetch(`${API_BASE}/bookings/admin/${bookingId}/confirm`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${adminToken}` }
    });
    const confirmData = await confirmRes.json();
    assert(confirmRes.status === 200, "Booking confirmed with 200 OK");
    assert(confirmData.booking.status === "confirmed", "Returned booking status is 'confirmed'");
    assert(confirmData.booking.confirmedBy === adminId, "ConfirmedBy matches admin user ID");
    assert(Boolean(confirmData.booking.confirmedAt), "ConfirmedAt timestamp recorded");

    // 9. Conflict Prevention Test: Admin trying to confirm already confirmed booking
    console.log("\n[9] Testing conflict response on duplicate confirmation...");
    const duplicateConfirmRes = await fetch(`${API_BASE}/bookings/admin/${bookingId}/confirm`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${adminToken}` }
    });
    const duplicateData = await duplicateConfirmRes.json();
    assert(duplicateConfirmRes.status === 409, "Duplicate confirmation returns 409 Conflict");
    assert(duplicateData.currentStatus === "confirmed", "Conflict response specifies currentStatus = 'confirmed'");

    // 10. Verify User sees Confirmed Trip
    console.log("\n[10] Verifying user sees updated confirmed status...");
    const userUpdatedRes = await fetch(`${API_BASE}/bookings/my/${bookingId}`, {
      headers: { "Authorization": `Bearer ${userToken}` }
    });
    const userUpdatedData = await userUpdatedRes.json();
    assert(userUpdatedData.booking?.status === "confirmed", "User's booking now shows status = 'confirmed'");
    assert(Boolean(userUpdatedData.booking?.confirmedByName), "User's booking reflects admin authorizer name");

    // 11. Test Rejection Workflow with another booking
    console.log("\n[11] Testing rejection workflow with a second booking...");
    const createSecondRes = await fetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userToken}`
      },
      body: JSON.stringify({
        destinationId: 3, // Gokarna
        startDate: "2026-12-01",
        endDate: "2026-12-05",
        travellers: 2,
        contactName: "Roamly Test Traveler",
        contactEmail: "testuser@example.com"
      })
    });
    const secondBookingData = await createSecondRes.json();
    const secondBookingId = secondBookingData.booking.id;

    const rejectRes = await fetch(`${API_BASE}/bookings/admin/${secondBookingId}/reject`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        rejectionReason: "Beach resort renovation scheduled during requested dates"
      })
    });
    const rejectData = await rejectRes.json();
    assert(rejectRes.status === 200, "Booking rejected successfully with 200 OK");
    assert(rejectData.booking.status === "rejected", "Booking status updated to 'rejected'");
    assert(rejectData.booking.rejectionReason.includes("renovation"), "Rejection reason saved in database");

    // 12. Test User Cancellation on a third pending booking
    console.log("\n[12] Testing user cancellation of own pending booking...");
    const createThirdRes = await fetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userToken}`
      },
      body: JSON.stringify({
        destinationId: 4, // Spiti
        startDate: "2026-12-10",
        endDate: "2026-12-18",
        travellers: 1,
        contactName: "Roamly Test Traveler",
        contactEmail: "testuser@example.com"
      })
    });
    const thirdBookingData = await createThirdRes.json();
    const thirdBookingId = thirdBookingData.booking.id;

    const cancelRes = await fetch(`${API_BASE}/bookings/${thirdBookingId}/cancel`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${userToken}` }
    });
    assert(cancelRes.status === 200, "User successfully cancelled own pending booking");

    // 13. Test Validation: Invalid dates (past date)
    console.log("\n[13] Testing server-side input validation...");
    const pastDateRes = await fetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userToken}`
      },
      body: JSON.stringify({
        destinationId: 1,
        startDate: "2020-01-01",
        endDate: "2020-01-05",
        travellers: 2,
        contactName: "Test",
        contactEmail: "test@example.com"
      })
    });
    assert(pastDateRes.status === 400, "Past travel date rejected with 400 Bad Request");

    // Final summary
    console.log("\n==================================================================");
    console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================================");

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error("Test execution failed:", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runTests();
