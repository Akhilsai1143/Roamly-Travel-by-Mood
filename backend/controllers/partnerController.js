const pool = require("../config/db");
const { isDbConnectionError } = pool;

let fallbackPartners = [];
try {
  fallbackPartners = require("../data/partners.json");
} catch {
  fallbackPartners = [];
}

/**
 * GET /api/partners
 * Fetch all partners with destination joins and linked package count
 */
exports.getAllPartners = async (req, res) => {
  try {
    const { category, destinationId, status, search } = req.query;

    let query = `
      SELECT 
        p.*,
        d.name AS destination_name,
        d.state AS destination_state,
        COUNT(DISTINCT pps.package_id) AS linked_packages_count,
        COUNT(pps.id) AS total_services_count
      FROM partners p
      LEFT JOIN destinations d ON d.id = p.destination_id
      LEFT JOIN package_partner_services pps ON pps.partner_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      query += " AND p.service_category = ?";
      params.push(category);
    }

    if (destinationId) {
      query += " AND p.destination_id = ?";
      params.push(Number(destinationId));
    }

    if (status) {
      query += " AND p.status = ?";
      params.push(status);
    }

    if (search) {
      query += " AND (p.name LIKE ? OR p.contact_person LIKE ? OR p.operating_area LIKE ? OR p.partner_code LIKE ?)";
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    query += " GROUP BY p.id ORDER BY p.name ASC";

    const [rows] = await pool.query(query, params);

    res.json({
      success: true,
      count: rows.length,
      partners: rows.map(r => ({
        id: r.id,
        partnerCode: r.partner_code,
        name: r.name,
        contactPerson: r.contact_person,
        email: r.email,
        phone: r.phone,
        serviceCategory: r.service_category, // hotel | cab | tour_operator | guide | activity
        destinationId: r.destination_id,
        destinationName: r.destination_name,
        destinationState: r.destination_state,
        operatingArea: r.operating_area,
        address: r.address,
        paymentTerms: r.payment_terms,
        status: r.status,
        internalNotes: r.internal_notes,
        linkedPackagesCount: Number(r.linked_packages_count) || 0,
        totalServicesCount: Number(r.total_services_count) || 0,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }))
    });
  } catch (error) {
    if (isDbConnectionError(error) || error.code === "ER_NO_SUCH_TABLE") {
      return res.json({
        success: true,
        count: fallbackPartners.length,
        partners: fallbackPartners.map((r) => ({
          id: r.id,
          partnerCode: r.partner_code,
          name: r.name,
          contactPerson: r.contact_person,
          email: r.email,
          phone: r.phone,
          serviceCategory: r.service_category,
          destinationId: r.destination_id,
          operatingArea: r.operating_area,
          status: r.status,
          linkedPackagesCount: 2,
          totalServicesCount: 2,
          createdAt: r.created_at
        }))
      });
    }
    console.error("Error fetching partners:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load partners."
    });
  }
};

/**
 * GET /api/partners/:id
 * Single partner profile with list of linked package services
 */
exports.getPartnerById = async (req, res) => {
  try {
    const { id } = req.params;

    const [partners] = await pool.query(`
      SELECT p.*, d.name AS destination_name, d.state AS destination_state
      FROM partners p
      LEFT JOIN destinations d ON d.id = p.destination_id
      WHERE p.id = ?
      LIMIT 1
    `, [id]);

    if (partners.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Partner not found."
      });
    }

    const partner = partners[0];

    // Fetch linked services and package names
    const [services] = await pool.query(`
      SELECT 
        pps.*,
        pkg.name AS package_name,
        pkg.package_code,
        pkg.tier AS package_tier,
        pkg.price_per_person AS package_selling_price
      FROM package_partner_services pps
      JOIN travel_packages pkg ON pkg.id = pps.package_id
      WHERE pps.partner_id = ?
      ORDER BY pkg.name ASC
    `, [id]);

    res.json({
      success: true,
      partner: {
        id: partner.id,
        partnerCode: partner.partner_code,
        name: partner.name,
        contactPerson: partner.contact_person,
        email: partner.email,
        phone: partner.phone,
        serviceCategory: partner.service_category,
        destinationId: partner.destination_id,
        destinationName: partner.destination_name,
        destinationState: partner.destination_state,
        operatingArea: partner.operating_area,
        address: partner.address,
        paymentTerms: partner.payment_terms,
        status: partner.status,
        internalNotes: partner.internal_notes,
        createdAt: partner.created_at,
        updatedAt: partner.updated_at,
        services: services.map(s => ({
          id: s.id,
          packageId: s.package_id,
          packageName: s.package_name,
          packageCode: s.package_code,
          packageTier: s.package_tier,
          packageSellingPrice: Number(s.package_selling_price),
          serviceName: s.service_name,
          serviceType: s.service_type,
          costAmount: Number(s.cost_amount),
          pricingBasis: s.pricing_basis,
          notes: s.notes
        }))
      }
    });
  } catch (error) {
    console.error("Error fetching partner details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve partner profile."
    });
  }
};

/**
 * POST /api/partners
 * Create a new partner
 */
exports.createPartner = async (req, res) => {
  try {
    const {
      partnerCode,
      name,
      contactPerson,
      email,
      phone,
      serviceCategory,
      destinationId,
      operatingArea,
      address,
      paymentTerms,
      status,
      internalNotes
    } = req.body;

    if (!name || !serviceCategory) {
      return res.status(400).json({
        success: false,
        message: "Partner name and service category are required."
      });
    }

    // Auto-generate code if empty
    let code = partnerCode ? String(partnerCode).trim().toUpperCase() : null;
    if (!code) {
      const catMap = {
        hotel: "HTL",
        cab: "CAB",
        tour_operator: "OPS",
        guide: "GDE",
        activity: "ACT"
      };
      const catPrefix = catMap[serviceCategory] || "SUP";
      const rand = Math.floor(100 + Math.random() * 900);
      code = `PTN-${catPrefix}-${rand}`;
    }

    const [result] = await pool.query(`
      INSERT INTO partners (
        partner_code, name, contact_person, email, phone, service_category,
        destination_id, operating_area, address, payment_terms, status, internal_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      code,
      name.trim(),
      contactPerson ? contactPerson.trim() : null,
      email ? email.trim() : null,
      phone ? phone.trim() : null,
      serviceCategory,
      destinationId ? Number(destinationId) : null,
      operatingArea ? operatingArea.trim() : null,
      address ? address.trim() : null,
      paymentTerms || "Net 30 days",
      status || "active",
      internalNotes ? internalNotes.trim() : null
    ]);

    const newId = result.insertId;

    const [created] = await pool.query("SELECT * FROM partners WHERE id = ?", [newId]);

    res.status(201).json({
      success: true,
      message: "Partner created successfully.",
      partner: created[0]
    });
  } catch (error) {
    console.error("Error creating partner:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create partner: " + error.message
    });
  }
};

/**
 * PUT /api/partners/:id
 * Update partner details
 */
exports.updatePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      partnerCode,
      name,
      contactPerson,
      email,
      phone,
      serviceCategory,
      destinationId,
      operatingArea,
      address,
      paymentTerms,
      status,
      internalNotes
    } = req.body;

    const [existing] = await pool.query("SELECT id FROM partners WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Partner not found."
      });
    }

    await pool.query(`
      UPDATE partners SET
        partner_code = COALESCE(?, partner_code),
        name = COALESCE(?, name),
        contact_person = COALESCE(?, contact_person),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        service_category = COALESCE(?, service_category),
        destination_id = COALESCE(?, destination_id),
        operating_area = COALESCE(?, operating_area),
        address = COALESCE(?, address),
        payment_terms = COALESCE(?, payment_terms),
        status = COALESCE(?, status),
        internal_notes = COALESCE(?, internal_notes)
      WHERE id = ?
    `, [
      partnerCode ? String(partnerCode).trim().toUpperCase() : null,
      name ? name.trim() : null,
      contactPerson !== undefined ? contactPerson : null,
      email !== undefined ? email : null,
      phone !== undefined ? phone : null,
      serviceCategory || null,
      destinationId !== undefined ? (destinationId ? Number(destinationId) : null) : null,
      operatingArea !== undefined ? operatingArea : null,
      address !== undefined ? address : null,
      paymentTerms !== undefined ? paymentTerms : null,
      status || null,
      internalNotes !== undefined ? internalNotes : null,
      id
    ]);

    const [updated] = await pool.query("SELECT * FROM partners WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Partner updated successfully.",
      partner: updated[0]
    });
  } catch (error) {
    console.error("Error updating partner:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update partner."
    });
  }
};

/**
 * DELETE /api/partners/:id
 * Delete or deactivate partner safely
 */
exports.deletePartner = async (req, res) => {
  try {
    const { id } = req.params;

    const [services] = await pool.query("SELECT COUNT(*) AS count FROM package_partner_services WHERE partner_id = ?", [id]);

    if (services[0].count > 0) {
      // Deactivate rather than hard-delete to protect foreign keys and historical margins
      await pool.query("UPDATE partners SET status = 'inactive' WHERE id = ?", [id]);
      return res.json({
        success: true,
        deactivated: true,
        message: `Partner is linked to ${services[0].count} package service(s). Status set to inactive to preserve financial records.`
      });
    }

    await pool.query("DELETE FROM partners WHERE id = ?", [id]);

    res.json({
      success: true,
      deleted: true,
      message: "Partner deleted successfully."
    });
  } catch (error) {
    console.error("Error deleting partner:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete partner."
    });
  }
};
