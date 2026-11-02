const pool = require("../config/db");

// Helper to safely format user row (ensures passwords/hashes are never exposed)
function formatUserRow(row) {
    let travelPreferences = row.travel_preferences || [];
    if (typeof travelPreferences === "string") {
        try {
            travelPreferences = JSON.parse(travelPreferences);
        } catch {
            travelPreferences = [];
        }
    }

    return {
        id: row.id,
        name: row.name,
        firstName: row.first_name || "",
        lastName: row.last_name || "",
        email: row.email,
        phone: row.phone || "",
        role: row.role,
        isActive: Boolean(row.is_active !== undefined ? row.is_active : 1),
        lastLogin: row.last_login || null,
        createdAt: row.created_at || null,
        deletedAt: row.deleted_at || null,
        travelPreferences
    };
}

/**
 * GET /api/users/stats
 * Summary statistics for the Admin User Management dashboard
 * Distinguishes account status (active/inactive) from recent login activity
 */
exports.getUserStats = async (req, res) => {
    try {
        // Query accurate user counts
        const [statsRows] = await pool.query(`
            SELECT
                COUNT(*) AS totalUsers,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS activeUsers,
                SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS inactiveUsers,
                SUM(CASE WHEN role = 'admin' AND is_active = 1 THEN 1 ELSE 0 END) AS adminCount,
                SUM(CASE WHEN last_login >= NOW() - INTERVAL 30 DAY THEN 1 ELSE 0 END) AS recentlyActiveCount
            FROM users
            WHERE deleted_at IS NULL
        `);

        const stats = statsRows[0] || {};

        return res.status(200).json({
            totalUsers: Number(stats.totalUsers) || 0,
            activeUsers: Number(stats.activeUsers) || 0,
            inactiveUsers: Number(stats.inactiveUsers) || 0,
            adminCount: Number(stats.adminCount) || 0,
            recentlyActiveCount: Number(stats.recentlyActiveCount) || 0
        });
    } catch (error) {
        console.error("Error fetching user stats:", error);
        return res.status(500).json({
            message: "Failed to retrieve user statistics."
        });
    }
};

/**
 * GET /api/users
 * Paginated list of users with search, role filter, status filter, and sorting
 */
exports.getUsers = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const offset = (page - 1) * limit;

        const search = String(req.query.search || "").trim();
        const role = String(req.query.role || "all").trim().toLowerCase();
        const status = String(req.query.status || "all").trim().toLowerCase();
        const sort = String(req.query.sort || "newest").trim().toLowerCase();

        const whereClauses = ["deleted_at IS NULL"];
        const queryParams = [];

        // Search query by name, email, or phone
        if (search) {
            whereClauses.push("(name LIKE ? OR email LIKE ? OR phone LIKE ?)");
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }

        // Role filter ('all', 'user', 'admin')
        if (role === "user" || role === "admin") {
            whereClauses.push("role = ?");
            queryParams.push(role);
        }

        // Account status filter ('active' => 1, 'inactive' => 0)
        if (status === "active") {
            whereClauses.push("is_active = 1");
        } else if (status === "inactive") {
            whereClauses.push("is_active = 0");
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

        // Total count query for pagination metadata
        const [countResult] = await pool.query(
            `SELECT COUNT(*) AS totalItems FROM users ${whereSql}`,
            queryParams
        );
        const totalItems = countResult[0]?.totalItems || 0;
        const totalPages = Math.ceil(totalItems / limit) || 1;

        // Sorting options
        let orderByClause = "created_at DESC";
        if (sort === "oldest") {
            orderByClause = "created_at ASC";
        } else if (sort === "name_asc") {
            orderByClause = "name ASC";
        } else if (sort === "name_desc") {
            orderByClause = "name DESC";
        } else if (sort === "last_login") {
            orderByClause = "last_login DESC";
        }

        // Fetch paginated user records (explicitly excluding password)
        const [users] = await pool.query(
            `SELECT
                id,
                name,
                first_name,
                last_name,
                email,
                phone,
                role,
                is_active,
                last_login,
                created_at,
                travel_preferences
             FROM users
             ${whereSql}
             ORDER BY ${orderByClause}
             LIMIT ? OFFSET ?`,
            [...queryParams, limit, offset]
        );

        return res.status(200).json({
            users: users.map(formatUserRow),
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({
            message: "Failed to retrieve user accounts."
        });
    }
};

/**
 * GET /api/users/:id
 * Detailed profile view for a specific user, including associated booking & review counts
 */
exports.getUserById = async (req, res) => {
    try {
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            return res.status(400).json({ message: "Invalid user ID provided." });
        }

        const [rows] = await pool.query(
            `SELECT
                id,
                name,
                first_name,
                last_name,
                email,
                phone,
                role,
                is_active,
                last_login,
                created_at,
                travel_preferences,
                deleted_at
             FROM users
             WHERE id = ?`,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const user = formatUserRow(rows[0]);

        // Aggregate related counts safely
        const [bookingCounts] = await pool.query(
            "SELECT COUNT(*) AS bookingCount FROM bookings WHERE user_id = ?",
            [userId]
        );
        const [reviewCounts] = await pool.query(
            "SELECT COUNT(*) AS reviewCount FROM reviews WHERE user_id = ?",
            [userId]
        );
        const [wishlistCounts] = await pool.query(
            "SELECT COUNT(*) AS wishlistCount FROM wishlist WHERE user_id = ?",
            [userId]
        );

        return res.status(200).json({
            user: {
                ...user,
                bookingsCount: bookingCounts[0]?.bookingCount || 0,
                reviewsCount: reviewCounts[0]?.reviewCount || 0,
                wishlistCount: wishlistCounts[0]?.wishlistCount || 0
            }
        });
    } catch (error) {
        console.error("Error fetching user details:", error);
        return res.status(500).json({ message: "Failed to load user details." });
    }
};

/**
 * PATCH /api/users/:id/status
 * Activate or deactivate an account (is_active: 1 or 0)
 * Prevents self-deactivation and deactivating the last active administrator
 */
exports.updateUserStatus = async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.id, 10);
        if (isNaN(targetUserId)) {
            return res.status(400).json({ message: "Invalid user ID." });
        }

        const { isActive } = req.body;
        if (typeof isActive !== "boolean") {
            return res.status(400).json({
                message: "isActive must be a boolean value (true or false)."
            });
        }

        // Prevent self-deactivation
        if (req.user.id === targetUserId && !isActive) {
            return res.status(400).json({
                message: "You cannot deactivate your own administrator account."
            });
        }

        // Check if target user exists
        const [targetUserRows] = await pool.query(
            "SELECT id, name, email, role, is_active FROM users WHERE id = ? AND deleted_at IS NULL",
            [targetUserId]
        );

        if (targetUserRows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const targetUser = targetUserRows[0];

        // Safeguard: If target is an administrator being deactivated,
        // ensure there is at least one other active administrator
        if (targetUser.role === "admin" && !isActive) {
            const [activeAdmins] = await pool.query(
                "SELECT COUNT(*) AS activeCount FROM users WHERE role = 'admin' AND is_active = 1 AND id != ? AND deleted_at IS NULL",
                [targetUserId]
            );

            if ((activeAdmins[0]?.activeCount || 0) === 0) {
                return res.status(400).json({
                    message: "Cannot deactivate this administrator because it is the only active administrator account in the system."
                });
            }
        }

        // Update status in MySQL
        await pool.query(
            "UPDATE users SET is_active = ? WHERE id = ?",
            [isActive ? 1 : 0, targetUserId]
        );

        return res.status(200).json({
            message: `User account has been ${isActive ? "activated" : "deactivated"} successfully.`,
            userId: targetUserId,
            isActive
        });
    } catch (error) {
        console.error("Error updating user status:", error);
        return res.status(500).json({
            message: "Failed to update user status."
        });
    }
};

/**
 * PATCH /api/users/:id/role
 * Change a user's role (admin or user)
 * Prevents self-demotion and demoting the last active administrator
 */
exports.updateUserRole = async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.id, 10);
        if (isNaN(targetUserId)) {
            return res.status(400).json({ message: "Invalid user ID." });
        }

        const { role } = req.body;
        if (role !== "admin" && role !== "user") {
            return res.status(400).json({
                message: "Role must be either 'admin' or 'user'."
            });
        }

        // Prevent self-demotion
        if (req.user.id === targetUserId && role !== "admin") {
            return res.status(400).json({
                message: "You cannot remove administrator privileges from your own account."
            });
        }

        // Check target user
        const [targetUserRows] = await pool.query(
            "SELECT id, role, is_active FROM users WHERE id = ? AND deleted_at IS NULL",
            [targetUserId]
        );

        if (targetUserRows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const targetUser = targetUserRows[0];

        // Safeguard: Do not leave the system without an administrator
        if (targetUser.role === "admin" && role === "user") {
            const [adminCount] = await pool.query(
                "SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND is_active = 1 AND id != ? AND deleted_at IS NULL",
                [targetUserId]
            );

            if ((adminCount[0]?.count || 0) === 0) {
                return res.status(400).json({
                    message: "Cannot demote this user because they are the last active administrator."
                });
            }
        }

        await pool.query(
            "UPDATE users SET role = ? WHERE id = ?",
            [role, targetUserId]
        );

        return res.status(200).json({
            message: `User role updated to ${role} successfully.`,
            userId: targetUserId,
            role
        });
    } catch (error) {
        console.error("Error updating user role:", error);
        return res.status(500).json({
            message: "Failed to update user role."
        });
    }
};

/**
 * DELETE /api/users/:id
 * Delete a user account safely:
 * - Prevents self-deletion
 * - Prevents deleting the last active admin
 * - Checks foreign key relationships (bookings, reviews, wishlist)
 * - Uses soft-deletion (setting deleted_at and is_active = 0) to maintain database integrity
 * - If hard deletion is explicitly requested via ?hard=true, checks for RESTRICT constraints
 */
exports.deleteUser = async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.id, 10);
        if (isNaN(targetUserId)) {
            return res.status(400).json({ message: "Invalid user ID." });
        }

        // Prevent self-deletion
        if (req.user.id === targetUserId) {
            return res.status(400).json({
                message: "You cannot delete your own administrator account."
            });
        }

        // Check if user exists
        const [targetUserRows] = await pool.query(
            "SELECT id, name, role, is_active, deleted_at FROM users WHERE id = ?",
            [targetUserId]
        );

        if (targetUserRows.length === 0 || targetUserRows[0].deleted_at) {
            return res.status(404).json({ message: "User not found or already deleted." });
        }

        const targetUser = targetUserRows[0];

        // Safeguard: Cannot delete the last active administrator
        if (targetUser.role === "admin") {
            const [adminCount] = await pool.query(
                "SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND is_active = 1 AND id != ? AND deleted_at IS NULL",
                [targetUserId]
            );

            if ((adminCount[0]?.count || 0) === 0) {
                return res.status(400).json({
                    message: "Cannot delete this user because they are the only remaining active administrator."
                });
            }
        }

        const isHardDelete = req.query.hard === "true";

        if (isHardDelete) {
            // Check if user has associated booking records (RESTRICT foreign key constraint)
            const [bookingCheck] = await pool.query(
                "SELECT COUNT(*) AS count FROM bookings WHERE user_id = ? OR confirmed_by = ?",
                [targetUserId, targetUserId]
            );

            if ((bookingCheck[0]?.count || 0) > 0) {
                return res.status(409).json({
                    message: "Cannot permanently delete this user because they have existing trip bookings. Soft deletion (deactivation) has been preserved to protect booking history and financial records."
                });
            }

            // Safe to hard delete if no RESTRICT references exist
            await pool.query("DELETE FROM users WHERE id = ?", [targetUserId]);
            return res.status(200).json({
                message: `User "${targetUser.name}" has been permanently deleted.`
            });
        } else {
            // Soft delete: sets deleted_at timestamp and deactivates account
            // This maintains foreign key consistency for past bookings and reviews
            await pool.query(
                "UPDATE users SET deleted_at = NOW(), is_active = 0 WHERE id = ?",
                [targetUserId]
            );

            return res.status(200).json({
                message: `User "${targetUser.name}" has been removed and deactivated successfully.`
            });
        }
    } catch (error) {
        console.error("Error deleting user:", error);

        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                message: "Cannot delete user due to existing foreign key relationships in the database. Use deactivation or soft delete instead."
            });
        }

        return res.status(500).json({
            message: "Failed to delete user."
        });
    }
};
