import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Compass,
  ArrowRight,
  Calendar,
  Mountain,
  Waves,
  Trees,
  Landmark,
  Sparkles,
  Flame,
  Building,
  ChevronRight,
  ChevronLeft,
  Search,
  MapPin,
  Clock
} from "lucide-react";

/**
 * 🎬 REVERSIBLE VIDEO-ONLY PREVIEW FLAG
 * ----------------------------------------------------
 * - Set to `true`: Temporarily hides all overlay text, headings, buttons, search bars,
 *   and floating badges so you can preview and evaluate the raw cinematic video quality by itself.
 * - Set to `false`: Instantly restores the full cinematic hero experience with all text,
 *   interactive discovery bars, and chapter tabs.
 */
export const PREVIEW_VIDEO_ONLY = true;

/**
 * 4 Verified Indian Travel Film Chapters
 * Each chapter directly links to verified scenic landscape footage from Incredible India.
 * Zero lifestyle clutter, zero unrelated people — pure destination grandeur.
 */
export const CINEMATIC_SCENES = [
  {
    id: "himalayas",
    sceneNumber: "01",
    region: "High Himalayas",
    title: "Pangong Tso & High Passes",
    subtitle: "Ladakh, Jammu & Kashmir",
    videoSrc: "/videos/hero-adventure.mp4",
    poster: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=85",
    route: "/destination/ladakh"
  },
  {
    id: "nature",
    sceneNumber: "02",
    region: "Western Ghats",
    title: "Kerala Backwaters & Tea Hills",
    subtitle: "Munnar & Alleppey, Kerala",
    videoSrc: "/videos/hero-nature.mp4",
    poster: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1920&q=85",
    route: "/destination/munnar"
  },
  {
    id: "heritage",
    sceneNumber: "03",
    region: "Royal Rajasthan",
    title: "Udaipur & Desert Palaces",
    subtitle: "Lake Pichola & Jaipur Citadels",
    videoSrc: "/videos/hero-heritage.mp4",
    poster: "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=1920&q=85",
    route: "/destination/udaipur"
  },
  {
    id: "spiritual",
    sceneNumber: "04",
    region: "Sacred Waters",
    title: "Varanasi Ghats & Stillness",
    subtitle: "River Ganga & Ancient Sanctuaries",
    videoSrc: "/videos/hero-spiritual.mp4",
    poster: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1920&q=85",
    route: "/destination/varanasi"
  }
];

/**
 * HERO CATEGORIES (Docked directly at the bottom of the video)
 */
export const HERO_CATEGORIES = [
  { id: "all", label: "All India", icon: Compass, filter: "" },
  { id: "nature", label: "Escape to Nature", icon: Mountain, filter: "Mountains" },
  { id: "adventure", label: "Chase Adventure", icon: Flame, filter: "Adventure" },
  { id: "beaches", label: "Find the Beach", icon: Waves, filter: "Beach" },
  { id: "heritage", label: "Explore Heritage", icon: Landmark, filter: "Culture" },
  { id: "wildlife", label: "Discover Wildlife", icon: Trees, filter: "Nature" },
  { id: "spiritual", label: "Peace & Wellness", icon: Sparkles, filter: "Peace" },
  { id: "city", label: "Experience City Life", icon: Building, filter: "City" }
];

export default function HeroVideo({ activeCategory = "all", onSelectCategory }) {
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Quick Discovery Filter state (Travel India Tourism style)
  const [searchRegion, setSearchRegion] = useState("");
  const [searchMood, setSearchMood] = useState("");
  const [searchDuration, setSearchDuration] = useState("");

  const videoRef = useRef(null);
  const categoryScrollRef = useRef(null);
  const autoPlayTimerRef = useRef(null);
  const navigate = useNavigate();

  const activeScene = CINEMATIC_SCENES[activeSceneIndex];

  // Check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Jump to specific scene smoothly with crossfade
  const jumpToScene = useCallback((index) => {
    if (index === activeSceneIndex && videoLoaded) return;
    setIsTransitioning(true);
    setVideoLoaded(false);
    setActiveSceneIndex(index);

    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  }, [activeSceneIndex, videoLoaded]);

  const handleNextScene = () => {
    const nextIdx = (activeSceneIndex + 1) % CINEMATIC_SCENES.length;
    jumpToScene(nextIdx);
  };

  const handlePrevScene = () => {
    const prevIdx = (activeSceneIndex - 1 + CINEMATIC_SCENES.length) % CINEMATIC_SCENES.length;
    jumpToScene(prevIdx);
  };

  // Auto-advance scenes every 14 seconds unless paused or reduced motion requested
  useEffect(() => {
    if (!isPlaying || prefersReducedMotion) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      handleNextScene();
    }, 14000);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isPlaying, prefersReducedMotion, activeSceneIndex]);

  // Restart video playback when scene changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [activeSceneIndex, isPlaying]);

  // Toggle Video Sound
  const toggleMute = () => {
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  // Toggle Play / Pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  // Submit quick search bar
  const handleQuickSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchRegion) params.set("region", searchRegion);
    if (searchMood) params.set("mood", searchMood);
    if (searchDuration) params.set("duration", searchDuration);

    const queryString = params.toString();
    navigate(queryString ? `/discover?${queryString}` : "/discover");
  };

  const handleCategoryClick = (cat) => {
    if (onSelectCategory) {
      onSelectCategory(cat.id, cat.filter);
    } else if (cat.filter) {
      navigate(`/discover?category=${encodeURIComponent(cat.filter)}`);
    } else {
      navigate("/discover");
    }
  };

  const scrollCategories = (direction) => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === "left" ? -240 : 240;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section
      className={`cinematic-hero-section inc-hero-mode ${PREVIEW_VIDEO_ONLY ? "video-only-preview" : ""}`}
      aria-label="Incredible India Cinematic Hero"
    >
      {/* 1. CINEMATIC VIDEO BACKGROUND (Clean, Unobstructed Scenic Travel Footage) */}
      <div className="hero-video-wrapper">
        {!hasVideoError && (
          <video
            ref={videoRef}
            key={activeScene.id}
            src={activeScene.videoSrc}
            className={`hero-video-element ${isTransitioning || !videoLoaded ? "video-fading" : ""}`}
            autoPlay
            muted={isMuted}
            loop
            playsInline
            poster={activeScene.poster}
            onCanPlay={() => setVideoLoaded(true)}
            onLoadedData={() => setVideoLoaded(true)}
            onError={() => setHasVideoError(true)}
            aria-hidden="true"
          />
        )}

        {/* Verified Matching Poster Image Fallback (Shown during crossfade, error, or reduced motion) */}
        <div
          className={`hero-poster-fallback ${(!videoLoaded || hasVideoError || isTransitioning) ? "visible" : ""}`}
          style={{ backgroundImage: `url(${activeScene.poster})` }}
          aria-hidden="true"
        />

        {/* Film-Grade Scrim & Radial Vignette */}
        <div className="hero-scrim-layer" />
        <div className="hero-radial-vignette" />
        <div className="hero-film-grain" />
      </div>

      {/* 2. HERO NARRATIVE CONTENT & SEARCH (Temporarily hidden during Video-Only Preview) */}
      {!PREVIEW_VIDEO_ONLY && (
        <div className="container hero-content-container">
          <div className="hero-narrative-box">
            {/* Eyebrow badge */}
            <div className="hero-eyebrow-tag">
              <span className="hero-eyebrow-accent-pulse" />
              <span>ROAMLY · EXPERIENCE INCREDIBLE INDIA</span>
            </div>

            {/* Main Travel Headline */}
            <h1 className="hero-headline">
              Find Your Kind of <span className="script-accent-gold">Somewhere.</span>
            </h1>

            {/* Supporting Narrative Description */}
            <p className="hero-subtitle">
              From misty Himalayan passes and royal desert citadels to tranquil palm-shaded backwaters — 
              discover journeys curated around how you desire to feel.
            </p>

            {/* Travel India Tourism Quick Discovery Bar */}
            <form className="travel-discovery-bar" onSubmit={handleQuickSearch} role="search">
              {/* Region / Destination Selector */}
              <div className="discovery-field">
                <span className="field-icon-wrap">
                  <MapPin size={17} className="field-icon" />
                </span>
                <div className="field-content">
                  <label className="field-label" htmlFor="hero-region-select">Destination</label>
                  <select
                    id="hero-region-select"
                    className="field-select"
                    value={searchRegion}
                    onChange={(e) => setSearchRegion(e.target.value)}
                  >
                    <option value="">All of India</option>
                    <option value="himalayas">North · Himalayas & Ladakh</option>
                    <option value="rajasthan">West · Royal Rajasthan & Deserts</option>
                    <option value="kerala">South · Kerala & Western Ghats</option>
                    <option value="coastal">Coastal · Goa & Arabian Sea</option>
                    <option value="meghalaya">Northeast · Living Bridges & Hills</option>
                  </select>
                </div>
              </div>

              <div className="discovery-divider" aria-hidden="true" />

              {/* Travel Mood Selector */}
              <div className="discovery-field">
                <span className="field-icon-wrap">
                  <Sparkles size={17} className="field-icon" />
                </span>
                <div className="field-content">
                  <label className="field-label" htmlFor="hero-mood-select">Travel Mood</label>
                  <select
                    id="hero-mood-select"
                    className="field-select"
                    value={searchMood}
                    onChange={(e) => setSearchMood(e.target.value)}
                  >
                    <option value="">Any Mood</option>
                    <option value="Adventure">Adventure & High Passes</option>
                    <option value="Peace">Peace & Restorative</option>
                    <option value="Heritage">Heritage & Palaces</option>
                    <option value="Nature">Forest & Wildlife</option>
                    <option value="Romance">Romantic Getaway</option>
                    <option value="Beach">Coastal Surf & Sunsets</option>
                  </select>
                </div>
              </div>

              <div className="discovery-divider" aria-hidden="true" />

              {/* Duration Selector */}
              <div className="discovery-field">
                <span className="field-icon-wrap">
                  <Clock size={17} className="field-icon" />
                </span>
                <div className="field-content">
                  <label className="field-label" htmlFor="hero-duration-select">Duration</label>
                  <select
                    id="hero-duration-select"
                    className="field-select"
                    value={searchDuration}
                    onChange={(e) => setSearchDuration(e.target.value)}
                  >
                    <option value="">Any Duration</option>
                    <option value="weekend">Weekend (2–3 Days)</option>
                    <option value="week">Classic (4–7 Days)</option>
                    <option value="extended">Grand Expedition (8+ Days)</option>
                  </select>
                </div>
              </div>

              {/* Search Button */}
              <button type="submit" className="discovery-submit-btn" aria-label="Search curated travel destinations">
                <Search size={18} />
                <span>Explore</span>
              </button>
            </form>

            {/* Quick Action Links */}
            <div className="hero-actions-row">
              <Link to="/discover" className="hero-btn-primary">
                <span>View All 150+ Places</span>
                <ArrowRight size={16} />
              </Link>

              <Link to="/planner" className="hero-btn-secondary">
                <Calendar size={16} />
                <span>AI Trip Planner</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 3. INCREDIBLE INDIA VIDEO CONTROL & SCENE NAVIGATION BAR (Temporarily hidden during Video-Only Preview) */}
      {!PREVIEW_VIDEO_ONLY && (
        <div className="inc-video-dock-bar">
          <div className="container inc-video-dock-inner">
            {/* Left: Themed Video Scene Slider Links */}
            <div className="inc-video-slider-nav" role="tablist" aria-label="Travel video scenes">
              {CINEMATIC_SCENES.map((scene, idx) => {
                const isActive = idx === activeSceneIndex;
                return (
                  <button
                    key={scene.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`inc-btm-navlink ${isActive ? "active" : ""}`}
                    onClick={() => jumpToScene(idx)}
                  >
                    <span className="inc-navlink-title">{scene.region}</span>
                    <span className="inc-navlink-sub">{scene.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Right: Prev / Next Video Switchers & Sound Mute Toggle */}
            <div className="inc-video-controls-cluster">
              <button
                type="button"
                className="inc-scene-arrow-btn"
                onClick={handlePrevScene}
                aria-label="Previous video scene"
                title="Previous scene"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                type="button"
                className="inc-scene-arrow-btn"
                onClick={handleNextScene}
                aria-label="Next video scene"
                title="Next scene"
              >
                <ChevronRight size={18} />
              </button>

              <button
                type="button"
                className="inc-media-ctrl-btn"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause background footage" : "Play background footage"}
                title={isPlaying ? "Pause video" : "Play video"}
              >
                {isPlaying ? <Pause size={15} /> : <Play size={15} />}
              </button>

              <button
                type="button"
                className={`inc-mute-btn ${!isMuted ? "audio-active" : ""}`}
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute travel soundscape" : "Mute travel soundscape"}
                title={isMuted ? "Sound Off (Click to unmute)" : "Sound On"}
              >
                {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
                <span className="inc-mute-tooltip">{isMuted ? "Sound Off" : "Sound On"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Vertical "Plan Your Trip" Action Tab (Temporarily hidden during Video-Only Preview) */}
      {!PREVIEW_VIDEO_ONLY && (
        <Link
          to="/planner"
          className="vertical-red-booking-tab"
          aria-label="Book your travel with Roamly trip planner"
        >
          <Calendar size={16} className="tab-icon" />
          <span className="tab-text">Plan Your Trip</span>
        </Link>
      )}

      {/* 4. DOCKED DESTINATION CATEGORY SELECTOR (Bridging smoothly into Explore Section) */}
      <div className="hero-docked-categories" id="explore-by-mood">
        <div className="container categories-bar-inner">
          <button
            type="button"
            className="category-scroll-btn left"
            onClick={() => scrollCategories("left")}
            aria-label="Scroll categories left"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="categories-scroll-track" ref={categoryScrollRef}>
            {HERO_CATEGORIES.map((cat) => {
              const IconComponent = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`category-pill ${isActive ? "active" : ""}`}
                  onClick={() => handleCategoryClick(cat)}
                  aria-pressed={isActive}
                >
                  <IconComponent size={15} className="cat-pill-icon" />
                  <span className="cat-pill-label">{cat.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="category-scroll-btn right"
            onClick={() => scrollCategories("right")}
            aria-label="Scroll categories right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
