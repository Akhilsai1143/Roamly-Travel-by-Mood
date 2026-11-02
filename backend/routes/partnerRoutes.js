const express = require("express");
const router = express.Router();
const {
  getAllPartners,
  getPartnerById,
  createPartner,
  updatePartner,
  deletePartner
} = require("../controllers/partnerController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// All partner routes require authentication and admin role
router.use(protect);
router.use(adminOnly);

router.get("/", getAllPartners);
router.get("/:id", getPartnerById);
router.post("/", createPartner);
router.put("/:id", updatePartner);
router.delete("/:id", deletePartner);

module.exports = router;
