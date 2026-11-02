const aiService = require("../services/aiService");

// Simple resilient in-memory sliding window rate limiter
// Limits each IP/user to 30 chat messages per minute
const requestCounts = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;

function checkRateLimit(key) {
  const now = Date.now();
  const clientData = requestCounts.get(key) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };

  if (now > clientData.resetTime) {
    clientData.count = 1;
    clientData.resetTime = now + RATE_LIMIT_WINDOW_MS;
    requestCounts.set(key, clientData);
    return true;
  }

  if (clientData.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  clientData.count++;
  requestCounts.set(key, clientData);
  return true;
}

// Clean up old rate limit entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * POST /api/ai/chat
 * Handles conversational queries with travel recommendations,
 * package lookups, itinerary generation, and booking status.
 */
exports.chat = async (req, res) => {
  try {
    const { message, history } = req.body;

    // 1. Validate message
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid message or travel question."
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Your message is too long. Please keep your question under 1000 characters."
      });
    }

    // 2. Apply Rate Limiting
    const rateLimitKey = req.user?.id ? `user_${req.user.id}` : (req.ip || "guest");
    const allowed = checkRateLimit(rateLimitKey);
    if (!allowed) {
      return res.status(429).json({
        success: false,
        message: "You are asking questions a bit too fast! Please pause for a moment and try again."
      });
    }

    // 3. Clean history if provided
    let cleanHistory = [];
    if (Array.isArray(history)) {
      cleanHistory = history
        .slice(-10)
        .filter(item => item && typeof item.text === "string" && (item.role === "user" || item.role === "assistant" || item.role === "model"))
        .map(item => ({
          role: item.role === "user" ? "user" : "assistant",
          text: item.text.slice(0, 800)
        }));
    }

    // 4. Generate AI response with database context
    const response = await aiService.generateTravelResponse({
      message: message.trim(),
      history: cleanHistory,
      user: req.user || null
    });

    return res.json({
      success: true,
      ...response
    });
  } catch (error) {
    console.error("aiController error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Our travel assistant encountered a momentary hiccup. Please try asking your question again in a second."
    });
  }
};
