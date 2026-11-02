const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

function isDbConnectionError(err) {
  if (!err) return false;
  const codes = [
    "ECONNREFUSED",
    "ETIMEDOUT",
    "ENOTFOUND",
    "EHOSTUNREACH",
    "PROTOCOL_CONNECTION_LOST",
    "ER_ACCESS_DENIED_ERROR",
    "ER_BAD_DB_ERROR",
    "EAI_AGAIN",
    "ENETUNREACH"
  ];
  return (
    codes.includes(err.code) ||
    /connect|timeout|refused|handshake|unreachable|not found|access denied/i.test(err.message || "")
  );
}

let pool;
const connectionUri = process.env.DATABASE_URL || process.env.MYSQL_URL;

if (connectionUri) {
  pool = mysql.createPool(connectionUri);
} else {
  const poolConfig = {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "roamly_db",
    charset: "utf8mb4",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 5000 // Fast fail in serverless so requests don't hang for 30s
  };

  // Enable SSL when using cloud databases (e.g. TiDB, Aiven, Railway, AWS RDS, Supabase)
  if (
    process.env.DB_SSL === "true" ||
    process.env.DB_SSL_MODE === "REQUIRED" ||
    (process.env.DB_HOST && process.env.DB_HOST !== "localhost" && process.env.DB_HOST !== "127.0.0.1")
  ) {
    poolConfig.ssl = { rejectUnauthorized: false };
  }

  pool = mysql.createPool(poolConfig);
}

// Prevent unhandled pool errors from terminating the process
pool.on("error", (err) => {
  console.warn("[MySQL Pool Error]:", err.message);
});

module.exports = pool;
module.exports.isDbConnectionError = isDbConnectionError;
