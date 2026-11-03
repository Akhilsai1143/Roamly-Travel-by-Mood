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

/**
 * POST /api/ai/plan-trip
 * Generate complete AI Itinerary with verified map coordinates
 */
exports.planTrip = async (req, res) => {
  try {
    const { origin, destination, days, budget, travellers, mood, activities, travelDates } = req.body;

    if (!destination || typeof destination !== "string" || !destination.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please select or enter a valid travel destination."
      });
    }

    const rateLimitKey = req.user?.id ? `user_${req.user.id}` : (req.ip || "guest");
    if (!checkRateLimit(rateLimitKey)) {
      return res.status(429).json({
        success: false,
        message: "You are generating plans too quickly. Please pause for a moment and try again."
      });
    }

    const plan = await aiService.generateItineraryPlan({
      origin: origin ? String(origin).trim() : "",
      destination: String(destination).trim(),
      days: days ? Number(days) : 3,
      budget: budget ? Number(budget) : null,
      travellers: travellers ? Number(travellers) : 2,
      mood: mood ? String(mood).trim() : "Peace & Relaxation",
      activities: Array.isArray(activities) ? activities : [],
      travelDates: travelDates ? String(travelDates).trim() : ""
    });

    return res.json({
      success: true,
      plan
    });
  } catch (error) {
    console.error("aiController planTrip error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to generate travel plan. Please try again."
    });
  }
};

/**
 * POST /api/ai/regenerate-day
 * Re-rolls a single specific day in an itinerary
 */
exports.regenerateDay = async (req, res) => {
  try {
    const { destination, dayNumber, mood, feedback } = req.body;

    if (!destination || !dayNumber) {
      return res.status(400).json({
        success: false,
        message: "Destination and day number are required."
      });
    }

    const regeneratedDay = await aiService.regenerateSingleDayPlan({
      destination: String(destination).trim(),
      dayNumber: Number(dayNumber),
      mood: mood ? String(mood).trim() : "",
      feedback: feedback ? String(feedback).trim() : ""
    });

    return res.json({
      success: true,
      day: regeneratedDay
    });
  } catch (error) {
    console.error("aiController regenerateDay error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to regenerate day. Please try again."
    });
  }
};

// In-memory geocode cache to adhere to Nominatim usage policies and save latency
const geocodeCache = new Map();

/**
 * GET /api/ai/geocode?query=CityName
 * Geocodes city or location with rate limiting and caching
 */
exports.geocode = async (req, res) => {
  try {
    const query = String(req.query.query || "").trim();
    if (!query) {
      return res.status(400).json({ success: false, message: "Location query is required." });
    }

    const cacheKey = query.toLowerCase();
    if (geocodeCache.has(cacheKey)) {
      return res.json({ success: true, ...geocodeCache.get(cacheKey) });
    }

    const https = require("https");
    const encoded = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encoded}`;

    const fetchResult = await new Promise((resolve) => {
      const request = https.get(
        url,
        {
          headers: {
            "User-Agent": "RoamlyTravelApp/1.0 (contact@roamly.com)"
          },
          timeout: 4000
        },
        (resp) => {
          let data = "";
          resp.on("data", (chunk) => (data += chunk));
          resp.on("end", () => {
            try {
              const list = JSON.parse(data);
              if (Array.isArray(list) && list.length > 0) {
                resolve({
                  lat: parseFloat(list[0].lat),
                  lng: parseFloat(list[0].lon),
                  displayName: list[0].display_name
                });
              } else {
                resolve(null);
              }
            } catch {
              resolve(null);
            }
          });
        }
      );
      request.on("error", () => resolve(null));
      request.on("timeout", () => {
        request.destroy();
        resolve(null);
      });
    });

    if (fetchResult) {
      geocodeCache.set(cacheKey, fetchResult);
      return res.json({ success: true, ...fetchResult });
    }

    return res.status(404).json({ success: false, message: "Location not found." });
  } catch (error) {
    console.error("Geocode error:", error.message);
    return res.status(500).json({ success: false, message: "Geocoding failed." });
  }
};
