const express = require("express");
const router = express.Router();

const {
  createBooking,
  getMyBookings,
  getMyBookingById,
  getMyStats,
  getAllBookings,
  getAdminStats,
  confirmBooking,
  rejectBooking,
  updateBookingStatus,
  cancelMyBooking,
  getBookingPackageDetails,
  updateRoomNumber
} = require("../controllers/bookingController");

const {
  protect,
  adminOnly,
  optionalAuth
} = require("../middleware/authMiddleware");

// ----------------------------------------------------------------------------
// USER & GUEST BOOKING ROUTES
// ----------------------------------------------------------------------------

// Submit a new trip or hotel booking request (supports authenticated users & guests)
router.post("/", optionalAuth, createBooking);

// Get current logged-in user's bookings (matched by user ID or user email)
router.get("/my", protect, getMyBookings);

// Get current user's booking counts and stats
router.get("/my/stats", protect, getMyStats);

// Get a specific booking owned by the user
router.get("/my/:id", protect, getMyBookingById);

// Get immutable package details snapshot for a booking
router.get("/:id/package-details", protect, getBookingPackageDetails);

// Cancel a pending booking owned by the user
router.patch("/:id/cancel", protect, cancelMyBooking);

// ----------------------------------------------------------------------------
// ADMIN BOOKING ROUTES (Requires Admin Role)
// ----------------------------------------------------------------------------

// View all bookings across all users (with search and status filter)
router.get("/admin", protect, adminOnly, getAllBookings);
router.get("/admin/all", protect, adminOnly, getAllBookings);

// View admin booking aggregate statistics
router.get("/admin/stats", protect, adminOnly, getAdminStats);

// Confirm a pending booking (with optional room number assignment)
router.patch("/admin/:id/confirm", protect, adminOnly, confirmBooking);

// Reject a pending booking with optional reason
router.patch("/admin/:id/reject", protect, adminOnly, rejectBooking);

// Update / Assign Room Number for a booking
router.patch("/admin/:id/room-number", protect, adminOnly, updateRoomNumber);

// General status update
router.patch("/admin/:id/status", protect, adminOnly, updateBookingStatus);

module.exports = router;
