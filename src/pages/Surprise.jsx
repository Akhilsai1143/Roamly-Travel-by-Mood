import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  RefreshCw,
  Sparkles,
  Heart,
  Calendar,
  MapPin,
  Compass,
  Clock,
  IndianRupee,
  Dices,
  Mountain,
  Trees,
  Waves,
  Landmark,
  ChevronRight
} from "lucide-react";
import { destinations } from "../data/destinations";

// Serendipity preference moods for guided spontaneity
const SERENDIPITY_PRESETS = [
  { id: "all", label: "✨ Anything Goes", icon: "✨" },
  { id: "india", label: "🇮🇳 Indian Escapes", icon: "🇮🇳" },
  { id: "peace", label: "🕊️ Mountain Calm", icon: "🕊️" },
  { id: "adventure", label: "🏔️ Thrill & Trails", icon: "🏔️" },
  { id: "romance", label: "🌅 Sunset Romance", icon: "🌅" },
  { id: "coastal", label: "🌊 Ocean & Shores", icon: "🌊" },
];

export default function Surprise({ savedIds = [], onToggleSave }) {
  const [picked, setPicked] = useState(null);
  const [lastId, setLastId] = useState("");
  const [animating, setAnimating] = useState(false);
  const [activePreset, setActivePreset] = useState("all");
  const [tickerName, setTickerName] = useState("");

  function surprise() {
    if (animating) return;
    setAnimating(true);

    // Filter choices according to active preset
    let pool = Array.isArray(destinations) ? [...destinations] : [];

    if (activePreset === "india") {
      pool = pool.filter((d) => d.country === "India");
    } else if (activePreset === "peace") {
      pool = pool.filter((d) =>
        Array.isArray(d.mood)
          ? d.mood.some((m) => m.toLowerCase().includes("peace"))
          : String(d.mood).toLowerCase().includes("peace")
      );
    } else if (activePreset === "adventure") {
      pool = pool.filter((d) =>
        Array.isArray(d.mood)
          ? d.mood.some((m) => m.toLowerCase().includes("adventure"))
          : String(d.mood).toLowerCase().includes("adventure")
      );
    } else if (activePreset === "romance") {
      pool = pool.filter((d) =>
        Array.isArray(d.mood)
          ? d.mood.some((m) => m.toLowerCase().includes("romance"))
          : String(d.mood).toLowerCase().includes("romance")
      );
    } else if (activePreset === "coastal") {
      pool = pool.filter((d) =>
        d.category === "Beach" ||
        d.category === "Island" ||
        d.name === "Goa" ||
        d.name === "Gokarna" ||
        d.name === "Varkala"
      );
    }

    if (pool.length === 0) pool = [...destinations];

    const choices = pool.filter((d) => d.id !== lastId);
    const finalPool = choices.length > 0 ? choices : pool;
    const next = finalPool[Math.floor(Math.random() * finalPool.length)];

    // Fun slot-machine style ticker animation before landing
    let tickerIndex = 0;
    const tickerInterval = setInterval(() => {
      const randomDest = finalPool[Math.floor(Math.random() * finalPool.length)];
      if (randomDest) {
        setTickerName(randomDest.name);
      }
      tickerIndex++;
      if (tickerIndex > 6) {
        clearInterval(tickerInterval);
        setPicked(next);
        setLastId(next.id);
        setAnimating(false);
        setTickerName("");
      }
    }, 80);
  }

  const safeSavedIds = Array.isArray(savedIds) ? savedIds : [];
  const isSaved = picked ? safeSavedIds.includes(picked.id) : false;

  const moodList = picked
    ? Array.isArray(picked.mood)
      ? picked.mood
      : typeof picked.mood === "string"
        ? picked.mood.split(",").map((m) => m.trim())
        : []
    : [];

  // Extract starting price in INR
  const budgetStr = picked?.budget || "₹8,000–₹14,000";
  const startPriceMatch = budgetStr.match(/₹[\d,]+/);
  const startPrice = startPriceMatch ? startPriceMatch[0] : "₹8,000";

  return (
    <main className="page-main surprise-page">
      <div className="container surprise-page-inner">
        <Link to="/discover" className="back-link">
          <span>←</span> Back to discovery
        </Link>

        <div className="surprise-header-block">
          <div className="surprise-page-kicker">
            <Sparkles size={16} /> THE SERENDIPITY MACHINE
          </div>

          <h1>
            What if you went
            <br />
            somewhere <span className="script-accent">unexpected?</span>
          </h1>

          <p className="surprise-intro">
            No endless decision paralysis. No travel fatigue. Just a spontaneous nudge
            toward a remarkable escape curated around genuine feeling and transparent ₹ INR pricing.
          </p>

          {/* SERENDIPITY PRESET SELECTOR */}
          <div className="surprise-presets-bar">
            <span className="presets-title">Spontaneity Guide:</span>
            {SERENDIPITY_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`preset-chip ${activePreset === p.id ? "active" : ""}`}
                onClick={() => {
                  setActivePreset(p.id);
                  if (picked) surprise();
                }}
              >
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* RESULT / ART BOX */}
        <div className={`surprise-result ${picked ? "has-pick" : ""} ${animating ? "is-shuffling" : ""}`}>
          {animating ? (
            <div className="surprise-shuffling-box">
              <div className="surprise-orbit orbit-one spinning-orbit" />
              <div className="surprise-orbit orbit-two spinning-orbit-reverse" />
              <Compass size={48} className="shuffling-compass" />
              <h3 className="ticker-text">{tickerName || "Spinning the globe…"}</h3>
              <p>Searching through curated escapes across India & beyond…</p>
            </div>
          ) : picked ? (
            <div className="surprise-card">
              <div className="surprise-img-wrap">
                <img
                  src={picked.image}
                  alt={picked.name}
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80";
                  }}
                />
                <div className="surprise-img-overlay" />
                <span className="surprise-category-badge">{picked.category || "Escape"}</span>
                <span className="surprise-country-badge">{picked.country || "India"}</span>
              </div>

              <div className="surprise-result-copy">
                <div className="surprise-result-eyebrow">
                  <Sparkles size={14} />
                  <span>YOUR SERENDIPITOUS MATCH</span>
                </div>

                <h2>
                  {picked.name}
                  <span>.</span>
                </h2>

                <p className="surprise-location">
                  <MapPin size={15} /> {picked.state || picked.country || "India"}
                </p>

                <p className="surprise-desc">{picked.description}</p>

                {/* Mood Tags */}
                {moodList.length > 0 && (
                  <div className="surprise-mood-tags">
                    {moodList.map((m) => (
                      <span key={m} className="surprise-mood-pill">
                        {m}
                      </span>
                    ))}
                  </div>
                )}

                {/* Hidden Gem Callout */}
                {picked.hiddenGem && (
                  <div className="surprise-gem-box">
                    <Sparkles size={14} />
                    <span><strong>Local Gem:</strong> {picked.hiddenGem}</span>
                  </div>
                )}

                {/* Practical Details */}
                <div className="surprise-meta-row">
                  <div className="surprise-meta-item">
                    <Clock size={14} />
                    <span>{picked.days || "3–4 Days"}</span>
                  </div>
                  <div className="surprise-meta-item price">
                    <span className="price-sub">Starts at</span>
                    <strong>{startPrice}</strong>
                    <span className="price-sub">/ traveler</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="surprise-actions-row">
                  <Link
                    to={`/destination/${picked.id}`}
                    className="button button-dark surprise-primary-btn"
                  >
                    Explore field guide <ArrowRight size={16} />
                  </Link>

                  <Link
                    to={`/planner?destination=${encodeURIComponent(picked.id)}`}
                    className="button button-outline surprise-plan-btn"
                  >
                    <Calendar size={15} /> Plan trip
                  </Link>

                  <button
                    type="button"
                    className={`button ${isSaved ? "button-saved" : "button-light"} surprise-save-btn`}
                    onClick={() => onToggleSave && onToggleSave(picked.id)}
                    title={isSaved ? "Remove from wishlist" : "Save to wishlist"}
                  >
                    <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
                    <span>{isSaved ? "Saved" : "Save"}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="surprise-placeholder">
              <div className="surprise-orbit orbit-one" />
              <div className="surprise-orbit orbit-two" />
              <div className="surprise-sun" />
              <div className="art-circle">
                <Compass size={40} className="art-compass-icon" />
              </div>
              <div className="placeholder-copy">
                <h3>The globe is waiting for you</h3>
                <p>Click the button below to spin the serendipity wheel and receive an unexpected escape.</p>
              </div>
            </div>
          )}
        </div>

        {/* TRIGGER BUTTON */}
        <div className="surprise-action-wrap">
          <button
            type="button"
            className="button button-dark surprise-action-btn"
            onClick={surprise}
            disabled={animating}
          >
            <RefreshCw size={18} className={animating ? "spinning-icon" : ""} />
            <span>{picked ? "Spin again for another surprise" : "Spin the Serendipity Machine"}</span>
            <Sparkles size={16} />
          </button>

          <span className="surprise-disclaimer">
            Curated picks from Roamly's collection of thoughtful escapes across India and beyond. Every journey includes verified local tips and transparent ₹ INR budgeting.
          </span>
        </div>
      </div>
    </main>
  );
}
