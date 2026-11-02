import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Compass,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  IndianRupee,
  Heart,
  Sparkles,
  Mountain,
  Waves,
  Trees,
  Landmark,
  Building,
  Flame,
  Search,
  CalendarCheck
} from "lucide-react";

// The authentic destinations for the 3-panel panoramic hero showcase
// Exactly matching the reference screenshot's scenic valley, mountain pass, and terraced hill village
export const SHOWCASE_DESTINATIONS = [
  {
    id: "munnar",
    name: "Munnar",
    state: "Kerala, India",
    tag: "Scenic River Valley & Mist",
    theme: "Peace & Nature",
    days: "3–4 Days",
    budget: "₹8,000",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85",
    description: "Lush rolling emerald tea gardens, morning mist, and quiet winding valley roads.",
    badge: "Most Loved"
  },
  {
    id: "spiti",
    name: "Spiti Valley",
    state: "Himachal Pradesh, India",
    tag: "High Himalayan Mountain Pass",
    theme: "Adventure & Serenity",
    days: "6–8 Days",
    budget: "₹18,000",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85",
    description: "Rugged trans-Himalayan cliffs, pine trails, and ancient high-altitude monasteries.",
    badge: "Trending Pass"
  },
  {
    id: "manali",
    name: "Manali & Solang",
    state: "Himachal Pradesh, India",
    tag: "Terraced Hillside Village",
    theme: "Cedar & Pine Forests",
    days: "3–5 Days",
    budget: "₹9,000",
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=85",
    description: "Picturesque wooden villages nestled in terraced hillsides and cedar forests.",
    badge: "Seasonal Pick"
  },
  {
    id: "ladakh",
    name: "Ladakh",
    state: "Ladakh, India",
    tag: "Where Earth Meets Sky",
    theme: "Turquoise Lakes & Passes",
    days: "6–8 Days",
    budget: "₹25,000",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=85",
    description: "Turquoise glacial lakes perched at 14,000 feet and windswept mountain plateaus.",
    badge: "High Altitude"
  },
  {
    id: "udaipur",
    name: "Udaipur",
    state: "Rajasthan, India",
    tag: "Royal Havelis & Sunsets",
    theme: "Lakes & Courtyards",
    days: "2–3 Days",
    budget: "₹7,000",
    image: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=1200&q=85",
    description: "Slow evening boat rides along Lake Pichola, sandstone courtyards, and royal havelis.",
    badge: "Living Heritage"
  },
  {
    id: "goa",
    name: "Goa & Gokarna",
    state: "Coastal West India",
    tag: "Golden Cliffs & Tides",
    theme: "Ocean Horizons",
    days: "3–5 Days",
    budget: "₹6,000",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=85",
    description: "Quiet cliffside trails, swaying palms, and restorative Arabian Sea sunsets.",
    badge: "Coastal Deal"
  },
  {
    id: "meghalaya",
    name: "Meghalaya",
    state: "Northeast India",
    tag: "Living Cloud Valleys",
    theme: "Rainforests & Waterfalls",
    days: "5–6 Days",
    budget: "₹14,000",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=85",
    description: "Living root bridges, emerald waterfalls, and cloud-shrouded sacred valleys.",
    badge: "Untouched Nature"
  },
  {
    id: "gulmarg",
    name: "Kashmir & Gulmarg",
    state: "Jammu & Kashmir, India",
    tag: "Meadow of Snow & Pine",
    theme: "High Peaks & Valleys",
    days: "3–4 Days",
    budget: "₹12,000",
    image: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=85",
    description: "Snow-covered pine slopes, meadow blossoms, and Asia's highest gondola cable car.",
    badge: "Alpine Wonder"
  },
  {
    id: "jaipur",
    name: "Jaipur",
    state: "Rajasthan, India",
    tag: "Pink City & Forts",
    theme: "Royal Architecture",
    days: "2–3 Days",
    budget: "₹6,000",
    image: "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=1200&q=85",
    description: "Wander through pink-hued streets, grand Amber Fort ramparts, and vibrant bazaars.",
    badge: "Royal Classic"
  },
  {
    id: "hampi",
    name: "Hampi",
    state: "Karnataka, India",
    tag: "Monolithic Stone Wonders",
    theme: "Ancient Architecture",
    days: "2–3 Days",
    budget: "₹5,000",
    image: "https://www.holidaymonk.com/wp-content/uploads/2020/10/Vastuchitra_Stone-Chariot-Hampi.jpg",
    description: "Monolithic temple ruins, giant river boulders, and the remarkable stone chariot.",
    badge: "UNESCO Heritage"
  },
  {
    id: "varanasi",
    name: "Varanasi",
    state: "Uttar Pradesh, India",
    tag: "Ghats & Timeless Rituals",
    theme: "Spiritual Stillness",
    days: "2–3 Days",
    budget: "₹5,000",
    image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=85",
    description: "Ancient riverfront steps, dawn wooden boat journeys, and moving evening Ganga Aarti.",
    badge: "Sacred India"
  },
  {
    id: "rishikesh",
    name: "Rishikesh",
    state: "Uttarakhand, India",
    tag: "Himalayan Gateway & River",
    theme: "Adventure & Serenity",
    days: "2–4 Days",
    budget: "₹6,000",
    image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=85",
    description: "Riverside calm, mountain meditation trails, suspension bridges, and emerald waters.",
    badge: "Mindful Retreat"
  },
  {
    id: "andaman",
    name: "Andaman Islands",
    state: "Andaman & Nicobar Islands",
    tag: "Turquoise Bays & Coral",
    theme: "Tropical Haven",
    days: "5–7 Days",
    budget: "₹20,000",
    image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=85",
    description: "Crystal waters at Radhanagar Beach, tropical rainforests, and quiet island shores.",
    badge: "Island Escape"
  },
  {
    id: "darjeeling",
    name: "Darjeeling",
    state: "West Bengal, India",
    tag: "Tea Terraces & Kanchenjunga",
    theme: "Colonial Pines & Hills",
    days: "3–4 Days",
    budget: "₹8,000",
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=85",
    description: "Watch sunrise over third-highest mountain peak, lush tea estates, and heritage toy train.",
    badge: "Eastern Hills"
  }
];

// Horizontal category navigation
export const HERO_CATEGORIES = [
  { id: "all", label: "All India", icon: Compass, filter: "" },
  { id: "adventure", label: "Adventure", icon: Flame, filter: "Adventure" },
  { id: "nature", label: "Nature & Mountains", icon: Mountain, filter: "Mountains" },
  { id: "beaches", label: "Beaches", icon: Waves, filter: "Beach" },
  { id: "wildlife", label: "Wildlife & Forests", icon: Trees, filter: "Nature" },
  { id: "heritage", label: "Heritage", icon: Landmark, filter: "Culture" },
  { id: "spiritual", label: "Spiritual", icon: Sparkles, filter: "Peace" },
  { id: "city", label: "City Escapes", icon: Building, filter: "City" }
];

export default function DestinationHeroShowcase({
  activeCategory = "all",
  onSelectCategory,
  savedIds = [],
  onToggleSave
}) {
  const [startIndex, setStartIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const categoryScrollRef = useRef(null);
  const navigate = useNavigate();

  const total = SHOWCASE_DESTINATIONS.length;
  // Show 3 cards at a time on desktop
  const visibleCardsCount = 3;

  // Auto-advance cards smoothly
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setStartIndex((prev) => (prev + 1) % total);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, total]);

  const slidePrev = () => {
    setStartIndex((prev) => (prev - 1 + total) % total);
  };

  const slideNext = () => {
    setStartIndex((prev) => (prev + 1) % total);
  };

  // Get current 3 cards (with wrap-around)
  const currentCards = [];
  for (let i = 0; i < visibleCardsCount; i++) {
    const cardIndex = (startIndex + i) % total;
    currentCards.push({ ...SHOWCASE_DESTINATIONS[cardIndex], originalIndex: cardIndex });
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/discover");
    }
  };

  const handleCategoryClick = (cat) => {
    if (onSelectCategory) {
      onSelectCategory(cat.id, cat.filter);
    } else if (cat.filter) {
      navigate(`/discover?category=${encodeURIComponent(cat.filter)}`);
    } else {
      navigate("/discover");
    }
  };

  const scrollCategories = (direction) => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === "left" ? -220 : 220;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section className="destination-hero-showcase-section" aria-label="Indian Destinations Showcase">
      {/* 1. TOP NARRATIVE & SEARCH HEADER */}
      <div className="container hero-showcase-header">
        <div className="showcase-header-left">
          <div className="showcase-eyebrow">
            <span className="eyebrow-red-bullet" />
            <span>DESTINATIONS FOR EVERY BUCKET LIST</span>
          </div>

          <h2 className="showcase-headline">
            Explore India's Most <span className="script-accent-red">Breathtaking Corners.</span>
          </h2>

          <p className="showcase-subtext">
            From mist-covered river valleys to rugged Himalayan passes, discover handpicked journeys tailored to your
            travel mood with transparent ₹ INR pricing.
          </p>
        </div>

        <div className="showcase-header-right">
          {/* QUICK DESTINATION SEARCH BAR */}
          <form className="showcase-search-bar" onSubmit={handleSearchSubmit}>
            <Search size={18} className="search-icon-red" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search places (e.g. Munnar, Spiti, Manali, Kerala)..."
              aria-label="Search destinations across India"
            />
            <button type="submit" className="showcase-search-btn">
              <span>Search</span>
              <ArrowRight size={15} />
            </button>
          </form>

          {/* Quick Trending Destinations */}
          <div className="showcase-quick-links">
            <span className="quick-label">Trending Now:</span>
            <button type="button" onClick={() => navigate("/destination/munnar")}>Munnar Tea Hills</button>
            <button type="button" onClick={() => navigate("/destination/spiti")}>Spiti High Pass</button>
            <button type="button" onClick={() => navigate("/destination/manali")}>Manali Pines</button>
            <button type="button" onClick={() => navigate("/destination/udaipur")}>Royal Udaipur</button>
          </div>
        </div>
      </div>

      {/* 2. THE 3-PANEL PANORAMIC DESTINATION GALLERY (MATCHING REFERENCE SCREENSHOT) */}
      <div
        className="hero-panoramic-gallery-wrap"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="container panoramic-gallery-container">
          {/* Left / Right Carousel Navigation Controls */}
          <button
            type="button"
            className="gallery-nav-arrow left"
            onClick={slidePrev}
            aria-label="Previous destination cards"
          >
            <ChevronLeft size={22} />
          </button>

          <div className="panoramic-cards-grid">
            {currentCards.map((dest, idx) => {
              const isSaved = Array.isArray(savedIds) && savedIds.includes(dest.id);
              return (
                <article key={`${dest.id}-${idx}`} className="panoramic-dest-card">
                  <Link to={`/destination/${dest.id}`} className="panoramic-card-link">
                    <div className="panoramic-card-img-wrap">
                      <img src={dest.image} alt={dest.name} loading="eager" />
                      <div className="panoramic-scrim-gradient" />
                    </div>

                    {/* Top Badges */}
                    <div className="panoramic-top-badges">
                      <span className="panoramic-red-badge">{dest.badge}</span>
                      <button
                        type="button"
                        className={`panoramic-wishlist-toggle ${isSaved ? "saved" : ""}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (typeof onToggleSave === "function") {
                            onToggleSave(dest.id);
                          }
                        }}
                        title={isSaved ? "Saved to Wishlist" : "Save to Wishlist"}
                        aria-label="Toggle wishlist"
                      >
                        <Heart
                          size={15}
                          fill={isSaved ? "#e11d48" : "none"}
                          color={isSaved ? "#e11d48" : "#ffffff"}
                        />
                      </button>
                    </div>

                    {/* Bottom Card Information */}
                    <div className="panoramic-bottom-content">
                      <div className="panoramic-location-row">
                        <MapPin size={13} className="pin-icon" />
                        <span>{dest.state}</span>
                      </div>

                      <h3 className="panoramic-card-title">{dest.name}</h3>

                      <p className="panoramic-card-tag">{dest.tag}</p>

                      <div className="panoramic-card-footer">
                        <div className="panoramic-meta-pills">
                          <span className="meta-pill">
                            <Clock size={12} /> {dest.days}
                          </span>
                          <span className="meta-pill price-pill">
                            <IndianRupee size={12} /> {dest.budget}
                          </span>
                        </div>

                        <span className="panoramic-explore-btn">
                          <span>Explore</span>
                          <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>

          <button
            type="button"
            className="gallery-nav-arrow right"
            onClick={slideNext}
            aria-label="Next destination cards"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Carousel Slide Indicators / Dots */}
        <div className="panoramic-dots-track">
          {SHOWCASE_DESTINATIONS.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`panoramic-dot ${index === startIndex ? "active" : ""}`}
              onClick={() => setStartIndex(index)}
              aria-label={`Jump to destination slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* 3. DOCKED DESTINATION CATEGORY SELECTOR */}
      <div className="hero-docked-categories clean-sand-bar">
        <div className="container categories-bar-inner">
          <button
            type="button"
            className="category-scroll-btn left"
            onClick={() => scrollCategories("left")}
            aria-label="Scroll categories left"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="categories-scroll-track" ref={categoryScrollRef}>
            {HERO_CATEGORIES.map((cat) => {
              const IconComponent = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`category-pill category-pill-red ${isActive ? "active" : ""}`}
                  onClick={() => handleCategoryClick(cat)}
                  aria-pressed={isActive}
                >
                  <IconComponent size={15} className="cat-pill-icon" />
                  <span className="cat-pill-label">{cat.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="category-scroll-btn right"
            onClick={() => scrollCategories("right")}
            aria-label="Scroll categories right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 4. VERTICAL RED "BOOK YOUR TRAVEL" RIBBON TAB (MATCHING REFERENCE SCREENSHOT) */}
      <Link
        to="/planner"
        className="vertical-red-booking-tab"
        title="Book or Plan Your Custom Travel Package"
        aria-label="Book Your Travel"
      >
        <CalendarCheck size={16} className="tab-icon" />
        <span className="tab-text">Book Your Travel</span>
      </Link>
    </section>
  );
}
