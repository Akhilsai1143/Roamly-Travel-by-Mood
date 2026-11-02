import apiClient from "./client.js";

/**
 * Fetch public Razorpay payment gateway configuration (Test Key ID)
 */
export async function getPaymentConfig() {
  const response = await apiClient.get("/payments/config");
  return response.data;
}

/**
 * Request creation of a Razorpay Order for a specific booking
 * @param {number|string} bookingId
 */
export async function createPaymentOrder(bookingId) {
  const response = await apiClient.post("/payments/order", { bookingId });
  return response.data;
}

/**
 * Verify cryptographic payment signature on the backend
 * @param {Object} paymentData { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
export async function verifyPayment(paymentData) {
  const response = await apiClient.post("/payments/verify", paymentData);
  return response.data;
}

/**
 * Admin: Fetch payment logs with search, status filters, and pagination
 * @param {Object} params { search, status, dateFrom, dateTo, sortBy, page, limit }
 */
export async function getAdminPaymentLogs(params = {}) {
  const response = await apiClient.get("/payments/admin/logs", { params });
  return response.data;
}

