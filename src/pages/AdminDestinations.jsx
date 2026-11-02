import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  MapPin,
  RefreshCw,
  X,
  LogOut,
  LayoutDashboard,
  Compass,
  CalendarDays,
  House,
  Users,
  CreditCard,
  Menu
} from "lucide-react";
import { getAdminStats } from "../api/bookings.js";
import AdminSidebar from "../components/AdminSidebar.jsx";

import {
  getDestinations,
  createDestination,
  updateDestination,
  deleteDestination,
} from "../api/destinations.js";

import { useAuth } from "../context/AuthContext.jsx";

const emptyForm = {
  name: "",
  state: "",
  country: "India",
  mood: "",
  category: "Nature",
  days: "",
  budget: "",
  image: "",
  description: "",
  bestTime: "",
  hiddenGem: "",
  tip: "",
};

const fields = [
  { name: "name", label: "Destination name", required: true },
  { name: "state", label: "State / region" },
  { name: "country", label: "Country", required: true },
  { name: "category", label: "Category" },
  { name: "days", label: "Recommended days", type: "number" },
  { name: "budget", label: "Estimated budget" },
  { name: "image", label: "Image URL" },
  { name: "bestTime", label: "Best time to visit" },
  { name: "hiddenGem", label: "Hidden gem details" },
  { name: "tip", label: "Travel tip" },
];

export default function AdminDestinations() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [destinations, setDestinations] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);

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

  // Fetch destinations from the backend.
  // The API returns { destinations: [...], pagination: {...} }.
  async function loadDestinations(
    requestedPage = page,
    requestedSearch = search
  ) {
    setLoading(true);
    setError("");

    try {
      const data = await getDestinations({
        page: requestedPage,
        limit: 10,
        search: requestedSearch.trim(),
      });

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.destinations)
          ? data.destinations
          : [];

      setDestinations(list);

      if (data?.pagination) {
        setPagination(data.pagination);
      } else {
        // Fallback if the API still returns a plain array.
        setPagination({
          page: requestedPage,
          limit: 10,
          totalItems: list.length,
          totalPages: list.length ? 1 : 0,
          hasNextPage: false,
          hasPreviousPage: false,
        });
      }
    } catch (err) {
      console.error("Failed to load destinations:", err);
      setDestinations([]);
      setError(
        err.response?.data?.message ||
          "Could not load destinations. Check that your backend and database are running."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDestinations(page, search);
    // Loading is triggered whenever page or search changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  function startAdd() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setNotice("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEdit(destination) {
    setEditingId(destination.id);

    setForm({
      ...emptyForm,
      ...destination,
      mood: Array.isArray(destination.mood)
        ? destination.mood.join(", ")
        : destination.mood || "",
      days: destination.days ?? "",
      budget: destination.budget ?? "",
      bestTime: destination.bestTime || destination.best_time || "",
      hiddenGem: destination.hiddenGem || destination.hidden_gem || "",
    });

    setError("");
    setNotice("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
      ...form,
      name: form.name.trim(),
      state: form.state.trim(),
      country: form.country.trim(),
      mood: form.mood
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      days: form.days === "" ? null : Number(form.days),
      budget: form.budget === "" ? null : form.budget,
      bestTime: form.bestTime,
      hiddenGem: form.hiddenGem,
      gallery: form.gallery || undefined,
    };

    try {
      if (editingId !== null) {
        await updateDestination(editingId, payload);
        setNotice("Destination updated successfully.");
      } else {
        await createDestination(payload);
        setNotice("Destination added successfully.");
      }

      setShowForm(false);
      setEditingId(null);
      setForm({ ...emptyForm });

      // Return to the first page after adding a new destination.
      if (editingId === null && page !== 1) {
        setPage(1);
      } else {
        await loadDestinations(page, search);
      }
    } catch (err) {
      console.error("Failed to save destination:", err);
      setError(
        err.response?.data?.message ||
          "Could not save destination. Check your admin login and API."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(destination) {
    const confirmed = window.confirm(
      `Delete "${destination.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await deleteDestination(destination.id);
      setNotice("Destination deleted successfully.");

      // If the deleted destination was the only item on the current
      // page, move back one page when possible.
      const isLastItemOnPage = destinations.length === 1 && page > 1;
      const nextPage = isLastItemOnPage ? page - 1 : page;

      if (nextPage !== page) {
        setPage(nextPage);
      } else {
        await loadDestinations(nextPage, search);
      }
    } catch (err) {
      console.error("Failed to delete destination:", err);
      setError(
        err.response?.data?.message ||
          "Could not delete destination."
      );
    }
  }

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  function handlePageChange(nextPage) {
    if (nextPage < 1 || nextPage > pagination.totalPages) return;

    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className={`admin-page admin-destinations-page ${drawerOpen ? "drawer-open" : "drawer-closed"}`}>
      {/* MOBILE DRAWER BACKDROP */}
      {isMobile && drawerOpen && (
        <div
          className="admin-drawer-backdrop"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      <AdminSidebar
        isMobile={isMobile}
        drawerOpen={drawerOpen}
        onCloseDrawer={() => setDrawerOpen(false)}
        pendingBookingsCount={pendingBookingsCount}
      />

      <section className="admin-main">
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
                Workspace / Destinations
              </span>
              <h1>Destination management</h1>
              <p>
                Manage the places that inspire your travellers.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="admin-primary-button"
            onClick={startAdd}
          >
            <Plus size={19} />
            Add destination
          </button>
        </header>

        {notice && (
          <div className="admin-notice" role="status">
            {notice}
          </div>
        )}

        {error && (
          <div className="admin-error" role="alert">
            {error}
          </div>
        )}

        <div className="admin-stat-grid">
          <article className="admin-stat-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Total Destinations</span>
              <div className="admin-stat-icon-wrap stat-icon-neutral">
                <MapPin size={15} />
              </div>
            </div>
            <strong className="admin-stat-value">{pagination.totalItems}</strong>
            <small className="admin-stat-desc">In your catalogue</small>
          </article>

          <article className="admin-stat-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Showing Results</span>
              <div className="admin-stat-icon-wrap stat-icon-blue">
                <Compass size={15} />
              </div>
            </div>
            <strong className="admin-stat-value stat-val-blue">{destinations.length}</strong>
            <small className="admin-stat-desc">On this page</small>
          </article>

          <article className="admin-stat-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Categories</span>
              <div className="admin-stat-icon-wrap stat-icon-teal">
                <LayoutDashboard size={15} />
              </div>
            </div>
            <strong className="admin-stat-value stat-val-teal">
              {
                new Set(
                  destinations
                    .map((item) => item.category)
                    .filter(Boolean)
                ).size
              }
            </strong>
            <small className="admin-stat-desc">Distinct categories</small>
          </article>
        </div>

        {showForm && (
          <section className="admin-form-card">
            <div className="admin-form-heading">
              <div>
                <span className="admin-eyebrow">
                  DESTINATION DETAILS
                </span>
                <h2>
                  {editingId !== null
                    ? "Edit destination"
                    : "Add a new destination"}
                </h2>
              </div>

              <button
                type="button"
                className="admin-icon-button"
                onClick={() => setShowForm(false)}
                aria-label="Close form"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-form-grid">
                {fields.map((field) => (
                  <label className="admin-field" key={field.name}>
                    <span>
                      {field.label}
                      {field.required && " *"}
                    </span>

                    <input
                      name={field.name}
                      type={field.type || "text"}
                      value={form[field.name] ?? ""}
                      onChange={handleChange}
                      required={Boolean(field.required)}
                      min={field.type === "number" ? 1 : undefined}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  </label>
                ))}

                <label className="admin-field">
                  <span>Moods</span>
                  <input
                    name="mood"
                    value={form.mood}
                    onChange={handleChange}
                    placeholder="Adventure, Relaxation, Nature"
                  />
                  <small>Separate moods with commas.</small>
                </label>

                <label className="admin-field admin-field-wide">
                  <span>Description</span>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe this destination..."
                  />
                </label>
              </div>

              <div className="admin-form-actions">
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setForm({ ...emptyForm });
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                      ? "Save changes"
                      : "Create destination"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="admin-table-card">
          <div className="admin-table-heading">
            <div>
              <h2>All destinations</h2>
              <p>
                Review and manage your travel catalogue.
              </p>
            </div>

            <button
              type="button"
              className="admin-icon-button"
              onClick={() => loadDestinations(page, search)}
              disabled={loading}
              aria-label="Refresh destinations"
              title="Refresh"
            >
              <RefreshCw size={19} />
            </button>
          </div>

          <div className="admin-search">
            <Search size={19} />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by name, state, country or category..."
              aria-label="Search destinations"
            />
          </div>

          {loading ? (
            <p className="admin-empty">
              Loading destinations...
            </p>
          ) : destinations.length === 0 ? (
            <div className="admin-empty">
              <MapPin size={30} />
              <h3>
                {search
                  ? "No destinations found"
                  : "No destinations available"}
              </h3>
              <p>
                {search
                  ? "Try another search or clear the search field."
                  : "Add your first destination using the button above."}
              </p>

              {search && (
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table destinations-table">
                <thead>
                  <tr>
                    <th>Destination</th>
                    <th>Location</th>
                    <th>Category</th>
                    <th>Duration</th>
                    <th>Budget</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {destinations.map((destination) => (
                    <tr key={destination.id}>
                      <td>
                        <div className="admin-destination-cell">
                          {destination.image ? (
                            <img
                              src={destination.image}
                              alt={destination.name || "Destination"}
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="admin-image-placeholder">
                              <MapPin size={20} />
                            </div>
                          )}

                          <div>
                            <strong>{destination.name}</strong>
                            <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "2px" }}>
                              <small>ID: {destination.id}</small>
                              {Array.isArray(destination.gallery) && destination.gallery.length > 0 && (
                                <span style={{
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  color: "#059669",
                                  background: "#ecfdf5",
                                  padding: "1px 6px",
                                  borderRadius: "10px",
                                  border: "1px solid #a7f3d0"
                                }}>
                                  📷 {destination.gallery.length} photos
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        {[destination.state, destination.country]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </td>

                      <td>
                        <span className="admin-category-pill">
                          {destination.category || "Other"}
                        </span>
                      </td>

                      <td>
                        {destination.days
                          ? `${destination.days} days`
                          : "—"}
                      </td>

                      <td>{destination.budget || "—"}</td>

                      <td>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="admin-icon-button"
                            onClick={() => startEdit(destination)}
                            title="Edit destination"
                            aria-label={`Edit ${destination.name}`}
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            className="admin-icon-button danger"
                            onClick={() => handleDelete(destination)}
                            title="Delete destination"
                            aria-label={`Delete ${destination.name}`}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && pagination.totalPages > 1 && (
            <nav className="pagination" aria-label="Admin destination pages">
              <button
                type="button"
                disabled={!pagination.hasPreviousPage}
                onClick={() => handlePageChange(page - 1)}
              >
                Previous
              </button>

              {Array.from(
                { length: pagination.totalPages },
                (_, index) => index + 1
              ).map((pageNumber) => (
                <button
                  type="button"
                  key={pageNumber}
                  className={pageNumber === page ? "active" : ""}
                  aria-current={
                    pageNumber === page ? "page" : undefined
                  }
                  onClick={() => handlePageChange(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                disabled={!pagination.hasNextPage}
                onClick={() => handlePageChange(page + 1)}
              >
                Next
              </button>
            </nav>
          )}
        </section>
      </section>
    </main>
  );
}
