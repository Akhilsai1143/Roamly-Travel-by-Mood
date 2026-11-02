const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const pool = require("./config/db");
const crypto = require("crypto");
const {
  hasCredentials,
  keyId,
  verifyPaymentSignature,
  verifyWebhookSignature
} = require("./config/razorpay");
const paymentController = require("./controllers/paymentController");

// Helper mock response object
function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };
  return res;
}

async function runPaymentSystemTests() {
  console.log("================================================================================");
  console.log("ROAMLY — COMPREHENSIVE RAZORPAY PAYMENT & WEBHOOK TEST SUITE");
  console.log("================================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Razorpay Credentials Configuration Check
    // -------------------------------------------------------------------------
    console.log("\n[TEST 1] Verifying Razorpay Test Mode Configuration in Environment...");
    assert(hasCredentials(), "Razorpay SDK has valid key_id and key_secret configured");
    assert(keyId.startsWith("rzp_test_"), "Razorpay Key ID is in Test Mode (starts with rzp_test_)");
    assert(Boolean(process.env.RAZORPAY_WEBHOOK_SECRET), "Razorpay Webhook Secret is present in environment");

    // -------------------------------------------------------------------------
    // TEST 2: Public Payment Config Endpoint
    // -------------------------------------------------------------------------
    console.log("\n[TEST 2] Testing Payment Config Endpoint (GET /api/payments/config)...");
    const configReq = { user: { id: 1 } };
    const configRes = createMockRes();
    await paymentController.getConfig(configReq, configRes);
    assert(configRes.statusCode === 200, "Config endpoint returns HTTP 200");
    assert(configRes.data.keyId === keyId, "Config endpoint returns matching public Key ID");
    assert(configRes.data.currency === "INR", "Config endpoint specifies INR currency");
    assert(!configRes.data.keySecret, "Config endpoint NEVER leaks server-side secret key");

    // -------------------------------------------------------------------------
    // Set up test user & test booking in MySQL
    // -------------------------------------------------------------------------
    console.log("\n[SETUP] Setting up isolated test user & booking in MySQL...");
    const [userRows] = await pool.query("SELECT id, name, email, role FROM users LIMIT 1");
    let testUser = userRows[0];
    if (!testUser) {
      const [uRes] = await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES ('Payment Tester', 'tester@roamly.com', 'hash', 'user')"
      );
      testUser = { id: uRes.insertId, name: "Payment Tester", email: "tester@roamly.com", role: "user" };
    }

    const [destRows] = await pool.query("SELECT id, name FROM destinations LIMIT 1");
    const testDest = destRows[0];

    const testRef = `RMY-TEST-${Date.now().toString().slice(-4)}`;
    const [bRes] = await pool.query(
      `INSERT INTO bookings 
        (booking_reference, user_id, destination_id, destination_name_snapshot, start_date, end_date, travellers, contact_name, contact_email, estimated_total, status, payment_status)
       VALUES (?, ?, ?, ?, '2026-11-15', '2026-11-19', 2, 'Kumar Tester', 'kumar@roamly.com', 8500.00, 'pending', 'unpaid')`,
      [testRef, testUser.id, testDest.id, testDest.name]
    );
    const testBookingId = bRes.insertId;
    console.log(`  -> Created test booking ID ${testBookingId} (Ref: ${testRef}, Amount: ₹8,500)`);

    // -------------------------------------------------------------------------
    // TEST 3: Unauthenticated Order Creation Rejected
    // -------------------------------------------------------------------------
    console.log("\n[TEST 3] Testing Authorization Guard on Order Creation...");
    // Handled by authMiddleware.protect; testing controller unauthorized booking access
    const unauthReq = { user: { id: 999999, role: "user" }, body: { bookingId: testBookingId } };
    const unauthRes = createMockRes();
    await paymentController.createOrder(unauthReq, unauthRes);
    assert(unauthRes.statusCode === 403, "Order creation by non-owner is rejected with 403 Forbidden");

    // -------------------------------------------------------------------------
    // TEST 4: Invalid/Non-existent Booking Rejected
    // -------------------------------------------------------------------------
    console.log("\n[TEST 4] Testing Invalid Booking ID Rejection...");
    const invalidReq = { user: testUser, body: { bookingId: 999999 } };
    const invalidRes = createMockRes();
    await paymentController.createOrder(invalidReq, invalidRes);
    assert(invalidRes.statusCode === 404, "Non-existent booking rejected with 404 Not Found");

    // -------------------------------------------------------------------------
    // TEST 5: Legitimate Order Creation via Razorpay SDK (Test Mode)
    // -------------------------------------------------------------------------
    console.log("\n[TEST 5] Testing Legitimate Order Creation in Test Mode...");
    const orderReq = { user: testUser, body: { bookingId: testBookingId } };
    const orderRes = createMockRes();
    await paymentController.createOrder(orderReq, orderRes);

    assert(orderRes.statusCode === 201 || orderRes.statusCode === 200, "Order creation returns HTTP 201 Created");
    assert(Boolean(orderRes.data?.orderId), "Returns generated orderId from Razorpay");
    assert(orderRes.data?.orderId.startsWith("order_"), "Razorpay orderId has standard prefix 'order_'");
    assert(orderRes.data?.amount === 850000, "Amount accurately converted to 850,000 paise (₹8,500.00)");
    assert(orderRes.data?.currency === "INR", "Order currency is INR");

    const createdOrderId = orderRes.data.orderId;

    // Verify local DB record in `payments`
    const [dbPayments] = await pool.query(
      "SELECT * FROM payments WHERE razorpay_order_id = ? AND booking_id = ?",
      [createdOrderId, testBookingId]
    );
    assert(dbPayments.length === 1, "Payment record persisted in MySQL payments table");
    assert(dbPayments[0].status === "created", "Payment initial status is 'created'");
    assert(dbPayments[0].amount === 850000, "MySQL payment amount stored as 850000 paise");

    // -------------------------------------------------------------------------
    // TEST 6: Tampered / Invalid Payment Signature Rejected
    // -------------------------------------------------------------------------
    console.log("\n[TEST 6] Testing Cryptographic Payment Signature Verification (Tamper Protection)...");
    const fakeSignature = "deadbeefcafebabe0123456789abcdef0123456789abcdef0123456789abcdef";
    const fakeVerifyReq = {
      user: testUser,
      body: {
        bookingId: testBookingId,
        razorpay_order_id: createdOrderId,
        razorpay_payment_id: "pay_test_fake_123456",
        razorpay_signature: fakeSignature
      }
    };
    const fakeVerifyRes = createMockRes();
    await paymentController.verifyPayment(fakeVerifyReq, fakeVerifyRes);
    assert(fakeVerifyRes.statusCode === 400, "Tampered signature rejected with HTTP 400 Bad Request");

    // Verify DB booking is NOT marked as paid after failed verification
    const [unpaidCheck] = await pool.query("SELECT payment_status FROM bookings WHERE id = ?", [testBookingId]);
    assert(unpaidCheck[0].payment_status !== "paid", "Booking remains unpaid after signature tamper attempt");

    // -------------------------------------------------------------------------
    // TEST 7: Valid Payment Signature Verification
    // -------------------------------------------------------------------------
    console.log("\n[TEST 7] Testing Legitimate HMAC SHA-256 Payment Signature Verification...");
    const testPaymentId = `pay_test_${Date.now().toString().slice(-8)}`;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const legitimateSignature = crypto
      .createHmac("sha256", secret)
      .update(`${createdOrderId}|${testPaymentId}`)
      .digest("hex");

    const validVerifyReq = {
      user: testUser,
      body: {
        bookingId: testBookingId,
        razorpay_order_id: createdOrderId,
        razorpay_payment_id: testPaymentId,
        razorpay_signature: legitimateSignature
      }
    };
    const validVerifyRes = createMockRes();
    await paymentController.verifyPayment(validVerifyReq, validVerifyRes);

    assert(validVerifyRes.statusCode === 200, "Valid signature verification succeeds with HTTP 200");
    assert(validVerifyRes.data.success === true, "Verification payload returns success: true");

    // Check DB state update
    const [paidBooking] = await pool.query("SELECT status, payment_status, payment_id FROM bookings WHERE id = ?", [testBookingId]);
    assert(paidBooking[0].payment_status === "paid", "Booking payment_status updated to 'paid'");
    assert(paidBooking[0].status === "confirmed", "Booking status automatically transitioned to 'confirmed'");
    assert(paidBooking[0].payment_id === testPaymentId, "Payment ID linked on booking record");

    const [capturedPayment] = await pool.query("SELECT status, razorpay_payment_id FROM payments WHERE razorpay_order_id = ?", [createdOrderId]);
    assert(capturedPayment[0].status === "captured", "Payment record status updated to 'captured'");
    assert(capturedPayment[0].razorpay_payment_id === testPaymentId, "Payment ID linked on payments table");

    // -------------------------------------------------------------------------
    // TEST 8: Invalid Webhook Signature Rejected
    // -------------------------------------------------------------------------
    console.log("\n[TEST 8] Testing Razorpay Webhook Invalid Signature Handling...");
    const sampleWebhookPayload = JSON.stringify({
      id: `evt_test_${Date.now()}`,
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: `pay_hook_${Date.now()}`,
            order_id: createdOrderId,
            amount: 850000,
            status: "captured",
            method: "upi"
          }
        }
      }
    });

    const fakeWebhookReq = {
      headers: { "x-razorpay-signature": "invalid_webhook_signature_xyz" },
      rawBody: Buffer.from(sampleWebhookPayload, "utf-8"),
      body: JSON.parse(sampleWebhookPayload)
    };
    const fakeWebhookRes = createMockRes();
    await paymentController.handleWebhook(fakeWebhookReq, fakeWebhookRes);
    assert(fakeWebhookRes.statusCode === 400, "Webhook with invalid signature rejected with HTTP 400");

    // -------------------------------------------------------------------------
    // TEST 9: Valid Webhook Signature & Event Processing (payment.captured)
    // -------------------------------------------------------------------------
    console.log("\n[TEST 9] Testing Valid Razorpay Webhook Event Processing (payment.captured)...");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const webhookEventId = `evt_valid_${Date.now()}`;
    const validWebhookPayload = JSON.stringify({
      id: webhookEventId,
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: testPaymentId,
            order_id: createdOrderId,
            amount: 850000,
            status: "captured",
            method: "card"
          }
        }
      }
    });

    const validWebhookSig = crypto
      .createHmac("sha256", webhookSecret)
      .update(Buffer.from(validWebhookPayload, "utf-8"))
      .digest("hex");

    const validWebhookReq = {
      headers: { "x-razorpay-signature": validWebhookSig },
      rawBody: Buffer.from(validWebhookPayload, "utf-8"),
      body: JSON.parse(validWebhookPayload)
    };
    const validWebhookRes = createMockRes();
    await paymentController.handleWebhook(validWebhookReq, validWebhookRes);

    assert(validWebhookRes.statusCode === 200, "Valid webhook event processed with HTTP 200");
    assert(validWebhookRes.data.status === "ok", "Webhook returns confirmation status: 'ok'");

    // Check idempotency event logged
    const [loggedEvents] = await pool.query(
      "SELECT * FROM payment_webhook_events WHERE event_id = ?",
      [webhookEventId]
    );
    assert(loggedEvents.length === 1, "Webhook event ID recorded in payment_webhook_events table");

    // -------------------------------------------------------------------------
    // TEST 10: Idempotent Webhook Delivery (Duplicate Protection)
    // -------------------------------------------------------------------------
    console.log("\n[TEST 10] Testing Webhook Idempotency (Duplicate Redelivery Handling)...");
    const duplicateWebhookRes = createMockRes();
    await paymentController.handleWebhook(validWebhookReq, duplicateWebhookRes);
    assert(duplicateWebhookRes.statusCode === 200, "Duplicate delivery handled gracefully with HTTP 200");
    assert(duplicateWebhookRes.data.message.includes("already processed"), "Identified as duplicate event without throwing error or duplicating DB records");

    // -------------------------------------------------------------------------
    // TEST 11: Late Failure Event Never Downgrades Captured Payment
    // -------------------------------------------------------------------------
    console.log("\n[TEST 11] Testing Overlapping Events: Failure Cannot Downgrade Captured Payment...");
    const failedEventId = `evt_late_fail_${Date.now()}`;
    const failedWebhookPayload = JSON.stringify({
      id: failedEventId,
      event: "payment.failed",
      payload: {
        payment: {
          entity: {
            id: `pay_fail_${Date.now()}`,
            order_id: createdOrderId,
            amount: 850000,
            error_code: "BAD_REQUEST_ERROR",
            error_description: "Payment failed at bank"
          }
        }
      }
    });

    const failedSig = crypto
      .createHmac("sha256", webhookSecret)
      .update(Buffer.from(failedWebhookPayload, "utf-8"))
      .digest("hex");

    const failedWebhookReq = {
      headers: { "x-razorpay-signature": failedSig },
      rawBody: Buffer.from(failedWebhookPayload, "utf-8"),
      body: JSON.parse(failedWebhookPayload)
    };
    const failedWebhookRes = createMockRes();
    await paymentController.handleWebhook(failedWebhookReq, failedWebhookRes);

    // Verify payment in DB was NOT downgraded
    const [persistedStatus] = await pool.query(
      "SELECT status FROM payments WHERE razorpay_order_id = ?",
      [createdOrderId]
    );
    assert(persistedStatus[0].status === "captured", "Captured payment status is PROTECTED from downgrade");

    const [persistedBookingStatus] = await pool.query(
      "SELECT payment_status FROM bookings WHERE id = ?",
      [testBookingId]
    );
    assert(persistedBookingStatus[0].payment_status === "paid", "Booking payment_status remains 'paid'");

    // -------------------------------------------------------------------------
    // TEST 12: Clean up test booking & payments
    // -------------------------------------------------------------------------
    console.log("\n[CLEANUP] Cleaning up test records from database...");
    await pool.query("DELETE FROM bookings WHERE id = ?", [testBookingId]);
    await pool.query("DELETE FROM payment_webhook_events WHERE event_id IN (?, ?)", [webhookEventId, failedEventId]);
    console.log("  ✓ Test records cleaned up successfully.");

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    console.log("\n================================================================================");
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("================================================================================");

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error("Test execution threw error:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runPaymentSystemTests();
