import { useState, useEffect, useRef, useCallback } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Compass,
  UserRound,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  Palmtree,
  Calendar,
  Sparkles,
  Star,
  Heart,
  Headphones,
  Phone,
  Hotel,
  Mountain,
  Waves,
  Landmark,
  Trees,
  BookOpen,
  MapPin,
  Flame,
  ArrowRight
} from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";
import NotificationCenter from "./NotificationCenter.jsx";
import QuickSearchModal from "./QuickSearchModal.jsx";

export default function Header({ wishlistCount = 0 }) {
  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Active hover/dropdown menu: null | 'destinations' | 'discover' | 'hotels' | 'planner' | 'stories' | 'support' | 'profile'
  const [activeMenu, setActiveMenu] = useState(null);

  // Quick command search palette modal
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Refs for debounced mouse leave and click outside
  const closeTimeoutRef = useRef(null);
  const isTouchDeviceRef = useRef(false);
  const headerRef = useRef(null);

  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isHomePage = location.pathname === "/";

  // Detect touch devices to avoid unexpected hover behaviors
  useEffect(() => {
    const checkTouch = () => {
      isTouchDeviceRef.current =
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia("(hover: none)").matches;
    };
    checkTouch();
    window.addEventListener("resize", checkTouch);
    return () => window.removeEventListener("resize", checkTouch);
  }, []);

  // Listen to scroll to toggle header styles
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close everything on route change
  useEffect(() => {
    setActiveMenu(null);
    setMobileDrawerOpen(false);
  }, [location.pathname, location.search]);

  // Global keyboard shortcuts:
  // - Cmd/Ctrl + K: quick search
  // - Escape: close any active dropdown or mobile drawer
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        if (activeMenu) {
          setActiveMenu(null);
        }
        if (mobileDrawerOpen) {
          setMobileDrawerOpen(false);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeMenu, mobileDrawerOpen]);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hover enter: cancel any pending close timer and immediately open menu
  const handleMouseEnter = useCallback((menuKey) => {
    if (isTouchDeviceRef.current) return;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setActiveMenu(menuKey);
  }, []);

  // Hover leave: set debounced timer (180ms) to allow smooth movement from navbar item to dropdown
  const handleMouseLeave = useCallback(() => {
    if (isTouchDeviceRef.current) return;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
      closeTimeoutRef.current = null;
    }, 180);
  }, []);

  // Tap / click handler for touch devices and keyboard interaction
  const handleMenuClick = useCallback((menuKey, e) => {
    // If mobile or clicked directly, toggle the active menu
    setActiveMenu((prev) => (prev === menuKey ? null : menuKey));
  }, []);

  // Accessible keyboard navigation on menu triggers
  const handleTriggerKeyDown = useCallback((menuKey, e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      setActiveMenu(menuKey);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setActiveMenu(null);
    }
  }, []);

  const closeAll = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setActiveMenu(null);
    setMobileDrawerOpen(false);
  }, []);

  function handleLogout() {
    logout();
    closeAll();
    navigate("/", { replace: true });
  }

  const dashboardPath = isAdmin ? "/admin/bookings" : "/user/dashboard";
  const displayName = user?.firstName || user?.name || user?.first_name || "Traveller";
  const userInitial = (displayName.charAt(0) || "U").toUpperCase();

  return (
    <>
      <header
        ref={headerRef}
        className={`site-header ${scrolled ? "header-scrolled" : "header-solid"
          }`}
      >
        <div className="header-inner">
          {/* 1. BRAND LOGO */}
          <Link to="/" className="brand" onClick={closeAll} aria-label="Roamly home">
            <span className="brand-mark">
              <Compass size={21} strokeWidth={2.4} />
            </span>
            <span className="brand-name-wrap">
              <span className="brand-text">
                roamly<span className="brand-dot">.</span>
              </span>
              <small className="brand-tag">TRAVEL BY MOOD</small>
            </span>
          </Link>

          {/* 2. DESKTOP MAIN NAVIGATION (HOVER-ENABLED) */}
          <nav className="header-category-tabs" aria-label="Main Navigation">
            {/* MENU 1: DESTINATIONS (MEGA HOVER MENU) */}
            <div
              className="header-nav-dropdown-wrap"
              onMouseEnter={() => handleMouseEnter("destinations")}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                className={`nav-dropdown-btn ${activeMenu === "destinations" ? "active" : ""}`}
                onClick={(e) => handleMenuClick("destinations", e)}
                onKeyDown={(e) => handleTriggerKeyDown("destinations", e)}
                aria-haspopup="true"
                aria-expanded={activeMenu === "destinations"}
                aria-controls="nav-dropdown-destinations"
              >
                <Palmtree size={16} className="cat-icon" />
                <span>Destinations</span>
                <ChevronDown
                  size={13}
                  className={`dropdown-chevron ${activeMenu === "destinations" ? "open" : ""}`}
                />
              </button>

              {activeMenu === "destinations" && (
                <div
                  id="nav-dropdown-destinations"
                  className="nav-dropdown-menu nav-mega-menu"
                  role="region"
                  aria-label="Destinations Submenu"
                  onMouseEnter={() => handleMouseEnter("destinations")}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="mega-menu-grid">
                    {/* Left Column: Regions */}
                    <div className="mega-col-links">
                      <div className="dropdown-menu-header">
                        <span>Explore by Region</span>
                      </div>

                      <Link
                        to="/discover?region=himalayas"
                        className="nav-dropdown-item"
                        onClick={closeAll}
                      >
                        <div className="nav-dropdown-icon-box">
                          <Mountain size={16} />
                        </div>
                        <div>
                          <strong>Himalayas & High Passes</strong>
                          <small>Ladakh, Spiti, Manali & Kashmir</small>
                        </div>
                      </Link>

                      <Link
                        to="/discover?region=south"
                        className="nav-dropdown-item"
                        onClick={closeAll}
                      >
                        <div className="nav-dropdown-icon-box">
                          <Trees size={16} />
                        </div>
                        <div>
                          <strong>Kerala & Western Ghats</strong>
                          <small>Munnar tea hills, backwaters & Coorg</small>
                        </div>
                      </Link>

                      <Link
                        to="/discover?region=heritage"
                        className="nav-dropdown-item"
                        onClick={closeAll}
                      >
                        <div className="nav-dropdown-icon-box">
                          <Landmark size={16} />
                        </div>
                        <div>
                          <strong>Rajasthan Forts & Havelis</strong>
                          <small>Jaipur, Udaipur & royal courtyards</small>
                        </div>
                      </Link>

                      <Link
                        to="/discover?region=coastal"
                        className="nav-dropdown-item"
                        onClick={closeAll}
                      >
                        <div className="nav-dropdown-icon-box">
                          <Waves size={16} />
                        </div>
                        <div>
                          <strong>Goa & Coastal Hideaways</strong>
                          <small>Golden sunsets, cliff trails & Varkala</small>
                        </div>
                      </Link>
                    </div>

                    {/* Right Column: Featured Destination Spotlight */}
                    <div className="mega-col-spotlight">
                      <div className="dropdown-menu-header">
                        <span>Featured Spotlight</span>
                      </div>

                      <Link
                        to="/destination/munnar"
                        className="mega-spotlight-card"
                        onClick={closeAll}
                      >
                        <div className="spotlight-thumb-wrap">
                          <img
                            src="https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80"
                            alt="Munnar Tea Hills"
                            className="spotlight-img"
                          />
                          <span className="spotlight-badge">
                            <Flame size={12} /> Top Trending
                          </span>
                        </div>
                        <div className="spotlight-meta">
                          <strong>Munnar Tea Sanctuary</strong>
                          <p>Misty rolling peaks, emerald estates & mountain chalets</p>
                          <span className="spotlight-action">
                            Explore Guide <ArrowRight size={13} />
                          </span>
                        </div>
                      </Link>
                    </div>
                  </div>

                  <div className="dropdown-menu-footer">
                    <Link to="/discover?country=India" onClick={closeAll}>
                      View All 25+ Handpicked Destinations Across India ↗
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* MENU 2: DISCOVER / EXPERIENCES (HOVER DROPDOWN) */}
            <div
              className="header-nav-dropdown-wrap"
              onMouseEnter={() => handleMouseEnter("discover")}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                className={`nav-dropdown-btn ${activeMenu === "discover" ? "active" : ""}`}
                onClick={(e) => handleMenuClick("discover", e)}
                onKeyDown={(e) => handleTriggerKeyDown("discover", e)}
                aria-haspopup="true"
                aria-expanded={activeMenu === "discover"}
                aria-controls="nav-dropdown-discover"
              >
                <Sparkles size={16} className="cat-icon" />
                <span>Discover</span>
                <ChevronDown
                  size={13}
                  className={`dropdown-chevron ${activeMenu === "discover" ? "open" : ""}`}
                />
              </button>

              {activeMenu === "discover" && (
                <div
                  id="nav-dropdown-discover"
                  className="nav-dropdown-menu"
                  role="region"
                  aria-label="Discover Submenu"
                  onMouseEnter={() => handleMouseEnter("discover")}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="dropdown-menu-header">
                    <span>Travel by Feeling & Mood</span>
                  </div>

                  <Link
                    to="/discover?mood=Nature"
                    className="nav-dropdown-item"
                    onClick={closeAll}
                  >
                    <div className="nav-dropdown-icon-box">
                      <Mountain size={16} />
                    </div>
                    <div>
                      <strong>Nature & Emerald Trails</strong>
                      <small>Quiet paths, waterfalls & misty heights</small>
                    </div>
                  </Link>

                  <Link
                    to="/discover?mood=Peace"
                    className="nav-dropdown-item"
                    onClick={closeAll}
                  >
                    <div className="nav-dropdown-icon-box">
                      <Trees size={16} />
                    </div>
                    <div>
                      <strong>Mindful Peace & Solitude</strong>
                      <small>Slow restorative retreats & quiet sanctuaries</small>
                    </div>
                  </Link>

                  <Link
                    to="/discover?mood=Romantic"
                    className="nav-dropdown-item"
                    onClick={closeAll}
                  >
                    <div className="nav-dropdown-icon-box">
                      <Heart size={16} />
                    </div>
                    <div>
                      <strong>Romantic Escapes</strong>
                      <small>Sunset lakes & private heritage courtyards</small>
                    </div>
                  </Link>

                  <Link
                    to="/discover?mood=Adventure"
                    className="nav-dropdown-item"
                    onClick={closeAll}
                  >
                    <div className="nav-dropdown-icon-box">
                      <Palmtree size={16} />
                    </div>
                    <div>
                      <strong>High Adventure & Expeditions</strong>
                      <small>Mountain trekking, rafting & jeep safaris</small>
                    </div>
                  </Link>

                  <Link
                    to="/surprise"
                    className="nav-dropdown-item"
                    onClick={closeAll}
                  >
                    <div className="nav-dropdown-icon-box spotlight-sparkle">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <strong>The Serendipity Machine</strong>
                      <small>Let chance pick your next escape</small>
                    </div>
                  </Link>

                  <div className="dropdown-menu-footer">
                    <Link to="/discover" onClick={closeAll}>
                      Browse All Mood Filters & Escapes ↗
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* MENU 3: HOTELS & BOUTIQUE STAYS (MEGA HOVER MENU) */}
            <div
              className="header-nav-dropdown-wrap"
              onMouseEnter={() => handleMouseEnter("hotels")}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                className={`nav-dropdown-btn ${activeMenu === "hotels" ? "active" : ""}`}
                onClick={(e) => handleMenuClick("hotels", e)}
                onKeyDown={(e) => handleTriggerKeyDown("hotels", e)}
                aria-haspopup="true"
                aria-expanded={activeMenu === "hotels"}
                aria-controls="nav-dropdown-hotels"
              >
                <Hotel size={16} className="cat-icon" />
                <span>Hotels</span>
                <ChevronDown
                  size={13}
                  className={`dropdown-chevron ${activeMenu === "hotels" ? "open" : ""}`}
                />
              </button>

              {activeMenu === "hotels" && (
                <div
                  id="nav-dropdown-hotels"
                  className="nav-dropdown-menu nav-mega-menu"
                  role="region"
                  aria-label="Hotels Submenu"
                  onMouseEnter={() => handleMouseEnter("hotels")}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="mega-menu-grid">
                    {/* Left Column: Categories */}
                    <div className="mega-col-links">
                      <div className="dropdown-menu-header">
                        <span>Curated Boutique Collections</span>
                      </div>

                      <Link
                        to="/hotels?type=Royal+Haveli"
                        className="nav-dropdown-item"
                        onClick={closeAll}
                      >
                        <div className="nav-dropdown-icon-box">
                          <Landmark size={16} />
                        </div>
                        <div>
                          <strong>Royal Havelis & Palaces</strong>
                          <small>Rajasthan courtyards & Rajput architecture</small>
                        </div>
                      </Link>

                      <Link
                        to="/hotels?type=Mountain+Retreat"
                        className="nav-dropdown-item"
                        onClick={closeAll}
                      >
                        <div className="nav-dropdown-icon-box">
                          <Mountain size={16} />
                        </div>
                        <div>
                          <strong>Mountain Chalets & Lodges</strong>
                          <small>Manali, Shimla & cedar wood sanctuaries</small>
                        </div>
                      </Link>

                      <Link
                        to="/hotels?type=Tea+Plantation+Stay"
                        className="nav-dropdown-item"
                        onClick={closeAll}
                      >
                        <div className="nav-dropdown-icon-box">
                          <Trees size={16} />
                        </div>
                        <div>
                          <strong>Tea & Coffee Estate Bungalows</strong>
                          <small>Munnar & Coorg colonial planters' estates</small>
                        </div>
                      </Link>

                      <Link
                        to="/hotels?type=Cliffside+Sanctuary"
                        className="nav-dropdown-item"
                        onClick={closeAll}
                      >
                        <div className="nav-dropdown-icon-box">
                          <Waves size={16} />
                        </div>
                        <div>
                          <strong>Cliffside Coastal Sanctuaries</strong>
                          <small>Varkala red cliffs & South Goa villas</small>
                        </div>
                      </Link>
                    </div>

                    {/* Right Column: Featured Stay */}
                    <div className="mega-col-spotlight">
                      <div className="dropdown-menu-header">
                        <span>Verified Stay Spotlight</span>
                      </div>

                      <Link
                        to="/hotel/fateh-garh-udaipur"
                        className="mega-spotlight-card"
                        onClick={closeAll}
                      >
                        <div className="spotlight-thumb-wrap">
                          <img
                            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"
                            alt="Fateh Garh Heritage Palace"
                            className="spotlight-img"
                          />
                          <span className="spotlight-badge">
                            <Star size={12} /> 4.9 ★ Verified
                          </span>
                        </div>
                        <div className="spotlight-meta">
                          <strong>Fateh Garh Palace</strong>
                          <p>Hilltop Rajput haven overlooking Lake Pichola</p>
                          <span className="spotlight-price">From ₹8,500/night</span>
                        </div>
                      </Link>
                    </div>
                  </div>

                  <div className="dropdown-menu-footer">
                    <Link to="/hotels" onClick={closeAll}>
                      Browse All Handpicked Boutique Stays Across India ↗
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* MENU 4: PLANNER (HOVER DROPDOWN) */}
            <div
              className="header-nav-dropdown-wrap"
              onMouseEnter={() => handleMouseEnter("planner")}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                className={`nav-dropdown-btn ${activeMenu === "planner" || location.pathname === "/planner" ? "active" : ""}`}
                onClick={(e) => handleMenuClick("planner", e)}
                onKeyDown={(e) => handleTriggerKeyDown("planner", e)}
                aria-haspopup="true"
                aria-expanded={activeMenu === "planner"}
                aria-controls="nav-dropdown-planner"
              >
                <Calendar size={16} className="cat-icon" />
                <span>Planner</span>
                <ChevronDown
                  size={13}
                  className={`dropdown-chevron ${activeMenu === "planner" ? "open" : ""}`}
                />
              </button>

              {activeMenu === "planner" && (
                <div
                  id="nav-dropdown-planner"
                  className="nav-dropdown-menu"
                  role="region"
                  aria-label="Planner Submenu"
                  onMouseEnter={() => handleMouseEnter("planner")}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="dropdown-menu-header">
                    <span>Mindful Trip Planning</span>
                  </div>

                  <Link
                    to="/planner"
                    className="nav-dropdown-item"
                    onClick={closeAll}
                  >
                    <div className="nav-dropdown-icon-box">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <strong>Custom Itinerary Builder</strong>
                      <small>Craft a mindful day-by-day travel route</small>
                    </div>
                  </Link>

                  <Link
                    to="/surprise"
                    className="nav-dropdown-item"
                    onClick={closeAll}
                  >
                    <div className="nav-dropdown-icon-box">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <strong>Instant Mood Generator</strong>
                      <small>Generate trips tailored to your current energy</small>
                    </div>
                  </Link>

                  <div className="dropdown-menu-footer">
                    <Link to="/planner" onClick={closeAll}>
                      Open Trip Planner ↗
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* MENU 5: STORIES & REVIEWS (HOVER DROPDOWN) */}
            <div
              className="header-nav-dropdown-wrap"
              onMouseEnter={() => handleMouseEnter("stories")}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                className={`nav-dropdown-btn ${activeMenu === "stories" ||
                    location.pathname === "/stories" ||
                    location.pathname === "/reviews"
                    ? "active"
                    : ""
                  }`}
                onClick={(e) => handleMenuClick("stories", e)}
                onKeyDown={(e) => handleTriggerKeyDown("stories", e)}
                aria-haspopup="true"
                aria-expanded={activeMenu === "stories"}
                aria-controls="nav-dropdown-stories"
              >
                <BookOpen size={16} className="cat-icon" />
                <span>Stories</span>
                <ChevronDown
                  size={13}
                  className={`dropdown-chevron ${activeMenu === "stories" ? "open" : ""}`}
                />
              </button>

              {activeMenu === "stories" && (
                <div
                  id="nav-dropdown-stories"
                  className="nav-dropdown-menu"
                  role="region"
                  aria-label="Stories Submenu"
                  onMouseEnter={() => handleMouseEnter("stories")}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="dropdown-menu-header">
                    <span>Community & Notes</span>
                  </div>

                  <Link
                    to="/stories"
                    className="nav-dropdown-item"
                    onClick={closeAll}
                  >
                    <div className="nav-dropdown-icon-box">
                      <BookOpen size={16} />
                    </div>
                    <div>
                      <strong>Travel Notes & Field Stories</strong>
                      <small>Immersive reflections from fellow wanderers</small>
                    </div>
                  </Link>

                  <Link
                    to="/reviews"
                    className="nav-dropdown-item"
                    onClick={closeAll}
                  >
                    <div className="nav-dropdown-icon-box">
                      <Star size={16} />
                    </div>
                    <div>
                      <strong>Community Reviews & Ratings</strong>
                      <small>Real experiences and verified feedback</small>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* WISHLIST */}
            <NavLink
              to="/wishlist"
              className={({ isActive }) =>
                `cat-tab-item cat-wishlist ${isActive ? "active" : ""}`
              }
              onClick={closeAll}
            >
              <Heart size={16} className="cat-icon" />
              <span>Wishlist</span>
              {wishlistCount > 0 && (
                <span className="cat-badge">{wishlistCount}</span>
              )}
            </NavLink>
          </nav>

          {/* 3. RIGHT UTILITIES */}
          <div className="header-right-actions">

            {/* 24/7 CONCIERGE SUPPORT (HOVER / CLICK) */}
            <div
              className="header-service-wrap"
              onMouseEnter={() => handleMouseEnter("support")}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                className="header-service-btn"
                onClick={(e) => handleMenuClick("support", e)}
                aria-expanded={activeMenu === "support"}
                title="24/7 Concierge Customer Service"
              >
                <Headphones size={15} />
                <span className="service-btn-label">24/7 Concierge</span>
                <ChevronDown size={13} />
              </button>

              {activeMenu === "support" && (
                <div
                  className="header-service-popover"
                  onMouseEnter={() => handleMouseEnter("support")}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="service-popover-header">
                    <Phone size={16} color="#059669" />
                    <strong>Roamly 24/7 Helpline</strong>
                  </div>
                  <p className="service-popover-phone">+91 800-ROAMLY</p>
                  <p className="service-popover-sub">
                    Toll-free across India • Verified booking support
                  </p>
                  <Link
                    to="/planner"
                    className="service-popover-link"
                    onClick={closeAll}
                  >
                    Speak with a Trip Specialist →
                  </Link>
                </div>
              )}
            </div>

            {/* CURRENCY SELECTOR */}
            <div className="header-currency-pill" title="Currency: Indian Rupee">
              <span className="flag-icon">🇮🇳</span>
              <span>₹ INR</span>
            </div>

            {/* NOTIFICATION CENTER */}
            <NotificationCenter />

            {/* MOBILE MENU TOGGLE */}
            <button
              type="button"
              className="mobile-menu icon-button"
              onClick={() => setMobileDrawerOpen((prev) => !prev)}
              aria-label={mobileDrawerOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileDrawerOpen}
            >
              {mobileDrawerOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* AUTH: USER PROFILE OR LOGIN/REGISTER */}
            {isLoggedIn ? (
              <div
                className="profile-menu"
                onMouseEnter={() => handleMouseEnter("profile")}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  className="profile-trigger"
                  onClick={(e) => handleMenuClick("profile", e)}
                  aria-expanded={activeMenu === "profile"}
                >
                  <span className="profile-avatar">
                    {userInitial || <UserRound size={16} />}
                  </span>
                  <span className="profile-name">{displayName}</span>
                  <ChevronDown
                    size={14}
                    style={{
                      transition: "transform 0.2s ease",
                      transform: activeMenu === "profile" ? "rotate(180deg)" : "none"
                    }}
                  />
                </button>

                {activeMenu === "profile" && (
                  <div
                    className="profile-dropdown"
                    onMouseEnter={() => handleMouseEnter("profile")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <p className="profile-dropdown-name">{displayName}</p>
                    <p className="profile-email">{user?.email}</p>
                    <span className="profile-role">
                      {isAdmin ? "Administrator" : "Traveler"}
                    </span>

                    <Link
                      to={dashboardPath}
                      className="profile-dashboard-link"
                      onClick={closeAll}
                    >
                      {isAdmin ? <ShieldCheck size={16} /> : <LayoutDashboard size={16} />}
                      {isAdmin ? "Admin Dashboard" : "My Dashboard"}
                    </Link>

                    <button
                      type="button"
                      className="profile-logout"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="header-auth-buttons">
                <Link to="/login" className="header-login-btn" onClick={closeAll}>
                  Login
                </Link>
                <Link to="/register" className="header-signup-btn" onClick={closeAll}>
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* 4. MOBILE NAVIGATION DRAWER (TAP-ACCESSIBLE) */}
          <nav
            className={`main-nav ${mobileDrawerOpen ? "nav-open" : ""}`}
            aria-label="Mobile navigation"
          >
            <div className="mobile-drawer-header">
              <span className="mobile-drawer-title">Explore Roamly</span>
              <button
                type="button"
                className="mobile-drawer-close"
                onClick={closeAll}
              >
                <X size={20} />
              </button>
            </div>

            <NavLink to="/" onClick={closeAll} end className="mobile-nav-link">
              <Compass className="nav-icon" />
              <span>Home</span>
            </NavLink>

            <NavLink to="/discover" onClick={closeAll} className="mobile-nav-link">
              <Palmtree className="nav-icon" />
              <span>Destinations Across India</span>
            </NavLink>

            <NavLink to="/hotels" onClick={closeAll} className="mobile-nav-link">
              <Hotel className="nav-icon" />
              <span>Boutique Stays & Havelis</span>
            </NavLink>

            <NavLink to="/planner" onClick={closeAll} className="mobile-nav-link">
              <Calendar className="nav-icon" />
              <span>Plan Your Trip</span>
            </NavLink>

            <NavLink to="/stories" onClick={closeAll} className="mobile-nav-link">
              <BookOpen className="nav-icon" />
              <span>Travel Stories</span>
            </NavLink>

            <NavLink to="/reviews" onClick={closeAll} className="mobile-nav-link">
              <Star className="nav-icon" />
              <span>Community Reviews</span>
            </NavLink>

            <NavLink to="/surprise" onClick={closeAll} className="mobile-nav-link">
              <Sparkles className="nav-icon" />
              <span>The Serendipity Machine</span>
            </NavLink>

            <NavLink
              to="/wishlist"
              onClick={closeAll}
              className="mobile-nav-link wishlist-link"
            >
              <Heart className="nav-icon" />
              <span>Saved Escapes ({wishlistCount})</span>
            </NavLink>

            {isLoggedIn ? (
              <NavLink
                to={dashboardPath}
                className="mobile-nav-link dashboard-link"
                onClick={closeAll}
              >
                {isAdmin ? (
                  <ShieldCheck className="nav-icon" />
                ) : (
                  <LayoutDashboard className="nav-icon" />
                )}
                <span>{isAdmin ? "Admin Dashboard" : "My Dashboard"}</span>
              </NavLink>
            ) : (
              <div className="mobile-auth-actions">
                <Link to="/login" className="button button-outline" onClick={closeAll}>
                  Login
                </Link>
                <Link to="/register" className="button button-dark" onClick={closeAll}>
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>

        {/* QUICK COMMAND PALETTE MODAL */}
        <QuickSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </header>
      <div className="site-header-spacer" aria-hidden="true" />
    </>
  );
}

