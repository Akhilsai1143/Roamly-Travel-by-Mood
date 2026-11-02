
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

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

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Read the current user status & role from MySQL rather than trusting
        // an old role/status stored in the token.
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
        next();
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

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [rows] = await pool.query(
            "SELECT id, name, email, role, is_active, deleted_at FROM users WHERE id = ?",
            [decoded.id]
        );

        if (rows.length > 0 && rows[0].is_active && !rows[0].deleted_at) {
            req.user = rows[0];
        }
    } catch (error) {
        // Token is invalid/expired; continue gracefully as a guest user
        req.user = null;
    }
    next();
}

module.exports = { protect, adminOnly, optionalAuth };

