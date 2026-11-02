import { useState, useEffect, useCallback, useMemo } from "react";
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
  MessageSquare,
  Radio,
  CreditCard,
  Menu,
  Hotel,
  Key
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getAdminBookings,
  getAdminStats,
  confirmBooking,
  rejectBooking,
  updateBookingRoomNumber
} from "../api/bookings.js";
import { subscribeToBookingEvents } from "../utils/socket.js";
import AdminSidebar from "../components/AdminSidebar.jsx";

function formatDate(value) {
  if (!value) return "Not specified";
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

export default function AdminBookings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Data states
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    rejected: 0,
    cancelled: 0
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Modals & Drawers
  const [confirmModalBooking, setConfirmModalBooking] = useState(null);
  const [rejectModalBooking, setRejectModalBooking] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [detailsDrawerBooking, setDetailsDrawerBooking] = useState(null);
  const [actionProcessing, setActionProcessing] = useState(false);
  const [confirmRoomNumber, setConfirmRoomNumber] = useState("");
  const [editingRoomNumber, setEditingRoomNumber] = useState("");
  const [savingRoomNumber, setSavingRoomNumber] = useState(false);
  const [copiedRef, setCopiedRef] = useState(null);

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

  // Load data from MySQL
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError("");

    try {
      const [bookingsData, statsData] = await Promise.all([
        getAdminBookings({
          search: search.trim(),
          status: statusFilter
        }),
        getAdminStats()
      ]);

      const list = Array.isArray(bookingsData)
        ? bookingsData
        : bookingsData.bookings || [];

      setBookings(list);
      if (statsData) {
        setStats({
          total: Number(statsData.total) || 0,
          pending: Number(statsData.pending) || 0,
          confirmed: Number(statsData.confirmed) || 0,
          rejected: Number(statsData.rejected) || 0,
          cancelled: Number(statsData.cancelled) || 0
        });
      }
    } catch (err) {
      console.error("Failed to load admin bookings:", err);
      const msg = err.response?.data?.message || err.message || "Failed to load bookings from database.";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter]);

  // Initial load and filter change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time updates via Socket.IO
  useEffect(() => {
    const unsubscribe = subscribeToBookingEvents({
      onBookingCreated: (payload) => {
        setNotice(payload.message || "New booking request received!");
        loadData(true);
      },
      onBookingUpdated: (payload) => {
        setNotice(payload.message || "Booking status updated.");
        loadData(true);
      }
    });

    // Fallback polling every 20 seconds
    const interval = setInterval(() => {
      loadData(true);
    }, 20000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [loadData]);

  // Auto clear notice after 5 seconds
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  function handleManualRefresh() {
    setRefreshing(true);
    loadData();
  }

  function handleCopy(ref) {
    if (!ref) return;
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2500);
  }


  async function handleSaveRoomNumber() {
    if (!detailsDrawerBooking) return;
    setSavingRoomNumber(true);
    try {
      const res = await updateBookingRoomNumber(detailsDrawerBooking.id, editingRoomNumber);
      setDetailsDrawerBooking(res.booking);
      setNotice(`Room number for ${detailsDrawerBooking.bookingReference} set to "${editingRoomNumber}"!`);
      await loadData(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to update room number.");
    } finally {
      setSavingRoomNumber(false);
    }
  }

  // Confirm booking handler
  async function handleConfirmSubmit() {
    if (!confirmModalBooking) return;
    setActionProcessing(true);
    setError("");

    try {
      const res = await confirmBooking(confirmModalBooking.id, confirmRoomNumber);
      setNotice(`Booking ${confirmModalBooking.bookingReference} confirmed successfully!`);
      setConfirmModalBooking(null);
      await loadData(true);
    } catch (err) {
      console.error("Confirm error:", err);
      const msg = err.response?.data?.message || err.message || "Failed to confirm booking.";
      setError(msg);
      // If 409 conflict, reload data immediately to show real state
      if (err.response?.status === 409) {
        await loadData(true);
      }
    } finally {
      setActionProcessing(false);
    }
  }

  // Reject booking handler
  async function handleRejectSubmit() {
    if (!rejectModalBooking) return;
    setActionProcessing(true);
    setError("");

    try {
      await rejectBooking(rejectModalBooking.id, rejectionReason);
      setNotice(`Booking ${rejectModalBooking.bookingReference} rejected.`);
      setRejectModalBooking(null);
      setRejectionReason("");
      await loadData(true);
    } catch (err) {
      console.error("Reject error:", err);
      const msg = err.response?.data?.message || err.message || "Failed to reject booking.";
      setError(msg);
      if (err.response?.status === 409) {
        await loadData(true);
      }
    } finally {
      setActionProcessing(false);
    }
  }

  // Sorted bookings
  const sortedBookings = useMemo(() => {
    const list = [...bookings];
    if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "oldest") {
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === "travel_soon") {
      list.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    }
    return list;
  }, [bookings, sortBy]);

  return (
    <main className={`admin-page admin-bookings-page ${drawerOpen ? "drawer-open" : "drawer-closed"}`}>
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
        pendingBookingsCount={stats.pending}
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
                Workspace / Trip Approvals
              </span>
              <h1>Trip Booking Management</h1>
              <p>
                Review traveler inquiries, confirm reservations, and oversee concierge workflows.
              </p>
            </div>
          </div>

          <div className="admin-topbar-actions">
            <div className="admin-live-badge" title="Real-time WebSocket active">
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
              <RefreshCw
                size={16}
                className={loading || refreshing ? "admin-spinning" : ""}
              />
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
              <span className="admin-stat-label">Total Bookings</span>
              <div className="admin-stat-icon-wrap stat-icon-neutral">
                <CalendarDays size={15} />
              </div>
            </div>
            <strong className="admin-stat-value">{stats.total}</strong>
            <small className="admin-stat-desc">Submitted trips</small>
          </article>

          <article className="admin-stat-card stat-pending-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Pending</span>
              <div className="admin-stat-icon-wrap stat-icon-amber">
                <Clock size={15} />
              </div>
            </div>
            <strong className="admin-stat-value stat-val-amber">{stats.pending}</strong>
            <small className="admin-stat-desc">Awaiting review</small>
          </article>

          <article className="admin-stat-card stat-confirmed-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Confirmed</span>
              <div className="admin-stat-icon-wrap stat-icon-green">
                <CheckCircle2 size={15} />
              </div>
            </div>
            <strong className="admin-stat-value stat-val-green">{stats.confirmed}</strong>
            <small className="admin-stat-desc">Approved trips</small>
          </article>

          <article className="admin-stat-card stat-rejected-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Rejected</span>
              <div className="admin-stat-icon-wrap stat-icon-red">
                <XCircle size={15} />
              </div>
            </div>
            <strong className="admin-stat-value stat-val-red">{stats.rejected}</strong>
            <small className="admin-stat-desc">Declined requests</small>
          </article>

          <article className="admin-stat-card stat-cancelled-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Cancelled</span>
              <div className="admin-stat-icon-wrap stat-icon-neutral">
                <X size={15} />
              </div>
            </div>
            <strong className="admin-stat-value">{stats.cancelled}</strong>
            <small className="admin-stat-desc">Cancellations</small>
          </article>
        </div>

        {/* TABLE CARD CONTAINER */}
        <article className="admin-table-card">
          <div className="admin-table-heading">
            <div>
              <span className="admin-eyebrow">DATABASE RECORDS</span>
              <h2>All trip requests ({sortedBookings.length})</h2>
              <p>Search by reference, traveler name, email, or destination.</p>
            </div>
          </div>

          {/* SEARCH, FILTER TABS & SORT CONTROLS */}
          <div className="admin-controls-bar">
            <div className="admin-search-wrap">
              <Search size={17} className="search-icon" />
              <input
                type="text"
                placeholder="Search by reference (e.g. RMY-), traveler, email, destination..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* STATUS FILTER PILLS */}
            <div className="admin-status-tabs" role="tablist">
              {[
                { id: "all", label: "All", count: stats.total },
                { id: "pending", label: "Pending", count: stats.pending },
                { id: "confirmed", label: "Confirmed", count: stats.confirmed },
                { id: "rejected", label: "Rejected", count: stats.rejected },
                { id: "cancelled", label: "Cancelled", count: stats.cancelled }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === tab.id}
                  className={`admin-filter-pill ${statusFilter === tab.id ? "active" : ""}`}
                  onClick={() => setStatusFilter(tab.id)}
                >
                  <span>{tab.label}</span>
                  <span className="pill-count">{tab.count}</span>
                </button>
              ))}
            </div>

            {/* SORTING SELECT */}
            <div className="admin-sort-wrap">
              <label htmlFor="adminSortBy">Sort:</label>
              <select
                id="adminSortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest requests first</option>
                <option value="oldest">Oldest requests first</option>
                <option value="travel_soon">Travel date soonest</option>
              </select>
            </div>
          </div>

          {/* BOOKINGS TABLE */}
          {loading ? (
            <div className="admin-loading-state">
              <RefreshCw size={30} className="admin-spinning" />
              <p>Loading booking records from MySQL...</p>
            </div>
          ) : sortedBookings.length === 0 ? (
            <div className="admin-empty-state">
              <Compass size={40} className="empty-icon" />
              <h3>No booking records match this query</h3>
              <p>
                {search || statusFilter !== "all"
                  ? "Try adjusting your search query or status filter."
                  : "When travelers submit booking requests, they will appear here in real-time."}
              </p>
              {(search || statusFilter !== "all") && (
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                >
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table bookings-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Traveler</th>
                    <th>Destination</th>
                    <th>Travel Dates</th>
                    <th>Guests</th>
                    <th>Est. Budget</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBookings.map((b) => {
                    const isPending = b.status === "pending";
                    const isConfirmed = b.status === "confirmed";
                    const isRejected = b.status === "rejected";
                    const isCancelled = b.status === "cancelled";

                    return (
                      <tr key={b.id} className={`booking-row status-${b.status}`}>
                        {/* REFERENCE */}
                        <td>
                          <div className="reference-cell">
                            <button
                              type="button"
                              className="ref-code-btn"
                              onClick={() => handleCopy(b.bookingReference)}
                              title="Click to copy reference"
                            >
                              <code>{b.bookingReference}</code>
                              {copiedRef === b.bookingReference ? (
                                <Check size={13} color="#10b981" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                            <small className="cell-date">
                              {formatDate(b.createdAt)}
                            </small>
                          </div>
                        </td>

                        {/* TRAVELER */}
                        <td>
                          <div className="traveler-cell">
                            <strong>{b.contactName || b.userName}</strong>
                            <div className="traveler-subtext">
                              <span>{b.contactEmail || b.userEmail}</span>
                              {b.contactPhone && (
                                <small className="phone-sub">{b.contactPhone}</small>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* DESTINATION */}
                        <td>
                          <div className="admin-destination-cell">
                            {b.destinationImage ? (
                              <img
                                src={b.destinationImage}
                                alt={b.destinationName}
                                className="table-dest-thumb"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="table-dest-pin">
                                <MapPin size={16} />
                              </div>
                            )}
                            <div>
                              <strong>{b.hotelName || b.destinationName}</strong>
                              <small>{b.hotelLocation || b.destinationCountry || "India"}</small>
                              {(b.bookingType === "hotel" || b.hotelName) && (
                                <div style={{ marginTop: "4px", fontSize: "11px", color: "#065f46", background: "#ecfdf5", padding: "2px 6px", borderRadius: "4px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                  <Hotel size={11} /> {b.roomType || "Standard"} • <strong>{b.roomNumber || "No Room #"}</strong>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* DATES */}
                        <td>
                          <div className="dates-cell">
                            <span className="dates-range">
                              {formatDate(b.startDate)}
                            </span>
                            <span className="dates-arrow">→</span>
                            <span className="dates-range">
                              {formatDate(b.endDate)}
                            </span>
                          </div>
                        </td>

                        {/* TRAVELERS */}
                        <td>
                          <span className="travelers-badge">
                            <Users size={14} /> {b.travellers}
                          </span>
                        </td>

                        {/* BUDGET */}
                        <td>
                          <strong className="budget-cell">
                            {b.estimatedBudget || b.estimatedTotal
                              ? `₹${Number(b.estimatedBudget || b.estimatedTotal).toLocaleString("en-IN")}`
                              : "—"}
                          </strong>
                        </td>

                        {/* STATUS BADGE */}
                        <td>
                          <span className={`roamly-badge badge-${b.status}`}>
                            {b.status === "pending" && <span className="badge-pulse" />}
                            {b.status === "pending" && "Pending"}
                            {b.status === "confirmed" && "Confirmed"}
                            {b.status === "rejected" && "Rejected"}
                            {b.status === "cancelled" && "Cancelled"}
                          </span>
                          {b.confirmedByName && isConfirmed && (
                            <small className="confirmed-meta" title={`Confirmed at ${formatDateTime(b.confirmedAt)}`}>
                              by {b.confirmedByName}
                            </small>
                          )}
                          {b.rejectionReason && isRejected && (
                            <small className="rejection-meta" title={b.rejectionReason}>
                              Note: {b.rejectionReason.slice(0, 30)}...
                            </small>
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td style={{ textAlign: "right" }}>
                          <div className="admin-actions-cell">
                            {/* IF PENDING: SHOW CONFIRM & REJECT */}
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  className="action-btn action-confirm"
                                  onClick={() => { setConfirmModalBooking(b); setConfirmRoomNumber(b.roomNumber || ""); }}
                                  title="Confirm this trip request"
                                >
                                  <Check size={15} />
                                  <span>Confirm</span>
                                </button>

                                <button
                                  type="button"
                                  className="action-btn action-reject"
                                  onClick={() => {
                                    setRejectModalBooking(b);
                                    setRejectionReason("");
                                  }}
                                  title="Reject this trip request"
                                >
                                  <X size={15} />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}

                            {/* INSPECT DETAILS */}
                            <button
                              type="button"
                              className="action-btn action-details"
                              onClick={() => { setDetailsDrawerBooking(b); setEditingRoomNumber(b.roomNumber || ""); }}
                              title="View full booking dossier"
                            >
                              <Eye size={15} />
                              <span>Details</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>

      {/* CONFIRMATION MODAL */}
      {confirmModalBooking && (
        <div className="roamly-modal-backdrop" onClick={() => !actionProcessing && setConfirmModalBooking(null)}>
          <div className="admin-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon-wrap icon-green">
                <CheckCircle2 size={30} />
              </div>
              <div>
                <h3>Confirm Trip Booking</h3>
                <p>Authorize this reservation for the traveler.</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setConfirmModalBooking(null)}
                disabled={actionProcessing}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-summary-card">
                <div className="modal-summary-row">
                  <span>Booking Reference:</span>
                  <code>{confirmModalBooking.bookingReference}</code>
                </div>
                <div className="modal-summary-row">
                  <span>Traveler:</span>
                  <strong>{confirmModalBooking.contactName || confirmModalBooking.userName} ({confirmModalBooking.contactEmail})</strong>
                </div>
                <div className="modal-summary-row">
                  <span>Destination:</span>
                  <strong>{confirmModalBooking.destinationName}</strong>
                </div>
                <div className="modal-summary-row">
                  <span>Dates:</span>
                  <span>{formatDate(confirmModalBooking.startDate)} to {formatDate(confirmModalBooking.endDate)}</span>
                </div>
                <div className="modal-summary-row">
                  <span>Guests:</span>
                  <span>{confirmModalBooking.travellers} traveler(s)</span>
                </div>
                {(confirmModalBooking.bookingType === "hotel" || confirmModalBooking.hotelName) && (
                  <div className="modal-summary-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "6px" }}>
                    <span style={{ fontWeight: 600, color: "#166534" }}>🏨 Assign Room Number (for Guest Pass & Check-in):</span>
                    <input
                      type="text"
                      value={confirmRoomNumber}
                      onChange={(e) => setConfirmRoomNumber(e.target.value)}
                      placeholder="e.g. Room 204 or Suite 305"
                      style={{ width: "100%", padding: "7px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
                    />
                  </div>
                )}
              </div>

              <p className="modal-confirm-note">
                Marking this trip as <strong>Confirmed</strong> will update MySQL, record your admin identity
                as the authorizer, and send a live real-time confirmation to the traveler's dashboard.
              </p>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="button button-outline"
                onClick={() => setConfirmModalBooking(null)}
                disabled={actionProcessing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button-dark btn-confirm-action"
                onClick={handleConfirmSubmit}
                disabled={actionProcessing}
              >
                {actionProcessing ? (
                  <>
                    <span className="btn-spinner" /> Confirming in MySQL...
                  </>
                ) : (
                  <>
                    <Check size={16} /> Confirm Trip Booking
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModalBooking && (
        <div className="roamly-modal-backdrop" onClick={() => !actionProcessing && setRejectModalBooking(null)}>
          <div className="admin-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon-wrap icon-red">
                <XCircle size={30} />
              </div>
              <div>
                <h3>Reject Trip Request</h3>
                <p>Decline this booking request in MySQL.</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setRejectModalBooking(null)}
                disabled={actionProcessing}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-summary-card">
                <div className="modal-summary-row">
                  <span>Booking Reference:</span>
                  <code>{rejectModalBooking.bookingReference}</code>
                </div>
                <div className="modal-summary-row">
                  <span>Traveler:</span>
                  <strong>{rejectModalBooking.contactName || rejectModalBooking.userName}</strong>
                </div>
                <div className="modal-summary-row">
                  <span>Destination:</span>
                  <strong>{rejectModalBooking.destinationName}</strong>
                </div>
              </div>

              <div className="modal-reason-field">
                <label htmlFor="rejectionReasonInput">
                  Rejection Reason / Notes (optional, visible to traveler):
                </label>
                <textarea
                  id="rejectionReasonInput"
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="E.g., Fully booked for selected dates, resort maintenance scheduled..."
                  maxLength={1000}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="button button-outline"
                onClick={() => setRejectModalBooking(null)}
                disabled={actionProcessing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button-dark btn-reject-action"
                onClick={handleRejectSubmit}
                disabled={actionProcessing}
              >
                {actionProcessing ? (
                  <>
                    <span className="btn-spinner" /> Updating Database...
                  </>
                ) : (
                  <>
                    <X size={16} /> Reject Booking Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILS DOSSIER DRAWER */}
      {detailsDrawerBooking && (
        <div className="roamly-modal-backdrop" onClick={() => setDetailsDrawerBooking(null)}>
          <div className="admin-details-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <span className="drawer-kicker">BOOKING DOSSIER</span>
                <h3>{detailsDrawerBooking.bookingReference}</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setDetailsDrawerBooking(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="drawer-body">
              {/* HOTEL & ROOM DETAILS */}
              {(detailsDrawerBooking.bookingType === "hotel" || detailsDrawerBooking.hotelName) && (
                <div className="drawer-section" style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
                  <h4 style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0f172a", marginBottom: "12px" }}>
                    <Hotel size={16} color="#059669" /> Boutique Hotel & Room Assignment
                  </h4>
                  <div className="drawer-info-grid">
                    <div className="drawer-info-item">
                      <span className="info-label">Hotel Name</span>
                      <strong className="info-val">{detailsDrawerBooking.hotelName || detailsDrawerBooking.destinationName}</strong>
                    </div>
                    <div className="drawer-info-item">
                      <span className="info-label">Property Location</span>
                      <span className="info-val">{detailsDrawerBooking.hotelLocation || "Verified Property"}</span>
                    </div>
                    <div className="drawer-info-item">
                      <span className="info-label">Room & Suite Type</span>
                      <strong className="info-val">{detailsDrawerBooking.roomType || "Standard Suite"}</strong>
                    </div>
                    <div className="drawer-info-item">
                      <span className="info-label">Rooms Count</span>
                      <span className="info-val">{detailsDrawerBooking.roomsCount || 1} Room(s)</span>
                    </div>
                    <div className="drawer-info-item full-width" style={{ gridColumn: "1 / -1", marginTop: "4px" }}>
                      <span className="info-label">Assigned Room Number (Guest Pass & Key)</span>
                      <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                        <input
                          type="text"
                          value={editingRoomNumber}
                          onChange={(e) => setEditingRoomNumber(e.target.value)}
                          placeholder="e.g. Room 204 or Suite 305"
                          style={{ flex: 1, padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
                        />
                        <button
                          type="button"
                          className="button button-dark"
                          onClick={handleSaveRoomNumber}
                          disabled={savingRoomNumber}
                          style={{ padding: "8px 14px", fontSize: "13px", whiteSpace: "nowrap" }}
                        >
                          {savingRoomNumber ? "Saving..." : "Save Room #"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STATUS BANNER */}
              <div className={`drawer-status-banner banner-${detailsDrawerBooking.status}`}>
                <span className="status-title">Status: {detailsDrawerBooking.status.toUpperCase()}</span>
                {detailsDrawerBooking.status === "confirmed" && (
                  <p>
                    Confirmed by <strong>{detailsDrawerBooking.confirmedByName || "Admin"}</strong> on{" "}
                    {formatDateTime(detailsDrawerBooking.confirmedAt)}
                  </p>
                )}
                {detailsDrawerBooking.status === "rejected" && detailsDrawerBooking.rejectionReason && (
                  <p>Reason: {detailsDrawerBooking.rejectionReason}</p>
                )}
              </div>

              {/* DESTINATION SNAPSHOT */}
              <div className="drawer-section">
                <h4>Destination Snapshot</h4>
                <div className="drawer-dest-card">
                  {detailsDrawerBooking.destinationImage && (
                    <img
                      src={detailsDrawerBooking.destinationImage}
                      alt={detailsDrawerBooking.destinationName}
                      className="drawer-dest-img"
                    />
                  )}
                  <div className="drawer-dest-info">
                    <strong>{detailsDrawerBooking.destinationName}</strong>
                    <span>{detailsDrawerBooking.destinationState || detailsDrawerBooking.destinationCountry}</span>
                  </div>
                </div>
              </div>

              {/* TRAVELER CONTACT INFO */}
              <div className="drawer-section">
                <h4>Traveler & Contact</h4>
                <div className="drawer-info-grid">
                  <div className="drawer-info-item">
                    <span className="info-label">Contact Name</span>
                    <strong className="info-val">{detailsDrawerBooking.contactName || detailsDrawerBooking.userName}</strong>
                  </div>
                  <div className="drawer-info-item">
                    <span className="info-label">Contact Email</span>
                    <span className="info-val">{detailsDrawerBooking.contactEmail || detailsDrawerBooking.userEmail}</span>
                  </div>
                  <div className="drawer-info-item">
                    <span className="info-label">Contact Phone</span>
                    <span className="info-val">{detailsDrawerBooking.contactPhone || "Not provided"}</span>
                  </div>
                  <div className="drawer-info-item">
                    <span className="info-label">Party Size</span>
                    <span className="info-val">{detailsDrawerBooking.travellers} traveler(s)</span>
                  </div>
                </div>
              </div>

              {/* DATES & ESTIMATED BUDGET */}
              <div className="drawer-section">
                <h4>Trip Schedule & Budget</h4>
                <div className="drawer-info-grid">
                  <div className="drawer-info-item">
                    <span className="info-label">Start Date</span>
                    <span className="info-val">{formatDate(detailsDrawerBooking.startDate)}</span>
                  </div>
                  <div className="drawer-info-item">
                    <span className="info-label">End Date</span>
                    <span className="info-val">{formatDate(detailsDrawerBooking.endDate)}</span>
                  </div>
                  <div className="drawer-info-item">
                    <span className="info-label">Estimated Budget</span>
                    <strong className="info-val">
                      {detailsDrawerBooking.estimatedBudget
                        ? `₹${Number(detailsDrawerBooking.estimatedBudget).toLocaleString("en-IN")}`
                        : "Not specified"}
                    </strong>
                  </div>
                  <div className="drawer-info-item">
                    <span className="info-label">Requested On</span>
                    <span className="info-val">{formatDateTime(detailsDrawerBooking.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* SPECIAL REQUESTS */}
              {detailsDrawerBooking.specialRequests && (
                <div className="drawer-section">
                  <h4>Special Requests & Notes</h4>
                  <div className="drawer-notes-box">
                    <MessageSquare size={16} />
                    <p>{detailsDrawerBooking.specialRequests}</p>
                  </div>
                </div>
              )}
            </div>

            {/* DRAWER FOOTER ACTIONS IF PENDING */}
            {detailsDrawerBooking.status === "pending" && (
              <div className="drawer-footer-actions">
                <button
                  type="button"
                  className="button button-dark"
                  onClick={() => {
                    setConfirmModalBooking(detailsDrawerBooking);
                    setDetailsDrawerBooking(null);
                  }}
                >
                  <Check size={16} /> Confirm Trip
                </button>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => {
                    setRejectModalBooking(detailsDrawerBooking);
                    setDetailsDrawerBooking(null);
                  }}
                >
                  <X size={16} /> Reject Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
