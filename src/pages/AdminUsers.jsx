import { useEffect, useState, useMemo, useCallback } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  RefreshCw,
  LogOut,
  Compass,
  CalendarDays,
  MapPin,
  House,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  Clock,
  Mail,
  Phone,
  Sparkles,
  Calendar,
  Heart,
  Star,
  Luggage,
  Shield,
  Filter,
  CreditCard,
  Menu
} from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";
import { getAdminStats } from "../api/bookings.js";
import AdminSidebar from "../components/AdminSidebar.jsx";
import {
  getUserStats,
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser
} from "../api/users.js";

export default function AdminUsers() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Data states
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    adminCount: 0,
    recentlyActiveCount: 0
  });
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
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

  // UI state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionProcessing, setActionProcessing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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

  // Modals state
  const [detailUser, setDetailUser] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [statusModalUser, setStatusModalUser] = useState(null);
  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [roleModalUser, setRoleModalUser] = useState(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search change
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Load pending bookings for sidebar badge
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

  // Main data fetch function
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError("");

    try {
      const [statsData, usersData] = await Promise.all([
        getUserStats(),
        getUsers({
          page,
          limit,
          search: debouncedSearch,
          role: roleFilter,
          status: statusFilter,
          sort: sortBy
        })
      ]);

      setStats(statsData);
      setUsers(usersData.users || []);
      setPagination(usersData.pagination || {
        page,
        limit,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      });
    } catch (err) {
      console.error("Failed to load user management data:", err);
      const msg = err.response?.data?.message || err.message || "Failed to load user records.";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, limit, debouncedSearch, roleFilter, statusFilter, sortBy]);

  // Fetch when filters or page changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-dismiss notices after 5 seconds
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

  function handleRefresh() {
    setRefreshing(true);
    loadData(true);
  }

  // Open detailed user modal
  async function handleOpenDetail(targetUser) {
    setDetailUser(targetUser);
    setLoadingDetail(true);
    try {
      const data = await getUserById(targetUser.id);
      setDetailUser(data.user);
    } catch (err) {
      console.error("Failed to load user details:", err);
    } finally {
      setLoadingDetail(false);
    }
  }

  // Confirm status toggle (activation / deactivation)
  async function handleConfirmStatusChange() {
    if (!statusModalUser) return;
    setActionProcessing(true);
    setError("");

    const targetState = !statusModalUser.isActive;
    try {
      const res = await updateUserStatus(statusModalUser.id, targetState);
      setNotice(res.message || `User ${statusModalUser.name} status updated.`);
      setStatusModalUser(null);
      await loadData(true);
    } catch (err) {
      console.error("Status update error:", err);
      setError(err.response?.data?.message || "Failed to update user status.");
    } finally {
      setActionProcessing(false);
    }
  }

  // Confirm role change (promote / demote)
  async function handleConfirmRoleChange() {
    if (!roleModalUser) return;
    setActionProcessing(true);
    setError("");

    const newRole = roleModalUser.role === "admin" ? "user" : "admin";
    try {
      const res = await updateUserRole(roleModalUser.id, newRole);
      setNotice(res.message || `User role updated to ${newRole}.`);
      setRoleModalUser(null);
      await loadData(true);
    } catch (err) {
      console.error("Role update error:", err);
      setError(err.response?.data?.message || "Failed to update user role.");
    } finally {
      setActionProcessing(false);
    }
  }

  // Confirm delete user (soft-delete)
  async function handleConfirmDelete() {
    if (!deleteModalUser) return;
    setActionProcessing(true);
    setError("");

    try {
      const res = await deleteUser(deleteModalUser.id);
      setNotice(res.message || `User "${deleteModalUser.name}" removed successfully.`);
      setDeleteModalUser(null);
      // If deleted was sole item on page, step back
      if (users.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        await loadData(true);
      }
    } catch (err) {
      console.error("Delete user error:", err);
      setError(err.response?.data?.message || "Failed to delete user.");
    } finally {
      setActionProcessing(false);
    }
  }

  // Format date helper
  function formatDate(isoString) {
    if (!isoString) return "Never";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch {
      return isoString;
    }
  }

  // Relative time helper for last login
  function formatRelativeTime(isoString) {
    if (!isoString) return "Never logged in";
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 2) return "Just now";
      if (diffMins < 60) return `${diffMins} mins ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 30) return `${diffDays} days ago`;
      return formatDate(isoString);
    } catch {
      return formatDate(isoString);
    }
  }

  return (
    <main className={`admin-page admin-users-page ${drawerOpen ? "drawer-open" : "drawer-closed"}`}>
      {/* MOBILE DRAWER BACKDROP */}
      {isMobile && drawerOpen && (
        <div
          className="admin-drawer-backdrop"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 1. ADMIN SIDEBAR NAVIGATION */}
      <AdminSidebar
        isMobile={isMobile}
        drawerOpen={drawerOpen}
        onCloseDrawer={() => setDrawerOpen(false)}
        pendingBookingsCount={pendingBookingsCount}
      />

      {/* 2. MAIN ADMIN CONTENT AREA */}
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
              <span className="admin-breadcrumb">Workspace / User Management</span>
              <h1>User Accounts & Access Control</h1>
              <p>
                Manage registered travelers and administrators, oversee account activation, and safeguard data integrity.
              </p>
            </div>
          </div>

          <div className="admin-topbar-actions">
            <button
              type="button"
              className="admin-secondary-button"
              onClick={handleRefresh}
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
              <span className="admin-stat-label">Total Users</span>
              <div className="admin-stat-icon-wrap stat-icon-neutral">
                <Users size={15} />
              </div>
            </div>
            <strong className="admin-stat-value">{stats.totalUsers}</strong>
            <small className="admin-stat-desc">Registered accounts</small>
          </article>

          <article className="admin-stat-card stat-confirmed-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Active Users</span>
              <div className="admin-stat-icon-wrap stat-icon-green">
                <CheckCircle2 size={15} />
              </div>
            </div>
            <strong className="admin-stat-value stat-val-green">{stats.activeUsers}</strong>
            <small className="admin-stat-desc">Permitted to sign in</small>
          </article>

          <article className="admin-stat-card stat-pending-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Inactive / Suspended</span>
              <div className="admin-stat-icon-wrap stat-icon-amber">
                <XCircle size={15} />
              </div>
            </div>
            <strong className="admin-stat-value stat-val-amber">{stats.inactiveUsers}</strong>
            <small className="admin-stat-desc">Blocked from access</small>
          </article>

          <article className="admin-stat-card stat-admin-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Administrators</span>
              <div className="admin-stat-icon-wrap stat-icon-blue">
                <ShieldCheck size={15} />
              </div>
            </div>
            <strong className="admin-stat-value stat-val-blue">{stats.adminCount}</strong>
            <small className="admin-stat-desc">Full console access</small>
          </article>

          <article className="admin-stat-card stat-recent-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Active Last 30d</span>
              <div className="admin-stat-icon-wrap stat-icon-teal">
                <Clock size={15} />
              </div>
            </div>
            <strong className="admin-stat-value stat-val-teal">{stats.recentlyActiveCount}</strong>
            <small className="admin-stat-desc">Recent logins</small>
          </article>
        </div>

        {/* USER TABLE CARD CONTAINER */}
        <article className="admin-table-card">
          <div className="admin-table-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <span className="admin-eyebrow">DATABASE DIRECTORY</span>
              <h2>Registered Users ({pagination.totalItems})</h2>
              <p>Search, filter, inspect details, activate/deactivate, or manage administrator roles.</p>
            </div>
          </div>

          {/* CONTROLS BAR: SEARCH, ROLE FILTER, STATUS FILTER, SORT */}
          <div className="admin-controls-bar" style={{ display: "flex", flexWrap: "wrap", gap: "14px", alignItems: "center", margin: "20px 0" }}>
            {/* SEARCH */}
            <div className="admin-search-wrap" style={{ flex: "1 1 280px", display: "flex", alignItems: "center", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "0 12px" }}>
              <Search size={16} style={{ color: "#64748b", marginRight: "8px" }} />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", padding: "12px 0", border: "none", background: "transparent", outline: "none", fontSize: "13px" }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* STATUS FILTER PILLS */}
            <div style={{ display: "inline-flex", background: "#f1f5f9", padding: "4px", borderRadius: "10px", gap: "4px" }}>
              {[
                { id: "all", label: "All Status" },
                { id: "active", label: `Active (${stats.activeUsers})` },
                { id: "inactive", label: `Inactive (${stats.inactiveUsers})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => { setStatusFilter(tab.id); setPage(1); }}
                  style={{
                    padding: "6px 14px",
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

            {/* ROLE FILTER SELECT */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Filter size={15} style={{ color: "#64748b" }} />
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                style={{
                  padding: "9px 14px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#334155",
                  outline: "none"
                }}
              >
                <option value="all">All Roles</option>
                <option value="user">Travelers Only</option>
                <option value="admin">Administrators Only</option>
              </select>
            </div>

            {/* SORT SELECT */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "9px 14px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                background: "#ffffff",
                fontSize: "13px",
                fontWeight: 500,
                color: "#334155",
                outline: "none"
              }}
            >
              <option value="newest">Newest Registered</option>
              <option value="oldest">Oldest Registered</option>
              <option value="name_asc">Name (A → Z)</option>
              <option value="name_desc">Name (Z → A)</option>
              <option value="last_login">Recently Logged In</option>
            </select>
          </div>

          {/* TABLE CONTENT */}
          {loading ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "#64748b" }}>
              <RefreshCw size={28} className="admin-spinning" style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: "14px", fontWeight: 500 }}>Loading user accounts from MySQL...</p>
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
              <Users size={36} style={{ color: "#94a3b8", margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#334155", margin: "0 0 6px" }}>No users found</h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px" }}>
                No accounts match your current search query or filter options.
              </p>
              {(search || roleFilter !== "all" || statusFilter !== "all") && (
                <button
                  type="button"
                  className="button button-outline"
                  style={{ fontSize: "12px", padding: "7px 16px" }}
                  onClick={() => { setSearch(""); setRoleFilter("all"); setStatusFilter("all"); }}
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table users-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left", color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <th style={{ padding: "14px 16px" }}>User</th>
                    <th style={{ padding: "14px 16px" }}>Contact</th>
                    <th style={{ padding: "14px 16px" }}>Role</th>
                    <th style={{ padding: "14px 16px" }}>Status</th>
                    <th style={{ padding: "14px 16px" }}>Registered</th>
                    <th style={{ padding: "14px 16px" }}>Last Login</th>
                    <th style={{ padding: "14px 16px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => {
                    const isSelf = user?.id === item.id;
                    const initial = (item.firstName || item.name || "U").charAt(0).toUpperCase();

                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          background: isSelf ? "#f0fdf4" : "transparent",
                          transition: "background 0.15s ease"
                        }}
                      >
                        {/* USER NAME & AVATAR */}
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                background: item.role === "admin" ? "#dbeafe" : "#e2e8f0",
                                color: item.role === "admin" ? "#1e40af" : "#334155",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700,
                                fontSize: "14px",
                                flexShrink: 0
                              }}
                            >
                              {initial}
                            </div>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <strong style={{ color: "#1e293b", fontSize: "13px" }}>
                                  {item.name || `${item.firstName} ${item.lastName}`.trim() || "Anonymous"}
                                </strong>
                                {isSelf && (
                                  <span style={{ fontSize: "10px", background: "#bbf7d0", color: "#166534", padding: "1px 6px", borderRadius: "10px", fontWeight: 700 }}>
                                    You
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: "11px", color: "#64748b" }}>ID: #{item.id}</span>
                            </div>
                          </div>
                        </td>

                        {/* CONTACT */}
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#334155" }}>
                              <Mail size={13} style={{ color: "#94a3b8" }} />
                              {item.email}
                            </span>
                            {item.phone && (
                              <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#64748b", fontSize: "12px" }}>
                                <Phone size={12} style={{ color: "#94a3b8" }} />
                                {item.phone}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* ROLE */}
                        <td style={{ padding: "14px 16px" }}>
                          {item.role === "admin" ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                background: "#eff6ff",
                                color: "#1d4ed8",
                                border: "1px solid #bfdbfe",
                                padding: "3px 9px",
                                borderRadius: "20px",
                                fontSize: "11px",
                                fontWeight: 700
                              }}
                            >
                              <ShieldCheck size={12} />
                              Admin
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                background: "#f8fafc",
                                color: "#475569",
                                border: "1px solid #e2e8f0",
                                padding: "3px 9px",
                                borderRadius: "20px",
                                fontSize: "11px",
                                fontWeight: 600
                              }}
                            >
                              <Compass size={12} />
                              Traveler
                            </span>
                          )}
                        </td>

                        {/* ACCOUNT STATUS */}
                        <td style={{ padding: "14px 16px" }}>
                          {item.isActive ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                background: "#f0fdf4",
                                color: "#15803d",
                                border: "1px solid #bbf7d0",
                                padding: "3px 9px",
                                borderRadius: "20px",
                                fontSize: "11px",
                                fontWeight: 600
                              }}
                            >
                              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e" }} />
                              Active
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                background: "#fef2f2",
                                color: "#b91c1c",
                                border: "1px solid #fecaca",
                                padding: "3px 9px",
                                borderRadius: "20px",
                                fontSize: "11px",
                                fontWeight: 600
                              }}
                            >
                              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ef4444" }} />
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* REGISTRATION DATE */}
                        <td style={{ padding: "14px 16px", color: "#475569" }}>
                          {formatDate(item.createdAt)}
                        </td>

                        {/* LAST LOGIN */}
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              color: item.lastLogin ? "#0f766e" : "#94a3b8",
                              fontSize: "12px",
                              fontWeight: item.lastLogin ? 500 : 400
                            }}
                            title={item.lastLogin ? new Date(item.lastLogin).toLocaleString() : "No login recorded"}
                          >
                            {formatRelativeTime(item.lastLogin)}
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td style={{ padding: "14px 16px", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            {/* VIEW DETAILS */}
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(item)}
                              title="View user details"
                              style={{
                                background: "#f1f5f9",
                                border: "1px solid #e2e8f0",
                                borderRadius: "8px",
                                padding: "6px 8px",
                                cursor: "pointer",
                                color: "#334155",
                                transition: "all 0.15s ease"
                              }}
                            >
                              <Eye size={15} />
                            </button>

                            {/* TOGGLE STATUS (ACTIVATE / DEACTIVATE) */}
                            <button
                              type="button"
                              onClick={() => setStatusModalUser(item)}
                              disabled={isSelf}
                              title={
                                isSelf
                                  ? "Cannot deactivate your own account"
                                  : item.isActive
                                  ? "Deactivate account"
                                  : "Activate account"
                              }
                              style={{
                                background: item.isActive ? "#fef2f2" : "#f0fdf4",
                                border: `1px solid ${item.isActive ? "#fecaca" : "#bbf7d0"}`,
                                borderRadius: "8px",
                                padding: "6px 8px",
                                cursor: isSelf ? "not-allowed" : "pointer",
                                color: item.isActive ? "#dc2626" : "#16a34a",
                                opacity: isSelf ? 0.4 : 1,
                                transition: "all 0.15s ease"
                              }}
                            >
                              {item.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                            </button>

                            {/* ROLE TOGGLE (PROMOTE / DEMOTE) */}
                            <button
                              type="button"
                              onClick={() => setRoleModalUser(item)}
                              disabled={isSelf}
                              title={
                                isSelf
                                  ? "Cannot change your own role"
                                  : item.role === "admin"
                                  ? "Demote to Traveler"
                                  : "Promote to Administrator"
                              }
                              style={{
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                borderRadius: "8px",
                                padding: "6px 8px",
                                cursor: isSelf ? "not-allowed" : "pointer",
                                color: "#475569",
                                opacity: isSelf ? 0.4 : 1,
                                transition: "all 0.15s ease"
                              }}
                            >
                              <Shield size={15} />
                            </button>

                            {/* DELETE (SOFT DELETE) */}
                            <button
                              type="button"
                              onClick={() => setDeleteModalUser(item)}
                              disabled={isSelf}
                              title={isSelf ? "Cannot delete your own account" : "Delete user account"}
                              style={{
                                background: "#fff1f2",
                                border: "1px solid #ffe4e6",
                                borderRadius: "8px",
                                padding: "6px 8px",
                                cursor: isSelf ? "not-allowed" : "pointer",
                                color: "#e11d48",
                                opacity: isSelf ? 0.4 : 1,
                                transition: "all 0.15s ease"
                              }}
                            >
                              <Trash2 size={15} />
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

          {/* PAGINATION BAR */}
          {!loading && users.length > 0 && (
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
                Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.totalItems} total users)
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <select
                  value={limit}
                  onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    fontSize: "12px",
                    color: "#334155"
                  }}
                >
                  <option value={5}>5 per page</option>
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

      {/* 3. MODAL: USER DETAILS */}
      {detailUser && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 1100
          }}
          onClick={() => setDetailUser(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "540px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              padding: "28px",
              position: "relative",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setDetailUser(null)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "#f1f5f9",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#64748b"
              }}
            >
              <X size={18} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: detailUser.role === "admin" ? "#dbeafe" : "#e2e8f0",
                  color: detailUser.role === "admin" ? "#1e40af" : "#334155",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  fontWeight: 700
                }}
              >
                {(detailUser.firstName || detailUser.name || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: "18px", color: "#0f172a" }}>
                  {detailUser.name || `${detailUser.firstName} ${detailUser.lastName}`.trim()}
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      background: detailUser.role === "admin" ? "#eff6ff" : "#f1f5f9",
                      color: detailUser.role === "admin" ? "#1d4ed8" : "#475569",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "12px"
                    }}
                  >
                    {detailUser.role === "admin" ? "Administrator" : "Traveler"}
                  </span>
                  <span
                    style={{
                      background: detailUser.isActive ? "#f0fdf4" : "#fef2f2",
                      color: detailUser.isActive ? "#16a34a" : "#dc2626",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "12px"
                    }}
                  >
                    {detailUser.isActive ? "Active Account" : "Inactive / Suspended"}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: "12px", borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9", padding: "16px 0", margin: "16px 0", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>User ID:</span>
                <strong style={{ color: "#1e293b" }}>#{detailUser.id}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Email Address:</span>
                <span style={{ color: "#1e293b", fontWeight: 500 }}>{detailUser.email}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Phone:</span>
                <span style={{ color: "#1e293b" }}>{detailUser.phone || "Not provided"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Registered On:</span>
                <span style={{ color: "#1e293b" }}>{formatDate(detailUser.createdAt)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Last Authentication:</span>
                <span style={{ color: detailUser.lastLogin ? "#0f766e" : "#94a3b8", fontWeight: 500 }}>
                  {detailUser.lastLogin ? new Date(detailUser.lastLogin).toLocaleString() : "Never logged in"}
                </span>
              </div>
            </div>

            {/* RELATED ACTIVITY STATS */}
            <div style={{ marginBottom: "16px" }}>
              <span style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#64748b", marginBottom: "10px" }}>
                Traveler Activity
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", textAlign: "center" }}>
                  <Luggage size={18} style={{ color: "#1b4332", margin: "0 auto 4px" }} />
                  <strong style={{ display: "block", fontSize: "16px", color: "#0f172a" }}>
                    {loadingDetail ? "..." : (detailUser.bookingsCount ?? 0)}
                  </strong>
                  <small style={{ fontSize: "11px", color: "#64748b" }}>Bookings</small>
                </div>
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", textAlign: "center" }}>
                  <Star size={18} style={{ color: "#f59e0b", margin: "0 auto 4px" }} />
                  <strong style={{ display: "block", fontSize: "16px", color: "#0f172a" }}>
                    {loadingDetail ? "..." : (detailUser.reviewsCount ?? 0)}
                  </strong>
                  <small style={{ fontSize: "11px", color: "#64748b" }}>Reviews</small>
                </div>
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", textAlign: "center" }}>
                  <Heart size={18} style={{ color: "#e11d48", margin: "0 auto 4px" }} />
                  <strong style={{ display: "block", fontSize: "16px", color: "#0f172a" }}>
                    {loadingDetail ? "..." : (detailUser.wishlistCount ?? 0)}
                  </strong>
                  <small style={{ fontSize: "11px", color: "#64748b" }}>Wishlist</small>
                </div>
              </div>
            </div>

            {/* TRAVEL PREFERENCES */}
            {detailUser.travelPreferences && detailUser.travelPreferences.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <span style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#64748b", marginBottom: "8px" }}>
                  Travel Preferences
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {detailUser.travelPreferences.map((pref, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: "#ecfdf5",
                        color: "#065f46",
                        border: "1px solid #a7f3d0",
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "3px 10px",
                        borderRadius: "16px"
                      }}
                    >
                      {pref}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="button button-dark"
                onClick={() => setDetailUser(null)}
                style={{ padding: "8px 20px" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL: CONFIRM ACTIVATE / DEACTIVATE */}
      {statusModalUser && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 1100
          }}
          onClick={() => !actionProcessing && setStatusModalUser(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "460px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              padding: "28px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              {statusModalUser.isActive ? (
                <div style={{ background: "#fef2f2", padding: "10px", borderRadius: "50%", color: "#dc2626" }}>
                  <UserX size={24} />
                </div>
              ) : (
                <div style={{ background: "#f0fdf4", padding: "10px", borderRadius: "50%", color: "#16a34a" }}>
                  <UserCheck size={24} />
                </div>
              )}
              <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
                {statusModalUser.isActive ? "Deactivate Account?" : "Activate Account?"}
              </h3>
            </div>

            <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.5, margin: "0 0 16px" }}>
              {statusModalUser.isActive ? (
                <>
                  Deactivating <strong>{statusModalUser.name}</strong> ({statusModalUser.email}) will immediately
                  block their access to all protected features. Any existing JWT tokens will be rejected.
                </>
              ) : (
                <>
                  Activating <strong>{statusModalUser.name}</strong> ({statusModalUser.email}) will restore full
                  login access and permit trip reservations.
                </>
              )}
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="button button-outline"
                onClick={() => setStatusModalUser(null)}
                disabled={actionProcessing}
                style={{ padding: "8px 18px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`button ${statusModalUser.isActive ? "button-danger" : "button-dark"}`}
                onClick={handleConfirmStatusChange}
                disabled={actionProcessing}
                style={{
                  padding: "8px 18px",
                  background: statusModalUser.isActive ? "#dc2626" : "#16a34a",
                  color: "#fff"
                }}
              >
                {actionProcessing ? "Updating..." : (statusModalUser.isActive ? "Deactivate" : "Activate")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: CONFIRM ROLE CHANGE */}
      {roleModalUser && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 1100
          }}
          onClick={() => !actionProcessing && setRoleModalUser(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "460px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              padding: "28px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{ background: "#eff6ff", padding: "10px", borderRadius: "50%", color: "#2563eb" }}>
                <Shield size={24} />
              </div>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
                {roleModalUser.role === "admin" ? "Demote to Traveler?" : "Promote to Administrator?"}
              </h3>
            </div>

            <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.5, margin: "0 0 16px" }}>
              {roleModalUser.role === "admin" ? (
                <>
                  Removing admin rights from <strong>{roleModalUser.name}</strong> will revoke access to the Admin
                  Console, booking approvals, and destination management.
                </>
              ) : (
                <>
                  Promoting <strong>{roleModalUser.name}</strong> will grant full administrative privileges,
                  allowing them to manage bookings, destinations, and other user accounts.
                </>
              )}
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="button button-outline"
                onClick={() => setRoleModalUser(null)}
                disabled={actionProcessing}
                style={{ padding: "8px 18px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button-dark"
                onClick={handleConfirmRoleChange}
                disabled={actionProcessing}
                style={{ padding: "8px 18px" }}
              >
                {actionProcessing ? "Updating..." : "Confirm Role Change"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: CONFIRM DELETE (SOFT DELETE) */}
      {deleteModalUser && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 1100
          }}
          onClick={() => !actionProcessing && setDeleteModalUser(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "480px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              padding: "28px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{ background: "#fff1f2", padding: "10px", borderRadius: "50%", color: "#e11d48" }}>
                <Trash2 size={24} />
              </div>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
                Delete User Account?
              </h3>
            </div>

            <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.5, margin: "0 0 12px" }}>
              Are you sure you want to delete <strong>{deleteModalUser.name}</strong> ({deleteModalUser.email})?
            </p>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px", fontSize: "12px", color: "#64748b", marginBottom: "20px" }}>
              <strong>Safe Deletion Policy:</strong> The account will be deactivated and marked as deleted in the database.
              Historical trip bookings and traveler records are safely preserved to maintain database integrity and audit history.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="button button-outline"
                onClick={() => setDeleteModalUser(null)}
                disabled={actionProcessing}
                style={{ padding: "8px 18px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionProcessing}
                style={{
                  padding: "8px 18px",
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                {actionProcessing ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
