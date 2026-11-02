const express = require("express");
const router = express.Router();

const {
    getUserStats,
    getUsers,
    getUserById,
    updateUserStatus,
    updateUserRole,
    deleteUser
} = require("../controllers/userController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

// All user management routes require server-side authentication AND admin authorization
router.use(protect);
router.use(adminOnly);

// Aggregate summary statistics
router.get("/stats", getUserStats);

// Paginated user list with search, filter, and sort
router.get("/", getUsers);

// Detailed single user profile view
router.get("/:id", getUserById);

// Update account status (activate/deactivate)
router.patch("/:id/status", updateUserStatus);

// Update user role (promote to admin / demote to user)
router.patch("/:id/role", updateUserRole);

// Delete user (safe soft-delete by default, or hard-delete if requested and unreferenced)
router.delete("/:id", deleteUser);

module.exports = router;
