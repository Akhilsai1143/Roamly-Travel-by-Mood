const express = require("express");
const router = express.Router();
const {
  getPublicPackages,
  getPackageById,
  getAllPackagesAdmin,
  createPackage,
  updatePackage,
  deletePackage,
  addPartnerService,
  deletePartnerService
} = require("../controllers/packageController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Public endpoints
router.get("/", getPublicPackages);
router.get("/:id", getPackageById);

// Admin-only endpoints
router.get("/admin/all", protect, adminOnly, getAllPackagesAdmin);
router.post("/admin", protect, adminOnly, createPackage);
router.put("/admin/:id", protect, adminOnly, updatePackage);
router.delete("/admin/:id", protect, adminOnly, deletePackage);
router.post("/admin/:id/services", protect, adminOnly, addPartnerService);
router.delete("/admin/services/:serviceId", protect, adminOnly, deletePartnerService);

module.exports = router;
