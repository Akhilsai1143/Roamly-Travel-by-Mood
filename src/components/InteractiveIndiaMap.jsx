import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Compass,
  ArrowRight,
  Sparkles,
  Calendar,
  IndianRupee,
  Layers,
  ChevronRight,
  Info
} from "lucide-react";
import { destinations } from "../data/destinations.js";

// Curated geospatial marker positions mapped to an SVG viewport (width: 800, height: 900)
const MAP_DESTINATIONS = [
  {
    id: "kashmir",
    name: "Kashmir Valley",
    region: "North",
    coords: { x: 310, y: 110 },
    mood: "Peace & Mountains",
    tagline: "Paradise of alpine meadows, shikara boats, and snow-draped pine ridges."
  },
  {
    id: "ladakh",
    name: "Ladakh",
    region: "North",
    coords: { x: 370, y: 90 },
    mood: "Adventure & High Passes",
    tagline: "High-altitude desert lakes, stark monasteries, and ancient mountain passes."
  },
  {
    id: "spiti",
    name: "Spiti Valley",
    region: "North",
    coords: { x: 375, y: 160 },
    mood: "Adventure & Nature",
    tagline: "Rugged Trans-Himalayan valleys and thousand-year-old cliffside monasteries."
  },
  {
    id: "manali",
    name: "Manali",
    region: "North",
    coords: { x: 345, y: 175 },
    mood: "Mountains & Thrills",
    tagline: "Cedar forests, Rohtang Pass ascents, and roaring river streams."
  },
  {
    id: "rishikesh",
    name: "Rishikesh",
    region: "North",
    coords: { x: 360, y: 220 },
    mood: "Spiritual & Adventure",
    tagline: "Yoga capital by the emerald Ganges rapids and forest ashrams."
  },
  {
    id: "jaipur",
    name: "Jaipur",
    region: "West",
    coords: { x: 295, y: 310 },
    mood: "Royal Heritage",
    tagline: "Pink sandstone palaces, imposing hilltop forts, and vibrant bazaars."
  },
  {
    id: "udaipur",
    name: "Udaipur",
    region: "West",
    coords: { x: 265, y: 390 },
    mood: "Romance & Culture",
    tagline: "City of shimmering lakes, marble palaces, and sunset boat rides."
  },
  {
    id: "jaisalmer",
    name: "Jaisalmer",
    region: "West",
    coords: { x: 200, y: 320 },
    mood: "Desert & Heritage",
    tagline: "Golden desert dunes, living fortresses, and starlit desert camps."
  },
  {
    id: "varanasi",
    name: "Varanasi",
    region: "North",
    coords: { x: 490, y: 340 },
    mood: "Spiritual & Heritage",
    tagline: "Timeless sacred ghats, evening Ganga aarti, and ancient spiritual alleys."
  },
  {
    id: "meghalaya",
    name: "Meghalaya",
    region: "East",
    coords: { x: 670, y: 335 },
    mood: "Nature & Rain",
    tagline: "Abode of clouds, living root bridges, and thunderous crystal waterfalls."
  },
  {
    id: "goa",
    name: "Goa",
    region: "West",
    coords: { x: 275, y: 640 },
    mood: "Beach & Sun",
    tagline: "Golden palm-fringed sands, Portuguese architecture, and coastal seafood."
  },
  {
    id: "gokarna",
    name: "Gokarna",
    region: "South",
    coords: { x: 285, y: 685 },
    mood: "Beach & Peace",
    tagline: "Pristine secluded crescent beaches, cliffside treks, and quiet shores."
  },
  {
    id: "hampi",
    name: "Hampi",
    region: "South",
    coords: { x: 335, y: 630 },
    mood: "Ruins & Heritage",
    tagline: "Surreal boulder-strewn landscapes and magnificent Vijayanagara ruins."
  },
  {
    id: "munnar",
    name: "Munnar",
    region: "South",
    coords: { x: 330, y: 790 },
    mood: "Tea Gardens & Peace",
    tagline: "Misty emerald tea plantations, cool mountain breeze, and quiet trails."
  },
  {
    id: "varkala",
    name: "Varkala",
    region: "South",
    coords: { x: 325, y: 835 },
    mood: "Cliffs & Wellness",
    tagline: "Dramatic red cliffs rising high above Arabian Sea waters and yoga retreats."
  },
  {
    id: "andaman",
    name: "Andaman Islands",
    region: "Islands",
    coords: { x: 710, y: 730 },
    mood: "Coral Reefs & Adventure",
    tagline: "Turquoise lagoons, white sand beaches, and bioluminescent night waters."
  }
];

const REGION_FILTERS = [
  { id: "all", label: "All Regions" },
  { id: "North", label: "North & Himalayas" },
  { id: "West", label: "West & Deserts" },
  { id: "South", label: "South & Backwaters" },
  { id: "East", label: "East & Northeast" },
  { id: "Islands", label: "Islands" }
];

export default function InteractiveIndiaMap() {
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [activeMarkerId, setActiveMarkerId] = useState("kashmir");
  const [hoveredMarkerId, setHoveredMarkerId] = useState(null);

  // Filter markers by active region
  const filteredMarkers = useMemo(() => {
    if (selectedRegion === "all") return MAP_DESTINATIONS;
    return MAP_DESTINATIONS.filter((m) => m.region === selectedRegion);
  }, [selectedRegion]);

  // Lookup full destination data from destinations.js
  const activeMarker = useMemo(() => {
    return MAP_DESTINATIONS.find((m) => m.id === activeMarkerId) || MAP_DESTINATIONS[0];
  }, [activeMarkerId]);

  const activeDestData = useMemo(() => {
    return (
      destinations.find(
        (d) =>
          d.id.toLowerCase() === activeMarker.id.toLowerCase() ||
          d.name.toLowerCase().includes(activeMarker.name.toLowerCase().split(" ")[0])
      ) || null
    );
  }, [activeMarker]);

  return (
    <section className="interactive-map-section" aria-label="Interactive India Destination Explorer Map">
      <div className="container">
        {/* Section Header */}
        <div className="section-head-editorial">
          <div className="editorial-kicker">
            <Compass size={14} className="text-amber-400" />
            <span>GEOGRAPHIC EXPLORATION</span>
          </div>
          <h2 className="editorial-title">
            Explore India <span className="script-accent-gold">Across the Map.</span>
          </h2>
          <p className="editorial-subtitle">
            Navigate through India's diverse geographical zones — from the rugged high Himalayas to the sun-soaked southern coasts and emerald backwaters.
          </p>
        </div>

        {/* Region Filter Bar */}
        <div className="map-region-filter-bar" role="tablist">
          {REGION_FILTERS.map((rf) => (
            <button
              key={rf.id}
              type="button"
              className={`region-tab-btn ${selectedRegion === rf.id ? "active" : ""}`}
              onClick={() => setSelectedRegion(rf.id)}
              role="tab"
              aria-selected={selectedRegion === rf.id}
            >
              <span>{rf.label}</span>
            </button>
          ))}
        </div>

        {/* Main Map Layout: Interactive Cartographic View + Synced Destination Card */}
        <div className="map-stage-layout">
          {/* 1. SVG MAP VIEWPORT */}
          <div className="map-svg-container">
            <svg
              viewBox="0 0 850 950"
              className="india-svg-map"
              role="img"
              aria-label="Stylized map of India with destination pins"
            >
              <defs>
                <linearGradient id="mapLandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#102336" />
                  <stop offset="50%" stopColor="#0b1a28" />
                  <stop offset="100%" stopColor="#07131e" />
                </linearGradient>

                <filter id="markerGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* India Stylized Geographic Boundary Silhouette */}
              <path
                d="M 330 60 
                   C 360 50, 420 70, 420 120
                   C 420 160, 480 200, 520 220
                   C 570 240, 630 250, 710 260
                   C 760 270, 780 320, 730 360
                   C 680 390, 630 380, 570 410
                   C 540 430, 500 480, 490 520
                   C 470 580, 450 660, 420 730
                   C 390 800, 350 860, 330 890
                   C 320 890, 300 850, 290 800
                   C 270 720, 260 630, 270 560
                   C 260 520, 210 470, 190 420
                   C 170 360, 190 300, 230 260
                   C 270 220, 300 160, 310 100 
                   Z"
                fill="url(#mapLandGradient)"
                stroke="rgba(56, 189, 248, 0.28)"
                strokeWidth="2"
                strokeLinejoin="round"
                className="india-landmass-path"
              />

              {/* Andaman & Nicobar Archipelago Group */}
              <ellipse cx="710" cy="730" rx="14" ry="24" fill="#102336" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="1.5" />
              <ellipse cx="718" cy="770" rx="10" ry="18" fill="#102336" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="1.5" />

              {/* Geographic Region Label Highlights */}
              <text x="350" y="80" className="svg-region-label">HIMALAYAS</text>
              <text x="210" y="360" className="svg-region-label">THAR DESERT</text>
              <text x="590" y="320" className="svg-region-label">NORTHEAST</text>
              <text x="310" y="730" className="svg-region-label">DECCAN & WESTERN GHATS</text>

              {/* Destination Markers */}
              {filteredMarkers.map((marker) => {
                const isActive = activeMarkerId === marker.id;
                const isHovered = hoveredMarkerId === marker.id;

                return (
                  <g
                    key={marker.id}
                    className={`map-pin-group ${isActive ? "active" : ""}`}
                    transform={`translate(${marker.coords.x}, ${marker.coords.y})`}
                    onClick={() => setActiveMarkerId(marker.id)}
                    onMouseEnter={() => setHoveredMarkerId(marker.id)}
                    onMouseLeave={() => setHoveredMarkerId(null)}
                    style={{ cursor: "pointer" }}
                    tabIndex="0"
                    role="button"
                    aria-label={`Select destination ${marker.name}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setActiveMarkerId(marker.id);
                      }
                    }}
                  >
                    {/* Pulsing ring for active or hovered marker */}
                    {(isActive || isHovered) && (
                      <circle
                        r="18"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        className="pin-pulse-ring"
                      />
                    )}

                    {/* Outer halo */}
                    <circle
                      r={isActive ? "9" : "6"}
                      fill={isActive ? "#f59e0b" : "#38bdf8"}
                      filter="url(#markerGlow)"
                      opacity={isActive ? "1" : "0.75"}
                    />

                    {/* Inner core */}
                    <circle
                      r={isActive ? "4" : "3"}
                      fill="#ffffff"
                    />

                    {/* Marker label */}
                    <text
                      x="14"
                      y="4"
                      className={`svg-marker-text ${isActive ? "active" : ""}`}
                    >
                      {marker.name}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Map Guidance Footer */}
            <div className="map-interactive-legend">
              <span className="legend-dot active" />
              <span>Click any destination pin on the map to inspect highlights & planning details</span>
            </div>
          </div>

          {/* 2. SYNCED DESTINATION INSPECTION PANEL */}
          <div className="map-detail-panel">
            <div className="panel-badge-row">
              <span className="panel-region-pill">{activeMarker.region} India</span>
              <span className="panel-mood-pill">
                <Sparkles size={11} className="text-amber-400" />
                <span>{activeMarker.mood}</span>
              </span>
            </div>

            <h3 className="panel-dest-title">{activeMarker.name}</h3>
            <p className="panel-dest-tagline">{activeMarker.tagline}</p>

            {/* Destination Media & Real Data preview */}
            {activeDestData && (
              <div className="panel-media-card">
                <img
                  src={activeDestData.image}
                  alt={activeDestData.name}
                  className="panel-preview-img"
                  loading="lazy"
                />

                <div className="panel-meta-grid">
                  <div className="panel-meta-item">
                    <Calendar size={14} className="text-amber-400" />
                    <div>
                      <span className="meta-label">Best Season</span>
                      <span className="meta-value">{activeDestData.bestTime || "Oct – Mar"}</span>
                    </div>
                  </div>

                  <div className="panel-meta-item">
                    <Clock size={14} className="text-sky-400" />
                    <div>
                      <span className="meta-label">Duration</span>
                      <span className="meta-value">{activeDestData.days || "3–4 days"}</span>
                    </div>
                  </div>

                  <div className="panel-meta-item">
                    <IndianRupee size={14} className="text-emerald-400" />
                    <div>
                      <span className="meta-label">Est. Budget</span>
                      <span className="meta-value">{activeDestData.budget || "₹10,000–₹18,000"}</span>
                    </div>
                  </div>

                  <div className="panel-meta-item">
                    <MapPin size={14} className="text-rose-400" />
                    <div>
                      <span className="meta-label">State</span>
                      <span className="meta-value">{activeDestData.state || "India"}</span>
                    </div>
                  </div>
                </div>

                {activeDestData.hiddenGem && (
                  <div className="panel-gem-box">
                    <Sparkles size={14} className="text-amber-400 flex-shrink-0" />
                    <p className="gem-text">
                      <strong>Hidden Gem:</strong> {activeDestData.hiddenGem}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="panel-actions-row">
              <Link
                to={`/destination/${activeMarker.id}`}
                className="panel-primary-btn"
                aria-label={`View complete travel guide for ${activeMarker.name}`}
              >
                <span>View Complete Guide</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                to={`/planner?destination=${encodeURIComponent(activeMarker.name)}`}
                className="panel-secondary-btn"
                aria-label={`Add ${activeMarker.name} to itinerary`}
              >
                <Calendar size={15} />
                <span>Add to Itinerary</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
