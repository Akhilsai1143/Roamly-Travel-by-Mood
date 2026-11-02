import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Handshake,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  MapPin,
  Bed,
  Car,
  Compass,
  Users,
  ShieldCheck,
  Menu,
  X,
  AlertCircle,
  Phone,
  Mail,
  FileText,
  DollarSign
} from "lucide-react";
import AdminSidebar from "../components/AdminSidebar.jsx";
import {
  getAllPartners,
  getPartnerById,
  createPartner,
  updatePartner,
  deletePartner
} from "../api/partners";
import { getDestinations } from "../api/destinations";
import "./UserDashboard.css";
import "./AdminPartners.css";

export default function AdminPartners() {
  const [partners, setPartners] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // Search & Filter
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mobile drawer
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 900);

  // Form modal (Create / Edit)
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // View Services Drawer
  const [servicesDrawerPartner, setServicesDrawerPartner] = useState(null);
  const [loadingServices, setLoadingServices] = useState(false);

  // Delete modal
  const [deleteModalPartner, setDeleteModalPartner] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    partnerCode: "",
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    serviceCategory: "hotel",
    destinationId: "",
    operatingArea: "",
    address: "",
    paymentTerms: "Net 30 days",
    status: "active",
    internalNotes: ""
  });

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 900);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [ptnsRes, destsRes] = await Promise.all([
        getAllPartners(),
        getDestinations()
      ]);
      setPartners(ptnsRes.partners || []);
      setDestinations(destsRes || []);
    } catch (err) {
      console.error("Failed to load partners data:", err);
      setError("Failed to load partner supplier records from database.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // KPIs
  const stats = useMemo(() => {
    const total = partners.length;
    const hotels = partners.filter((p) => p.serviceCategory === "hotel").length;
    const cabs = partners.filter((p) => p.serviceCategory === "cab").length;
    const guides = partners.filter((p) => p.serviceCategory === "guide").length;
    const operators = partners.filter((p) => p.serviceCategory === "tour_operator" || p.serviceCategory === "activity").length;
    return { total, hotels, cabs, guides, operators };
  }, [partners]);

  // Filtered List
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.contactPerson && p.contactPerson.toLowerCase().includes(search.toLowerCase())) ||
        (p.operatingArea && p.operatingArea.toLowerCase().includes(search.toLowerCase())) ||
        (p.partnerCode && p.partnerCode.toLowerCase().includes(search.toLowerCase()));

      const matchCat = categoryFilter === "all" || p.serviceCategory === categoryFilter;
      const matchStatus = statusFilter === "all" || p.status === statusFilter;

      return matchSearch && matchCat && matchStatus;
    });
  }, [partners, search, categoryFilter, statusFilter]);

  function handleOpenCreate() {
    setEditingPartner(null);
    setFormData({
      partnerCode: "",
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      serviceCategory: "hotel",
      destinationId: destinations[0]?.id || 1,
      operatingArea: "Kerala Backwaters & High Ranges",
      address: "",
      paymentTerms: "Net 30 days",
      status: "active",
      internalNotes: "Verified local supplier partner with signed SLA."
    });
    setFormModalOpen(true);
  }

  function handleOpenEdit(ptn) {
    setEditingPartner(ptn);
    setFormData({
      partnerCode: ptn.partnerCode || "",
      name: ptn.name || "",
      contactPerson: ptn.contactPerson || "",
      email: ptn.email || "",
      phone: ptn.phone || "",
      serviceCategory: ptn.serviceCategory || "hotel",
      destinationId: ptn.destinationId || "",
      operatingArea: ptn.operatingArea || "",
      address: ptn.address || "",
      paymentTerms: ptn.paymentTerms || "Net 30 days",
      status: ptn.status || "active",
      internalNotes: ptn.internalNotes || ""
    });
    setFormModalOpen(true);
  }

  async function handleOpenServicesDrawer(partnerId) {
    try {
      setLoadingServices(true);
      const res = await getPartnerById(partnerId);
      setServicesDrawerPartner(res.partner);
    } catch (err) {
      console.error("Failed to load partner services:", err);
      alert("Could not load partner services.");
    } finally {
      setLoadingServices(false);
    }
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingPartner) {
        await updatePartner(editingPartner.id, formData);
        setNotice("Partner updated successfully!");
      } else {
        await createPartner(formData);
        setNotice("New supplier partner registered successfully!");
      }
      setFormModalOpen(false);
      loadData();
      setTimeout(() => setNotice(""), 4000);
    } catch (err) {
      console.error("Save partner error:", err);
      alert(err.response?.data?.message || err.message || "Failed to save partner.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeletePartner() {
    if (!deleteModalPartner) return;
    setDeleting(true);
    try {
      const res = await deletePartner(deleteModalPartner.id);
      setNotice(res.message || "Partner updated.");
      setDeleteModalPartner(null);
      loadData();
      setTimeout(() => setNotice(""), 4000);
    } catch (err) {
      console.error("Delete partner error:", err);
      alert("Failed to delete partner.");
    } finally {
      setDeleting(false);
    }
  }

  const categoryBadges = {
    hotel: { label: "Accommodation", icon: Bed, bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
    cab: { label: "Cab & Chauffeur", icon: Car, bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe" },
    tour_operator: { label: "Tour Operator", icon: Compass, bg: "#faf5ff", color: "#6b21a8", border: "#e9d5ff" },
    guide: { label: "Native Guide", icon: Users, bg: "#fffbeb", color: "#92400e", border: "#fde68a" },
    activity: { label: "Activity Provider", icon: Sparkles, bg: "#fdf2f8", color: "#9d174d", border: "#fbcfe8" }
  };

  return (
    <main className={`admin-page admin-partners-page ${drawerOpen ? "drawer-open" : "drawer-closed"}`}>
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
                Workspace / Supply Chain
              </span>
              <h1>Partner & Supplier Management</h1>
              <p>
                Manage contracted hotels, fleets, guides, and activity operators with linked service costs.
              </p>
            </div>
          </div>

          <div className="admin-topbar-actions">
            <button
              type="button"
              className="admin-secondary-button"
              onClick={loadData}
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
              <span>Add New Partner</span>
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

        {/* STATS */}
        <div className="admin-stat-grid">
          <article className="admin-stat-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Total Suppliers</span>
              <div className="admin-stat-icon-wrap stat-icon-neutral">
                <Handshake size={15} />
              </div>
            </div>
            <strong className="admin-stat-value">{stats.total}</strong>
            <small className="admin-stat-desc">Contracted suppliers</small>
          </article>

          <article className="admin-stat-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Hotels & Stays</span>
              <div className="admin-stat-icon-wrap stat-icon-green">
                <Bed size={15} />
              </div>
            </div>
            <strong className="admin-stat-value stat-val-green">{stats.hotels}</strong>
            <small className="admin-stat-desc">Resorts & villas</small>
          </article>

          <article className="admin-stat-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Cab & Chauffeurs</span>
              <div className="admin-stat-icon-wrap stat-icon-amber">
                <Car size={15} />
              </div>
            </div>
            <strong className="admin-stat-value stat-val-amber">{stats.cabs}</strong>
            <small className="admin-stat-desc">Fleets & transfers</small>
          </article>

          <article className="admin-stat-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Guides & Activators</span>
              <div className="admin-stat-icon-wrap" style={{ background: "#faf5ff", color: "#6b21a8" }}>
                <Users size={15} />
              </div>
            </div>
            <strong className="admin-stat-value" style={{ color: "#6b21a8" }}>{stats.guides + stats.operators}</strong>
            <small className="admin-stat-desc">Storytellers & ecotours</small>
          </article>
        </div>

        {/* PARTNER DIRECTORY TABLE */}
        <article className="admin-table-card">
          <div className="admin-table-heading">
            <div>
              <span className="admin-eyebrow">SUPPLIER DIRECTORY</span>
              <h2>Registered Hospitality & Logistics Partners</h2>
              <p>Manage commercial contracts, agreed wholesale rates, and service allocations.</p>
            </div>
          </div>

          {/* SEARCH & FILTERS */}
          <div className="admin-controls-bar">
            <div className="admin-search-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search by company name, contact person, or operating area..."
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
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="all">All Service Categories</option>
                <option value="hotel">Hotels & Resorts</option>
                <option value="cab">Cabs & Chauffeurs</option>
                <option value="tour_operator">Tour Operators</option>
                <option value="guide">Native Guides</option>
                <option value="activity">Activities</option>
              </select>
            </div>

            <div className="admin-select-wrap">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* TABLE */}
          {loading ? (
            <div className="admin-loading-row">
              <RefreshCw size={24} className="admin-spinning" />
              <span>Loading supplier partners from MySQL...</span>
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="dashboard-empty-state">
              <Handshake size={34} />
              <h3>No partners found</h3>
              <p>Adjust your search filters or click "Add New Partner" to register a supplier.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table partners-table">
                <thead>
                  <tr>
                    <th>Partner Code & Name</th>
                    <th>Category</th>
                    <th>Primary Contact</th>
                    <th>Operating Area</th>
                    <th>Payment Terms</th>
                    <th>Linked Packages</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartners.map((ptn) => {
                    const badge = categoryBadges[ptn.serviceCategory] || categoryBadges.hotel;
                    const BadgeIcon = badge.icon;

                    return (
                      <tr key={ptn.id}>
                        <td>
                          <div className="admin-pkg-cell">
                            <code>{ptn.partnerCode}</code>
                            <strong>{ptn.name}</strong>
                          </div>
                        </td>
                        <td>
                          <span
                            className="partner-category-pill"
                            style={{
                              background: badge.bg,
                              color: badge.color,
                              borderColor: badge.border
                            }}
                          >
                            <BadgeIcon size={12} /> {badge.label}
                          </span>
                        </td>
                        <td>
                          <div className="admin-contact-cell">
                            <strong>{ptn.contactPerson || "Primary Contact"}</strong>
                            <small>
                              <Phone size={11} /> {ptn.phone || "—"}
                            </small>
                            <small>
                              <Mail size={11} /> {ptn.email || "—"}
                            </small>
                          </div>
                        </td>
                        <td>
                          <div className="admin-dest-cell">
                            <MapPin size={13} />
                            <span>{ptn.operatingArea || ptn.destinationName || "Regional"}</span>
                          </div>
                        </td>
                        <td>
                          <span className="payment-terms-badge">{ptn.paymentTerms || "Net 30 days"}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="admin-services-link-btn"
                            onClick={() => handleOpenServicesDrawer(ptn.id)}
                            title="Click to view assigned package services"
                          >
                            <strong>{ptn.linkedPackagesCount || 0} packages</strong>
                            <small>({ptn.totalServicesCount || 0} services)</small>
                          </button>
                        </td>
                        <td>
                          <span className={`admin-status-pill status-${ptn.status}`}>
                            {ptn.status}
                          </span>
                        </td>
                        <td>
                          <div className="admin-row-actions">
                            <button
                              type="button"
                              className="admin-icon-action"
                              onClick={() => handleOpenServicesDrawer(ptn.id)}
                              title="View Contracted Services"
                            >
                              <FileText size={15} />
                            </button>
                            <button
                              type="button"
                              className="admin-icon-action"
                              onClick={() => handleOpenEdit(ptn)}
                              title="Edit Partner Profile"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              type="button"
                              className="admin-icon-action delete"
                              onClick={() => setDeleteModalPartner(ptn)}
                              title="Deactivate / Delete"
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

        {/* ADD / EDIT PARTNER MODAL */}
        {formModalOpen && (
          <div className="admin-drawer-modal-backdrop" onClick={() => setFormModalOpen(false)}>
            <div
              className="admin-partner-modal"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="drawer-header">
                <div>
                  <span className="admin-eyebrow">PARTNER REGISTRATION</span>
                  <h2>{editingPartner ? "Edit Partner Profile" : "Register New Supplier Partner"}</h2>
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
                <div className="drawer-form-grid">
                  <label>
                    Service Category *
                    <select
                      value={formData.serviceCategory}
                      onChange={(e) => setFormData({ ...formData, serviceCategory: e.target.value })}
                      required
                    >
                      <option value="hotel">Accommodation (Hotels, Resorts, Houseboats)</option>
                      <option value="cab">Transport (Cabs, Chauffeurs, Fleet)</option>
                      <option value="tour_operator">Tour Operator</option>
                      <option value="guide">Native Guide / Historian</option>
                      <option value="activity">Activities (Boating, Spas, Safari)</option>
                    </select>
                  </label>

                  <label>
                    Partner Code
                    <input
                      type="text"
                      placeholder="e.g. PTN-HTL-101 (Leave empty to auto-generate)"
                      value={formData.partnerCode}
                      onChange={(e) => setFormData({ ...formData, partnerCode: e.target.value })}
                    />
                  </label>

                  <label style={{ gridColumn: "span 2" }}>
                    Company / Vendor Name *
                    <input
                      type="text"
                      placeholder="e.g. Munnar Highland Heritage Resorts"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </label>

                  <label>
                    Contact Person Name
                    <input
                      type="text"
                      placeholder="e.g. Biju Varghese"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    />
                  </label>

                  <label>
                    Phone / Mobile
                    <input
                      type="text"
                      placeholder="e.g. +91 94471 23456"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </label>

                  <label style={{ gridColumn: "span 2" }}>
                    Email Address
                    <input
                      type="email"
                      placeholder="e.g. reservations@munnarheritage.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </label>

                  <label>
                    Base Destination Hub
                    <select
                      value={formData.destinationId}
                      onChange={(e) => setFormData({ ...formData, destinationId: e.target.value })}
                    >
                      <option value="">Regional (All Kerala / Multi-destination)</option>
                      {destinations.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.state || d.country})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Operating Area / Routes
                    <input
                      type="text"
                      placeholder="e.g. Kochi, Munnar, Alleppey, Thekkady"
                      value={formData.operatingArea}
                      onChange={(e) => setFormData({ ...formData, operatingArea: e.target.value })}
                    />
                  </label>

                  <label>
                    Payment Terms
                    <input
                      type="text"
                      placeholder="e.g. Net 30 days, 50% advance upon booking"
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    />
                  </label>

                  <label>
                    Status
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">Active (Available for Packages)</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>

                  <label style={{ gridColumn: "span 2" }}>
                    Internal Commercial Notes & SLA Terms
                    <textarea
                      rows="3"
                      placeholder="Internal notes on SLAs, discount thresholds, cancellation terms..."
                      value={formData.internalNotes}
                      onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                    />
                  </label>
                </div>

                <div className="drawer-footer">
                  <button type="button" className="button button-outline" onClick={() => setFormModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="button button-primary" disabled={submitting}>
                    {submitting ? "Saving..." : editingPartner ? "Update Partner" : "Register Partner"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SERVICES ASSIGNMENT DRAWER */}
        {servicesDrawerPartner && (
          <div className="admin-drawer-modal-backdrop" onClick={() => setServicesDrawerPartner(null)}>
            <div className="admin-partner-services-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-header">
                <div>
                  <span className="admin-eyebrow">CONTRACTED SERVICES</span>
                  <h2>{servicesDrawerPartner.name}</h2>
                  <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "0.85rem" }}>
                    Category: <strong>{servicesDrawerPartner.serviceCategory?.toUpperCase()}</strong> · Code: {servicesDrawerPartner.partnerCode}
                  </p>
                </div>
                <button
                  type="button"
                  className="drawer-close-btn"
                  onClick={() => setServicesDrawerPartner(null)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="drawer-body">
                <h3>Packages Utilizing this Supplier</h3>

                {servicesDrawerPartner.services && servicesDrawerPartner.services.length > 0 ? (
                  <div className="partner-services-cards-grid">
                    {servicesDrawerPartner.services.map((svc) => (
                      <div key={svc.id} className="ptn-service-card">
                        <div className="ptn-svc-top">
                          <span className={`admin-tier-badge tier-badge-${svc.packageTier}`}>
                            {svc.packageTier?.toUpperCase()}
                          </span>
                          <span className="ptn-svc-cost">
                            Supplier Cost: <strong>₹{Number(svc.costAmount).toLocaleString("en-IN")}</strong>
                            <small> ({svc.pricingBasis})</small>
                          </span>
                        </div>
                        <h4>{svc.serviceName}</h4>
                        <div className="ptn-svc-pkg-row">
                          <span style={{ fontSize: "0.84rem", color: "#475569" }}>
                            Package: <strong>{svc.packageName}</strong> ({svc.packageCode})
                          </span>
                          <span style={{ fontSize: "0.84rem", color: "#166534", fontWeight: 600 }}>
                            Selling: ₹{Number(svc.packageSellingPrice).toLocaleString("en-IN")}
                          </span>
                        </div>
                        {svc.notes && <p className="ptn-svc-notes">Note: {svc.notes}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#64748b" }}>This supplier is not currently linked to any active travel packages.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DELETE CONFIRM MODAL */}
        {deleteModalPartner && (
          <div className="admin-drawer-modal-backdrop" onClick={() => setDeleteModalPartner(null)}>
            <div className="admin-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <AlertCircle size={36} color="#ef4444" />
              <h3>Confirm Partner Status</h3>
              <p>
                Are you sure you want to deactivate or remove <strong>{deleteModalPartner.name}</strong>?
                If services are linked to live packages, this partner will be set to inactive to preserve financial margins.
              </p>
              <div className="confirm-modal-buttons">
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setDeleteModalPartner(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="button button-primary"
                  style={{ background: "#ef4444", borderColor: "#ef4444", color: "#ffffff" }}
                  onClick={handleDeletePartner}
                  disabled={deleting}
                >
                  {deleting ? "Processing..." : "Confirm Deactivate"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
