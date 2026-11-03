import React, { useState } from "react";
import {
  Sparkles,
  Calendar,
  Clock,
  Compass,
  MapPin,
  RefreshCw,
  Bookmark,
  Share2,
  Printer,
  ChevronDown,
  ChevronUp,
  Check,
  AlertCircle,
  Hotel,
  Coffee,
  Sun,
  Sunset,
  Moon,
  DollarSign,
  Info
} from "lucide-react";

export default function ItineraryTimeline({
  itinerary,
  onRegenerateDay,
  onSaveTrip,
  onOpenSavedTrips,
  onBookTrip,
  isSaving,
  isLoggedIn,
  isRegeneratingDay
}) {
  const [expandedDays, setExpandedDays] = useState(() => {
    // Expand all days by default
    const map = {};
    (itinerary?.days || []).forEach((d) => {
      map[d.dayNumber] = true;
    });
    return map;
  });

  const [regeneratingDayNum, setRegeneratingDayNum] = useState(null);

  if (!itinerary) return null;

  const {
    tripTitle,
    summary,
    destination,
    durationDays,
    travellers,
    mood,
    estimatedCosts,
    days = [],
    practicalTips = [],
    disclaimer
  } = itinerary;

  function toggleDay(dayNum) {
    setExpandedDays((prev) => ({
      ...prev,
      [dayNum]: !prev[dayNum]
    }));
  }

  async function handleDayRegen(dayNum) {
    setRegeneratingDayNum(dayNum);
    try {
      await onRegenerateDay(dayNum);
    } finally {
      setRegeneratingDayNum(null);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="timeline-card-wrapper">
      {/* ITINERARY META HEADER */}
      <div className="itinerary-meta-header">
        <div className="itinerary-title-area">
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {mood} • {durationDays} Days • {travellers} Traveller(s)
          </span>
          <h3>{tripTitle}</h3>
          <p>{summary}</p>
        </div>

        <div className="itinerary-header-actions">
          {onBookTrip && (
            <button
              type="button"
              className="admin-primary-button"
              style={{ background: "#1b4332", borderColor: "#1b4332", color: "#ffffff" }}
              onClick={() => onBookTrip(destination)}
              title="Book verified stay or package for this destination"
            >
              <Calendar size={14} /> Book Trip
            </button>
          )}

          <button
            type="button"
            className="admin-primary-button"
            onClick={onSaveTrip}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <RefreshCw size={14} className="admin-spinning" /> Saving...
              </>
            ) : (
              <>
                <Bookmark size={14} /> Save Trip
              </>
            )}
          </button>

          <button
            type="button"
            className="admin-secondary-button"
            onClick={onOpenSavedTrips}
            title="View your saved itineraries"
          >
            <Compass size={14} /> My Saved Trips
          </button>

          <button
            type="button"
            className="admin-secondary-button"
            onClick={handlePrint}
            title="Print or save as PDF"
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {/* ESTIMATED COSTS SUMMARY STRIP */}
      {estimatedCosts && (
        <div className="costs-summary-strip">
          <div className="cost-item">
            <small>Transit & Cab</small>
            <strong>₹{Number(estimatedCosts.transport || 0).toLocaleString("en-IN")}</strong>
          </div>
          <div className="cost-item">
            <small>Stays & Resorts</small>
            <strong>₹{Number(estimatedCosts.stay || 0).toLocaleString("en-IN")}</strong>
          </div>
          <div className="cost-item">
            <small>Meals & Dining</small>
            <strong>₹{Number(estimatedCosts.food || 0).toLocaleString("en-IN")}</strong>
          </div>
          <div className="cost-item total-cost">
            <small>Total Estimated</small>
            <strong>₹{Number(estimatedCosts.total || 0).toLocaleString("en-IN")}</strong>
          </div>
        </div>
      )}

      {/* DAY-BY-DAY CARDS */}
      {days.map((day) => {
        const isOpen = expandedDays[day.dayNumber] !== false;
        const isThisRegenerating = regeneratingDayNum === day.dayNumber;

        return (
          <div key={day.dayNumber} className="day-plan-card">
            {/* DAY HEADER */}
            <div className="day-header">
              <div className="day-title-badge" onClick={() => toggleDay(day.dayNumber)} style={{ cursor: "pointer" }}>
                <span className="day-badge-num">Day {day.dayNumber}</span>
                <h4>{day.theme || `Exploration in ${destination}`}</h4>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  type="button"
                  className="day-regen-btn"
                  onClick={() => handleDayRegen(day.dayNumber)}
                  disabled={isThisRegenerating || isRegeneratingDay}
                  title="Re-roll morning, afternoon & evening activities for this day"
                >
                  <RefreshCw size={12} className={isThisRegenerating ? "admin-spinning" : ""} />
                  <span>{isThisRegenerating ? "Regenerating..." : "Regenerate Day"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleDay(day.dayNumber)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b", padding: "4px" }}
                  aria-label="Toggle day details"
                >
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>

            {/* DAY SLOTS CONTENT */}
            {isOpen && (
              <>
                <div className="day-slots-list">
                  {/* MORNING */}
                  {day.morning && (
                    <div className="slot-item">
                      <span className="slot-time-badge">
                        <Sun size={11} style={{ display: "inline", marginRight: "3px" }} />
                        {day.morning.time || "Morning"}
                      </span>
                      <div className="slot-content">
                        <h5>{day.morning.title || day.morning.place}</h5>
                        <p>{day.morning.description}</p>
                        <div style={{ display: "flex", gap: "10px", marginTop: "4px", fontSize: "0.74rem", color: "#64748b" }}>
                          <span><MapPin size={11} style={{ display: "inline" }} /> {day.morning.place}</span>
                          {day.morning.cost > 0 && <span>Est. ₹{day.morning.cost}</span>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AFTERNOON */}
                  {day.afternoon && (
                    <div className="slot-item">
                      <span className="slot-time-badge" style={{ background: "#fef3c7", color: "#92400e" }}>
                        <Coffee size={11} style={{ display: "inline", marginRight: "3px" }} />
                        {day.afternoon.time || "Afternoon"}
                      </span>
                      <div className="slot-content">
                        <h5>{day.afternoon.title || day.afternoon.place}</h5>
                        <p>{day.afternoon.description}</p>
                        <div style={{ display: "flex", gap: "10px", marginTop: "4px", fontSize: "0.74rem", color: "#64748b" }}>
                          <span><MapPin size={11} style={{ display: "inline" }} /> {day.afternoon.place}</span>
                          {day.afternoon.cost > 0 && <span>Est. ₹{day.afternoon.cost}</span>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* EVENING */}
                  {day.evening && (
                    <div className="slot-item">
                      <span className="slot-time-badge" style={{ background: "#ecfdf5", color: "#065f46" }}>
                        <Sunset size={11} style={{ display: "inline", marginRight: "3px" }} />
                        {day.evening.time || "Evening"}
                      </span>
                      <div className="slot-content">
                        <h5>{day.evening.title || day.evening.place}</h5>
                        <p>{day.evening.description}</p>
                        <div style={{ display: "flex", gap: "10px", marginTop: "4px", fontSize: "0.74rem", color: "#64748b" }}>
                          <span><MapPin size={11} style={{ display: "inline" }} /> {day.evening.place}</span>
                          {day.evening.cost > 0 && <span>Est. ₹{day.evening.cost}</span>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* RECOMMENDED STAY FOR NIGHT */}
                {day.stayRecommendation && (
                  <div className="day-stay-footer">
                    <Hotel size={13} color="#1b4332" />
                    <span>Suggested Stay: <strong>{day.stayRecommendation}</strong></span>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      {/* PRACTICAL LOCAL TIPS */}
      {practicalTips && practicalTips.length > 0 && (
        <div className="practical-tips-box">
          <h4>
            <Info size={16} />
            Practical Local Advice & Mindful Travel Tips
          </h4>
          <ul>
            {practicalTips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* TRANSPARENT DISCLAIMER */}
      <p className="planner-disclaimer">
        {disclaimer || "Estimated guidance based on typical seasonal rates. Does not constitute guaranteed live inventory or fixed prices."}
      </p>
    </div>
  );
}

