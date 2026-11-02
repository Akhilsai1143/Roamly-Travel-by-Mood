const pool = require("../config/db");
const { isDbConnectionError } = pool;

let fallbackReviews = [];
try {
  fallbackReviews = require("../data/fallbackReviews.json");
} catch (err) {
  fallbackReviews = [];
}

// Helper to format review row for frontend consumption
function formatReviewRow(row) {
  if (!row) return null;

  return {
    id: String(row.id),
    destinationId: row.destination_id || row.destinationId,
    destinationName: row.destination_name || row.destinationName || row.dest_table_name || "Custom Escape",
    author: row.author || row.user_full_name || row.user_name || "Fellow Traveler",
    avatar: row.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
    location: row.location || (row.user_phone ? "Verified Traveler" : "India"),
    rating: Number(row.rating) || 5,
    title: row.title || `${row.destination_name || row.destinationName || "Travel"} Experience`,
    comment: row.comment || "",
    mood: row.mood || "Peace",
    duration: row.duration || "3 Days / 2 Nights",
    budget: row.budget || "₹8,500",
    season: row.season || "Recent Trip",
    insiderTip: row.insider_tip || row.insiderTip || "",
    images: Array.isArray(row.images) ? row.images : (row.photo_url ? [row.photo_url] : []),
    helpfulCount: Number(row.helpful_count || row.helpfulCount) || 0,
    date: row.date || (row.created_at ? new Date(row.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Recently"),
    verified: true,
    userId: row.user_id || row.userId
  };
}

// GET /api/reviews
// Optional filters: destinationId, rating
exports.getReviews = async (req, res) => {
  const destId = req.query.destination_id || req.query.destinationId;
  const ratingFilter = req.query.rating;

  try {
    let query = `
      SELECT 
        r.*,
        u.name AS user_name,
        TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) AS user_full_name,
        u.phone AS user_phone,
        d.name AS dest_table_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN destinations d ON r.destination_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (destId && destId !== "all") {
      query += " AND (r.destination_id = ? OR d.name LIKE ?)";
      params.push(destId, `%${destId}%`);
    }

    if (ratingFilter && ratingFilter !== "all") {
      const numRating = parseInt(ratingFilter, 10);
      if (!isNaN(numRating)) {
        query += " AND r.rating = ?";
        params.push(numRating);
      }
    }

    query += " ORDER BY r.created_at DESC LIMIT 50";

    const [rows] = await pool.query(query, params);
    const reviews = rows.map(formatReviewRow);

    res.json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    if (isDbConnectionError(error) || error.code === "ER_NO_SUCH_TABLE") {
      console.warn("[Reviews API]: MySQL unreachable. Serving fallback reviews.");
      let filtered = [...fallbackReviews];

      if (destId && destId !== "all") {
        const d = String(destId).toLowerCase();
        filtered = filtered.filter(
          (r) =>
            String(r.destinationId || "").toLowerCase().includes(d) ||
            String(r.destinationName || "").toLowerCase().includes(d)
        );
      }

      if (ratingFilter && ratingFilter !== "all") {
        const numRating = parseInt(ratingFilter, 10);
        if (!isNaN(numRating)) {
          filtered = filtered.filter((r) => Number(r.rating) === numRating);
        }
      }

      return res.json({
        success: true,
        count: filtered.length,
        reviews: filtered.map(formatReviewRow)
      });
    }

    console.error("Error fetching reviews:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch community reviews"
    });
  }
};

// POST /api/reviews
// Authenticated user creates a review
exports.createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      destination_id,
      destinationId,
      destination_name,
      destinationName,
      rating,
      title,
      comment,
      mood,
      duration,
      budget,
      season,
      insider_tip,
      insiderTip,
      photo_url,
      photoUrl
    } = req.body;

    const finalDestId = destination_id || destinationId;
    const finalDestName = destination_name || destinationName;
    const cleanComment = (comment || "").trim();

    if (!finalDestName && !finalDestId) {
      return res.status(400).json({
        success: false,
        message: "Destination name or ID is required"
      });
    }

    if (!cleanComment) {
      return res.status(400).json({
        success: false,
        message: "Review comment cannot be empty"
      });
    }

    const numRating = Math.max(1, Math.min(5, Number(rating) || 5));
    const numericDestId = Number.isInteger(Number(finalDestId)) ? Number(finalDestId) : null;

    const [result] = await pool.query(
      `INSERT INTO reviews (
        user_id, destination_id, destination_name, rating,
        title, comment, mood, duration, budget, season, insider_tip, photo_url, helpful_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        userId,
        numericDestId,
        finalDestName,
        numRating,
        title || `${finalDestName} Experience`,
        cleanComment,
        mood || "Peace",
        duration || "3 Days",
        budget || "₹8,500",
        season || "Recent Trip",
        insider_tip || insiderTip || null,
        photo_url || photoUrl || null
      ]
    );

    const insertedId = result.insertId;

    const [createdRows] = await pool.query(
      `SELECT r.*, u.name AS user_name, TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) AS user_full_name, u.phone AS user_phone
       FROM reviews r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [insertedId]
    );

    const formattedReview = formatReviewRow(createdRows[0]);

    res.status(201).json({
      success: true,
      message: "Review shared with the Roamly community successfully!",
      review: formattedReview
    });
  } catch (error) {
    if (isDbConnectionError(error)) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable. Please configure cloud MySQL in Vercel to post reviews."
      });
    }
    console.error("Error creating review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create review. Please try again."
    });
  }
};

// PATCH /api/reviews/:id/upvote
exports.upvoteReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    await pool.query(
      "UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = ?",
      [reviewId]
    );

    const [rows] = await pool.query(
      "SELECT helpful_count FROM reviews WHERE id = ?",
      [reviewId]
    );

    res.json({
      success: true,
      helpfulCount: rows[0]?.helpful_count || 1
    });
  } catch (error) {
    if (isDbConnectionError(error)) {
      return res.json({
        success: true,
        helpfulCount: 1
      });
    }
    console.error("Error upvoting review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upvote review"
    });
  }
};

// DELETE /api/reviews/:id (Author or Admin)
exports.deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user.id;
    const role = req.user.role;

    const [rows] = await pool.query("SELECT user_id FROM reviews WHERE id = ?", [reviewId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    if (role !== "admin" && rows[0].user_id !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this review" });
    }

    await pool.query("DELETE FROM reviews WHERE id = ?", [reviewId]);

    res.json({
      success: true,
      message: "Review removed successfully"
    });
  } catch (error) {
    if (isDbConnectionError(error)) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable."
      });
    }
    console.error("Error deleting review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete review"
    });
  }
};
