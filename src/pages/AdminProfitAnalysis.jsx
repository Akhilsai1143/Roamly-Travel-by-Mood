import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  DollarSign,
  Download,
  Calendar,
  Users,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Clock,
  Filter,
  Search,
  RefreshCw,
  Plus,
  Trash2,
  FileText,
  PieChart,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  Menu,
  X,
  CreditCard,
  Briefcase,
  Sparkles,
  Package,
  MapPin,
  HelpCircle,
  RotateCcw
} from "lucide-react";
import AdminSidebar from "../components/AdminSidebar.jsx";
import {
  getFinancialOverview,
  getPackageProfitability,
  getBookingFinancialsLedger,
  getPartnerLiabilities,
  downloadPackagesCsv,
  downloadBookingsCsv
} from "../api/financials";
import { getAllExpenses, createExpense, deleteExpense } from "../api/expenses";
import "./AdminProfitAnalysis.css";

function safeDateString(val) {
  if (!val) return "—";
  const d = new Date(val);
  return Number.isNaN(d.getTime())
    ? String(val)
    : d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
}

function safeNumber(val) {
  const num = Number(val);
  return Number.isNaN(num) ? 0 : num;
}

export default function AdminProfitAnalysis() {
  const [activeTab, setActiveTab] = useState("packages"); // 'packages' | 'bookings' | 'partners' | 'expenses'
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [matrix, setMatrix] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [liabilities, setLiabilities] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  // Mobile drawer
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 900
  );

  // Expense modal
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: "operations",
    amount: "",
    expenseDate: new Date().toISOString().slice(0, 10),
    vendorName: "",
    description: "",
    paymentStatus: "paid",
    invoiceRef: ""
  });

  // Export loading state
  const [exportingMatrix, setExportingMatrix] = useState(false);
  const [exportingLedger, setExportingLedger] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 900);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadAllFinancialData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [ovRes, matRes, ledRes, liabRes, expRes] = await Promise.all([
        getFinancialOverview(),
        getPackageProfitability(),
        getBookingFinancialsLedger(),
        getPartnerLiabilities(),
        getAllExpenses()
      ]);

      setOverview(ovRes?.kpis || null);
      setMatrix(Array.isArray(matRes?.matrix) ? matRes.matrix : []);
      setLedger(Array.isArray(ledRes?.ledger) ? ledRes.ledger : []);
      setLiabilities(Array.isArray(liabRes?.liabilities) ? liabRes.liabilities : []);
      setExpenses(Array.isArray(expRes?.expenses) ? expRes.expenses : []);
    } catch (err) {
      console.error("Failed to load financial analysis data:", err);
      setError("Failed to load financial analysis reports from MySQL. Please check server connectivity.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllFinancialData();
  }, [loadAllFinancialData]);

  // Filtered Matrix (Tab 1)
  const filteredMatrix = useMemo(() => {
    return matrix.filter((row) => {
      const term = (searchTerm || "").toLowerCase().trim();
      const matchSearch =
        !term ||
        (row.packageName && row.packageName.toLowerCase().includes(term)) ||
        (row.destinationName && row.destinationName.toLowerCase().includes(term)) ||
        (row.packageCode && row.packageCode.toLowerCase().includes(term));

      const matchTier = tierFilter === "all" || row.tier === tierFilter;
      return matchSearch && matchTier;
    });
  }, [matrix, searchTerm, tierFilter]);

  // Filtered Ledger (Tab 2)
  const filteredLedger = useMemo(() => {
    return ledger.filter((row) => {
      const term = (searchTerm || "").toLowerCase().trim();
      const matchSearch =
        !term ||
        (row.customerName && row.customerName.toLowerCase().includes(term)) ||
        (row.bookingReference && row.bookingReference.toLowerCase().includes(term)) ||
        (row.destination && row.destination.toLowerCase().includes(term)) ||
        (row.packageName && row.packageName.toLowerCase().includes(term));

      const matchPayment = paymentFilter === "all" || row.paymentStatus === paymentFilter;
      return matchSearch && matchPayment;
    });
  }, [ledger, searchTerm, paymentFilter]);

  // Filtered Liabilities (Tab 3)
  const filteredLiabilities = useMemo(() => {
    return liabilities.filter((row) => {
      const term = (searchTerm || "").toLowerCase().trim();
      return (
        !term ||
        (row.name && row.name.toLowerCase().includes(term)) ||
        (row.partnerCode && row.partnerCode.toLowerCase().includes(term)) ||
        (row.operatingArea && row.operatingArea.toLowerCase().includes(term))
      );
    });
  }, [liabilities, searchTerm]);

  // Filtered Expenses (Tab 4)
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const term = (searchTerm || "").toLowerCase().trim();
      return (
        !term ||
        (e.description && e.description.toLowerCase().includes(term)) ||
        (e.vendorName && e.vendorName.toLowerCase().includes(term)) ||
        (e.invoiceRef && e.invoiceRef.toLowerCase().includes(term))
      );
    });
  }, [expenses, searchTerm]);

  async function handleExportPackages() {
    try {
      setExportingMatrix(true);
      await downloadPackagesCsv();
      setNotice("Package Profitability Matrix exported to CSV!");
      setTimeout(() => setNotice(""), 4000);
    } catch (err) {
      console.error("Export packages CSV failed:", err);
      alert("Failed to export packages CSV.");
    } finally {
      setExportingMatrix(false);
    }
  }

  async function handleExportBookings() {
    try {
      setExportingLedger(true);
      await downloadBookingsCsv();
      setNotice("Booking Financials Ledger exported to CSV!");
      setTimeout(() => setNotice(""), 4000);
    } catch (err) {
      console.error("Export bookings CSV failed:", err);
      alert("Failed to export bookings CSV.");
    } finally {
      setExportingLedger(false);
    }
  }

  async function handleCreateExpense(e) {
    e.preventDefault();
    setSubmittingExpense(true);
    try {
      await createExpense(expenseForm);
      setNotice("Business expense logged successfully!");
      setExpenseModalOpen(false);
      setExpenseForm({
        category: "operations",
        amount: "",
        expenseDate: new Date().toISOString().slice(0, 10),
        vendorName: "",
        description: "",
        paymentStatus: "paid",
        invoiceRef: ""
      });
      loadAllFinancialData();
      setTimeout(() => setNotice(""), 4000);
    } catch (err) {
      console.error("Save expense error:", err);
      alert(err.response?.data?.message || err.message || "Failed to log expense.");
    } finally {
      setSubmittingExpense(false);
    }
  }

  async function handleDeleteExpense(id) {
    if (!window.confirm("Are you sure you want to delete this expense record?")) return;
    try {
      await deleteExpense(id);
      setNotice("Expense record removed.");
      loadAllFinancialData();
      setTimeout(() => setNotice(""), 4000);
    } catch (err) {
      console.error("Delete expense error:", err);
      alert("Failed to delete expense.");
    }
  }

  return (
    <main
      className={`admin-page admin-financials-page ${
        drawerOpen ? "drawer-open" : "drawer-closed"
      }`}
    >
      {/* MOBILE DRAWER BACKDROP */}
      {isMobile && drawerOpen && (
        <div
          className="admin-drawer-backdrop"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ADMIN SIDEBAR */}
      <AdminSidebar
        isMobile={isMobile}
        drawerOpen={drawerOpen}
        onCloseDrawer={() => setDrawerOpen(false)}
      />

      {/* MAIN ADMIN AREA */}
      <section className="admin-main">
        {/* TOPBAR */}
        <header className="admin-topbar">
          <div className="admin-topbar-header-row">
            <button
              type="button"
              className="dashboard-drawer-toggle-btn"
              onClick={() => setDrawerOpen((prev) => !prev)}
              aria-label={drawerOpen ? "Close navigation menu" : "Open navigation menu"}
              title={drawerOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <Menu size={20} />
            </button>
            <div>
              <span className="admin-breadcrumb">
                Workspace / Financial Intelligence
              </span>
              <h1>Profit & Expense Analysis</h1>
              <p>
                Executive KPIs, package margins, customer booking ledger, supplier liabilities, and operating overheads.
              </p>
            </div>
          </div>

          <div className="admin-topbar-actions">
            <button
              type="button"
              className="admin-secondary-button"
              onClick={loadAllFinancialData}
              disabled={loading}
              title="Refresh all financial matrices from MySQL"
            >
              <RefreshCw size={15} className={loading ? "admin-spinning" : ""} />
              <span>Refresh</span>
            </button>

            {activeTab === "packages" && (
              <button
                type="button"
                className="admin-primary-button"
                onClick={handleExportPackages}
                disabled={exportingMatrix}
              >
                <Download size={15} />
                <span>{exportingMatrix ? "Exporting..." : "Export Matrix CSV"}</span>
              </button>
            )}

            {activeTab === "bookings" && (
              <button
                type="button"
                className="admin-primary-button"
                onClick={handleExportBookings}
                disabled={exportingLedger}
              >
                <Download size={15} />
                <span>{exportingLedger ? "Exporting..." : "Export Ledger CSV"}</span>
              </button>
            )}

            {activeTab === "expenses" && (
              <button
                type="button"
                className="admin-primary-button"
                onClick={() => setExpenseModalOpen(true)}
              >
                <Plus size={15} />
                <span>Log Business Expense</span>
              </button>
            )}
          </div>
        </header>

        {notice && (
          <div className="admin-notice" role="status">
            <Sparkles size={18} />
            <span>{notice}</span>
          </div>
        )}

        {error && (
          <div className="admin-error" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button
              type="button"
              className="admin-secondary-button"
              style={{ marginLeft: "auto", padding: "4px 10px", fontSize: "0.8rem" }}
              onClick={loadAllFinancialData}
            >
              Retry
            </button>
          </div>
        )}

        {/* EXECUTIVE KPI DASHBOARD (Requirement 4A) */}
        {overview && (
          <div className="financial-kpi-grid">
            <article className="fin-kpi-card">
              <span className="fin-kpi-label">Gross Booked Sales</span>
              <strong className="fin-kpi-val">
                ₹{safeNumber(overview.grossSales).toLocaleString("en-IN")}
              </strong>
              <small className="fin-kpi-sub">
                {overview.activeBookings || 0} active bookings ({overview.totalTravelers || 0} travelers)
              </small>
            </article>

            <article className="fin-kpi-card fin-kpi-green">
              <span className="fin-kpi-label">Collected Revenue</span>
              <strong className="fin-kpi-val text-green">
                ₹{safeNumber(overview.collectedRevenue).toLocaleString("en-IN")}
              </strong>
              <small className="fin-kpi-sub">
                Verified captured transactions via Razorpay
              </small>
            </article>

            <article className="fin-kpi-card fin-kpi-amber">
              <span className="fin-kpi-label">Pending Receivables</span>
              <strong className="fin-kpi-val text-amber">
                ₹{safeNumber(overview.pendingReceivables).toLocaleString("en-IN")}
              </strong>
              <small className="fin-kpi-sub">
                Active bookings awaiting customer checkout
              </small>
            </article>

            <article className="fin-kpi-card">
              <span className="fin-kpi-label">Supplier Cost Liabilities</span>
              <strong className="fin-kpi-val" style={{ color: "#475569" }}>
                ₹{safeNumber(overview.totalSupplierCost).toLocaleString("en-IN")}
              </strong>
              <small className="fin-kpi-sub">
                Hotels, houseboats, cabs & guides payable
              </small>
            </article>

            <article className="fin-kpi-card fin-kpi-highlight">
              <span className="fin-kpi-label">Gross Margin & Profit</span>
              <strong className="fin-kpi-val">
                ₹{safeNumber(overview.grossProfit).toLocaleString("en-IN")}
              </strong>
              <div className="fin-margin-badge-wrap">
                <span className="fin-margin-pill pill-high">
                  {overview.grossMarginPct ?? 0}% Gross Margin
                </span>
              </div>
            </article>

            <article className="fin-kpi-card fin-kpi-highlight-dark">
              <span className="fin-kpi-label">Net Operating Profit</span>
              <strong className="fin-kpi-val text-light-green">
                ₹{safeNumber(overview.netOperatingProfit).toLocaleString("en-IN")}
              </strong>
              <div className="fin-margin-badge-wrap">
                <span className="fin-margin-pill pill-net">
                  {overview.netMarginPct ?? 0}% Net Margin
                </span>
              </div>
            </article>
          </div>
        )}

        {/* LOADING INDICATOR */}
        {loading && (
          <div className="admin-loading-card">
            <RefreshCw size={24} className="admin-spinning" />
            <p>Loading real-time financial matrices and ledger records...</p>
          </div>
        )}

        {/* FINANCIAL REPORT VIEWS */}
        <article className="admin-table-card">
          {/* TAB BAR NAVIGATION */}
          <div className="financial-tab-bar">
            <button
              type="button"
              className={`fin-tab-btn ${activeTab === "packages" ? "active" : ""}`}
              onClick={() => setActiveTab("packages")}
            >
              <Package size={16} />
              <span>1. Package Profitability Matrix (Req 4B)</span>
              <span className="fin-tab-count">{matrix.length}</span>
            </button>

            <button
              type="button"
              className={`fin-tab-btn ${activeTab === "bookings" ? "active" : ""}`}
              onClick={() => setActiveTab("bookings")}
            >
              <FileText size={16} />
              <span>2. Booking Financials Ledger (Req 4C)</span>
              <span className="fin-tab-count">{ledger.length}</span>
            </button>

            <button
              type="button"
              className={`fin-tab-btn ${activeTab === "partners" ? "active" : ""}`}
              onClick={() => setActiveTab("partners")}
            >
              <Briefcase size={16} />
              <span>3. Supplier Liabilities (Req 4D)</span>
              <span className="fin-tab-count">{liabilities.length}</span>
            </button>

            <button
              type="button"
              className={`fin-tab-btn ${activeTab === "expenses" ? "active" : ""}`}
              onClick={() => setActiveTab("expenses")}
            >
              <DollarSign size={16} />
              <span>4. Operating Expenses</span>
              <span className="fin-tab-count">{expenses.length}</span>
            </button>
          </div>

          {/* SEARCH & FILTERS BAR */}
          <div className="admin-controls-bar">
            <div className="admin-search-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder={
                  activeTab === "packages"
                    ? "Search package name, code, or destination..."
                    : activeTab === "bookings"
                    ? "Search booking reference, customer name, destination..."
                    : activeTab === "partners"
                    ? "Search partner company or operating area..."
                    : "Search expenses description or vendor..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {activeTab === "packages" && (
              <div className="admin-select-wrap">
                <Filter size={15} />
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                >
                  <option value="all">All Luxury Tiers</option>
                  <option value="standard">Standard</option>
                  <option value="comfort">Comfort</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
            )}

            {activeTab === "bookings" && (
              <div className="admin-select-wrap">
                <Filter size={15} />
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                >
                  <option value="all">All Payment Statuses</option>
                  <option value="paid">Paid in Full</option>
                  <option value="unpaid">Payment Pending</option>
                </select>
              </div>
            )}
          </div>

          {/* CONTENT SECTION 1: PACKAGE PROFITABILITY MATRIX (Requirement 4B) */}
          {activeTab === "packages" && (
            <div className="admin-table-wrap">
              <table className="admin-table fin-matrix-table">
                <thead>
                  <tr>
                    <th>1. Package & Destination</th>
                    <th>2. Tier</th>
                    <th>3. Bookings</th>
                    <th>4. Travelers</th>
                    <th>5. Selling Price / Person</th>
                    <th>6. Total Revenue</th>
                    <th>7. Supplier Cost / Person</th>
                    <th>8. Total Supplier Cost</th>
                    <th>9. Gross Profit</th>
                    <th>10. Margin %</th>
                    <th>11. Profit Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatrix.map((row) => (
                    <tr key={row.packageId}>
                      <td>
                        <div className="admin-pkg-cell">
                          <code>{row.packageCode || `PKG-${row.packageId}`}</code>
                          <strong>{row.packageName}</strong>
                          <small>
                            <MapPin size={11} /> {row.destinationName}
                            {row.destinationState ? `, ${row.destinationState}` : ""}
                          </small>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-tier-badge tier-badge-${row.tier}`}>
                          {row.tier?.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <strong>{row.bookingsCount}</strong>
                      </td>
                      <td>
                        <strong>{row.travelersAccommodated}</strong>
                      </td>
                      <td>
                        <strong>₹{safeNumber(row.sellingPricePerPerson).toLocaleString("en-IN")}</strong>
                      </td>
                      <td>
                        <strong className="text-dark">
                          ₹{safeNumber(row.totalRevenueGenerated).toLocaleString("en-IN")}
                        </strong>
                      </td>
                      <td>
                        <span style={{ color: "#475569" }}>
                          ₹{safeNumber(row.supplierCostPerPerson).toLocaleString("en-IN")}
                        </span>
                        <small style={{ display: "block", fontSize: "0.7rem", color: "#64748b" }}>
                          ({row.partnerServicesCount} services)
                        </small>
                      </td>
                      <td>
                        <span style={{ color: "#64748b" }}>
                          ₹{safeNumber(row.totalSupplierCost).toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td>
                        <strong
                          style={{
                            color: row.grossProfit >= 0 ? "#16a34a" : "#ef4444"
                          }}
                        >
                          ₹{safeNumber(row.grossProfit).toLocaleString("en-IN")}
                        </strong>
                      </td>
                      <td>
                        <span className="fin-pct-badge">{row.grossMarginPct}%</span>
                      </td>
                      <td>
                        <span className={`profit-status-badge badge-${row.badgeColor || "amber"}`}>
                          {row.profitStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredMatrix.length === 0 && !loading && (
                    <tr>
                      <td colSpan="11" style={{ textAlign: "center", padding: "40px" }}>
                        <div className="admin-empty-table">
                          <Package size={36} color="#94a3b8" />
                          <h4>No travel package records found</h4>
                          <p>Try clearing your search or tier filter.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* CONTENT SECTION 2: BOOKING FINANCIALS LEDGER (Requirement 4C) */}
          {activeTab === "bookings" && (
            <div className="admin-table-wrap">
              <table className="admin-table fin-ledger-table">
                <thead>
                  <tr>
                    <th>Booking Reference</th>
                    <th>Customer</th>
                    <th>Destination & Package</th>
                    <th>Tier</th>
                    <th>Pax</th>
                    <th>Selling Total</th>
                    <th>Supplier Cost</th>
                    <th>Gross Margin</th>
                    <th>Margin %</th>
                    <th>Status</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLedger.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <code style={{ fontFamily: "monospace", fontWeight: 700, color: "#1b4332" }}>
                          {b.bookingReference}
                        </code>
                        <small style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>
                          {safeDateString(b.createdAt)}
                        </small>
                      </td>
                      <td>
                        <strong>{b.customerName}</strong>
                        <small style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>
                          {b.customerEmail}
                        </small>
                      </td>
                      <td>
                        <strong>{b.destination}</strong>
                        <small style={{ display: "block", fontSize: "0.75rem", color: "#475569" }}>
                          {b.packageName}
                        </small>
                      </td>
                      <td>
                        <span className={`admin-tier-badge tier-badge-${b.packageTier}`}>
                          {b.packageTier?.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <strong>{b.travellers}</strong>
                      </td>
                      <td>
                        <strong>₹{safeNumber(b.sellingPrice).toLocaleString("en-IN")}</strong>
                      </td>
                      <td>
                        <span style={{ color: "#475569" }}>
                          ₹{safeNumber(b.supplierCost).toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td>
                        <strong
                          style={{
                            color: b.grossMargin >= 0 ? "#16a34a" : "#ef4444"
                          }}
                        >
                          ₹{safeNumber(b.grossMargin).toLocaleString("en-IN")}
                        </strong>
                      </td>
                      <td>
                        <span className="fin-pct-badge">{b.marginPct}%</span>
                      </td>
                      <td>
                        <span className={`admin-status-pill status-${b.bookingStatus}`}>
                          {b.bookingStatus}
                        </span>
                      </td>
                      <td>
                        {b.paymentStatus === "paid" ? (
                          <span
                            className="admin-status-pill status-confirmed"
                            style={{ background: "#dcfce7", color: "#166534" }}
                          >
                            Paid
                          </span>
                        ) : (
                          <span
                            className="admin-status-pill"
                            style={{ background: "#fef3c7", color: "#92400e" }}
                          >
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredLedger.length === 0 && !loading && (
                    <tr>
                      <td colSpan="11" style={{ textAlign: "center", padding: "40px" }}>
                        <div className="admin-empty-table">
                          <FileText size={36} color="#94a3b8" />
                          <h4>No booking financial records match</h4>
                          <p>No customer bookings found with the specified parameters.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* CONTENT SECTION 3: PARTNER LIABILITIES LEDGER (Requirement 4D) */}
          {activeTab === "partners" && (
            <div className="admin-table-wrap">
              <table className="admin-table fin-liabilities-table">
                <thead>
                  <tr>
                    <th>Partner Code & Name</th>
                    <th>Category</th>
                    <th>Contact Person</th>
                    <th>Operating Area</th>
                    <th>Payment Terms</th>
                    <th>Linked Services</th>
                    <th>Travelers Served</th>
                    <th>Total Accrued Payable</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLiabilities.map((ptn) => (
                    <tr key={ptn.partnerId}>
                      <td>
                        <code>{ptn.partnerCode}</code>
                        <strong style={{ display: "block", marginTop: "2px" }}>{ptn.name}</strong>
                      </td>
                      <td>
                        <span
                          className="partner-category-pill"
                          style={{ background: "#f1f5f9", color: "#334155" }}
                        >
                          {ptn.serviceCategory?.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <strong>{ptn.contactPerson || "—"}</strong>
                        <small style={{ display: "block", color: "#64748b" }}>{ptn.phone}</small>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.85rem", color: "#334155" }}>
                          {ptn.operatingArea || "Regional"}
                        </span>
                      </td>
                      <td>
                        <span className="payment-terms-badge">{ptn.paymentTerms}</span>
                      </td>
                      <td>
                        <strong>{ptn.contractedServicesCount}</strong> services
                      </td>
                      <td>
                        <strong>{ptn.totalTravelersServed}</strong> travelers
                      </td>
                      <td>
                        <strong style={{ fontSize: "1.05rem", color: "#0f172a" }}>
                          ₹{safeNumber(ptn.totalPayableAmount).toLocaleString("en-IN")}
                        </strong>
                      </td>
                    </tr>
                  ))}
                  {filteredLiabilities.length === 0 && !loading && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center", padding: "40px" }}>
                        <div className="admin-empty-table">
                          <Briefcase size={36} color="#94a3b8" />
                          <h4>No partner supplier liabilities found</h4>
                          <p>Add supplier agreements under Partners & Suppliers console.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* CONTENT SECTION 4: OPERATING EXPENSES */}
          {activeTab === "expenses" && (
            <div className="admin-table-wrap">
              <table className="admin-table fin-expenses-table">
                <thead>
                  <tr>
                    <th>Expense Code & Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Vendor</th>
                    <th>Amount (INR)</th>
                    <th>Invoice Ref</th>
                    <th>Payment Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <code>{e.expenseCode || `EXP-${e.id}`}</code>
                        <small style={{ display: "block", color: "#64748b" }}>
                          {safeDateString(e.expenseDate)}
                        </small>
                      </td>
                      <td>
                        <span className="expense-category-pill">{e.category?.toUpperCase()}</span>
                      </td>
                      <td>
                        <strong>{e.description}</strong>
                      </td>
                      <td>
                        <span>{e.vendorName || "—"}</span>
                      </td>
                      <td>
                        <strong>₹{safeNumber(e.amount).toLocaleString("en-IN")}</strong>
                      </td>
                      <td>
                        <code>{e.invoiceRef || "—"}</code>
                      </td>
                      <td>
                        <span className="admin-status-pill status-confirmed">{e.paymentStatus}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-icon-action delete"
                          onClick={() => handleDeleteExpense(e.id)}
                          title="Delete Expense"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredExpenses.length === 0 && !loading && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center", padding: "40px" }}>
                        <div className="admin-empty-table">
                          <DollarSign size={36} color="#94a3b8" />
                          <h4>No operating expenses logged</h4>
                          <p>Click "Log Business Expense" above to add marketing, operations, or permit overheads.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </article>

        {/* LOG EXPENSE MODAL */}
        {expenseModalOpen && (
          <div
            className="admin-drawer-modal-backdrop"
            onClick={() => setExpenseModalOpen(false)}
          >
            <div
              className="admin-partner-modal"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="drawer-header">
                <div>
                  <span className="admin-eyebrow">FINANCIAL LEDGER</span>
                  <h2>Log Business Operating Expense</h2>
                </div>
                <button
                  type="button"
                  className="drawer-close-btn"
                  onClick={() => setExpenseModalOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <form className="drawer-body" onSubmit={handleCreateExpense}>
                <div className="drawer-form-grid">
                  <label>
                    Expense Category *
                    <select
                      value={expenseForm.category}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, category: e.target.value })
                      }
                      required
                    >
                      <option value="marketing">Marketing & Ad Campaigns</option>
                      <option value="operations">Destination Permits & Licensing</option>
                      <option value="gateway_fee">Payment Gateway Fees</option>
                      <option value="transport">Transport Extra / Vehicle Fuel</option>
                      <option value="accommodation">Accommodation Adjustment</option>
                      <option value="miscellaneous">Miscellaneous / Overheads</option>
                    </select>
                  </label>

                  <label>
                    Expense Amount (INR) *
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 12500"
                      value={expenseForm.amount}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, amount: e.target.value })
                      }
                      required
                    />
                  </label>

                  <label>
                    Date Incurred *
                    <input
                      type="date"
                      value={expenseForm.expenseDate}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, expenseDate: e.target.value })
                      }
                      required
                    />
                  </label>

                  <label>
                    Vendor / Payee Name
                    <input
                      type="text"
                      placeholder="e.g. Google Ads India, Kerala Tourism Board"
                      value={expenseForm.vendorName}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, vendorName: e.target.value })
                      }
                    />
                  </label>

                  <label style={{ gridColumn: "span 2" }}>
                    Description / Purpose *
                    <input
                      type="text"
                      placeholder="e.g. High-season Instagram & Google search marketing campaigns"
                      value={expenseForm.description}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, description: e.target.value })
                      }
                      required
                    />
                  </label>

                  <label>
                    Invoice / Receipt Ref
                    <input
                      type="text"
                      placeholder="e.g. INV-2026-4412"
                      value={expenseForm.invoiceRef}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, invoiceRef: e.target.value })
                      }
                    />
                  </label>

                  <label>
                    Payment Status
                    <select
                      value={expenseForm.paymentStatus}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, paymentStatus: e.target.value })
                      }
                    >
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                    </select>
                  </label>
                </div>

                <div className="drawer-footer">
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => setExpenseModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="button button-primary"
                    disabled={submittingExpense}
                  >
                    {submittingExpense ? "Logging..." : "Log Expense"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
