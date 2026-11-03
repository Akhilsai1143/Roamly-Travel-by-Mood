const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { isDbConnectionError } = pool;
const memoryUserStore = require("../services/memoryUserStore");

const JWT_SECRET = process.env.JWT_SECRET || "roamly_jwt_fallback_secret_key_prod_2026";

// Verify the login token
async function protect(req, res, next) {
    try {
        const authorization = req.headers.authorization;

        if (!authorization || !authorization.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Please log in to continue"
            });
        }

        const token = authorization.split(" ")[1];
        if (!token) {
            return res.status(401).json({
                message: "Please log in to continue"
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        // Read the current user status & role from MySQL
        try {
            const [rows] = await pool.query(
                "SELECT id, name, email, role, is_active, deleted_at FROM users WHERE id = ?",
                [decoded.id]
            );

            if (rows.length === 0 || rows[0].deleted_at) {
                return res.status(401).json({
                    message: "Account no longer exists"
                });
            }

            if (rows[0].is_active === 0 || rows[0].is_active === false) {
                return res.status(403).json({
                    message: "Your account has been deactivated. Please contact an administrator."
                });
            }

            req.user = rows[0];
            return next();
        } catch (dbErr) {
            if (isDbConnectionError(dbErr)) {
                // Graceful fallback to memory store if MySQL is offline
                const fallbackUser = memoryUserStore.findById(decoded.id);
                if (fallbackUser) {
                    req.user = fallbackUser;
                    return next();
                }
                // Construct basic user from decoded token payload
                req.user = {
                    id: decoded.id,
                    email: decoded.email || null,
                    role: decoded.role || "user",
                    is_active: 1
                };
                return next();
            }
            throw dbErr;
        }
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired login token"
        });
    }
}

// Allow only admins
function adminOnly(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            message: "Admin access required"
        });
    }

    next();
}

// Optional authentication: attaches user if valid token exists, but does not block guests
async function optionalAuth(req, res, next) {
    try {
        const authorization = req.headers.authorization;
        if (!authorization || !authorization.startsWith("Bearer ")) {
            return next();
        }

        const token = authorization.split(" ")[1];
        if (!token) return next();

        const decoded = jwt.verify(token, JWT_SECRET);

        try {
            const [rows] = await pool.query(
                "SELECT id, name, email, role, is_active, deleted_at FROM users WHERE id = ?",
                [decoded.id]
            );

            if (rows.length > 0 && rows[0].is_active && !rows[0].deleted_at) {
                req.user = rows[0];
            }
        } catch (dbErr) {
            if (isDbConnectionError(dbErr)) {
                const fallbackUser = memoryUserStore.findById(decoded.id);
                req.user = fallbackUser || {
                    id: decoded.id,
                    role: decoded.role || "user",
                    is_active: 1
                };
            }
        }

        next();
    } catch (error) {
        // Soft fail for optional auth - continue as guest
        next();
    }
}

module.exports = {
    protect,
    adminOnly,
    optionalAuth
};
