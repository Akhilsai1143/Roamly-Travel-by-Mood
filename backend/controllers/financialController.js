const pool = require("../config/db");

// Helper to determine profit tier badge
function getMarginBadge(marginPct) {
  if (marginPct >= 30) {
    return { label: "High Margin", color: "emerald", level: "high" };
  } else if (marginPct >= 15) {
    return { label: "Moderate", color: "amber", level: "moderate" };
  } else {
    return { label: "Low Margin", color: "rose", level: "low" };
  }
}

/**
 * GET /api/financials/overview
 * Executive KPI Dashboard & Profit Analysis (Requirement 4A)
 */
exports.getFinancialOverview = async (req, res) => {
  try {
    // 1. Revenue and sales from bookings
    const [salesRows] = await pool.query(`
      SELECT 
        COUNT(*) AS total_bookings_count,
        SUM(CASE WHEN status NOT IN ('cancelled', 'rejected') THEN 1 ELSE 0 END) AS active_bookings_count,
        SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) AS paid_bookings_count,
        COALESCE(SUM(CASE WHEN status NOT IN ('cancelled', 'rejected') THEN estimated_total ELSE 0 END), 0) AS gross_sales,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN estimated_total ELSE 0 END), 0) AS paid_sales,
        COALESCE(SUM(CASE WHEN payment_status != 'paid' AND status NOT IN ('cancelled', 'rejected') THEN estimated_total ELSE 0 END), 0) AS pending_receivables,
        COALESCE(SUM(CASE WHEN status NOT IN ('cancelled', 'rejected') THEN travellers ELSE 0 END), 0) AS total_travelers
      FROM bookings
    `);
    const sales = salesRows[0] || {};

    // 2. Verified collected revenue and refunds from payments table (Note: payments.amount is stored in paise: 1 INR = 100 paise)
    const [paymentRows] = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN status IN ('captured', 'paid') THEN amount ELSE 0 END), 0) AS captured_paise,
        COALESCE(SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END), 0) AS refunded_paise,
        COUNT(CASE WHEN status IN ('captured', 'paid') THEN 1 END) AS collected_transactions_count,
        COUNT(CASE WHEN status = 'refunded' THEN 1 END) AS refunded_transactions_count
      FROM payments
    `);
    const payData = paymentRows[0] || {};
    // If captured transactions exist in payments table, convert paise to INR; otherwise fall back to booking verified paid_sales
    const capturedTransactionsCount = Number(payData.collected_transactions_count) || 0;
    const collectedRevenue = capturedTransactionsCount > 0 
      ? Math.round(Number(payData.captured_paise) / 100) 
      : Number(sales.paid_sales) || 0;
    const totalRefunds = Math.round((Number(payData.refunded_paise) || 0) / 100);
    const netCollectedRevenue = Math.max(0, collectedRevenue - totalRefunds);

    // 3. Operating & platform expenses from business_expenses
    const [expenseRows] = await pool.query(`
      SELECT 
        COALESCE(SUM(amount), 0) AS total_expenses,
        COALESCE(SUM(CASE WHEN category = 'marketing' THEN amount ELSE 0 END), 0) AS marketing_expenses,
        COALESCE(SUM(CASE WHEN category = 'operations' THEN amount ELSE 0 END), 0) AS operations_expenses,
        COALESCE(SUM(CASE WHEN category = 'gateway_fee' THEN amount ELSE 0 END), 0) AS gateway_fees,
        COALESCE(SUM(CASE WHEN category NOT IN ('marketing', 'operations', 'gateway_fee') THEN amount ELSE 0 END), 0) AS other_expenses
      FROM business_expenses
      WHERE payment_status != 'reimbursed'
    `);
    const expenses = expenseRows[0] || {};

    // 4. Calculate total supplier cost liabilities
    // Fetch all active bookings with package details
    const [bookedPackages] = await pool.query(`
      SELECT 
        b.id,
        b.package_id,
        b.travellers,
        b.estimated_total,
        b.package_details_snapshot
      FROM bookings b
      WHERE b.status NOT IN ('cancelled', 'rejected')
    `);

    // Fetch partner cost per traveler for each package
    const [packageCosts] = await pool.query(`
      SELECT 
        package_id,
        SUM(cost_amount) AS supplier_cost_per_traveler
      FROM package_partner_services
      WHERE pricing_basis = 'per_traveler'
      GROUP BY package_id
    `);

    const costMap = {};
    packageCosts.forEach(pc => {
      costMap[pc.package_id] = Number(pc.supplier_cost_per_traveler) || 0;
    });

    let packageSupplierCosts = 0;
    let customBookingCosts = 0;

    bookedPackages.forEach(b => {
      const travellers = Number(b.travellers) || 1;
      if (b.package_id && costMap[b.package_id]) {
        packageSupplierCosts += costMap[b.package_id] * travellers;
      } else {
        // Standalone booking: standard supplier benchmark is 60% of estimated budget
        customBookingCosts += (Number(b.estimated_total) || 5000 * travellers) * 0.60;
      }
    });

    const totalSupplierCost = packageSupplierCosts + customBookingCosts;
    const grossSales = Number(sales.gross_sales) || 0;
    const totalExp = Number(expenses.total_expenses) || 0;
    const grossProfit = grossSales - totalSupplierCost;
    const netOperatingProfit = grossProfit - totalExp;
    const grossMarginPct = grossSales > 0 ? Math.round((grossProfit / grossSales) * 1000) / 10 : 0;
    const netMarginPct = grossSales > 0 ? Math.round((netOperatingProfit / grossSales) * 1000) / 10 : 0;

    res.json({
      success: true,
      kpis: {
        grossSales,
        collectedRevenue,
        totalRefunds,
        netCollectedRevenue,
        pendingReceivables: Number(sales.pending_receivables) || 0,
        totalSupplierCost,
        packageSupplierCosts,
        customBookingCosts,
        totalExpenses: totalExp,
        grossProfit,
        netOperatingProfit,
        grossMarginPct,
        netMarginPct,
        totalBookings: Number(sales.total_bookings_count) || 0,
        activeBookings: Number(sales.active_bookings_count) || 0,
        paidBookings: Number(sales.paid_bookings_count) || 0,
        totalTravelers: Number(sales.total_travelers) || 0,
        expensesBreakdown: {
          marketing: Number(expenses.marketing_expenses) || 0,
          operations: Number(expenses.operations_expenses) || 0,
          gatewayFees: Number(expenses.gateway_fees) || 0,
          other: Number(expenses.other_expenses) || 0
        }
      }
    });
  } catch (error) {
    console.error("Error generating financial overview:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate financial overview."
    });
  }
};

/**
 * GET /api/financials/package-profitability
 * Package-Level Profitability Matrix (Requirement 4B)
 */
exports.getPackageProfitability = async (req, res) => {
  try {
    // 1. Fetch all packages with destination info
    const [packages] = await pool.query(`
      SELECT 
        p.id,
        p.package_code,
        p.name,
        p.tier,
        p.price_per_person,
        p.status,
        d.id AS destination_id,
        d.name AS destination_name,
        d.state AS destination_state
      FROM travel_packages p
      LEFT JOIN destinations d ON d.id = p.destination_id
      ORDER BY p.destination_id ASC, FIELD(p.tier, 'standard', 'comfort', 'premium'), p.id ASC
    `);

    // 2. Fetch linked partner services for all packages
    const [services] = await pool.query(`
      SELECT 
        pps.package_id,
        pps.cost_amount,
        pps.pricing_basis,
        pps.service_type,
        pps.service_name,
        pt.name AS partner_name
      FROM package_partner_services pps
      LEFT JOIN partners pt ON pt.id = pps.partner_id
    `);

    const servicesByPackage = {};
    services.forEach(s => {
      if (!servicesByPackage[s.package_id]) servicesByPackage[s.package_id] = [];
      servicesByPackage[s.package_id].push(s);
    });

    // 3. Fetch booking metrics per package
    const [bookingStats] = await pool.query(`
      SELECT 
        b.package_id,
        COUNT(b.id) AS bookings_count,
        COALESCE(SUM(b.travellers), 0) AS travelers_count,
        COALESCE(SUM(b.estimated_total), 0) AS total_revenue,
        SUM(CASE WHEN b.payment_status = 'paid' THEN 1 ELSE 0 END) AS paid_bookings_count,
        COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.estimated_total ELSE 0 END), 0) AS collected_revenue
      FROM bookings b
      WHERE b.package_id IS NOT NULL AND b.status NOT IN ('cancelled', 'rejected')
      GROUP BY b.package_id
    `);

    const statsByPackage = {};
    bookingStats.forEach(st => {
      statsByPackage[st.package_id] = st;
    });

    // 4. Assemble complete profitability row matching Requirement 4B
    const matrix = packages.map(pkg => {
      const pkgServices = servicesByPackage[pkg.id] || [];
      const stats = statsByPackage[pkg.id] || {
        bookings_count: 0,
        travelers_count: 0,
        total_revenue: 0,
        paid_bookings_count: 0,
        collected_revenue: 0
      };

      const sellingPrice = Number(pkg.price_per_person) || 0;
      
      // Calculate supplier cost per person
      let supplierCostPerPerson = 0;
      pkgServices.forEach(s => {
        supplierCostPerPerson += Number(s.cost_amount) || 0;
      });

      const unitMarginInr = sellingPrice - supplierCostPerPerson;
      const unitMarginPct = sellingPrice > 0 ? Math.round((unitMarginInr / sellingPrice) * 1000) / 10 : 0;

      const bookingsCount = Number(stats.bookings_count) || 0;
      const travelersAccommodated = Number(stats.travelers_count) || 0;
      
      // If there are bookings, calculate actual revenue and total supplier cost
      const totalRevenue = Number(stats.total_revenue) || (sellingPrice * travelersAccommodated);
      const totalSupplierCost = supplierCostPerPerson * travelersAccommodated;
      const totalGrossProfit = totalRevenue - totalSupplierCost;
      
      const effectiveMarginPct = totalRevenue > 0
        ? Math.round((totalGrossProfit / totalRevenue) * 1000) / 10
        : unitMarginPct;

      const badge = getMarginBadge(effectiveMarginPct);

      return {
        packageId: pkg.id,
        packageCode: pkg.package_code,
        packageName: pkg.name,
        destinationName: pkg.destination_name || "Kerala",
        destinationState: pkg.destination_state || "Kerala",
        tier: pkg.tier,
        status: pkg.status,
        bookingsCount,
        travelersAccommodated,
        sellingPricePerPerson: sellingPrice,
        supplierCostPerPerson,
        unitMarginInr,
        unitMarginPct,
        totalRevenueGenerated: totalRevenue,
        totalSupplierCost,
        grossProfit: totalGrossProfit,
        grossMarginPct: effectiveMarginPct,
        profitStatus: badge.label,
        badgeColor: badge.color,
        partnerServicesCount: pkgServices.length,
        partnerServices: pkgServices.map(s => ({
          serviceName: s.service_name,
          partnerName: s.partner_name,
          serviceType: s.service_type,
          costAmount: Number(s.cost_amount)
        }))
      };
    });

    res.json({
      success: true,
      count: matrix.length,
      matrix
    });
  } catch (error) {
    console.error("Error generating package profitability matrix:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate package profitability matrix."
    });
  }
};

/**
 * GET /api/financials/booking-ledger
 * Detailed financial breakdown of each customer booking (Requirement 4C)
 */
exports.getBookingFinancialsLedger = async (req, res) => {
  try {
    const { status, paymentStatus, search } = req.query;

    let query = `
      SELECT 
        b.id,
        b.booking_reference,
        b.user_id,
        b.contact_name,
        b.contact_email,
        b.destination_name_snapshot,
        b.package_id,
        b.package_name_snapshot,
        b.package_tier_snapshot,
        b.travellers,
        b.start_date,
        b.end_date,
        b.estimated_total,
        b.status,
        b.payment_status,
        b.payment_id,
        b.created_at,
        pkg.name AS live_package_name,
        pkg.tier AS live_package_tier,
        pkg.price_per_person AS package_selling_price
      FROM bookings b
      LEFT JOIN travel_packages pkg ON pkg.id = b.package_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += " AND b.status = ?";
      params.push(status);
    }

    if (paymentStatus) {
      query += " AND b.payment_status = ?";
      params.push(paymentStatus);
    }

    if (search) {
      query += " AND (b.booking_reference LIKE ? OR b.contact_name LIKE ? OR b.contact_email LIKE ? OR b.destination_name_snapshot LIKE ?)";
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    query += " ORDER BY b.created_at DESC";

    const [rows] = await pool.query(query, params);

    // Fetch supplier cost map
    const [costs] = await pool.query(`
      SELECT package_id, SUM(cost_amount) AS supplier_cost_per_person
      FROM package_partner_services
      GROUP BY package_id
    `);
    const costMap = {};
    costs.forEach(c => {
      costMap[c.package_id] = Number(c.supplier_cost_per_person) || 0;
    });

    const ledger = rows.map(b => {
      const travellers = Number(b.travellers) || 1;
      const sellingTotal = Number(b.estimated_total) || 0;
      
      let supplierCost = 0;
      if (b.package_id && costMap[b.package_id]) {
        supplierCost = costMap[b.package_id] * travellers;
      } else {
        supplierCost = Math.round(sellingTotal * 0.60);
      }

      const grossMargin = sellingTotal - supplierCost;
      const marginPct = sellingTotal > 0 ? Math.round((grossMargin / sellingTotal) * 1000) / 10 : 0;
      const badge = getMarginBadge(marginPct);

      return {
        id: b.id,
        bookingReference: b.booking_reference || `RMY-${b.id}`,
        customerName: b.contact_name || "Traveler",
        customerEmail: b.contact_email || "—",
        destination: b.destination_name_snapshot || "Custom Destination",
        packageName: b.package_name_snapshot || b.live_package_name || "Custom Itinerary",
        packageTier: b.package_tier_snapshot || b.live_package_tier || "custom",
        travellers,
        startDate: b.start_date,
        endDate: b.end_date,
        sellingPrice: sellingTotal,
        supplierCost,
        grossMargin,
        marginPct,
        profitStatus: badge.label,
        badgeColor: badge.color,
        bookingStatus: b.status,
        paymentStatus: b.payment_status,
        paymentId: b.payment_id,
        createdAt: b.created_at
      };
    });

    res.json({
      success: true,
      count: ledger.length,
      ledger
    });
  } catch (error) {
    console.error("Error fetching booking financials ledger:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load booking financial ledger."
    });
  }
};

/**
 * GET /api/financials/partner-liabilities
 * Partner Supplier Liabilities & Accruals Ledger (Requirement 4D)
 */
exports.getPartnerLiabilities = async (req, res) => {
  try {
    const [partners] = await pool.query(`
      SELECT 
        pt.id,
        pt.partner_code,
        pt.name,
        pt.contact_person,
        pt.email,
        pt.phone,
        pt.service_category,
        pt.operating_area,
        pt.payment_terms,
        pt.status,
        COUNT(DISTINCT pps.package_id) AS linked_packages_count,
        COUNT(pps.id) AS contracted_services_count
      FROM partners pt
      LEFT JOIN package_partner_services pps ON pps.partner_id = pt.id
      GROUP BY pt.id
      ORDER BY pt.name ASC
    `);

    // Fetch all active bookings and their packages
    const [activeBookings] = await pool.query(`
      SELECT package_id, travellers, payment_status
      FROM bookings
      WHERE status NOT IN ('cancelled', 'rejected') AND package_id IS NOT NULL
    `);

    // Fetch all service rates for each partner
    const [serviceRates] = await pool.query(`
      SELECT package_id, partner_id, cost_amount, pricing_basis
      FROM package_partner_services
    `);

    const liabilities = partners.map(partner => {
      let totalPayable = 0;
      let totalTravelersServed = 0;

      // Find services offered by this partner
      const partnerServices = serviceRates.filter(s => s.partner_id === partner.id);

      partnerServices.forEach(svc => {
        // Find bookings that used this package
        const matchedBookings = activeBookings.filter(b => b.package_id === svc.package_id);
        matchedBookings.forEach(bk => {
          const travellers = Number(bk.travellers) || 1;
          totalTravelersServed += travellers;
          totalPayable += Number(svc.cost_amount) * travellers;
        });
      });

      return {
        partnerId: partner.id,
        partnerCode: partner.partner_code || `PTR-${partner.id}`,
        name: partner.name || "Supplier",
        contactPerson: partner.contact_person || "—",
        email: partner.email || "—",
        phone: partner.phone || "—",
        serviceCategory: partner.service_category || "hotel",
        operatingArea: partner.operating_area || "Regional",
        paymentTerms: partner.payment_terms || "30 days net",
        status: partner.status || "active",
        linkedPackagesCount: Number(partner.linked_packages_count) || 0,
        contractedServicesCount: Number(partner.contracted_services_count) || 0,
        totalTravelersServed,
        totalPayableAmount: totalPayable
      };
    });

    res.json({
      success: true,
      count: liabilities.length,
      liabilities
    });
  } catch (error) {
    console.error("Error fetching partner liabilities:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load partner supplier liabilities."
    });
  }
};

/**
 * GET /api/financials/export/packages-csv
 * Stream CSV export of package profitability matrix (Requirement 4E)
 */
exports.exportPackagesCSV = async (req, res) => {
  try {
    const [packages] = await pool.query(`
      SELECT 
        p.id,
        p.package_code,
        p.name,
        p.tier,
        p.price_per_person,
        d.name AS destination_name
      FROM travel_packages p
      LEFT JOIN destinations d ON d.id = p.destination_id
      ORDER BY p.id ASC
    `);

    const [services] = await pool.query(`
      SELECT package_id, SUM(cost_amount) AS supplier_cost
      FROM package_partner_services
      GROUP BY package_id
    `);
    const costMap = {};
    services.forEach(s => {
      costMap[s.package_id] = Number(s.supplier_cost) || 0;
    });

    const [bookingStats] = await pool.query(`
      SELECT 
        package_id,
        COUNT(id) AS bookings_count,
        COALESCE(SUM(travellers), 0) AS travelers_count,
        COALESCE(SUM(estimated_total), 0) AS total_revenue
      FROM bookings
      WHERE status NOT IN ('cancelled', 'rejected') AND package_id IS NOT NULL
      GROUP BY package_id
    `);
    const statsMap = {};
    bookingStats.forEach(st => {
      statsMap[st.package_id] = st;
    });

    const headers = [
      "Package Code",
      "Package Name",
      "Destination",
      "Tier",
      "Total Bookings",
      "Travelers Accommodated",
      "Selling Price per Person (INR)",
      "Total Revenue (INR)",
      "Supplier Cost per Person (INR)",
      "Total Supplier Cost (INR)",
      "Gross Profit (INR)",
      "Gross Margin %",
      "Profit Status"
    ];

    const rows = packages.map(pkg => {
      const selling = Number(pkg.price_per_person) || 0;
      const supplierCostPerPerson = costMap[pkg.id] || 0;
      const stats = statsMap[pkg.id] || { bookings_count: 0, travelers_count: 0, total_revenue: 0 };
      const travelers = Number(stats.travelers_count) || 0;
      const revenue = Number(stats.total_revenue) || (selling * travelers);
      const totalCost = supplierCostPerPerson * travelers;
      const profit = revenue - totalCost;
      const marginPct = revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : (selling > 0 ? Math.round(((selling - supplierCostPerPerson) / selling) * 1000) / 10 : 0);
      const status = marginPct >= 30 ? "High Margin" : (marginPct >= 15 ? "Moderate Margin" : "Low Margin");

      return [
        `"${pkg.package_code || ""}"`,
        `"${pkg.name.replace(/"/g, '""')}"`,
        `"${pkg.destination_name || "Kerala"}"`,
        `"${pkg.tier.toUpperCase()}"`,
        stats.bookings_count,
        travelers,
        selling.toFixed(2),
        revenue.toFixed(2),
        supplierCostPerPerson.toFixed(2),
        totalCost.toFixed(2),
        profit.toFixed(2),
        `${marginPct}%`,
        `"${status}"`
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="roamly-package-profitability-matrix.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error("Error generating packages CSV:", error);
    res.status(500).send("Error exporting CSV: " + error.message);
  }
};

/**
 * GET /api/financials/export/bookings-csv
 * Stream CSV export of customer booking financial ledger (Requirement 4E)
 */
exports.exportBookingsCSV = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        b.booking_reference,
        b.contact_name,
        b.contact_email,
        b.destination_name_snapshot,
        b.package_name_snapshot,
        b.package_tier_snapshot,
        b.travellers,
        b.start_date,
        b.end_date,
        b.estimated_total,
        b.status,
        b.payment_status,
        b.created_at
      FROM bookings b
      ORDER BY b.created_at DESC
    `);

    const headers = [
      "Booking Reference",
      "Customer Name",
      "Customer Email",
      "Destination",
      "Package / Experience",
      "Tier",
      "Travelers",
      "Start Date",
      "End Date",
      "Total Amount (INR)",
      "Booking Status",
      "Payment Status",
      "Created At"
    ];

    const csvRows = rows.map(b => [
      `"${b.booking_reference}"`,
      `"${(b.contact_name || "").replace(/"/g, '""')}"`,
      `"${b.contact_email || ""}"`,
      `"${(b.destination_name_snapshot || "").replace(/"/g, '""')}"`,
      `"${(b.package_name_snapshot || "Custom Experience").replace(/"/g, '""')}"`,
      `"${(b.package_tier_snapshot || "custom").toUpperCase()}"`,
      b.travellers,
      b.start_date,
      b.end_date,
      Number(b.estimated_total || 0).toFixed(2),
      `"${b.status}"`,
      `"${b.payment_status}"`,
      `"${new Date(b.created_at).toISOString().slice(0, 10)}"`
    ].join(","));

    const csvContent = [headers.join(","), ...csvRows].join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="roamly-booking-financials-ledger.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error("Error generating bookings CSV:", error);
    res.status(500).send("Error exporting CSV: " + error.message);
  }
};
