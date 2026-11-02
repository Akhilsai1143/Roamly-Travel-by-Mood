import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Compass,
  MapPin,
  CalendarDays,
  Users,
  CreditCard,
  House,
  LogOut,
  Package,
  Handshake,
  TrendingUp,
  X
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function AdminSidebar({
  isMobile = false,
  drawerOpen = true,
  onCloseDrawer,
  pendingBookingsCount = 0
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const userInitials = (user?.name || user?.email || "Admin")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="admin-sidebar">
      <div className="admin-brand-wrap">
        <Link to="/" className="admin-brand" title="Roamly Home">
          <Compass size={27} />
          <span>
            roamly<span className="brand-dot">.</span>
          </span>
        </Link>
        {isMobile && onCloseDrawer && (
          <button
            type="button"
            className="sidebar-drawer-close-btn"
            onClick={onCloseDrawer}
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <p className="admin-sidebar-label">ADMIN CONSOLE</p>

      <nav className="admin-sidebar-nav" aria-label="Admin Navigation">
        <NavLink
          to="/admin/bookings"
          className={({ isActive }) =>
            isActive ? "admin-side-link active" : "admin-side-link"
          }
        >
          <CalendarDays size={19} />
          <span>Trip Bookings</span>
          {pendingBookingsCount > 0 && (
            <span className="admin-pending-pill" title={`${pendingBookingsCount} pending approvals`}>
              {pendingBookingsCount}
            </span>
          )}
        </NavLink>

        <NavLink
          to="/admin/packages"
          className={({ isActive }) =>
            isActive ? "admin-side-link active" : "admin-side-link"
          }
        >
          <Package size={19} />
          <span>Travel Packages</span>
        </NavLink>

        <NavLink
          to="/admin/partners"
          className={({ isActive }) =>
            isActive ? "admin-side-link active" : "admin-side-link"
          }
        >
          <Handshake size={19} />
          <span>Partners & Suppliers</span>
        </NavLink>

        <NavLink
          to="/admin/profit-analysis"
          className={({ isActive }) =>
            isActive ? "admin-side-link active" : "admin-side-link"
          }
        >
          <TrendingUp size={19} />
          <span>Profit & Financials</span>
        </NavLink>

        <NavLink
          to="/admin/destinations"
          className={({ isActive }) =>
            isActive ? "admin-side-link active" : "admin-side-link"
          }
        >
          <MapPin size={19} />
          <span>Destinations</span>
        </NavLink>

        <NavLink
          to="/admin/payments"
          className={({ isActive }) =>
            isActive ? "admin-side-link active" : "admin-side-link"
          }
        >
          <CreditCard size={19} />
          <span>Payment Logs</span>
        </NavLink>

        <NavLink
          to="/admin/users"
          className={({ isActive }) =>
            isActive ? "admin-side-link active" : "admin-side-link"
          }
        >
          <Users size={19} />
          <span>Users</span>
        </NavLink>

        <div className="admin-side-divider" />

        <Link to="/" className="admin-side-link admin-side-link-site">
          <House size={19} />
          <span>Public Website</span>
        </Link>
      </nav>

      <div className="admin-profile">
        <div className="admin-avatar">{userInitials}</div>
        <div className="admin-user-info">
          <strong>{user?.name || "Administrator"}</strong>
          <small>{user?.role?.toUpperCase() || "ADMIN"}</small>
        </div>
        <button
          type="button"
          className="admin-logout-button"
          onClick={handleLogout}
          title="Sign out of Admin Console"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
