import { useEffect, useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  X,
  Compass,
  Sparkles,
  ArrowUpDown,
  Filter,
  MapPin,
  Clock,
  IndianRupee,
  RotateCcw,
  Check,
  ChevronRight
} from "lucide-react";
import DestinationCard from "../components/DestinationCard.jsx";
import BookingModal from "../components/BookingModal.jsx";
import { getDestinations } from "../api/destinations.js";
import { destinations as staticDestinations } from "../data/destinations.js";

// Emotional travel mood pill catalog with themed emojis
const MOOD_PILLS = [
  { id: "", label: "All Moods", emoji: "✨", desc: "Browse everything" },
  { id: "peace", label: "Peace & Calm", emoji: "🕊️", desc: "Quiet tea hills & lakeside mornings" },
  { id: "adventure", label: "Adventure & Thrill", emoji: "🏔️", desc: "High mountain passes & trekking" },
  { id: "romance", label: "Romance & Escapes", emoji: "🌅", desc: "Sunset boat rides & heritage dinners" },
  { id: "nature", label: "Nature & Greenery", emoji: "🌿", desc: "Mist, forests & cloud valleys" },
  { id: "culture", label: "Heritage & Culture", emoji: "🏛️", desc: "Royal palaces & historic lanes" },
  { id: "relaxation", label: "Coastal & Waves", emoji: "🌊", desc: "Quiet beaches & palm shores" },
  { id: "spiritual", label: "Spiritual Retreat", emoji: "🛕", desc: "Riverside aartis & sacred peace" },
];

const CATEGORIES = [
  "All",
  "Mountains",
  "Beach",
  "Culture",
  "Nature",
  "Island",
  "City",
  "Adventure",
  "Spiritual",
];

const INDIAN_REGIONS = [
  { id: "All", label: "All Packages", icon: "🇮🇳" },
  { id: "himachal", label: "Himachal Pradesh", icon: "🏔️" },
  { id: "uttarakhand", label: "Uttarakhand & Hills", icon: "🌲" },
  { id: "south", label: "Kerala & South", icon: "🌴" },
  { id: "heritage", label: "Rajasthan & Royal", icon: "🏰" },
  { id: "coastal", label: "Goa & Coastal", icon: "🌊" },
  { id: "kashmir", label: "Kashmir & Ladakh", icon: "❄️" },
  { id: "northeast", label: "Northeast Hills", icon: "🍃" },
];

const THEME_TABS = [
  { id: "all", label: "All Packages" },
  { id: "top", label: "Top Selling ★" },
  { id: "guided", label: "Guided Tours" },
  { id: "honeymoon", label: "Honeymoon & Romantic" },
  { id: "family", label: "Family & Nature" },
  { id: "budget", label: "Pocket Friendly (< ₹15k)" },
];

const BUDGET_TIERS = [
  { id: "All", label: "Any Budget" },
  { id: "budget", label: "Under ₹10,000 (Pocket Friendly)" },
  { id: "comfort", label: "₹10,000 – ₹25,000 (Comfort Escapes)" },
  { id: "premium", label: "₹25,000 – ₹50,000 (Premium Stays)" },
  { id: "luxury", label: "₹50,000+ (Luxury & Global)" },
];

const DURATION_TIERS = [
  { id: "All", label: "Any Duration" },
  { id: "weekend", label: "Long Weekend (2–3 Days)" },
  { id: "short", label: "Short Holiday (4–5 Days)" },
  { id: "long", label: "Extended Journey (6+ Days)" },
];

// Helper: parse minimum price in INR from string (e.g. "₹8,000–₹14,000" -> 8000)
function parseMinBudget(str) {
  if (!str) return 0;
  const match = str.replace(/[,\s]/g, "").match(/₹?(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

// Helper: parse duration in days from string (e.g. "3–4 days" -> 3)
function parseMinDays(str) {
  if (!str) return 3;
  const match = str.match(/\d+/);
  return match ? parseInt(match[0], 10) : 3;
}

// Helper: matches Indian geographic regions
function matchesIndianRegion(dest, region) {
  if (!region || region === "All") return true;
  const text = `${dest.name} ${dest.state || ""} ${dest.country || ""}`.toLowerCase();

  if (region === "himachal") {
    return text.includes("himachal") || text.includes("spiti") || text.includes("manali") || text.includes("shimla") || text.includes("dharamshala") || text.includes("kasol");
  }
  if (region === "himalayas") {
    return text.includes("himachal") || text.includes("ladakh") || text.includes("uttarakhand") || text.includes("spiti") || text.includes("manali") || text.includes("rishikesh") || text.includes("kashmir");
  }
  if (region === "uttarakhand") {
    return text.includes("uttarakhand") || text.includes("rishikesh") || text.includes("nainital") || text.includes("mussoorie");
  }
  if (region === "kashmir" || region === "ladakh") {
    return text.includes("kashmir") || text.includes("ladakh") || text.includes("srinagar") || text.includes("gulmarg") || text.includes("leh");
  }
  if (region === "south" || region === "kerala") {
    return text.includes("kerala") || text.includes("karnataka") || text.includes("tamil nadu") || text.includes("munnar") || text.includes("coorg") || text.includes("ooty") || text.includes("varkala") || text.includes("gokarna") || text.includes("hampi") || text.includes("alleppey");
  }
  if (region === "heritage" || region === "rajasthan") {
    return text.includes("rajasthan") || text.includes("jaipur") || text.includes("udaipur") || text.includes("jaisalmer") || text.includes("uttar pradesh") || text.includes("varanasi") || text.includes("agra");
  }
  if (region === "coastal" || region === "goa") {
    return text.includes("goa") || text.includes("andaman") || text.includes("beach") || text.includes("coastal") || text.includes("gokarna") || text.includes("varkala");
  }
  if (region === "northeast") {
    return text.includes("meghalaya") || text.includes("darjeeling") || text.includes("bengal") || text.includes("northeast") || text.includes("sikkim");
  }
  return true;
}

// Helper: matches budget tier
function matchesBudgetTier(dest, tier) {
  if (!tier || tier === "All") return true;
  const minPrice = parseMinBudget(dest.budget);
  if (tier === "budget") return minPrice <= 10000;
  if (tier === "comfort") return minPrice >= 10000 && minPrice <= 25000;
  if (tier === "premium") return minPrice >= 25000 && minPrice <= 50000;
  if (tier === "luxury") return minPrice >= 50000;
  return true;
}

// Helper: matches duration tier
function matchesDurationTier(dest, tier) {
  if (!tier || tier === "All") return true;
  const days = parseMinDays(dest.days);
  if (tier === "weekend") return days <= 3;
  if (tier === "short") return days >= 4 && days <= 5;
  if (tier === "long") return days >= 6;
  return true;
}

export default function Discover({ savedIds = [], onToggleSave, onBookingSuccess, hideHeroBanner = false }) {
  const [params, setParams] = useSearchParams();

  // In-page direct booking modal state
  const [selectedDestForBooking, setSelectedDestForBooking] = useState(null);

  // URL search parameter extraction
  const urlQuery = params.get("q") || "";
  const urlMood = params.get("mood") || "";
  const urlCategory = params.get("category") || "All";
  const urlCountry = params.get("country") || "All";
  const urlRegion = params.get("region") || "All";
  const urlBudget = params.get("budget") || "All";
  const urlDuration = params.get("duration") || "All";
  const urlSort = params.get("sort") || "recommended";
  const urlTheme = params.get("theme") || "all";
  const urlPage = parseInt(params.get("page") || "1", 10) || 1;

  // Local filter states
  const [query, setQuery] = useState(urlQuery);
  const [mood, setMood] = useState(urlMood);
  const [category, setCategory] = useState(urlCategory);
  const [country, setCountry] = useState(urlCountry);
  const [region, setRegion] = useState(urlRegion);
  const [budgetTier, setBudgetTier] = useState(urlBudget);
  const [durationTier, setDurationTier] = useState(urlDuration);
  const [sortBy, setSortBy] = useState(urlSort);
  const [themeTab, setThemeTab] = useState(urlTheme);
  const [departureCity, setDepartureCity] = useState("Delhi (DEL)");
  const [page, setPage] = useState(urlPage);

  // Destinations & pagination
  const [destinations, setDestinations] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [loading, setLoading] = useState(true);

  // Sync state when URL params change
  useEffect(() => {
    setQuery(urlQuery);
    setMood(urlMood);
    setCategory(urlCategory);
    setCountry(urlCountry);
    setRegion(urlRegion);
    setBudgetTier(urlBudget);
    setDurationTier(urlDuration);
    setSortBy(urlSort);
    setThemeTab(urlTheme);
    setPage(urlPage);
  }, [urlQuery, urlMood, urlCategory, urlCountry, urlRegion, urlBudget, urlDuration, urlSort, urlTheme, urlPage]);

  // Synchronize state changes to URL search params
  function applyFilters({
    newQuery = query,
    newMood = mood,
    newCategory = category,
    newCountry = country,
    newRegion = region,
    newBudget = budgetTier,
    newDuration = durationTier,
    newSort = sortBy,
    newTheme = themeTab,
    newPage = 1,
  }) {
    const nextParams = new URLSearchParams();
    if (params.get("view")) {
      nextParams.set("view", params.get("view"));
    }

    if (newQuery.trim()) nextParams.set("q", newQuery.trim());
    if (newMood && newMood.toLowerCase() !== "all") nextParams.set("mood", newMood.toLowerCase());
    if (newCategory && newCategory !== "All") nextParams.set("category", newCategory);
    if (newCountry && newCountry !== "All") nextParams.set("country", newCountry);
    if (newRegion && newRegion !== "All") nextParams.set("region", newRegion);
    if (newBudget && newBudget !== "All") nextParams.set("budget", newBudget);
    if (newDuration && newDuration !== "All") nextParams.set("duration", newDuration);
    if (newSort && newSort !== "recommended") nextParams.set("sort", newSort);
    if (newTheme && newTheme !== "all") nextParams.set("theme", newTheme);
    if (newPage > 1) nextParams.set("page", String(newPage));

    setParams(nextParams, { replace: true });
    setPage(newPage);
  }

  // Clear all active filters
  function clearFilters() {
    setQuery("");
    setMood("");
    setCategory("All");
    setCountry("All");
    setRegion("All");
    setBudgetTier("All");
    setDurationTier("All");
    setSortBy("recommended");
    setThemeTab("all");
    setPage(1);
    const nextParams = new URLSearchParams();
    if (params.get("view")) {
      nextParams.set("view", params.get("view"));
    }
    setParams(nextParams, { replace: true });
  }

  // Live remote destinations merged with static fallback
  const [remoteDestinations, setRemoteDestinations] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function fetchLiveDestinations() {
      try {
        const response = await getDestinations({ limit: 100 });
        const list = response?.destinations || (Array.isArray(response) ? response : []);
        if (isMounted && list.length > 0) {
          const remoteMap = new Map(list.map((d) => [d.name.toLowerCase(), d]));
          const merged = staticDestinations.map((sd) => {
            const live = remoteMap.get(sd.name.toLowerCase());
            return live ? { ...sd, ...live, gallery: live.gallery || sd.gallery } : sd;
          });
          const staticNames = new Set(staticDestinations.map((sd) => sd.name.toLowerCase()));
          const newFromDb = list.filter((ld) => !staticNames.has(ld.name.toLowerCase()));
          setRemoteDestinations([...merged, ...newFromDb]);
        }
      } catch (err) {
        // Graceful fallback to staticDestinations if offline
      }
    }
    fetchLiveDestinations();
    return () => { isMounted = false; };
  }, []);

  // Load destinations (API first, falling back to static dataset with full client-side filtering)
  useEffect(() => {
    let cancelled = false;

    async function loadDestinations() {
      try {
        setLoading(true);

        const baseDestinations = remoteDestinations.length > 0 ? remoteDestinations : staticDestinations;
        let filtered = [...baseDestinations];

        // 1. Text search
        if (query.trim()) {
          const q = query.trim().toLowerCase();
          filtered = filtered.filter(
            (d) =>
              d.name.toLowerCase().includes(q) ||
              (d.state && d.state.toLowerCase().includes(q)) ||
              (d.country && d.country.toLowerCase().includes(q)) ||
              (d.description && d.description.toLowerCase().includes(q)) ||
              (d.hiddenGem && d.hiddenGem.toLowerCase().includes(q))
          );
        }

        // 2. Country / Domestic scope
        if (country !== "All") {
          if (country === "India") {
            filtered = filtered.filter((d) => d.country === "India");
          } else if (country === "World") {
            filtered = filtered.filter((d) => d.country !== "India");
          }
        }

        // 3. Indian Region
        if (region !== "All") {
          filtered = filtered.filter((d) => matchesIndianRegion(d, region));
        }

        // 4. Category
        if (category !== "All") {
          filtered = filtered.filter(
            (d) => d.category && d.category.toLowerCase() === category.toLowerCase()
          );
        }

        // 5. Travel Mood
        if (mood && mood !== "All") {
          const targetMood = mood.toLowerCase();
          filtered = filtered.filter((d) => {
            if (Array.isArray(d.mood)) {
              return d.mood.some((m) => m.toLowerCase().includes(targetMood));
            }
            if (typeof d.mood === "string") {
              return d.mood.toLowerCase().includes(targetMood);
            }
            return false;
          });
        }

        // 6. Budget Tier
        if (budgetTier !== "All") {
          filtered = filtered.filter((d) => matchesBudgetTier(d, budgetTier));
        }

        // 7. Duration Tier
        if (durationTier !== "All") {
          filtered = filtered.filter((d) => matchesDurationTier(d, durationTier));
        }

        // 7.5 Theme Tab (EaseMyTrip Category Filters)
        if (themeTab === "top") {
          filtered.sort((a, b) => (b.name.charCodeAt(0) % 7) - (a.name.charCodeAt(0) % 7));
        } else if (themeTab === "guided") {
          filtered = filtered.filter(
            (d) =>
              d.category === "Culture" ||
              d.category === "Adventure" ||
              (d.mood && (d.mood.includes("Culture") || d.mood.includes("Adventure")))
          );
        } else if (themeTab === "honeymoon") {
          filtered = filtered.filter((d) => {
            const m = Array.isArray(d.mood) ? d.mood : (d.mood || "").split(",");
            return m.some((x) => x.toLowerCase().includes("romance"));
          });
        } else if (themeTab === "family") {
          filtered = filtered.filter((d) => {
            const m = Array.isArray(d.mood) ? d.mood : (d.mood || "").split(",");
            return m.some((x) => x.toLowerCase().includes("peace") || x.toLowerCase().includes("nature"));
          });
        } else if (themeTab === "budget") {
          filtered = filtered.filter((d) => parseMinBudget(d.budget) <= 15000);
        }

        // 8. Sorting
        if (sortBy === "price-asc") {
          filtered.sort((a, b) => parseMinBudget(a.budget) - parseMinBudget(b.budget));
        } else if (sortBy === "price-desc") {
          filtered.sort((a, b) => parseMinBudget(b.budget) - parseMinBudget(a.budget));
        } else if (sortBy === "duration") {
          filtered.sort((a, b) => parseMinDays(a.days) - parseMinDays(b.days));
        } else if (sortBy === "name-asc") {
          filtered.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === "name-desc") {
          filtered.sort((a, b) => b.name.localeCompare(a.name));
        }

        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / 9) || 1;
        const safePage = Math.min(page, totalPages);
        const startIndex = (safePage - 1) * 9;
        const paginatedItems = filtered.slice(startIndex, startIndex + 9);

        if (!cancelled) {
          setDestinations(paginatedItems);
          setPagination({
            page: safePage,
            limit: 9,
            totalItems,
            totalPages,
            hasNextPage: safePage < totalPages,
            hasPreviousPage: safePage > 1,
          });
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) setLoading(false);
      }
    }

    loadDestinations();

    return () => {
      cancelled = true;
    };
  }, [page, query, country, region, category, mood, budgetTier, durationTier, sortBy, themeTab, remoteDestinations]);

  function changePage(nextPage) {
    if (nextPage < 1 || nextPage > pagination.totalPages) return;
    applyFilters({ newPage: nextPage });
    window.scrollTo({ top: 320, behavior: "smooth" });
  }

  const safeSavedIds = Array.isArray(savedIds) ? savedIds : [];

  // Determine if any filters are active
  const hasActiveFilters = Boolean(
    query.trim() ||
      (mood && mood !== "All" && mood !== "") ||
      (category && category !== "All") ||
      (country && country !== "All") ||
      (region && region !== "All") ||
      (budgetTier && budgetTier !== "All") ||
      (durationTier && durationTier !== "All") ||
      (themeTab && themeTab !== "all")
  );

  // Dynamic EaseMyTrip banner headers & visual
  const bannerTitle = useMemo(() => {
    if (query.trim()) return `"${query.trim()}" Tour Packages`;
    if (region === "himachal") return "Himachal Pradesh Tour Packages";
    if (region === "uttarakhand") return "Uttarakhand & Hills Tour Packages";
    if (region === "south") return "Kerala & South India Holiday Packages";
    if (region === "heritage") return "Rajasthan & Royal Heritage Packages";
    if (region === "coastal") return "Goa & Coastal Beach Holidays";
    if (region === "kashmir") return "Kashmir & Ladakh Tour Packages";
    if (region === "northeast") return "Northeast & Himalayan Tea Hills Packages";
    if (country === "India") return "Incredible India Holiday Tour Packages";
    if (country === "World") return "International Getaways & World Tours";
    return "India & Global Holiday Packages";
  }, [query, region, country]);

  // Helper to render heading with cursive script accent on last word
  const styledBannerTitle = useMemo(() => {
    if (!bannerTitle) return "";
    const parts = bannerTitle.trim().split(" ");
    if (parts.length <= 1) return bannerTitle;
    const last = parts.pop();
    return (
      <>
        {parts.join(" ")} <span className="script-accent">{last}</span>
      </>
    );
  }, [bannerTitle]);

  const bannerSubtitle = useMemo(() => {
    if (
      region === "himachal" ||
      query.toLowerCase().includes("himachal") ||
      query.toLowerCase().includes("manali") ||
      query.toLowerCase().includes("spiti")
    ) {
      return "Explore snow-capped Himalayan peaks, pine-scented valleys, Rohtang Pass, Solang adventure & handpicked mountain chalets with 24/7 concierge.";
    }
    if (region === "south") {
      return "Misty tea hills in Munnar, tranquil Alleppey backwater houseboats, quiet Varkala cliffs, and authentic spice estates.";
    }
    if (region === "heritage") {
      return "Majestic palaces of Udaipur, pink boulevards of Jaipur, golden desert dunes of Jaisalmer, and regal heritage dinners.";
    }
    if (region === "coastal") {
      return "Golden sandy beaches of Goa, Portuguese heritage quarters, quiet cliffside lagoons, and private sunset boat rides.";
    }
    return "Curated multi-day itineraries with verified premium stays, transfers, local sightseeing & 24/7 dedicated travel concierge.";
  }, [region, query]);

  const bannerBg = useMemo(() => {
    if (
      region === "himachal" ||
      query.toLowerCase().includes("himachal") ||
      query.toLowerCase().includes("manali") ||
      query.toLowerCase().includes("spiti")
    ) {
      return "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1920&q=80";
    }
    if (region === "south" || query.toLowerCase().includes("kerala")) {
      return "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1920&q=80";
    }
    if (region === "heritage" || query.toLowerCase().includes("rajasthan")) {
      return "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=1920&q=80";
    }
    if (region === "coastal" || query.toLowerCase().includes("goa")) {
      return "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1920&q=80";
    }
    return "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80";
  }, [region, query]);

  return (
    <main className="page-main discover-page">
      {/* 1. EASEMYTRIP HOLIDAY LISTING BANNER (Hidden when embedded in user dashboard) */}
      {!hideHeroBanner && (
        <section
          className="emt-listing-banner"
          style={{ backgroundImage: `url(${bannerBg})` }}
        >
        <div className="emt-banner-overlay" />
        <div className="container emt-banner-content">
          {/* Breadcrumb row */}
          <nav className="emt-listing-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="sep">&gt;</span>
            <Link to="/discover">Holidays</Link>
            <span className="sep">&gt;</span>
            <Link to="/discover?country=India">Domestic Packages</Link>
            <span className="sep">&gt;</span>
            <span className="current">{bannerTitle}</span>
          </nav>

          <h1 className="emt-banner-title">{styledBannerTitle}</h1>
          <p className="emt-banner-sub">{bannerSubtitle}</p>

          {/* Dual Floating Search Bar (EaseMyTrip Style) */}
          <form
            className="emt-search-bar"
            onSubmit={(e) => {
              e.preventDefault();
              applyFilters({ newQuery: query, newPage: 1 });
            }}
          >
            <div className="emt-search-col">
              <div>
                <label>
                  <MapPin size={11} style={{ display: "inline", verticalAlign: "middle", marginRight: 3, color: "#2093ef" }} />
                  Departure City
                </label>
                <select
                  value={departureCity}
                  onChange={(e) => setDepartureCity(e.target.value)}
                  aria-label="Select departure city"
                >
                  <option value="Delhi (DEL)">New Delhi (DEL)</option>
                  <option value="Mumbai (BOM)">Mumbai (BOM)</option>
                  <option value="Bengaluru (BLR)">Bengaluru (BLR)</option>
                  <option value="Kolkata (CCU)">Kolkata (CCU)</option>
                  <option value="Hyderabad (HYD)">Hyderabad (HYD)</option>
                  <option value="Chennai (MAA)">Chennai (MAA)</option>
                  <option value="Chandigarh (IXC)">Chandigarh (IXC)</option>
                  <option value="Any City">All Departure Hubs</option>
                </select>
              </div>
            </div>

            <div className="emt-search-divider" />

            <div className="emt-search-col">
              <div style={{ width: "100%" }}>
                <label>
                  <Compass size={11} style={{ display: "inline", verticalAlign: "middle", marginRight: 3, color: "#f97316" }} />
                  Destination / Package
                </label>
                <input
                  type="text"
                  placeholder="e.g. Himachal, Manali, Kerala, Spiti..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    applyFilters({ newQuery: e.target.value, newPage: 1 });
                  }}
                  aria-label="Search destination or package"
                />
              </div>
              {query && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => {
                    setQuery("");
                    applyFilters({ newQuery: "", newPage: 1 });
                  }}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button type="submit" className="emt-search-btn">
              SEARCH PACKAGES
            </button>
          </form>

          {/* Quick Popular Tags */}
          <div className="emt-banner-pills">
            {[
              { label: "🏔️ Himachal Pradesh", q: "Manali", reg: "himachal" },
              { label: "❄️ Spiti Expeditions", q: "Spiti", reg: "himachal" },
              { label: "🌴 Kerala Backwaters", q: "Munnar", reg: "south" },
              { label: "🏰 Royal Udaipur", q: "Udaipur", reg: "heritage" },
              { label: "🌊 Goa Beach Escapes", q: "Goa", reg: "coastal" },
              { label: "🛕 Spiritual Rishikesh", q: "Rishikesh", reg: "uttarakhand" },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                className="emt-banner-pill-btn"
                onClick={() => {
                  setQuery(chip.q);
                  setRegion(chip.reg);
                  applyFilters({ newQuery: chip.q, newRegion: chip.reg, newPage: 1 });
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* 2. STATE CHIPS, THEME TABS & FILTER PANEL */}
      <section className="container discover-content">
        {!hideHeroBanner && (
          <>
            {/* Horizontal State & Region Quick Chips (EaseMyTrip Style) */}
            <div className="emt-state-chips-bar" role="toolbar" aria-label="Region filters">
              {INDIAN_REGIONS.map((r) => {
                const isChipActive = region === r.id || (r.id === "All" && (!region || region === "All"));
                return (
                  <button
                    key={r.id}
                    type="button"
                    className={`emt-state-chip ${isChipActive ? "active" : ""}`}
                    onClick={() => {
                      const nextReg = r.id === region && r.id !== "All" ? "All" : r.id;
                      setRegion(nextReg);
                      applyFilters({ newRegion: nextReg, newPage: 1 });
                    }}
                  >
                    <span>{r.icon}</span>
                    <span>{r.label}</span>
                    {isChipActive && r.id !== "All" && (
                      <span className="chip-close" title="Clear filter">×</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* EaseMyTrip Theme Tabs Row */}
            <div className="emt-theme-tabs-row" role="tablist" aria-label="Package Themes">
              {THEME_TABS.map((tab) => {
                const isTabActive = themeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`emt-theme-tab ${isTabActive ? "active" : ""}`}
                    onClick={() => {
                      setThemeTab(tab.id);
                      applyFilters({ newTheme: tab.id, newPage: 1 });
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Travel Mood Pills Bar */}
            <div className="discover-mood-pills-bar" role="toolbar" aria-label="Mood filters">
              {MOOD_PILLS.map((pill) => {
                const isSelected =
                  (!mood && pill.id === "") ||
                  (mood && mood.toLowerCase() === pill.id.toLowerCase());

                return (
                  <button
                    key={pill.id || "all-moods"}
                    type="button"
                    className={`discover-mood-pill ${isSelected ? "active" : ""}`}
                    onClick={() => {
                      setMood(pill.id);
                      applyFilters({ newMood: pill.id, newPage: 1 });
                    }}
                    aria-pressed={isSelected}
                    title={pill.desc}
                  >
                    <span className="mood-pill-emoji">{pill.emoji}</span>
                    <span className="mood-pill-label">{pill.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* FILTER PANEL & ACTIVE CHIPS */}
        <div className="filter-panel">
          <div className="filter-panel-top">
            <div className="filter-heading">
              <SlidersHorizontal size={18} />
              <strong>Refine your journey</strong>
              <span className="filter-count-badge">
                {pagination.totalItems} {pagination.totalItems === 1 ? "match" : "matches"}
              </span>
            </div>

            <div className="sort-controls">
              <label>
                <ArrowUpDown size={14} /> Sort by:
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    applyFilters({ newSort: e.target.value, newPage: 1 });
                  }}
                  aria-label="Sort destinations"
                >
                  <option value="recommended">Curated / Recommended</option>
                  <option value="price-asc">Budget: Low to High (₹)</option>
                  <option value="price-desc">Budget: High to Low (₹)</option>
                  <option value="duration">Trip Duration: Shortest First</option>
                  <option value="name-asc">Name (A — Z)</option>
                  <option value="name-desc">Name (Z — A)</option>
                </select>
              </label>
            </div>
          </div>

          <div className="filter-controls">
            {/* Indian Region filter (active for India or All) */}
            {country !== "World" && (
              <label>
                <MapPin size={14} className="filter-label-icon" /> Region in India
                <select
                  value={region}
                  onChange={(event) => {
                    setRegion(event.target.value);
                    applyFilters({ newRegion: event.target.value, newPage: 1 });
                  }}
                >
                  {INDIAN_REGIONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.icon} {r.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {/* Budget filter in INR */}
            <label>
              <IndianRupee size={14} className="filter-label-icon" /> Budget Bracket (₹)
              <select
                value={budgetTier}
                onChange={(event) => {
                  setBudgetTier(event.target.value);
                  applyFilters({ newBudget: event.target.value, newPage: 1 });
                }}
              >
                {BUDGET_TIERS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </label>

            {/* Duration filter */}
            <label>
              <Clock size={14} className="filter-label-icon" /> Travel Duration
              <select
                value={durationTier}
                onChange={(event) => {
                  setDurationTier(event.target.value);
                  applyFilters({ newDuration: event.target.value, newPage: 1 });
                }}
              >
                {DURATION_TIERS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>

            {/* Category filter */}
            <label>
              Category
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  applyFilters({ newCategory: event.target.value, newPage: 1 });
                }}
              >
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item === "All" ? "All categories" : item}
                  </option>
                ))}
              </select>
            </label>

            {hasActiveFilters && (
              <button
                type="button"
                className="clear-filters"
                onClick={clearFilters}
              >
                <RotateCcw size={14} />
                Reset filters
              </button>
            )}
          </div>

          {/* ACTIVE FILTER CHIPS ROW */}
          {hasActiveFilters && (
            <div className="active-filters-row">
              <span className="active-filter-label">Active:</span>

              {query.trim() && (
                <span className="active-filter-chip">
                  Search: "{query}"
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      applyFilters({ newQuery: "", newPage: 1 });
                    }}
                    aria-label="Remove search filter"
                  >
                    <X size={13} />
                  </button>
                </span>
              )}

              {country !== "All" && (
                <span className="active-filter-chip">
                  Scope: {country === "India" ? "India" : "International"}
                  <button
                    type="button"
                    onClick={() => {
                      setCountry("All");
                      applyFilters({ newCountry: "All", newPage: 1 });
                    }}
                    aria-label="Remove country scope"
                  >
                    <X size={13} />
                  </button>
                </span>
              )}

              {region !== "All" && (
                <span className="active-filter-chip">
                  Region: {INDIAN_REGIONS.find((r) => r.id === region)?.label || region}
                  <button
                    type="button"
                    onClick={() => {
                      setRegion("All");
                      applyFilters({ newRegion: "All", newPage: 1 });
                    }}
                    aria-label="Remove region filter"
                  >
                    <X size={13} />
                  </button>
                </span>
              )}

              {mood && (
                <span className="active-filter-chip">
                  Mood: {mood}
                  <button
                    type="button"
                    onClick={() => {
                      setMood("");
                      applyFilters({ newMood: "", newPage: 1 });
                    }}
                    aria-label="Remove mood filter"
                  >
                    <X size={13} />
                  </button>
                </span>
              )}

              {budgetTier !== "All" && (
                <span className="active-filter-chip">
                  Budget: {BUDGET_TIERS.find((b) => b.id === budgetTier)?.label}
                  <button
                    type="button"
                    onClick={() => {
                      setBudgetTier("All");
                      applyFilters({ newBudget: "All", newPage: 1 });
                    }}
                    aria-label="Remove budget filter"
                  >
                    <X size={13} />
                  </button>
                </span>
              )}

              {durationTier !== "All" && (
                <span className="active-filter-chip">
                  Duration: {DURATION_TIERS.find((d) => d.id === durationTier)?.label}
                  <button
                    type="button"
                    onClick={() => {
                      setDurationTier("All");
                      applyFilters({ newDuration: "All", newPage: 1 });
                    }}
                    aria-label="Remove duration filter"
                  >
                    <X size={13} />
                  </button>
                </span>
              )}

              {category !== "All" && (
                <span className="active-filter-chip">
                  Category: {category}
                  <button
                    type="button"
                    onClick={() => {
                      setCategory("All");
                      applyFilters({ newCategory: "All", newPage: 1 });
                    }}
                    aria-label="Remove category filter"
                  >
                    <X size={13} />
                  </button>
                </span>
              )}

              {themeTab !== "all" && (
                <span className="active-filter-chip">
                  Theme: {THEME_TABS.find((t) => t.id === themeTab)?.label || themeTab}
                  <button
                    type="button"
                    onClick={() => {
                      setThemeTab("all");
                      applyFilters({ newTheme: "all", newPage: 1 });
                    }}
                    aria-label="Remove theme filter"
                  >
                    <X size={13} />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* RESULTS HEADER */}
        <div className="discover-results-heading">
          <div>
            <p className="eyebrow">
              <span className="eyebrow-line" />
              {country === "India" ? "DOMESTIC GETAWAYS" : country === "World" ? "GLOBAL EXPEDITIONS" : "CURATED ESCAPES"}
            </p>
            <h2>
              {country === "India" ? (
                <>
                  Handpicked Escapes Across <span className="script-accent">India</span>
                </>
              ) : country === "World" ? (
                <>
                  International Travel <span className="script-accent">Destinations</span>
                </>
              ) : (
                <>
                  Places Crafted Around How You <span className="script-accent">Feel</span>
                </>
              )}
            </h2>
            <p className="discover-results-sub">
              Showing <strong>{pagination.totalItems}</strong> {pagination.totalItems === 1 ? "journey" : "journeys"}
              {mood && <span> · Filtered by <strong>{mood}</strong> mood</span>}
              {country === "India" && <span> · Pricing in Indian Rupees (₹)</span>}
            </p>
          </div>
        </div>

        {/* DESTINATIONS GRID */}
        {loading ? (
          <div className="discover-message loading">
            <Compass className="spinning-icon" size={32} />
            <p>Finding beautiful places matching your travel mood...</p>
          </div>
        ) : destinations.length === 0 ? (
          <div className="discover-message empty">
            <Compass size={40} />
            <h3>No destinations match your exact filter combination</h3>
            <p>Try broadening your budget, duration, or region to discover more places.</p>
            <div className="empty-actions">
              <button type="button" className="button button-dark" onClick={clearFilters}>
                <RotateCcw size={16} /> Reset all filters
              </button>
              <button
                type="button"
                className="button button-outline"
                onClick={() => {
                  clearFilters();
                  setMood("peace");
                  applyFilters({ newMood: "peace", newPage: 1 });
                }}
              >
                🕊️ Explore peaceful hill escapes
              </button>
            </div>
          </div>
        ) : (
          <div className="destination-grid">
            {destinations.map((destination, idx) => (
              <DestinationCard
                key={destination.id || `dest-${idx}`}
                destination={destination}
                saved={safeSavedIds.includes(destination.id)}
                isSaved={safeSavedIds.includes(destination.id)}
                onToggleSave={onToggleSave}
                onBook={(dest) => setSelectedDestForBooking(dest)}
                index={idx}
              />
            ))}
          </div>
        )}

        {/* PAGINATION */}
        {!loading && pagination.totalPages > 1 && (
          <nav className="pagination" aria-label="Destination pages">
            <button
              type="button"
              disabled={!pagination.hasPreviousPage}
              onClick={() => changePage(page - 1)}
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
                aria-current={pageNumber === page ? "page" : undefined}
                onClick={() => changePage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}

            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => changePage(page + 1)}
            >
              Next
            </button>
          </nav>
        )}
      </section>

      {/* DIRECT IN-PAGE BOOKING MODAL */}
      <BookingModal
        isOpen={Boolean(selectedDestForBooking)}
        onClose={() => setSelectedDestForBooking(null)}
        destination={selectedDestForBooking}
        onBookingSuccess={(newBooking) => {
          setSelectedDestForBooking(null);
          if (typeof onBookingSuccess === "function") {
            onBookingSuccess(newBooking);
          }
        }}
      />
    </main>
  );
}
