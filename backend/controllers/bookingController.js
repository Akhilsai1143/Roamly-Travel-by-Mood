const pool = require("../config/db");
const { notifyBookingCreated, notifyBookingStatusUpdated } = require("../config/socket");
const crypto = require("crypto");

const VALID_STATUSES = [
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
  "completed"
];

function safeJsonParse(data, fallback = []) {
  if (!data) return fallback;
  if (typeof data === "object") return data;
  try {
    return JSON.parse(data);
  } catch (e) {
    return fallback;
  }
}

// Helper to format booking row for consistent frontend consumption
function formatBookingRow(row) {
  if (!row) return null;

  const isHotel = row.booking_type === "hotel" || Boolean(row.hotel_name);

  return {
    id: row.id,
    bookingReference: row.booking_reference,
    bookingType: row.booking_type || (isHotel ? "hotel" : "destination"),
    hotelId: row.hotel_id || null,
    hotelName: row.hotel_name || null,
    hotelLocation: row.hotel_location || null,
    hotelImage: row.hotel_image || null,
    roomType: row.room_type || null,
    roomNumber: row.room_number || null,
    roomsCount: Number(row.rooms_count) || 1,
    userId: row.user_id,
    userName: row.user_name || null,
    userEmail: row.user_email || null,
    destinationId: row.destination_id,
    destinationName: (isHotel && row.hotel_name) ? row.hotel_name : (row.destination_name || row.destination_name_snapshot || "Roamly Destination"),
    destinationImage: (isHotel && row.hotel_image) ? row.hotel_image : (row.destination_image || null),
    destinationCountry: row.destination_country || "India",
    destinationState: (isHotel && row.hotel_location) ? row.hotel_location : (row.destination_state || null),
    startDate: row.start_date,
    endDate: row.end_date,
    travellers: Number(row.travellers) || 1,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone || null,
    estimatedBudget: row.estimated_budget ? Number(row.estimated_budget) : null,
    estimatedTotal: row.estimated_total ? Number(row.estimated_total) : (row.estimated_budget ? Number(row.estimated_budget) : null),
    specialRequests: row.special_requests || null,
    status: row.status,
    paymentStatus: row.payment_status || "unpaid",
    paymentId: row.payment_id || null,
    rejectionReason: row.rejection_reason || null,
    confirmedBy: row.confirmed_by || null,
    confirmedByName: row.confirmed_by_name || null,
    confirmedAt: row.confirmed_at || null,
    packageId: row.package_id || null,
    packageName: row.package_name_snapshot || null,
    packageTier: row.package_tier_snapshot || null,
    packageDetailsSnapshot: row.package_details_snapshot
      ? (typeof row.package_details_snapshot === "string"
          ? (() => { try { return JSON.parse(row.package_details_snapshot); } catch (e) { return null; } })()
          : row.package_details_snapshot)
      : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// Generate human-friendly booking reference (e.g. RMY-2610-8F2B)
async function generateUniqueBookingReference() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const randomHex = crypto.randomBytes(2).toString("hex").toUpperCase();
    const timeSlice = Date.now().toString().slice(-4);
    const reference = `RMY-${timeSlice}-${randomHex}`;

    const [existing] = await pool.query(
      "SELECT id FROM bookings WHERE booking_reference = ? LIMIT 1",
      [reference]
    );

    if (existing.length === 0) {
      return reference;
    }
  }
  // Fallback with timestamp and random string
  return `RMY-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
}

// Full query helper with standard joins
function getBookingBaseQuery(whereClause = "", orderBy = "ORDER BY b.created_at DESC") {
  return `
    SELECT
      b.*,
      u.name AS user_name,
      u.email AS user_email,
      d.name AS destination_name,
      d.image AS destination_image,
      d.country AS destination_country,
      d.state AS destination_state,
      admin.name AS confirmed_by_name
    FROM bookings b
    LEFT JOIN users u ON u.id = b.user_id
    LEFT JOIN destinations d ON d.id = b.destination_id
    LEFT JOIN users admin ON admin.id = b.confirmed_by
    ${whereClause ? `WHERE ${whereClause}` : ""}
    ${orderBy}
  `;
}

// ============================================================================
// 1. CREATE BOOKING REQUEST (Supports Authenticated Users & Guests, Trips & Hotel Stays)
// ============================================================================
exports.createBooking = async (req, res, next) => {
  try {
    let userId = req.user ? req.user.id : null;
    const {
      destinationId: rawDestId,
      packageId: rawPackageId,
      startDate,
      endDate,
      travellers: rawTravellers,
      contactName: rawContactName,
      contactEmail: rawContactEmail,
      contactPhone: rawContactPhone,
      specialRequests: rawSpecialRequests,
      estimatedBudget: rawBudget,
      estimatedTotal: rawTotal,
      // Hotel fields
      bookingType: rawBookingType,
      hotelId: rawHotelId,
      hotelName: rawHotelName,
      hotelLocation: rawHotelLocation,
      hotelImage: rawHotelImage,
      roomType: rawRoomType,
      roomNumber: rawRoomNumber,
      roomsCount: rawRoomsCount
    } = req.body;

    const isHotel = rawBookingType === "hotel" || Boolean(rawHotelName);
    const bookingType = isHotel ? "hotel" : (rawPackageId ? "package" : "destination");

    // Contact details validation (fallback to authenticated user profile)
    const contactName = String(rawContactName || req.user?.name || "").trim();
    const contactEmail = String(rawContactEmail || req.user?.email || "").trim().toLowerCase();
    const contactPhone = rawContactPhone ? String(rawContactPhone).trim() : null;

    if (!contactName) {
      return res.status(400).json({
        message: "Contact name is required."
      });
    }

    if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return res.status(400).json({
        message: "A valid contact email address is required."
      });
    }

    if (contactPhone && contactPhone.length > 50) {
      return res.status(400).json({
        message: "Contact phone cannot exceed 50 characters."
      });
    }

    // If userId not set from token, link to existing user with this email
    if (!userId && contactEmail) {
      const [existingUser] = await pool.query(
        "SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
        [contactEmail]
      );
      if (existingUser.length > 0) {
        userId = existingUser[0].id;
      }
    }

    // Resolve Destination
    let destination = null;
    let destinationId = null;

    const rawDestName = req.body.destinationName || "";
    const numDestId = Number(rawDestId);

    if (Number.isInteger(numDestId) && numDestId > 0) {
      const [rows] = await pool.query(
        "SELECT id, name, country, state, image, budget FROM destinations WHERE id = ? LIMIT 1",
        [numDestId]
      );
      if (rows.length > 0) destination = rows[0];
    }

    if (!destination && rawDestName) {
      const [rows] = await pool.query(
        "SELECT id, name, country, state, image, budget FROM destinations WHERE LOWER(name) = LOWER(?) LIMIT 1",
        [String(rawDestName).trim()]
      );
      if (rows.length > 0) destination = rows[0];
    }

    if (!destination && rawDestId) {
      const cleanTerm = String(rawDestId).trim().toLowerCase();
      const [rowsExact] = await pool.query(
        "SELECT id, name, country, state, image, budget FROM destinations WHERE LOWER(name) = ? LIMIT 1",
        [cleanTerm]
      );
      if (rowsExact.length > 0) {
        destination = rowsExact[0];
      } else {
        const [rowsFuzzy] = await pool.query(
          `SELECT id, name, country, state, image, budget FROM destinations 
           WHERE LOWER(name) LIKE ? 
              OR LOWER(COALESCE(image, '')) LIKE ?
           ORDER BY id ASC LIMIT 1`,
          [`%${cleanTerm}%`, `%/${cleanTerm}/%`]
        );
        if (rowsFuzzy.length > 0) destination = rowsFuzzy[0];
      }
    }

    if (destination) {
      destinationId = destination.id;
    } else if (!isHotel) {
      return res.status(404).json({
        message: "The requested destination could not be found."
      });
    }

    // Validate travellers count
    const travellers = Number(rawTravellers) || 1;
    if (!Number.isInteger(travellers) || travellers < 1 || travellers > 50) {
      return res.status(400).json({
        message: "Number of travellers must be a valid number between 1 and 50."
      });
    }

    // Validate dates
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!startDate || !endDate || !dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res.status(400).json({
        message: "Please provide valid travel start and end dates (YYYY-MM-DD)."
      });
    }

    const startObj = new Date(`${startDate}T00:00:00Z`);
    const endObj = new Date(`${endDate}T00:00:00Z`);

    if (Number.isNaN(startObj.getTime()) || Number.isNaN(endObj.getTime())) {
      return res.status(400).json({
        message: "Invalid travel date format."
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startCompare = new Date(startDate);
    startCompare.setHours(0, 0, 0, 0);

    if (startCompare < today) {
      return res.status(400).json({
        message: "Travel start date cannot be in the past."
      });
    }

    if (endObj <= startObj) {
      return res.status(400).json({
        message: "Travel end date must be after the start date."
      });
    }

    // Validate special requests
    const specialRequests = rawSpecialRequests ? String(rawSpecialRequests).trim() : null;
    if (specialRequests && specialRequests.length > 2000) {
      return res.status(400).json({
        message: "Special requests cannot exceed 2000 characters."
      });
    }

    const hotelName = rawHotelName ? String(rawHotelName).trim() : (isHotel ? (destination?.name || "Boutique Stay") : null);
    const hotelId = rawHotelId ? String(rawHotelId).trim() : null;
    const hotelLocation = rawHotelLocation ? String(rawHotelLocation).trim() : (destination?.state || destination?.country || null);
    const hotelImage = rawHotelImage ? String(rawHotelImage).trim() : (destination?.image || null);
    const roomType = rawRoomType ? String(rawRoomType).trim() : (isHotel ? "Standard Room" : null);
    const roomsCount = Math.max(1, parseInt(rawRoomsCount, 10) || 1);

    // Initial room assignment (e.g. Room 204 or Suite 305)
    const roomNumber = rawRoomNumber
      ? String(rawRoomNumber).trim()
      : (isHotel ? `Room ${Math.floor(100 + Math.random() * 400)}` : null);

    const destinationNameSnapshot = isHotel
      ? (hotelName || "Roamly Boutique Stay")
      : (destination?.name || rawDestName || "Roamly Destination");

    let packageId = null;
    let packageNameSnapshot = null;
    let packageTierSnapshot = null;
    let packageDetailsSnapshot = null;
    let estimatedBudget = rawBudget ? Number(rawBudget) : null;
    let estimatedTotal = rawTotal ? Number(rawTotal) : (estimatedBudget || null);

    // If standalone hotel booking, create clean snapshot
    if (isHotel) {
      packageDetailsSnapshot = {
        bookingType: "hotel",
        hotelId,
        hotelName,
        hotelLocation,
        roomType,
        roomNumber,
        roomsCount,
        pricing: {
          totalPrice: estimatedTotal,
          currency: "INR"
        },
        capturedAt: new Date().toISOString()
      };
    } else {
      packageDetailsSnapshot = {
        name: `${destination?.name || "Roamly"} Tailored Journey`,
        pricing: {
          totalPrice: estimatedTotal,
          currency: "INR"
        },
        capturedAt: new Date().toISOString()
      };
    }

    const bookingReference = await generateUniqueBookingReference();

    // Insert booking into MySQL
    const [result] = await pool.query(
      `INSERT INTO bookings
        (
          booking_reference,
          user_id,
          destination_id,
          destination_name_snapshot,
          booking_type,
          hotel_id,
          hotel_name,
          hotel_location,
          hotel_image,
          room_type,
          room_number,
          rooms_count,
          package_id,
          package_name_snapshot,
          package_tier_snapshot,
          package_details_snapshot,
          start_date,
          end_date,
          travellers,
          contact_name,
          contact_email,
          contact_phone,
          estimated_budget,
          estimated_total,
          special_requests,
          status
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        bookingReference,
        userId,
        destinationId,
        destinationNameSnapshot,
        bookingType,
        hotelId,
        hotelName,
        hotelLocation,
        hotelImage,
        roomType,
        roomNumber,
        roomsCount,
        packageId,
        packageNameSnapshot,
        packageTierSnapshot,
        JSON.stringify(packageDetailsSnapshot),
        startDate,
        endDate,
        travellers,
        contactName,
        contactEmail,
        contactPhone,
        estimatedBudget,
        estimatedTotal,
        specialRequests
      ]
    );

    const bookingId = result.insertId;

    const [rows] = await pool.query(
      getBookingBaseQuery("b.id = ?"),
      [bookingId]
    );

    const savedBooking = formatBookingRow(rows[0]);
    notifyBookingCreated(savedBooking);

    return res.status(201).json({
      message: isHotel ? "Hotel reservation confirmed successfully." : "Trip booking request submitted successfully.",
      booking: savedBooking,
      bookingReference: savedBooking.bookingReference,
      status: "pending"
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 2. GET USER'S OWN BOOKINGS (Authenticated User)
// ============================================================================
exports.getMyBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const statusFilter = req.query.status ? String(req.query.status).toLowerCase() : null;

    let whereClause = "(b.user_id = ? OR (b.contact_email IS NOT NULL AND LOWER(b.contact_email) = LOWER(?)))";
    const params = [userId, req.user.email];

    if (statusFilter && statusFilter !== "all" && VALID_STATUSES.includes(statusFilter)) {
      whereClause += " AND b.status = ?";
      params.push(statusFilter);
    }

    const [rows] = await pool.query(
      getBookingBaseQuery(whereClause, "ORDER BY b.created_at DESC"),
      params
    );

    const formattedList = rows.map(formatBookingRow);

    return res.json({
      bookings: formattedList,
      count: formattedList.length
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 3. GET SPECIFIC BOOKING BY ID (User's own booking)
// ============================================================================
exports.getMyBookingById = async (req, res, next) => {
  try {
    const bookingId = Number(req.params.id);
    if (!Number.isInteger(bookingId) || bookingId < 1) {
      return res.status(400).json({ message: "Invalid booking ID." });
    }

    const [rows] = await pool.query(
      getBookingBaseQuery("b.id = ? AND (b.user_id = ? OR (b.contact_email IS NOT NULL AND LOWER(b.contact_email) = LOWER(?)))"),
      [bookingId, req.user.id, req.user.email]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Booking not found or access denied."
      });
    }

    return res.json({ booking: formatBookingRow(rows[0]) });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 4. GET CURRENT USER'S BOOKING STATS
// ============================================================================
exports.getMyStats = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
       FROM bookings
       WHERE (user_id = ? OR (contact_email IS NOT NULL AND LOWER(contact_email) = LOWER(?)))`,
      [req.user.id, req.user.email]
    );

    const stats = rows[0] || {};

    return res.json({
      total: Number(stats.total) || 0,
      pending: Number(stats.pending) || 0,
      confirmed: Number(stats.confirmed) || 0,
      rejected: Number(stats.rejected) || 0,
      cancelled: Number(stats.cancelled) || 0
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 5. GET ALL BOOKINGS (Admin Only)
// ============================================================================
exports.getAllBookings = async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "all").trim().toLowerCase();

    const conditions = [];
    const params = [];

    if (status && status !== "all" && VALID_STATUSES.includes(status)) {
      conditions.push("b.status = ?");
      params.push(status);
    }

    if (search) {
      conditions.push(`(
        b.booking_reference LIKE ? OR
        u.name LIKE ? OR
        u.email LIKE ? OR
        b.contact_name LIKE ? OR
        b.contact_email LIKE ? OR
        d.name LIKE ? OR
        b.destination_name_snapshot LIKE ?
      )`);
      const term = `%${search}%`;
      params.push(term, term, term, term, term, term, term);
    }

    const whereClause = conditions.length ? conditions.join(" AND ") : "";

    const [rows] = await pool.query(
      getBookingBaseQuery(whereClause, "ORDER BY b.created_at DESC"),
      params
    );

    const formattedList = rows.map(formatBookingRow);

    return res.json({
      bookings: formattedList,
      count: formattedList.length
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 6. GET ADMIN BOOKING STATS
// ============================================================================
exports.getAdminStats = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
       FROM bookings`
    );

    const stats = rows[0] || {};

    return res.json({
      total: Number(stats.total) || 0,
      pending: Number(stats.pending) || 0,
      confirmed: Number(stats.confirmed) || 0,
      rejected: Number(stats.rejected) || 0,
      cancelled: Number(stats.cancelled) || 0
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 7. CONFIRM PENDING BOOKING (Admin Only)
// ============================================================================
exports.confirmBooking = async (req, res, next) => {
  try {
    const bookingId = Number(req.params.id);
    const adminId = req.user.id;

    if (!Number.isInteger(bookingId) || bookingId < 1) {
      return res.status(400).json({ message: "Invalid booking ID." });
    }

    // Safe conditional update to prevent conflicting or duplicate transitions
    const roomNumber = req.body.roomNumber ? String(req.body.roomNumber).trim().slice(0, 50) : null;
    const [result] = await pool.query(
      `UPDATE bookings
       SET status = 'confirmed',
           confirmed_by = ?,
           confirmed_at = NOW(),
           room_number = COALESCE(?, room_number),
           rejection_reason = NULL
       WHERE id = ? AND status = 'pending'`,
      [adminId, roomNumber, bookingId]
    );

    if (result.affectedRows === 0) {
      // Check whether booking exists and current status
      const [check] = await pool.query(
        "SELECT id, status FROM bookings WHERE id = ?",
        [bookingId]
      );

      if (check.length === 0) {
        return res.status(404).json({ message: "Booking not found." });
      }

      return res.status(409).json({
        message: `This booking cannot be confirmed because it is currently '${check[0].status}'.`,
        currentStatus: check[0].status
      });
    }

    // Fetch updated record with joins
    const [rows] = await pool.query(
      getBookingBaseQuery("b.id = ?"),
      [bookingId]
    );

    const updatedBooking = formatBookingRow(rows[0]);

    // Emit real-time status update to user and admins
    notifyBookingStatusUpdated(updatedBooking);

    return res.json({
      message: "Trip booking confirmed successfully.",
      booking: updatedBooking
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 8. REJECT PENDING BOOKING (Admin Only)
// ============================================================================
exports.rejectBooking = async (req, res, next) => {
  try {
    const bookingId = Number(req.params.id);
    const adminId = req.user.id;
    const rejectionReason = req.body.rejectionReason
      ? String(req.body.rejectionReason).trim().slice(0, 1000)
      : null;

    if (!Number.isInteger(bookingId) || bookingId < 1) {
      return res.status(400).json({ message: "Invalid booking ID." });
    }

    // Safe conditional update to prevent conflicting transitions
    const [result] = await pool.query(
      `UPDATE bookings
       SET status = 'rejected',
           rejection_reason = ?,
           confirmed_by = ?,
           confirmed_at = NOW()
       WHERE id = ? AND status = 'pending'`,
      [rejectionReason, adminId, bookingId]
    );

    if (result.affectedRows === 0) {
      const [check] = await pool.query(
        "SELECT id, status FROM bookings WHERE id = ?",
        [bookingId]
      );

      if (check.length === 0) {
        return res.status(404).json({ message: "Booking not found." });
      }

      return res.status(409).json({
        message: `This booking cannot be rejected because it is currently '${check[0].status}'.`,
        currentStatus: check[0].status
      });
    }

    const [rows] = await pool.query(
      getBookingBaseQuery("b.id = ?"),
      [bookingId]
    );

    const updatedBooking = formatBookingRow(rows[0]);

    // Emit real-time status update
    notifyBookingStatusUpdated(updatedBooking);

    return res.json({
      message: "Trip booking rejected.",
      booking: updatedBooking
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 9. GENERAL ADMIN STATUS UPDATE (Legacy / Admin helper)
// ============================================================================
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const bookingId = Number(req.params.id);
    const status = String(req.body.status || "").toLowerCase();
    const reason = req.body.reason ? String(req.body.reason).trim() : null;

    if (!Number.isInteger(bookingId) || bookingId < 1) {
      return res.status(400).json({ message: "Invalid booking ID." });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid booking status." });
    }

    const [result] = await pool.query(
      `UPDATE bookings
       SET status = ?,
           rejection_reason = ?,
           confirmed_by = ?,
           confirmed_at = NOW()
       WHERE id = ?`,
      [status, reason, req.user.id, bookingId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Booking not found." });
    }

    const [rows] = await pool.query(
      getBookingBaseQuery("b.id = ?"),
      [bookingId]
    );

    const updatedBooking = formatBookingRow(rows[0]);
    notifyBookingStatusUpdated(updatedBooking);

    return res.json({
      message: "Booking status updated successfully.",
      booking: updatedBooking
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 10. USER CANCEL OWN PENDING BOOKING
// ============================================================================
exports.cancelMyBooking = async (req, res, next) => {
  try {
    const bookingId = Number(req.params.id);
    const userId = req.user.id;

    if (!Number.isInteger(bookingId) || bookingId < 1) {
      return res.status(400).json({ message: "Invalid booking ID." });
    }

    const [result] = await pool.query(
      `UPDATE bookings
       SET status = 'cancelled'
       WHERE id = ?
         AND user_id = ?
         AND status = 'pending'`,
      [bookingId, userId]
    );

    if (result.affectedRows === 0) {
      const [check] = await pool.query(
        "SELECT id, user_id, status FROM bookings WHERE id = ?",
        [bookingId]
      );

      if (check.length === 0 || check[0].user_id !== userId) {
        return res.status(404).json({
          message: "Booking not found or unauthorized."
        });
      }

      return res.status(400).json({
        message: `Booking cannot be cancelled because its status is already '${check[0].status}'.`
      });
    }

    const [rows] = await pool.query(
      getBookingBaseQuery("b.id = ?"),
      [bookingId]
    );

    const updatedBooking = formatBookingRow(rows[0]);
    notifyBookingStatusUpdated(updatedBooking);

    return res.json({
      message: "Booking cancelled successfully.",
      booking: updatedBooking
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 11. GET BOOKING PACKAGE DETAILS SNAPSHOT (Requirement 1A & 1B)
// ============================================================================
exports.getBookingPackageDetails = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;

    const [rows] = await pool.query(
      getBookingBaseQuery("b.id = ? OR b.booking_reference = ?"),
      [bookingId, bookingId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found."
      });
    }

    const booking = rows[0];

    // Check ownership or admin privileges
    if (booking.user_id !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view package details for this booking."
      });
    }

    let snapshot = null;
    if (booking.package_details_snapshot) {
      snapshot = typeof booking.package_details_snapshot === "string"
        ? safeJsonParse(booking.package_details_snapshot, null)
        : booking.package_details_snapshot;
    }

    // Fallback if an older booking had no snapshot
    if (!snapshot) {
      const travellers = Number(booking.travellers) || 1;
      const totalVal = Number(booking.estimated_total) || 5000 * travellers;
      snapshot = {
        packageId: null,
        name: `${booking.destination_name || booking.destination_name_snapshot || "Roamly Destination"} Curated Experience`,
        tagline: `Handcrafted journey in ${booking.destination_name || booking.destination_name_snapshot}`,
        tier: "custom",
        durationDays: 4,
        durationNights: 3,
        accommodationType: "Curated Verified Partner Stays",
        mealPlan: "Daily Breakfast Included (CP Plan)",
        transportType: "Dedicated AC Vehicle for Sightseeing & Transfers",
        pickupDrop: `Designated Airport/Railway Station Transfers`,
        description: `Bespoke travel itinerary customized for ${travellers} traveler(s).`,
        inclusions: [
          `Accommodation for ${travellers} traveler(s) from ${booking.start_date} to ${booking.end_date}`,
          "Daily complimentary buffet/a-la-carte breakfast",
          "Private sanitized vehicle for scheduled itinerary and transfers",
          "Driver allowances, toll taxes, and state parking permits",
          "24/7 dedicated Roamly trip concierge support"
        ],
        exclusions: [
          "Airfare or train fare to destination hub",
          "Monument and national park entry fees not explicitly specified",
          "Personal expenses, laundry, and beverage charges",
          "Optional adventure activities and water sports"
        ],
        itinerary: [
          { day: 1, title: `Arrival & Welcome`, description: "Airport/station pickup, check-in to accommodation, evening leisure stroll and welcome orientation." },
          { day: 2, title: `Iconic Highlights Tour`, description: "Guided exploration of top landmarks, scenic viewpoints, local cuisine tasting, and cultural photography." },
          { day: 3, title: `Nature & Authentic Experiences`, description: "Scenic trail or boat cruise, artisan market visit, and relaxing evening." },
          { day: 4, title: `Departure & Farewell`, description: "Leisurely breakfast, souvenir shopping, and chauffeur transfer to airport/railway station." }
        ],
        importantInstructions: [
          "Please carry a valid government-issued photo ID (Aadhaar/Passport/Voter ID) for all travelers.",
          "Hotel standard check-in time is 14:00 hrs and check-out is 11:00 hrs.",
          "Keep emergency contact numbers saved on your phone during transit."
        ],
        cancellationPolicy: [
          "100% refund if cancelled at least 15 days before travel start date.",
          "50% refund if cancelled between 7 and 14 days before travel start date.",
          "Non-refundable if cancelled less than 7 days prior to travel start date."
        ],
        pricing: {
          pricePerPerson: Math.round(totalVal / travellers),
          travellers,
          totalPrice: totalVal,
          currency: "INR"
        },
        capturedAt: booking.created_at
      };
    }

    return res.json({
      success: true,
      bookingId: booking.id,
      bookingReference: booking.booking_reference,
      destinationName: booking.destination_name || booking.destination_name_snapshot,
      destinationImage: booking.destination_image,
      destinationCountry: booking.destination_country || "India",
      destinationState: booking.destination_state,
      startDate: booking.start_date,
      endDate: booking.end_date,
      travellers: Number(booking.travellers) || 1,
      status: booking.status,
      paymentStatus: booking.payment_status,
      totalAmount: Number(booking.estimated_total) || 0,
      package: snapshot
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 12. ADMIN: UPDATE / ASSIGN ROOM NUMBER FOR BOOKING
// ============================================================================
exports.updateRoomNumber = async (req, res, next) => {
  try {
    const bookingId = Number(req.params.id);
    const roomNumber = req.body.roomNumber ? String(req.body.roomNumber).trim().slice(0, 50) : null;

    if (!Number.isInteger(bookingId) || bookingId < 1) {
      return res.status(400).json({ message: "Invalid booking ID." });
    }

    await pool.query(
      "UPDATE bookings SET room_number = ? WHERE id = ?",
      [roomNumber, bookingId]
    );

    const [rows] = await pool.query(
      getBookingBaseQuery("b.id = ?"),
      [bookingId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Booking not found." });
    }

    const updatedBooking = formatBookingRow(rows[0]);
    notifyBookingStatusUpdated(updatedBooking);

    return res.json({
      message: "Room number updated successfully.",
      booking: updatedBooking
    });
  } catch (error) {
    next(error);
  }
};
