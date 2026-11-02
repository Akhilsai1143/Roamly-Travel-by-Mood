const pool = require("../config/db");
const { isDbConnectionError } = pool;

let fallbackDestinations = [];
try {
  fallbackDestinations = require("../data/fallbackDestinations.json");
} catch (err) {
  fallbackDestinations = [];
}

function formatDestination(row) {
  if (!row) return null;

  let gallery = [];
  if (row.gallery) {
    if (Array.isArray(row.gallery)) {
      gallery = row.gallery;
    } else if (typeof row.gallery === "string") {
      try {
        const parsed = JSON.parse(row.gallery);
        gallery = Array.isArray(parsed) ? parsed : [];
      } catch {
        gallery = row.gallery.split(",").map((item) => item.trim()).filter(Boolean);
      }
    }
  }

  return {
    ...row,
    mood: typeof row.mood === "string"
      ? row.mood.split(",").map((item) => item.trim()).filter(Boolean)
      : (Array.isArray(row.mood) ? row.mood : []),
    budget: typeof row.budget === "string" ? row.budget.replace(/\?/g, "₹") : (row.budget ?? ""),
    bestTime: row.best_time ?? row.bestTime ?? "",
    hiddenGem: row.hidden_gem ?? row.hiddenGem ?? "",
    createdAt: row.created_at ?? row.createdAt ?? null,
    gallery: gallery.length ? gallery : undefined,
  };
}

function positiveInteger(value, fallback, maximum) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 1) return fallback;

  return maximum ? Math.min(parsed, maximum) : parsed;
}

// GET /api/destinations?page=1&limit=9
// Optional filters: search, country, category, mood
exports.getDestinations = async (req, res, next) => {
  const page = positiveInteger(req.query.page, 1);
  const limit = positiveInteger(req.query.limit, 9, 100);
  const offset = (page - 1) * limit;

  const search = String(req.query.search || "").trim();
  const country = String(req.query.country || "All").trim();
  const category = String(req.query.category || "All").trim();
  const mood = String(req.query.mood || "").trim();

  try {
    const conditions = [];
    const values = [];

    if (search) {
      conditions.push(`(
        name LIKE ? OR state LIKE ? OR country LIKE ?
        OR description LIKE ? OR category LIKE ?
      )`);
      const term = `%${search}%`;
      values.push(term, term, term, term, term);
    }

    if (country === "India") {
      conditions.push("country = ?");
      values.push("India");
    } else if (country === "World") {
      conditions.push("country <> ?");
      values.push("India");
    }

    if (category && category !== "All") {
      conditions.push("category = ?");
      values.push(category);
    }

    if (mood) {
      conditions.push("LOWER(COALESCE(mood, '')) LIKE ?");
      values.push(`%${mood.toLowerCase()}%`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM destinations ${whereClause}`,
      values
    );

    const totalItems = Number(countRows[0].total);
    const totalPages = Math.ceil(totalItems / limit);

    const [rows] = await pool.query(
      `SELECT *
       FROM destinations
       ${whereClause}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    res.json({
      destinations: rows.map(formatDestination),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    if (isDbConnectionError(error) || error.code === "ER_NO_SUCH_TABLE") {
      console.warn("[Destinations API]: MySQL database unreachable. Serving fallback destinations catalog.");

      // In-memory filter on fallback destinations
      let filtered = [...fallbackDestinations];

      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (d) =>
            (d.name && d.name.toLowerCase().includes(s)) ||
            (d.state && d.state.toLowerCase().includes(s)) ||
            (d.country && d.country.toLowerCase().includes(s)) ||
            (d.description && d.description.toLowerCase().includes(s)) ||
            (d.category && d.category.toLowerCase().includes(s))
        );
      }

      if (country === "India") {
        filtered = filtered.filter((d) => (d.country || "").toLowerCase() === "india");
      } else if (country === "World") {
        filtered = filtered.filter((d) => (d.country || "").toLowerCase() !== "india");
      }

      if (category && category !== "All") {
        filtered = filtered.filter((d) => (d.category || "").toLowerCase() === category.toLowerCase());
      }

      if (mood) {
        const m = mood.toLowerCase();
        filtered = filtered.filter((d) => {
          if (Array.isArray(d.mood)) return d.mood.some((item) => item.toLowerCase().includes(m));
          return String(d.mood || "").toLowerCase().includes(m);
        });
      }

      const totalItems = filtered.length;
      const totalPages = Math.ceil(totalItems / limit) || 1;
      const paged = filtered.slice(offset, offset + limit);

      return res.json({
        destinations: paged.map(formatDestination),
        pagination: {
          page,
          limit,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      });
    }

    next(error);
  }
};

// GET /api/destinations/:id
exports.getDestination = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM destinations WHERE id = ?",
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Destination not found.",
      });
    }

    res.json(formatDestination(rows[0]));
  } catch (error) {
    if (isDbConnectionError(error) || error.code === "ER_NO_SUCH_TABLE") {
      console.warn("[Destinations API]: MySQL database unreachable. Looking up destination from fallback data.");
      const paramId = String(req.params.id).toLowerCase();
      const found = fallbackDestinations.find(
        (d) =>
          String(d.id).toLowerCase() === paramId ||
          String(d.name || "").toLowerCase() === paramId
      );

      if (found) {
        return res.json(formatDestination(found));
      }

      return res.status(404).json({
        message: "Destination not found.",
      });
    }

    next(error);
  }
};

// POST /api/destinations
exports.createDestination = async (req, res, next) => {
  try {
    const {
      name,
      state,
      country,
      mood,
      category,
      days,
      budget,
      image,
      gallery,
      description,
      bestTime,
      hiddenGem,
      tip,
    } = req.body;

    if (!String(name || "").trim() || !String(country || "").trim()) {
      return res.status(400).json({
        message: "Destination name and country are required.",
      });
    }

    const moodValue = Array.isArray(mood)
      ? mood.join(", ")
      : String(mood || "");

    const galleryValue = gallery
      ? (typeof gallery === "string" ? gallery : JSON.stringify(gallery))
      : null;

    const [result] = await pool.query(
      `INSERT INTO destinations
       (name, state, country, mood, category, days, budget,
        image, gallery, description, best_time, hidden_gem, tip)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        state || "",
        country.trim(),
        moodValue,
        category || "",
        days === "" || days == null ? null : Number(days),
        budget ?? null,
        image || "",
        galleryValue,
        description || "",
        bestTime || "",
        hiddenGem || "",
        tip || "",
      ]
    );

    const [rows] = await pool.query(
      "SELECT * FROM destinations WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json({
      message: "Destination created successfully.",
      destination: formatDestination(rows[0]),
    });
  } catch (error) {
    if (isDbConnectionError(error)) {
      return res.status(503).json({
        message: "Database connection unavailable. Please configure cloud MySQL in Vercel to create destinations."
      });
    }
    next(error);
  }
};

// PUT /api/destinations/:id
exports.updateDestination = async (req, res, next) => {
  try {
    const {
      name,
      state,
      country,
      mood,
      category,
      days,
      budget,
      image,
      gallery,
      description,
      bestTime,
      hiddenGem,
      tip,
    } = req.body;

    if (!String(name || "").trim() || !String(country || "").trim()) {
      return res.status(400).json({
        message: "Destination name and country are required.",
      });
    }

    const moodValue = Array.isArray(mood)
      ? mood.join(", ")
      : String(mood || "");

    const galleryValue = gallery !== undefined
      ? (typeof gallery === "string" ? gallery : JSON.stringify(gallery))
      : undefined;

    let updateSql = `UPDATE destinations SET
       name = ?, state = ?, country = ?, mood = ?, category = ?,
       days = ?, budget = ?, image = ?, description = ?,
       best_time = ?, hidden_gem = ?, tip = ?`;
    const updateParams = [
      name.trim(),
      state || "",
      country.trim(),
      moodValue,
      category || "",
      days === "" || days == null ? null : Number(days),
      budget ?? null,
      image || "",
      description || "",
      bestTime || "",
      hiddenGem || "",
      tip || "",
    ];

    if (galleryValue !== undefined) {
      updateSql += `, gallery = ?`;
      updateParams.push(galleryValue);
    }

    updateSql += ` WHERE id = ?`;
    updateParams.push(req.params.id);

    const [result] = await pool.query(updateSql, updateParams);

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "Destination not found.",
      });
    }

    const [rows] = await pool.query(
      "SELECT * FROM destinations WHERE id = ?",
      [req.params.id]
    );

    res.json({
      message: "Destination updated successfully.",
      destination: formatDestination(rows[0]),
    });
  } catch (error) {
    if (isDbConnectionError(error)) {
      return res.status(503).json({
        message: "Database connection unavailable. Please configure cloud MySQL in Vercel to update destinations."
      });
    }
    next(error);
  }
};

// DELETE /api/destinations/:id
exports.deleteDestination = async (req, res, next) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM destinations WHERE id = ?",
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "Destination not found.",
      });
    }

    res.json({
      message: "Destination deleted successfully.",
    });
  } catch (error) {
    if (isDbConnectionError(error)) {
      return res.status(503).json({
        message: "Database connection unavailable. Please configure cloud MySQL in Vercel to delete destinations."
      });
    }
    next(error);
  }
};
