const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const poolConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "roamly_db",
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Enable SSL when using cloud databases (e.g. TiDB, Aiven, Railway, AWS RDS, Supabase)
if (process.env.DB_SSL === "true" || process.env.DB_SSL_MODE === "REQUIRED") {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(poolConfig);

// Prevent unhandled pool errors from terminating the process
pool.on("error", (err) => {
  console.error("Unexpected MySQL pool error:", err.message);
});

module.exports = pool;
