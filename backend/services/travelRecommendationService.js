const pool = require("../config/db");

// Safe JSON parser for DB columns
function safeJsonParse(data, fallback = []) {
  if (!data) return fallback;
  if (typeof data === "object") return data;
  try {
    return JSON.parse(data);
  } catch (e) {
    return fallback;
  }
}

// Format raw DB package row into a clean public package object
function formatPackageRow(pkg) {
  if (!pkg) return null;
  return {
    id: pkg.id,
    packageCode: pkg.package_code,
    name: pkg.name,
    tagline: pkg.tagline || "",
    tier: pkg.tier, // standard, comfort, premium
    destinationId: pkg.destination_id,
    destinationName: pkg.destination_name || "Custom Destination",
    destinationState: pkg.destination_state || "",
    destinationCountry: pkg.destination_country || "India",
    destinationImage: pkg.destination_image || null,
    durationDays: Number(pkg.duration_days) || 1,
    durationNights: Number(pkg.duration_nights) || 0,
    accommodationType: pkg.accommodation_type || "Standard Hotel",
    mealPlan: pkg.meal_plan || "Breakfast included",
    transportType: pkg.transport_type || "AC Coach / Private Sedan",
    pickupDrop: pkg.pickup_drop || "Airport / Railway Station",
    pricePerPerson: Number(pkg.price_per_person) || 0,
    originalPrice: pkg.original_price ? Number(pkg.original_price) : null,
    inclusions: safeJsonParse(pkg.inclusions, []),
    exclusions: safeJsonParse(pkg.exclusions, []),
    itinerary: safeJsonParse(pkg.itinerary, []),
    status: pkg.status || "active"
  };
}

// ----------------------------------------------------------------------------
// 1. Search Real Packages from MySQL
// ----------------------------------------------------------------------------
async function searchPackages(filters = {}) {
  try {
    const {
      query = "",
      destination = "",
      tier = "",
      maxBudget = null,
      minBudget = null,
      durationDays = null,
      sortBy = "price_asc",
      limit = 6
    } = filters;

    let sql = `
      SELECT 
        p.*,
        d.name AS destination_name,
        d.state AS destination_state,
        d.country AS destination_country,
        d.image AS destination_image
      FROM travel_packages p
      LEFT JOIN destinations d ON d.id = p.destination_id
      WHERE p.status = 'active'
    `;
    const params = [];

    // Filter by destination name / state
    if (destination && destination.trim()) {
      sql += ` AND (LOWER(d.name) LIKE LOWER(?) OR LOWER(d.state) LIKE LOWER(?))`;
      params.push(`%${destination.trim()}%`, `%${destination.trim()}%`);
    }

    // Filter by tier
    if (tier && ["standard", "comfort", "premium"].includes(tier.toLowerCase())) {
      sql += ` AND p.tier = ?`;
      params.push(tier.toLowerCase());
    }

    // Budget constraints
    if (maxBudget && Number(maxBudget) > 0) {
      sql += ` AND p.price_per_person <= ?`;
      params.push(Number(maxBudget));
    }
    if (minBudget && Number(minBudget) > 0) {
      sql += ` AND p.price_per_person >= ?`;
      params.push(Number(minBudget));
    }

    // Duration constraint
    if (durationDays && Number(durationDays) > 0) {
      sql += ` AND (p.duration_days = ? OR p.duration_days BETWEEN ? AND ?)`;
      params.push(Number(durationDays), Math.max(1, Number(durationDays) - 1), Number(durationDays) + 1);
    }

    // General text query
    if (query && query.trim()) {
      const q = `%${query.trim()}%`;
      sql += ` AND (p.name LIKE ? OR p.description LIKE ? OR p.tagline LIKE ? OR d.name LIKE ?)`;
      params.push(q, q, q, q);
    }

    // Sort order
    if (sortBy === "price_desc") {
      sql += ` ORDER BY p.price_per_person DESC`;
    } else if (sortBy === "price_asc") {
      sql += ` ORDER BY p.price_per_person ASC`;
    } else {
      sql += ` ORDER BY p.is_featured DESC, p.price_per_person ASC`;
    }

    sql += ` LIMIT ?`;
    params.push(Math.min(20, Math.max(1, Number(limit) || 6)));

    const [rows] = await pool.query(sql, params);
    return rows.map(formatPackageRow);
  } catch (error) {
    console.error("travelRecommendationService: searchPackages error:", error.message);
    return [];
  }
}

// ----------------------------------------------------------------------------
// 2. Query Highest Priced Package in MySQL
// ----------------------------------------------------------------------------
async function getPackageHighestPrice() {
  try {
    const sql = `
      SELECT 
        p.*,
        d.name AS destination_name,
        d.state AS destination_state,
        d.country AS destination_country,
        d.image AS destination_image
      FROM travel_packages p
      LEFT JOIN destinations d ON d.id = p.destination_id
      WHERE p.status = 'active'
      ORDER BY p.price_per_person DESC
      LIMIT 1
    `;
    const [rows] = await pool.query(sql);
    return rows.length > 0 ? formatPackageRow(rows[0]) : null;
  } catch (error) {
    console.error("travelRecommendationService: getPackageHighestPrice error:", error.message);
    return null;
  }
}

// ----------------------------------------------------------------------------
// 3. Query Lowest Priced (Cheapest) Package in MySQL
// ----------------------------------------------------------------------------
async function getPackageLowestPrice() {
  try {
    const sql = `
      SELECT 
        p.*,
        d.name AS destination_name,
        d.state AS destination_state,
        d.country AS destination_country,
        d.image AS destination_image
      FROM travel_packages p
      LEFT JOIN destinations d ON d.id = p.destination_id
      WHERE p.status = 'active'
      ORDER BY p.price_per_person ASC
      LIMIT 1
    `;
    const [rows] = await pool.query(sql);
    return rows.length > 0 ? formatPackageRow(rows[0]) : null;
  } catch (error) {
    console.error("travelRecommendationService: getPackageLowestPrice error:", error.message);
    return null;
  }
}

// ----------------------------------------------------------------------------
// 4. Compare Packages by Identifiers (IDs or Codes)
// ----------------------------------------------------------------------------
async function comparePackages(identifiers = []) {
  try {
    if (!identifiers || identifiers.length === 0) return [];

    const ids = [];
    const codes = [];

    identifiers.forEach(item => {
      if (typeof item === "number" || (!isNaN(item) && !String(item).toUpperCase().startsWith("PKG"))) {
        ids.push(Number(item));
      } else if (typeof item === "string") {
        codes.push(item.trim());
      }
    });

    let conditions = [];
    let params = [];

    if (ids.length > 0) {
      conditions.push(`p.id IN (${ids.map(() => "?").join(",")})`);
      params.push(...ids);
    }
    if (codes.length > 0) {
      conditions.push(`p.package_code IN (${codes.map(() => "?").join(",")}) OR p.name IN (${codes.map(() => "?").join(",")})`);
      params.push(...codes, ...codes);
    }

    if (conditions.length === 0) return [];

    const sql = `
      SELECT 
        p.*,
        d.name AS destination_name,
        d.state AS destination_state,
        d.country AS destination_country,
        d.image AS destination_image
      FROM travel_packages p
      LEFT JOIN destinations d ON d.id = p.destination_id
      WHERE (${conditions.join(" OR ")})
      ORDER BY p.price_per_person ASC
    `;

    const [rows] = await pool.query(sql, params);
    return rows.map(formatPackageRow);
  } catch (error) {
    console.error("travelRecommendationService: comparePackages error:", error.message);
    return [];
  }
}

// ----------------------------------------------------------------------------
// 5. Compare Packages across Destinations (e.g. Kerala vs Goa)
// ----------------------------------------------------------------------------
async function comparePackagesByDestinations(destinations = []) {
  try {
    const results = {};
    for (const dest of destinations) {
      const cleanName = dest.trim().toLowerCase();
      const sql = `
        SELECT 
          p.*,
          d.name AS destination_name,
          d.state AS destination_state,
          d.country AS destination_country,
          d.image AS destination_image
        FROM travel_packages p
        LEFT JOIN destinations d ON d.id = p.destination_id
        WHERE p.status = 'active'
        AND (LOWER(d.name) LIKE ? OR LOWER(d.state) LIKE ?)
        ORDER BY p.price_per_person ASC
      `;
      const [rows] = await pool.query(sql, [`%${cleanName}%`, `%${cleanName}%`]);
      results[cleanName] = rows.map(formatPackageRow);
    }
    return results;
  } catch (error) {
    console.error("travelRecommendationService: comparePackagesByDestinations error:", error.message);
    return {};
  }
}

// ----------------------------------------------------------------------------
// 6. Search Destinations from MySQL
// ----------------------------------------------------------------------------
async function searchDestinations(filters = {}) {
  try {
    const {
      query = "",
      mood = "",
      category = "",
      country = "",
      limit = 6
    } = filters;

    let sql = `SELECT * FROM destinations WHERE 1=1`;
    const params = [];

    if (country && country !== "All") {
      sql += ` AND LOWER(country) = LOWER(?)`;
      params.push(country.trim());
    }

    if (category && category !== "All") {
      sql += ` AND (LOWER(category) LIKE ? OR LOWER(name) LIKE ?)`;
      params.push(`%${category.trim().toLowerCase()}%`, `%${category.trim().toLowerCase()}%`);
    }

    if (mood && mood.trim()) {
      const m = `%${mood.trim().toLowerCase()}%`;
      sql += ` AND (LOWER(mood) LIKE ? OR LOWER(category) LIKE ? OR LOWER(description) LIKE ?)`;
      params.push(m, m, m);
    }

    if (query && query.trim()) {
      const q = `%${query.trim()}%`;
      sql += ` AND (name LIKE ? OR state LIKE ? OR description LIKE ? OR mood LIKE ? OR category LIKE ?)`;
      params.push(q, q, q, q, q);
    }

    sql += ` ORDER BY id ASC LIMIT ?`;
    params.push(Math.min(20, Math.max(1, Number(limit) || 6)));

    let [rows] = await pool.query(sql, params);

    // If specific mood/query returned 0, fallback to general top destinations
    if (rows.length === 0 && (mood || query)) {
      const [fallbackRows] = await pool.query(
        "SELECT * FROM destinations ORDER BY id ASC LIMIT ?",
        [Math.min(20, Math.max(1, Number(limit) || 6))]
      );
      rows = fallbackRows;
    }

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      state: row.state,
      country: row.country,
      mood: typeof row.mood === "string" ? row.mood.split(",").map(m => m.trim()).filter(Boolean) : [],
      category: row.category || "Escape",
      budget: row.budget ? String(row.budget).replace(/\?/g, "₹") : "Contact for estimate",
      days: row.days || "3–5 days",
      bestTime: row.best_time || "Throughout the year",
      description: row.description || "",
      hiddenGem: row.hidden_gem || "",
      tip: row.tip || "",
      image: row.image || null
    }));
  } catch (error) {
    console.error("travelRecommendationService: searchDestinations error:", error.message);
    return [];
  }
}

// ----------------------------------------------------------------------------
// 7. Get Destination by Name (e.g. Ooty, Goa)
// ----------------------------------------------------------------------------
async function getDestinationByName(name = "") {
  try {
    if (!name || !name.trim()) return null;
    let cleanName = name.trim().toLowerCase();
    if (cleanName === "leh") cleanName = "ladakh";
    if (cleanName === "kerala") cleanName = "munnar";

    const sql = `
      SELECT * FROM destinations 
      WHERE LOWER(name) = ? OR LOWER(name) LIKE ? OR LOWER(state) LIKE ?
      ORDER BY (LOWER(name) = ?) DESC, id ASC
      LIMIT 1
    `;
    const [rows] = await pool.query(sql, [cleanName, `%${cleanName}%`, `%${cleanName}%`, cleanName]);
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      state: row.state,
      country: row.country,
      mood: typeof row.mood === "string" ? row.mood.split(",").map(m => m.trim()).filter(Boolean) : [],
      category: row.category || "Escape",
      budget: row.budget ? String(row.budget).replace(/\?/g, "₹") : "Contact for estimate",
      days: row.days || "3–5 days",
      bestTime: row.best_time || "Throughout the year",
      description: row.description || "",
      hiddenGem: row.hidden_gem || "",
      tip: row.tip || "",
      image: row.image || null
    };
  } catch (error) {
    console.error("travelRecommendationService: getDestinationByName error:", error.message);
    return null;
  }
}

// ----------------------------------------------------------------------------
// 8. Secure User Bookings Retrieval
// ----------------------------------------------------------------------------
async function getUserBookings(userId) {
  try {
    if (!userId) return [];

    const sql = `
      SELECT 
        b.id,
        b.booking_reference,
        b.destination_name_snapshot,
        b.package_name_snapshot,
        b.package_tier_snapshot,
        b.start_date,
        b.end_date,
        b.travellers,
        b.estimated_total,
        b.status,
        b.payment_status,
        b.payment_id,
        b.created_at,
        d.image AS destination_image
      FROM bookings b
      LEFT JOIN destinations d ON d.id = b.destination_id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
      LIMIT 10
    `;

    const [rows] = await pool.query(sql, [userId]);
    return rows;
  } catch (error) {
    console.error("travelRecommendationService: getUserBookings error:", error.message);
    return [];
  }
}

// ----------------------------------------------------------------------------
// 9. Intelligent Intent Detection Engine
// Supports:
// - GENERAL_CHAT
// - PACKAGE_SEARCH
// - PACKAGE_PRICE_LOWEST
// - PACKAGE_PRICE_HIGHEST
// - PACKAGE_COMPARISON
// - DESTINATION_RECOMMENDATION
// - ITINERARY_GENERATION
// - TRAVEL_INFORMATION
// - BOOKING_ASSISTANCE
// ----------------------------------------------------------------------------
function detectTravelIntent(message = "", history = []) {
  const text = message.toLowerCase().trim();

  // Known destination dictionary (all 34 destinations + regions + aliases)
  const popularDestinations = [
    "munnar", "kerala", "jaipur", "rajasthan", "gokarna", "karnataka",
    "spiti", "spiti valley", "udaipur", "manali", "himachal", "leh",
    "ladakh", "rishikesh", "uttarakhand", "ooty", "alleppey", "varkala",
    "goa", "andaman", "meghalaya", "shillong", "coorg", "kashmir",
    "gulmarg", "darjeeling", "gangtok", "sikkim", "pondicherry", "varanasi",
    "hampi", "agra", "maldives", "swiss alps", "thailand", "paris",
    "singapore", "dubai", "istanbul", "cape town", "tawang", "rann of kutch",
    "ananthapuram", "kadiri", "bali", "kyoto", "queenstown"
  ];

  const destinationsMentioned = [];
  popularDestinations.forEach(dest => {
    // Word boundary check to avoid partial false triggers (e.g. 'go' matching 'goa')
    const regex = new RegExp(`\\b${dest}\\b`, 'i');
    if (regex.test(text)) {
      destinationsMentioned.push(dest);
    }
  });

  let destinationMention = destinationsMentioned.length > 0 ? destinationsMentioned[0] : null;

  // Additional extraction: "visit <place>", "travel to <place>", "trip to <place>", "explore <place>", "about <place>"
  if (!destinationMention) {
    const visitMatch = text.match(/(?:i want to visit|want to visit|plan to visit|visiting|visit|travel to|going to|go to|explore|exploring|trip to|tour to|tell me about|info about|guide for)\s+([a-z\s]+)/i);
    if (visitMatch) {
      const candidate = visitMatch[1].trim().split(/[\s,?.!]+/)[0];
      if (candidate && candidate.length > 2 && !["the", "a", "an", "some", "any", "my", "our", "new", "this"].includes(candidate)) {
        destinationMention = candidate;
        destinationsMentioned.push(candidate);
      }
    }
  }

  // Mood detection
  const moods = [];
  if (/\b(peace|peaceful|relax|relaxing|quiet|calm|serene|wellness)\b/i.test(text)) moods.push("Peace");
  if (/\b(adventure|trek|trekking|rafting|thrill|hiking)\b/i.test(text)) moods.push("Adventure");
  if (/\b(nature|green|forest|hills|wildlife)\b/i.test(text)) moods.push("Nature");
  if (/\b(romantic|romance|couple|couples|honeymoon)\b/i.test(text)) moods.push("Romance");
  if (/\b(culture|heritage|history|palace|fort|temple)\b/i.test(text)) moods.push("Culture");
  if (/\b(beach|beaches|ocean|sea|coastal|island)\b/i.test(text)) moods.push("Beach");
  if (/\b(mountain|mountains|snow|hill station|hill stations|valley)\b/i.test(text)) moods.push("Mountains");
  if (/\b(family|kids|parents)\b/i.test(text)) moods.push("Family");

  // Budget extractor (e.g. "under ₹10,000", "₹10,000", "15k", "20000")
  let budget = null;
  const kMatch = text.match(/(\d+)\s*(k|thousand)/i);
  if (kMatch) {
    budget = Number(kMatch[1]) * 1000;
  } else {
    const rawNumberMatch = text.match(/(?:₹|rs\.?|inr|budget\s*(?:of|is|:)?\s*)\s*([\d,]+)/i) ||
                           text.match(/under\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/i) ||
                           text.match(/([\d,]+)\s*(?:rupees|rs|inr)/i);
    if (rawNumberMatch) {
      budget = Number(rawNumberMatch[1].replace(/,/g, ""));
    }
  }

  // Duration extractor (e.g. 3 days, 4-day, 5-day, a week, weekend)
  let duration = null;
  const dayMatch = text.match(/(\d+)\s*(?:-| )?day/i);
  if (dayMatch) {
    duration = Number(dayMatch[1]);
  } else if (/\bweekend\b/i.test(text)) {
    duration = 2;
  } else if (/\bweek\b/i.test(text)) {
    duration = 7;
  }

  // 1. Check for GENERAL_CHAT (pure greetings, identity, thanks, casual pleasantries without travel intent)
  const isGreeting = /^(hi|hello|hey|hola|namaste|greetings|good morning|good afternoon|good evening|howdy)[\s!.,?]*$/i.test(text) ||
                     /^(who are you|what is your name|how are you|tell me about yourself|what can you do)[\s!.,?]*$/i.test(text) ||
                     /^(thanks|thank you|ok|okay|cool|bye|goodbye|see you)[\s!.,?]*$/i.test(text);
  if (isGreeting && !destinationMention) {
    return {
      intent: "GENERAL_CHAT",
      parameters: { budget, duration, destinationMention, destinationsMentioned, moods, topic: "greeting" }
    };
  }

  // 2. Check for BOOKING_ASSISTANCE
  if (/\b(my booking|my bookings|my reservation|my reservations|my payment|status of my|check my booking|booked trip|cancel my booking)\b/i.test(text)) {
    return {
      intent: "BOOKING_ASSISTANCE",
      parameters: { budget, duration, destinationMention, destinationsMentioned, moods, topic: "booking" }
    };
  }

  // 3. Check for PACKAGE_PRICE_HIGHEST (highest cost, most expensive, costliest, top price)
  if (/\b(highest cost|highest price|highest priced|highest rate|most expensive|costliest|maximum cost|maximum price|top price|priciest)\b/i.test(text)) {
    return {
      intent: "PACKAGE_PRICE_HIGHEST",
      parameters: { budget, duration, destinationMention, destinationsMentioned, moods, topic: "price_highest" }
    };
  }

  // 4. Check for PACKAGE_PRICE_LOWEST (cheapest, lowest cost, lowest price, least expensive, minimum cost)
  if (/\b(cheapest|lowest cost|lowest price|lowest priced|least expensive|minimum cost|minimum price|most affordable|lowest rate)\b/i.test(text)) {
    return {
      intent: "PACKAGE_PRICE_LOWEST",
      parameters: { budget, duration, destinationMention, destinationsMentioned, moods, topic: "price_lowest" }
    };
  }

  // 5. Check for PACKAGE_COMPARISON (compare, vs, versus, difference between)
  if (/\b(compare|comparison|versus|\bvs\b|difference between|how do they compare)\b/i.test(text)) {
    return {
      intent: "PACKAGE_COMPARISON",
      parameters: { budget, duration, destinationMention, destinationsMentioned, moods, topic: "comparison" }
    };
  }

  // 6. Check for ITINERARY_GENERATION (create an itinerary, plan a 3-day trip, day plan)
  if (/\b(itinerary|day plan|day-by-day|schedule for|travel plan for)\b/i.test(text) ||
      (/\b(plan|create|make)\b/i.test(text) && /\b(trip|days|day)\b/i.test(text))) {
    return {
      intent: "ITINERARY_GENERATION",
      parameters: { budget, duration, destinationMention, destinationsMentioned, moods, topic: "itinerary" }
    };
  }

  // 7. Check for TRAVEL_INFORMATION (weather, climate, temperature, packing, how to reach)
  if (/\b(weather|temperature|climate|rainfall|rainy|monsoon season|best time to visit|how to reach|nearest airport|railway station|what to pack|packing list|packing tips|is it safe|safety)\b/i.test(text)) {
    return {
      intent: "TRAVEL_INFORMATION",
      parameters: { budget, duration, destinationMention, destinationsMentioned, moods, topic: "info" }
    };
  }

  // 8. Check for PACKAGE_SEARCH (explicitly asking for packages, package prices, or budget limit)
  if (/\b(package|packages|tour package|tour packages|holiday package|holiday packages)\b/i.test(text) ||
      (/\b(under|within|budget of)\b/i.test(text) && budget !== null)) {
    return {
      intent: "PACKAGE_SEARCH",
      parameters: { budget, duration, destinationMention, destinationsMentioned, moods, topic: "package_search" }
    };
  }

  // 9. Check for DESTINATION_RECOMMENDATION & DESTINATION INQUIRIES
  // Triggers if:
  // a) User mentions a specific destination (e.g. "i want to visit ladakh", "tell me about goa", "manali trip", "ladakh")
  // b) User asks for recommendations/places to visit ("suggest places", "where should i go", "best places for weekend")
  // c) Travel mood is specified ("peaceful mountain destinations", "romantic beach")
  if (destinationMention ||
      /\b(visit|visiting|go to|going to|explore|exploring|trip to|tour to|about|travel to|suggest|recommend|places to visit|where to travel|where should i go|destinations|places for|getaway|holiday spot|tourist places)\b/i.test(text) ||
      moods.length > 0) {
    return {
      intent: "DESTINATION_RECOMMENDATION",
      parameters: {
        budget,
        duration,
        destinationMention,
        destinationsMentioned,
        moods,
        topic: destinationMention ? "destination_guide" : "destination_recommendation",
        isSpecificDestination: Boolean(destinationMention)
      }
    };
  }

  // Default fallback to GENERAL_CHAT only if no destination, mood, or travel query was identified
  return {
    intent: "GENERAL_CHAT",
    parameters: { budget, duration, destinationMention, destinationsMentioned, moods, topic: "general" }
  };
}

// ----------------------------------------------------------------------------
// 10. Gather Specific Ground Truth MySQL Data for AI Prompt & Response
// ----------------------------------------------------------------------------
async function getRelevantDatabaseContext(userMessage = "", user = null, history = []) {
  const analysis = detectTravelIntent(userMessage, history);
  const { intent, parameters } = analysis;
  const { budget, duration, destinationMention, destinationsMentioned, moods } = parameters;

  let packages = [];
  let destinations = [];
  let userBookings = [];
  let highestPackage = null;
  let lowestPackage = null;
  let comparedPackages = {};
  let specificDestination = null;

  switch (intent) {
    case "BOOKING_ASSISTANCE":
      if (user?.id) {
        userBookings = await getUserBookings(user.id);
      }
      break;

    case "PACKAGE_PRICE_HIGHEST":
      highestPackage = await getPackageHighestPrice();
      if (highestPackage) {
        packages = [highestPackage];
      }
      break;

    case "PACKAGE_PRICE_LOWEST":
      lowestPackage = await getPackageLowestPrice();
      if (lowestPackage) {
        packages = [lowestPackage];
      }
      break;

    case "PACKAGE_COMPARISON":
      if (destinationsMentioned.length >= 2) {
        comparedPackages = await comparePackagesByDestinations(destinationsMentioned);
        // Flatten available packages for card rendering
        Object.values(comparedPackages).forEach(pkgs => {
          packages.push(...pkgs);
        });
      } else {
        // If specific package codes/identifiers or destination mentioned
        packages = await searchPackages({
          destination: destinationMention || "",
          limit: 4
        });
      }
      break;

    case "PACKAGE_SEARCH":
      if (destinationMention) {
        specificDestination = await getDestinationByName(destinationMention);
      }
      packages = await searchPackages({
        destination: destinationMention || "",
        maxBudget: budget,
        durationDays: duration,
        limit: 5
      });
      // Also get cheapest package to cite as reference if no packages match budget
      if (packages.length === 0 && budget) {
        lowestPackage = await getPackageLowestPrice();
      }
      break;

    case "DESTINATION_RECOMMENDATION":
      if (destinationMention) {
        specificDestination = await getDestinationByName(destinationMention);
        // Also fetch any packages available for this specific destination
        packages = await searchPackages({
          destination: destinationMention,
          limit: 3
        });
        destinations = specificDestination ? [specificDestination] : [];
      } else {
        destinations = await searchDestinations({
          query: (moods.includes("Mountains") ? "Mountains" : ""),
          mood: moods.find(m => m !== "Mountains") || moods[0] || "",
          category: moods.includes("Mountains") ? "Mountains" : (moods.includes("Beach") ? "Beach" : ""),
          limit: 5
        });
        packages = [];
      }
      break;

    case "ITINERARY_GENERATION":
      if (destinationMention) {
        specificDestination = await getDestinationByName(destinationMention);
      }
      packages = [];
      break;

    case "TRAVEL_INFORMATION":
      if (destinationMention) {
        specificDestination = await getDestinationByName(destinationMention);
      }
      packages = [];
      break;

    case "GENERAL_CHAT":
    default:
      packages = [];
      destinations = [];
      break;
  }

  return {
    analysis,
    packages,
    destinations,
    userBookings,
    highestPackage,
    lowestPackage,
    comparedPackages,
    specificDestination
  };
}

module.exports = {
  searchPackages,
  getPackageHighestPrice,
  getPackageLowestPrice,
  comparePackages,
  comparePackagesByDestinations,
  searchDestinations,
  getDestinationByName,
  getUserBookings,
  detectTravelIntent,
  getRelevantDatabaseContext
};
