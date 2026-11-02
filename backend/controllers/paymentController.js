const pool = require("../config/db");
const {
  razorpay,
  keyId,
  hasCredentials,
  verifyPaymentSignature,
  verifyWebhookSignature,
} = require("../config/razorpay");
const { notifyBookingStatusUpdated } = require("../config/socket");

// Helper to format booking query
function getBookingQuery(whereClause) {
  return `
    SELECT
      b.*,
      u.name AS user_name,
      u.email AS user_email,
      d.name AS destination_name,
      d.image AS destination_image,
      d.country AS destination_country,
      d.state AS destination_state,
      d.budget AS destination_budget
    FROM bookings b
    LEFT JOIN users u ON u.id = b.user_id
    LEFT JOIN destinations d ON d.id = b.destination_id
    WHERE ${whereClause}
    LIMIT 1
  `;
}

/**
 * 1. GET /api/payments/config
 * Exposes the public/test Key ID to authenticated frontend clients
 */
exports.getConfig = async (req, res) => {
  try {
    if (!keyId) {
      return res.status(500).json({
        success: false,
        message: "Razorpay Key ID is not configured on the server."
      });
    }

    res.json({
      success: true,
      keyId: keyId,
      currency: "INR"
    });
  } catch (error) {
    console.error("Error fetching payment config:", error);
    res.status(500).json({
      success: false,
      message: "Unable to retrieve payment configuration."
    });
  }
};

/**
 * 2. POST /api/payments/order
 * Authenticated endpoint: Validates booking and creates Razorpay Order with server-calculated amount
 */
exports.createOrder = async (req, res) => {
  try {
    if (!hasCredentials()) {
      return res.status(503).json({
        success: false,
        message: "Razorpay payment gateway is not configured. Please check server environment keys."
      });
    }

    const userId = req.user.id;
    const { bookingId, bookingReference } = req.body;

    if (!bookingId && !bookingReference) {
      return res.status(400).json({
        success: false,
        message: "A valid bookingId or bookingReference is required to initiate payment."
      });
    }

    // 1. Fetch booking with destination details
    let whereClause = "b.id = ?";
    let whereParam = bookingId;

    if (!bookingId && bookingReference) {
      whereClause = "b.booking_reference = ?";
      whereParam = bookingReference;
    }

    const [bookings] = await pool.query(getBookingQuery(whereClause), [whereParam]);

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found."
      });
    }

    const booking = bookings[0];

    // 2. Validate booking ownership
    if (booking.user_id !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to make payments for this booking."
      });
    }

    // 3. Validate booking state
    if (booking.status === "cancelled" || booking.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: `Cannot initiate payment for a ${booking.status} booking.`
      });
    }

    if (booking.payment_status === "paid") {
      return res.status(400).json({
        success: false,
        message: "This booking has already been paid for and confirmed."
      });
    }

    // 4. Calculate trusted amount on the server (Never trust client-supplied amounts!)
    let totalRupees = null;

    if (booking.estimated_total && Number(booking.estimated_total) > 0) {
      totalRupees = Number(booking.estimated_total);
    } else if (booking.estimated_budget && Number(booking.estimated_budget) > 0) {
      totalRupees = Number(booking.estimated_budget);
    } else if (booking.destination_budget) {
      const match = String(booking.destination_budget).replace(/[,\s]/g, "").match(/₹?(\d+)/);
      const basePrice = match ? parseInt(match[1], 10) : 5000;
      const count = Number(booking.travellers) || 1;
      totalRupees = basePrice * count;
    } else {
      totalRupees = 5000 * (Number(booking.travellers) || 1);
    }

    // Amount in integer paise (1 INR = 100 paise)
    const amountInPaise = Math.round(totalRupees * 100);

    if (amountInPaise < 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking calculation. Minimum payable amount is ₹1.00."
      });
    }

    // 5. Check if an active order already exists in our database for this booking
    const [existingPayments] = await pool.query(
      `SELECT * FROM payments 
       WHERE booking_id = ? AND status = 'created' AND amount = ? 
       ORDER BY created_at DESC LIMIT 1`,
      [booking.id, amountInPaise]
    );

    if (existingPayments.length > 0) {
      const existing = existingPayments[0];
      return res.json({
        success: true,
        orderId: existing.razorpay_order_id,
        amount: existing.amount,
        currency: existing.currency,
        keyId: keyId,
        bookingId: booking.id,
        bookingReference: booking.booking_reference,
        customer: {
          name: booking.contact_name || req.user.name,
          email: booking.contact_email || req.user.email,
          phone: booking.contact_phone || req.user.phone || ""
        }
      });
    }

    // 6. Create Razorpay order via official SDK
    const receiptCode = String(booking.booking_reference || `RMY-${booking.id}`).slice(0, 40);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: receiptCode,
      notes: {
        bookingId: String(booking.id),
        bookingReference: String(booking.booking_reference || ""),
        userId: String(userId),
        destination: String(booking.destination_name || "Roamly Escape").slice(0, 50)
      }
    });

    // 7. Persist payment record in MySQL
    await pool.query(
      `INSERT INTO payments 
         (booking_id, user_id, razorpay_order_id, amount, currency, status) 
       VALUES (?, ?, ?, ?, 'INR', 'created')`,
      [booking.id, userId, razorpayOrder.id, amountInPaise]
    );

    // Update booking payment_status to pending
    await pool.query(
      "UPDATE bookings SET payment_status = 'pending' WHERE id = ? AND payment_status = 'unpaid'",
      [booking.id]
    );

    res.status(201).json({
      success: true,
      orderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: "INR",
      keyId: keyId,
      bookingId: booking.id,
      bookingReference: booking.booking_reference,
      customer: {
        name: booking.contact_name || req.user.name,
        email: booking.contact_email || req.user.email,
        phone: booking.contact_phone || req.user.phone || ""
      }
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({
      success: false,
      message: error.error?.description || error.message || "Failed to create payment order."
    });
  }
};

/**
 * 3. POST /api/payments/verify
 * Authenticated endpoint: Verifies HMAC SHA-256 signature and updates booking/payment status in a transaction
 */
exports.verifyPayment = async (req, res) => {
  const conn = await pool.getConnection();

  try {
    const userId = req.user.id;
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay payment verification parameters."
      });
    }

    // 1. Verify cryptographic HMAC SHA-256 signature
    const isValidSignature = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });

    if (!isValidSignature) {
      console.warn(`[SECURITY ALERT] Invalid Razorpay signature attempt on order: ${razorpay_order_id}`);
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature. Verification failed."
      });
    }

    // 2. Begin database transaction
    await conn.beginTransaction();

    // 3. Find and lock the local payment record
    const [payments] = await conn.query(
      "SELECT * FROM payments WHERE razorpay_order_id = ? FOR UPDATE",
      [razorpay_order_id]
    );

    if (payments.length === 0) {
      await conn.rollback();
      return res.status(404).json({
        success: false,
        message: "Payment order record not found in system."
      });
    }

    const payment = payments[0];

    // Check ownership
    if (payment.user_id !== userId && req.user.role !== "admin") {
      await conn.rollback();
      return res.status(403).json({
        success: false,
        message: "Unauthorized payment confirmation attempt."
      });
    }

    // Check if already captured
    if (payment.status === "captured") {
      await conn.commit();
      return res.json({
        success: true,
        message: "Payment was already verified and captured.",
        bookingId: payment.booking_id,
        paymentId: payment.razorpay_payment_id,
        status: "captured"
      });
    }

    // 4. Update payments table to 'captured'
    await conn.query(
      `UPDATE payments 
       SET status = 'captured',
           razorpay_payment_id = ?,
           razorpay_signature = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [razorpay_payment_id, razorpay_signature, payment.id]
    );

    // 5. Update bookings table to 'confirmed' and payment_status to 'paid'
    await conn.query(
      `UPDATE bookings
       SET payment_status = 'paid',
           payment_id = ?,
           status = 'confirmed',
           confirmed_at = NOW()
       WHERE id = ?`,
      [razorpay_payment_id, payment.booking_id]
    );

    // Commit transaction
    await conn.commit();

    // 6. Fetch full updated booking for client response and real-time Socket notification
    const [updatedRows] = await pool.query(getBookingQuery("b.id = ?"), [payment.booking_id]);
    const updatedBooking = updatedRows[0] || null;

    if (updatedBooking) {
      notifyBookingStatusUpdated(updatedBooking);
    }

    res.json({
      success: true,
      message: "Payment verified successfully. Your booking is confirmed!",
      bookingId: payment.booking_id,
      paymentId: razorpay_payment_id,
      booking: updatedBooking
    });
  } catch (error) {
    await conn.rollback();
    console.error("Error verifying Razorpay payment:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed due to internal error."
    });
  } finally {
    conn.release();
  }
};

/**
 * 4. POST /api/payments/webhook
 * Public endpoint called by Razorpay servers through ngrok forwarding.
 * Validates HMAC SHA-256 signature using raw body buffer, processes events idempotently in database transaction.
 */
exports.handleWebhook = async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];

  if (!signature) {
    return res.status(400).json({
      success: false,
      message: "Missing X-Razorpay-Signature header."
    });
  }

  // Raw body buffer captured by verify callback in express.json
  const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));

  // 1. Verify webhook signature against raw request body
  const isValid = verifyWebhookSignature(rawBody, signature);

  if (!isValid) {
    console.warn("[WEBHOOK ALERT] Webhook signature validation failed.");
    return res.status(400).json({
      success: false,
      message: "Invalid webhook signature."
    });
  }

  // 2. Parse event payload safely
  let eventPayload = null;
  try {
    eventPayload = typeof req.body === "object" && Object.keys(req.body).length > 0
      ? req.body
      : JSON.parse(rawBody.toString("utf-8"));
  } catch (err) {
    console.error("Malformed webhook JSON payload:", err.message);
    return res.status(400).json({
      success: false,
      message: "Malformed JSON payload."
    });
  }

  const eventId = eventPayload.id;
  const eventType = eventPayload.event;

  if (!eventId || !eventType) {
    return res.status(400).json({
      success: false,
      message: "Incomplete event payload."
    });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 3. Idempotency Check: Prevent duplicate event processing
    const [existingEvents] = await conn.query(
      "SELECT id FROM payment_webhook_events WHERE event_id = ? LIMIT 1 FOR UPDATE",
      [eventId]
    );

    if (existingEvents.length > 0) {
      await conn.commit();
      return res.status(200).json({
        success: true,
        message: "Webhook event already processed (idempotent)."
      });
    }

    // 4. Handle supported event types
    if (eventType === "payment.captured" || eventType === "order.paid") {
      const paymentEntity = eventPayload.payload?.payment?.entity;
      const orderEntity = eventPayload.payload?.order?.entity;

      const orderId = paymentEntity?.order_id || orderEntity?.id;
      const paymentId = paymentEntity?.id;
      const method = paymentEntity?.method || null;

      if (orderId) {
        // Find local payment record
        const [payments] = await conn.query(
          "SELECT * FROM payments WHERE razorpay_order_id = ? FOR UPDATE",
          [orderId]
        );

        if (payments.length > 0) {
          const payment = payments[0];

          // Update payment to captured
          await conn.query(
            `UPDATE payments 
             SET status = 'captured',
                 razorpay_payment_id = COALESCE(?, razorpay_payment_id),
                 method = COALESCE(?, method),
                 updated_at = NOW()
             WHERE id = ?`,
            [paymentId, method, payment.id]
          );

          // Update associated booking to paid & confirmed
          await conn.query(
            `UPDATE bookings 
             SET payment_status = 'paid',
                 payment_id = COALESCE(?, payment_id),
                 status = 'confirmed',
                 confirmed_at = COALESCE(confirmed_at, NOW())
             WHERE id = ?`,
            [paymentId, payment.booking_id]
          );

          // Real-time Socket.io notification
          const [updatedRows] = await conn.query(getBookingQuery("b.id = ?"), [payment.booking_id]);
          if (updatedRows.length > 0) {
            notifyBookingStatusUpdated(updatedRows[0]);
          }
        }
      }
    } else if (eventType === "payment.failed") {
      const paymentEntity = eventPayload.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const errorCode = paymentEntity?.error_code || null;
      const errorDesc = paymentEntity?.error_description || null;

      if (orderId) {
        const [payments] = await conn.query(
          "SELECT * FROM payments WHERE razorpay_order_id = ? FOR UPDATE",
          [orderId]
        );

        if (payments.length > 0) {
          const payment = payments[0];

          // CRITICAL SECURITY RULE: A failed event must NEVER downgrade a captured payment!
          if (payment.status !== "captured") {
            await conn.query(
              `UPDATE payments 
               SET status = 'failed',
                   error_code = ?,
                   error_description = ?,
                   updated_at = NOW()
               WHERE id = ?`,
              [errorCode, errorDesc, payment.id]
            );

            // Update booking payment_status to failed (only if not confirmed/paid)
            await conn.query(
              `UPDATE bookings 
               SET payment_status = 'failed' 
               WHERE id = ? AND payment_status != 'paid'`,
              [payment.booking_id]
            );
          }
        }
      }
    }

    // 5. Record processed event in payment_webhook_events
    await conn.query(
      `INSERT INTO payment_webhook_events 
         (event_id, event_type, razorpay_payment_id, razorpay_order_id, payload) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        eventId,
        eventType,
        eventPayload.payload?.payment?.entity?.id || null,
        eventPayload.payload?.payment?.entity?.order_id || eventPayload.payload?.order?.entity?.id || null,
        JSON.stringify(eventPayload)
      ]
    );

    await conn.commit();

    // Razorpay expects 200 HTTP response for received webhooks
    res.status(200).json({
      success: true,
      status: "ok",
      event: eventType,
      eventId: eventId
    });
  } catch (error) {
    await conn.rollback();
    console.error("Webhook processing database error:", error);
    res.status(500).json({
      success: false,
      message: "Webhook processing encountered database error."
    });
  } finally {
    conn.release();
  }
};

/**
 * 5. GET /api/payments/admin/logs
 * Administrator endpoint: Retrieves comprehensive payment logs, transaction statuses, and analytics
 */
exports.getAdminPaymentLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const search = (req.query.search || req.query.q || "").trim();
    const status = (req.query.status || "all").trim().toLowerCase();
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : null;
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : null;
    const sortBy = req.query.sortBy || "newest";

    // Build WHERE clauses safely using parameterized inputs
    const whereConditions = [];
    const queryParams = [];

    if (search) {
      whereConditions.push(`(
        p.id LIKE ? OR
        p.razorpay_order_id LIKE ? OR
        p.razorpay_payment_id LIKE ? OR
        b.booking_reference LIKE ? OR
        u.name LIKE ? OR
        u.email LIKE ?
      )`);
      const searchParam = `%${search}%`;
      queryParams.push(
        searchParam,
        searchParam,
        searchParam,
        searchParam,
        searchParam,
        searchParam
      );
    }

    if (status && status !== "all") {
      whereConditions.push("p.status = ?");
      queryParams.push(status);
    }

    if (dateFrom && !isNaN(dateFrom.getTime())) {
      whereConditions.push("p.created_at >= ?");
      queryParams.push(dateFrom.toISOString().slice(0, 19).replace("T", " "));
    }

    if (dateTo && !isNaN(dateTo.getTime())) {
      whereConditions.push("p.created_at <= ?");
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      queryParams.push(endOfDay.toISOString().slice(0, 19).replace("T", " "));
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    // Determine Sort Order
    let orderBySql = "ORDER BY p.created_at DESC";
    if (sortBy === "oldest") {
      orderBySql = "ORDER BY p.created_at ASC";
    } else if (sortBy === "amount_desc") {
      orderBySql = "ORDER BY p.amount DESC";
    } else if (sortBy === "amount_asc") {
      orderBySql = "ORDER BY p.amount ASC";
    }

    // 1. Count matching rows
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM payments p
      LEFT JOIN bookings b ON b.id = p.booking_id
      LEFT JOIN users u ON u.id = p.user_id
      ${whereSql}
    `;
    const [countRows] = await pool.query(countQuery, queryParams);
    const totalItems = countRows[0]?.total || 0;
    const totalPages = Math.ceil(totalItems / limit) || 1;

    // 2. Fetch paginated records
    const dataQuery = `
      SELECT 
        p.id,
        p.booking_id,
        p.user_id,
        p.razorpay_order_id,
        p.razorpay_payment_id,
        p.amount,
        p.currency,
        p.status,
        p.method,
        p.error_code,
        p.error_description,
        p.created_at,
        p.updated_at,
        b.booking_reference,
        b.destination_name_snapshot,
        b.status AS booking_status,
        b.start_date,
        b.end_date,
        b.travellers,
        u.name AS user_name,
        u.email AS user_email,
        u.phone AS user_phone
      FROM payments p
      LEFT JOIN bookings b ON b.id = p.booking_id
      LEFT JOIN users u ON u.id = p.user_id
      ${whereSql}
      ${orderBySql}
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(dataQuery, [...queryParams, limit, offset]);

    // 3. Compute aggregate statistics across entire payments table
    const [statsRows] = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(CASE WHEN status = 'captured' THEN 1 END) AS captured,
        COUNT(CASE WHEN status IN ('created', 'attempted') THEN 1 END) AS pending,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) AS failed,
        COUNT(CASE WHEN status = 'refunded' THEN 1 END) AS refunded,
        COALESCE(SUM(CASE WHEN status = 'captured' THEN amount ELSE 0 END), 0) AS total_revenue_paise
      FROM payments
    `);

    const stats = {
      total: Number(statsRows[0]?.total || 0),
      captured: Number(statsRows[0]?.captured || 0),
      pending: Number(statsRows[0]?.pending || 0),
      failed: Number(statsRows[0]?.failed || 0),
      refunded: Number(statsRows[0]?.refunded || 0),
      totalRevenuePaise: Number(statsRows[0]?.total_revenue_paise || 0),
      totalRevenueRupees: Math.round(Number(statsRows[0]?.total_revenue_paise || 0) / 100)
    };

    // Format rows for frontend consumption
    const formattedPayments = rows.map((row) => ({
      id: row.id,
      bookingId: row.booking_id,
      bookingReference: row.booking_reference || `RMY-${row.booking_id}`,
      destinationName: row.destination_name_snapshot || "Roamly Destination",
      bookingStatus: row.booking_status || "unknown",
      travelDates: {
        startDate: row.start_date,
        endDate: row.end_date,
        travellers: row.travellers
      },
      userId: row.user_id,
      userName: row.user_name || "Unknown User",
      userEmail: row.user_email || "N/A",
      userPhone: row.user_phone || "N/A",
      razorpayOrderId: row.razorpay_order_id,
      razorpayPaymentId: row.razorpay_payment_id || null,
      amountPaise: row.amount,
      amountRupees: Math.round(row.amount / 100),
      currency: row.currency || "INR",
      status: row.status,
      method: row.method || (row.status === "captured" ? "card / upi" : "pending"),
      errorCode: row.error_code || null,
      errorDescription: row.error_description || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return res.json({
      success: true,
      payments: formattedPayments,
      stats,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error("Error retrieving admin payment logs:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching payment logs."
    });
  }
};

