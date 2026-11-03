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
  Eye,
  RefreshCw,
  Bookmark
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
import { useAuth } from "../context/AuthContext.jsx";

// AI Trip Planner & Interactive Travel Map Components
import AITripPlannerForm from "../components/planner/AITripPlannerForm.jsx";
import ItineraryTimeline from "../components/planner/ItineraryTimeline.jsx";
import SavedTripsModal from "../components/planner/SavedTripsModal.jsx";
import InteractiveTravelMap from "../components/map/InteractiveTravelMap.jsx";
import {
  generateAITrip,
  regenerateTripDay,
  getMySavedItineraries,
  saveUserItinerary,
  deleteUserItinerary
} from "../api/itineraries.js";
import "../components/planner/PlannerStyles.css";

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

  // AI Trip Planner & Interactive Map States
  const { isLoggedIn, user } = useAuth();
  const [activeMode, setActiveMode] = useState(() => {
    return params.get("mode") === "classic" ? "classic" : "ai";
  });
  const [aiPlan, setAiPlan] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [savingTrip, setSavingTrip] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [regeneratingDay, setRegeneratingDay] = useState(false);
  const [savedModalOpen, setSavedModalOpen] = useState(false);
  const [savedTrips, setSavedTrips] = useState([]);
  const [savedTripsLoading, setSavedTripsLoading] = useState(false);

  // Auto-generate initial plan for requested/initial destination if on AI mode
  useEffect(() => {
    if (activeMode === "ai" && !aiPlan && !aiLoading) {
      handleGenerateAITrip({
        destination: initialDest.name,
        days: Number(trip.days) || 3,
        budget: 18000,
        travellers: Number(trip.travellers) || 2,
        mood: "Culture",
        selectedActivities: ["Heritage Forts & Palaces", "Authentic Street & Local Food"]
      });
    }
  }, []);

  // Generate AI Trip
  async function handleGenerateAITrip(formData) {
    setAiLoading(true);
    setAiError("");
    setSaveSuccessMsg("");
    try {
      const res = await generateAITrip(formData);
      if (res.success && res.plan) {
        setAiPlan(res.plan);
        setTimeout(() => {
          const el = document.getElementById("ai-itinerary-section");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      } else {
        setAiError(res.message || "Could not generate itinerary. Please try again.");
      }
    } catch (err) {
      setAiError(
        err.response?.data?.message ||
        err.message ||
        "Failed to generate trip plan. Please verify your connection."
      );
    } finally {
      setAiLoading(false);
    }
  }

  // Regenerate single day
  async function handleRegenerateDay(dayNumber) {
    if (!aiPlan) return;
    setRegeneratingDay(true);
    setAiError("");
    try {
      const currentDay = aiPlan.days?.find((d) => d.dayNumber === dayNumber);
      const res = await regenerateTripDay({
        destination: aiPlan.destination,
        dayNumber,
        currentDayPlan: currentDay,
        mood: aiPlan.mood,
        days: aiPlan.durationDays
      });

      if (res.success && res.dayPlan) {
        setAiPlan((prev) => {
          if (!prev) return prev;
          const updatedDays = prev.days.map((d) =>
            d.dayNumber === dayNumber ? res.dayPlan : d
          );
          return { ...prev, days: updatedDays };
        });
      }
    } catch (err) {
      setAiError(err.response?.data?.message || err.message || "Day regeneration failed.");
    } finally {
      setRegeneratingDay(false);
    }
  }

  // Save current AI itinerary to account / storage
  async function handleSaveTrip() {
    if (!aiPlan) return;
    setSavingTrip(true);
    setSaveSuccessMsg("");
    setAiError("");

    try {
      if (isLoggedIn) {
        const destMatch = destinations.find(
          (d) =>
            d.name.toLowerCase() === (aiPlan.destination || "").toLowerCase() ||
            d.id.toLowerCase() === (aiPlan.destination || "").toLowerCase()
        );

        await saveUserItinerary({
          destinationId: destMatch?.id || null,
          destinationName: aiPlan.destination,
          tripTitle: aiPlan.tripTitle,
          durationDays: aiPlan.durationDays,
          travellersCount: aiPlan.travellers,
          budgetTotal: aiPlan.estimatedCosts?.total || 0,
          mood: aiPlan.mood,
          itineraryJson: aiPlan
        });
        setSaveSuccessMsg("✨ Trip saved successfully to your Roamly account!");
      } else {
        const guestTrips = JSON.parse(localStorage.getItem("roamly_guest_saved_itineraries") || "[]");
        const newGuestTrip = {
          id: `guest-${Date.now()}`,
          trip_title: aiPlan.tripTitle,
          destination_name: aiPlan.destination,
          duration_days: aiPlan.durationDays,
          travellers_count: aiPlan.travellers,
          budget_total: aiPlan.estimatedCosts?.total || 0,
          mood: aiPlan.mood,
          itinerary_json: aiPlan,
          created_at: new Date().toISOString()
        };
        guestTrips.unshift(newGuestTrip);
        localStorage.setItem("roamly_guest_saved_itineraries", JSON.stringify(guestTrips.slice(0, 10)));
        setSaveSuccessMsg("Saved to local storage! Log in to sync your trips across all devices.");
      }
      setTimeout(() => setSaveSuccessMsg(""), 5000);
    } catch (err) {
      setAiError(err.response?.data?.message || err.message || "Failed to save itinerary.");
    } finally {
      setSavingTrip(false);
    }
  }

  // Open saved trips modal and load trips
  async function handleOpenSavedModal() {
    setSavedModalOpen(true);
    setSavedTripsLoading(true);
    try {
      let trips = [];
      if (isLoggedIn) {
        const res = await getMySavedItineraries();
        trips = res.itineraries || [];
      }
      const guestTrips = JSON.parse(localStorage.getItem("roamly_guest_saved_itineraries") || "[]");
      setSavedTrips([...trips, ...guestTrips]);
    } catch (err) {
      console.warn("Could not load online saved itineraries:", err);
      const guestTrips = JSON.parse(localStorage.getItem("roamly_guest_saved_itineraries") || "[]");
      setSavedTrips(guestTrips);
    } finally {
      setSavedTripsLoading(false);
    }
  }

  // Select a saved trip from modal
  function handleSelectSavedTrip(tripItem) {
    const planData = typeof tripItem.itinerary_json === "string"
      ? JSON.parse(tripItem.itinerary_json)
      : tripItem.itinerary_json || tripItem;

    setAiPlan(planData);
    setSavedModalOpen(false);
    setActiveMode("ai");
    setTimeout(() => {
      const el = document.getElementById("ai-itinerary-section");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  }

  // Delete a saved trip
  async function handleDeleteSavedTrip(tripId) {
    try {
      if (String(tripId).startsWith("guest-")) {
        const guestTrips = JSON.parse(localStorage.getItem("roamly_guest_saved_itineraries") || "[]");
        const filtered = guestTrips.filter((t) => t.id !== tripId);
        localStorage.setItem("roamly_guest_saved_itineraries", JSON.stringify(filtered));
        setSavedTrips((prev) => prev.filter((t) => t.id !== tripId));
      } else {
        await deleteUserItinerary(tripId);
        setSavedTrips((prev) => prev.filter((t) => t.id !== tripId));
      }
    } catch (err) {
      alert("Failed to delete trip: " + (err.response?.data?.message || err.message));
    }
  }

  // Book trip from AI Itinerary
  function handleBookTripFromAI(destName) {
    const found = destinations.find(
      (d) =>
        d.name.toLowerCase() === String(destName || "").toLowerCase() ||
        d.id.toLowerCase() === String(destName || "").toLowerCase()
    );
    if (found) {
      handleDestinationSelect(found.id);
    }
    setBookingModalOpen(true);
  }

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
        {/* MODE SWITCHER TABS */}
        <div className="planner-mode-tabs-container" style={{ display: "flex", justifyContent: "center", marginBottom: "28px" }}>
          <div className="planner-mode-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeMode === "ai"}
              className={`planner-mode-tab ${activeMode === "ai" ? "active" : ""}`}
              onClick={() => setActiveMode("ai")}
            >
              <Sparkles size={16} />
              <span>AI Trip Planner & Interactive Map</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeMode === "classic"}
              className={`planner-mode-tab ${activeMode === "classic" ? "active" : ""}`}
              onClick={() => setActiveMode("classic")}
            >
              <CalendarDays size={16} />
              <span>Classic Scratchpad & Templates</span>
            </button>
          </div>
        </div>

        {activeMode === "ai" ? (
          <div className="ai-planner-container">
            {/* AI PLANNER FORM */}
            <AITripPlannerForm
              onSubmit={handleGenerateAITrip}
              isLoading={aiLoading}
              initialValues={{
                destination: selectedPlace.name,
                days: Number(trip.days) || 3,
                budget: budgetBreakdown ? budgetBreakdown.total : 18000,
                travellers: Number(trip.travellers) || 2
              }}
            />

            {/* ERROR BANNER IF ANY */}
            {aiError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "14px 20px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>{aiError}</span>
                <button type="button" onClick={() => setAiError("")} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#991b1b", fontWeight: 700 }}>✕</button>
              </div>
            )}

            {/* SUCCESS BANNER IF ANY */}
            {saveSuccessMsg && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", padding: "14px 20px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>{saveSuccessMsg}</span>
                <button type="button" onClick={() => setSaveSuccessMsg("")} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#166534", fontWeight: 700 }}>✕</button>
              </div>
            )}

            {/* GENERATED ITINERARY SPLIT VIEW */}
            {aiPlan ? (
              <div className="planner-layout-split" id="ai-itinerary-section">
                {/* TIMELINE COLUMN */}
                <div className="ai-timeline-column">
                  <ItineraryTimeline
                    itinerary={aiPlan}
                    onRegenerateDay={handleRegenerateDay}
                    onSaveTrip={handleSaveTrip}
                    onOpenSavedTrips={handleOpenSavedModal}
                    onBookTrip={handleBookTripFromAI}
                    isSaving={savingTrip}
                    isLoggedIn={isLoggedIn}
                    isRegeneratingDay={regeneratingDay}
                  />
                </div>

                {/* MAP COLUMN */}
                <div className="ai-map-column">
                  <div style={{ position: "sticky", top: "90px" }}>
                    <InteractiveTravelMap
                      itinerary={aiPlan}
                      centerCoordinates={aiPlan.centerCoordinates}
                      destinationName={aiPlan.destination}
                    />
                  </div>
                </div>
              </div>
            ) : (
              !aiLoading && (
                <div style={{ textAlign: "center", padding: "40px 20px", background: "#f8fafc", borderRadius: "18px", border: "1px solid #e2e8f0" }}>
                  <Compass size={40} color="#1b4332" style={{ margin: "0 auto 12px" }} />
                  <h3 style={{ margin: "0 0 8px", fontSize: "1.2rem", fontWeight: 700 }}>Ready to plan your escape?</h3>
                  <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                    Select your destination, pace, and mood above, then click <strong>Generate Mindful Itinerary</strong> to visualize your trip with real routes and interactive map waypoints.
                  </p>
                </div>
              )
            )}
          </div>
        ) : (
          /* CLASSIC SCRATCHPAD - 100% UNTOUCHED */
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
        )}
      </section>

      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        destination={selectedPlace}
      />

      <SavedTripsModal
        isOpen={savedModalOpen}
        onClose={() => setSavedModalOpen(false)}
        savedTrips={savedTrips}
        onSelectTrip={handleSelectSavedTrip}
        onDeleteTrip={handleDeleteSavedTrip}
        isLoading={savedTripsLoading}
      />
    </main>
  );
}
