import React from "react";
import {
  X,
  Compass,
  Calendar,
  MapPin,
  Trash2,
  ExternalLink,
  Wallet,
  Clock
} from "lucide-react";

export default function SavedTripsModal({
  isOpen,
  onClose,
  savedTrips = [],
  onSelectTrip,
  onDeleteTrip,
  isLoading
}) {
  if (!isOpen) return null;

  return (
    <div className="saved-trips-modal-backdrop" onClick={onClose}>
      <div
        className="saved-trips-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="saved-trips-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Compass size={22} color="#1b4332" />
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>
              My Saved AI Itineraries
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b", padding: "4px" }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="saved-trips-list">
          {isLoading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
              <Compass size={32} className="admin-spinning" style={{ margin: "0 auto 12px" }} />
              <p>Fetching your saved travel plans...</p>
            </div>
          ) : savedTrips.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
              <Calendar size={36} color="#cbd5e1" style={{ margin: "0 auto 12px" }} />
              <h4 style={{ margin: "0 0 6px 0", color: "#1e293b", fontSize: "1.05rem" }}>
                No saved itineraries yet
              </h4>
              <p style={{ margin: 0, fontSize: "0.88rem" }}>
                Generate your personalized AI trip above and click "Save Trip" to keep it handy in your account.
              </p>
            </div>
          ) : (
            savedTrips.map((trip) => {
              const dateStr = trip.createdAt
                ? new Date(trip.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })
                : "Saved plan";

              return (
                <div key={trip.id} className="saved-trip-item">
                  <div className="saved-trip-info">
                    <h4>{trip.title || `${trip.durationDays}-Day ${trip.destinationName} Escape`}</h4>
                    <p>
                      <MapPin size={12} style={{ display: "inline", marginRight: "3px" }} />
                      {trip.destinationName} • {trip.durationDays} Days • {trip.travellersCount} Person(s)
                    </p>
                    <span style={{ fontSize: "0.74rem", color: "#94a3b8", display: "block", marginTop: "4px" }}>
                      Created on {dateStr} {trip.budgetTotal > 0 && `• Budget ₹${Number(trip.budgetTotal).toLocaleString("en-IN")}`}
                    </span>
                  </div>

                  <div className="saved-trip-actions">
                    <button
                      type="button"
                      className="admin-primary-button"
                      style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                      onClick={() => {
                        onSelectTrip(trip);
                        onClose();
                      }}
                      title="Open and view on interactive map"
                    >
                      <ExternalLink size={13} /> Open Plan
                    </button>

                    <button
                      type="button"
                      className="admin-secondary-button"
                      style={{ padding: "6px 10px", color: "#ef4444", borderColor: "#fca5a5" }}
                      onClick={() => onDeleteTrip(trip.id)}
                      title="Delete this saved itinerary"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

