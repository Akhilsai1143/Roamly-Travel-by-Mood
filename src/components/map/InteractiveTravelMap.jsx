import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Compass,
  Navigation,
  MapPin,
  Clock,
  Maximize2,
  Calendar,
  Sparkles,
  Utensils,
  Camera,
  Car
} from "lucide-react";
import { calculateHaversineDistance } from "../../data/destinationCoordinates.js";
import "./MapStyles.css";

// Helper component to auto-pan and fit bounds when points change
function MapBoundsUpdater({ points, center }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (points && points.length > 0) {
      const validPoints = points.filter(
        (p) => p && typeof p.lat === "number" && typeof p.lng === "number" && !isNaN(p.lat) && !isNaN(p.lng)
      );

      if (validPoints.length === 1) {
        map.setView([validPoints[0].lat, validPoints[0].lng], 13, { animate: true });
      } else if (validPoints.length > 1) {
        const bounds = L.latLngBounds(validPoints.map((p) => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: true });
      }
    } else if (center && center.lat && center.lng) {
      map.setView([center.lat, center.lng], center.zoom || 12, { animate: true });
    }
  }, [points, center, map]);

  return null;
}

// Generate custom SVG numbered pin or icon pin
function createCustomPin(label, type, isSelected) {
  let bg = "#1b4332";
  if (type === "food") bg = "#d97706";
  if (type === "viewpoint" || type === "nature") bg = "#059669";
  if (type === "heritage") bg = "#b45309";
  if (isSelected) bg = "#2563eb";

  const html = `
    <div class="custom-map-pin" style="background-color: ${bg}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: 700; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid #ffffff;">
      <span>${label}</span>
    </div>
  `;

  return L.divIcon({
    html,
    className: "roamly-leaflet-pin",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16]
  });
}

export default function InteractiveTravelMap({
  itinerary,
  centerCoordinates,
  destinationName = "Destination",
  onSelectStop
}) {
  const [activeDayFilter, setActiveDayFilter] = useState("all");
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeDistanceKm, setRouteDistanceKm] = useState(0);
  const [isRouting, setIsRouting] = useState(false);
  const mapRef = useRef(null);

  // Extract all stops from the itinerary
  const allStops = useMemo(() => {
    if (!itinerary || !Array.isArray(itinerary.days)) return [];

    const list = [];
    itinerary.days.forEach((day) => {
      const dayNum = day.dayNumber;
      if (Array.isArray(day.dayStops) && day.dayStops.length > 0) {
        day.dayStops.forEach((stop, idx) => {
          if (stop && stop.lat && stop.lng) {
            list.push({
              ...stop,
              dayNumber: dayNum,
              id: `${dayNum}-${idx}`,
              slot: stop.time || `Stop ${idx + 1}`
            });
          }
        });
      } else {
        // Fallback to morning, afternoon, evening
        ["morning", "afternoon", "evening"].forEach((slotKey) => {
          const item = day[slotKey];
          if (item && item.lat && item.lng) {
            list.push({
              name: item.place || item.title,
              lat: item.lat,
              lng: item.lng,
              type: item.type || "sight",
              description: item.description || "",
              time: item.time || "",
              cost: item.cost || 0,
              dayNumber: dayNum,
              id: `${dayNum}-${slotKey}`,
              slot: slotKey.toUpperCase()
            });
          }
        });
      }
    });

    return list;
  }, [itinerary]);

  // Filter stops based on active day pill
  const visibleStops = useMemo(() => {
    if (activeDayFilter === "all") return allStops;
    const targetDay = Number(activeDayFilter);
    return allStops.filter((s) => s.dayNumber === targetDay);
  }, [allStops, activeDayFilter]);

  // Fetch true driving route from OSRM or fallback to geodesic lines
  useEffect(() => {
    if (!visibleStops || visibleStops.length < 2) {
      setRouteCoordinates(visibleStops.map((s) => [s.lat, s.lng]));
      setRouteDistanceKm(0);
      return;
    }

    const coordsString = visibleStops
      .map((s) => `${s.lng.toFixed(5)},${s.lat.toFixed(5)}`)
      .join(";");

    setIsRouting(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;

    fetch(osrmUrl, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        clearTimeout(timeoutId);
        if (data && data.routes && data.routes.length > 0) {
          const geometry = data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]);
          const distanceKm = Math.round((data.routes[0].distance / 1000) * 10) / 10;
          setRouteCoordinates(geometry);
          setRouteDistanceKm(distanceKm);
        } else {
          fallbackRoute();
        }
      })
      .catch(() => {
        fallbackRoute();
      })
      .finally(() => {
        setIsRouting(false);
      });

    function fallbackRoute() {
      // Direct polyline with Haversine calculation
      const lines = visibleStops.map((s) => [s.lat, s.lng]);
      let total = 0;
      for (let i = 0; i < visibleStops.length - 1; i++) {
        total += calculateHaversineDistance(
          visibleStops[i].lat,
          visibleStops[i].lng,
          visibleStops[i + 1].lat,
          visibleStops[i + 1].lng
        );
      }
      setRouteCoordinates(lines);
      setRouteDistanceKm(Math.round(total * 10) / 10);
    }

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [visibleStops]);

  // Map center coordinates
  const defaultCenter = useMemo(() => {
    if (centerCoordinates && centerCoordinates.lat && centerCoordinates.lng) {
      return centerCoordinates;
    }
    if (visibleStops.length > 0) {
      return { lat: visibleStops[0].lat, lng: visibleStops[0].lng, zoom: 12 };
    }
    return { lat: 26.9124, lng: 75.7873, zoom: 12 };
  }, [centerCoordinates, visibleStops]);

  const daysCount = itinerary?.days?.length || 3;

  function handleRecenter() {
    if (!mapRef.current) return;
    if (visibleStops.length > 1) {
      const bounds = L.latLngBounds(visibleStops.map((s) => [s.lat, s.lng]));
      mapRef.current.fitBounds(bounds, { padding: [40, 40] });
    } else if (visibleStops.length === 1) {
      mapRef.current.setView([visibleStops[0].lat, visibleStops[0].lng], 13);
    }
  }

  return (
    <div className="roamly-map-wrapper">
      {/* FLOATING CONTROLS: DAY FILTER & DISTANCE BADGE */}
      <div className="map-control-bar">
        <div className="map-day-filter-pills">
          <button
            type="button"
            className={`map-day-pill ${activeDayFilter === "all" ? "active" : ""}`}
            onClick={() => setActiveDayFilter("all")}
          >
            All Stops ({allStops.length})
          </button>
          {Array.from({ length: daysCount }, (_, i) => i + 1).map((d) => (
            <button
              key={d}
              type="button"
              className={`map-day-pill ${activeDayFilter === String(d) ? "active" : ""}`}
              onClick={() => setActiveDayFilter(String(d))}
            >
              Day {d}
            </button>
          ))}
        </div>

        {routeDistanceKm > 0 && (
          <div className="map-route-badge">
            <span className="dot" />
            <Car size={13} color="#166534" />
            <span>~{routeDistanceKm} km {activeDayFilter === "all" ? "total trip" : `Day ${activeDayFilter}`}</span>
          </div>
        )}
      </div>

      {/* RECENTER BUTTON */}
      <button
        type="button"
        className="map-recenter-btn"
        onClick={handleRecenter}
        title="Recenter and fit all destination stops"
      >
        <Maximize2 size={13} />
        <span>Fit Waypoints</span>
      </button>

      {/* LEAFLET MAP CONTAINER */}
      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={defaultCenter.zoom || 12}
        scrollWheelZoom={true}
        className="roamly-map-container"
        ref={mapRef}
      >
        {/* OPENSTREETMAP TILES (100% Free, No API Key Required, Worldwide Map Coverage) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* AUTO-FIT BOUNDS ON WAYPOINTS CHANGE */}
        <MapBoundsUpdater points={visibleStops} center={defaultCenter} />

        {/* ROUTE POLYLINE CONNECTING WAYPOINTS */}
        {routeCoordinates.length > 1 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{
              color: "#1b4332",
              weight: 4,
              opacity: 0.85,
              dashArray: isRouting ? "6, 8" : undefined,
              lineCap: "round",
              lineJoin: "round"
            }}
          />
        )}

        {/* PINS FOR VISIBLE STOPS */}
        {visibleStops.map((stop, idx) => {
          const pinLabel = activeDayFilter === "all" ? `D${stop.dayNumber}` : String(idx + 1);
          return (
            <Marker
              key={stop.id || `${stop.lat}-${stop.lng}-${idx}`}
              position={[stop.lat, stop.lng]}
              icon={createCustomPin(pinLabel, stop.type, false)}
              eventHandlers={{
                click: () => {
                  if (onSelectStop) onSelectStop(stop);
                }
              }}
            >
              <Popup>
                <div className="map-popup-card">
                  <span className={`popup-tag ${stop.type === "food" ? "food-tag" : "day-tag"}`}>
                    Day {stop.dayNumber} • {stop.slot || stop.time || "Scheduled"}
                  </span>
                  <h4>{stop.name}</h4>
                  {stop.description && <p>{stop.description}</p>}
                  <div className="popup-meta">
                    <span>
                      <MapPin size={11} style={{ display: "inline", marginRight: "3px" }} />
                      {destinationName}
                    </span>
                    {stop.cost > 0 && <span>Est. ₹{stop.cost}</span>}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

