require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./config/db");

const app = express();

// Import route files
const authRoutes = require("./routes/authRoutes");
const destinationRoutes = require("./routes/destinationRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const userRoutes = require("./routes/userRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const packageRoutes = require("./routes/packageRoutes");
const partnerRoutes = require("./routes/partnerRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const financialRoutes = require("./routes/financialRoutes");
const aiRoutes = require("./routes/aiRoutes");
const itineraryRoutes = require("./routes/itineraryRoutes");

// Exact CORS configuration for production and local development
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "https://roamly-travel-by-mood.vercel.app"
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser callers (e.g. curl, mobile apps, Postman)
    if (!origin) return callback(null, true);

    // In local dev, allow any localhost/127.0.0.1
    if (process.env.NODE_ENV !== "production") {
      if (
        origin.includes("localhost") ||
        origin.includes("127.0.0.1") ||
        origin.includes("vercel.app")
      ) {
        return callback(null, true);
      }
    }

    // Strict production check
    const isExact = allowedOrigins.includes(origin);
    const isConfiguredFrontend = Boolean(
      process.env.FRONTEND_URL &&
        origin === process.env.FRONTEND_URL.replace(/\/+$/, "")
    );
    // Allow Roamly Vercel production and preview deployment URLs
    const isVercelRoamlyDomain = /^https:\/\/roamly-travel-by-mood(-[a-z0-9-]+)?\.vercel\.app$/i.test(
      origin
    );

    if (isExact || isConfiguredFrontend || isVercelRoamlyDomain) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept"
  ],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Configure express.json with verify callback to capture exact rawBody buffer
// for Razorpay cryptographic webhook signature verification without breaking standard JSON parsing
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  })
);

// Check required environment configuration
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "roamly_jwt_production_secret_key_travel_by_mood_2026";
}

// Root health check
app.get("/", (req, res) => {
  res.json({
    message: "Roamly Travel API is running",
    environment: process.env.NODE_ENV || "development"
  });
});

// Database health check
app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT DATABASE() AS databaseName");

    res.json({
      status: "success",
      message: "API and MySQL are connected",
      database: rows[0].databaseName
    });
  } catch (error) {
    console.error("Database health check failed:", error.message);

    res.status(500).json({
      status: "error",
      message: "Database connection failed",
      error: process.env.NODE_ENV === "production" ? "Unable to connect to database" : error.message
    });
  }
});

// Mount routes with /api prefix
app.use("/api/auth", authRoutes);
app.use("/api/destinations", destinationRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/partners", partnerRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/financials", financialRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/itineraries", itineraryRoutes);

// Handle unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({
    message: "API endpoint not found"
  });
});

// Central error handler
app.use((error, req, res, next) => {
  console.error("API error:", error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(error.status || 500).json({
    message: error.message || "An unexpected server error occurred."
  });
});

module.exports = app;

