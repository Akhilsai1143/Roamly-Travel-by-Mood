 
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./config/db");

const app = express();

// Import route files
const authRoutes = require("./routes/authRoutes");
const destinationRoutes = require("./routes/destinationRoutes");

// Load booking routes safely
let bookingRoutes;

try {
    bookingRoutes = require("./routes/bookingRoutes");
} catch (error) {
    console.error("Failed to load booking routes:", error.message);
    throw error;
}

app.use(cors());

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
    throw new Error("JWT_SECRET is missing from backend/.env");
}

// Root health check
app.get("/", (req, res) => {
    res.json({
        message: "Roamly Travel API is running"
    });
});

// Database health check
app.get("/api/health", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT DATABASE() AS databaseName"
        );

        res.json({
            status: "success",
            message: "API and MySQL are connected",
            database: rows[0].databaseName
        });
    } catch (error) {
        console.error("Database health check failed:", error.message);

        res.status(500).json({
            status: "error",
            message: "Database connection failed"
        });
    }
});

// Existing API routes
app.use("/api/auth", authRoutes);
app.use("/api/destinations", destinationRoutes);

// Booking API routes
app.use("/api/bookings", bookingRoutes);

// Community reviews API routes
const reviewRoutes = require("./routes/reviewRoutes");
app.use("/api/reviews", reviewRoutes);

// Admin User Management API routes
const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

// Razorpay Payment & Webhook API routes
const paymentRoutes = require("./routes/paymentRoutes");
app.use("/api/payments", paymentRoutes);

// Travel Packages & Special Packages API routes (Requirement 1 & 2)
const packageRoutes = require("./routes/packageRoutes");
app.use("/api/packages", packageRoutes);

// Partner & Supplier Management API routes (Requirement 3)
const partnerRoutes = require("./routes/partnerRoutes");
app.use("/api/partners", partnerRoutes);

// Business & Operating Expenses API routes (Requirement 4)
const expenseRoutes = require("./routes/expenseRoutes");
app.use("/api/expenses", expenseRoutes);

// Financial Overview & Profit Analysis API routes (Requirement 4)
const financialRoutes = require("./routes/financialRoutes");
app.use("/api/financials", financialRoutes);

// AI Travel Assistant API routes
const aiRoutes = require("./routes/aiRoutes");
app.use("/api/ai", aiRoutes);


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

    res.status(500).json({
        message: "An unexpected server error occurred."
    });
});

const http = require("http");
const { initSocket } = require("./config/socket");

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Roamly API and WebSocket running on port ${PORT}`);
});
