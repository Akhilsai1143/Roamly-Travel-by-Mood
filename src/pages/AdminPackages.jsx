import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  MapPin,
  Calendar,
  Bed,
  Utensils,
  Car,
  Users,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  DollarSign
} from "lucide-react";
import AdminSidebar from "../components/AdminSidebar.jsx";
import {
  getAllPackagesAdmin,
  createPackageAdmin,
  updatePackageAdmin,
  deletePackageAdmin
} from "../api/packages";
import { getAllPartners } from "../api/partners";
import { getDestinations } from "../api/destinations";
import "./UserDashboard.css";
import "./AdminPackages.css";

export default function AdminPackages() {
  const [packages, setPackages] = useState([]);
  const [partners, setPartners] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // Filters & Search
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mobile drawer
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 900);

  // Edit / Create Drawer Modal state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Preview Modal
  const [previewPackage, setPreviewPackage] = useState(null);

  // Delete Confirm Modal
  const [deleteModalPackage, setDeleteModalPackage] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    destinationId: "",
    packageCode: "",
    name: "",
    tagline: "",
    tier: "standard",
    description: "",
    durationDays: 4,
    durationNights: 3,
    accommodationType: "3-Star Boutique Hotel",
    mealPlan: "Breakfast Included (CP Plan)",
    transportType: "Private AC Sedan",
    pickupDrop: "Designated Airport/Station Transfers",
    pricePerPerson: 18500,
    originalPrice: 23000,
    pricingType: "per_person",
    maxCapacity: 20,
    isFeatured: false,
    status: "active",
    inclusions: [
      "Accommodation on twin-sharing basis",
      "Daily buffet breakfast",
      "Private AC vehicle for all transfers",
      "24/7 on-ground concierge support"
    ],
    exclusions: [
      "Airfare or train fare",
      "Personal expenses & monument entry passes"
    ],
    itinerary: [
      { day: 1, title: "Arrival & Welcome", description: "Airport pickup, transfer to stay, check-in and evening stroll." },
      { day: 2, title: "Scenic Highlights Tour", description: "Guided sightseeing of primary viewpoints and cultural landmarks." },
      { day: 3, title: "Nature & Local Life", description: "Authentic exploration of plantations, craft centers, and sunset spot." },
      { day: 4, title: "Departure", description: "Breakfast, checkout, and chauffeur drop-off at departure hub." }
    ],
    services: []
  });

  // Handle Resize
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 900);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [pkgsRes, ptnsRes, destsRes] = await Promise.all([
        getAllPackagesAdmin(),
        getAllPartners(),
        getDestinations()
      ]);

      setPackages(pkgsRes.packages || []);
      setPartners(ptnsRes.partners || []);
      setDestinations(destsRes || []);
    } catch (err) {
      console.error("Failed to load packages data:", err);
      setError("Failed to load packages from database.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // KPIs
  const stats = useMemo(() => {
    const total = packages.length;
    const active = packages.filter((p) => p.status === "active").length;
    const standard = packages.filter((p) => p.tier === "standard").length;
    const comfort = packages.filter((p) => p.tier === "comfort").length;
    const premium = packages.filter((p) => p.tier === "premium").length;
    const totalTravelers = packages.reduce((acc, p) => acc + (p.travelersAccommodated || 0), 0);
    return { total, active, standard, comfort, premium, totalTravelers };
  }, [packages]);

  // Filtered List
  const filteredPackages = useMemo(() => {
    return packages.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.packageCode && p.packageCode.toLowerCase().includes(search.toLowerCase())) ||
        (p.destinationName && p.destinationName.toLowerCase().includes(search.toLowerCase()));

      const matchTier = tierFilter === "all" || p.tier === tierFilter;
      const matchStatus = statusFilter === "all" || p.status === statusFilter;

      return matchSearch && matchTier && matchStatus;
    });
  }, [packages, search, tierFilter, statusFilter]);

  function handleOpenCreate() {
    setEditingPackage(null);
    setFormData({
      destinationId: destinations[0]?.id || 1,
      packageCode: "",
      name: "",
      tagline: "",
      tier: "standard",
      description: "",
      durationDays: 4,
      durationNights: 3,
      accommodationType: "3-Star Boutique Hotel",
      mealPlan: "Breakfast Included (CP Plan)",
      transportType: "Private AC Sedan",
      pickupDrop: "Designated Airport/Station Transfers",
      pricePerPerson: 18500,
      originalPrice: 23000,
      pricingType: "per_person",
      maxCapacity: 20,
      isFeatured: false,
      status: "active",
      inclusions: [
        "Accommodation on twin-sharing basis",
        "Daily buffet breakfast",
        "Private AC vehicle for all transfers",
        "24/7 on-ground concierge support"
      ],
      exclusions: [
        "Airfare or train fare",
        "Personal expenses & monument entry passes"
      ],
      itinerary: [
        { day: 1, title: "Arrival & Welcome", description: "Airport pickup, transfer to stay, check-in and evening stroll." },
        { day: 2, title: "Scenic Highlights Tour", description: "Guided sightseeing of primary viewpoints and cultural landmarks." },
        { day: 3, title: "Nature & Local Life", description: "Authentic exploration of plantations, craft centers, and sunset spot." },
        { day: 4, title: "Departure", description: "Breakfast, checkout, and chauffeur drop-off at departure hub." }
      ],
      services: []
    });
    setFormModalOpen(true);
  }

  function handleOpenEdit(pkg) {
    setEditingPackage(pkg);
    setFormData({
      destinationId: pkg.destinationId || 1,
      packageCode: pkg.packageCode || "",
      name: pkg.name || "",
      tagline: pkg.tagline || "",
      tier: pkg.tier || "standard",
      description: pkg.description || "",
      durationDays: pkg.durationDays || 4,
      durationNights: pkg.durationNights || 3,
      accommodationType: pkg.accommodationType || "",
      mealPlan: pkg.mealPlan || "",
      transportType: pkg.transportType || "",
      pickupDrop: pkg.pickupDrop || "",
      pricePerPerson: pkg.pricePerPerson || 0,
      originalPrice: pkg.originalPrice || 0,
      pricingType: pkg.pricingType || "per_person",
      maxCapacity: pkg.maxCapacity || 20,
      isFeatured: pkg.isFeatured || false,
      status: pkg.status || "active",
      inclusions: Array.isArray(pkg.inclusions) ? pkg.inclusions : [],
      exclusions: Array.isArray(pkg.exclusions) ? pkg.exclusions : [],
      itinerary: Array.isArray(pkg.itinerary) ? pkg.itinerary : [],
      services: Array.isArray(pkg.partnerServices) ? pkg.partnerServices : []
    });
    setFormModalOpen(true);
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingPackage) {
        await updatePackageAdmin(editingPackage.id, formData);
        setNotice("Package updated successfully!");
      } else {
        await createPackageAdmin(formData);
        setNotice("New travel package created successfully!");
      }
      setFormModalOpen(false);
      loadAllData();
      setTimeout(() => setNotice(""), 4000);
    } catch (err) {
      console.error("Save package error:", err);
      alert(err.response?.data?.message || err.message || "Failed to save package.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeletePackage() {
    if (!deleteModalPackage) return;
    setDeleting(true);
    try {
      const res = await deletePackageAdmin(deleteModalPackage.id);
      setNotice(res.message || "Package removed successfully.");
      setDeleteModalPackage(null);
      loadAllData();
      setTimeout(() => setNotice(""), 4000);
    } catch (err) {
      console.error("Delete package error:", err);
      alert("Failed to delete package.");
    } finally {
      setDeleting(false);
    }
  }

  // Helper to add/remove array items
  function addInclusion() {
    setFormData((prev) => ({ ...prev, inclusions: [...prev.inclusions, ""] }));
  }
  function updateInclusion(idx, val) {
    setFormData((prev) => {
      const copy = [...prev.inclusions];
      copy[idx] = val;
      return { ...prev, inclusions: copy };
    });
  }
  function removeInclusion(idx) {
    setFormData((prev) => ({
      ...prev,
      inclusions: prev.inclusions.filter((_, i) => i !== idx)
    }));
  }

  function addExclusion() {
    setFormData((prev) => ({ ...prev, exclusions: [...prev.exclusions, ""] }));
  }
  function updateExclusion(idx, val) {
    setFormData((prev) => {
      const copy = [...prev.exclusions];
      copy[idx] = val;
      return { ...prev, exclusions: copy };
    });
  }
  function removeExclusion(idx) {
    setFormData((prev) => ({
      ...prev,
      exclusions: prev.exclusions.filter((_, i) => i !== idx)
    }));
  }

  function addItineraryDay() {
    setFormData((prev) => ({
      ...prev,
      itinerary: [
        ...prev.itinerary,
        { day: prev.itinerary.length + 1, title: "", description: "" }
      ]
    }));
  }
  function updateItinerary(idx, field, val) {
    setFormData((prev) => {
      const copy = [...prev.itinerary];
      copy[idx] = { ...copy[idx], [field]: val };
      return { ...prev, itinerary: copy };
    });
  }
  function removeItinerary(idx) {
    setFormData((prev) => ({
      ...prev,
      itinerary: prev.itinerary.filter((_, i) => i !== idx)
    }));
  }

  function addPartnerService() {
    if (partners.length === 0) {
      alert("Please add at least one partner supplier before attaching services.");
      return;
    }
    const firstPartner = partners[0];
    setFormData((prev) => ({
      ...prev,
      services: [
        ...prev.services,
        {
          partnerId: firstPartner.id,
          serviceName: `${firstPartner.name} Standard Allocation`,
          serviceType: firstPartner.serviceCategory || "accommodation",
          costAmount: 2000,
          pricingBasis: "per_traveler",
          notes: ""
        }
      ]
    }));
  }
  function updateService(idx, field, val) {
    setFormData((prev) => {
      const copy = [...prev.services];
      copy[idx] = { ...copy[idx], [field]: val };
      return { ...prev, services: copy };
    });
  }
  function removeService(idx) {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== idx)
    }));
  }

  return (
    <main className={`admin-page admin-packages-page ${drawerOpen ? "drawer-open" : "drawer-closed"}`}>
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
      />

      <section className="admin-main">
        {/* TOP BAR */}
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
                Workspace / Travel Packages
              </span>
              <h1>Travel Package Management</h1>
              <p>
                Curate Standard, Comfort, and Premium vacation tiers with linked wholesale supplier costs.
              </p>
            </div>
          </div>

          <div className="admin-topbar-actions">
            <button
              type="button"
              className="admin-secondary-button"
              onClick={loadAllData}
              disabled={loading}
              title="Refresh from MySQL"
            >
              <RefreshCw size={15} className={loading ? "admin-spinning" : ""} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              className="admin-primary-button"
              onClick={handleOpenCreate}
            >
              <Plus size={16} />
              <span>Create New Package</span>
            </button>
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
          </div>
        )}

        {/* KPI CARDS */}
        <div className="admin-stat-grid">
          <article className="admin-stat-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Total Packages</span>
              <div className="admin-stat-icon-wrap stat-icon-neutral">
                <Package size={15} />
              </div>
            </div>
            <strong className="admin-stat-value">{stats.total}</strong>
            <small className="admin-stat-desc">{stats.active} published & live</small>
          </article>

          <article className="admin-stat-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Standard Tiers</span>
              <div className="admin-stat-icon-wrap stat-icon-green">
                <CheckCircle2 size={15} />
              </div>
            </div>
            <strong className="admin-stat-value stat-val-green">{stats.standard}</strong>
            <small className="admin-stat-desc">Classic value packages</small>
          </article>

          <article className="admin-stat-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Comfort Escapes</span>
              <div className="admin-stat-icon-wrap stat-icon-amber">
                <Sparkles size={15} />
              </div>
            </div>
            <strong className="admin-stat-value stat-val-amber">{stats.comfort}</strong>
            <small className="admin-stat-desc">4-Star & resort stays</small>
          </article>

          <article className="admin-stat-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Premium Sanctuary</span>
              <div className="admin-stat-icon-wrap" style={{ background: "#faf5ff", color: "#6b21a8" }}>
                <ShieldCheck size={15} />
              </div>
            </div>
            <strong className="admin-stat-value" style={{ color: "#6b21a8" }}>{stats.premium}</strong>
            <small className="admin-stat-desc">Ultra-luxury experiences</small>
          </article>
        </div>

        {/* TABLE CONTAINER */}
        <article className="admin-table-card">
          <div className="admin-table-heading">
            <div>
              <span className="admin-eyebrow">INVENTORY MATRIX</span>
              <h2>Package Catalog & Supplier Attachments</h2>
              <p>Configure travel packages, selling rates, and linked partner supplier costs.</p>
            </div>
          </div>

          {/* SEARCH & FILTERS */}
          <div className="admin-controls-bar">
            <div className="admin-search-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search packages by title, code, or destination..."
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

            <div className="admin-select-wrap">
              <Filter size={15} />
              <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
                <option value="all">All Tiers</option>
                <option value="standard">Standard</option>
                <option value="comfort">Comfort</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            <div className="admin-select-wrap">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* TABLE */}
          {loading ? (
            <div className="admin-loading-row">
              <RefreshCw size={24} className="admin-spinning" />
              <span>Loading packages from MySQL...</span>
            </div>
          ) : filteredPackages.length === 0 ? (
            <div className="dashboard-empty-state">
              <Package size={34} />
              <h3>No travel packages found</h3>
              <p>Try adjusting your search filters or click "Create New Package" to add one.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table packages-table">
                <thead>
                  <tr>
                    <th>Package Code & Name</th>
                    <th>Destination</th>
                    <th>Tier</th>
                    <th>Duration</th>
                    <th>Customer Price</th>
                    <th>Supplier Cost</th>
                    <th>Unit Margin</th>
                    <th>Bookings</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPackages.map((pkg) => {
                    const price = Number(pkg.pricePerPerson) || 0;
                    const supplierCost = Number(pkg.partnerTotalCost) || 0;
                    const marginInr = price - supplierCost;
                    const marginPct = price > 0 ? Math.round((marginInr / price) * 1000) / 10 : 0;

                    const tierClass =
                      pkg.tier === "premium"
                        ? "tier-badge-premium"
                        : pkg.tier === "comfort"
                        ? "tier-badge-comfort"
                        : "tier-badge-standard";

                    return (
                      <tr key={pkg.id}>
                        <td>
                          <div className="admin-pkg-cell">
                            <code>{pkg.packageCode || `PKG-${pkg.id}`}</code>
                            <strong>{pkg.name}</strong>
                            <small>{pkg.tagline}</small>
                          </div>
                        </td>
                        <td>
                          <div className="admin-dest-cell">
                            <MapPin size={13} />
                            <span>{pkg.destinationName || "Kerala"}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`admin-tier-badge ${tierClass}`}>
                            {pkg.tier?.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span className="admin-duration-cell">
                            {pkg.durationDays}D / {pkg.durationNights}N
                          </span>
                        </td>
                        <td>
                          <strong>₹{price.toLocaleString("en-IN")}</strong>
                        </td>
                        <td>
                          <span style={{ color: "#475569" }}>
                            ₹{supplierCost.toLocaleString("en-IN")}
                          </span>
                          <small style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>
                            {pkg.partnerServices?.length || 0} services
                          </small>
                        </td>
                        <td>
                          <div className="admin-margin-cell">
                            <strong style={{ color: marginPct >= 20 ? "#16a34a" : "#b45309" }}>
                              ₹{marginInr.toLocaleString("en-IN")}
                            </strong>
                            <span className="margin-pct-pill">{marginPct}%</span>
                          </div>
                        </td>
                        <td>
                          <span className="admin-bookings-count-pill">
                            {pkg.bookingsCount || 0} booked
                          </span>
                        </td>
                        <td>
                          <span className={`admin-status-pill status-${pkg.status}`}>
                            {pkg.status}
                          </span>
                        </td>
                        <td>
                          <div className="admin-row-actions">
                            <button
                              type="button"
                              className="admin-icon-action"
                              onClick={() => setPreviewPackage(pkg)}
                              title="Preview as Traveler"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              type="button"
                              className="admin-icon-action"
                              onClick={() => handleOpenEdit(pkg)}
                              title="Edit Package"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              type="button"
                              className="admin-icon-action delete"
                              onClick={() => setDeleteModalPackage(pkg)}
                              title="Delete or Archive Package"
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
        </article>

        {/* CREATE / EDIT DRAWER MODAL */}
        {formModalOpen && (
          <div className="admin-drawer-modal-backdrop" onClick={() => setFormModalOpen(false)}>
            <div
              className="admin-package-drawer"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="drawer-header">
                <div>
                  <span className="admin-eyebrow">PACKAGE BUILDER</span>
                  <h2>{editingPackage ? "Edit Travel Package" : "Create New Travel Package"}</h2>
                </div>
                <button
                  type="button"
                  className="drawer-close-btn"
                  onClick={() => setFormModalOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <form className="drawer-body" onSubmit={handleFormSubmit}>
                {/* BASIC INFO */}
                <div className="drawer-section">
                  <h3>1. General Package Details</h3>
                  <div className="drawer-form-grid">
                    <label>
                      Destination *
                      <select
                        value={formData.destinationId}
                        onChange={(e) => setFormData({ ...formData, destinationId: e.target.value })}
                        required
                      >
                        {destinations.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.state || d.country})
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Package Code
                      <input
                        type="text"
                        placeholder="e.g. PKG-KER-EXPLORER"
                        value={formData.packageCode}
                        onChange={(e) => setFormData({ ...formData, packageCode: e.target.value })}
                      />
                    </label>

                    <label style={{ gridColumn: "span 2" }}>
                      Package Title *
                      <input
                        type="text"
                        placeholder="e.g. Kerala Explorer — Classic Backwaters & Tea Trails"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </label>

                    <label style={{ gridColumn: "span 2" }}>
                      Tagline / Summary
                      <input
                        type="text"
                        placeholder="e.g. Mist-covered tea plantations, tranquil houseboats, and authentic heritage"
                        value={formData.tagline}
                        onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                      />
                    </label>

                    <label>
                      Luxury Tier *
                      <select
                        value={formData.tier}
                        onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                      >
                        <option value="standard">Standard Experience</option>
                        <option value="comfort">Comfort Escape</option>
                        <option value="premium">Premium Experience</option>
                      </select>
                    </label>

                    <label>
                      Status
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="active">Active (Visible to Travelers)</option>
                        <option value="draft">Draft (Hidden)</option>
                        <option value="archived">Archived</option>
                      </select>
                    </label>
                  </div>
                </div>

                {/* DURATION & LOGISTICS */}
                <div className="drawer-section">
                  <h3>2. Duration & Service Logistics</h3>
                  <div className="drawer-form-grid">
                    <label>
                      Duration Days *
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={formData.durationDays}
                        onChange={(e) => setFormData({ ...formData, durationDays: Number(e.target.value) })}
                        required
                      />
                    </label>

                    <label>
                      Duration Nights *
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={formData.durationNights}
                        onChange={(e) => setFormData({ ...formData, durationNights: Number(e.target.value) })}
                        required
                      />
                    </label>

                    <label>
                      Accommodation Type
                      <input
                        type="text"
                        placeholder="e.g. 4-Star Mountain Resort & Luxury Houseboat"
                        value={formData.accommodationType}
                        onChange={(e) => setFormData({ ...formData, accommodationType: e.target.value })}
                      />
                    </label>

                    <label>
                      Meal Plan
                      <input
                        type="text"
                        placeholder="e.g. Breakfast & Dinner Included (MAP)"
                        value={formData.mealPlan}
                        onChange={(e) => setFormData({ ...formData, mealPlan: e.target.value })}
                      />
                    </label>

                    <label>
                      Transport Type
                      <input
                        type="text"
                        placeholder="e.g. Private AC Innova Crysta Chauffeur"
                        value={formData.transportType}
                        onChange={(e) => setFormData({ ...formData, transportType: e.target.value })}
                      />
                    </label>

                    <label>
                      Pickup & Drop
                      <input
                        type="text"
                        placeholder="e.g. Cochin International Airport Transfers"
                        value={formData.pickupDrop}
                        onChange={(e) => setFormData({ ...formData, pickupDrop: e.target.value })}
                      />
                    </label>
                  </div>
                </div>

                {/* PRICING */}
                <div className="drawer-section">
                  <h3>3. Customer Selling Price</h3>
                  <div className="drawer-form-grid">
                    <label>
                      Selling Price Per Person (INR) *
                      <input
                        type="number"
                        min="500"
                        value={formData.pricePerPerson}
                        onChange={(e) => setFormData({ ...formData, pricePerPerson: Number(e.target.value) })}
                        required
                      />
                    </label>

                    <label>
                      Original / Strike Price (INR)
                      <input
                        type="number"
                        min="0"
                        value={formData.originalPrice}
                        onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                      />
                    </label>
                  </div>
                </div>

                {/* LINKED PARTNER SERVICES */}
                <div className="drawer-section">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div>
                      <h3 style={{ margin: 0 }}>4. Contracted Partner Supplier Services</h3>
                      <small style={{ color: "#64748b" }}>Track wholesale vendor costs to calculate net profit margins accurately.</small>
                    </div>
                    <button type="button" className="admin-secondary-button" onClick={addPartnerService}>
                      <Plus size={14} /> Add Supplier Service
                    </button>
                  </div>

                  {formData.services.length === 0 ? (
                    <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "8px", textAlign: "center", color: "#64748b" }}>
                      No supplier services linked yet. Click "Add Supplier Service" to link hotels, cabs, guides, or activities.
                    </div>
                  ) : (
                    <div className="drawer-services-list">
                      {formData.services.map((svc, idx) => (
                        <div key={idx} className="drawer-svc-card">
                          <div className="drawer-svc-header">
                            <label style={{ flex: 1 }}>
                              Partner / Vendor
                              <select
                                value={svc.partnerId}
                                onChange={(e) => updateService(idx, "partnerId", Number(e.target.value))}
                              >
                                {partners.map((pt) => (
                                  <option key={pt.id} value={pt.id}>
                                    [{pt.serviceCategory?.toUpperCase()}] {pt.name}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label style={{ flex: 2 }}>
                              Service Description
                              <input
                                type="text"
                                placeholder="e.g. 2 Nights Deluxe Room with Breakfast"
                                value={svc.serviceName}
                                onChange={(e) => updateService(idx, "serviceName", e.target.value)}
                              />
                            </label>

                            <label style={{ width: "130px" }}>
                              Agreed Cost (₹)
                              <input
                                type="number"
                                min="0"
                                value={svc.costAmount}
                                onChange={(e) => updateService(idx, "costAmount", Number(e.target.value))}
                              />
                            </label>

                            <button
                              type="button"
                              className="drawer-remove-btn"
                              onClick={() => removeService(idx)}
                              title="Remove service"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* INCLUSIONS & EXCLUSIONS */}
                <div className="drawer-section">
                  <h3>5. Inclusions & Exclusions</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <strong>Inclusions</strong>
                        <button type="button" className="text-add-btn" onClick={addInclusion}>+ Add</button>
                      </div>
                      {formData.inclusions.map((inc, i) => (
                        <div key={i} className="list-builder-row">
                          <input
                            type="text"
                            value={inc}
                            onChange={(e) => updateInclusion(i, e.target.value)}
                            placeholder="Inclusion item"
                          />
                          <button type="button" onClick={() => removeInclusion(i)}>
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <strong>Exclusions</strong>
                        <button type="button" className="text-add-btn" onClick={addExclusion}>+ Add</button>
                      </div>
                      {formData.exclusions.map((exc, i) => (
                        <div key={i} className="list-builder-row">
                          <input
                            type="text"
                            value={exc}
                            onChange={(e) => updateExclusion(i, e.target.value)}
                            placeholder="Exclusion item"
                          />
                          <button type="button" onClick={() => removeExclusion(i)}>
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ITINERARY */}
                <div className="drawer-section">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <h3 style={{ margin: 0 }}>6. Day-by-Day Itinerary Plan</h3>
                    <button type="button" className="admin-secondary-button" onClick={addItineraryDay}>
                      <Plus size={14} /> Add Day
                    </button>
                  </div>

                  {formData.itinerary.map((dayItem, i) => (
                    <div key={i} className="drawer-itinerary-card">
                      <div className="it-card-top">
                        <span className="it-card-day">Day {dayItem.day || i + 1}</span>
                        <input
                          type="text"
                          placeholder="Day Title (e.g. Scenic Mist Valleys & Tea Trails)"
                          value={dayItem.title}
                          onChange={(e) => updateItinerary(i, "title", e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <button type="button" className="drawer-remove-btn" onClick={() => removeItinerary(i)}>
                          <X size={16} />
                        </button>
                      </div>
                      <textarea
                        rows="2"
                        placeholder="Day itinerary description..."
                        value={dayItem.description}
                        onChange={(e) => updateItinerary(i, "description", e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <div className="drawer-footer">
                  <button type="button" className="button button-outline" onClick={() => setFormModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="button button-primary" disabled={submitting}>
                    {submitting ? "Saving to Database..." : editingPackage ? "Update Package" : "Publish Package"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PREVIEW MODAL */}
        {previewPackage && (
          <div className="admin-drawer-modal-backdrop" onClick={() => setPreviewPackage(null)}>
            <div className="admin-preview-modal" onClick={(e) => e.stopPropagation()}>
              <div className="preview-modal-top">
                <span className="admin-eyebrow">TRAVELER EXPERIENCE PREVIEW</span>
                <h2>{previewPackage.name}</h2>
                <button type="button" className="drawer-close-btn" onClick={() => setPreviewPackage(null)}>
                  <X size={20} />
                </button>
              </div>
              <div className="preview-modal-body">
                <p><strong>Tagline:</strong> {previewPackage.tagline}</p>
                <p><strong>Tier:</strong> {previewPackage.tier?.toUpperCase()} | <strong>Duration:</strong> {previewPackage.durationDays}D / {previewPackage.durationNights}N</p>
                <p><strong>Price:</strong> ₹{Number(previewPackage.pricePerPerson).toLocaleString("en-IN")}/person</p>
                <h4>Inclusions</h4>
                <ul>
                  {Array.isArray(previewPackage.inclusions) && previewPackage.inclusions.map((inc, i) => <li key={i}>{inc}</li>)}
                </ul>
                <h4>Itinerary</h4>
                {Array.isArray(previewPackage.itinerary) && previewPackage.itinerary.map((it, i) => (
                  <div key={i} style={{ marginBottom: "8px" }}>
                    <strong>Day {it.day}: {it.title}</strong>
                    <p style={{ margin: "2px 0", fontSize: "0.85rem", color: "#475569" }}>{it.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DELETE CONFIRM MODAL */}
        {deleteModalPackage && (
          <div className="admin-drawer-modal-backdrop" onClick={() => setDeleteModalPackage(null)}>
            <div className="admin-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <AlertCircle size={36} color="#ef4444" />
              <h3>Confirm Package Removal</h3>
              <p>
                Are you sure you want to remove <strong>{deleteModalPackage.name}</strong>?
                If there are historical bookings attached, the package will be safely archived to preserve customer records.
              </p>
              <div className="confirm-modal-buttons">
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setDeleteModalPackage(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="button button-primary"
                  style={{ background: "#ef4444", borderColor: "#ef4444", color: "#ffffff" }}
                  onClick={handleDeletePackage}
                  disabled={deleting}
                >
                  {deleting ? "Processing..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
