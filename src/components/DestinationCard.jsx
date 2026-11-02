import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Hotel,
  Compass,
  Car,
  Utensils,
  ShieldCheck,
  Check,
  Star,
  MapPin,
  Clock,
  Sparkles
} from "lucide-react";

export default function DestinationCard({
  destination,
  saved = false,
  isSaved,
  onToggleSave,
  onBook,
  index = 0,
}) {
  if (!destination) return null;

  const isItemSaved = Boolean(saved || isSaved);

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof onToggleSave === "function") {
      onToggleSave(destination.id);
    }
  };

  const handleBookClick = (e) => {
    if (typeof onBook === "function") {
      e.preventDefault();
      e.stopPropagation();
      onBook(destination);
    }
  };

  // Format package pricing matching reference layout
  const rawBudget = String(destination.budget || destination.price || "9999");
  const priceMatch = rawBudget.replace(/[,\s]/g, "").match(/₹?(\d+)/);
  const currentPriceNum = priceMatch ? parseInt(priceMatch[1], 10) : 9999;
  const originalPriceNum = Math.round(currentPriceNum * 1.25);

  // Derive rating (4.8 - 4.95)
  const ratingValue = 4.8 + ((destination.name.length * 3) % 20) / 100;
  const reviewCount = 95 + ((destination.name.charCodeAt(0) * 7) % 180);

  // Normalize moods
  const moodList = Array.isArray(destination.mood)
    ? destination.mood
    : typeof destination.mood === "string"
      ? destination.mood.split(",").map((m) => m.trim())
      : ["Peace"];

  const primaryMood = moodList[0] || "Peace";

  return (
    <article className="pckg-card emt-card-v2" style={{ "--card-index": index }}>
      {/* 1. TOP PHOTO SECTION WITH SCRIM & OVERLAYS */}
      <div className="photo">
        {typeof onBook === "function" ? (
          <div
            role="button"
            tabIndex={0}
            className="emt-photo-link"
            onClick={handleBookClick}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleBookClick(e); }}
            aria-label={`Book or view ${destination.name} package`}
            style={{ cursor: "pointer" }}
          >
            <div className="ListImg">
              <img
                src={destination.image}
                alt={`${destination.name} Tour Package`}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src =
                    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80";
                }}
              />
            </div>
            <div className="scrim" />
          </div>
        ) : (
          <Link
            to={`/destination/${destination.id}`}
            className="emt-photo-link"
            aria-label={`View ${destination.name} package`}
          >
            <div className="ListImg">
              <img
                src={destination.image}
                alt={`${destination.name} Tour Package`}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src =
                    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80";
                }}
              />
            </div>
            <div className="scrim" />
          </Link>
        )}

        {/* Top Floating Row: Compare/Wishlist & Recommended Badge */}
        <div className="a-top">
          <button
            type="button"
            className={`a-compare ${isItemSaved ? "is-saved" : ""}`}
            onClick={handleToggle}
            title={isItemSaved ? "Saved to Wishlist" : "Save to Wishlist"}
          >
            <Heart
              size={13}
              fill={isItemSaved ? "#ef4444" : "none"}
              color={isItemSaved ? "#ef4444" : "#ffffff"}
            />
            <span>{isItemSaved ? "Saved" : "Save"}</span>
          </button>

          <span className="a-rec">
            <Sparkles size={11} />
            <span>RECOMMENDED</span>
          </span>
        </div>

        {/* Bottom Floating Info Overlaid Directly on Photo */}
        <div className="a-overlay">
          <span className="a-dur">
            <Clock size={12} />
            {destination.days || "3 Nights / 4 Days"}
          </span>

          {typeof onBook === "function" ? (
            <div
              role="button"
              tabIndex={0}
              onClick={handleBookClick}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleBookClick(e); }}
              className="a-title-link"
              style={{ cursor: "pointer" }}
            >
              <h3 className="a-title">{destination.name} Package Special</h3>
            </div>
          ) : (
            <Link to={`/destination/${destination.id}`} className="a-title-link">
              <h3 className="a-title">{destination.name} Package Special</h3>
            </Link>
          )}

          <div className="a-route">
            <span className="pin" />
            <span>
              {destination.state || destination.country || "India"} • {primaryMood} Mood
            </span>
          </div>
        </div>
      </div>

      {/* 2. CARD BODY: INCLUSIONS, HIGHLIGHTS & QUALITY SEAL */}
      <div className="a-body">
        {/* Inclusions Row with tooltips (EaseMyTrip Style) */}
        <div className="a-incl">
          <div className="incl" title="Curated Stays Included">
            <span className="ic hotel"><Hotel size={16} /></span>
            <span className="tip">Verified Stay</span>
          </div>
          <div className="incl" title="Sightseeing Tours Included">
            <span className="ic tour"><Compass size={16} /></span>
            <span className="tip">Sightseeing</span>
          </div>
          <div className="incl" title="Private Transfers Included">
            <span className="ic transit"><Car size={16} /></span>
            <span className="tip">Transfers</span>
          </div>
          <div className="incl" title="Meals Included">
            <span className="ic meals"><Utensils size={16} /></span>
            <span className="tip">Meals</span>
          </div>
          <div className="incl" title="24/7 Concierge Support">
            <span className="ic concierge"><ShieldCheck size={16} /></span>
            <span className="tip">24/7 Concierge</span>
          </div>
        </div>

        {/* Features Checklist */}
        <div className="a-feats">
          <div className="feat">
            <Check size={14} />
            <span>Curated for {moodList.slice(0, 2).join(" & ")} escapes</span>
          </div>
          <div className="feat">
            <Check size={14} />
            <span>Verified 4.8★ hospitality standards</span>
          </div>
        </div>

        {/* Card Footer: Pricing & Action Button */}
        <div className="a-foot">
          <div className="a-price">
            <div className="lbl">STARTING FROM</div>
            <div className="price-saving-row">
              <span className="strike">₹{originalPriceNum.toLocaleString("en-IN")}</span>
              <span className="save-tag">25% OFF</span>
            </div>
            <div className="now">
              ₹{currentPriceNum.toLocaleString("en-IN")}
            </div>
            <div className="pp">Per Person</div>
          </div>

          <div className="emt-card-actions">
            {typeof onBook === "function" ? (
              <button
                type="button"
                className="a-book"
                onClick={handleBookClick}
              >
                BOOK NOW
              </button>
            ) : (
              <Link
                to={`/destination/${destination.id}`}
                className="a-book"
              >
                BOOK NOW
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 3. BOTTOM ASSURANCE STRIP */}
      <div className="emi">
        <span className="ei">
          <ShieldCheck size={14} />
        </span>
        <span>
          Roamly Verified • <b>Free Date Change</b> Available
        </span>
        <span className="chsemi">Concierge 24/7 →</span>
      </div>
    </article>
  );
}
