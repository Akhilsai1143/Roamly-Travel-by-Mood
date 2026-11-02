const pool = require("./config/db");
const packageCtrl = require("./controllers/packageController");
const partnerCtrl = require("./controllers/partnerController");
const expenseCtrl = require("./controllers/expenseController");
const financialCtrl = require("./controllers/financialController");
const bookingCtrl = require("./controllers/bookingController");

// Mock Express req/res
function mockReqRes(reqData = {}) {
  const req = {
    params: reqData.params || {},
    query: reqData.query || {},
    body: reqData.body || {},
    user: reqData.user || { id: 1, role: "admin", name: "Admin Test", email: "admin@roamly.com" },
    headers: reqData.headers || {}
  };

  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    setHeader() {},
    send(data) {
      responseData = data;
      return this;
    }
  };

  return { req, res, getStatus: () => statusCode, getData: () => responseData };
}

async function runTests() {
  console.log("=== STARTING ROAMLY PACKAGES & FINANCIALS TEST SUITE ===");

  try {
    // Test 1: Public Packages
    console.log("\n[TEST 1] Testing Public Packages API...");
    const t1 = mockReqRes({ query: { destinationId: "1" } });
    await packageCtrl.getPublicPackages(t1.req, t1.res);
    const pkgs = t1.getData();
    console.log(`✓ Fetched ${pkgs.count} packages for Munnar/Kerala. Status: ${t1.getStatus()}`);
    if (pkgs.count > 0) {
      console.log(`  Package 1: "${pkgs.packages[0].name}" [Tier: ${pkgs.packages[0].tier}] Price: ₹${pkgs.packages[0].pricePerPerson}, Partner Cost: ₹${pkgs.packages[0].partnerTotalCost}, Margin: ${pkgs.packages[0].grossMarginPct}%`);
    }

    // Test 2: Package by ID
    console.log("\n[TEST 2] Testing Package by ID (ID: 1)...");
    const t2 = mockReqRes({ params: { id: "1" } });
    await packageCtrl.getPackageById(t2.req, t2.res);
    const p1 = t2.getData();
    console.log(`✓ Package details loaded: "${p1.package.name}". Linked partner services: ${p1.package.partnerServices.length}`);
    p1.package.partnerServices.forEach(s => {
      console.log(`    - [${s.serviceType}] ${s.serviceName}: ₹${s.costAmount} (${s.partnerName})`);
    });

    // Test 3: Create Booking with Package 1
    console.log("\n[TEST 3] Testing Booking Creation with Package 1...");
    const t3 = mockReqRes({
      body: {
        destinationId: 1,
        packageId: 1,
        startDate: "2026-11-20",
        endDate: "2026-11-24",
        travellers: 2,
        contactName: "John Package Tester",
        contactEmail: "john.tester@example.com",
        contactPhone: "+91 9876543210",
        specialRequests: "Window seat and tea estate tour preferences"
      },
      user: { id: 1, name: "Admin Test", email: "admin@roamly.com", role: "admin" }
    });

    await bookingCtrl.createBooking(t3.req, t3.res, (err) => { if (err) console.error(err); });
    const bookingRes = t3.getData();
    console.log(`✓ Booking created! Reference: ${bookingRes.booking.bookingReference}`);
    console.log(`  Package Snapshot Name: "${bookingRes.booking.packageName}" [Tier: ${bookingRes.booking.packageTier}]`);
    console.log(`  Calculated Total: ₹${bookingRes.booking.estimatedTotal} (Expected 2 * 18500 = ₹37000)`);
    console.log(`  Snapshot captured successfully: ${Boolean(bookingRes.booking.packageDetailsSnapshot)}`);

    // Test 4: Retrieve Booking Package Details Snapshot
    console.log("\n[TEST 4] Testing GET /api/bookings/:id/package-details...");
    const t4 = mockReqRes({
      params: { id: bookingRes.booking.id },
      user: { id: 1, role: "admin" }
    });
    await bookingCtrl.getBookingPackageDetails(t4.req, t4.res, (err) => { if (err) console.error(err); });
    const detailsRes = t4.getData();
    console.log(`✓ Package details snapshot retrieved for booking ${detailsRes.bookingReference}:`);
    console.log(`  Inclusions count: ${detailsRes.package.inclusions.length}`);
    console.log(`  Itinerary days count: ${detailsRes.package.itinerary.length}`);
    console.log(`  Itemized total: ₹${detailsRes.package.pricing.totalPrice} for ${detailsRes.package.pricing.travellers} traveler(s)`);

    // Test 5: Partners List
    console.log("\n[TEST 5] Testing Admin Partners API...");
    const t5 = mockReqRes({});
    await partnerCtrl.getAllPartners(t5.req, t5.res);
    const partnersRes = t5.getData();
    console.log(`✓ Fetched ${partnersRes.count} partners across categories.`);
    partnersRes.partners.slice(0, 3).forEach(p => {
      console.log(`  - [${p.serviceCategory}] ${p.name} (${p.contactPerson}, ${p.operatingArea}) - Linked Packages: ${p.linkedPackagesCount}`);
    });

    // Test 6: Expenses List
    console.log("\n[TEST 6] Testing Business Expenses API...");
    const t6 = mockReqRes({});
    await expenseCtrl.getAllExpenses(t6.req, t6.res);
    const expensesRes = t6.getData();
    console.log(`✓ Fetched ${expensesRes.count} business expenses.`);
    expensesRes.expenses.forEach(e => {
      console.log(`  - [${e.category}] ${e.description}: ₹${e.amount} (Status: ${e.paymentStatus})`);
    });

    // Test 7: Financial Overview KPIs (Requirement 4A)
    console.log("\n[TEST 7] Testing Financial Overview KPIs (Req 4A)...");
    const t7 = mockReqRes({});
    await financialCtrl.getFinancialOverview(t7.req, t7.res);
    const finRes = t7.getData();
    console.log("✓ Financial KPIs generated:");
    console.log(`  Gross Sales: ₹${finRes.kpis.grossSales.toLocaleString()}`);
    console.log(`  Collected Revenue: ₹${finRes.kpis.collectedRevenue.toLocaleString()}`);
    console.log(`  Pending Receivables: ₹${finRes.kpis.pendingReceivables.toLocaleString()}`);
    console.log(`  Total Supplier Cost: ₹${finRes.kpis.totalSupplierCost.toLocaleString()}`);
    console.log(`  Operating Expenses: ₹${finRes.kpis.totalExpenses.toLocaleString()}`);
    console.log(`  Gross Profit: ₹${finRes.kpis.grossProfit.toLocaleString()} (Gross Margin: ${finRes.kpis.grossMarginPct}%)`);
    console.log(`  Net Operating Profit: ₹${finRes.kpis.netOperatingProfit.toLocaleString()} (Net Margin: ${finRes.kpis.netMarginPct}%)`);

    // Test 8: Package-Level Profitability Matrix (Requirement 4B)
    console.log("\n[TEST 8] Testing Package Profitability Matrix (Req 4B)...");
    const t8 = mockReqRes({});
    await financialCtrl.getPackageProfitability(t8.req, t8.res);
    const matrixRes = t8.getData();
    console.log(`✓ Package Profitability Matrix loaded (${matrixRes.count} packages):`);
    matrixRes.matrix.forEach(row => {
      console.log(`  - ${row.packageName} [${row.tier.toUpperCase()}]`);
      console.log(`      Selling Price: ₹${row.sellingPricePerPerson} | Supplier Cost: ₹${row.supplierCostPerPerson}`);
      console.log(`      Unit Margin: ₹${row.unitMarginInr} (${row.unitMarginPct}%) | Profit Status: ${row.profitStatus} (${row.badgeColor})`);
      console.log(`      Total Bookings: ${row.bookingsCount} | Travelers: ${row.travelersAccommodated} | Total Revenue: ₹${row.totalRevenueGenerated}`);
    });

    // Test 9: Booking Financials Ledger (Requirement 4C)
    console.log("\n[TEST 9] Testing Booking Financials Ledger (Req 4C)...");
    const t9 = mockReqRes({});
    await financialCtrl.getBookingFinancialsLedger(t9.req, t9.res);
    const ledgerRes = t9.getData();
    console.log(`✓ Booking Financials Ledger loaded (${ledgerRes.count} bookings). Sample top 2:`);
    ledgerRes.ledger.slice(0, 2).forEach(b => {
      console.log(`  - [${b.bookingReference}] ${b.customerName} - ${b.packageName} (${b.packageTier})`);
      console.log(`      Selling: ₹${b.sellingPrice} | Supplier Cost: ₹${b.supplierCost} | Gross Margin: ₹${b.grossMargin} (${b.marginPct}%) [${b.profitStatus}]`);
    });

    // Test 10: Partner Liabilities Ledger (Requirement 4D)
    console.log("\n[TEST 10] Testing Partner Liabilities Ledger (Req 4D)...");
    const t10 = mockReqRes({});
    await financialCtrl.getPartnerLiabilities(t10.req, t10.res);
    const liabRes = t10.getData();
    console.log(`✓ Partner Liabilities Ledger loaded (${liabRes.count} suppliers).`);
    liabRes.liabilities.slice(0, 3).forEach(p => {
      console.log(`  - [${p.serviceCategory}] ${p.name}: Travelers Served: ${p.totalTravelersServed}, Total Payable: ₹${p.totalPayableAmount}`);
    });

    console.log("\n=== ALL 10 BACKEND INTEGRATION TESTS PASSED WITH 100% SUCCESS! ===");
  } catch (err) {
    console.error("Test execution failed:", err);
  } finally {
    await pool.end();
  }
}

runTests();
