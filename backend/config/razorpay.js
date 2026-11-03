const Razorpay = require("razorpay");
const crypto = require("crypto");
const path = require("path");

// Safely load environment variables if .env is present
try {
  require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
} catch {}

// Default verified Razorpay Test Mode credentials for Roamly
const DEFAULT_KEY_ID = "rzp_test_TtE3CKhG9LV1wh";
const DEFAULT_KEY_SECRET = "lyIEj0Nx063dQ0n4ALPNxOFu";
const DEFAULT_WEBHOOK_SECRET = "Akhil$1143";

function getKeyId() {
  const envKey = (process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "").trim();
  return envKey || DEFAULT_KEY_ID;
}

function getKeySecret() {
  const envSecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
  return envSecret || DEFAULT_KEY_SECRET;
}

function getWebhookSecret() {
  const envWebhook = (process.env.RAZORPAY_WEBHOOK_SECRET || "").trim();
  return envWebhook || DEFAULT_WEBHOOK_SECRET;
}

function getRazorpayClient() {
  const id = getKeyId();
  const secret = getKeySecret();
  if (!id || !secret) return null;
  try {
    return new Razorpay({
      key_id: id,
      key_secret: secret
    });
  } catch (err) {
    console.error("Failed to initialize Razorpay SDK client:", err.message);
    return null;
  }
}

function hasCredentials() {
  const id = getKeyId();
  const secret = getKeySecret();
  return Boolean(id && secret);
}

/**
 * Validate payment signature sent by frontend upon Checkout completion
 * Formula: HMAC_SHA256(order_id + "|" + payment_id, key_secret) === signature
 */
function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const secret = getKeySecret();
  if (!orderId || !paymentId || !signature || !secret) {
    return false;
  }

  try {
    const generated = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (Buffer.from(generated).length !== Buffer.from(signature).length) {
      return false;
    }

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
  const secret = getWebhookSecret();
  if (!rawBody || !signature || !secret) {
    return false;
  }

  try {
    const rawBuffer = Buffer.isBuffer(rawBody)
      ? rawBody
      : Buffer.from(typeof rawBody === "string" ? rawBody : JSON.stringify(rawBody), "utf-8");

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBuffer)
      .digest("hex");

    if (Buffer.from(expectedSignature).length !== Buffer.from(signature).length) {
      return false;
    }

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
  get razorpay() {
    return getRazorpayClient();
  },
  get keyId() {
    return getKeyId();
  },
  get keySecret() {
    return getKeySecret();
  },
  get webhookSecret() {
    return getWebhookSecret();
  },
  getKeyId,
  getKeySecret,
  getWebhookSecret,
  getRazorpayClient,
  hasCredentials,
  verifyPaymentSignature,
  verifyWebhookSignature
};
