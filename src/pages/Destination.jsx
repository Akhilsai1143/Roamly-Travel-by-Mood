import { useEffect, useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  MapPin,
  CalendarDays,
  Wallet,
  Lightbulb,
  Sparkles,
  Compass,
  CheckCircle2,
  Calendar,
  Plane,
  Train,
  Car,
  Star,
  MessageSquareText,
  ChevronRight,
  ChevronLeft,
  Download,
  Utensils,
  Hotel,
  ShieldCheck,
  Clock,
  Printer,
  Share2,
  Maximize2,
  X,
  Check,
  Layers,
  Camera,
  Coffee,
  Bookmark,
  LayoutGrid,
  Images
} from "lucide-react";
import { destinations } from "../data/destinations";
import { getDestination } from "../api/destinations.js";
import { transitDetails } from "../data/travelDetails.js";
import { initialReviews } from "../data/reviews.js";
import { useAuth } from "../context/AuthContext.jsx";
import BookingModal from "../components/BookingModal.jsx";
import TravelVoucherModal from "../components/TravelVoucherModal.jsx";
import DestinationPackages from "../components/DestinationPackages.jsx";
import { getDestinationGallery, getDestinationLandmarks } from "../data/destinationGalleries.js";

// Helper to extract clean pricing matching reference layout
function getPackagePricing(dest) {
  const raw = String(dest?.budget || dest?.price || "9999");
  const match = raw.replace(/[,\s]/g, "").match(/₹?(\d+)/);
  const current = match ? parseInt(match[1], 10) : 9999;
  const original = Math.round(current * 1.25);
  return {
    current: current.toLocaleString("en-IN"),
    original: original.toLocaleString("en-IN"),
    numeric: current
  };
}

// Multi-image gallery provider
function getGalleryImages(dest) {
  return getDestinationGallery(dest);
}

export default function Destination({ savedIds = [], onToggleSave }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedPackageForBooking, setSelectedPackageForBooking] = useState(null);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [galleryViewMode, setGalleryViewMode] = useState("bento"); // "bento" | "carousel" | "grid"
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // "overview", "attractions", "culture", "tips"

  const [place, setPlace] = useState(() => {
    return (
      destinations.find(
        (item) =>
          String(item.id).toLowerCase() === String(id).toLowerCase() ||
          String(item.name).toLowerCase() === String(id).toLowerCase()
      ) || null
    );
  });
  const [loading, setLoading] = useState(!place);

  useEffect(() => {
    let isMounted = true;

    // Check local static data first
    const localMatch = destinations.find(
      (item) =>
        String(item.id).toLowerCase() === String(id).toLowerCase() ||
        String(item.name).toLowerCase() === String(id).toLowerCase()
    );

    if (localMatch) {
      setPlace(localMatch);
      setLoading(false);
      return;
    }

    // Fetch from backend API
    async function fetchFromApi() {
      try {
        setLoading(true);
        const apiData = await getDestination(id);
        if (apiData && isMounted) {
          setPlace(apiData);
        }
      } catch {
        const numId = Number(id);
        if (!Number.isNaN(numId) && destinations[numId - 1]) {
          if (isMounted) setPlace(destinations[numId - 1]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchFromApi();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Dynamic document title update
  useEffect(() => {
    if (place) {
      document.title = `${place.name} Holiday Guide & Package — Roamly`;
    }
  }, [place]);

  // Handle keyboard navigation for Lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setLightboxOpen(false);
      else if (e.key === "ArrowRight") nextImage();
      else if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // Reviews for this destination
  const destinationReviews = useMemo(() => {
    if (!place) return [];
    const placeIdStr = String(place.id ?? "").toLowerCase();
    const placeNameStr = String(place.name ?? "").toLowerCase();

    try {
      const stored = localStorage.getItem("roamly-community-reviews");
      const list = stored ? JSON.parse(stored) : initialReviews;
      return (Array.isArray(list) ? list : []).filter(
        (r) =>
          String(r?.destinationId ?? "").toLowerCase() === placeIdStr ||
          String(r?.destinationName ?? "").toLowerCase() === placeNameStr
      );
    } catch {
      return initialReviews.filter(
        (r) =>
          String(r?.destinationId ?? "").toLowerCase() === placeIdStr ||
          String(r?.destinationName ?? "").toLowerCase() === placeNameStr
      );
    }
  }, [place]);

  const transit = place ? transitDetails[String(place.id).toLowerCase()] : null;
  const pricing = useMemo(() => getPackagePricing(place), [place]);
  const gallery = useMemo(() => getGalleryImages(place), [place]);
  const landmarks = useMemo(() => getDestinationLandmarks(place), [place]);
  const currentLandmark = landmarks[activeImageIndex] || `${place?.name || "Destination"} — Perspective ${activeImageIndex + 1}`;

  // Curated Related Destinations (sharing mood or category)
  const relatedDestinations = useMemo(() => {
    if (!place) return [];
    return destinations
      .filter((d) => d.id !== place.id)
      .slice(0, 3);
  }, [place]);

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev < gallery.length - 1 ? prev + 1 : 0));
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : gallery.length - 1));
  };

  const handleShare = async () => {
    const shareData = {
      title: `${place.name} — Travel Guide on Roamly`,
      text: `Discover ${place.name} on Roamly Travel by Mood`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User dismissed
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2500);
    }
  };

  if (loading) {
    return (
      <main className="destination-detail loading-state container">
        <div className="detail-loading-box">
          <Compass className="spinning-icon" size={32} />
          <p>Finding this beautiful place...</p>
        </div>
      </main>
    );
  }

  if (!place) {
    return (
      <main className="not-found container">
        <span className="eyebrow">OFF THE MAP?</span>
        <h1>We couldn't find that escape.</h1>
        <p>The destination you are looking for might have moved or is taking a little rest.</p>
        <Link to="/discover" className="button button-dark">
          Back to discovery <ArrowRight size={16} />
        </Link>
      </main>
    );
  }

  const safeSavedIds = Array.isArray(savedIds) ? savedIds : [];
  const saved = safeSavedIds.includes(place.id);

  const moodList = Array.isArray(place.mood)
    ? place.mood
    : typeof place.mood === "string"
      ? place.mood.split(",").map((m) => m.trim()).filter(Boolean)
      : [];

  return (
    <main className="pkg-detail-page">
      <div className="pkg-detail-container">
        {/* 1. ENTERPRISE BREADCRUMBS ROW */}
        <nav className="pkg-breadcrumbs-row" aria-label="Breadcrumbs">
          <Link to="/">Home</Link>
          <ChevronRight size={13} className="crumb-arrow" />
          <Link to="/discover">Holidays & Packages</Link>
          <ChevronRight size={13} className="crumb-arrow" />
          <span className="current-crumb">{place.name} Package Special</span>
        </nav>

        {/* 2. PACKAGE TITLE & UTILITY HEADER ROW */}
        <section className="pkg-header-section">
          <div className="pkg-title-area">
            <div className="pkg-title-line">
              <h1>
                {place.name} Package <span className="script-accent">Special</span>
              </h1>
              <span className="pkg-duration-badge">
                <Clock size={14} />
                {place.days || "3 Nights / 4 Days"}
              </span>
              <span className="pkg-type-badge">Curated Escape</span>
            </div>

            <p className="pkg-location-line">
              <MapPin size={14} />
              <span>{place.state || place.country || "India"}</span>
              <span className="pkg-bullet">•</span>
              <span>Best Season: {place.bestTime || "October – March"}</span>
              <span className="pkg-bullet">•</span>
              <span className="pkg-ref-tag">Ref: RMY-{place.id}</span>
            </p>
          </div>

          <div className="pkg-header-actions">
            {/* Share Button */}
            <button
              type="button"
              className="pkg-utility-btn"
              onClick={handleShare}
              title="Share this destination"
            >
              {shareSuccess ? <Check size={15} className="text-emerald-500" /> : <Share2 size={15} />}
              <span>{shareSuccess ? "Link Copied!" : "Share"}</span>
            </button>

            {/* Download PDF Voucher */}
            <button
              type="button"
              className="pkg-download-pdf-btn"
              onClick={() => setVoucherModalOpen(true)}
              title="Download official Roamly travel voucher PDF"
            >
              <Download size={15} />
              <span>Download PDF</span>
            </button>
          </div>
        </section>

        {/* 3. MAIN TWO-COLUMN LAYOUT (65% Photo & Content / 35% Sticky Pricing Card) */}
        <section className="pkg-main-grid-section">
        {/* LEFT COLUMN: CINEMATIC CAROUSEL & CONTENT */}
        <div className="pkg-left-col">
          {/* PHOTO CAROUSEL WITH LIGHTBOX TRIGGER */}
          <div className="pkg-gallery-card">
            {/* Gallery Top Utility & Controls Bar */}
            <div className="pkg-gallery-header-bar">
              <div className="pkg-gallery-counter-info">
                <span className="pkg-gallery-pill">
                  <Images size={13} />
                  <span>{gallery.length} Verified Photos</span>
                </span>
                <span className="pkg-gallery-landmark-title" title={currentLandmark}>
                  <Camera size={13} />
                  <span>{currentLandmark}</span>
                </span>
              </div>

              <div className="pkg-gallery-actions">
                <button
                  type="button"
                  className={`pkg-view-toggle-btn ${galleryViewMode === "bento" ? "active" : ""}`}
                  onClick={() => setGalleryViewMode("bento")}
                  title="Featured Bento Showcase (5-Photo Grid)"
                >
                  <LayoutGrid size={13} />
                  <span>Showcase</span>
                </button>

                <button
                  type="button"
                  className={`pkg-view-toggle-btn ${galleryViewMode === "carousel" ? "active" : ""}`}
                  onClick={() => setGalleryViewMode("carousel")}
                  title="Cinema Slideshow with Filmstrip"
                >
                  <Layers size={13} />
                  <span>Slideshow</span>
                </button>

                <button
                  type="button"
                  className={`pkg-view-toggle-btn ${galleryViewMode === "grid" ? "active" : ""}`}
                  onClick={() => setGalleryViewMode("grid")}
                  title="Full 12-Photo Masonry Grid"
                >
                  <Images size={13} />
                  <span>All {gallery.length}</span>
                </button>

                <button
                  type="button"
                  className="gallery-lightbox-trigger"
                  onClick={() => {
                    setActiveImageIndex(0);
                    setLightboxOpen(true);
                  }}
                  aria-label="Open high-resolution fullscreen photo lightbox"
                  title="Fullscreen gallery view"
                >
                  <Maximize2 size={13} />
                  <span>Fullscreen</span>
                </button>
              </div>
            </div>

            {/* MODE 1: AIRBNB / BOOKING.COM STYLE 5-PHOTO BENTO SHOWCASE GRID */}
            {galleryViewMode === "bento" && (
              <div className="pkg-bento-grid">
                {/* 1 Large Featured Photo on Left (~60% width) */}
                <div
                  className="pkg-bento-featured"
                  onClick={() => {
                    setActiveImageIndex(0);
                    setLightboxOpen(true);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setActiveImageIndex(0);
                      setLightboxOpen(true);
                    }
                  }}
                  title={landmarks[0] || `${place.name} — Featured View`}
                >
                  <img
                    src={gallery[0]}
                    alt={`${place.name} — ${landmarks[0] || 'Featured Landmark'}`}
                    className="pkg-bento-img"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = place.image || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=85";
                    }}
                  />
                  <div className="pkg-bento-badge">
                    <Camera size={13} />
                    <span>{landmarks[0] || `${place.name} — Featured Landmark`}</span>
                  </div>
                  {moodList.length > 0 && (
                    <div className="pkg-image-mood-tags">
                      {moodList.map((m) => (
                        <span key={m} className="pkg-mood-tag">
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2x2 Subgrid of 4 Photos on Right (~40% width) */}
                <div className="pkg-bento-subgrid">
                  {gallery.slice(1, 5).map((imgUrl, subIdx) => {
                    const actualIdx = subIdx + 1;
                    const isLast = subIdx === 3;
                    return (
                      <div
                        key={actualIdx}
                        className="pkg-bento-thumb"
                        onClick={() => {
                          setActiveImageIndex(actualIdx);
                          setLightboxOpen(true);
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            setActiveImageIndex(actualIdx);
                            setLightboxOpen(true);
                          }
                        }}
                        title={landmarks[actualIdx] || `${place.name} — Photo ${actualIdx + 1}`}
                      >
                        <img
                          src={imgUrl}
                          alt={`${place.name} — ${landmarks[actualIdx] || 'Landmark ' + (actualIdx + 1)}`}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = place.image || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80";
                          }}
                        />
                        <div className="pkg-bento-thumb-overlay">
                          <span className="pkg-bento-thumb-num">0{actualIdx + 1}</span>
                          <span className="pkg-bento-thumb-title">{landmarks[actualIdx]}</span>
                        </div>

                        {/* On the 4th photo, the prominent "View all 12 photos" button */}
                        {isLast && (
                          <button
                            type="button"
                            className="pkg-bento-view-all-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveImageIndex(0);
                              setLightboxOpen(true);
                            }}
                            title="Open full 12-photo high-resolution gallery"
                          >
                            <LayoutGrid size={15} />
                            <span>View all {gallery.length} photos</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MODE 2: CINEMATIC CAROUSEL SLIDESHOW */}
            {galleryViewMode === "carousel" && (
              <>
                <div className="pkg-main-image-wrap">
                  <img
                    src={gallery[activeImageIndex]}
                    alt={`${place.name} — ${currentLandmark}`}
                    className="pkg-carousel-img"
                    onClick={() => setLightboxOpen(true)}
                    style={{ cursor: "zoom-in" }}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        place.image || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=85";
                    }}
                  />

                  {/* CAROUSEL CONTROLS */}
                  <button
                    type="button"
                    className="carousel-nav-btn prev"
                    onClick={prevImage}
                    aria-label="Previous photo"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <button
                    type="button"
                    className="carousel-nav-btn next"
                    onClick={nextImage}
                    aria-label="Next photo"
                  >
                    <ChevronRight size={20} />
                  </button>

                  {/* OVERLAY LANDMARK BADGE */}
                  <div className="pkg-hero-landmark-badge">
                    <Camera size={13} />
                    <span>{currentLandmark}</span>
                  </div>

                  {/* IMAGE COUNTER BADGE */}
                  <div className="pkg-image-counter">
                    {activeImageIndex + 1} / {gallery.length} Photos
                  </div>

                  {/* OVERLAY MOOD BADGES */}
                  {moodList.length > 0 && (
                    <div className="pkg-image-mood-tags">
                      {moodList.map((m) => (
                        <span key={m} className="pkg-mood-tag">
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* THUMBNAIL FILMSTRIP */}
                <div className="pkg-thumbnails-strip-wrap">
                  <div className="pkg-thumbnails-strip">
                    {gallery.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`pkg-thumb-btn ${idx === activeImageIndex ? "active" : ""}`}
                        onClick={() => setActiveImageIndex(idx)}
                        title={landmarks[idx] || `Photo ${idx + 1}`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Thumbnail ${idx + 1}`}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = place.image || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80";
                          }}
                        />
                        <span className="pkg-thumb-index">{idx + 1}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* MODE 3: FULL 12-PHOTO MOSAIC GRID */}
            {galleryViewMode === "grid" && (
              <div className="pkg-gallery-grid-mosaic">
                {gallery.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className={`pkg-mosaic-item ${idx === activeImageIndex ? "active" : ""}`}
                    onClick={() => {
                      setActiveImageIndex(idx);
                      setLightboxOpen(true);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setActiveImageIndex(idx);
                        setLightboxOpen(true);
                      }
                    }}
                    title={landmarks[idx] || `View photo ${idx + 1}`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${place.name} — ${landmarks[idx] || 'View ' + (idx + 1)}`}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = place.image || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80";
                      }}
                    />
                    <div className="pkg-mosaic-overlay">
                      <span className="pkg-mosaic-num">{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}</span>
                      <span className="pkg-mosaic-title">{landmarks[idx] || `${place.name} View ${idx + 1}`}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PACKAGE INCLUDES RIBBON */}
          <div className="pkg-includes-ribbon">
            <span className="ribbon-label">PACKAGE INCLUDES</span>
            <div className="includes-badges-row">
              <div className="include-item">
                <span className="include-icon-wrap stay">
                  <Hotel size={18} />
                </span>
                <span>Curated Stays</span>
              </div>

              <div className="include-item">
                <span className="include-icon-wrap tour">
                  <Compass size={18} />
                </span>
                <span>Sightseeing</span>
              </div>

              <div className="include-item">
                <span className="include-icon-wrap transit">
                  <Car size={18} />
                </span>
                <span>Transfers</span>
              </div>

              <div className="include-item">
                <span className="include-icon-wrap meals">
                  <Utensils size={18} />
                </span>
                <span>Meals (B/D)</span>
              </div>

              <div className="include-item">
                <span className="include-icon-wrap concierge">
                  <ShieldCheck size={18} />
                </span>
                <span>Concierge 24/7</span>
              </div>
            </div>
          </div>

          {/* EDITORIAL CONTENT TABS */}
          <div className="pkg-content-tabs-nav" role="tablist">
            <button
              type="button"
              className={`content-tab-btn ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              Overview & Highlights
            </button>
            <button
              type="button"
              className={`content-tab-btn ${activeTab === "attractions" ? "active" : ""}`}
              onClick={() => setActiveTab("attractions")}
            >
              Experiences & Culture
            </button>
            <button
              type="button"
              className={`content-tab-btn ${activeTab === "transit" ? "active" : ""}`}
              onClick={() => setActiveTab("transit")}
            >
              How to Reach
            </button>
            <button
              type="button"
              className={`content-tab-btn ${activeTab === "reviews" ? "active" : ""}`}
              onClick={() => setActiveTab("reviews")}
            >
              Traveler Stories ({destinationReviews.length})
            </button>
          </div>

          {/* TAB 1: OVERVIEW & HIGHLIGHTS */}
          {activeTab === "overview" && (
            <div className="pkg-editorial-card">
              <div className="pkg-section-title">
                <Sparkles size={18} color="#d97706" />
                <h2>
                  Why you'll love this <span className="script-accent">escape</span>
                </h2>
              </div>

              <p className="pkg-description-text">
                {place.description ||
                  "Wake up to quiet horizons, scenic landscapes, and the gentle pace of a mindful escape."}{" "}
                Roamly curates balanced, soulful escapes with verified boutique stays, authentic local culinary trails, and personal concierge guidance from arrival to departure.
              </p>

              {/* TRAVEL TIP */}
              {place.tip && (
                <div className="pkg-tip-box">
                  <Lightbulb size={20} color="#b45309" />
                  <div>
                    <strong>Roamly Concierge Tip</strong>
                    <p>{place.tip}</p>
                  </div>
                </div>
              )}

              {/* HIDDEN GEM */}
              {place.hiddenGem && (
                <div className="pkg-gem-box">
                  <Sparkles size={20} color="#15803d" />
                  <div>
                    <span className="gem-kicker">CURATED HIDDEN GEM</span>
                    <strong>{place.hiddenGem}</strong>
                  </div>
                </div>
              )}

              {/* WHAT'S SPECIAL */}
              <div className="pkg-special-features">
                <h3>
                  Trip Highlights & <span className="script-accent">Experiences</span>
                </h3>
                <ul className="pkg-highlights-list">
                  <li>
                    <CheckCircle2 size={16} color="#10b981" />
                    <span>Curated specifically for {moodList.join(" and ") || "mindful relaxing"} escapes.</span>
                  </li>
                  <li>
                    <CheckCircle2 size={16} color="#10b981" />
                    <span>Scenic vantage points, photography trails, and natural local beauty.</span>
                  </li>
                  <li>
                    <CheckCircle2 size={16} color="#10b981" />
                    <span>Handpicked stays verified by Roamly hospitality standards.</span>
                  </li>
                  <li>
                    <CheckCircle2 size={16} color="#10b981" />
                    <span>Private sanitized vehicles with experienced local chauffeurs.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: EXPERIENCES & LOCAL CULTURE */}
          {activeTab === "attractions" && (
            <div className="pkg-editorial-card">
              <div className="pkg-section-title">
                <Compass size={18} color="#d97706" />
                <h2>
                  Immersive Local <span className="script-accent">Experiences</span>
                </h2>
              </div>
              <p className="pkg-description-text">
                Immerse yourself in authentic Indian heritage, seasonal artisan markets, and regional gastronomic traditions indigenous to {place.name}.
              </p>

              <div className="experiences-grid">
                <div className="experience-item-box">
                  <Camera size={20} className="text-amber-500" />
                  <div>
                    <h4>Cultural Heritage Trails</h4>
                    <p>Guided early morning walk through historic streets, ancient courtyards, and landmark architecture with a native historian.</p>
                  </div>
                </div>

                <div className="experience-item-box">
                  <Coffee size={20} className="text-emerald-500" />
                  <div>
                    <h4>Regional Gastronomy</h4>
                    <p>Sample farm-to-table delicacies and traditional culinary heritage prepared using age-old ancestral spices.</p>
                  </div>
                </div>

                <div className="experience-item-box">
                  <Sparkles size={20} className="text-sky-500" />
                  <div>
                    <h4>Sunset Vantage Points</h4>
                    <p>Exclusive access to uncrowded panoramic viewpoints overlooking mountain ridges, water bodies, and royal fortresses.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TRANSIT CONNECTIVITY */}
          {activeTab === "transit" && (
            <div className="pkg-transit-card">
              <div className="pkg-section-title">
                <Compass size={18} color="#1b4332" />
                <h2>
                  How to Reach <span className="script-accent">{place.name}</span>
                </h2>
              </div>

              <div className="transit-connectivity-grid">
                <div className="transit-item">
                  <div className="transit-icon-wrap">
                    <Plane size={18} />
                  </div>
                  <div>
                    <strong>Nearest Airport</strong>
                    <p>{transit?.airport || "Major domestic and regional airport connectivity available"}</p>
                  </div>
                </div>

                <div className="transit-item">
                  <div className="transit-icon-wrap">
                    <Train size={18} />
                  </div>
                  <div>
                    <strong>Railway Junction</strong>
                    <p>{transit?.railway || "Connected via nearest national railway junction"}</p>
                  </div>
                </div>

                <div className="transit-item">
                  <div className="transit-icon-wrap">
                    <Car size={18} />
                  </div>
                  <div>
                    <strong>Highway Access</strong>
                    <p>{transit?.road || "Well-paved national highway network with scenic stops"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VERIFIED TRAVELER REVIEWS */}
          {activeTab === "reviews" && (
            <div className="pkg-reviews-card">
              <div className="reviews-card-header">
                <div>
                  <h2>
                    Verified Traveler <span className="script-accent">Stories</span> ({destinationReviews.length})
                  </h2>
                  <p>Authentic logs from travelers who explored this destination.</p>
                </div>

                <Link
                  to={`/reviews?destination=${encodeURIComponent(place.id)}`}
                  className="pkg-write-review-btn"
                >
                  <MessageSquareText size={15} />
                  <span>Write Review</span>
                </Link>
              </div>

              {destinationReviews.length === 0 ? (
                <div className="no-reviews-box">
                  <p>No traveler reviews yet for {place.name}.</p>
                  <Link
                    to={`/reviews?destination=${encodeURIComponent(place.id)}`}
                    className="button button-outline"
                  >
                    Be the first to share your story →
                  </Link>
                </div>
              ) : (
                <div className="reviews-preview-list">
                  {destinationReviews.slice(0, 3).map((rev) => (
                    <div key={rev.id} className="review-preview-item">
                      <div className="review-top-row">
                        <strong>{rev.author}</strong>
                        <div className="stars-row">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              size={13}
                              fill={i < rev.rating ? "#f59e0b" : "none"}
                              color={i < rev.rating ? "#f59e0b" : "#cbd5e1"}
                            />
                          ))}
                        </div>
                      </div>
                      <h4>{rev.title}</h4>
                      <p>{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SPECIAL TRAVEL PACKAGES (Requirement 2) */}
          <DestinationPackages
            destination={place}
            onBookPackage={(pkg) => {
              setSelectedPackageForBooking(pkg);
              setBookingModalOpen(true);
            }}
          />

          {/* RELATED CURATED DESTINATIONS */}
          {relatedDestinations.length > 0 && (
            <div className="pkg-related-section">
              <div className="pkg-section-title">
                <Compass size={18} color="#0284c7" />
                <h2>
                  Similar Escapes <span className="script-accent">You May Love</span>
                </h2>
              </div>
              <div className="related-dest-grid">
                {relatedDestinations.map((rd) => (
                  <Link
                    key={rd.id}
                    to={`/destination/${rd.id}`}
                    className="related-dest-card"
                  >
                    <img src={rd.image} alt={rd.name} className="related-dest-img" loading="lazy" />
                    <div className="related-dest-overlay">
                      <span className="related-state">{rd.state}</span>
                      <h4>{rd.name}</h4>
                      <span className="related-days">{rd.days}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: STICKY PRICING & BOOKING CARD */}
        <div className="pkg-right-col">
          <div className="pkg-sticky-booking-card">
            {/* PRICING BLOCK */}
            <div className="pkg-price-header">
              <span className="original-strike-price">
                Starting from ₹{pricing.original}
              </span>
              <div className="current-price-row">
                <span className="main-price-figure">₹{pricing.current}</span>
                <span className="price-per-person">Per Person</span>
              </div>
              <span className="instant-savings-badge">
                Save 25% on Roamly Package
              </span>
            </div>

            {/* ACTION CTA BUTTONS */}
            <div className="pkg-action-buttons">
              <button
                type="button"
                className="pkg-book-now-btn"
                onClick={() => setBookingModalOpen(true)}
              >
                BOOK NOW
              </button>

              <Link
                to={`/planner?destination=${encodeURIComponent(place.id)}`}
                className="pkg-enquire-btn"
              >
                PLAN ITINERARY
              </Link>
            </div>

            {/* HIGHLIGHTS SUMMARY BOX */}
            <div className="pkg-quick-summary-box">
              <div className="summary-item">
                <Clock size={16} className="summary-icon" />
                <div>
                  <small>Duration</small>
                  <strong>{place.days || "3 Nights & 4 Days"}</strong>
                </div>
              </div>

              <div className="summary-item">
                <MapPin size={16} className="summary-icon" />
                <div>
                  <small>Places to Visit</small>
                  <strong>{place.name}, {place.state || place.country}</strong>
                </div>
              </div>
            </div>

            {/* PACKAGE INCLUDES MINI GRID */}
            <div className="pkg-includes-mini-grid">
              <span className="mini-grid-title">Package Includes:</span>
              <div className="mini-icons-row">
                <div className="mini-icon-item" title="Hotel Stay Included">
                  <span className="mini-icon hotel"><Hotel size={16} /></span>
                  <small>Stay</small>
                </div>
                <div className="mini-icon-item" title="Sightseeing Included">
                  <span className="mini-icon tour"><Compass size={16} /></span>
                  <small>Tours</small>
                </div>
                <div className="mini-icon-item" title="Transfers Included">
                  <span className="mini-icon transit"><Car size={16} /></span>
                  <small>Transit</small>
                </div>
                <div className="mini-icon-item" title="Meals Included">
                  <span className="mini-icon meals"><Utensils size={16} /></span>
                  <small>Meals</small>
                </div>
              </div>
            </div>

            {/* WISHLIST TOGGLE */}
            <button
              type="button"
              className={`pkg-save-wishlist-btn ${saved ? "is-saved" : ""}`}
              onClick={() => onToggleSave && onToggleSave(place.id)}
            >
              <Heart size={16} fill={saved ? "currentColor" : "none"} />
              <span>{saved ? "Saved to Wishlist" : "Save to Wishlist"}</span>
            </button>

            {/* CONCIERGE ASSISTANCE FOOTER */}
            <div className="pkg-concierge-callout">
              <ShieldCheck size={16} color="#059669" />
              <span>Need customized dates? Call Concierge: <strong>+91 800-ROAMLY</strong></span>
            </div>
          </div>
        </div>
      </section>
      </div>

      {/* 4. FULLSCREEN IMAGE LIGHTBOX MODAL */}
      {lightboxOpen && (
        <div
          className="pkg-lightbox-backdrop"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="High-resolution Image Lightbox"
        >
          <div className="pkg-lightbox-content" onClick={(e) => e.stopPropagation()}>
            {/* LIGHTBOX TOP BAR */}
            <div className="lightbox-top-bar">
              <div className="lightbox-landmark-heading">
                <Camera size={16} />
                <span>{currentLandmark}</span>
              </div>
              <div className="lightbox-right-controls" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="lightbox-counter-badge">Photo {activeImageIndex + 1} of {gallery.length}</span>
                <button
                  type="button"
                  className="lightbox-close-btn"
                  onClick={() => setLightboxOpen(false)}
                  aria-label="Close Lightbox"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* LIGHTBOX MAIN PHOTO STAGE */}
            <div className="lightbox-photo-stage">
              <button
                type="button"
                className="lightbox-nav-btn prev"
                onClick={prevImage}
                aria-label="Previous Photo"
              >
                <ChevronLeft size={30} />
              </button>

              <img
                src={gallery[activeImageIndex]}
                alt={`${place.name} — ${currentLandmark}`}
                className="lightbox-image"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = place?.image || "/fallback-destination.jpg";
                }}
              />

              <button
                type="button"
                className="lightbox-nav-btn next"
                onClick={nextImage}
                aria-label="Next Photo"
              >
                <ChevronRight size={30} />
              </button>
            </div>

            {/* LIGHTBOX FILMSTRIP TRAY (Interactive thumbnails of all 10-12 photos) */}
            <div className="lightbox-filmstrip-tray" aria-label="Photo Thumbnails">
              {gallery.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`lightbox-filmstrip-thumb ${idx === activeImageIndex ? "active" : ""}`}
                  onClick={() => setActiveImageIndex(idx)}
                  title={landmarks[idx] || `${place.name} Photo ${idx + 1}`}
                  aria-label={`View photo ${idx + 1} of ${gallery.length}`}
                >
                  <img
                    src={img}
                    alt={`${place.name} thumbnail ${idx + 1}`}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = place?.image || "/fallback-destination.jpg";
                    }}
                  />
                  <span className="filmstrip-idx">{idx + 1}</span>
                </button>
              ))}
            </div>

            {/* LIGHTBOX CAPTION & CONTROLS HINT */}
            <div className="lightbox-footer">
              <span className="lightbox-caption">{place.name} — {currentLandmark}</span>
              <span className="lightbox-hint">Use arrow keys (← / →) to navigate · Click any thumbnail to jump · Press ESC to close</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODALS */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => {
          setBookingModalOpen(false);
          setSelectedPackageForBooking(null);
        }}
        destination={place}
        packageData={selectedPackageForBooking}
      />

      {voucherModalOpen && (
        <TravelVoucherModal
          booking={{
            destinationName: place.name,
            destinationImage: place.image,
            destinationState: place.state,
            destinationCountry: place.country,
            startDate: new Date(Date.now() + 7 * 86400000).toISOString(),
            endDate: new Date(Date.now() + 11 * 86400000).toISOString(),
            travellers: 2,
            contactName: user?.name || "Valued Traveler",
            contactEmail: user?.email || "concierge@roamly.com",
            contactPhone: "+91 800-ROAMLY Verified",
            estimatedBudget: pricing.numeric * 2,
            status: "confirmed"
          }}
          onClose={() => setVoucherModalOpen(false)}
        />
      )}
    </main>
  );
}
