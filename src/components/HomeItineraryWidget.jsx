import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  Clock,
  IndianRupee,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { destinations } from "../data/destinations.js";
import { getDestinationStructuredItinerary } from "../data/travelDetails.js";

const INTEREST_TAGS = [
  "Heritage & Forts",
  "High Passes & Lakes",
  "Tea Plantations",
  "Backwater Cruises",
  "Yoga & Wellness",
  "Culinary Trails",
  "Wildlife Safari",
  "Coastal Sunsets"
];

export default function HomeItineraryWidget() {
  const navigate = useNavigate();

  const [selectedDestId, setSelectedDestId] = useState("jaipur");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 18);
    return d.toISOString().split("T")[0];
  });
  const [travelers, setTravelers] = useState(2);
  const [budgetTier, setBudgetTier] = useState("comfort"); // "budget", "comfort", "luxury"
  const [selectedInterests, setSelectedInterests] = useState(["Heritage & Forts", "Culinary Trails"]);
  const [customStops, setCustomStops] = useState(() => {
    const stops = getDestinationStructuredItinerary("jaipur", 3);
    return stops.map((s, idx) => ({
      id: idx + 1,
      title: `${s.title}: ${s.activity}`,
      day: `Day ${s.day}`
    }));
  });
  const [newStopText, setNewStopText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleDestinationChange = (newDestId) => {
    setSelectedDestId(newDestId);
    const stops = getDestinationStructuredItinerary(newDestId, 3);
    setCustomStops(stops.map((s, idx) => ({
      id: idx + 1,
      title: `${s.title}: ${s.activity}`,
      day: `Day ${s.day}`
    })));
  };

  // Calculate duration in days and nights
  const durationInfo = useMemo(() => {
    if (!startDate || !endDate) return { days: 0, nights: 0, isValid: false };
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
    if (diffDays <= 0) return { days: 0, nights: 0, isValid: false };
    return {
      days: diffDays + 1,
      nights: diffDays,
      isValid: true
    };
  }, [startDate, endDate]);

  const toggleInterest = (interest) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleAddStop = (e) => {
    e.preventDefault();
    if (!newStopText.trim()) return;
    const nextDayNum = customStops.length + 1;
    setCustomStops((prev) => [
      ...prev,
      { id: Date.now(), title: newStopText.trim(), day: `Day ${nextDayNum}` }
    ]);
    setNewStopText("");
  };

  const handleRemoveStop = (id) => {
    setCustomStops((prev) => prev.filter((s) => s.id !== id));
  };

  const handleLaunchPlanner = () => {
    if (!durationInfo.isValid) {
      setErrorMessage("Please ensure your departure date is after your arrival date.");
      return;
    }
    setErrorMessage("");

    const destObj = destinations.find((d) => d.id === selectedDestId);

    // Save constructed itinerary to localStorage for Planner to load
    const customPlan = {
      id: `plan-${Date.now()}`,
      destinationId: selectedDestId,
      destinationName: destObj?.name || "India Escape",
      startDate,
      endDate,
      days: `${durationInfo.nights} Nights / ${durationInfo.days} Days`,
      travelers,
      budgetTier,
      interests: selectedInterests,
      stops: customStops,
      created: new Date().toISOString()
    };

    try {
      localStorage.setItem("roamly-active-custom-plan", JSON.stringify(customPlan));
    } catch {
      // LocalStorage access
    }

    navigate(`/planner?destination=${encodeURIComponent(selectedDestId)}`);
  };

  return (
    <section className="home-itinerary-builder-section" aria-label="Interactive Travel Itinerary Builder">
      <div className="container">
        {/* Section Header */}
        <div className="section-head-editorial">
          <div className="editorial-kicker">
            <Sparkles size={14} className="text-amber-400" />
            <span>CUSTOM JOURNEY PLANNER</span>
          </div>
          <h2 className="editorial-title">
            Build Your Own <span className="script-accent-gold">Itinerary.</span>
          </h2>
          <p className="editorial-subtitle">
            Tailor your departure dates, stops, pace, and travel interests. Save your plan and customize day-by-day schedules with Roamly.
          </p>
        </div>

        {/* Interactive Builder Container */}
        <div className="itinerary-builder-card">
          <div className="builder-grid">
            {/* 1. Destination & Travelers Row */}
            <div className="builder-field-group">
              <label htmlFor="itin-dest-select" className="builder-label">
                <MapPin size={15} className="text-amber-400" />
                <span>Select Destination</span>
              </label>
              <select
                id="itin-dest-select"
                className="builder-select"
                value={selectedDestId}
                onChange={(e) => handleDestinationChange(e.target.value)}
              >
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.state})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Start Date */}
            <div className="builder-field-group">
              <label htmlFor="itin-start-date" className="builder-label">
                <Calendar size={15} className="text-sky-400" />
                <span>Arrival Date</span>
              </label>
              <input
                id="itin-start-date"
                type="date"
                className="builder-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* 3. End Date */}
            <div className="builder-field-group">
              <label htmlFor="itin-end-date" className="builder-label">
                <Calendar size={15} className="text-sky-400" />
                <span>Departure Date</span>
              </label>
              <input
                id="itin-end-date"
                type="date"
                className="builder-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* 4. Number of Travelers */}
            <div className="builder-field-group">
              <label className="builder-label">
                <Users size={15} className="text-emerald-400" />
                <span>Travelers</span>
              </label>
              <div className="traveler-counter-row">
                <button
                  type="button"
                  className="counter-btn"
                  onClick={() => setTravelers((prev) => Math.max(1, prev - 1))}
                  aria-label="Decrease travelers"
                >
                  -
                </button>
                <span className="counter-val">{travelers} {travelers === 1 ? "Traveler" : "Travelers"}</span>
                <button
                  type="button"
                  className="counter-btn"
                  onClick={() => setTravelers((prev) => Math.min(10, prev + 1))}
                  aria-label="Increase travelers"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Calculated Duration Banner */}
          <div className="builder-duration-banner">
            <div className="duration-pill">
              <Clock size={15} className="text-amber-400" />
              <span>
                Calculated Trip Duration:{" "}
                <strong>
                  {durationInfo.isValid
                    ? `${durationInfo.nights} Nights / ${durationInfo.days} Days`
                    : "Please pick valid dates"}
                </strong>
              </span>
            </div>

            {/* Budget Tier Radio Pills */}
            <div className="budget-tier-group" role="group" aria-label="Budget Tier">
              <span className="budget-label">Travel Style:</span>
              {[
                { id: "budget", label: "Value / Backpacker" },
                { id: "comfort", label: "Comfort / Heritage" },
                { id: "luxury", label: "Luxury / Royal" }
              ].map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  className={`tier-pill ${budgetTier === tier.id ? "active" : ""}`}
                  onClick={() => setBudgetTier(tier.id)}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          {/* Travel Interests Tag Cloud */}
          <div className="builder-interests-section">
            <label className="builder-label">
              <Sparkles size={15} className="text-amber-400" />
              <span>Select Travel Interests</span>
            </label>
            <div className="interests-pill-cloud">
              {INTEREST_TAGS.map((tag) => {
                const isSelected = selectedInterests.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`interest-tag-pill ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleInterest(tag)}
                  >
                    <span>{tag}</span>
                    {isSelected && <CheckCircle2 size={13} className="ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Daily Itinerary Stops Builder */}
          <div className="builder-stops-section">
            <label className="builder-label">
              <Clock size={15} className="text-amber-400" />
              <span>Planned Itinerary Stops & Highlights ({customStops.length})</span>
            </label>

            <div className="stops-list-track">
              {customStops.map((stop) => (
                <div key={stop.id} className="stop-item-row">
                  <span className="stop-day-badge">{stop.day}</span>
                  <span className="stop-title-text">{stop.title}</span>
                  <button
                    type="button"
                    className="stop-remove-btn"
                    onClick={() => handleRemoveStop(stop.id)}
                    aria-label={`Remove stop ${stop.title}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Stop Form */}
            <form onSubmit={handleAddStop} className="add-stop-inline-form">
              <input
                type="text"
                placeholder="Add custom attraction, café or activity (e.g. Amber Fort sunrise walk)..."
                className="add-stop-input"
                value={newStopText}
                onChange={(e) => setNewStopText(e.target.value)}
              />
              <button type="submit" className="add-stop-submit-btn">
                <Plus size={15} />
                <span>Add Stop</span>
              </button>
            </form>
          </div>

          {errorMessage && (
            <div className="builder-error-alert" role="alert">
              <AlertCircle size={15} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="builder-action-row">
            <p className="builder-guarantee-note">
              Plans are auto-saved to your browser session and can be modified or exported anytime in the Trip Planner.
            </p>
            <button
              type="button"
              className="builder-proceed-btn"
              onClick={handleLaunchPlanner}
            >
              <span>Save & Launch Full Planner</span>
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
