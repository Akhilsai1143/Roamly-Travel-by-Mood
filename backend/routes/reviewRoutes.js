const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");

// Public endpoints
router.get("/", reviewController.getReviews);
router.patch("/:id/upvote", reviewController.upvoteReview);

// Protected endpoints
router.post("/", protect, reviewController.createReview);
router.delete("/:id", protect, reviewController.deleteReview);

module.exports = router;
