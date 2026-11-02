const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// ----------------------------------------------------------------------------
// PUBLIC WEBHOOK ENDPOINT
// Matched to: POST /api/payments/webhook
// Razorpay signs this with HMAC SHA-256 in X-Razorpay-Signature
// ----------------------------------------------------------------------------
router.post("/webhook", paymentController.handleWebhook);

// ----------------------------------------------------------------------------
// AUTHENTICATED USER PAYMENT ENDPOINTS
// ----------------------------------------------------------------------------

// 1. Get public Razorpay key ID & config
router.get("/config", protect, paymentController.getConfig);

// 2. Create Razorpay order for a booking (amount calculated securely on server)
router.post("/order", protect, paymentController.createOrder);

// 3. Verify Razorpay payment signature & confirm booking
router.post("/verify", protect, paymentController.verifyPayment);

// ----------------------------------------------------------------------------
// ADMIN PAYMENT LOGS ENDPOINT (Requires Admin Role)
// ----------------------------------------------------------------------------

// 4. View all payment records with filters, search, and pagination
router.get("/admin/logs", protect, adminOnly, paymentController.getAdminPaymentLogs);

module.exports = router;

