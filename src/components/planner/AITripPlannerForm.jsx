import React, { useState } from "react";
import {
  Sparkles,
  MapPin,
  Calendar,
  Wallet,
  Users,
  Compass,
  Check,
  RotateCw,
  Sliders,
  ArrowRight
} from "lucide-react";
import { destinations } from "../../data/destinations.js";

const MOOD_OPTIONS = [
  { id: "Peace", label: "Peace & Serenity", emoji: "🌿" },
  { id: "Adventure", label: "Thrill & Adventure", emoji: "🏔️" },
  { id: "Culture", label: "Culture & Heritage", emoji: "🏛️" },
  { id: "Romance", label: "Romance & Scenic", emoji: "🌅" },
  { id: "Relaxation", label: "Coastal & Relaxation", emoji: "🌊" },
  { id: "Budget", label: "Smart & Budget", emoji: "🎒" }
];

const ACTIVITY_OPTIONS = [
  "Heritage Forts & Palaces",
  "Scenic Nature Trails",
  "Authentic Street & Local Food",
  "Sunrise & Sunset Photography",
  "Artisan Markets & Handicrafts",
  "High-Altitude Trekking",
  "Temple & Spiritual Walks",
  "Water Sports & Kayaking"
];

export default function AITripPlannerForm({
  onSubmit,
  isLoading,
  initialValues = {}
}) {
  const [origin, setOrigin] = useState(initialValues.origin || "");
  const [destination, setDestination] = useState(initialValues.destination || "Jaipur");
  const [days, setDays] = useState(initialValues.days || 3);
  const [budget, setBudget] = useState(initialValues.budget || 18000);
  const [travellers, setTravellers] = useState(initialValues.travellers || 2);
  const [mood, setMood] = useState(initialValues.mood || "Peace");
  const [selectedActivities, setSelectedActivities] = useState([
    "Heritage Forts & Palaces",
    "Authentic Street & Local Food"
  ]);
  const [travelDates, setTravelDates] = useState(initialValues.travelDates || "");

  function toggleActivity(act) {
    setSelectedActivities((prev) =>
      prev.includes(act) ? prev.filter((a) => a !== act) : [...prev, act]
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!destination.trim()) return;

    onSubmit({
      origin: origin.trim(),
      destination: destination.trim(),
      days: Number(days),
      budget: Number(budget),
      travellers: Number(travellers),
      mood,
      activities: selectedActivities,
      travelDates
    });
  }

  return (
    <form className="ai-form-card" onSubmit={handleSubmit}>
      <div className="ai-form-header">
        <div>
          <h2>
            <Sparkles size={22} color="#1b4332" />
            AI Trip Planner & Itinerary Architect
          </h2>
          <p>
            Craft a realistic, day-by-day travel schedule with verified geographic stops, routing, and estimated costs.
          </p>
        </div>
      </div>

      <div className="ai-form-grid">
        {/* DESTINATION */}
        <div className="ai-input-group">
          <label>Destination City / Region *</label>
          <select
            className="ai-input-field"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            required
          >
            {destinations.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name} ({d.state})
              </option>
            ))}
          </select>
        </div>

        {/* STARTING LOCATION */}
        <div className="ai-input-group">
          <label>Starting City / Origin (Optional)</label>
          <input
            type="text"
            className="ai-input-field"
            placeholder="e.g. Delhi, Mumbai, Bengaluru"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          />
        </div>

        {/* TRIP DURATION */}
        <div className="ai-input-group">
          <label>Duration: {days} Days</label>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            className="ai-input-field"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            style={{ padding: "4px 0", cursor: "pointer" }}
          />
        </div>

        {/* ESTIMATED TOTAL BUDGET */}
        <div className="ai-input-group">
          <label>Total Budget (INR): ₹{Number(budget).toLocaleString("en-IN")}</label>
          <input
            type="number"
            min="3000"
            max="500000"
            step="1000"
            className="ai-input-field"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>

        {/* NUMBER OF TRAVELLERS */}
        <div className="ai-input-group">
          <label>Travellers Count</label>
          <select
            className="ai-input-field"
            value={travellers}
            onChange={(e) => setTravellers(e.target.value)}
          >
            <option value="1">Solo Traveler (1 person)</option>
            <option value="2">Couple / Duo (2 people)</option>
            <option value="3">Small Group (3 people)</option>
            <option value="4">Family / Friends (4 people)</option>
            <option value="6">Group Escape (6+ people)</option>
          </select>
        </div>

        {/* TRAVEL DATES */}
        <div className="ai-input-group">
          <label>Travel Dates / Month (Optional)</label>
          <input
            type="text"
            className="ai-input-field"
            placeholder="e.g. Mid-November / Next Weekend"
            value={travelDates}
            onChange={(e) => setTravelDates(e.target.value)}
          />
        </div>
      </div>

      {/* TRAVEL MOOD */}
      <div style={{ marginTop: "10px", marginBottom: "16px" }}>
        <label style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", color: "#475569", letterSpacing: "0.5px" }}>
          Travel Mood
        </label>
        <div className="ai-chips-wrap">
          {MOOD_OPTIONS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`ai-chip-btn ${mood === m.id ? "active" : ""}`}
              onClick={() => setMood(m.id)}
            >
              <span>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* PREFERRED ACTIVITIES */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", color: "#475569", letterSpacing: "0.5px" }}>
          Preferred Experiences
        </label>
        <div className="ai-chips-wrap">
          {ACTIVITY_OPTIONS.map((act) => {
            const isSelected = selectedActivities.includes(act);
            return (
              <button
                key={act}
                type="button"
                className={`ai-chip-btn ${isSelected ? "active" : ""}`}
                onClick={() => toggleActivity(act)}
              >
                {isSelected && <Check size={12} />}
                <span>{act}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUBMIT BUTTON */}
      <div className="ai-form-actions">
        <button
          type="submit"
          className="ai-generate-btn"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <RotateCw size={17} className="admin-spinning" />
              <span>Synthesizing Mindful Itinerary & Map...</span>
            </>
          ) : (
            <>
              <Sparkles size={17} />
              <span>Generate AI Itinerary & Interactive Map</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

