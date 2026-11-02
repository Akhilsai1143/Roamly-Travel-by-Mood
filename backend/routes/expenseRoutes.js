const express = require("express");
const router = express.Router();
const {
  getAllExpenses,
  createExpense,
  updateExpense,
  deleteExpense
} = require("../controllers/expenseController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// All expense routes require authentication and admin role
router.use(protect);
router.use(adminOnly);

router.get("/", getAllExpenses);
router.post("/", createExpense);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

module.exports = router;
