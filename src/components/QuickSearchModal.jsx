import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Compass,
  MapPin,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { destinations as staticDestinations } from "../data/destinations.js";
import { getDestinations } from "../api/destinations.js";

const moodFilters = [
  "All",
  "Adventure",
  "Peace",
  "Nature",
  "Culture",
  "Romance",
  "Beach"
];

// Helper to safely extract an array of lower-case mood strings from any destination format
function getNormalizedMoods(dest) {
  if (!dest) return [];
  if (Array.isArray(dest.mood)) {
    return dest.mood.map((m) => String(m).toLowerCase());
  }
  if (typeof dest.mood === "string") {
    return [dest.mood.toLowerCase()];
  }
  if (typeof dest.category === "string") {
    return [dest.category.toLowerCase()];
  }
  return [];
}

export default function QuickSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [selectedMood, setSelectedMood] = useState("All");
  const [destList, setDestList] = useState(staticDestinations);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Sync with remote destinations if available
  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await getDestinations();
        const list = Array.isArray(res) ? res : res?.data || res?.destinations || [];
        if (isMounted && list.length > 0) {
          setDestList(list);
        }
      } catch {}
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global keydown listener for Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Filter destinations with 100% defensive checks
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filterMoodLower = selectedMood.toLowerCase();

    return destList.filter((d) => {
      const moods = getNormalizedMoods(d);
      const moodMatch =
        selectedMood === "All" ||
        moods.includes(filterMoodLower) ||
        String(d.category || "").toLowerCase() === filterMoodLower;

      if (!q) return moodMatch;

      const nameMatch = String(d.name || d.title || "").toLowerCase().includes(q);
      const locMatch = (String(d.state || "") + " " + String(d.country || "")).toLowerCase().includes(q);
      const descMatch = (String(d.description || "") + " " + String(d.subtitle || "")).toLowerCase().includes(q);
      const moodTextMatch = moods.some((m) => m.includes(q));

      return (nameMatch || locMatch || descMatch || moodTextMatch) && moodMatch;
    });
  }, [destList, query, selectedMood]);

  const handleSelect = (dest) => {
    if (!dest) return;
    onClose();
    navigate(`/destination/${dest.id || dest._id}`);
  };

  const handleKeyDownNav = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="roamly-modal-backdrop quicksearch-backdrop" onClick={onClose} role="dialog">
      <div
        className="quicksearch-modal"
        onClick={(e) => e.stopPropagation()}
        role="combobox"
        aria-expanded="true"
      >
        {/* SEARCH INPUT BAR */}
        <div className="quicksearch-input-wrap">
          <Search size={20} className="quicksearch-icon" />
          <input
            ref={inputRef}
            type="text"
            className="quicksearch-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDownNav}
            placeholder="Search destinations, moods (e.g. Nature, Beach), or cities..."
            aria-label="Search Roamly"
          />
          <button
            type="button"
            className="quicksearch-close-key"
            onClick={onClose}
            title="Close (Esc)"
          >
            <span className="kbd-pill">ESC</span>
          </button>
        </div>

        {/* QUICK MOOD PILL FILTERS */}
        <div className="quicksearch-mood-pills">
          {moodFilters.map((m) => (
            <button
              key={m}
              type="button"
              className={`mood-pill-btn ${selectedMood === m ? "active" : ""}`}
              onClick={() => setSelectedMood(m)}
            >
              {m}
            </button>
          ))}
        </div>

        {/* SEARCH RESULTS LIST */}
        <div className="quicksearch-results-list">
          {filtered.length === 0 ? (
            <div className="quicksearch-empty">
              <Compass size={32} color="#94a3b8" />
              <p>No destinations found for "{query}"</p>
              <small>Try searching "Munnar", "Jaipur", "Ladakh", or pick a mood filter above.</small>
            </div>
          ) : (
            filtered.slice(0, 7).map((item, idx) => {
              const displayMood = Array.isArray(item.mood)
                ? item.mood[0]
                : item.mood || item.category;

              const priceTag = item.budget || (item.price ? `₹${Number(item.price).toLocaleString("en-IN")}` : null);

              return (
                <div
                  key={item.id || item._id || idx}
                  className={`quicksearch-result-item ${selectedIndex === idx ? "selected" : ""}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <img
                    src={item.image || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=150&q=80"}
                    alt={item.name || "Destination"}
                    className="quicksearch-thumb"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=150&q=80";
                    }}
                  />

                  <div className="quicksearch-item-info">
                    <div className="quicksearch-item-title-row">
                      <strong>{item.name || item.title || "Destination"}</strong>
                      {displayMood && (
                        <span className="quicksearch-mood-tag">
                          {displayMood}
                        </span>
                      )}
                    </div>
                    <p>
                      <MapPin size={12} /> {item.state || item.country || "India"}
                    </p>
                  </div>

                  <div className="quicksearch-item-action">
                    {priceTag && <span className="item-price">{priceTag}</span>}
                    <ArrowRight size={15} className="arrow-jump" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* QUICK SEARCH FOOTER SHORTCUTS */}
        <div className="quicksearch-footer">
          <div className="footer-keys">
            <span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
            <span><kbd>↵</kbd> to select</span>
            <span><kbd>esc</kbd> to dismiss</span>
          </div>
          <span className="footer-hint">Travel by Mood • Roamly Concierge</span>
        </div>
      </div>
    </div>
  );
}
