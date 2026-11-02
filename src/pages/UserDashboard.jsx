import { useCallback, useEffect, useMemo, useState, lazy, Suspense } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Compass,
  Heart,
  House,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  NotebookPen,
  RefreshCw,
  Sparkles,
  Wallet,
  X,
  XCircle,
  Clock,
  Users,
  Copy,
  Check,
  Eye,
  ShieldCheck,
  MessageSquare,
  Printer,
  UserRound,
  Lock,
  Key,
  Hotel,
  AlertCircle,
  CreditCard,
  Download
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { destinations as staticDestinations } from "../data/destinations.js";
import {
  getOrSelectSessionFeaturedDestination,
  formatFeaturedDestination
} from "../utils/featuredDestination.js";
import { getDestinations } from "../api/destinations.js";
import { getMyBookings, getMyStats, cancelMyBooking } from "../api/bookings.js";
import { createPaymentOrder, verifyPayment } from "../api/payments.js";
import { loadRazorpayScript } from "../utils/loadRazorpay.js";
import { updateProfile, changePassword } from "../api/auth.js";
import { subscribeToBookingEvents } from "../utils/socket.js";
import TravelVoucherModal from "../components/TravelVoucherModal.jsx";
import BookedPackageDetailsModal from "../components/BookedPackageDetailsModal.jsx";
import { generatePassPdf } from "../utils/generatePassPdf.js";
import "./UserDashboard.css";

// Embedded dashboard views lazy-loaded on demand
const Discover = lazy(() => import("./Discover.jsx"));
const Planner = lazy(() => import("./Planner.jsx"));
const Wishlist = lazy(() => import("./Wishlist.jsx"));
const Reviews = lazy(() => import("./Reviews.jsx"));
const Stories = lazy(() => import("./Stories.jsx"));

const moods = [
  { name: "Adventure", emoji: "🏔️", description: "Mountains and thrilling escapes" },
  { name: "Relaxation", emoji: "🌊", description: "Beaches and peaceful stays" },
  { name: "Nature", emoji: "🌿", description: "Forests and scenic landscapes" },
  { name: "Culture", emoji: "🏛️", description: "History, heritage and local life" },
  { name: "Romance", emoji: "🌅", description: "Beautiful places for two" },
  { name: "Budget", emoji: "🎒", description: "Memorable trips for less" }
];

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

function calculateNights(start, end) {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  const diff = e - s;
  return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
}

export default function UserDashboard({ savedCount = 0, savedIds = [], onToggleSave }) {
  const { user, token, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Supported views inside the User Dashboard
  const validViews = useMemo(() => [
    "trips",
    "reservations",
    "destinations",
    "planner",
    "wishlist",
    "reviews",
    "notes",
    "profile",
    "preferences"
  ], []);

  const requestedView = searchParams.get("view");
  const initialView = requestedView && validViews.includes(requestedView) ? requestedView : "trips";
  const [dashboardView, setDashboardViewState] = useState(initialView);

  const setDashboardView = useCallback((nextView) => {
    setDashboardViewState(nextView);
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      if (nextView === "trips") {
        updated.delete("view");
      } else {
        updated.set("view", nextView);
      }
      return updated;
    }, { replace: true });
  }, [setSearchParams]);

  // Synchronize state when URL query changes (e.g. back/forward navigation)
  useEffect(() => {
    const v = searchParams.get("view");
    if (v && validViews.includes(v)) {
      setDashboardViewState(v);
    } else if (!v) {
      setDashboardViewState("trips");
    }
  }, [searchParams, validViews]);

  // Responsive mobile detector (<= 900px)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth <= 900;
    }
    return false;
  });

  // Drawer state (open on desktop by default, closed on mobile)
  const [drawerOpen, setDrawerOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth > 900;
    }
    return true;
  });

  // Modal dialog states
  const [detailsModalBooking, setDetailsModalBooking] = useState(null);
  const [voucherBooking, setVoucherBooking] = useState(null);
  const [packageDetailsBooking, setPackageDetailsBooking] = useState(null);

  // Handle resize and Escape key
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 900);
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        if (packageDetailsBooking) {
          setPackageDetailsBooking(null);
        } else if (detailsModalBooking) {
          setDetailsModalBooking(null);
        } else if (voucherBooking) {
          setVoucherBooking(null);
        } else if (drawerOpen && window.innerWidth <= 900) {
          setDrawerOpen(false);
        }
      }
    }
    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawerOpen, detailsModalBooking, voucherBooking, packageDetailsBooking]);

  // Profile form state
  const [firstName, setFirstName] = useState(user?.firstName || user?.first_name || user?.name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(user?.lastName || user?.last_name || user?.name?.split(" ").slice(1).join(" ") || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [travelPreferences, setTravelPreferences] = useState(
    Array.isArray(user?.travelPreferences) ? user.travelPreferences : []
  );
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const AVAILABLE_PREFERENCES = [
    "Nature & Mountains",
    "Beaches",
    "Adventure",
    "Historical Places",
    "Wildlife",
    "City Exploration"
  ];

  function togglePreference(pref) {
    setTravelPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess("");
    setProfileError("");
    try {
      const updated = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        travelPreferences
      });
      if (typeof updateUser === "function") {
        updateUser(updated);
      }
      setProfileSuccess("Personal profile updated successfully!");
      setTimeout(() => setProfileSuccess(""), 4000);
    } catch (err) {
      setProfileError(err.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  }

  // Travel preferences save state & handler
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefSuccess, setPrefSuccess] = useState("");
  const [prefError, setPrefError] = useState("");

  async function handleSavePreferences(e) {
    if (e && e.preventDefault) e.preventDefault();
    setPrefSaving(true);
    setPrefSuccess("");
    setPrefError("");
    try {
      const updated = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        travelPreferences
      });
      if (typeof updateUser === "function") {
        updateUser(updated);
      }
      setPrefSuccess("Your travel preferences have been saved!");
      setTimeout(() => setPrefSuccess(""), 4000);
    } catch (err) {
      setPrefError(err.message || "Failed to save travel preferences.");
    } finally {
      setPrefSaving(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordSuccess("");
    setPasswordError("");

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setPasswordSuccess("Your password was updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(""), 4000);
    } catch (err) {
      setPasswordError(err.message || "Failed to change password.");
    } finally {
      setPasswordSaving(false);
    }
  }

  // Booking data states
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    rejected: 0,
    cancelled: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [copiedRef, setCopiedRef] = useState(null);
  const [payingBookingId, setPayingBookingId] = useState(null);
  const [paymentErrorNotice, setPaymentErrorNotice] = useState("");

  // Budget Calculator state
  const [selectedMood, setSelectedMood] = useState("Nature");
  const [budget, setBudget] = useState("15000");
  const [travellers, setTravellers] = useState("2");
  const [days, setDays] = useState("4");
  const [budgetResult, setBudgetResult] = useState(false);

  // Dynamic Featured Destination
  const [featuredDestination, setFeaturedDestination] = useState(() =>
    getOrSelectSessionFeaturedDestination(staticDestinations)
  );

  useEffect(() => {
    let isMounted = true;
    async function syncRemoteDestinations() {
      try {
        const response = await getDestinations();
        const remoteList = Array.isArray(response)
          ? response
          : response?.data || response?.destinations || [];

        if (isMounted && remoteList.length > 0) {
          setFeaturedDestination((current) => {
            const match = remoteList.find(
              (d) =>
                String(d.id || d._id).toLowerCase() ===
                String(current?.id).toLowerCase()
            );
            if (match) {
              return formatFeaturedDestination({
                ...match,
                id: match.id || match._id
              });
            }
            return current;
          });
        }
      } catch {
        // Fallback to static
      }
    }

    syncRemoteDestinations();
    return () => {
      isMounted = false;
    };
  }, []);

  const [localSavedIds, setLocalSavedIds] = useState(() => {
    try {
      const raw = localStorage.getItem("roamly-wishlist");
      return raw ? JSON.parse(raw) : (Array.isArray(savedIds) ? savedIds : []);
    } catch {
      return Array.isArray(savedIds) ? savedIds : [];
    }
  });

  const effectiveSavedIds = useMemo(() => {
    if (Array.isArray(savedIds) && savedIds.length > 0) return savedIds;
    return localSavedIds;
  }, [savedIds, localSavedIds]);

  const handleToggleSave = useCallback((id) => {
    if (onToggleSave) {
      onToggleSave(id);
    }
    setLocalSavedIds((prev) => {
      const exists = prev.includes(id);
      const updated = exists ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem("roamly-wishlist", JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to update localStorage wishlist:", err);
      }
      return updated;
    });
  }, [onToggleSave]);

  const localWishlistCount = useMemo(() => {
    if (effectiveSavedIds && effectiveSavedIds.length > 0) {
      return effectiveSavedIds.length;
    }
    try {
      const raw = localStorage.getItem("roamly-wishlist");
      return raw ? JSON.parse(raw).length : savedCount;
    } catch {
      return savedCount;
    }
  }, [effectiveSavedIds, savedCount]);

  const displayName =
    user?.firstName ||
    user?.name ||
    user?.first_name ||
    "Traveller";

  const userInitial = (displayName.charAt(0) || "T").toUpperCase();

  const viewMeta = useMemo(() => {
    switch (dashboardView) {
      case "destinations":
        return {
          breadcrumb: "Traveler / Explore Destinations",
          title: "Explore Curated Destinations",
          subtitle: "Browse boutique stays, emotional mood collections, and all-inclusive packages."
        };
      case "planner":
        return {
          breadcrumb: "Traveler / Trip Planner",
          title: "Smart Trip Planner & Itinerary Builder",
          subtitle: "Design your personalized multi-day route, adjust pace, and export your itinerary."
        };
      case "wishlist":
        return {
          breadcrumb: "Traveler / Saved Escapes",
          title: `Saved Escapes (${localWishlistCount})`,
          subtitle: "Your personal bucket list of handpicked destinations and retreat spots."
        };
      case "reviews":
        return {
          breadcrumb: "Traveler / Travel Reviews",
          title: "Travel Reviews & Community Stories",
          subtitle: "Authentic feedback, trip photos, and verified experiences from fellow explorers."
        };
      case "notes":
        return {
          breadcrumb: "Traveler / Travel Notes",
          title: "Travel Notes & Field Stories",
          subtitle: "Editorial guides, hidden routes, and contemplative travel insights."
        };
      case "profile":
        return {
          breadcrumb: "Traveler / Account Profile",
          title: "Profile & Account Security",
          subtitle: "Manage your personal contact details, security credentials, and identity."
        };
      case "preferences":
        return {
          breadcrumb: "Traveler / Travel Preferences",
          title: "Travel Style & Preferences",
          subtitle: "Customize your preferred travel moods, companion count, and pace."
        };
      case "reservations":
        return {
          breadcrumb: "Traveler / Confirmed Reservations",
          title: `My Reservations (${stats.total || bookings.length})`,
          subtitle: "Track booking statuses, download travel vouchers, and manage payments."
        };
      case "trips":
      default:
        return {
          breadcrumb: "Traveler / My Dashboard",
          title: `Welcome back, ${displayName}.`,
          subtitle: "Your personal hub for real-time bookings, curated escapes, and concierge trip updates."
        };
    }
  }, [dashboardView, displayName, localWishlistCount, stats.total, bookings.length]);

  // Load bookings and real stats from backend
  const loadBookings = useCallback(async (isSilent = false) => {
    if (!token) {
      setBookings([]);
      setLoading(false);
      setError("Please log in to view your trips.");
      return;
    }

    if (!isSilent) setLoading(true);
    setError("");

    try {
      const [bookingsRes, statsRes] = await Promise.all([
        getMyBookings(),
        getMyStats()
      ]);

      const rows = Array.isArray(bookingsRes)
        ? bookingsRes
        : bookingsRes?.bookings || [];

      setBookings(rows);

      if (statsRes) {
        setStats({
          total: Number(statsRes.total) || 0,
          pending: Number(statsRes.pending) || 0,
          confirmed: Number(statsRes.confirmed) || 0,
          rejected: Number(statsRes.rejected) || 0,
          cancelled: Number(statsRes.cancelled) || 0
        });
      }
    } catch (err) {
      console.error("Load user bookings error:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Could not connect to Roamly. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Real-time updates via Socket.IO
  useEffect(() => {
    const unsubscribe = subscribeToBookingEvents({
      onBookingCreated: () => {
        loadBookings(true);
      },
      onBookingUpdated: (payload) => {
        setNotice(payload.message || "Your trip booking status has been updated!");
        loadBookings(true);
      }
    });

    // Fallback periodic poll every 20s
    const pollInterval = setInterval(() => {
      loadBookings(true);
    }, 20000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [loadBookings]);

  // Auto clear notice after 5 seconds
  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(""), 5000);
      return () => clearTimeout(t);
    }
  }, [notice]);

  // Smoothly scroll active dashboard view tab into view (ensures Preferences is never clipped)
  useEffect(() => {
    const activeTab = document.querySelector(".dashboard-view-tabs .dashboard-view-tab.active");
    if (activeTab && typeof activeTab.scrollIntoView === "function") {
      activeTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  }, [dashboardView]);

  // Cancel booking handler
  async function handleCancelBooking(bookingId) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this trip request? This will mark the booking as cancelled."
    );

    if (!confirmed) return;

    setCancellingId(bookingId);
    setError("");

    try {
      await cancelMyBooking(bookingId);
      setNotice("Booking request cancelled successfully.");
      await loadBookings(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Booking cancellation failed.";
      setError(msg);
    } finally {
      setCancellingId(null);
    }
  }

  // Razorpay payment handler (Test Mode)
  async function handlePayBooking(b) {
    if (!b?.id) return;
    setPayingBookingId(b.id);
    setPaymentErrorNotice("");

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Unable to load Razorpay Checkout SDK. Please check your internet connection.");
      }

      const orderData = await createPaymentOrder(b.id);
      if (!orderData?.success || !orderData?.orderId) {
        throw new Error(orderData?.message || "Failed to initiate payment order.");
      }

      const { keyId, orderId, amount, currency } = orderData;

      const options = {
        key: keyId,
        amount: amount,
        currency: currency || "INR",
        name: "Roamly — Travel by Mood",
        description: `Booking #${b.bookingReference || b.booking_reference || b.id} - ${b.destinationName || "Destination"}`,
        image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=256&q=80",
        order_id: orderId,
        prefill: {
          name: b.contactName || user?.name || "",
          email: b.contactEmail || user?.email || "",
          contact: b.contactPhone || user?.phone || ""
        },
        notes: {
          bookingId: String(b.id),
          bookingReference: String(b.bookingReference || b.booking_reference || b.id)
        },
        theme: {
          color: "#1b4332"
        },
        modal: {
          ondismiss: function () {
            setPayingBookingId(null);
          }
        },
        handler: async function (response) {
          try {
            const verifyResult = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: b.id
            });

            if (verifyResult?.success) {
              const confirmedBooking = {
                ...b,
                status: "confirmed",
                paymentStatus: "paid",
                paymentId: response.razorpay_payment_id
              };

              setNotice(`Payment of ₹${(amount / 100).toLocaleString("en-IN")} successful for booking ${b.bookingReference || b.id}! Confirmed via Razorpay Test Mode.`);
              setTimeout(() => setNotice(""), 6000);
              await loadBookings(true);

              if (detailsModalBooking && detailsModalBooking.id === b.id) {
                setDetailsModalBooking(confirmedBooking);
              }

              // Automatically pop open the Travel Pass modal with Download and Print actions!
              setVoucherBooking(confirmedBooking);
            } else {
              setPaymentErrorNotice(verifyResult?.message || "Payment verification failed.");
            }
          } catch (err) {
            console.error("Payment verification error:", err);
            setPaymentErrorNotice(err.response?.data?.message || err.message || "Payment verification failed.");
          } finally {
            setPayingBookingId(null);
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on("payment.failed", function (response) {
        console.warn("Razorpay payment failed:", response.error);
        setPayingBookingId(null);
        setPaymentErrorNotice(response.error?.description || "Payment failed. Please try again.");
      });

      razorpayInstance.open();
    } catch (err) {
      console.error("Razorpay initiation error:", err);
      setPaymentErrorNotice(err.response?.data?.message || err.message || "Could not open payment window.");
      setPayingBookingId(null);
    }
  }

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  function handleCopy(ref) {
    if (!ref) return;
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2500);
  }

  // Filter bookings list
  const filteredBookings = useMemo(() => {
    if (activeFilter === "pending") {
      return bookings.filter((b) => b.status === "pending");
    }
    if (activeFilter === "confirmed") {
      return bookings.filter((b) => b.status === "confirmed");
    }
    if (activeFilter === "other") {
      return bookings.filter((b) => ["rejected", "cancelled"].includes(b.status));
    }
    return bookings;
  }, [bookings, activeFilter]);

  const totalBudget = Number(budget) || 0;
  const numberOfTravellers = Math.max(1, Number(travellers) || 1);
  const numberOfDays = Math.max(1, Number(days) || 1);

  const perPerson = totalBudget / numberOfTravellers;
  const perDay = totalBudget / numberOfDays;

  return (
    <main className={`admin-page user-dashboard-page ${drawerOpen ? "drawer-open" : "drawer-closed"}`}>
      {/* MOBILE / TABLET BACKDROP (ONLY ON MOBILE SCREENS <= 900px) */}
      {isMobile && drawerOpen && (
        <div
          className="dashboard-drawer-backdrop"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* UNIFIED GREEN SIDEBAR DRAWER */}
      <aside className={`admin-sidebar user-sidebar ${drawerOpen ? "drawer-open" : "drawer-closed"}`}>
        <div className="admin-brand-wrap">
          <Link to="/" className="admin-brand" title="Return to Roamly Home">
            <Compass size={27} />
            <span>
              roamly<span className="brand-dot">.</span>
            </span>
          </Link>

          <button
            type="button"
            className="sidebar-drawer-close-btn"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation drawer"
            title="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        <p className="admin-sidebar-label">MY TRAVEL SPACE</p>

        <nav className="user-sidebar-nav" aria-label="Dashboard navigation">
          {/* 1. MY TRIPS */}
          <button
            type="button"
            className={`admin-side-link ${dashboardView === "trips" ? "active" : ""}`}
            onClick={() => {
              setDashboardView("trips");
              if (window.innerWidth < 1024) setDrawerOpen(false);
            }}
          >
            <Compass size={19} />
            <span>My Trips</span>
            {stats.total > 0 && <span className="admin-side-badge">{stats.total}</span>}
          </button>

          {/* 2. RESERVATIONS */}
          <button
            type="button"
            className={`admin-side-link ${dashboardView === "reservations" ? "active" : ""}`}
            onClick={() => {
              setDashboardView("reservations");
              if (window.innerWidth < 1024) setDrawerOpen(false);
            }}
          >
            <CalendarDays size={19} />
            <span>Reservations</span>
            {stats.total > 0 && <span className="admin-side-badge">{stats.total}</span>}
          </button>

          {/* 3. PROFILE */}
          <button
            type="button"
            className={`admin-side-link ${dashboardView === "profile" ? "active" : ""}`}
            onClick={() => {
              setDashboardView("profile");
              if (window.innerWidth < 1024) setDrawerOpen(false);
            }}
          >
            <UserRound size={19} />
            <span>Profile</span>
          </button>

          {/* 4. TRAVEL PREFERENCES */}
          <button
            type="button"
            className={`admin-side-link ${dashboardView === "preferences" ? "active" : ""}`}
            onClick={() => {
              setDashboardView("preferences");
              if (window.innerWidth < 1024) setDrawerOpen(false);
            }}
          >
            <Sparkles size={19} />
            <span>Travel Preferences</span>
          </button>

          <div className="admin-side-divider" />

          <button
            type="button"
            className={`admin-side-link ${dashboardView === "destinations" ? "active" : ""}`}
            onClick={() => {
              setDashboardView("destinations");
              if (window.innerWidth < 1024) setDrawerOpen(false);
            }}
          >
            <Compass size={19} />
            <span>Explore Destinations</span>
          </button>

          <button
            type="button"
            className={`admin-side-link ${dashboardView === "planner" ? "active" : ""}`}
            onClick={() => {
              setDashboardView("planner");
              if (window.innerWidth < 1024) setDrawerOpen(false);
            }}
          >
            <Calendar size={19} />
            <span>Trip Planner</span>
          </button>

          <button
            type="button"
            className={`admin-side-link ${dashboardView === "wishlist" ? "active" : ""}`}
            onClick={() => {
              setDashboardView("wishlist");
              if (window.innerWidth < 1024) setDrawerOpen(false);
            }}
          >
            <Heart size={19} />
            <span>Saved Escapes</span>
            {localWishlistCount > 0 && (
              <span className="admin-side-badge">{localWishlistCount}</span>
            )}
          </button>

          <button
            type="button"
            className={`admin-side-link ${dashboardView === "reviews" ? "active" : ""}`}
            onClick={() => {
              setDashboardView("reviews");
              if (window.innerWidth < 1024) setDrawerOpen(false);
            }}
          >
            <Clock3 size={19} />
            <span>Travel Reviews</span>
          </button>

          <button
            type="button"
            className={`admin-side-link ${dashboardView === "notes" ? "active" : ""}`}
            onClick={() => {
              setDashboardView("notes");
              if (window.innerWidth < 1024) setDrawerOpen(false);
            }}
          >
            <NotebookPen size={19} />
            <span>Travel Notes</span>
          </button>

          <div className="admin-side-divider" />

          <Link
            to="/"
            className="admin-side-link admin-side-link-site"
            onClick={() => { if (window.innerWidth < 1024) setDrawerOpen(false); }}
          >
            <House size={19} />
            <span>Public Website</span>
          </Link>
        </nav>

        <div className="admin-profile">
          <div className="admin-avatar">
            {userInitial}
          </div>

          <div className="admin-profile-info">
            <strong>{displayName}</strong>
            <span>Roamly Traveler</span>
          </div>
        </div>

        <button
          type="button"
          className="admin-logout"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          <span>Sign out</span>
        </button>
      </aside>

      {/* UNIFIED MAIN CONTENT AREA */}
      <section className="admin-main user-main">
        {/* MOBILE TOP BAR TOGGLE */}
        <div className="user-mobile-bar">
          <Link to="/" className="user-mobile-brand">
            <Compass size={22} />
            <span>roamly<span className="brand-dot">.</span></span>
          </Link>

          <button
            type="button"
            className="user-mobile-toggle"
            onClick={() => setDrawerOpen((prev) => !prev)}
            aria-label="Toggle navigation drawer"
          >
            <Menu size={22} />
            <span>Menu</span>
          </button>
        </div>

        {/* TOPBAR */}
        <header className="admin-topbar">
          <div className="admin-topbar-header-row">
            <button
              type="button"
              className="dashboard-drawer-toggle-btn"
              onClick={() => setDrawerOpen((prev) => !prev)}
              aria-label={drawerOpen ? "Collapse sidebar drawer" : "Open sidebar drawer"}
              title={drawerOpen ? "Collapse sidebar" : "Open sidebar"}
            >
              <Menu size={20} />
            </button>

            <div>
              <span className="admin-breadcrumb">
                {viewMeta.breadcrumb}
              </span>
              <h1>{viewMeta.title}</h1>
              <p>{viewMeta.subtitle}</p>
            </div>
          </div>

          <div className="admin-topbar-actions">
            <button
              type="button"
              className={`admin-primary-button ${dashboardView === "destinations" ? "active" : ""}`}
              onClick={() => setDashboardView("destinations")}
            >
              <Compass size={18} />
              Explore destinations
            </button>

            <button
              type="button"
              className={`admin-secondary-button ${dashboardView === "planner" ? "active" : ""}`}
              onClick={() => setDashboardView("planner")}
            >
              <CalendarDays size={18} />
              Plan a trip
            </button>
          </div>
        </header>

        {/* VIEW NAVIGATION TABS */}
        <div className="dashboard-view-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={dashboardView === "trips"}
            className={`dashboard-view-tab ${dashboardView === "trips" ? "active" : ""}`}
            onClick={() => setDashboardView("trips")}
          >
            <Compass size={16} />
            <span>My Trips ({stats.total || bookings.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={dashboardView === "reservations"}
            className={`dashboard-view-tab ${dashboardView === "reservations" ? "active" : ""}`}
            onClick={() => setDashboardView("reservations")}
          >
            <CalendarDays size={16} />
            <span>Reservations ({stats.total || bookings.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={dashboardView === "destinations"}
            className={`dashboard-view-tab ${dashboardView === "destinations" ? "active" : ""}`}
            onClick={() => setDashboardView("destinations")}
          >
            <Compass size={16} />
            <span>Destinations</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={dashboardView === "planner"}
            className={`dashboard-view-tab ${dashboardView === "planner" ? "active" : ""}`}
            onClick={() => setDashboardView("planner")}
          >
            <Calendar size={16} />
            <span>Trip Planner</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={dashboardView === "wishlist"}
            className={`dashboard-view-tab ${dashboardView === "wishlist" ? "active" : ""}`}
            onClick={() => setDashboardView("wishlist")}
          >
            <Heart size={16} />
            <span>Saved ({localWishlistCount})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={dashboardView === "reviews"}
            className={`dashboard-view-tab ${dashboardView === "reviews" ? "active" : ""}`}
            onClick={() => setDashboardView("reviews")}
          >
            <Clock3 size={16} />
            <span>Reviews</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={dashboardView === "notes"}
            className={`dashboard-view-tab ${dashboardView === "notes" ? "active" : ""}`}
            onClick={() => setDashboardView("notes")}
          >
            <NotebookPen size={16} />
            <span>Notes</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={dashboardView === "profile"}
            className={`dashboard-view-tab ${dashboardView === "profile" ? "active" : ""}`}
            onClick={() => setDashboardView("profile")}
          >
            <UserRound size={16} />
            <span>Profile</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={dashboardView === "preferences"}
            className={`dashboard-view-tab ${dashboardView === "preferences" ? "active" : ""}`}
            onClick={() => setDashboardView("preferences")}
          >
            <Sparkles size={16} />
            <span>Preferences</span>
          </button>
        </div>

        {/* PROFILE & SECURITY MANAGEMENT VIEW */}
        {dashboardView === "profile" && (
          <div className="dashboard-profile-view">
            {profileSuccess && (
              <div className="admin-notice" role="status">
                <CheckCircle2 size={18} />
                <span>{profileSuccess}</span>
              </div>
            )}
            {profileError && (
              <div className="admin-error" role="alert">
                <XCircle size={18} />
                <span>{profileError}</span>
              </div>
            )}
            {passwordSuccess && (
              <div className="admin-notice" role="status">
                <CheckCircle2 size={18} />
                <span>{passwordSuccess}</span>
              </div>
            )}
            {passwordError && (
              <div className="admin-error" role="alert">
                <XCircle size={18} />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="dashboard-profile-grid">
              {/* Profile Details Card */}
              <div className="dashboard-profile-card">
                <h3>Personal Information</h3>
                <p className="card-subtext">Manage your name, contact phone number, and verified email address.</p>

                <form onSubmit={handleProfileSubmit}>
                  <div className="dashboard-form-row">
                    <div className="dashboard-form-group">
                      <label htmlFor="user-first-name">First Name *</label>
                      <input
                        id="user-first-name"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First Name"
                        required
                      />
                    </div>
                    <div className="dashboard-form-group">
                      <label htmlFor="user-last-name">Last Name</label>
                      <input
                        id="user-last-name"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last Name"
                      />
                    </div>
                  </div>

                  <div className="dashboard-form-group">
                    <label htmlFor="user-email-readonly">Email Address</label>
                    <input
                      id="user-email-readonly"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      title="Email is managed by account administrator"
                    />
                  </div>

                  <div className="dashboard-form-group">
                    <label htmlFor="user-phone">Phone / WhatsApp</label>
                    <input
                      id="user-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <button
                    type="submit"
                    className="dashboard-save-btn"
                    disabled={profileSaving}
                  >
                    <CheckCircle2 size={16} />
                    <span>{profileSaving ? "Saving Changes..." : "Save Profile Changes"}</span>
                  </button>
                </form>
              </div>

              {/* Password & Security Card */}
              <div className="dashboard-profile-card">
                <h3>Account Security</h3>
                <p className="card-subtext">Update your account password to keep your bookings and itineraries secure.</p>

                <form onSubmit={handlePasswordSubmit}>
                  <div className="dashboard-form-group">
                    <label htmlFor="user-current-pw">Current Password *</label>
                    <input
                      id="user-current-pw"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="dashboard-form-group">
                    <label htmlFor="user-new-pw">New Password (min 8 chars) *</label>
                    <input
                      id="user-new-pw"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="dashboard-form-group">
                    <label htmlFor="user-confirm-pw">Confirm New Password *</label>
                    <input
                      id="user-confirm-pw"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="dashboard-save-btn"
                    disabled={passwordSaving}
                  >
                    <Lock size={16} />
                    <span>{passwordSaving ? "Updating Password..." : "Update Password"}</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TRAVEL PREFERENCES VIEW */}
        {dashboardView === "preferences" && (
          <div className="dashboard-preferences-view">
            {prefSuccess && (
              <div className="admin-notice" role="status">
                <CheckCircle2 size={18} />
                <span>{prefSuccess}</span>
              </div>
            )}
            {prefError && (
              <div className="admin-error" role="alert">
                <XCircle size={18} />
                <span>{prefError}</span>
              </div>
            )}

            <div className="dashboard-profile-card" style={{ marginBottom: "28px" }}>
              <div className="admin-table-heading" style={{ padding: "0 0 16px 0", borderBottom: "1px solid #e5e7eb", marginBottom: "20px" }}>
                <div>
                  <span className="admin-eyebrow">YOUR TRAVEL VIBES</span>
                  <h2>Travel Preferences & Moods</h2>
                  <p>Select your favorite travel styles, terrain vibes, and experiences so we can tailor recommendations to your mood.</p>
                </div>
              </div>

              <form onSubmit={handleSavePreferences}>
                <div className="dashboard-form-group">
                  <label>Selected Preferences</label>
                  <div className="dashboard-chips-wrap">
                    {AVAILABLE_PREFERENCES.map((pref) => {
                      const active = travelPreferences.includes(pref);
                      return (
                        <button
                          key={pref}
                          type="button"
                          className={`dashboard-pref-chip ${active ? "active" : ""}`}
                          onClick={() => togglePreference(pref)}
                        >
                          {active ? "✓ " : "+ "}{pref}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="dashboard-save-btn"
                  disabled={prefSaving}
                  style={{ marginTop: "16px" }}
                >
                  <CheckCircle2 size={16} />
                  <span>{prefSaving ? "Saving Preferences..." : "Save Travel Preferences"}</span>
                </button>
              </form>
            </div>

            {/* MOOD DISCOVERY CARD */}
            <article className="admin-table-card">
              <div className="admin-table-heading">
                <div>
                  <span className="admin-eyebrow">FIND YOUR FEELING</span>
                  <h2>Where is your mood taking you?</h2>
                  <p>Choose a mood to explore handpicked destinations that match your travel mindset.</p>
                </div>
              </div>

              <div className="dashboard-mood-grid">
                {moods.map((mood) => (
                  <button
                    type="button"
                    key={mood.name}
                    className={`dashboard-mood-card ${
                      selectedMood === mood.name ? "selected" : ""
                    }`}
                    onClick={() => setSelectedMood(mood.name)}
                  >
                    <span className="dashboard-mood-emoji">
                      {mood.emoji}
                    </span>
                    <strong>{mood.name}</strong>
                    <span>{mood.description}</span>
                  </button>
                ))}
              </div>

              <div className="dashboard-mood-result">
                <div>
                  <strong>Your selected mood: {selectedMood}</strong>
                  <p>Explore places and filter your results to find the perfect escape for this vibe.</p>
                </div>

                <Link
                  to={`/discover?mood=${encodeURIComponent(
                    selectedMood.toLowerCase()
                  )}`}
                  className="admin-primary-button"
                >
                  <span>Explore {selectedMood} Escapes</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </article>

            {/* TRIP BUDGET CALCULATOR CARD */}
            <article className="admin-form-card">
              <div className="admin-form-heading">
                <div>
                  <span className="admin-eyebrow">TRAVEL SMARTER</span>
                  <h2>Trip budget calculator</h2>
                  <p>Estimate your trip costs and share breakdown projections.</p>
                </div>
              </div>

              <div className="dashboard-budget-card">
                <div className="dashboard-budget-form">
                  <label>
                    Total trip budget (₹)
                    <input
                      type="number"
                      min="0"
                      value={budget}
                      onChange={(event) => {
                        setBudget(event.target.value);
                        setBudgetResult(false);
                      }}
                      placeholder="15000"
                    />
                  </label>

                  <label>
                    Number of travellers
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={travellers}
                      onChange={(event) => {
                        setTravellers(event.target.value);
                        setBudgetResult(false);
                      }}
                    />
                  </label>

                  <label>
                    Number of days
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={days}
                      onChange={(event) => {
                        setDays(event.target.value);
                        setBudgetResult(false);
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    className="admin-primary-button"
                    onClick={() => setBudgetResult(true)}
                    style={{ alignSelf: "flex-end" }}
                  >
                    <Wallet size={17} />
                    Calculate budget
                  </button>
                </div>

                {budgetResult && (
                  <div className="dashboard-budget-results">
                    <span className="budget-results-title">Estimated budget breakdown</span>
                    <div className="budget-results-grid">
                      <div className="budget-result-item">
                        <small>Per traveller</small>
                        <strong>
                          ₹{perPerson.toLocaleString("en-IN", {
                            maximumFractionDigits: 2
                          })}
                        </strong>
                      </div>
                      <div className="budget-result-item">
                        <small>Per day, group total</small>
                        <strong>
                          ₹{perDay.toLocaleString("en-IN", {
                            maximumFractionDigits: 2
                          })}
                        </strong>
                      </div>
                    </div>
                    <p className="budget-results-disclaimer">
                      This estimate provides guidance for budgeting and does not constitute a guaranteed quote for lodging, transit, or activities.
                    </p>
                  </div>
                )}
              </div>
            </article>

            {/* QUICK ACCESS USER FEATURES HUB */}
            <div className="dashboard-feature-grid">
              <Link to="/planner" className="dashboard-feature-card">
                <div className="feature-card-icon-wrap">
                  <CalendarDays size={24} />
                </div>
                <h3>Smart trip planner</h3>
                <p>Build custom day-by-day itineraries and organize dates.</p>
                <span className="feature-card-link">
                  Plan your trip <ArrowRight size={15} />
                </span>
              </Link>

              <Link to="/wishlist" className="dashboard-feature-card">
                <div className="feature-card-icon-wrap">
                  <Heart size={24} />
                </div>
                <h3>Saved destinations</h3>
                <p>Access your favorite dream locations and quick bookmarks.</p>
                <span className="feature-card-link">
                  View wishlist ({localWishlistCount}) <ArrowRight size={15} />
                </span>
              </Link>

              <Link to="/reviews" className="dashboard-feature-card">
                <div className="feature-card-icon-wrap">
                  <Clock3 size={24} />
                </div>
                <h3>Travel reviews</h3>
                <p>Share personal travel logs and discover verified stories.</p>
                <span className="feature-card-link">
                  Explore reviews <ArrowRight size={15} />
                </span>
              </Link>
            </div>
          </div>
        )}

        {dashboardView === "trips" && (
          <div className="dashboard-trips-view">
        {notice && (
          <div className="admin-notice" role="status">
            <Sparkles size={18} />
            <span>{notice}</span>
          </div>
        )}

        {error && (
          <div className="admin-error" role="alert">
            <XCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {paymentErrorNotice && (
          <div className="admin-error" role="alert">
            <AlertCircle size={18} />
            <span>{paymentErrorNotice}</span>
          </div>
        )}

        {/* FEATURED ESCAPE BANNER */}
        <article
          className="dashboard-scenic-banner"
          role="region"
          aria-label={`Featured scenic escape — ${featuredDestination?.title || featuredDestination?.name || "Roamly Destination"}`}
        >
          <div className="dashboard-visual-media-wrap">
            <img
              src={featuredDestination?.image}
              alt={`${featuredDestination?.name || "Scenic destination"} panoramic view`}
              className="dashboard-scenic-image"
              loading="eager"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src =
                  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=85";
              }}
            />
            <div className="dashboard-visual-gradient-overlay" />
          </div>

          <div className="dashboard-visual-badge-top">
            <Sparkles size={13} />
            <span>{featuredDestination?.badge || "Featured Escape"}</span>
          </div>

          <div className="dashboard-visual-card-bottom">
            <div className="dashboard-visual-location">
              <MapPin size={16} />
              <div>
                <strong>{featuredDestination?.title || featuredDestination?.name}</strong>
                <span>{featuredDestination?.subtitle || featuredDestination?.description}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDashboardView("destinations")}
              className="dashboard-visual-explore-link"
              aria-label={`Explore ${featuredDestination?.name || "destination"} guide`}
            >
              <span>Explore Guide</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </article>

        {/* 100% DATABASE-BACKED BOOKING STATISTICS */}
        <div className="admin-stat-grid">
          <article className="admin-stat-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Total Trips</span>
              <div className="admin-stat-icon-wrap stat-icon-neutral">
                <CalendarDays size={15} />
              </div>
            </div>
            <strong className="admin-stat-value">{stats.total}</strong>
            <small className="admin-stat-desc">Submitted bookings</small>
          </article>

          <article className="admin-stat-card stat-pending-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Pending Requests</span>
              <div className="admin-stat-icon-wrap stat-icon-amber">
                <Clock size={15} />
              </div>
            </div>
            <strong className="admin-stat-value stat-val-amber">{stats.pending}</strong>
            <small className="admin-stat-desc">Awaiting review</small>
          </article>

          <article className="admin-stat-card stat-confirmed-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Confirmed Trips</span>
              <div className="admin-stat-icon-wrap stat-icon-green">
                <CheckCircle2 size={15} />
              </div>
            </div>
            <strong className="admin-stat-value stat-val-green">{stats.confirmed}</strong>
            <small className="admin-stat-desc">Approved by concierge</small>
          </article>

          <article className="admin-stat-card stat-rejected-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Declined / Cancelled</span>
              <div className="admin-stat-icon-wrap stat-icon-red">
                <XCircle size={15} />
              </div>
            </div>
            <strong className="admin-stat-value">{stats.rejected + stats.cancelled}</strong>
            <small className="admin-stat-desc">Rejected or withdrawn</small>
          </article>
        </div>

        {/* MY TRIPS & BOOKINGS SECTION */}
        <article className="admin-table-card user-bookings-card">
          <div className="admin-table-heading">
            <div>
              <span className="admin-eyebrow">YOUR TRAVEL PLANS</span>
              <h2>My trips & reservations</h2>
              <p>Real-time booking requests backed by the Roamly reservation database.</p>
            </div>

            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => loadBookings(false)}
              disabled={loading}
              title="Refresh from MySQL"
            >
              <RefreshCw
                size={15}
                className={loading ? "admin-spinning" : ""}
              />
              <span>Refresh</span>
            </button>
          </div>

          {/* FILTER TABS */}
          <div className="user-bookings-filter-bar">
            <div className="user-filter-tabs">
              <button
                type="button"
                className={`user-filter-btn ${activeFilter === "all" ? "active" : ""}`}
                onClick={() => setActiveFilter("all")}
              >
                All Trips ({stats.total})
              </button>
              <button
                type="button"
                className={`user-filter-btn ${activeFilter === "pending" ? "active" : ""}`}
                onClick={() => setActiveFilter("pending")}
              >
                Pending ({stats.pending})
              </button>
              <button
                type="button"
                className={`user-filter-btn ${activeFilter === "confirmed" ? "active" : ""}`}
                onClick={() => setActiveFilter("confirmed")}
              >
                Confirmed ({stats.confirmed})
              </button>
              <button
                type="button"
                className={`user-filter-btn ${activeFilter === "other" ? "active" : ""}`}
                onClick={() => setActiveFilter("other")}
              >
                Cancelled / Rejected ({stats.rejected + stats.cancelled})
              </button>
            </div>
          </div>

          {/* CONTENT: LOADING / EMPTY / BOOKING CARDS */}
          {loading ? (
            <div className="dashboard-empty-state">
              <RefreshCw size={28} className="admin-spinning" />
              <h3>Retrieving your bookings...</h3>
              <p>Fetching authenticated trip reservations from Roamly database.</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="dashboard-empty-state">
              <span className="dashboard-empty-icon">
                <MapPin size={30} />
              </span>
              <h3>
                {activeFilter === "all"
                  ? "You haven't requested any trips yet"
                  : `No ${activeFilter} trips found`}
              </h3>
              <p>
                {activeFilter === "all"
                  ? "Browse our curated escapes, choose your travel vibe, and submit your first concierge trip request."
                  : "Check back later or explore other trips in your history."}
              </p>
              <button
                type="button"
                onClick={() => setDashboardView("destinations")}
                className="admin-primary-button"
                style={{ marginTop: "12px" }}
              >
                <Compass size={17} />
                Find your destination
              </button>
            </div>
          ) : (
            <div className="user-trip-cards-grid">
              {filteredBookings.map((b) => {
                const isPending = b.status === "pending";
                const isConfirmed = b.status === "confirmed";
                const isRejected = b.status === "rejected";
                const isCancelled = b.status === "cancelled";
                const nights = calculateNights(b.startDate, b.endDate);
                const bookingRef = b.bookingReference || b.booking_reference || `RMY-${b.id}`;
                const destTitle = b.destinationName || b.destination_name_snapshot || "Roamly Destination";
                const destLoc = b.destinationState || b.destinationCountry || "India";
                const budgetVal = Number(b.estimatedBudget || b.estimatedTotal || 0);

                return (
                  <div key={b.id} className={`user-trip-card status-${b.status}`}>
                    {/* CARD HEADER WITH IMAGE & BADGES */}
                    <div
                      className="user-trip-media"
                      style={{
                        backgroundImage: `linear-gradient(180deg, rgba(18,29,25,0.2) 0%, rgba(18,29,25,0.85) 100%), url("${b.destinationImage || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80'}")`
                      }}
                    >
                      <div className="user-trip-media-top">
                        {/* REFERENCE CODE */}
                        <button
                          type="button"
                          className="ref-pill"
                          onClick={() => handleCopy(bookingRef)}
                          title="Click to copy booking reference"
                        >
                          <code>{bookingRef}</code>
                          {copiedRef === bookingRef ? (
                            <Check size={12} color="#10b981" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>

                        {(b.bookingType === "hotel" || b.hotelName) && (
                          <span className="status-pill" style={{ background: "#ede9fe", color: "#5b21b6", fontWeight: 700 }}>
                            🏨 Boutique Stay
                          </span>
                        )}

                        {/* STATUS BADGE */}
                        <span className={`status-pill status-${b.status}`}>
                          {isPending && <span className="status-pulse-dot" />}
                          {isPending && "Pending Approval"}
                          {isConfirmed && "Confirmed Trip"}
                          {isRejected && "Request Declined"}
                          {isCancelled && "Cancelled"}
                        </span>

                        {/* PAYMENT STATUS BADGE */}
                        {b.paymentStatus === "paid" ? (
                          <span
                            className="status-pill status-confirmed"
                            style={{
                              background: "#dcfce7",
                              color: "#166534",
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <ShieldCheck size={12} /> Paid
                          </span>
                        ) : (
                          <span
                            className="status-pill"
                            style={{
                              background: "#fef3c7",
                              color: "#92400e",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <Clock size={12} /> Payment Pending
                          </span>
                        )}
                      </div>

                      <div className="user-trip-media-bottom">
                        <h3>{destTitle}</h3>
                        <p>
                          <MapPin size={13} /> {destLoc}
                        </p>
                      </div>
                    </div>

                    {/* CONFIRMED CELEBRATION CALLOUT */}
                    {isConfirmed && (
                      <div className="trip-confirmed-callout">
                        <CheckCircle2 size={18} className="confirmed-icon" />
                        <div>
                          <strong>Trip Confirmed by Roamly Concierge!</strong>
                          <span>
                            Approved {formatDateTime(b.confirmedAt)}
                            {b.confirmedByName ? ` by ${b.confirmedByName}` : ""}.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* REJECTION CALLOUT */}
                    {isRejected && b.rejectionReason && (
                      <div className="trip-rejected-callout">
                        <AlertCircle size={16} />
                        <div>
                          <strong>Declined with note:</strong>
                          <p>{b.rejectionReason}</p>
                        </div>
                      </div>
                    )}

                    {/* TRIP METADATA DETAILS */}
                    <div className="user-trip-body">
                      <div className="user-trip-facts">
                        {(b.bookingType === "hotel" || b.hotelName) && (
                          <>
                            <div className="trip-fact-item">
                              <Hotel size={15} />
                              <div>
                                <small>Room & Suite</small>
                                <strong>{b.roomType || "Standard Room"}</strong>
                                <span className="nights-sub">({b.roomsCount || 1} Room{b.roomsCount > 1 ? "s" : ""})</span>
                              </div>
                            </div>
                            <div className="trip-fact-item" style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "8px", padding: "6px 10px" }}>
                              <Key size={15} color="#059669" />
                              <div>
                                <small style={{ color: "#065f46", fontWeight: 600 }}>Room Number</small>
                                <strong style={{ color: "#047857", fontSize: "14px" }}>
                                  {b.roomNumber || "Assigned on Check-in"}
                                </strong>
                              </div>
                            </div>
                          </>
                        )}
                        <div className="trip-fact-item">
                          <Calendar size={15} />
                          <div>
                            <small>Travel Dates</small>
                            <strong>{formatDate(b.startDate)} — {formatDate(b.endDate)}</strong>
                            <span className="nights-sub">({nights} nights)</span>
                          </div>
                        </div>

                        <div className="trip-fact-item">
                          <Users size={15} />
                          <div>
                            <small>Party Size</small>
                            <strong>{b.travellers || 1} {Number(b.travellers) === 1 ? "Traveler" : "Travelers"}</strong>
                          </div>
                        </div>

                        {budgetVal > 0 && (
                          <div className="trip-fact-item">
                            <Wallet size={15} />
                            <div>
                              <small>Estimated Total</small>
                              <strong>₹{budgetVal.toLocaleString("en-IN")}</strong>
                            </div>
                          </div>
                        )}
                      </div>

                      {b.specialRequests && typeof b.specialRequests === "string" && (
                        <div className="trip-note-preview">
                          <MessageSquare size={13} />
                          <span>"{b.specialRequests.slice(0, 75)}{b.specialRequests.length > 75 ? "..." : ""}"</span>
                        </div>
                      )}
                    </div>

                    {/* CARD FOOTER ACTIONS */}
                    <div className="user-trip-footer">
                      <button
                        type="button"
                        className="button button-outline view-details-btn"
                        onClick={() => setDetailsModalBooking(b)}
                      >
                        <Eye size={15} /> View Details
                      </button>

                      <button
                        type="button"
                        className="button button-outline package-details-card-btn"
                        onClick={() => setPackageDetailsBooking(b)}
                        title="View Package Details, Inclusions & Itinerary"
                        style={{ borderColor: "#0284c7", color: "#0369a1", background: "#f0f9ff", display: "inline-flex", alignItems: "center", gap: "6px" }}
                      >
                        <Sparkles size={14} /> View Package Details
                      </button>

                      <button
                        type="button"
                        className="button button-outline voucher-card-btn"
                        onClick={() => setVoucherBooking(b)}
                        title="View & Print Official Roamly Travel Voucher"
                        style={{ borderColor: "#bbf7d0", color: "#166534", background: "#f0fdf4" }}
                      >
                        <Printer size={15} /> Travel Pass
                      </button>

                      {b.paymentStatus === "paid" && (
                        <button
                          type="button"
                          className="button button-outline voucher-card-btn"
                          onClick={() => generatePassPdf(b)}
                          title="Download Official Roamly Travel Pass PDF"
                          style={{ borderColor: "#bbf7d0", color: "#166534", background: "#f0fdf4" }}
                        >
                          <Download size={14} /> Download Pass
                        </button>
                      )}

                      {b.paymentStatus !== "paid" && b.status !== "cancelled" && b.status !== "rejected" && (
                        <button
                          type="button"
                          className="button button-primary pay-now-btn"
                          style={{
                            background: "#1b4332",
                            color: "#ffffff",
                            padding: "8px 14px",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            border: "none",
                            borderRadius: "8px",
                            cursor: payingBookingId === b.id ? "not-allowed" : "pointer"
                          }}
                          onClick={() => handlePayBooking(b)}
                          disabled={payingBookingId === b.id}
                        >
                          {payingBookingId === b.id ? (
                            <>
                              <Clock size={13} className="admin-spinning" /> Connecting...
                            </>
                          ) : (
                            <>
                              <CreditCard size={14} /> Pay Now
                            </>
                          )}
                        </button>
                      )}

                      {isPending && (
                        <button
                          type="button"
                          className="cancel-trip-btn"
                          onClick={() => handleCancelBooking(b.id)}
                          disabled={cancellingId === b.id}
                          title="Cancel this pending booking request"
                        >
                          {cancellingId === b.id ? (
                            <>
                              <Clock size={13} className="admin-spinning" /> Cancelling...
                            </>
                          ) : (
                            <>
                              <XCircle size={14} /> Cancel
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        {/* QUICK ACCESS USER FEATURES HUB FOR TRIPS */}
        <div className="dashboard-feature-grid">
          <button
            type="button"
            className="dashboard-feature-card"
            onClick={() => setDashboardView("planner")}
          >
            <div className="feature-card-icon-wrap">
              <CalendarDays size={24} />
            </div>
            <h3>Smart trip planner</h3>
            <p>Build custom day-by-day itineraries and organize dates.</p>
            <span className="feature-card-link">
              Plan your trip <ArrowRight size={15} />
            </span>
          </button>

          <button
            type="button"
            className="dashboard-feature-card"
            onClick={() => setDashboardView("wishlist")}
          >
            <div className="feature-card-icon-wrap">
              <Heart size={24} />
            </div>
            <h3>Saved destinations</h3>
            <p>Access your favorite dream locations and quick bookmarks.</p>
            <span className="feature-card-link">
              View wishlist ({localWishlistCount}) <ArrowRight size={15} />
            </span>
          </button>

          <button
            type="button"
            className="dashboard-feature-card"
            onClick={() => setDashboardView("reviews")}
          >
            <div className="feature-card-icon-wrap">
              <Clock3 size={24} />
            </div>
            <h3>Travel reviews</h3>
            <p>Share personal travel logs and discover verified stories.</p>
            <span className="feature-card-link">
              Explore reviews <ArrowRight size={15} />
            </span>
          </button>
        </div>
      </div>
    )}

    {/* RESERVATIONS VIEW */}
    {dashboardView === "reservations" && (
      <div className="dashboard-reservations-view">
        {notice && (
          <div className="admin-notice" role="status">
            <Sparkles size={18} />
            <span>{notice}</span>
          </div>
        )}

        {error && (
          <div className="admin-error" role="alert">
            <XCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {paymentErrorNotice && (
          <div className="admin-error" role="alert">
            <AlertCircle size={18} />
            <span>{paymentErrorNotice}</span>
          </div>
        )}

        {/* RESERVATION STATISTICS */}
        <div className="admin-stat-grid">
          <article className="admin-stat-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Total Reservations</span>
              <div className="admin-stat-icon-wrap stat-icon-neutral">
                <CalendarDays size={15} />
              </div>
            </div>
            <strong className="admin-stat-value">{stats.total}</strong>
            <small className="admin-stat-desc">All bookings on file</small>
          </article>

          <article className="admin-stat-card stat-pending-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Pending Approval</span>
              <div className="admin-stat-icon-wrap stat-icon-amber">
                <Clock size={15} />
              </div>
            </div>
            <strong className="admin-stat-value stat-val-amber">{stats.pending}</strong>
            <small className="admin-stat-desc">Under concierge review</small>
          </article>

          <article className="admin-stat-card stat-confirmed-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Confirmed Bookings</span>
              <div className="admin-stat-icon-wrap stat-icon-green">
                <CheckCircle2 size={15} />
              </div>
            </div>
            <strong className="admin-stat-value stat-val-green">{stats.confirmed}</strong>
            <small className="admin-stat-desc">Ready for travel</small>
          </article>

          <article className="admin-stat-card stat-rejected-card">
            <div className="admin-stat-title-row">
              <span className="admin-stat-label">Declined / Cancelled</span>
              <div className="admin-stat-icon-wrap stat-icon-red">
                <XCircle size={15} />
              </div>
            </div>
            <strong className="admin-stat-value">{stats.rejected + stats.cancelled}</strong>
            <small className="admin-stat-desc">Cancelled records</small>
          </article>
        </div>

        {/* RESERVATIONS & BOOKING RECORDS */}
        <article className="admin-table-card user-bookings-card">
          <div className="admin-table-heading">
            <div>
              <span className="admin-eyebrow">OFFICIAL BOOKINGS</span>
              <h2>My Reservations</h2>
              <p>Booking references, payment statuses, and official concierge confirmations.</p>
            </div>

            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => loadBookings(false)}
              disabled={loading}
              title="Refresh from Roamly database"
            >
              <RefreshCw
                size={15}
                className={loading ? "admin-spinning" : ""}
              />
              <span>Refresh</span>
            </button>
          </div>

          {/* FILTER TABS */}
          <div className="user-bookings-filter-bar">
            <div className="user-filter-tabs">
              <button
                type="button"
                className={`user-filter-btn ${activeFilter === "all" ? "active" : ""}`}
                onClick={() => setActiveFilter("all")}
              >
                All Reservations ({stats.total})
              </button>
              <button
                type="button"
                className={`user-filter-btn ${activeFilter === "pending" ? "active" : ""}`}
                onClick={() => setActiveFilter("pending")}
              >
                Pending ({stats.pending})
              </button>
              <button
                type="button"
                className={`user-filter-btn ${activeFilter === "confirmed" ? "active" : ""}`}
                onClick={() => setActiveFilter("confirmed")}
              >
                Confirmed ({stats.confirmed})
              </button>
              <button
                type="button"
                className={`user-filter-btn ${activeFilter === "other" ? "active" : ""}`}
                onClick={() => setActiveFilter("other")}
              >
                Cancelled / Rejected ({stats.rejected + stats.cancelled})
              </button>
            </div>
          </div>

          {/* CONTENT: LOADING / EMPTY / RESERVATION CARDS */}
          {loading ? (
            <div className="dashboard-empty-state">
              <RefreshCw size={28} className="admin-spinning" />
              <h3>Retrieving your reservations...</h3>
              <p>Fetching authenticated reservation records from Roamly database.</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="dashboard-empty-state">
              <span className="dashboard-empty-icon">
                <CalendarDays size={30} />
              </span>
              <h3>
                {activeFilter === "all"
                  ? "No reservations found"
                  : `No ${activeFilter} reservations found`}
              </h3>
              <p>
                {activeFilter === "all"
                  ? "You do not have any active reservations yet. Explore handpicked escapes or book a boutique stay."
                  : "Check other filters or explore new destinations."}
              </p>
              <button
                type="button"
                onClick={() => setDashboardView("destinations")}
                className="admin-primary-button"
                style={{ marginTop: "12px" }}
              >
                <Compass size={17} />
                Explore destinations
              </button>
            </div>
          ) : (
            <div className="user-trip-cards-grid">
              {filteredBookings.map((b) => {
                const isPending = b.status === "pending";
                const isConfirmed = b.status === "confirmed";
                const isRejected = b.status === "rejected";
                const isCancelled = b.status === "cancelled";
                const nights = calculateNights(b.startDate, b.endDate);
                const bookingRef = b.bookingReference || b.booking_reference || `RMY-${b.id}`;
                const resName = b.hotelName || b.tourName || b.destinationName || b.destination_name_snapshot || "Roamly Reservation";
                const destLoc = b.destinationState || b.destinationCountry || "India";
                const totalAmount = Number(b.estimatedBudget || b.estimatedTotal || 0);

                return (
                  <div key={b.id} className={`user-trip-card status-${b.status}`}>
                    {/* CARD HEADER WITH IMAGE & BADGES */}
                    <div
                      className="user-trip-media"
                      style={{
                        backgroundImage: `linear-gradient(180deg, rgba(18,29,25,0.2) 0%, rgba(18,29,25,0.85) 100%), url("${b.destinationImage || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80'}")`
                      }}
                    >
                      <div className="user-trip-media-top">
                        <button
                          type="button"
                          className="ref-pill"
                          onClick={() => handleCopy(bookingRef)}
                          title="Click to copy booking reference"
                        >
                          <code>{bookingRef}</code>
                          {copiedRef === bookingRef ? (
                            <Check size={12} color="#10b981" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>

                        {/* RESERVATION STATUS BADGE */}
                        <span className={`status-pill status-${b.status}`}>
                          {isPending && <span className="status-pulse-dot" />}
                          {isPending && "Pending Approval"}
                          {isConfirmed && "Confirmed"}
                          {isRejected && "Declined"}
                          {isCancelled && "Cancelled"}
                        </span>

                        {/* PAYMENT STATUS BADGE */}
                        {b.paymentStatus === "paid" ? (
                          <span
                            className="status-pill status-confirmed"
                            style={{
                              background: "#dcfce7",
                              color: "#166534",
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <ShieldCheck size={12} /> Paid
                          </span>
                        ) : (
                          <span
                            className="status-pill"
                            style={{
                              background: "#fef3c7",
                              color: "#92400e",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <Clock size={12} /> Payment Pending
                          </span>
                        )}
                      </div>

                      <div className="user-trip-media-bottom">
                        <h3>{resName}</h3>
                        <p>
                          <MapPin size={13} /> {destLoc}
                        </p>
                      </div>
                    </div>

                    {/* CONFIRMED CALLOUT */}
                    {isConfirmed && (
                      <div className="trip-confirmed-callout">
                        <CheckCircle2 size={18} className="confirmed-icon" />
                        <div>
                          <strong>Reservation Confirmed</strong>
                          <span>
                            Verified {formatDateTime(b.confirmedAt)}
                            {b.confirmedByName ? ` by ${b.confirmedByName}` : ""}.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* REJECTION CALLOUT */}
                    {isRejected && b.rejectionReason && (
                      <div className="trip-rejected-callout">
                        <AlertCircle size={16} />
                        <div>
                          <strong>Reservation note:</strong>
                          <p>{b.rejectionReason}</p>
                        </div>
                      </div>
                    )}

                    {/* RESERVATION METADATA */}
                    <div className="user-trip-body">
                      <div className="user-trip-facts">
                        {(b.bookingType === "hotel" || b.hotelName) && (
                          <>
                            <div className="trip-fact-item">
                              <Hotel size={15} />
                              <div>
                                <small>Room & Suite</small>
                                <strong>{b.roomType || "Standard Suite"}</strong>
                                <span className="nights-sub">({b.roomsCount || 1} Room{b.roomsCount > 1 ? "s" : ""})</span>
                              </div>
                            </div>
                            <div className="trip-fact-item" style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "8px", padding: "6px 10px" }}>
                              <Key size={15} color="#059669" />
                              <div>
                                <small style={{ color: "#065f46", fontWeight: 600 }}>Room Number</small>
                                <strong style={{ color: "#047857", fontSize: "14px" }}>
                                  {b.roomNumber || "Assigned on Check-in"}
                                </strong>
                              </div>
                            </div>
                          </>
                        )}
                        <div className="trip-fact-item">
                          <Calendar size={15} />
                          <div>
                            <small>Reservation Dates</small>
                            <strong>{formatDate(b.startDate)} — {formatDate(b.endDate)}</strong>
                            <span className="nights-sub">({nights} nights)</span>
                          </div>
                        </div>

                        <div className="trip-fact-item">
                          <Users size={15} />
                          <div>
                            <small>Guest Count</small>
                            <strong>{b.travellers || 1} {Number(b.travellers) === 1 ? "Guest" : "Guests"}</strong>
                          </div>
                        </div>

                        {totalAmount > 0 && (
                          <div className="trip-fact-item">
                            <Wallet size={15} />
                            <div>
                              <small>Total Cost</small>
                              <strong>₹{totalAmount.toLocaleString("en-IN")}</strong>
                            </div>
                          </div>
                        )}
                      </div>

                      {b.specialRequests && typeof b.specialRequests === "string" && (
                        <div className="trip-note-preview">
                          <MessageSquare size={13} />
                          <span>"{b.specialRequests.slice(0, 75)}{b.specialRequests.length > 75 ? "..." : ""}"</span>
                        </div>
                      )}
                    </div>

                    {/* RESERVATION ACTIONS */}
                    <div className="user-trip-footer">
                      <button
                        type="button"
                        className="button button-outline view-details-btn"
                        onClick={() => setDetailsModalBooking(b)}
                      >
                        <Eye size={15} /> View Details
                      </button>

                      <button
                        type="button"
                        className="button button-outline package-details-card-btn"
                        onClick={() => setPackageDetailsBooking(b)}
                        title="View Package Details, Inclusions & Itinerary"
                        style={{ borderColor: "#0284c7", color: "#0369a1", background: "#f0f9ff", display: "inline-flex", alignItems: "center", gap: "6px" }}
                      >
                        <Sparkles size={14} /> View Package Details
                      </button>

                      <button
                        type="button"
                        className="button button-outline voucher-card-btn"
                        onClick={() => setVoucherBooking(b)}
                        title="View & Print Official Roamly Travel Voucher"
                        style={{ borderColor: "#bbf7d0", color: "#166534", background: "#f0fdf4" }}
                      >
                        <Printer size={15} /> Travel Pass
                      </button>

                      {b.paymentStatus === "paid" && (
                        <button
                          type="button"
                          className="button button-outline voucher-card-btn"
                          onClick={() => generatePassPdf(b)}
                          title="Download Official Roamly Travel Pass PDF"
                          style={{ borderColor: "#bbf7d0", color: "#166534", background: "#f0fdf4" }}
                        >
                          <Download size={14} /> Download Pass
                        </button>
                      )}

                      {/* Requirement 5: Display only "Pay Now" */}
                      {b.paymentStatus !== "paid" && b.status !== "cancelled" && b.status !== "rejected" && (
                        <button
                          type="button"
                          className="button button-primary pay-now-btn"
                          style={{
                            background: "#1b4332",
                            color: "#ffffff",
                            padding: "8px 14px",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            border: "none",
                            borderRadius: "8px",
                            cursor: payingBookingId === b.id ? "not-allowed" : "pointer"
                          }}
                          onClick={() => handlePayBooking(b)}
                          disabled={payingBookingId === b.id}
                        >
                          {payingBookingId === b.id ? (
                            <>
                              <Clock size={13} className="admin-spinning" /> Connecting...
                            </>
                          ) : (
                            <>
                              <CreditCard size={14} /> Pay Now
                            </>
                          )}
                        </button>
                      )}

                      {isPending && (
                        <button
                          type="button"
                          className="cancel-trip-btn"
                          onClick={() => handleCancelBooking(b.id)}
                          disabled={cancellingId === b.id}
                          title="Cancel this pending booking request"
                        >
                          {cancellingId === b.id ? (
                            <>
                              <Clock size={13} className="admin-spinning" /> Cancelling...
                            </>
                          ) : (
                            <>
                              <XCircle size={14} /> Cancel
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        {/* QUICK ACCESS USER FEATURES HUB FOR RESERVATIONS */}
        <div className="dashboard-feature-grid">
          <button
            type="button"
            className="dashboard-feature-card"
            onClick={() => setDashboardView("planner")}
          >
            <div className="feature-card-icon-wrap">
              <CalendarDays size={24} />
            </div>
            <h3>Smart trip planner</h3>
            <p>Build custom day-by-day itineraries and organize dates.</p>
            <span className="feature-card-link">
              Plan your trip <ArrowRight size={15} />
            </span>
          </button>

          <button
            type="button"
            className="dashboard-feature-card"
            onClick={() => setDashboardView("wishlist")}
          >
            <div className="feature-card-icon-wrap">
              <Heart size={24} />
            </div>
            <h3>Saved destinations</h3>
            <p>Access your favorite dream locations and quick bookmarks.</p>
            <span className="feature-card-link">
              View wishlist ({localWishlistCount}) <ArrowRight size={15} />
            </span>
          </button>

          <button
            type="button"
            className="dashboard-feature-card"
            onClick={() => setDashboardView("reviews")}
          >
            <div className="feature-card-icon-wrap">
              <Clock3 size={24} />
            </div>
            <h3>Travel reviews</h3>
            <p>Share personal travel logs and discover verified stories.</p>
            <span className="feature-card-link">
              Explore reviews <ArrowRight size={15} />
            </span>
          </button>
        </div>
      </div>
    )}

        {/* EMBEDDED DESTINATIONS DISCOVER VIEW */}
        {dashboardView === "destinations" && (
          <div className="dashboard-embedded-view">
            <Suspense fallback={
              <div className="dashboard-view-loading">
                <RefreshCw size={20} className="admin-spinning" />
                <span>Loading destination directory...</span>
              </div>
            }>
              <Discover
                savedIds={effectiveSavedIds}
                onToggleSave={handleToggleSave}
                hideHeroBanner={true}
                onBookingSuccess={(newBooking) => {
                  loadBookings(true);
                  setNotice("Your trip booking request has been submitted successfully!");
                  setTimeout(() => setNotice(""), 6000);
                  setDashboardView("trips");
                }}
              />
            </Suspense>
          </div>
        )}

        {/* EMBEDDED TRIP PLANNER VIEW */}
        {dashboardView === "planner" && (
          <div className="dashboard-embedded-view">
            <Suspense fallback={
              <div className="dashboard-view-loading">
                <RefreshCw size={20} className="admin-spinning" />
                <span>Loading trip planner...</span>
              </div>
            }>
              <Planner />
            </Suspense>
          </div>
        )}

        {/* EMBEDDED SAVED ESCAPES (WISHLIST) VIEW */}
        {dashboardView === "wishlist" && (
          <div className="dashboard-embedded-view">
            <Suspense fallback={
              <div className="dashboard-view-loading">
                <RefreshCw size={20} className="admin-spinning" />
                <span>Loading saved escapes...</span>
              </div>
            }>
              <Wishlist
                savedIds={effectiveSavedIds}
                onToggleSave={handleToggleSave}
                toggleSaved={handleToggleSave}
                onBookingSuccess={(newBooking) => {
                  loadBookings(true);
                  setNotice("Your trip booking request has been submitted successfully!");
                  setTimeout(() => setNotice(""), 6000);
                  setDashboardView("trips");
                }}
              />
            </Suspense>
          </div>
        )}

        {/* EMBEDDED TRAVEL REVIEWS VIEW */}
        {dashboardView === "reviews" && (
          <div className="dashboard-embedded-view">
            <Suspense fallback={
              <div className="dashboard-view-loading">
                <RefreshCw size={20} className="admin-spinning" />
                <span>Loading traveler reviews...</span>
              </div>
            }>
              <Reviews />
            </Suspense>
          </div>
        )}

        {/* EMBEDDED TRAVEL NOTES VIEW */}
        {dashboardView === "notes" && (
          <div className="dashboard-embedded-view">
            <Suspense fallback={
              <div className="dashboard-view-loading">
                <RefreshCw size={20} className="admin-spinning" />
                <span>Loading travel notes and field stories...</span>
              </div>
            }>
              <Stories />
            </Suspense>
          </div>
        )}

        {/* TRIP DETAILS MODAL */}
        {detailsModalBooking && (
          <div
            className="roamly-modal-backdrop"
            onClick={() => setDetailsModalBooking(null)}
            role="dialog"
          >
            <div
              className="roamly-booking-modal user-trip-detail-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="roamly-modal-close"
                onClick={() => setDetailsModalBooking(null)}
                aria-label="Close details"
              >
                <X size={20} />
              </button>

              <div className="modal-dossier-wrap">
                <div
                  className="modal-dossier-hero"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(18,29,25,0.4) 0%, rgba(18,29,25,0.9) 100%), url("${detailsModalBooking.destinationImage || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80'}")`
                  }}
                >
                  <span className="dest-banner-eyebrow">
                    <Compass size={14} /> ROAMLY TRIP RESERVATION
                  </span>
                  <h2>{detailsModalBooking.destinationName || detailsModalBooking.destination_name_snapshot || "Roamly Destination"}</h2>
                  <p>
                    <MapPin size={15} /> {detailsModalBooking.destinationState || detailsModalBooking.destinationCountry || "India"}
                  </p>
                </div>

                <div className="modal-dossier-content">
                  {/* STATUS & REF CODE */}
                  <div className="dossier-status-row">
                    <div>
                      <span className="dossier-label">Booking Reference</span>
                      <div className="dossier-code-wrap">
                        <code>{detailsModalBooking.bookingReference || detailsModalBooking.booking_reference || `RMY-${detailsModalBooking.id}`}</code>
                        <button
                          type="button"
                          className="copy-ref-btn-inline"
                          onClick={() => handleCopy(detailsModalBooking.bookingReference || detailsModalBooking.booking_reference || `RMY-${detailsModalBooking.id}`)}
                          title="Copy reference"
                        >
                          {copiedRef === (detailsModalBooking.bookingReference || detailsModalBooking.booking_reference) ? (
                            <Check size={14} color="#10b981" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="dossier-label">Current Status</span>
                      <span className={`status-pill status-${detailsModalBooking.status}`}>
                        {detailsModalBooking.status === "pending" && "Pending Approval"}
                        {detailsModalBooking.status === "confirmed" && "Trip Confirmed"}
                        {detailsModalBooking.status === "rejected" && "Request Declined"}
                        {detailsModalBooking.status === "cancelled" && "Cancelled"}
                      </span>
                    </div>

                    <div>
                      <span className="dossier-label">Payment Status</span>
                      <span
                        className="status-pill"
                        style={{
                          background: detailsModalBooking.paymentStatus === "paid" ? "#dcfce7" : "#fef3c7",
                          color: detailsModalBooking.paymentStatus === "paid" ? "#166534" : "#92400e",
                          fontWeight: 700
                        }}
                      >
                        {detailsModalBooking.paymentStatus === "paid"
                          ? `Paid (${detailsModalBooking.paymentId || "Confirmed"})`
                          : "Payment Pending"}
                      </span>
                    </div>
                  </div>

                  {/* CONFIRMED DETAILS */}
                  {detailsModalBooking.status === "confirmed" && (
                    <div className="trip-confirmed-callout large">
                      <CheckCircle2 size={22} className="confirmed-icon" />
                      <div>
                        <strong>Your reservation has been confirmed!</strong>
                        <p>
                          Confirmed by Roamly Concierge
                          {detailsModalBooking.confirmedByName ? ` (${detailsModalBooking.confirmedByName})` : ""} on{" "}
                          {formatDateTime(detailsModalBooking.confirmedAt)}. Our travel team is preparing your welcome pack.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* DETAILS GRID */}
                  <div className="dossier-grid">
                    {(detailsModalBooking.bookingType === "hotel" || detailsModalBooking.hotelName) && (
                      <>
                        <div className="dossier-item" style={{ gridColumn: "1 / -1", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: "8px" }}>
                          <span className="item-label" style={{ color: "#166534" }}>Boutique Stay & Property</span>
                          <strong style={{ color: "#166534", fontSize: "15px" }}>
                            🏨 {detailsModalBooking.hotelName} ({detailsModalBooking.hotelLocation || detailsModalBooking.destinationState})
                          </strong>
                        </div>
                        <div className="dossier-item">
                          <span className="item-label">Room & Suite</span>
                          <strong>{detailsModalBooking.roomType || "Standard Suite"} ({detailsModalBooking.roomsCount || 1} Room{detailsModalBooking.roomsCount > 1 ? "s" : ""})</strong>
                        </div>
                        <div className="dossier-item" style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "8px 12px", borderRadius: "8px" }}>
                          <span className="item-label" style={{ color: "#065f46" }}>Assigned Room Number</span>
                          <strong style={{ color: "#047857", fontSize: "15px" }}>
                            {detailsModalBooking.roomNumber || "Assigned on Arrival"}
                          </strong>
                        </div>
                      </>
                    )}
                    <div className="dossier-item">
                      <span className="item-label">Travel Start Date</span>
                      <strong>{formatDate(detailsModalBooking.startDate)}</strong>
                    </div>

                    <div className="dossier-item">
                      <span className="item-label">Travel End Date</span>
                      <strong>{formatDate(detailsModalBooking.endDate)}</strong>
                    </div>

                    <div className="dossier-item">
                      <span className="item-label">Stay Duration</span>
                      <span>{calculateNights(detailsModalBooking.startDate, detailsModalBooking.endDate)} Nights</span>
                    </div>

                    <div className="dossier-item">
                      <span className="item-label">Travelers</span>
                      <span>{detailsModalBooking.travellers || 1} Guest(s)</span>
                    </div>

                    <div className="dossier-item">
                      <span className="item-label">Contact Name</span>
                      <span>{detailsModalBooking.contactName || detailsModalBooking.userName}</span>
                    </div>

                    <div className="dossier-item">
                      <span className="item-label">Contact Email</span>
                      <span>{detailsModalBooking.contactEmail || detailsModalBooking.userEmail}</span>
                    </div>

                    <div className="dossier-item">
                      <span className="item-label">Contact Phone</span>
                      <span>{detailsModalBooking.contactPhone || "Not provided"}</span>
                    </div>

                    <div className="dossier-item">
                      <span className="item-label">Estimated Budget</span>
                      <strong>
                        {detailsModalBooking.estimatedBudget || detailsModalBooking.estimatedTotal
                          ? `₹${Number(detailsModalBooking.estimatedBudget || detailsModalBooking.estimatedTotal).toLocaleString("en-IN")}`
                          : "Illustrative estimate"}
                      </strong>
                    </div>
                  </div>

                  {/* SPECIAL REQUESTS */}
                  {detailsModalBooking.specialRequests && typeof detailsModalBooking.specialRequests === "string" && (
                    <div className="dossier-notes-section">
                      <span className="item-label">Special Requests & Travel Notes</span>
                      <p>{detailsModalBooking.specialRequests}</p>
                    </div>
                  )}

                  {/* REJECTION REASON */}
                  {detailsModalBooking.status === "rejected" && detailsModalBooking.rejectionReason && (
                    <div className="trip-rejected-callout">
                      <AlertCircle size={16} />
                      <div>
                        <strong>Reason for declination:</strong>
                        <p>{detailsModalBooking.rejectionReason}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="modal-dossier-footer">
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => setVoucherBooking(detailsModalBooking)}
                    style={{ color: "#166534", borderColor: "#bbf7d0", background: "#f0fdf4" }}
                  >
                    <Printer size={15} /> Print Travel Pass
                  </button>

                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => generatePassPdf(detailsModalBooking)}
                    style={{ color: "#166534", borderColor: "#bbf7d0", background: "#f0fdf4", display: "inline-flex", alignItems: "center", gap: "6px" }}
                    title="Download Official Roamly Travel Pass PDF"
                  >
                    <Download size={15} /> Download Pass
                  </button>

                  {detailsModalBooking.paymentStatus !== "paid" &&
                    detailsModalBooking.status !== "cancelled" &&
                    detailsModalBooking.status !== "rejected" && (
                      <button
                        type="button"
                        className="button button-primary"
                        style={{
                          background: "#1b4332",
                          color: "#ffffff",
                          padding: "8px 16px",
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                        onClick={() => handlePayBooking(detailsModalBooking)}
                        disabled={payingBookingId === detailsModalBooking.id}
                      >
                        {payingBookingId === detailsModalBooking.id ? (
                          <>
                            <Clock size={14} className="admin-spinning" /> Connecting...
                          </>
                        ) : (
                          <>
                            <CreditCard size={15} /> Pay Now
                          </>
                        )}
                      </button>
                    )}

                  {detailsModalBooking.status === "pending" && (
                    <button
                      type="button"
                      className="button button-outline"
                      onClick={() => {
                        handleCancelBooking(detailsModalBooking.id);
                        setDetailsModalBooking(null);
                      }}
                      style={{ color: "#ef4444", borderColor: "#fca5a5" }}
                    >
                      Cancel This Booking
                    </button>
                  )}
                  <button
                    type="button"
                    className="button button-dark"
                    onClick={() => setDetailsModalBooking(null)}
                  >
                    Close Dossier
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OFFICIAL ROAMLY TRAVEL VOUCHER / BOARDING PASS */}
        {voucherBooking && (
          <TravelVoucherModal
            booking={voucherBooking}
            onClose={() => setVoucherBooking(null)}
          />
        )}

        {/* IMMUTABLE TRAVEL PACKAGE DETAILS MODAL (Requirement 1) */}
        {packageDetailsBooking && (
          <BookedPackageDetailsModal
            booking={packageDetailsBooking}
            onClose={() => setPackageDetailsBooking(null)}
            onPayNow={handlePayBooking}
            onPrintPass={(b) => {
              setPackageDetailsBooking(null);
              setVoucherBooking(b);
            }}
          />
        )}
      </section>
    </main>
  );
}
