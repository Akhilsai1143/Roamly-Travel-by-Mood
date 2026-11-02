import axios from "axios";
import { API_BASE } from "./client.js";
const BOOKINGS_URL = `${API_BASE}/bookings`;

function getAuthConfig() {
  const token = localStorage.getItem("roamly-token");
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
}

// ----------------------------------------------------------------------------
// USER BOOKING APIS
// ----------------------------------------------------------------------------

/**
 * Submit a new trip booking or hotel reservation request
 * @param {Object} data Booking details (destinationId, startDate, endDate, travellers, contactName, contactEmail, contactPhone, specialRequests, estimatedBudget, bookingType, hotelId, hotelName, hotelLocation, hotelImage, roomType, roomNumber, roomsCount)
 */
export async function createBooking(data) {
  const response = await axios.post(BOOKINGS_URL, data, getAuthConfig());
  return response.data;
}

/**
 * Fetch authenticated user's bookings with optional status filter
 * @param {Object} params { status: 'all' | 'pending' | 'confirmed' | 'rejected' | 'cancelled' }
 */
export async function getMyBookings(params = {}) {
  const response = await axios.get(`${BOOKINGS_URL}/my`, {
    ...getAuthConfig(),
    params
  });
  return response.data;
}

/**
 * Fetch single booking owned by current user
 * @param {number|string} id Booking ID
 */
export async function getMyBooking(id) {
  const response = await axios.get(`${BOOKINGS_URL}/my/${id}`, getAuthConfig());
  return response.data;
}

/**
 * Fetch user's booking counts and stats
 */
export async function getMyStats() {
  const response = await axios.get(`${BOOKINGS_URL}/my/stats`, getAuthConfig());
  return response.data;
}

/**
 * User cancels their own pending booking
 * @param {number|string} id Booking ID
 */
export async function cancelMyBooking(id) {
  const response = await axios.patch(
    `${BOOKINGS_URL}/${id}/cancel`,
    {},
    getAuthConfig()
  );
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
  const response = await axios.get(`${BOOKINGS_URL}/admin`, {
    ...getAuthConfig(),
    params
  });
  return response.data;
}

/**
 * Admin: Fetch aggregate booking statistics
 */
export async function getAdminStats() {
  const response = await axios.get(`${BOOKINGS_URL}/admin/stats`, getAuthConfig());
  return response.data;
}

/**
 * Admin: Confirm a pending booking request
 * @param {number|string} id Booking ID
 * @param {string} roomNumber Optional assigned room number for hotels
 */
export async function confirmBooking(id, roomNumber = null) {
  const response = await axios.patch(
    `${BOOKINGS_URL}/admin/${id}/confirm`,
    { roomNumber },
    getAuthConfig()
  );
  return response.data;
}

/**
 * Admin: Reject a pending booking request with optional reason
 * @param {number|string} id Booking ID
 * @param {string} rejectionReason Optional explanation for rejection
 */
export async function rejectBooking(id, rejectionReason = "") {
  const response = await axios.patch(
    `${BOOKINGS_URL}/admin/${id}/reject`,
    { rejectionReason },
    getAuthConfig()
  );
  return response.data;
}

/**
 * Admin: Update / assign room number for a booking
 * @param {number|string} id Booking ID
 * @param {string} roomNumber Assigned room number
 */
export async function updateBookingRoomNumber(id, roomNumber) {
  const response = await axios.patch(
    `${BOOKINGS_URL}/admin/${id}/room-number`,
    { roomNumber },
    getAuthConfig()
  );
  return response.data;
}

/**
 * Fetch immutable package details snapshot for a booking (Requirement 1A & 1B)
 * @param {number|string} id Booking ID or Booking Reference
 */
export async function getBookingPackageDetails(id) {
  const response = await axios.get(
    `${BOOKINGS_URL}/${id}/package-details`,
    getAuthConfig()
  );
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
