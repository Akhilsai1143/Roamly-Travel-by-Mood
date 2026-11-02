import { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  MapPin,
  Star,
  BedDouble,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
  X,
  IndianRupee,
  Coffee,
  Waves,
  Mountain,
  Trees,
  SlidersHorizontal,
  Heart
} from "lucide-react";
import { HOTELS_DATA } from "../data/hotels";

const CITIES = ["All", "Udaipur", "Munnar", "Manali", "Varkala", "Coorg", "Goa", "Shimla", "Jaipur"];
const PROPERTY_TYPES = ["All", "Royal Haveli", "Tea Plantation Stay", "Mountain Retreat", "Cliffside Sanctuary", "Coffee Estate Villa", "Boutique Ocean Villa", "Heritage Mountain Palace"];

export default function Hotels({ savedIds = [], onToggleSave }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialCity = searchParams.get("city") || "All";
  const initialType = searchParams.get("type") || "All";
  const initialQuery = searchParams.get("q") || "";

  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedType, setSelectedType] = useState(initialType);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [maxPrice, setMaxPrice] = useState(25000);

  // Filter logic
  const filteredHotels = useMemo(() => {
    return HOTELS_DATA.filter((hotel) => {
      // City filter
      if (selectedCity !== "All" && hotel.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      // Type filter
      if (selectedType !== "All" && hotel.type !== selectedType) {
        return false;
      }
      // Price filter
      if (hotel.pricePerNight > maxPrice) {
        return false;
      }
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = hotel.name.toLowerCase().includes(q);
        const matchesCity = hotel.city.toLowerCase().includes(q);
        const matchesState = hotel.state.toLowerCase().includes(q);
        const matchesTagline = hotel.tagline.toLowerCase().includes(q);
        const matchesMood = hotel.mood.some((m) => m.toLowerCase().includes(q));
        if (!matchesName && !matchesCity && !matchesState && !matchesTagline && !matchesMood) {
          return false;
        }
      }
      return true;
    });
  }, [selectedCity, selectedType, searchQuery, maxPrice]);

  function handleCityChange(city) {
    setSelectedCity(city);
    const newParams = new URLSearchParams(searchParams);
    if (city === "All") {
      newParams.delete("city");
    } else {
      newParams.set("city", city);
    }
    setSearchParams(newParams);
  }

  function handleTypeChange(type) {
    setSelectedType(type);
    const newParams = new URLSearchParams(searchParams);
    if (type === "All") {
      newParams.delete("type");
    } else {
      newParams.set("type", type);
    }
    setSearchParams(newParams);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      newParams.set("q", searchQuery.trim());
    } else {
      newParams.delete("q");
    }
    setSearchParams(newParams);
  }

  function clearFilters() {
    setSelectedCity("All");
    setSelectedType("All");
    setSearchQuery("");
    setMaxPrice(25000);
    setSearchParams({});
  }

  const safeSavedIds = Array.isArray(savedIds) ? savedIds : [];

  return (
    <div className="hotels-page">
      {/* 1. HERO SECTION */}
      <section className="hotels-hero">
        <div className="container">
          <div className="eyebrow eyebrow-light">
            <span className="eyebrow-line" /> VERIFIED BOUTIQUE STAYS & HAVELIS
          </div>
          <h1>
            Handpicked Places <span className="script-accent">to Stay.</span>
          </h1>
          <p className="hotels-hero-subtitle">
            From centuries-old Rajput palaces in Udaipur to colonial tea bungalows in Munnar and clifftop surf sanctuaries in Varkala. Zero hidden convenience fees.
          </p>

          {/* SEARCH BAR */}
          <form className="hotels-search-bar" onSubmit={handleSearchSubmit}>
            <div className="hotels-search-input-wrap">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by hotel name, city (e.g. Udaipur, Munnar), or mood..."
                aria-label="Search hotels"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery("")}
                >
                  <X size={15} />
                </button>
              )}
            </div>
            <button type="submit" className="hotels-search-btn">
              <span>Find Stays</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* CITY QUICK PILLS */}
          <div className="hotels-city-pills">
            <span className="city-pills-label">Popular Cities:</span>
            {CITIES.map((city) => (
              <button
                key={city}
                type="button"
                className={`city-pill ${selectedCity === city ? "active" : ""}`}
                onClick={() => handleCityChange(city)}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. TRUST STRIP (EASEMYTRIP ASSURANCE) */}
      <section className="hotels-trust-strip">
        <div className="container hotels-trust-grid">
          <div className="hotels-trust-item">
            <ShieldCheck size={20} className="trust-icon" />
            <div>
              <strong>100% Audited Stays</strong>
              <span>Physically verified for luxury & hygiene standards</span>
            </div>
          </div>
          <div className="hotels-trust-item">
            <IndianRupee size={20} className="trust-icon" />
            <div>
              <strong>Zero Convenience Fee</strong>
              <span>Transparent per-night checkout price with no hidden add-ons</span>
            </div>
          </div>
          <div className="hotels-trust-item">
            <CheckCircle2 size={20} className="trust-icon" />
            <div>
              <strong>Instant PDF & WhatsApp Voucher</strong>
              <span>Immediate confirmed booking voucher with emergency contact</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MAIN CATALOG SECTION */}
      <section className="hotels-catalog-section">
        <div className="container">
          {/* FILTER BAR ROW */}
          <div className="hotels-filter-bar">
            <div className="hotels-filter-left">
              <div className="filter-type-dropdown-wrap">
                <Filter size={15} />
                <select
                  value={selectedType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="hotels-type-select"
                  aria-label="Filter by property type"
                >
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t === "All" ? "All Property Types" : t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-price-wrap">
                <span className="filter-price-label">
                  Max: <strong>₹{maxPrice.toLocaleString("en-IN")}</strong>
                </span>
                <input
                  type="range"
                  min="4000"
                  max="25000"
                  step="1000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="hotels-price-slider"
                  aria-label="Max price per night"
                />
              </div>
            </div>

            <div className="hotels-filter-right">
              <span className="hotels-count-badge">
                Showing <strong>{filteredHotels.length}</strong> of {HOTELS_DATA.length} properties
              </span>
              {(selectedCity !== "All" || selectedType !== "All" || searchQuery || maxPrice < 25000) && (
                <button
                  type="button"
                  className="hotels-reset-btn"
                  onClick={clearFilters}
                >
                  <X size={14} /> Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* HOTELS GRID */}
          {filteredHotels.length > 0 ? (
            <div className="hotels-card-grid">
              {filteredHotels.map((hotel) => (
                <article key={hotel.id} className="hotel-catalog-card">
                  <div className="hotel-card-media">
                    <img
                      src={hotel.heroImage}
                      alt={hotel.name}
                      loading="lazy"
                    />
                    <div className="hotel-card-overlay" />
                    <span className="hotel-card-type-tag">{hotel.type}</span>
                    <span className="hotel-card-rating-tag">
                      <Star size={13} fill="#e59840" color="#e59840" /> {hotel.rating}
                      <small>({hotel.reviewsCount})</small>
                    </span>

                    {onToggleSave && (
                      <button
                        type="button"
                        className={`hotel-card-save-btn ${safeSavedIds.includes(hotel.id) ? "saved" : ""}`}
                        onClick={() => onToggleSave(hotel.id)}
                        aria-label="Save stay to wishlist"
                      >
                        <Heart
                          size={16}
                          fill={safeSavedIds.includes(hotel.id) ? "#e5b39b" : "none"}
                          color={safeSavedIds.includes(hotel.id) ? "#e5b39b" : "#ffffff"}
                        />
                      </button>
                    )}
                  </div>

                  <div className="hotel-card-body">
                    <div className="hotel-card-location">
                      <MapPin size={13} /> {hotel.city}, {hotel.state}
                    </div>

                    <h3 className="hotel-card-title">
                      <Link to={`/hotel/${hotel.id}`}>{hotel.name}</Link>
                    </h3>

                    <p className="hotel-card-tagline">{hotel.tagline}</p>

                    <div className="hotel-card-amenities-row">
                      {hotel.amenities.slice(0, 3).map((amenity) => (
                        <span key={amenity.id} className="hotel-amenity-chip">
                          ✓ {amenity.label}
                        </span>
                      ))}
                    </div>

                    <div className="hotel-card-footer">
                      <div className="hotel-price-block">
                        <div className="hotel-price-row">
                          <span className="hotel-price-num">
                            ₹{hotel.pricePerNight.toLocaleString("en-IN")}
                          </span>
                          <span className="hotel-price-sub">/ night</span>
                        </div>
                        {hotel.originalPrice && (
                          <div className="hotel-orig-price">
                            <span className="strike">₹{hotel.originalPrice.toLocaleString("en-IN")}</span>
                            <span className="discount-tag">
                              {Math.round(((hotel.originalPrice - hotel.pricePerNight) / hotel.originalPrice) * 100)}% OFF
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="hotel-card-actions">
                        <Link
                          to={`/hotel/${hotel.id}`}
                          className="hotel-view-btn"
                        >
                          <span>Explore Stay</span>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="hotels-empty-state">
              <BedDouble size={48} className="empty-icon" />
              <h3>No properties match your current filters</h3>
              <p>Try resetting the city or price filter to browse all available heritage retreats.</p>
              <button
                type="button"
                className="button button-dark"
                onClick={clearFilters}
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
