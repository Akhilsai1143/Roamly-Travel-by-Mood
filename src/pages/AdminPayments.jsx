import { useState, useEffect, useCallback } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Compass,
  MapPin,
  CalendarDays,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  LogOut,
  ChevronRight,
  Eye,
  Check,
  X,
  AlertTriangle,
  Sparkles,
  Mail,
  Phone,
  ShieldCheck,
  House,
  Copy,
  Calendar,
  CreditCard,
  Wallet,
  ArrowUpRight,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Menu
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { getAdminStats } from "../api/bookings.js";
import { getAdminPaymentLogs } from "../api/payments.js";
import AdminSidebar from "../components/AdminSidebar.jsx";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function AdminPayments() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Data states
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    captured: 0,
    pending: 0,
    failed: 0,
    refunded: 0,
    totalRevenueRupees: 0
  });
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Modals & Details Drawer
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [copiedText, setCopiedText] = useState(null);

  // Responsive mobile drawer states
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth <= 900;
    }
    return false;
  });

  const [drawerOpen, setDrawerOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth > 900;
    }
    return true;
  });

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 900);
    }
    function handleKeyDown(e) {
      if (e.key === "Escape" && drawerOpen && window.innerWidth <= 900) {
        setDrawerOpen(false);
      }
    }
    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawerOpen]);

  // Fetch pending booking count for sidebar pill
  useEffect(() => {
    let isMounted = true;
    getAdminStats()
      .then((data) => {
        if (isMounted && data) {
          setPendingBookingsCount(Number(data.pending) || 0);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Load payment logs from MySQL
  const loadPaymentLogs = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      setError("");

      try {
        const res = await getAdminPaymentLogs({
          page,
          limit,
          search: search.trim(),
          status: statusFilter,
          sortBy,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined
        });

        if (res?.success) {
          setPayments(res.payments || []);
          if (res.stats) {
            setStats(res.stats);
          }
          if (res.pagination) {
            setPagination(res.pagination);
          }
        } else {
          setError(res?.message || "Failed to load payment logs.");
        }
      } catch (err) {
        console.error("Failed to load payment logs:", err);
        const msg =
          err.response?.data?.message ||
          err.message ||
          "Could not connect to payment logging API.";
        setError(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, limit, search, statusFilter, sortBy, dateFrom, dateTo]
  );

  useEffect(() => {
    loadPaymentLogs();
  }, [loadPaymentLogs]);

  // Periodic poll every 30s
  useEffect(() => {
    const timer = setInterval(() => {
      loadPaymentLogs(true);
    }, 30000);
    return () => clearInterval(timer);
  }, [loadPaymentLogs]);

  // Auto-clear notices
  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(""), 4000);
      return () => clearTimeout(t);
    }
  }, [notice]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadPaymentLogs(true);
  };

  const handleCopy = (text, label = "Code") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setNotice(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const clearAllFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSortBy("newest");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  return (
    <div className={`admin-page admin-payments-page ${drawerOpen ? "drawer-open" : "drawer-closed"}`}>
      {/* MOBILE DRAWER BACKDROP */}
      {isMobile && drawerOpen && (
        <div
          className="admin-drawer-backdrop"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR */}
      <AdminSidebar
        isMobile={isMobile}
        drawerOpen={drawerOpen}
        onCloseDrawer={() => setDrawerOpen(false)}
        pendingBookingsCount={pendingBookingsCount}
      />

      {/* MAIN CONTENT AREA */}
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
              <span className="admin-breadcrumb">Workspace / Financial Audit</span>
              <h1>Payment Logs & Gateway Transactions</h1>
              <p>
                Inspect Razorpay checkouts, payment signatures, amounts, captured statuses, and webhook confirmations.
              </p>
            </div>
          </div>

          <div className="admin-topbar-actions">
            <div className="admin-live-badge" title="Real-time polling active">
              <span className="live-dot" />
              <span>Live Sync</span>
            </div>

            <button
              type="button"
              className="admin-secondary-button"
              onClick={handleManualRefresh}
              disabled={loading || refreshing}
              title="Refresh from MySQL"
            >
              <RefreshCw size={16} className={loading || refreshing ? "admin-spinning" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        {/* NOTICES & ALERTS */}
        {notice && (
          <div className="admin-notice" role="status">
            <Sparkles size={17} />
            <span>{notice}</span>
          </div>
        )}

        {error && (
          <div className="admin-error" role="alert">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* SUMMARY STATS GRID */}
        <div className="admin-stat-grid">
          <article className="admin-stat-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Total Transactions</span>
              <div className="admin-stat-icon-wrap stat-icon-neutral">
                <CreditCard size={15} />
              </div>
            </div>
            <strong className="admin-stat-value">{stats.total}</strong>
            <small className="admin-stat-desc">Order records</small>
          </article>

          <article className="admin-stat-card stat-confirmed-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Captured (Paid)</span>
              <div className="admin-stat-icon-wrap stat-icon-green">
                <CheckCircle2 size={15} />
              </div>
            </div>
            <strong className="admin-stat-value stat-val-green">{stats.captured}</strong>
            <small className="admin-stat-desc">Verified transactions</small>
          </article>

          <article className="admin-stat-card stat-pending-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Pending Payment</span>
              <div className="admin-stat-icon-wrap stat-icon-amber">
                <Clock size={15} />
              </div>
            </div>
            <strong className="admin-stat-value stat-val-amber">{stats.pending}</strong>
            <small className="admin-stat-desc">Created / Attempted</small>
          </article>

          <article className="admin-stat-card stat-rejected-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Failed</span>
              <div className="admin-stat-icon-wrap stat-icon-red">
                <XCircle size={15} />
              </div>
            </div>
            <strong className="admin-stat-value stat-val-red">{stats.failed}</strong>
            <small className="admin-stat-desc">Declined checkouts</small>
          </article>

          <article className="admin-stat-card stat-admin-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Captured Revenue</span>
              <div className="admin-stat-icon-wrap stat-icon-blue">
                <Wallet size={15} />
              </div>
            </div>
            <strong className="admin-stat-value stat-val-blue">
              ₹{stats.totalRevenueRupees.toLocaleString("en-IN")}
            </strong>
            <small className="admin-stat-desc">Total collected</small>
          </article>
        </div>

        {/* PAYMENT LOGS TABLE CONTAINER */}
        <article className="admin-table-card">
          <div
            className="admin-table-heading"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "12px"
            }}
          >
            <div>
              <span className="admin-eyebrow">DATABASE AUDIT TRAIL</span>
              <h2>Payment Records ({pagination.totalItems})</h2>
              <p>Real-time gateway receipts, Razorpay order IDs, signature validations, and payment statuses.</p>
            </div>
          </div>

          {/* CONTROLS BAR: SEARCH, STATUS FILTER, DATE FILTER, SORT */}
          <div
            className="admin-controls-bar"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              alignItems: "center",
              margin: "20px 0"
            }}
          >
            {/* SEARCH */}
            <div
              className="admin-search-wrap"
              style={{
                flex: "1 1 260px",
                display: "flex",
                alignItems: "center",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "0 12px"
              }}
            >
              <Search size={16} style={{ color: "#64748b", marginRight: "8px" }} />
              <input
                type="text"
                placeholder="Search by Payment ID, Order ID, Booking Ref, or Customer..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                style={{
                  width: "100%",
                  padding: "11px 0",
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: "13px"
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* STATUS FILTER PILLS */}
            <div
              style={{
                display: "inline-flex",
                background: "#f1f5f9",
                padding: "4px",
                borderRadius: "10px",
                gap: "4px",
                flexWrap: "wrap"
              }}
            >
              {[
                { id: "all", label: `All (${stats.total})` },
                { id: "captured", label: `Captured (${stats.captured})` },
                { id: "created", label: `Pending (${stats.pending})` },
                { id: "failed", label: `Failed (${stats.failed})` },
                { id: "refunded", label: `Refunded (${stats.refunded})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setPage(1);
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    background: statusFilter === tab.id ? "#ffffff" : "transparent",
                    color: statusFilter === tab.id ? "#1b4332" : "#64748b",
                    boxShadow: statusFilter === tab.id ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                    transition: "all 0.15s ease"
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* SORT SELECT */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Filter size={15} style={{ color: "#64748b" }} />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                style={{
                  padding: "9px 12px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#334155",
                  outline: "none"
                }}
              >
                <option value="newest">Newest Transactions</option>
                <option value="oldest">Oldest Transactions</option>
                <option value="amount_desc">Amount (Highest First)</option>
                <option value="amount_asc">Amount (Lowest First)</option>
              </select>
            </div>
          </div>

          {/* TABLE CONTENT */}
          {loading ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "#64748b" }}>
              <RefreshCw size={28} className="admin-spinning" style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: "14px", fontWeight: 500 }}>Loading payment records from MySQL...</p>
            </div>
          ) : payments.length === 0 ? (
            <div
              style={{
                padding: "60px 20px",
                textAlign: "center",
                background: "#f8fafc",
                borderRadius: "12px",
                border: "1px dashed #cbd5e1"
              }}
            >
              <CreditCard size={36} style={{ color: "#94a3b8", margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#334155", margin: "0 0 6px" }}>
                No payment records found
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px" }}>
                No transactions match your current search query or filter options.
              </p>
              {(search || statusFilter !== "all" || dateFrom || dateTo) && (
                <button
                  type="button"
                  className="button button-outline"
                  style={{ fontSize: "12px", padding: "7px 16px" }}
                  onClick={clearAllFilters}
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table payments-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr
                    style={{
                      background: "#f8fafc",
                      borderBottom: "1px solid #e2e8f0",
                      textAlign: "left",
                      color: "#64748b",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}
                  >
                    <th style={{ padding: "14px 16px" }}>Txn ID</th>
                    <th style={{ padding: "14px 16px" }}>Booking Ref</th>
                    <th style={{ padding: "14px 16px" }}>Traveler</th>
                    <th style={{ padding: "14px 16px" }}>Amount</th>
                    <th style={{ padding: "14px 16px" }}>Status</th>
                    <th style={{ padding: "14px 16px" }}>Method</th>
                    <th style={{ padding: "14px 16px" }}>Razorpay Order / Payment</th>
                    <th style={{ padding: "14px 16px" }}>Date & Time</th>
                    <th style={{ padding: "14px 16px", textAlign: "right" }}>Inspect</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => {
                    const isCaptured = p.status === "captured";
                    const isFailed = p.status === "failed";
                    const isPending = p.status === "created" || p.status === "attempted";
                    const isRefunded = p.status === "refunded";

                    return (
                      <tr
                        key={p.id}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          transition: "background 0.15s ease"
                        }}
                      >
                        {/* PAYMENT ID */}
                        <td style={{ padding: "14px 16px", fontWeight: 700, color: "#1e293b" }}>
                          <code>#PAY-{p.id}</code>
                        </td>

                        {/* BOOKING REF */}
                        <td style={{ padding: "14px 16px" }}>
                          <button
                            type="button"
                            onClick={() => handleCopy(p.bookingReference, "Booking Reference")}
                            title="Click to copy booking reference"
                            style={{
                              background: "#f1f5f9",
                              border: "1px solid #e2e8f0",
                              borderRadius: "6px",
                              padding: "4px 8px",
                              fontSize: "12px",
                              fontFamily: "monospace",
                              fontWeight: 600,
                              color: "#334155",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px"
                            }}
                          >
                            <span>{p.bookingReference}</span>
                            {copiedText === p.bookingReference ? (
                              <Check size={12} color="#10b981" />
                            ) : (
                              <Copy size={12} color="#94a3b8" />
                            )}
                          </button>
                        </td>

                        {/* TRAVELER DETAILS */}
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <strong style={{ color: "#1e293b", fontSize: "13px" }}>{p.userName}</strong>
                            <span style={{ color: "#64748b", fontSize: "12px" }}>{p.userEmail}</span>
                          </div>
                        </td>

                        {/* AMOUNT */}
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <strong style={{ color: "#1b4332", fontSize: "14px", fontWeight: 700 }}>
                              ₹{p.amountRupees.toLocaleString("en-IN")}
                            </strong>
                            <span style={{ color: "#94a3b8", fontSize: "11px" }}>
                              {p.currency} ({p.amountPaise} paise)
                            </span>
                          </div>
                        </td>

                        {/* STATUS BADGE */}
                        <td style={{ padding: "14px 16px" }}>
                          {isCaptured && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                background: "#f0fdf4",
                                color: "#15803d",
                                border: "1px solid #bbf7d0",
                                padding: "4px 9px",
                                borderRadius: "20px",
                                fontSize: "11.5px",
                                fontWeight: 700
                              }}
                            >
                              <CheckCircle2 size={13} /> Captured
                            </span>
                          )}

                          {isPending && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                background: "#fffbeb",
                                color: "#b45309",
                                border: "1px solid #fde68a",
                                padding: "4px 9px",
                                borderRadius: "20px",
                                fontSize: "11.5px",
                                fontWeight: 600
                              }}
                            >
                              <Clock size={13} /> Pending
                            </span>
                          )}

                          {isFailed && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                background: "#fff1f2",
                                color: "#be123c",
                                border: "1px solid #fecdd3",
                                padding: "4px 9px",
                                borderRadius: "20px",
                                fontSize: "11.5px",
                                fontWeight: 600
                              }}
                            >
                              <XCircle size={13} /> Failed
                            </span>
                          )}

                          {isRefunded && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                background: "#f5f3ff",
                                color: "#6d28d9",
                                border: "1px solid #ddd6fe",
                                padding: "4px 9px",
                                borderRadius: "20px",
                                fontSize: "11.5px",
                                fontWeight: 600
                              }}
                            >
                              <RotateCcw size={13} /> Refunded
                            </span>
                          )}
                        </td>

                        {/* METHOD */}
                        <td style={{ padding: "14px 16px", color: "#475569", textTransform: "capitalize" }}>
                          {p.method || "card / upi"}
                        </td>

                        {/* RAZORPAY IDS */}
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxWidth: "220px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>Order:</span>
                              <code
                                style={{
                                  fontSize: "11px",
                                  color: "#334155",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap"
                                }}
                                title={p.razorpayOrderId}
                              >
                                {p.razorpayOrderId}
                              </code>
                            </div>

                            {p.razorpayPaymentId ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <span style={{ fontSize: "11px", color: "#166534", fontWeight: 600 }}>Payment:</span>
                                <code
                                  style={{
                                    fontSize: "11px",
                                    color: "#166534",
                                    fontWeight: 600,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap"
                                  }}
                                  title={p.razorpayPaymentId}
                                >
                                  {p.razorpayPaymentId}
                                </code>
                              </div>
                            ) : (
                              <span style={{ fontSize: "11px", color: "#94a3b8", fontStyle: "italic" }}>
                                Awaiting payment ID
                              </span>
                            )}
                          </div>
                        </td>

                        {/* DATE & TIME */}
                        <td style={{ padding: "14px 16px", color: "#475569", fontSize: "12px", whiteSpace: "nowrap" }}>
                          {formatDateTime(p.createdAt)}
                        </td>

                        {/* ACTION INSPECT */}
                        <td style={{ padding: "14px 16px", textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={() => setSelectedPayment(p)}
                            title="Inspect complete transaction audit details"
                            style={{
                              background: "#f1f5f9",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              padding: "6px 10px",
                              cursor: "pointer",
                              color: "#334155",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "12px",
                              fontWeight: 600,
                              transition: "all 0.15s ease"
                            }}
                          >
                            <Eye size={14} /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION BAR */}
          {!loading && payments.length > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginTop: "20px",
                paddingTop: "16px",
                borderTop: "1px solid #e2e8f0"
              }}
            >
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> (
                {pagination.totalItems} total transactions)
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    fontSize: "12px",
                    color: "#334155"
                  }}
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPreviousPage}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: pagination.hasPreviousPage ? "#fff" : "#f1f5f9",
                    color: pagination.hasPreviousPage ? "#1e293b" : "#94a3b8",
                    cursor: pagination.hasPreviousPage ? "pointer" : "not-allowed",
                    fontSize: "12px",
                    fontWeight: 600
                  }}
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNextPage}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: pagination.hasNextPage ? "#fff" : "#f1f5f9",
                    color: pagination.hasNextPage ? "#1e293b" : "#94a3b8",
                    cursor: pagination.hasNextPage ? "pointer" : "not-allowed",
                    fontSize: "12px",
                    fontWeight: 600
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </article>
      </section>

      {/* TRANSACTION INSPECTION MODAL */}
      {selectedPayment && (
        <div
          className="roamly-modal-backdrop"
          onClick={() => setSelectedPayment(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="admin-modal-card"
            style={{
              maxWidth: "600px",
              width: "100%",
              background: "#ffffff",
              borderRadius: "16px",
              padding: "28px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                borderBottom: "1px solid #f1f5f9",
                paddingBottom: "14px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <CreditCard size={22} color="#1b4332" />
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#1e293b" }}>
                    Transaction Audit: #PAY-{selectedPayment.id}
                  </h3>
                  <small style={{ color: "#64748b" }}>
                    Recorded on {formatDateTime(selectedPayment.createdAt)}
                  </small>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "grid", gap: "14px", fontSize: "13px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px" }}>
                  <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>
                    Payment Status
                  </span>
                  <div style={{ marginTop: "4px", fontWeight: 700, color: "#1e293b", textTransform: "capitalize" }}>
                    {selectedPayment.status}
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px" }}>
                  <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>
                    Total Amount
                  </span>
                  <div style={{ marginTop: "4px", fontWeight: 700, color: "#1b4332", fontSize: "16px" }}>
                    ₹{selectedPayment.amountRupees.toLocaleString("en-IN")} ({selectedPayment.currency})
                  </div>
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px" }}>
                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                  Associated Booking
                </span>
                <div style={{ marginTop: "6px", display: "flex", justifyContent: "space-between" }}>
                  <span>Reference: <strong>{selectedPayment.bookingReference}</strong></span>
                  <span style={{ textTransform: "capitalize" }}>Status: <strong>{selectedPayment.bookingStatus}</strong></span>
                </div>
                <div style={{ marginTop: "4px", color: "#475569" }}>
                  Destination: {selectedPayment.destinationName}
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px" }}>
                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                  Customer Details
                </span>
                <div style={{ marginTop: "6px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>Name: <strong>{selectedPayment.userName}</strong></div>
                  <div>Email: <strong>{selectedPayment.userEmail}</strong></div>
                  <div>Phone: <strong>{selectedPayment.userPhone || "Not provided"}</strong></div>
                  <div>Party Size: <strong>{selectedPayment.travelDates?.travellers || 1} Guests</strong></div>
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px" }}>
                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                  Razorpay Gateway Identifiers
                </span>
                <div style={{ marginTop: "8px", display: "grid", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#64748b" }}>Order ID:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedPayment.razorpayOrderId, "Order ID")}
                      style={{
                        background: "#fff",
                        border: "1px solid #cbd5e1",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontFamily: "monospace",
                        fontSize: "12px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      {selectedPayment.razorpayOrderId} <Copy size={11} />
                    </button>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#64748b" }}>Payment ID:</span>
                    {selectedPayment.razorpayPaymentId ? (
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedPayment.razorpayPaymentId, "Payment ID")}
                        style={{
                          background: "#fff",
                          border: "1px solid #cbd5e1",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontFamily: "monospace",
                          fontSize: "12px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          color: "#166534"
                        }}
                      >
                        {selectedPayment.razorpayPaymentId} <Copy size={11} />
                      </button>
                    ) : (
                      <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Not yet paid</span>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#64748b" }}>Payment Method:</span>
                    <strong style={{ textTransform: "capitalize" }}>{selectedPayment.method || "card / upi"}</strong>
                  </div>
                </div>
              </div>

              {selectedPayment.errorCode && (
                <div
                  style={{
                    background: "#fff1f2",
                    border: "1px solid #fecdd3",
                    padding: "12px",
                    borderRadius: "8px",
                    color: "#be123c"
                  }}
                >
                  <strong>Gateway Error [{selectedPayment.errorCode}]:</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "12px" }}>
                    {selectedPayment.errorDescription || "Payment capture was not completed."}
                  </p>
                </div>
              )}
            </div>

            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button
                type="button"
                className="button button-outline"
                onClick={() => setSelectedPayment(null)}
                style={{ padding: "8px 20px" }}
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
