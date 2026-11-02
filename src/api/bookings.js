import apiClient from "./client.js";

// ----------------------------------------------------------------------------
// USER BOOKING APIS
// ----------------------------------------------------------------------------

/**
 * Submit a new trip booking or hotel reservation request
 */
export async function createBooking(data) {
  const response = await apiClient.post("/bookings", data);
  return response.data;
}

/**
 * Fetch authenticated user's bookings with optional status filter
 * @param {Object} params { status: 'all' | 'pending' | 'confirmed' | 'rejected' | 'cancelled' }
 */
export async function getMyBookings(params = {}) {
  const response = await apiClient.get("/bookings/my", { params });
  return response.data;
}

/**
 * Fetch single booking owned by current user
 * @param {number|string} id Booking ID
 */
export async function getMyBooking(id) {
  const response = await apiClient.get(`/bookings/my/${id}`);
  return response.data;
}

/**
 * Fetch user's booking counts and stats
 */
export async function getMyStats() {
  const response = await apiClient.get("/bookings/my/stats");
  return response.data;
}

/**
 * User cancels their own pending booking
 * @param {number|string} id Booking ID
 */
export async function cancelMyBooking(id) {
  const response = await apiClient.patch(`/bookings/${id}/cancel`, {});
  return response.data;
}

// ----------------------------------------------------------------------------
// ADMIN BOOKING APIS
// ----------------------------------------------------------------------------

/**
 * Admin: Fetch all bookings with search and status filters
 * @param {Object} params { search, status, sort }
 */
export async function getAdminBookings(params = {}) {
  const response = await apiClient.get("/bookings/admin", { params });
  return response.data;
}

/**
 * Admin: Fetch aggregate booking statistics
 */
export async function getAdminStats() {
  const response = await apiClient.get("/bookings/admin/stats");
  return response.data;
}

/**
 * Admin: Confirm a pending booking request
 * @param {number|string} id Booking ID
 * @param {string} roomNumber Optional assigned room number for hotels
 */
export async function confirmBooking(id, roomNumber = null) {
  const response = await apiClient.patch(`/bookings/admin/${id}/confirm`, {
    roomNumber
  });
  return response.data;
}

/**
 * Admin: Reject a pending booking request with optional reason
 * @param {number|string} id Booking ID
 * @param {string} rejectionReason Optional explanation for rejection
 */
export async function rejectBooking(id, rejectionReason = "") {
  const response = await apiClient.patch(`/bookings/admin/${id}/reject`, {
    rejectionReason
  });
  return response.data;
}

/**
 * Admin: Update / assign room number for a booking
 * @param {number|string} id Booking ID
 * @param {string} roomNumber Assigned room number
 */
export async function updateBookingRoomNumber(id, roomNumber) {
  const response = await apiClient.patch(`/bookings/admin/${id}/room-number`, {
    roomNumber
  });
  return response.data;
}

/**
 * Fetch immutable package details snapshot for a booking
 * @param {number|string} id Booking ID or Booking Reference
 */
export async function getBookingPackageDetails(id) {
  const response = await apiClient.get(`/bookings/${id}/package-details`);
  return response.data;
}

const bookingsApi = {
  createBooking,
  getMyBookings,
  getMyBooking,
  getMyStats,
  cancelMyBooking,
  getAdminBookings,
  getAdminStats,
  confirmBooking,
  rejectBooking,
  updateBookingRoomNumber,
  getBookingPackageDetails
};

export default bookingsApi;
