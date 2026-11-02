const pool = require("../config/db");
const { isDbConnectionError } = pool;

// Safe helper to parse JSON fields
function safeJsonParse(data, fallback = []) {
  if (!data) return fallback;
  if (typeof data === "object") return data;
  try {
    return JSON.parse(data);
  } catch (e) {
    return fallback;
  }
}

// Format package object for API responses
function formatPackage(pkg, services = []) {
  if (!pkg) return null;

  const inclusions = safeJsonParse(pkg.inclusions, []);
  const exclusions = safeJsonParse(pkg.exclusions, []);
  const itinerary = safeJsonParse(pkg.itinerary, []);
  const importantInstructions = safeJsonParse(pkg.important_instructions, []);
  const cancellationPolicy = safeJsonParse(pkg.cancellation_policy, []);

  const pricePerPerson = Number(pkg.price_per_person) || 0;
  const originalPrice = pkg.original_price ? Number(pkg.original_price) : null;

  // Calculate supplier cost from services if provided
  let partnerTotalCost = 0;
  if (services && services.length > 0) {
    services.forEach(s => {
      // Per-traveler basis contributes directly to per-traveler partner cost
      partnerTotalCost += Number(s.cost_amount) || 0;
    });
  }

  const grossMarginInr = pricePerPerson - partnerTotalCost;
  const grossMarginPct = pricePerPerson > 0 ? Math.round((grossMarginInr / pricePerPerson) * 1000) / 10 : 0;

  return {
    id: pkg.id,
    packageCode: pkg.package_code,
    destinationId: pkg.destination_id,
    destinationName: pkg.destination_name || null,
    destinationState: pkg.destination_state || null,
    destinationCountry: pkg.destination_country || null,
    destinationImage: pkg.destination_image || null,
    name: pkg.name,
    tagline: pkg.tagline || "",
    tier: pkg.tier, // standard | comfort | premium
    description: pkg.description || "",
    durationDays: Number(pkg.duration_days) || 1,
    durationNights: Number(pkg.duration_nights) || 0,
    accommodationType: pkg.accommodation_type || "",
    mealPlan: pkg.meal_plan || "",
    transportType: pkg.transport_type || "",
    pickupDrop: pkg.pickup_drop || "",
    inclusions,
    exclusions,
    itinerary,
    importantInstructions,
    cancellationPolicy,
    pricePerPerson,
    originalPrice,
    pricingType: pkg.pricing_type || "per_person",
    maxCapacity: pkg.max_capacity ? Number(pkg.max_capacity) : 20,
    isFeatured: Boolean(pkg.is_featured),
    status: pkg.status || "active",
    partnerServices: services.map(s => ({
      id: s.id,
      packageId: s.package_id,
      partnerId: s.partner_id,
      partnerName: s.partner_name || null,
      serviceCategory: s.service_category || s.service_type || null,
      serviceName: s.service_name,
      serviceType: s.service_type,
      costAmount: Number(s.cost_amount) || 0,
      pricingBasis: s.pricing_basis || "per_traveler",
      notes: s.notes || "",
      partnerPhone: s.partner_phone || null,
      partnerEmail: s.partner_email || null
    })),
    partnerTotalCost,
    grossMarginInr,
    grossMarginPct,
    createdAt: pkg.created_at,
    updatedAt: pkg.updated_at
  };
}

// ----------------------------------------------------------------------------
// PUBLIC ENDPOINTS
// ----------------------------------------------------------------------------

/**
 * GET /api/packages
 * Public catalog of travel packages (filterable by destinationId, tier)
 */
exports.getPublicPackages = async (req, res) => {
  try {
    const { destinationId, tier, featured } = req.query;

    let query = `
      SELECT 
        p.*,
        d.name AS destination_name,
        d.state AS destination_state,
        d.country AS destination_country,
        d.image AS destination_image
      FROM travel_packages p
      LEFT JOIN destinations d ON d.id = p.destination_id
      WHERE p.status = 'active'
    `;
    const params = [];

    if (destinationId) {
      // Support numeric ID or match destination name/state
      if (Number.isInteger(Number(destinationId))) {
        query += " AND p.destination_id = ?";
        params.push(Number(destinationId));
      } else {
        query += " AND (LOWER(d.name) = LOWER(?) OR LOWER(d.state) LIKE LOWER(?))";
        params.push(destinationId.trim(), `%${destinationId.trim()}%`);
      }
    }

    if (tier && ["standard", "comfort", "premium"].includes(tier.toLowerCase())) {
      query += " AND p.tier = ?";
      params.push(tier.toLowerCase());
    }

    if (featured === "true" || featured === "1") {
      query += " AND p.is_featured = 1";
    }

    query += " ORDER BY p.destination_id ASC, FIELD(p.tier, 'standard', 'comfort', 'premium'), p.price_per_person ASC";

    const [packages] = await pool.query(query, params);

    // Fetch partner services summary count
    const [allServices] = await pool.query(`
      SELECT pps.*, pt.name AS partner_name, pt.service_category
      FROM package_partner_services pps
      LEFT JOIN partners pt ON pt.id = pps.partner_id
    `);

    const servicesByPackage = {};
    allServices.forEach(s => {
      if (!servicesByPackage[s.package_id]) servicesByPackage[s.package_id] = [];
      servicesByPackage[s.package_id].push(s);
    });

    const formatted = packages.map(pkg => formatPackage(pkg, servicesByPackage[pkg.id] || []));

    res.json({
      success: true,
      count: formatted.length,
      packages: formatted
    });
  } catch (error) {
    if (isDbConnectionError(error) || error.code === "ER_NO_SUCH_TABLE") {
      return res.json({
        success: true,
        count: 0,
        packages: []
      });
    }
    console.error("Error fetching public packages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load travel packages."
    });
  }
};

/**
 * GET /api/packages/:id
 * Detailed single package view with complete itinerary, inclusions, and partner services
 */
exports.getPackageById = async (req, res) => {
  try {
    const { id } = req.params;

    const [packages] = await pool.query(`
      SELECT 
        p.*,
        d.name AS destination_name,
        d.state AS destination_state,
        d.country AS destination_country,
        d.image AS destination_image
      FROM travel_packages p
      LEFT JOIN destinations d ON d.id = p.destination_id
      WHERE p.id = ? OR p.package_code = ?
      LIMIT 1
    `, [id, id]);

    if (packages.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Travel package not found."
      });
    }

    const pkg = packages[0];

    // Fetch linked partner services
    const [services] = await pool.query(`
      SELECT 
        pps.*,
        pt.name AS partner_name,
        pt.service_category,
        pt.phone AS partner_phone,
        pt.email AS partner_email
      FROM package_partner_services pps
      LEFT JOIN partners pt ON pt.id = pps.partner_id
      WHERE pps.package_id = ?
      ORDER BY pps.id ASC
    `, [pkg.id]);

    const formatted = formatPackage(pkg, services);

    res.json({
      success: true,
      package: formatted
    });
  } catch (error) {
    if (isDbConnectionError(error)) {
      return res.status(404).json({
        success: false,
        message: "Package details currently unavailable."
      });
    }
    console.error("Error fetching package by id:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve package details."
    });
  }
};

// ----------------------------------------------------------------------------
// ADMIN MANAGEMENT ENDPOINTS
// ----------------------------------------------------------------------------

/**
 * GET /api/packages/admin/all
 * Full package inventory for admin console with cost & margin analysis
 */
exports.getAllPackagesAdmin = async (req, res) => {
  try {
    const [packages] = await pool.query(`
      SELECT 
        p.*,
        d.name AS destination_name,
        d.state AS destination_state,
        d.country AS destination_country,
        d.image AS destination_image,
        (SELECT COUNT(*) FROM bookings b WHERE b.package_id = p.id) AS bookings_count,
        (SELECT COALESCE(SUM(b.travellers), 0) FROM bookings b WHERE b.package_id = p.id AND b.status NOT IN ('cancelled', 'rejected')) AS travelers_accommodated,
        (SELECT COALESCE(SUM(b.estimated_total), 0) FROM bookings b WHERE b.package_id = p.id AND b.status NOT IN ('cancelled', 'rejected')) AS total_revenue
      FROM travel_packages p
      LEFT JOIN destinations d ON d.id = p.destination_id
      ORDER BY p.destination_id ASC, FIELD(p.tier, 'standard', 'comfort', 'premium'), p.id ASC
    `);

    // Fetch all partner services
    const [allServices] = await pool.query(`
      SELECT 
        pps.*,
        pt.name AS partner_name,
        pt.service_category,
        pt.phone AS partner_phone,
        pt.email AS partner_email
      FROM package_partner_services pps
      LEFT JOIN partners pt ON pt.id = pps.partner_id
    `);

    const servicesByPackage = {};
    allServices.forEach(s => {
      if (!servicesByPackage[s.package_id]) servicesByPackage[s.package_id] = [];
      servicesByPackage[s.package_id].push(s);
    });

    const formatted = packages.map(pkg => {
      const pkgFormatted = formatPackage(pkg, servicesByPackage[pkg.id] || []);
      return {
        ...pkgFormatted,
        bookingsCount: Number(pkg.bookings_count) || 0,
        travelersAccommodated: Number(pkg.travelers_accommodated) || 0,
        totalRevenue: Number(pkg.total_revenue) || 0
      };
    });

    res.json({
      success: true,
      packages: formatted
    });
  } catch (error) {
    console.error("Error fetching admin packages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load packages for administration."
    });
  }
};

/**
 * POST /api/packages/admin
 * Create a new travel package with optional linked partner services
 */
exports.createPackage = async (req, res) => {
  try {
    const {
      destinationId,
      packageCode,
      name,
      tagline,
      tier,
      description,
      durationDays,
      durationNights,
      accommodationType,
      mealPlan,
      transportType,
      pickupDrop,
      inclusions,
      exclusions,
      itinerary,
      importantInstructions,
      cancellationPolicy,
      pricePerPerson,
      originalPrice,
      pricingType,
      maxCapacity,
      isFeatured,
      status,
      services
    } = req.body;

    if (!destinationId || !name || !tier || !pricePerPerson) {
      return res.status(400).json({
        success: false,
        message: "Destination, package name, tier, and price per person are required."
      });
    }

    // Auto-generate package code if missing
    let code = packageCode ? String(packageCode).trim().toUpperCase() : null;
    if (!code) {
      const prefix = name.substring(0, 3).toUpperCase();
      const rand = Math.floor(100 + Math.random() * 900);
      code = `PKG-${prefix}-${rand}`;
    }

    const [result] = await pool.query(`
      INSERT INTO travel_packages (
        destination_id, package_code, name, tagline, tier, description,
        duration_days, duration_nights, accommodation_type, meal_plan, transport_type,
        pickup_drop, inclusions, exclusions, itinerary, important_instructions,
        cancellation_policy, price_per_person, original_price, pricing_type,
        max_capacity, is_featured, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      Number(destinationId),
      code,
      name.trim(),
      tagline ? tagline.trim() : "",
      tier.toLowerCase(),
      description ? description.trim() : "",
      Number(durationDays) || 1,
      Number(durationNights) || 0,
      accommodationType || "Standard Stays",
      mealPlan || "Breakfast Included",
      transportType || "Private AC Vehicle",
      pickupDrop || "Airport / Station Transfers",
      JSON.stringify(Array.isArray(inclusions) ? inclusions : []),
      JSON.stringify(Array.isArray(exclusions) ? exclusions : []),
      JSON.stringify(Array.isArray(itinerary) ? itinerary : []),
      JSON.stringify(Array.isArray(importantInstructions) ? importantInstructions : []),
      JSON.stringify(Array.isArray(cancellationPolicy) ? cancellationPolicy : []),
      Number(pricePerPerson),
      originalPrice ? Number(originalPrice) : null,
      pricingType || "per_person",
      Number(maxCapacity) || 20,
      isFeatured ? 1 : 0,
      status || "active"
    ]);

    const newPackageId = result.insertId;

    // Insert linked partner services if supplied
    if (Array.isArray(services) && services.length > 0) {
      for (const svc of services) {
        if (svc.partnerId && svc.serviceName && svc.costAmount) {
          await pool.query(`
            INSERT INTO package_partner_services (
              package_id, partner_id, service_name, service_type, cost_amount, pricing_basis, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            newPackageId,
            svc.partnerId,
            svc.serviceName,
            svc.serviceType || "accommodation",
            Number(svc.costAmount),
            svc.pricingBasis || "per_traveler",
            svc.notes || ""
          ]);
        }
      }
    }

    // Return created package
    const [created] = await pool.query(`
      SELECT p.*, d.name AS destination_name, d.state AS destination_state, d.country AS destination_country
      FROM travel_packages p
      LEFT JOIN destinations d ON d.id = p.destination_id
      WHERE p.id = ?
    `, [newPackageId]);

    const [createdServices] = await pool.query(`
      SELECT pps.*, pt.name AS partner_name, pt.service_category
      FROM package_partner_services pps
      LEFT JOIN partners pt ON pt.id = pps.partner_id
      WHERE pps.package_id = ?
    `, [newPackageId]);

    res.status(201).json({
      success: true,
      message: "Travel package created successfully.",
      package: formatPackage(created[0], createdServices)
    });
  } catch (error) {
    console.error("Error creating package:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create package: " + error.message
    });
  }
};

/**
 * PUT /api/packages/admin/:id
 * Update an existing package and its linked partner services
 */
exports.updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      destinationId,
      packageCode,
      name,
      tagline,
      tier,
      description,
      durationDays,
      durationNights,
      accommodationType,
      mealPlan,
      transportType,
      pickupDrop,
      inclusions,
      exclusions,
      itinerary,
      importantInstructions,
      cancellationPolicy,
      pricePerPerson,
      originalPrice,
      pricingType,
      maxCapacity,
      isFeatured,
      status,
      services
    } = req.body;

    const [existing] = await pool.query("SELECT id FROM travel_packages WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Package not found."
      });
    }

    await pool.query(`
      UPDATE travel_packages SET
        destination_id = COALESCE(?, destination_id),
        package_code = COALESCE(?, package_code),
        name = COALESCE(?, name),
        tagline = COALESCE(?, tagline),
        tier = COALESCE(?, tier),
        description = COALESCE(?, description),
        duration_days = COALESCE(?, duration_days),
        duration_nights = COALESCE(?, duration_nights),
        accommodation_type = COALESCE(?, accommodation_type),
        meal_plan = COALESCE(?, meal_plan),
        transport_type = COALESCE(?, transport_type),
        pickup_drop = COALESCE(?, pickup_drop),
        inclusions = ?,
        exclusions = ?,
        itinerary = ?,
        important_instructions = ?,
        cancellation_policy = ?,
        price_per_person = COALESCE(?, price_per_person),
        original_price = ?,
        pricing_type = COALESCE(?, pricing_type),
        max_capacity = COALESCE(?, max_capacity),
        is_featured = COALESCE(?, is_featured),
        status = COALESCE(?, status)
      WHERE id = ?
    `, [
      destinationId ? Number(destinationId) : null,
      packageCode ? String(packageCode).trim().toUpperCase() : null,
      name ? name.trim() : null,
      tagline !== undefined ? tagline : null,
      tier ? tier.toLowerCase() : null,
      description !== undefined ? description : null,
      durationDays ? Number(durationDays) : null,
      durationNights !== undefined ? Number(durationNights) : null,
      accommodationType,
      mealPlan,
      transportType,
      pickupDrop,
      inclusions ? JSON.stringify(Array.isArray(inclusions) ? inclusions : safeJsonParse(inclusions)) : null,
      exclusions ? JSON.stringify(Array.isArray(exclusions) ? exclusions : safeJsonParse(exclusions)) : null,
      itinerary ? JSON.stringify(Array.isArray(itinerary) ? itinerary : safeJsonParse(itinerary)) : null,
      importantInstructions ? JSON.stringify(Array.isArray(importantInstructions) ? importantInstructions : safeJsonParse(importantInstructions)) : null,
      cancellationPolicy ? JSON.stringify(Array.isArray(cancellationPolicy) ? cancellationPolicy : safeJsonParse(cancellationPolicy)) : null,
      pricePerPerson ? Number(pricePerPerson) : null,
      originalPrice !== undefined ? (originalPrice ? Number(originalPrice) : null) : null,
      pricingType,
      maxCapacity ? Number(maxCapacity) : null,
      isFeatured !== undefined ? (isFeatured ? 1 : 0) : null,
      status,
      id
    ]);

    // If services array is explicitly provided, synchronize partner services
    if (Array.isArray(services)) {
      await pool.query("DELETE FROM package_partner_services WHERE package_id = ?", [id]);
      for (const svc of services) {
        if (svc.partnerId && svc.serviceName && svc.costAmount) {
          await pool.query(`
            INSERT INTO package_partner_services (
              package_id, partner_id, service_name, service_type, cost_amount, pricing_basis, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            id,
            svc.partnerId,
            svc.serviceName,
            svc.serviceType || "accommodation",
            Number(svc.costAmount),
            svc.pricingBasis || "per_traveler",
            svc.notes || ""
          ]);
        }
      }
    }

    // Return updated package
    const [updated] = await pool.query(`
      SELECT p.*, d.name AS destination_name, d.state AS destination_state, d.country AS destination_country
      FROM travel_packages p
      LEFT JOIN destinations d ON d.id = p.destination_id
      WHERE p.id = ?
    `, [id]);

    const [updatedServices] = await pool.query(`
      SELECT pps.*, pt.name AS partner_name, pt.service_category
      FROM package_partner_services pps
      LEFT JOIN partners pt ON pt.id = pps.partner_id
      WHERE pps.package_id = ?
    `, [id]);

    res.json({
      success: true,
      message: "Package updated successfully.",
      package: formatPackage(updated[0], updatedServices)
    });
  } catch (error) {
    console.error("Error updating package:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update package: " + error.message
    });
  }
};

/**
 * DELETE /api/packages/admin/:id
 * Safe delete: checks if existing bookings use this package; archives if so, else deletes
 */
exports.deletePackage = async (req, res) => {
  try {
    const { id } = req.params;

    const [bookings] = await pool.query("SELECT COUNT(*) AS count FROM bookings WHERE package_id = ?", [id]);

    if (bookings[0].count > 0) {
      // Historical bookings exist: do not destroy data, set status to archived
      await pool.query("UPDATE travel_packages SET status = 'archived' WHERE id = ?", [id]);
      return res.json({
        success: true,
        archived: true,
        message: `Package has ${bookings[0].count} historical booking(s). It has been safely archived to preserve historical data integrity.`
      });
    }

    // No bookings: can safely delete linked services and package
    await pool.query("DELETE FROM package_partner_services WHERE package_id = ?", [id]);
    await pool.query("DELETE FROM travel_packages WHERE id = ?", [id]);

    res.json({
      success: true,
      deleted: true,
      message: "Package deleted successfully."
    });
  } catch (error) {
    console.error("Error deleting package:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete package."
    });
  }
};

/**
 * POST /api/packages/admin/:id/services
 * Link a new partner service to a package
 */
exports.addPartnerService = async (req, res) => {
  try {
    const { id } = req.params;
    const { partnerId, serviceName, serviceType, costAmount, pricingBasis, notes } = req.body;

    if (!partnerId || !serviceName || !costAmount) {
      return res.status(400).json({
        success: false,
        message: "Partner, service name, and cost amount are required."
      });
    }

    const [result] = await pool.query(`
      INSERT INTO package_partner_services (
        package_id, partner_id, service_name, service_type, cost_amount, pricing_basis, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      partnerId,
      serviceName,
      serviceType || "accommodation",
      Number(costAmount),
      pricingBasis || "per_traveler",
      notes || ""
    ]);

    res.status(201).json({
      success: true,
      serviceId: result.insertId,
      message: "Partner service linked to package successfully."
    });
  } catch (error) {
    console.error("Error adding partner service:", error);
    res.status(500).json({
      success: false,
      message: "Failed to link partner service."
    });
  }
};

/**
 * DELETE /api/packages/admin/services/:serviceId
 * Unlink a partner service from a package
 */
exports.deletePartnerService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    await pool.query("DELETE FROM package_partner_services WHERE id = ?", [serviceId]);

    res.json({
      success: true,
      message: "Partner service unlinked successfully."
    });
  } catch (error) {
    console.error("Error deleting partner service:", error);
    res.status(500).json({
      success: false,
      message: "Failed to unlink partner service."
    });
  }
};
