const Razorpay = require("razorpay");
const crypto = require("crypto");

const keyId = process.env.RAZORPAY_KEY_ID || "";
const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

let razorpay = null;

if (keyId && keySecret) {
  try {
    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  } catch (err) {
    console.error("Failed to initialize Razorpay SDK client:", err.message);
  }
}

function hasCredentials() {
  return Boolean(keyId && keySecret && razorpay);
}

/**
 * Validate payment signature sent by frontend upon Checkout completion
 * Formula: HMAC_SHA256(order_id + "|" + payment_id, key_secret) === signature
 */
function verifyPaymentSignature({ orderId, paymentId, signature }) {
  if (!orderId || !paymentId || !signature || !keySecret) {
    return false;
  }

  try {
    const generated = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(generated, "utf-8"),
      Buffer.from(signature, "utf-8")
    );
  } catch (err) {
    console.error("Error verifying payment signature:", err.message);
    return false;
  }
}

/**
 * Validate webhook signature sent by Razorpay webhook headers
 * Formula: HMAC_SHA256(raw_request_body, webhook_secret) === X-Razorpay-Signature
 */
function verifyWebhookSignature(rawBody, signature) {
  if (!rawBody || !signature || !webhookSecret) {
    return false;
  }

  try {
    const rawBuffer = Buffer.isBuffer(rawBody)
      ? rawBody
      : Buffer.from(typeof rawBody === "string" ? rawBody : JSON.stringify(rawBody), "utf-8");

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBuffer)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf-8"),
      Buffer.from(signature, "utf-8")
    );
  } catch (err) {
    console.error("Error verifying webhook signature:", err.message);
    return false;
  }
}

module.exports = {
  razorpay,
  keyId,
  hasCredentials,
  verifyPaymentSignature,
  verifyWebhookSignature,
};
