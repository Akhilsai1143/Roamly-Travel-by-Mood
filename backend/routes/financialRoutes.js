const express = require("express");
const router = express.Router();
const {
  getFinancialOverview,
  getPackageProfitability,
  getBookingFinancialsLedger,
  getPartnerLiabilities,
  exportPackagesCSV,
  exportBookingsCSV
} = require("../controllers/financialController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// All financial analysis routes are confidential and strictly admin-only
router.use(protect);
router.use(adminOnly);

router.get("/overview", getFinancialOverview);
router.get("/package-profitability", getPackageProfitability);
router.get("/booking-ledger", getBookingFinancialsLedger);
router.get("/partner-liabilities", getPartnerLiabilities);
router.get("/export/packages-csv", exportPackagesCSV);
router.get("/export/bookings-csv", exportBookingsCSV);

module.exports = router;
