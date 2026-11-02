import { useEffect, useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Compass,
  Plus,
  Trash2,
  Sparkles,
  MapPin,
  Clock,
  Wallet,
  Users,
  Share2,
  Printer,
  Copy,
  MessageCircle,
  IndianRupee,
  CheckCircle2,
  Camera,
  Star,
  Hotel,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Eye
} from "lucide-react";
import { destinations } from "../data/destinations";
import {
  getDestinationItinerary,
  getDestinationAttractions,
  getDestinationActivities,
  getDestinationTransit,
  normalizeDestinationKey
} from "../data/travelDetails.js";
import { getDestinationGallery, getDestinationLandmarks } from "../data/destinationGalleries.js";
import { getHotelsForDestination } from "../data/hotels.js";
import BookingModal from "../components/BookingModal.jsx";

const emptyTrip = {
  destination: "manali",
  days: "3",
  month: "October",
  travellers: "2",
  style: "A little of everything",
};

function createPlanRecord(destObj, tripState) {
  if (!destObj) return null;
  return {
    destinationId: destObj.id,
    destination: destObj.name,
    state: destObj.state || destObj.country,
    country: destObj.country,
    days: Number(tripState.days || 3),
    month: tripState.month || "October",
    travellers: Number(tripState.travellers) || 2,
    style: tripState.style || "A little of everything",
    budget: destObj.budget,
    image: destObj.image,
  };
}

export default function Planner() {
  const [params] = useSearchParams();
  const requestedDestination = params.get("destination");
  const requestedDays = params.get("days");

  // Destination resolver: guarantee a valid destination object
  const initialDest = useMemo(() => {
    if (requestedDestination) {
      const match = destinations.find(
        (d) => d.id.toLowerCase() === requestedDestination.toLowerCase() ||
               d.name.toLowerCase() === requestedDestination.toLowerCase()
      );
      if (match) return match;
    }
    return destinations.find((d) => d.id === "manali") || destinations[0];
  }, [requestedDestination]);

  const [trip, setTrip] = useState(() => ({
    ...emptyTrip,
    destination: initialDest.id,
    days: requestedDays ? String(requestedDays) : emptyTrip.days,
  }));

  // Initial plan matching the destination
  const [plan, setPlan] = useState(() => createPlanRecord(initialDest, {
    ...emptyTrip,
    destination: initialDest.id,
    days: requestedDays ? String(requestedDays) : emptyTrip.days,
  }));

  // Initial itinerary notes verified for the chosen destination
  const [notes, setNotes] = useState(() => 
    getDestinationItinerary(initialDest.id, requestedDays ? Number(requestedDays) : 3, emptyTrip.style)
  );

  const [newNote, setNewNote] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Synchronize on load or when query params change
  useEffect(() => {
    try {
      // 1. Check if user came from Homepage Itinerary Builder widget
      const customPlan = localStorage.getItem("roamly-active-custom-plan");
      if (customPlan) {
        const cp = JSON.parse(customPlan);
        const matchedDest = destinations.find(
          (d) => d.id.toLowerCase() === String(cp.destinationId || "").toLowerCase()
        ) || initialDest;

        const daysNum = cp.days?.match(/(\d+)\s*Days/)?.[1] || "3";
        const newTripState = {
          destination: matchedDest.id,
          days: daysNum,
          month: "Upcoming",
          travellers: String(cp.travelers || 2),
          style: cp.budgetTier === "luxury" ? "Royal & Luxury" : "A little of everything"
        };

        setTrip(newTripState);
        setPlan(createPlanRecord(matchedDest, newTripState));

        // Use custom stops if they exist, or generate fresh for this destination
        if (Array.isArray(cp.stops) && cp.stops.length > 0) {
          setNotes(cp.stops.map((s) => `${s.day} — ${s.title}`));
        } else {
          setNotes(getDestinationItinerary(matchedDest.id, daysNum, newTripState.style));
        }

        localStorage.removeItem("roamly-active-custom-plan");
        return;
      }

      // 2. Check saved planner state in localStorage
      const saved = localStorage.getItem("roamly-planner");
      if (saved) {
        const parsed = JSON.parse(saved);
        
        // If user specifically requested a destination via URL, prioritize it
        if (requestedDestination) {
          const matchedDest = destinations.find(
            (d) => d.id.toLowerCase() === requestedDestination.toLowerCase()
          );
          if (matchedDest) {
            const tripDays = requestedDays || parsed.trip?.days || "3";
            const newTrip = { ...emptyTrip, destination: matchedDest.id, days: String(tripDays) };
            setTrip(newTrip);
            setPlan(createPlanRecord(matchedDest, newTrip));
            setNotes(getDestinationItinerary(matchedDest.id, tripDays, newTrip.style));
            return;
          }
        }

        // Validate that saved plan and trip belong to the same destination
        if (parsed.trip && parsed.plan && parsed.trip.destination === parsed.plan.destinationId) {
          const destCheck = destinations.find((d) => d.id === parsed.trip.destination);
          if (destCheck) {
            setTrip(parsed.trip);
            setPlan(parsed.plan);
            if (Array.isArray(parsed.notes) && parsed.notes.length > 0) {
              setNotes(parsed.notes);
            } else {
              setNotes(getDestinationItinerary(destCheck.id, parsed.trip.days, parsed.trip.style));
            }
          }
        }
      }
    } catch {
      /* Keep defaults */
    }
  }, [requestedDestination, requestedDays, initialDest]);

  // Handle immediate destination dropdown switch
  function handleDestinationSelect(newDestId) {
    const destObj = destinations.find((d) => d.id === newDestId) || destinations[0];
    const newTrip = { ...trip, destination: destObj.id };
    setTrip(newTrip);

    // Automatically regenerate matching plan and itinerary for the newly chosen destination
    const newPlan = createPlanRecord(destObj, newTrip);
    setPlan(newPlan);
    const freshNotes = getDestinationItinerary(destObj.id, newTrip.days, newTrip.style);
    setNotes(freshNotes);
    setSelectedPhotoIndex(0);

    try {
      localStorage.setItem(
        "roamly-planner",
        JSON.stringify({ trip: newTrip, plan: newPlan, notes: freshNotes })
      );
    } catch {}
  }

  // Handle input update for duration, month, travellers, style
  function update(key, value) {
    setTrip((prev) => {
      const nextTrip = { ...prev, [key]: value };
      return nextTrip;
    });
  }

  // Generate / refresh trip outline button click
  function buildPlan(e) {
    if (e) e.preventDefault();
    const destination =
      destinations.find((d) => d.id === trip.destination) || destinations[0];

    const nextPlan = createPlanRecord(destination, trip);
    setPlan(nextPlan);

    // Generate day-by-day itinerary matching the chosen destination and exact duration
    const freshNotes = getDestinationItinerary(destination.id, trip.days, trip.style);
    setNotes(freshNotes);

    try {
      localStorage.setItem(
        "roamly-planner",
        JSON.stringify({ trip, plan: nextPlan, notes: freshNotes })
      );
    } catch {}
  }

  function persistNotes(next) {
    setNotes(next);
    try {
      localStorage.setItem(
        "roamly-planner",
        JSON.stringify({ trip, plan, notes: next })
      );
    } catch {}
  }

  function addNote(e) {
    e.preventDefault();
    if (newNote.trim()) {
      persistNotes([...notes, newNote.trim()]);
      setNewNote("");
    }
  }

  // Add a curated attraction directly into the day-by-day scratchpad
  function handleAddAttraction(attractionName) {
    const nextDayNum = notes.length + 1;
    const newEntry = `Day ${nextDayNum} — ${attractionName}: Explore iconic sights and local experiences in ${selectedPlace.name}.`;
    persistNotes([...notes, newEntry]);
  }

  // Currently active destination object
  const selectedPlace = useMemo(() => {
    return destinations.find((d) => d.id === trip.destination) || initialDest;
  }, [trip.destination, initialDest]);

  // Verified 12 photos & landmarks for currently selected destination
  const verifiedGallery = useMemo(() => {
    return getDestinationGallery(selectedPlace);
  }, [selectedPlace]);

  const verifiedLandmarks = useMemo(() => {
    return getDestinationLandmarks(selectedPlace);
  }, [selectedPlace]);

  // Curated attractions and activities for selected destination
  const destinationAttractions = useMemo(() => {
    return getDestinationAttractions(selectedPlace.id);
  }, [selectedPlace.id]);

  const destinationActivities = useMemo(() => {
    return getDestinationActivities(selectedPlace.id);
  }, [selectedPlace.id]);

  // Matching hotels for selected destination
  const destinationHotels = useMemo(() => {
    return getHotelsForDestination(selectedPlace.id, selectedPlace.name, selectedPlace.state);
  }, [selectedPlace]);

  // Calculate budget breakdown from budget string (e.g. ₹9,000–₹18,000)
  const budgetBreakdown = useMemo(() => {
    if (!selectedPlace?.budget) return null;
    const match = selectedPlace.budget.replace(/[,\s]/g, "").match(/₹?(\d+)/);
    const minVal = match ? parseInt(match[1], 10) : 8000;
    const travellersCount = Number(trip.travellers) || 1;

    return {
      total: minVal,
      travellersCount,
      partyTotal: minVal * travellersCount,
      stay: Math.round(minVal * 0.45),
      food: Math.round(minVal * 0.25),
      transit: Math.round(minVal * 0.2),
      activities: Math.round(minVal * 0.1),
    };
  }, [selectedPlace, trip.travellers]);

  // WhatsApp share
  function shareOnWhatsApp() {
    if (!plan) return;
    const text = `*Roamly Trip Itinerary — ${plan.destination} (${plan.days} Days)*\n\n` +
      `*When:* ${plan.month}\n` +
      `*Estimated Budget:* ${plan.budget} per traveler\n` +
      `*Travel Party:* ${plan.travellers} Travelers\n\n` +
      `*Itinerary Highlights:*\n` +
      notes.map((n, i) => `${i + 1}. ${n}`).join("\n") +
      `\n\nPlanned mindfully with Roamly — Travel by Mood!`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  }

  // Copy itinerary to clipboard
  function copyItinerary() {
    if (!plan) return;
    const text = `Roamly Trip Plan — ${plan.destination} (${plan.days} Days)\n` +
      `Budget: ${plan.budget}\n` +
      notes.map((n, i) => `${i + 1}. ${n}`).join("\n");

    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    });
  }

  // Active hero image (either selected from strip or primary destination image)
  const activeHeroImage = verifiedGallery[selectedPhotoIndex] || selectedPlace.image;

  return (
    <main className="page-main planner-page">
      <section className="page-hero planner-hero">
        <div className="container page-hero-inner">
          <div className="eyebrow">
            <span className="eyebrow-line" /> MINDFUL TRAVEL ITINERARY
          </div>
          <h1>
            Make room for
            <br />
            an <span className="script-accent">escape.</span>
          </h1>
          <p>
            A simple, intuitive starting point for a journey that fits your rhythm.
            No rigid schedules; just thoughtful momentum and transparent ₹ INR estimates.
          </p>
        </div>
      </section>

      <section className="container planner-content">
        <div className="planner-layout">
          {/* CONFIGURATION FORM */}
          <div className="planner-form-pane">
            <div className="planner-form-header">
              <span className="planner-badge-eyebrow">
                <Sparkles size={13} /> CURATED ITINERARY BUILDER
              </span>
              <h2>
                Plan your <span className="script-accent">journey</span>
              </h2>
              <p>Tell us where you want to feel different.</p>
            </div>

            <form onSubmit={buildPlan} className="planner-form-body">
              {/* Destination Field */}
              <div className="planner-field">
                <label htmlFor="planner-dest-select" className="planner-field-label">
                  <MapPin size={15} className="field-icon" />
                  <span>Where to?</span>
                </label>
                <div className="planner-select-wrapper">
                  <select
                    id="planner-dest-select"
                    className="planner-select"
                    value={trip.destination}
                    onChange={(e) => handleDestinationSelect(e.target.value)}
                  >
                    {destinations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} — {d.state || d.country}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row: Duration & Month */}
              <div className="planner-form-row">
                <div className="planner-field">
                  <label htmlFor="planner-duration-select" className="planner-field-label">
                    <Clock size={15} className="field-icon" />
                    <span>Duration</span>
                  </label>
                  <div className="planner-select-wrapper">
                    <select
                      id="planner-duration-select"
                      className="planner-select"
                      value={trip.days}
                      onChange={(e) => update("days", e.target.value)}
                    >
                      <option value="2">2 Days (Quick Weekend)</option>
                      <option value="3">3 Days (Long Weekend)</option>
                      <option value="4">4 Days (Short Holiday)</option>
                      <option value="5">5 Days (Relaxed Break)</option>
                      <option value="7">7 Days (Full Escape)</option>
                    </select>
                  </div>
                </div>

                <div className="planner-field">
                  <label htmlFor="planner-month-select" className="planner-field-label">
                    <CalendarDays size={15} className="field-icon" />
                    <span>Month</span>
                  </label>
                  <div className="planner-select-wrapper">
                    <select
                      id="planner-month-select"
                      className="planner-select"
                      value={trip.month}
                      onChange={(e) => update("month", e.target.value)}
                    >
                      {[
                        "January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"
                      ].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Row: Travelers & Travel Style */}
              <div className="planner-form-row">
                <div className="planner-field">
                  <label htmlFor="planner-travelers-select" className="planner-field-label">
                    <Users size={15} className="field-icon" />
                    <span>Travelers</span>
                  </label>
                  <div className="planner-select-wrapper">
                    <select
                      id="planner-travelers-select"
                      className="planner-select"
                      value={trip.travellers}
                      onChange={(e) => update("travellers", e.target.value)}
                    >
                      <option value="1">Solo Journey (1)</option>
                      <option value="2">Couple / Pair (2)</option>
                      <option value="4">Small Family / Group (4)</option>
                      <option value="6">Friends Gang (6+)</option>
                    </select>
                  </div>
                </div>

                <div className="planner-field">
                  <label htmlFor="planner-style-select" className="planner-field-label">
                    <Compass size={15} className="field-icon" />
                    <span>Travel Style</span>
                  </label>
                  <div className="planner-select-wrapper">
                    <select
                      id="planner-style-select"
                      className="planner-select"
                      value={trip.style}
                      onChange={(e) => update("style", e.target.value)}
                    >
                      <option value="Slow & Relaxed">Slow & Relaxed</option>
                      <option value="Adventure & Exploring">Adventure & Exploring</option>
                      <option value="A little of everything">A little of everything</option>
                      <option value="Photography & Sights">Photography & Sights</option>
                    </select>
                  </div>
                </div>
              </div>

              <button type="submit" className="plan-generate-btn">
                <Sparkles size={17} />
                <span>Generate my trip outline</span>
              </button>
            </form>

            {/* BUDGET ESTIMATE BREAKDOWN (INR) */}
            {budgetBreakdown && (
              <div className="planner-budget-card">
                <div className="budget-card-title">
                  <div className="budget-card-badge">
                    <IndianRupee size={15} />
                  </div>
                  <div>
                    <h4>Estimated ₹ Budget Breakdown</h4>
                    <p className="budget-card-sub">
                      Indicative per-person estimate based on package for <strong>{trip.days} days</strong>:
                    </p>
                  </div>
                </div>

                <div className="budget-breakdown-total" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <span className="total-label">Starting estimate</span>
                    <span className="total-amount">₹{budgetBreakdown.total.toLocaleString("en-IN")}</span>
                    <span className="total-unit">/ traveler</span>
                  </div>
                  {budgetBreakdown.travellersCount > 1 && (
                    <div style={{ textAlign: "right" }}>
                      <span className="total-label" style={{ display: "block", fontSize: "11px", color: "#64748b" }}>
                        Party Total ({budgetBreakdown.travellersCount} Guests)
                      </span>
                      <strong style={{ fontSize: "18px", color: "#1b4332", fontWeight: 700 }}>
                        ₹{budgetBreakdown.partyTotal.toLocaleString("en-IN")}
                      </strong>
                    </div>
                  )}
                </div>

                <div className="budget-breakdown-bars">
                  <div className="budget-item">
                    <div className="budget-row">
                      <span className="budget-name">🏨 Stays & Resorts (45%)</span>
                      <strong className="budget-val">₹{budgetBreakdown.stay.toLocaleString("en-IN")}</strong>
                    </div>
                    <div className="budget-track">
                      <div className="budget-fill stay" style={{ width: "45%" }} />
                    </div>
                  </div>

                  <div className="budget-item">
                    <div className="budget-row">
                      <span className="budget-name">🍲 Food & Local Dining (25%)</span>
                      <strong className="budget-val">₹{budgetBreakdown.food.toLocaleString("en-IN")}</strong>
                    </div>
                    <div className="budget-track">
                      <div className="budget-fill food" style={{ width: "25%" }} />
                    </div>
                  </div>

                  <div className="budget-item">
                    <div className="budget-row">
                      <span className="budget-name">🚖 Sightseeing & Transit (20%)</span>
                      <strong className="budget-val">₹{budgetBreakdown.transit.toLocaleString("en-IN")}</strong>
                    </div>
                    <div className="budget-track">
                      <div className="budget-fill transit" style={{ width: "20%" }} />
                    </div>
                  </div>

                  <div className="budget-item">
                    <div className="budget-row">
                      <span className="budget-name">🎟️ Activities & Entry (10%)</span>
                      <strong className="budget-val">₹{budgetBreakdown.activities.toLocaleString("en-IN")}</strong>
                    </div>
                    <div className="budget-track">
                      <div className="budget-fill activities" style={{ width: "10%" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PREVIEW & ITINERARY */}
          <div className="planner-preview">
            <div className="preview-top">
              <span>
                <Compass size={17} /> YOUR ROAMLY TRIP OUTLINE
              </span>
              <span className="preview-status">
                <span className="pulse-dot" /> {plan ? "OUTLINE READY" : "IN THE MAKING"}
              </span>
            </div>

            {plan ? (
              <div className="plan-active-wrap">
                {/* HERO CARD FOR SELECTED DESTINATION */}
                <div
                  className="plan-created-card"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(24,36,28,0.50) 0%, rgba(24,36,28,0.85) 100%), url("${activeHeroImage}")`,
                  }}
                >
                  <div className="plan-badge">
                    <Sparkles size={14} /> READY FOR YOU
                  </div>
                  <h2>{plan.destination}<span>.</span></h2>
                  <p className="plan-state"><MapPin size={15} /> {plan.state}</p>

                  <div className="plan-stats-grid">
                    <div className="stat-box">
                      <span>WHEN</span>
                      <strong>{plan.month}</strong>
                    </div>
                    <div className="stat-box">
                      <span>STAY</span>
                      <strong>{plan.days} Days</strong>
                    </div>
                    <div className="stat-box">
                      <span>PARTY</span>
                      <strong>{plan.travellers} Travellers</strong>
                    </div>
                    <div className="stat-box">
                      <span>EST. BUDGET</span>
                      <strong>{plan.budget}</strong>
                    </div>
                  </div>
                </div>

                {/* VERIFIED DESTINATION PHOTO STRIP */}
                {verifiedGallery.length >= 4 && (
                  <div className="planner-photo-strip-wrap">
                    <div className="planner-strip-header">
                      <h4>
                        <Camera size={14} /> Real Landmarks of {selectedPlace.name}
                      </h4>
                      <Link
                        to={`/destination/${selectedPlace.id}`}
                        style={{ fontSize: "12px", color: "#2b5539", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        <span>View 12 photos</span>
                        <ChevronRight size={13} />
                      </Link>
                    </div>

                    <div className="planner-photo-strip">
                      {verifiedGallery.slice(0, 4).map((photoUrl, pIdx) => {
                        const landmarkCaption = verifiedLandmarks[pIdx] || `${selectedPlace.name} Landmark ${pIdx + 1}`;
                        return (
                          <div
                            key={`${photoUrl}-${pIdx}`}
                            className="planner-strip-item"
                            onClick={() => setSelectedPhotoIndex(pIdx)}
                            title={`Click to set as hero: ${landmarkCaption}`}
                            style={{
                              border: selectedPhotoIndex === pIdx ? "2px solid #2b5539" : "1px solid rgba(0,0,0,0.06)"
                            }}
                          >
                            <img
                              src={photoUrl}
                              alt={landmarkCaption}
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.src = selectedPlace.image;
                              }}
                            />
                            <div className="planner-strip-caption">
                              {landmarkCaption}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ITINERARY SCRATCHPAD */}
                <div className="itinerary">
                  <div className="itinerary-header">
                    <div>
                      <h3>Day-by-Day Journey Scratchpad</h3>
                      <p>
                        Curated stops for <strong>{selectedPlace.name}</strong> ({plan.days} Days). Feel free to edit or add custom ideas.
                      </p>
                    </div>

                    {/* SHARE ACTIONS ROW */}
                    <div className="itinerary-share-bar">
                      <button
                        type="button"
                        className="share-btn whatsapp"
                        onClick={shareOnWhatsApp}
                        title="Share on WhatsApp"
                      >
                        <MessageCircle size={15} />
                        <span>WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        className="share-btn"
                        onClick={copyItinerary}
                        title="Copy Itinerary"
                      >
                        {copySuccess ? <Check size={15} color="#2b5539" /> : <Copy size={15} />}
                        <span>{copySuccess ? "Copied!" : "Copy"}</span>
                      </button>

                      <button
                        type="button"
                        className="share-btn"
                        onClick={() => window.print()}
                        title="Print / Save PDF"
                      >
                        <Printer size={15} />
                        <span>Print</span>
                      </button>
                    </div>
                  </div>

                  <div className="itinerary-list">
                    {notes.map((note, i) => (
                      <div className="itinerary-item" key={`${note}-${i}`}>
                        <span className="item-number">{String(i + 1).padStart(2, "0")}</span>
                        <p>{note}</p>
                        <button
                          type="button"
                          className="item-delete"
                          onClick={() =>
                            persistNotes(notes.filter((_, idx) => idx !== i))
                          }
                          aria-label={`Remove ${note}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <form className="add-note" onSubmit={addNote}>
                    <input
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder={`Add a stop, café, viewpoint in ${selectedPlace.name}…`}
                      aria-label="New itinerary idea"
                    />
                    <button type="submit" aria-label="Add itinerary idea">
                      <Plus size={18} />
                    </button>
                  </form>
                </div>

                {/* RECOMMENDED ATTRACTIONS & EXPERIENCES IN THIS DESTINATION */}
                {destinationAttractions.length > 0 && (
                  <div className="planner-attractions-section">
                    <div className="planner-attractions-header">
                      <h4>
                        <Sparkles size={15} className="text-amber-500" />
                        <span>Iconic Sights in {selectedPlace.name}</span>
                      </h4>
                      <span style={{ fontSize: "11px", color: "#637365" }}>Click + to add to scratchpad</span>
                    </div>

                    <div className="planner-attractions-chips">
                      {destinationAttractions.map((spot) => (
                        <div key={spot} className="planner-attraction-chip">
                          <MapPin size={12} color="#3b6045" />
                          <span>{spot}</span>
                          <button
                            type="button"
                            onClick={() => handleAddAttraction(spot)}
                            title={`Add ${spot} to itinerary`}
                            aria-label={`Add ${spot}`}
                          >
                            + Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* RECOMMENDED STAYS & RESORTS IN THIS DESTINATION */}
                {destinationHotels.length > 0 && (
                  <div className="planner-stay-section">
                    <div className="planner-stay-header">
                      <h4>
                        <Hotel size={15} className="text-emerald-700" />
                        <span>Recommended Stay in {selectedPlace.name}</span>
                      </h4>
                      <Link
                        to="/hotels"
                        style={{ fontSize: "12px", color: "#2b5539", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        <span>All Stays</span>
                        <ChevronRight size={13} />
                      </Link>
                    </div>

                    {destinationHotels.slice(0, 1).map((hotel) => (
                      <div key={hotel.id} className="planner-stay-card-inner">
                        <div className="planner-stay-img">
                          <img
                            src={hotel.heroImage || hotel.gallery?.[0] || selectedPlace.image}
                            alt={hotel.name}
                            loading="lazy"
                            onError={(e) => { e.currentTarget.src = selectedPlace.image; }}
                          />
                        </div>

                        <div className="planner-stay-details">
                          <div className="planner-stay-badge">
                            <ShieldCheck size={13} /> {hotel.badge || "Verified Retreat"}
                          </div>
                          <h5 className="planner-stay-name">{hotel.name}</h5>
                          <p className="planner-stay-tagline">{hotel.tagline || hotel.description}</p>

                          <div className="planner-stay-bottom">
                            <div className="planner-stay-pricing">
                              ₹{Number(hotel.pricePerNight || 6500).toLocaleString("en-IN")}
                              <span> / night</span>
                              <span style={{ marginLeft: "8px", color: "#d97706", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                                <Star size={12} fill="#d97706" /> {hotel.rating || 4.8}
                              </span>
                            </div>

                            <Link to={`/hotel/${hotel.id}`} className="planner-stay-link">
                              <span>View Stay</span>
                              <ExternalLink size={12} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* FOOTER ACTIONS */}
                <div className="plan-footer-actions">
                  <button
                    type="button"
                    className="button button-dark"
                    onClick={() => setBookingModalOpen(true)}
                  >
                    <Compass size={16} /> Request Trip Booking <ArrowRight size={16} />
                  </button>
                  <Link
                    to={`/destination/${selectedPlace.id}`}
                    className="button button-outline"
                  >
                    View {selectedPlace.name} field guide
                  </Link>
                </div>
              </div>
            ) : (
              <div className="planner-empty">
                <div className="planner-illustration">
                  <div className="planner-moon" />
                  <div className="planner-mountain mountain-back" />
                  <div className="planner-mountain mountain-front" />
                  <span>R</span>
                </div>
                <h2>Your next story starts here.</h2>
                <p>
                  Fill in a few details on the left and click "Generate my trip outline"
                  to create a tailored moodboard, budget breakdown, and scratchpad for your journey.
                </p>
                <div className="empty-steps">
                  <span><Check size={14} /> Your destination</span>
                  <span><Check size={14} /> Your pace & duration</span>
                  <span><Check size={14} /> Your loose itinerary</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        destination={selectedPlace}
      />
    </main>
  );
}
