 
const express = require("express");
const router = express.Router();

const {
  getDestinations,
  getDestination,
  createDestination,
  updateDestination,
  deleteDestination,
} = require("../controllers/destinationController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

// Public read access
router.get("/", getDestinations);
router.get("/:id", getDestination);

// Admin-only write access
router.post("/", protect, adminOnly, createDestination);
router.put("/:id", protect, adminOnly, updateDestination);
router.delete("/:id", protect, adminOnly, deleteDestination);

module.exports = router;
