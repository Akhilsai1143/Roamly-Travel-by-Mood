import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Compass,
  ArrowRight,
  MapPin,
  CalendarDays,
  Sparkles,
  Search,
  Trash2,
  Calendar
} from "lucide-react";
import { destinations as allDestinations } from "../data/destinations.js";
import DestinationCard from "../components/DestinationCard.jsx";
import BookingModal from "../components/BookingModal.jsx";

export default function Wishlist({ savedIds = [], toggleSaved, onToggleSave, onBookingSuccess }) {
  const [filterCategory, setFilterCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDestForBooking, setSelectedDestForBooking] = useState(null);

  const handleToggle = onToggleSave || toggleSaved;
  const safeSavedIds = Array.isArray(savedIds) ? savedIds : [];

  // Find all destinations matching savedIds
  const savedDestinations = useMemo(() => {
    return allDestinations.filter((d) => safeSavedIds.includes(d.id));
  }, [safeSavedIds]);

  // Categories present in the user's saved list
  const availableCategories = useMemo(() => {
    const cats = new Set(["All"]);
    savedDestinations.forEach((d) => {
      if (d.category) cats.add(d.category);
    });
    return Array.from(cats);
  }, [savedDestinations]);

  // Filtered by category and search
  const displayedDestinations = useMemo(() => {
    let list = savedDestinations;

    if (filterCategory !== "All") {
      list = list.filter(
        (d) => d.category?.toLowerCase() === filterCategory.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.state && d.state.toLowerCase().includes(q)) ||
          (d.country && d.country.toLowerCase().includes(q))
      );
    }

    return list;
  }, [savedDestinations, filterCategory, searchQuery]);

  return (
    <main className="page-main wishlist-page">
      {/* WISHLIST HERO */}
      <section className="wishlist-hero">
        <div className="container">
          <div className="eyebrow">
            <span className="eyebrow-line" /> YOUR PERSONAL TRAVEL CURATION
          </div>

          <h1>
            Places you're <span className="script-accent">saving for later.</span>
          </h1>

          <p>
            A personal collection of retreats, scenic escapes, and future journeys.
            Take your time; the road will be waiting.
          </p>

          <div className="wishlist-stats-bar">
            <div className="wishlist-stat-item">
              <Heart size={18} className="wishlist-stat-icon" fill="currentColor" />
              <span>
                <strong>{savedDestinations.length}</strong>{" "}
                {savedDestinations.length === 1 ? "escape saved" : "escapes saved"}
              </span>
            </div>

            {savedDestinations.length > 0 && (
              <Link to="/planner" className="button button-dark wishlist-plan-btn">
                <Calendar size={16} /> Plan with these places <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* WISHLIST CONTENT */}
      <section className="container wishlist-content">
        {savedDestinations.length === 0 ? (
          /* EMPTY STATE */
          <div className="wishlist-empty-state">
            <div className="empty-icon-wrap">
              <Heart size={36} strokeWidth={1.5} />
            </div>
            <h2>Your travel wishlist is waiting.</h2>
            <p>
              You haven't saved any escapes yet. Explore places that match your mood,
              and tap the heart icon on any destination to keep it here.
            </p>
            <div className="empty-actions">
              <Link to="/discover" className="button button-dark">
                Explore destinations <ArrowRight size={16} />
              </Link>
              <Link to="/" className="button button-outline">
                Find your mood
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* FILTER & SEARCH CONTROLS */}
            <div className="wishlist-filter-bar">
              <div className="category-pills">
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`pill-btn ${filterCategory === cat ? "active" : ""}`}
                    onClick={() => setFilterCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {savedDestinations.length > 3 && (
                <div className="wishlist-search-box">
                  <Search size={16} />
                  <input
                    type="search"
                    placeholder="Filter saved places..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* SAVED DESTINATIONS GRID */}
            {displayedDestinations.length === 0 ? (
              <div className="wishlist-no-match">
                <p>No saved destinations match your current filter.</p>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => {
                    setFilterCategory("All");
                    setSearchQuery("");
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="destination-grid">
                {displayedDestinations.map((destination, idx) => (
                  <DestinationCard
                    key={destination.id}
                    destination={destination}
                    saved={true}
                    isSaved={true}
                    onToggleSave={handleToggle}
                    onBook={(dest) => setSelectedDestForBooking(dest)}
                    index={idx}
                  />
                ))}
              </div>
            )}
          </>
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
