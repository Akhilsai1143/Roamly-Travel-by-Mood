const pool = require("../config/db");

/**
 * GET /api/expenses
 * List all business expenses with filters
 */
exports.getAllExpenses = async (req, res) => {
  try {
    const { category, paymentStatus, startDate, endDate, packageId, partnerId, search } = req.query;

    let query = `
      SELECT 
        e.*,
        pkg.name AS package_name,
        pt.name AS partner_name,
        d.name AS destination_name
      FROM business_expenses e
      LEFT JOIN travel_packages pkg ON pkg.id = e.package_id
      LEFT JOIN partners pt ON pt.id = e.partner_id
      LEFT JOIN destinations d ON d.id = e.destination_id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      query += " AND e.category = ?";
      params.push(category);
    }

    if (paymentStatus) {
      query += " AND e.payment_status = ?";
      params.push(paymentStatus);
    }

    if (startDate) {
      query += " AND e.expense_date >= ?";
      params.push(startDate);
    }

    if (endDate) {
      query += " AND e.expense_date <= ?";
      params.push(endDate);
    }

    if (packageId) {
      query += " AND e.package_id = ?";
      params.push(Number(packageId));
    }

    if (partnerId) {
      query += " AND e.partner_id = ?";
      params.push(Number(partnerId));
    }

    if (search) {
      query += " AND (e.description LIKE ? OR e.vendor_name LIKE ? OR e.invoice_ref LIKE ? OR e.expense_code LIKE ?)";
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    query += " ORDER BY e.expense_date DESC, e.id DESC";

    const [rows] = await pool.query(query, params);

    res.json({
      success: true,
      count: rows.length,
      expenses: rows.map(r => ({
        id: r.id,
        expenseCode: r.expense_code,
        category: r.category,
        amount: Number(r.amount) || 0,
        currency: r.currency || "INR",
        expenseDate: r.expense_date,
        bookingId: r.booking_id,
        packageId: r.package_id,
        packageName: r.package_name,
        destinationId: r.destination_id,
        destinationName: r.destination_name,
        partnerId: r.partner_id,
        partnerName: r.partner_name,
        vendorName: r.vendor_name,
        description: r.description,
        paymentStatus: r.payment_status,
        invoiceRef: r.invoice_ref,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }))
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load expenses."
    });
  }
};

/**
 * POST /api/expenses
 * Create a new expense entry
 */
exports.createExpense = async (req, res) => {
  try {
    const {
      expenseCode,
      category,
      amount,
      currency,
      expenseDate,
      bookingId,
      packageId,
      destinationId,
      partnerId,
      vendorName,
      description,
      paymentStatus,
      invoiceRef
    } = req.body;

    if (!category || !amount || !description) {
      return res.status(400).json({
        success: false,
        message: "Category, amount, and description are required."
      });
    }

    // Auto-generate expense code if missing
    let code = expenseCode ? String(expenseCode).trim().toUpperCase() : null;
    if (!code) {
      const year = new Date().getFullYear();
      const rand = Math.floor(1000 + Math.random() * 9000);
      code = `EXP-${year}-${rand}`;
    }

    const [result] = await pool.query(`
      INSERT INTO business_expenses (
        expense_code, category, amount, currency, expense_date,
        booking_id, package_id, destination_id, partner_id,
        vendor_name, description, payment_status, invoice_ref, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      code,
      category,
      Number(amount),
      currency || "INR",
      expenseDate || new Date().toISOString().slice(0, 10),
      bookingId ? Number(bookingId) : null,
      packageId ? Number(packageId) : null,
      destinationId ? Number(destinationId) : null,
      partnerId ? Number(partnerId) : null,
      vendorName ? vendorName.trim() : null,
      description.trim(),
      paymentStatus || "paid",
      invoiceRef ? invoiceRef.trim() : null,
      req.user.id || null
    ]);

    const newId = result.insertId;
    const [created] = await pool.query("SELECT * FROM business_expenses WHERE id = ?", [newId]);

    res.status(201).json({
      success: true,
      message: "Expense logged successfully.",
      expense: created[0]
    });
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({
      success: false,
      message: "Failed to log expense: " + error.message
    });
  }
};

/**
 * PUT /api/expenses/:id
 * Update an expense
 */
exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      category,
      amount,
      currency,
      expenseDate,
      bookingId,
      packageId,
      destinationId,
      partnerId,
      vendorName,
      description,
      paymentStatus,
      invoiceRef
    } = req.body;

    const [existing] = await pool.query("SELECT id FROM business_expenses WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Expense not found."
      });
    }

    await pool.query(`
      UPDATE business_expenses SET
        category = COALESCE(?, category),
        amount = COALESCE(?, amount),
        currency = COALESCE(?, currency),
        expense_date = COALESCE(?, expense_date),
        booking_id = ?,
        package_id = ?,
        destination_id = ?,
        partner_id = ?,
        vendor_name = COALESCE(?, vendor_name),
        description = COALESCE(?, description),
        payment_status = COALESCE(?, payment_status),
        invoice_ref = COALESCE(?, invoice_ref)
      WHERE id = ?
    `, [
      category || null,
      amount ? Number(amount) : null,
      currency || null,
      expenseDate || null,
      bookingId ? Number(bookingId) : null,
      packageId ? Number(packageId) : null,
      destinationId ? Number(destinationId) : null,
      partnerId ? Number(partnerId) : null,
      vendorName !== undefined ? vendorName : null,
      description ? description.trim() : null,
      paymentStatus || null,
      invoiceRef !== undefined ? invoiceRef : null,
      id
    ]);

    const [updated] = await pool.query("SELECT * FROM business_expenses WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Expense updated successfully.",
      expense: updated[0]
    });
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update expense."
    });
  }
};

/**
 * DELETE /api/expenses/:id
 * Remove expense
 */
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM business_expenses WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Expense record deleted successfully."
    });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete expense."
    });
  }
};
