const express = require("express");
const router = express.Router();
const { chat, planTrip, regenerateDay, geocode } = require("../controllers/aiController");
const { optionalAuth } = require("../middleware/authMiddleware");

// POST /api/ai/chat
// Supports both public guests and authenticated users
router.post("/chat", optionalAuth, chat);

// POST /api/ai/plan-trip
// Generates structured multi-day itinerary with verified GPS coordinates
router.post("/plan-trip", optionalAuth, planTrip);

// POST /api/ai/regenerate-day
// Re-rolls activities for a single day
router.post("/regenerate-day", optionalAuth, regenerateDay);

// GET /api/ai/geocode?query=City
// Proxies address geocoding with caching
router.get("/geocode", geocode);

module.exports = router;
