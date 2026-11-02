const express = require("express");
const router = express.Router();
const { chat } = require("../controllers/aiController");
const { optionalAuth } = require("../middleware/authMiddleware");

// POST /api/ai/chat
// Supports both public guests and authenticated users
router.post("/chat", optionalAuth, chat);

module.exports = router;
