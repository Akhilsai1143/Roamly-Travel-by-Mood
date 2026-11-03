const express = require("express");
const router = express.Router();
const {
  getMyItineraries,
  getItineraryById,
  saveItinerary,
  updateItinerary,
  deleteItinerary
} = require("../controllers/itineraryController");
const { protect } = require("../middleware/authMiddleware");

// All user itinerary routes strictly require authenticated identity
router.use(protect);

router.get("/my", getMyItineraries);
router.get("/my/:id", getItineraryById);
router.post("/", saveItinerary);
router.put("/:id", updateItinerary);
router.delete("/:id", deleteItinerary);

module.exports = router;

