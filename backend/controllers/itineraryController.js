const pool = require("../config/db");
const { isDbConnectionError } = pool;

// In-memory fallback store for serverless cold-starts or offline DB
const memoryItineraries = new Map();

function safeJsonParse(val, fallback = {}) {
  if (!val) return fallback;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function formatItineraryRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    destinationName: row.destination_name,
    destinationId: row.destination_id,
    startLocation: row.start_location || "",
    startDate: row.start_date || null,
    endDate: row.end_date || null,
    durationDays: Number(row.duration_days) || 3,
    travellersCount: Number(row.travellers_count) || 1,
    budgetTotal: Number(row.budget_total) || 0,
    budgetTier: row.budget_tier || "standard",
    mood: row.mood || "Peace",
    activities: safeJsonParse(row.activities, []),
    itineraryData: safeJsonParse(row.itinerary_data, {}),
    summary: row.summary || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * GET /api/itineraries/my
 * Fetch all saved itineraries owned by the authenticated user
 */
exports.getMyItineraries = async (req, res, next) => {
  try {
    const userId = req.user.id;

    try {
      const [rows] = await pool.query(
        "SELECT * FROM saved_itineraries WHERE user_id = ? ORDER BY created_at DESC",
        [userId]
      );
      return res.json({
        success: true,
        itineraries: rows.map(formatItineraryRow),
        count: rows.length
      });
    } catch (dbErr) {
      if (!isDbConnectionError(dbErr) && dbErr.code !== "ER_NO_SUCH_TABLE") {
        throw dbErr;
      }
    }

    // In-memory fallback
    const userList = Array.from(memoryItineraries.values())
      .filter((item) => Number(item.user_id) === Number(userId))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.json({
      success: true,
      itineraries: userList.map(formatItineraryRow),
      count: userList.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/itineraries/my/:id
 * Fetch single itinerary by ID, strictly verifying ownership
 */
exports.getItineraryById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: "Invalid itinerary ID." });
    }

    try {
      const [rows] = await pool.query(
        "SELECT * FROM saved_itineraries WHERE id = ? AND user_id = ?",
        [id, userId]
      );
      if (rows.length > 0) {
        return res.json({
          success: true,
          itinerary: formatItineraryRow(rows[0])
        });
      }
    } catch (dbErr) {
      if (!isDbConnectionError(dbErr) && dbErr.code !== "ER_NO_SUCH_TABLE") {
        throw dbErr;
      }
    }

    // Check memory fallback
    const item = memoryItineraries.get(id);
    if (item && Number(item.user_id) === Number(userId)) {
      return res.json({
        success: true,
        itinerary: formatItineraryRow(item)
      });
    }

    return res.status(404).json({
      success: false,
      message: "Itinerary not found or unauthorized."
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/itineraries
 * Save a new itinerary for authenticated user
 */
exports.saveItinerary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      title,
      destinationName,
      destinationId,
      startLocation,
      startDate,
      endDate,
      durationDays,
      travellersCount,
      budgetTotal,
      budgetTier,
      mood,
      activities,
      itineraryData,
      summary
    } = req.body;

    if (!destinationName || !itineraryData) {
      return res.status(400).json({
        success: false,
        message: "Destination name and itinerary data are required."
      });
    }

    const cleanTitle = String(title || `${durationDays || 3}-Day ${destinationName} Escape`).trim().slice(0, 255);
    const cleanDuration = Math.max(1, Math.min(30, Number(durationDays) || 3));
    const cleanTravellers = Math.max(1, Number(travellersCount) || 1);
    const cleanBudget = Math.max(0, Number(budgetTotal) || 0);

    const safeItineraryJson = JSON.stringify(itineraryData);
    const safeActivitiesJson = JSON.stringify(Array.isArray(activities) ? activities : []);

    try {
      const [result] = await pool.query(
        `INSERT INTO saved_itineraries (
          user_id, title, destination_name, destination_id,
          start_location, start_date, end_date, duration_days,
          travellers_count, budget_total, budget_tier, mood,
          activities, itinerary_data, summary
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          cleanTitle,
          destinationName,
          destinationId || null,
          startLocation || null,
          startDate || null,
          endDate || null,
          cleanDuration,
          cleanTravellers,
          cleanBudget,
          budgetTier || "standard",
          mood || "Peace",
          safeActivitiesJson,
          safeItineraryJson,
          summary || ""
        ]
      );

      const [newRow] = await pool.query(
        "SELECT * FROM saved_itineraries WHERE id = ?",
        [result.insertId]
      );

      return res.status(201).json({
        success: true,
        message: "Trip itinerary saved successfully!",
        itinerary: formatItineraryRow(newRow[0])
      });
    } catch (dbErr) {
      if (!isDbConnectionError(dbErr) && dbErr.code !== "ER_NO_SUCH_TABLE") {
        throw dbErr;
      }
    }

    // Fallback in-memory save
    const fallbackId = Date.now();
    const fallbackRecord = {
      id: fallbackId,
      user_id: userId,
      title: cleanTitle,
      destination_name: destinationName,
      destination_id: destinationId || null,
      start_location: startLocation || null,
      start_date: startDate || null,
      end_date: endDate || null,
      duration_days: cleanDuration,
      travellers_count: cleanTravellers,
      budget_total: cleanBudget,
      budget_tier: budgetTier || "standard",
      mood: mood || "Peace",
      activities: safeActivitiesJson,
      itinerary_data: safeItineraryJson,
      summary: summary || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    memoryItineraries.set(fallbackId, fallbackRecord);

    return res.status(201).json({
      success: true,
      message: "Trip itinerary saved successfully (Session Mode).",
      itinerary: formatItineraryRow(fallbackRecord)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/itineraries/:id
 * Update an existing saved itinerary
 */
exports.updateItinerary = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const { title, itineraryData, summary } = req.body;

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: "Invalid itinerary ID." });
    }

    const updates = [];
    const params = [];

    if (title) {
      updates.push("title = ?");
      params.push(String(title).trim().slice(0, 255));
    }
    if (itineraryData) {
      updates.push("itinerary_data = ?");
      params.push(JSON.stringify(itineraryData));
    }
    if (summary !== undefined) {
      updates.push("summary = ?");
      params.push(String(summary).slice(0, 1000));
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: "No update fields provided." });
    }

    params.push(id, userId);

    try {
      const [result] = await pool.query(
        `UPDATE saved_itineraries SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`,
        params
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Itinerary not found or unauthorized." });
      }

      const [updatedRows] = await pool.query("SELECT * FROM saved_itineraries WHERE id = ?", [id]);
      return res.json({
        success: true,
        message: "Itinerary updated successfully.",
        itinerary: formatItineraryRow(updatedRows[0])
      });
    } catch (dbErr) {
      if (!isDbConnectionError(dbErr) && dbErr.code !== "ER_NO_SUCH_TABLE") {
        throw dbErr;
      }
    }

    // In-memory update
    const item = memoryItineraries.get(id);
    if (!item || Number(item.user_id) !== Number(userId)) {
      return res.status(404).json({ success: false, message: "Itinerary not found or unauthorized." });
    }

    if (title) item.title = String(title).trim();
    if (itineraryData) item.itinerary_data = JSON.stringify(itineraryData);
    if (summary !== undefined) item.summary = String(summary);
    item.updated_at = new Date().toISOString();

    return res.json({
      success: true,
      message: "Itinerary updated successfully.",
      itinerary: formatItineraryRow(item)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/itineraries/:id
 * Delete an itinerary owned by authenticated user
 */
exports.deleteItinerary = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: "Invalid itinerary ID." });
    }

    try {
      const [result] = await pool.query(
        "DELETE FROM saved_itineraries WHERE id = ? AND user_id = ?",
        [id, userId]
      );

      if (result.affectedRows > 0) {
        return res.json({
          success: true,
          message: "Itinerary deleted successfully."
        });
      }
    } catch (dbErr) {
      if (!isDbConnectionError(dbErr) && dbErr.code !== "ER_NO_SUCH_TABLE") {
        throw dbErr;
      }
    }

    // In-memory delete
    const item = memoryItineraries.get(id);
    if (item && Number(item.user_id) === Number(userId)) {
      memoryItineraries.delete(id);
      return res.json({
        success: true,
        message: "Itinerary deleted successfully."
      });
    }

    return res.status(404).json({
      success: false,
      message: "Itinerary not found or access denied."
    });
  } catch (error) {
    next(error);
  }
};

