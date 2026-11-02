import { useState, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Compass,
  Sparkles,
  Mountain,
  Trees,
  Landmark,
  Waves,
  Star,
  MapPin,
  Heart,
  Calendar,
  Clock,
  IndianRupee,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Flame,
  Building,
  BedDouble,
  Lightbulb,
  CheckCircle2,
  Zap,
  Award,
  Headphones,
  Tag,
  Copy,
  Check,
  MoveUpRight,
  Sun,
  Eye,
  BookOpen
} from "lucide-react";

import HeroVideo from "../components/HeroVideo.jsx";
import DestinationHeroShowcase from "../components/DestinationHeroShowcase.jsx";
import DestinationCard from "../components/DestinationCard.jsx";
import { destinations } from "../data/destinations.js";
import { initialReviews } from "../data/reviews.js";

// Iconic Indian Landmarks & Attractions (Incredible India Reference)
const ATTRACTIONS = [
  {
    id: "attr-red-fort",
    name: "Red Fort (Lal Qila)",
    location: "Old Delhi",
    category: "Forts & Palaces",
    highlight: "17th-century Mughal sandstone masterpiece and UNESCO World Heritage monument.",
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80",
    route: "/discover?q=Delhi"
  },
  {
    id: "attr-golden-temple",
    name: "Sri Harmandir Sahib",
    location: "Amritsar, Punjab",
    category: "Sacred Shrines",
    highlight: "Spiritual golden sanctum surrounded by the serene sacred Amrit Sarovar lake.",
    image: "https://images.unsplash.com/photo-1609825488888-3a766db05542?auto=format&fit=crop&w=800&q=80",
    route: "/discover?q=Amritsar"
  },
  {
    id: "attr-pangong-tso",
    name: "Pangong Tso & Khardung La",
    location: "Ladakh",
    category: "High Passes & Lakes",
    highlight: "High-altitude endorheic lake changing shades from turquoise to deep cobalt blue.",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80",
    route: "/destination/ladakh"
  },
  {
    id: "attr-hampi-chariot",
    name: "Monolithic Stone Chariot",
    location: "Hampi, Karnataka",
    category: "Forts & Palaces",
    highlight: "Carved monolithic granite chariot dedicated to Garuda amidst Vijayanagara ruins.",
    image: "https://www.holidaymonk.com/wp-content/uploads/2020/10/Vastuchitra_Stone-Chariot-Hampi.jpg",
    route: "/destination/hampi"
  },
  {
    id: "attr-root-bridge",
    name: "Double Decker Root Bridge",
    location: "Nongriat, Meghalaya",
    category: "Natural Wonders",
    highlight: "Living bio-engineering crafted by indigenous Khasi clans across roaring jungle rivers.",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
    route: "/destination/meghalaya"
  },
  {
    id: "attr-varanasi-ghats",
    name: "Dashashwamedh Ghat",
    location: "Varanasi, Uttar Pradesh",
    category: "Sacred Shrines",
    highlight: "Living ancient riverfront steps hosting the world-famous evening Ganga Aarti ritual.",
    image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80",
    route: "/destination/varanasi"
  }
];

// Handcrafted Curated Itineraries by Region & Duration
const CURATED_ITINERARIES = [
  {
    id: "itin-01",
    title: "Golden Triangle & Royal Courtyards",
    region: "North India",
    days: "5 Days / 4 Nights",
    pace: "Moderate Pace",
    stops: ["Delhi", "Agra", "Jaipur"],
    highlights: "Amber Fort dawn walk · Taj Mahal sunrise · Chandni Chowk spice markets",
    budget: "From ₹14,500 / person",
    image: "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=800&q=80",
    route: "/planner?destination=jaipur&days=5"
  },
  {
    id: "itin-02",
    title: "Emerald Hills & Kerala Backwaters",
    region: "South India",
    days: "6 Days / 5 Nights",
    pace: "Slow & Restorative",
    stops: ["Kochi", "Munnar", "Alleppey"],
    highlights: "Cardamom estate walks · Traditional houseboat cruise · Kathakali theater",
    budget: "From ₹16,800 / person",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
    route: "/planner?destination=munnar&days=5"
  },
  {
    id: "itin-03",
    title: "High Passes of Ladakh & Spiti",
    region: "Himalayas",
    days: "8 Days / 7 Nights",
    pace: "Adventurous High-Altitude",
    stops: ["Leh", "Nubra Valley", "Pangong Tso"],
    highlights: "Khardung La high pass · Double-humped camel dunes · Monastic stargazing",
    budget: "From ₹26,000 / person",
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80",
    route: "/planner?destination=ladakh&days=7"
  }
];

// Offbeat Hidden Gems of India
const HIDDEN_GEMS = [
  {
    id: "gem-ziro",
    name: "Ziro Valley",
    state: "Arunachal Pradesh",
    tag: "Untouched Pine Meadows",
    description: "Cradle of the Apatani tribe with gentle pine-clad hills, organic paddy terraces, and quiet skies.",
    image: "https://images.unsplash.com/photo-1571536802807-30451e3955d8?auto=format&fit=crop&w=800&q=80",
    route: "/discover?offbeat=true"
  },
  {
    id: "gem-tirthan",
    name: "Tirthan Valley",
    state: "Himachal Pradesh",
    tag: "Gateway to Great Himalayas",
    description: "Crystal clear trout streams, cedar forest homestays, and quiet trailheads into untouched forests.",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
    route: "/discover?category=Mountains"
  },
  {
    id: "gem-mandalpatti",
    name: "Mandalpatti Ridge",
    state: "Coorg, Karnataka",
    tag: "Windswept Cloud Trail",
    description: "A 4x4 rugged jeep climb above the coffee estates to a 360-degree panoramic crest in drifting fog.",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80",
    route: "/destination/coorg"
  },
  {
    id: "gem-chembra",
    name: "Chembra Heart Lake",
    state: "Wayanad, Kerala",
    tag: "Evergreen Cloud Peak",
    description: "A misty trek through tea slopes leading to a naturally heart-shaped perennial mountain lake.",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
    route: "/destination/munnar"
  }
];

// Living Cultural Festivals & Celebrations
const FESTIVALS = [
  {
    id: "fest-dev-deepawali",
    title: "Dev Deepawali",
    location: "Varanasi, Uttar Pradesh",
    date: "November (Kartik Purnima)",
    tag: "Festival of Light",
    description: "Over a million clay diyas illuminated along all 84 ghats of the sacred Ganges in a spectacle of devotion.",
    image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80",
    route: "/destination/varanasi"
  },
  {
    id: "fest-pushkar",
    title: "Pushkar Camel & Cultural Fair",
    location: "Pushkar, Rajasthan",
    date: "October – November",
    tag: "Desert Living Heritage",
    description: "Vibrant turbaned gatherings, Rajasthani folk musicians, illuminated sand dunes, and sacred lake rituals.",
    image: "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=800&q=80",
    route: "/destination/jaipur"
  },
  {
    id: "fest-hemis",
    title: "Hemis Monastic Festival",
    location: "Ladakh",
    date: "June – July",
    tag: "High-Altitude Sacred Dance",
    description: "Lamas performing sacred Cham masked dances to horns and cymbals in Ladakh's largest historic monastery.",
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80",
    route: "/destination/ladakh"
  },
  {
    id: "fest-hornbill",
    title: "Hornbill Festival of Festivals",
    location: "Kohima, Nagaland",
    date: "December 1 – 10",
    tag: "Tribal Unity & Music",
    description: "A breathtaking congregation of 17 indigenous tribes celebrating folk songs, archery, crafts, and morungs.",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
    route: "/discover?region=northeast"
  }
];

// Authentic Travel Stories sourced from Roamly's field archive
const TRAVEL_STORIES = [
  {
    id: "story-01",
    number: "01",
    tag: "SLOW TRAVEL",
    mood: "Peace",
    title: "The art of doing absolutely nothing on holiday",
    text: "A reminder that a meaningful trip doesn't require an exhaustive hour-by-hour itinerary. Sometimes the most restorative moments happen over an unhurried tea overlooking misty hills.",
    image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1000&q=85",
    read: "4 MIN READ",
    place: "Munnar, Kerala",
    url: "/stories"
  },
  {
    id: "story-02",
    number: "02",
    tag: "HIDDEN GEMS",
    mood: "Adventure",
    title: "How to find the quiet side of a popular place",
    text: "Trade crowded lookouts for lesser-known cliff trails and dawn village walks. Gentle ways to discover corners that feel deeply personal and untouched.",
    image: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1000&q=85",
    read: "5 MIN READ",
    place: "Spiti Valley, Himachal",
    url: "/stories"
  },
  {
    id: "story-03",
    number: "03",
    tag: "TRAVEL BETTER",
    mood: "Romance",
    title: "Leave a little empty space in your itinerary",
    text: "The most vivid memory of your journey will likely be the serendipitous detour you never planned: a hidden courtyard, an unexpected sunset, or a quiet conversation with an artisan.",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=85",
    read: "3 MIN READ",
    place: "Udaipur, Rajasthan",
    url: "/stories"
  },
  {
    id: "story-04",
    number: "04",
    tag: "NATURE RETREAT",
    mood: "Nature",
    title: "Why walking through a forest heals creative burnout",
    text: "Shinrin-yoku, or forest bathing, is more than a wellness trend. Discover how deep green canopies, pine scents, and winding Western Ghat paths recalibrate your senses.",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1000&q=85",
    read: "6 MIN READ",
    place: "Coorg, Karnataka",
    url: "/stories"
  }
];

// 7 Photography-led Travel by Mood cards
const MOOD_EXPERIENCES = [
  {
    id: "mood-mountains",
    statement: "I need the mountains.",
    subtitle: "High altitude silence, cedar air & vast Himalayan horizons",
    moodTag: "Nature",
    categoryFilter: "Mountains",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80",
    route: "/discover?category=Mountains"
  },
  {
    id: "mood-ocean",
    statement: "I want the ocean.",
    subtitle: "Golden sands, rhythmic tides & cliffside Arabian sunsets",
    moodTag: "Beach",
    categoryFilter: "Beach",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
    route: "/discover?category=Beach"
  },
  {
    id: "mood-adventure",
    statement: "I want an adventure.",
    subtitle: "High-pass road trails, glacial valleys & untamed routes",
    moodTag: "Adventure",
    categoryFilter: "Adventure",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
    route: "/discover?mood=Adventure"
  },
  {
    id: "mood-peace",
    statement: "I want peace and quiet.",
    subtitle: "Rolling misty tea estates, birdsong & restorative calm",
    moodTag: "Peace",
    categoryFilter: "Peace",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
    route: "/discover?mood=Peace"
  },
  {
    id: "mood-culture",
    statement: "I want culture and heritage.",
    subtitle: "Centuries-old stone havelis, royal forts & living crafts",
    moodTag: "Culture",
    categoryFilter: "Culture",
    image: "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=800&q=80",
    route: "/discover?category=Culture"
  },
  {
    id: "mood-spiritual",
    statement: "I want a spiritual escape.",
    subtitle: "Sacred riverbank evening aartis & tranquil mountain shrines",
    moodTag: "Spiritual",
    categoryFilter: "Peace",
    image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80",
    route: "/discover?theme=guided"
  },
  {
    id: "mood-unexpected",
    statement: "I want to explore somewhere unexpected.",
    subtitle: "Living root bridges, cloud valleys & serendipitous wonders",
    moodTag: "Serendipity",
    categoryFilter: "Nature",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
    route: "/surprise"
  }
];

// Rich curated experience collections
const EXPERIENCE_COLLECTIONS = [
  {
    id: "himalayan-adventures",
    title: "Himalayan Adventures",
    subtitle: "High-altitude mountain passes, Spiti cliff monasteries & Ladakh skies",
    tag: "High Passes",
    icon: Mountain,
    days: "6–8 Days",
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80",
    url: "/discover?region=himalayas",
    span: "col-span-2"
  },
  {
    id: "coastal-hideaways",
    title: "Coastal Hideaways",
    subtitle: "Uncrowded coves in Gokarna, Varkala cliff sunsets & palm shores",
    tag: "Ocean Horizons",
    icon: Waves,
    days: "3–5 Days",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    url: "/discover?category=Beach",
    span: "col-span-1"
  },
  {
    id: "royal-rajasthan",
    title: "Royal Rajasthan",
    subtitle: "Courtyards of Udaipur, pink boulevards of Jaipur & sandstone havelis",
    tag: "Living Heritage",
    icon: Landmark,
    days: "4–6 Days",
    image: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=900&q=80",
    url: "/discover?region=heritage",
    span: "col-span-1"
  },
  {
    id: "forest-retreats",
    title: "Forest & Tea Retreats",
    subtitle: "Western Ghats, Munnar tea hills & aroma-filled coffee estates of Coorg",
    tag: "Emerald Calm",
    icon: Trees,
    days: "3–4 Days",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80",
    url: "/discover?region=south",
    span: "col-span-2"
  },
  {
    id: "spiritual-journeys",
    title: "Spiritual Journeys",
    subtitle: "Riverbank aartis at Varanasi ghats & Himalayan meditation caves in Rishikesh",
    tag: "Soulful Stillness",
    icon: Sparkles,
    days: "3–5 Days",
    image: "https://images.unsplash.com/photo-1571536802807-30451e3955d8?auto=format&fit=crop&w=900&q=80",
    url: "/discover?q=Varanasi",
    span: "col-span-1"
  },
  {
    id: "cultural-trails",
    title: "Cultural Trails",
    subtitle: "Monolithic ruins of Hampi, living root bridges of Meghalaya & folk bazaars",
    tag: "Timeless Wonders",
    icon: Compass,
    days: "4–5 Days",
    image: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=900&q=80",
    url: "/discover?category=Culture",
    span: "col-span-1"
  },
  {
    id: "weekend-escapes",
    title: "Weekend Escapes",
    subtitle: "Quick, restorative short getaways within 3–5 hours of major hubs",
    tag: "Quick Recharge",
    icon: Clock,
    days: "2–3 Days",
    image: "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=900&q=80",
    url: "/discover?days=short",
    span: "col-span-1"
  }
];

// Curated Boutique Stays & Havelis
const CURATED_STAYS = [
  {
    id: "fateh-garh-udaipur",
    title: "Fateh Garh Heritage Palace",
    location: "Udaipur, Rajasthan",
    type: "Royal Haveli",
    rating: "4.9",
    reviews: "184 stays",
    tag: "Lake Pichola View · Heritage Pool",
    price: "₹8,500",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    url: "/hotel/fateh-garh-udaipur"
  },
  {
    id: "windermere-estate-munnar",
    title: "Windermere Colonial Estate",
    location: "Munnar, Kerala",
    type: "Tea Plantation Stay",
    rating: "4.9",
    reviews: "210 stays",
    tag: "Cardamom Mist · Organic Dining",
    price: "₹6,800",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
    url: "/hotel/windermere-estate-munnar"
  },
  {
    id: "the-himalayan-chalet-manali",
    title: "The Himalayan Pine Chalet",
    location: "Manali, Himachal",
    type: "Mountain Retreat",
    rating: "4.8",
    reviews: "156 stays",
    tag: "Snow Peak Balcony · Fireplace",
    price: "₹5,900",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
    url: "/hotel/the-himalayan-chalet-manali"
  },
  {
    id: "soul-and-surf-varkala",
    title: "Soul & Surf Red Cliff Haven",
    location: "Varkala, Kerala",
    type: "Cliffside Sanctuary",
    rating: "4.9",
    reviews: "142 stays",
    tag: "Arabian Sea Sunset · Daily Yoga",
    price: "₹4,800",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
    url: "/hotel/soul-and-surf-varkala"
  }
];

// Roamly 5-Pillar Trust & Zero-Convenience-Fee Guarantee
const TRUST_PILLARS = [
  {
    id: "transparent-pricing",
    icon: IndianRupee,
    title: "Transparent ₹ INR Pricing",
    desc: "Zero convenience fee surprises at final checkout. Genuine, all-inclusive estimates upfront."
  },
  {
    id: "instant-booking",
    icon: Zap,
    title: "Instant Confirmation & PDF",
    desc: "Receive your verified booking voucher with QR code and emergency contact immediately."
  },
  {
    id: "refund-guarantee",
    icon: ShieldCheck,
    title: "Instant Refund Guarantee",
    desc: "100% free cancellation on eligible stays with swift direct refunds to your account."
  },
  {
    id: "concierge",
    icon: Headphones,
    title: "24/7 Dedicated Concierge",
    desc: "Direct WhatsApp & toll-free phone support with our India-based travel specialists."
  },
  {
    id: "verified-stays",
    icon: Award,
    title: "Handpicked & Audited",
    desc: "Every heritage haveli, mountain chalet, and ocean cottage is physically inspected."
  }
];

export default function Home({ savedIds = [], onToggleSave }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [attractionFilter, setAttractionFilter] = useState("All");
  const discoveryRef = useRef(null);
  const storiesTrackRef = useRef(null);
  const navigate = useNavigate();

  const safeSavedIds = Array.isArray(savedIds) ? savedIds : [];

  // Filter attractions based on category pill
  const filteredAttractions = useMemo(() => {
    if (attractionFilter === "All") return ATTRACTIONS;
    return ATTRACTIONS.filter((a) => a.category === attractionFilter);
  }, [attractionFilter]);

  // Handle category selection from docked hero bar
  const handleCategorySelect = (catId, filterVal) => {
    setActiveCategory(catId);
    setCategoryFilter(filterVal);
    // Smoothly scroll into discovery section
    if (discoveryRef.current) {
      discoveryRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Filter destinations based on category filter
  const displayedDestinations = useMemo(() => {
    const all = Array.isArray(destinations) ? destinations : [];
    // Prioritize Indian destinations for the authentic Indian travel experience
    const indianList = all.filter((d) => d.country === "India" || !d.country);
    const sourceList = indianList.length >= 6 ? indianList : all;

    if (!categoryFilter) {
      return sourceList.slice(0, 7);
    }

    const filtered = sourceList.filter((d) => {
      const matchCat = d.category && d.category.toLowerCase().includes(categoryFilter.toLowerCase());
      const matchMood = Array.isArray(d.mood)
        ? d.mood.some((m) => m.toLowerCase().includes(categoryFilter.toLowerCase()))
        : typeof d.mood === "string"
          ? d.mood.toLowerCase().includes(categoryFilter.toLowerCase())
          : false;
      return matchCat || matchMood;
    });

    return filtered.length > 0 ? filtered.slice(0, 7) : sourceList.slice(0, 7);
  }, [categoryFilter]);

  // Featured flagship card (first item in the editorial collection)
  const flagshipDestination = displayedDestinations[0] || destinations[0];
  const supportingDestinations = displayedDestinations.slice(1);

  const isFlagshipSaved = safeSavedIds.includes(flagshipDestination?.id);

  const handleFlagshipToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof onToggleSave === "function" && flagshipDestination) {
      onToggleSave(flagshipDestination.id);
    }
  };

  // Story scroll buttons
  const scrollStories = (direction) => {
    if (storiesTrackRef.current) {
      const amount = direction === "left" ? -340 : 340;
      storiesTrackRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  return (
    <main className="home-cinematic-page">
      {/* =========================================================================
          PRIORITY 1: FULLSCREEN CINEMATIC TRAVEL VIDEO HERO (100svh)
          Real HTML5 <video> background with transparent header and muted audio control
          ========================================================================= */}
      <HeroVideo
        activeCategory={activeCategory}
        onSelectCategory={handleCategorySelect}
      />

      {/* =========================================================================
          SECTION 2: 3-PANEL PANORAMIC DESTINATION SHOWCASE (INCREDIBLE INDIA REFERENCE)
          Direct multi-card landscape destination display with vertical red Book tab
          ========================================================================= */}
      <DestinationHeroShowcase
        activeCategory={activeCategory}
        onSelectCategory={handleCategorySelect}
        savedIds={safeSavedIds}
        onToggleSave={onToggleSave}
      />

      {/* =========================================================================
          SECTION 3: ICONIC ATTRACTIONS & LANDMARKS (INCREDIBLE INDIA REFERENCE)
          ========================================================================= */}
      <section className="section attractions-discovery-section" id="attractions">
        <div className="container">
          <div className="editorial-header">
            <div className="editorial-eyebrow">
              <Landmark size={15} />
              <span>TIMELESS HERITAGE & NATURAL WONDERS</span>
            </div>
            <h2 className="editorial-title">
              India's Most Revered <span className="script-accent-red">Landmarks.</span>
            </h2>
            <p className="editorial-subtitle">
              From historic sandstone forts and sacred riverfronts to high-altitude lakes and living root bridges.
            </p>
          </div>

          {/* Attraction Category Filter Buttons */}
          <div className="attractions-filter-row">
            {["All", "Forts & Palaces", "Sacred Shrines", "High Passes & Lakes", "Natural Wonders"].map((cat) => (
              <button
                key={cat}
                type="button"
                className={`attraction-filter-btn ${attractionFilter === cat ? "active" : ""}`}
                onClick={() => setAttractionFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="attractions-grid">
            {filteredAttractions.map((attr) => (
              <Link key={attr.id} to={attr.route} className="attraction-card">
                <div className="attraction-img-wrap">
                  <img src={attr.image} alt={attr.name} loading="lazy" />
                  <span className="attraction-category-badge">{attr.category}</span>
                </div>
                <div className="attraction-body">
                  <span className="attraction-location-pill">
                    <MapPin size={12} />
                    <span>{attr.location}</span>
                  </span>
                  <h3 className="attraction-card-title">{attr.name}</h3>
                  <p className="attraction-highlight-text">{attr.highlight}</p>
                  <span className="attraction-action-link">
                    <span>Explore Landmark</span>
                    <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: EDITORIAL DESTINATION DISCOVERY SECTION
          "Every Journey Begins With a Feeling"
          ========================================================================= */}
      <section className="section editorial-discovery-section" ref={discoveryRef} id="destinations">
        <div className="container">
          <div className="editorial-header">
            <div className="editorial-eyebrow">
              <span className="eyebrow-red-bullet" />
              <span>THE CURATED ROAMLY COLLECTION</span>
            </div>
            <h2 className="editorial-title">
              Every Journey Begins With a <span className="script-accent-red">Feeling.</span>
            </h2>
            <p className="editorial-subtitle">
              Find your next escape, from quiet mountain mornings to vibrant cultural streets.
            </p>
          </div>

          {/* Asymmetric Editorial Layout: 1 Large Flagship Card + Grid of Standard Cards */}
          <div className="editorial-discovery-layout">
            {flagshipDestination && (
              <div className="discovery-flagship-card">
                <Link
                  to={`/destination/${flagshipDestination.id}`}
                  className="flagship-image-wrapper"
                  aria-label={`Explore ${flagshipDestination.name}`}
                >
                  <img
                    src={flagshipDestination.image}
                    alt={flagshipDestination.name}
                    loading="lazy"
                  />
                  <div className="flagship-gradient-overlay" />

                  {/* Top Badges */}
                  <div className="flagship-top-badges">
                    <span className="flagship-featured-badge">
                      <Sparkles size={13} />
                      <span>FEATURED EXPEDITION</span>
                    </span>

                    <button
                      type="button"
                      className={`flagship-wishlist-btn ${isFlagshipSaved ? "active" : ""}`}
                      onClick={handleFlagshipToggle}
                      title={isFlagshipSaved ? "Saved to Wishlist" : "Save to Wishlist"}
                      aria-label="Toggle wishlist"
                    >
                      <Heart
                        size={16}
                        fill={isFlagshipSaved ? "#ef4444" : "none"}
                        color={isFlagshipSaved ? "#ef4444" : "#ffffff"}
                      />
                    </button>
                  </div>

                  {/* Bottom Content within Image */}
                  <div className="flagship-overlay-content">
                    <div className="flagship-location-pill">
                      <MapPin size={13} />
                      <span>{flagshipDestination.state || flagshipDestination.country}</span>
                    </div>

                    <h3 className="flagship-destination-name">{flagshipDestination.name}</h3>

                    <p className="flagship-description">
                      {flagshipDestination.description ||
                        "Wake up to mist-covered tea gardens, gentle mountain roads, and serene horizons."}
                    </p>

                    <div className="flagship-meta-row">
                      {flagshipDestination.days && (
                        <div className="flagship-meta-item">
                          <Clock size={13} />
                          <span>{flagshipDestination.days}</span>
                        </div>
                      )}
                      {flagshipDestination.budget && (
                        <div className="flagship-meta-item">
                          <IndianRupee size={13} />
                          <span>{flagshipDestination.budget}</span>
                        </div>
                      )}
                      {flagshipDestination.bestTime && (
                        <div className="flagship-meta-item highlight">
                          <Sun size={13} />
                          <span>Best: {flagshipDestination.bestTime}</span>
                        </div>
                      )}
                    </div>

                    <div className="flagship-action-bar">
                      <span className="flagship-explore-btn">
                        <span>Explore Destination</span>
                        <ArrowRight size={16} />
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Standard Supporting Destination Cards */}
            <div className="discovery-supporting-grid">
              {supportingDestinations.map((destination, idx) => (
                <DestinationCard
                  key={destination.id}
                  destination={destination}
                  saved={safeSavedIds.includes(destination.id)}
                  isSaved={safeSavedIds.includes(destination.id)}
                  onToggleSave={onToggleSave}
                  index={idx}
                />
              ))}
            </div>
          </div>

          {/* Bottom Link to Full Catalog */}
          <div className="editorial-footer-actions">
            <Link to="/discover" className="editorial-view-all-btn">
              <span>View All 25+ Indian Destinations</span>
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: LARGE FEATURED-DESTINATION EDITORIAL SECTION
          "The Mountains Are Calling — Ladakh — Where the Earth Meets the Sky"
          ========================================================================= */}
      <section className="featured-panorama-section" aria-label="Featured Showcase: Ladakh">
        <div
          className="featured-panorama-bg"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=85')"
          }}
        />
        <div className="featured-panorama-scrim" />

        <div className="container featured-panorama-content">
          <div className="featured-panorama-eyebrow">
            <Mountain size={16} />
            <span>THE MOUNTAINS ARE CALLING</span>
          </div>

          <h2 className="featured-panorama-title">
            Ladakh — Where the Earth <span className="script-accent-gold">Meets the Sky.</span>
          </h2>

          <p className="featured-panorama-prose">
            Vast windswept plateaus, turquoise lakes perched at 14,000 feet, and ancient monasteries carved
            precariously into sheer mountain faces. Ladakh is not merely a vacation destination—it is a perspective
            shift that recalibrates your sense of scale, wonder, and inner silence.
          </p>

          <div className="featured-panorama-stats">
            <div className="stat-pill">
              <strong>4,350m</strong>
              <small>Average High-Pass Elevation</small>
            </div>
            <div className="stat-pill">
              <strong>6–8 Days</strong>
              <small>Recommended Itinerary</small>
            </div>
            <div className="stat-pill">
              <strong>June – Sept</strong>
              <small>Prime Traveling Window</small>
            </div>
            <div className="stat-pill">
              <strong>100%</strong>
              <small>Zero Convenience Fee</small>
            </div>
          </div>

          <div className="featured-panorama-actions">
            <Link to="/destination/ladakh" className="panorama-btn-primary">
              <span>Explore Ladakh Expedition</span>
              <ArrowRight size={17} />
            </Link>
            <Link to="/planner" className="panorama-btn-secondary">
              <Calendar size={16} />
              <span>Plan This Journey</span>
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: TRAVEL BY MOOD EXPERIENCE
          "Start With an Emotion — What is Your Travel Mood?"
          ========================================================================= */}
      <section className="section travel-mood-experience-section" id="moods">
        <div className="container">
          <div className="editorial-header">
            <div className="editorial-eyebrow">
              <Sparkles size={15} />
              <span>SIGNATURE ROAMLY DISCOVERY</span>
            </div>
            <h2 className="editorial-title">
              What Is Your Travel <span className="script-accent-warm">Mood?</span>
            </h2>
            <p className="editorial-subtitle">
              Forget the tourist rush for a moment. Choose how you truly want to feel, and let your journey unfold
              naturally.
            </p>
          </div>

          <div className="mood-experience-grid">
            {MOOD_EXPERIENCES.map((m) => (
              <Link key={m.id} to={m.route} className="mood-experience-card">
                <div className="mood-card-img-wrap">
                  <img src={m.image} alt={m.statement} loading="lazy" />
                  <div className="mood-card-scrim" />
                  <span className="mood-card-badge">{m.moodTag}</span>
                </div>

                <div className="mood-card-body">
                  <h3 className="mood-card-statement">"{m.statement}"</h3>
                  <p className="mood-card-subtitle">{m.subtitle}</p>
                  <div className="mood-card-cta">
                    <span>Discover matching places</span>
                    <MoveUpRight size={15} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 8: VISUALLY RICH EXPERIENCE COLLECTIONS
          "Choose Your Kind of Escape"
          ========================================================================= */}
      <section className="section experience-collections-section">
        <div className="container">
          <div className="editorial-header">
            <div className="editorial-eyebrow">
              <Compass size={15} />
              <span>CURATED ESCAPES</span>
            </div>
            <h2 className="editorial-title">
              Choose Your Kind of <span className="script-accent-warm">Escape.</span>
            </h2>
            <p className="editorial-subtitle">
              Thematic collections designed around the specific way you want to spend your days.
            </p>
          </div>

          <div className="experience-collections-grid">
            {EXPERIENCE_COLLECTIONS.map((c) => {
              const IconComp = c.icon;
              return (
                <Link key={c.id} to={c.url} className={`experience-col-card ${c.span || ""}`}>
                  <div className="experience-col-img-wrap">
                    <img src={c.image} alt={c.title} loading="lazy" />
                    <div className="experience-col-overlay" />
                    <span className="experience-col-badge">
                      <IconComp size={13} />
                      <span>{c.tag}</span>
                    </span>
                  </div>

                  <div className="experience-col-content">
                    <div className="experience-col-top">
                      <span className="experience-col-days">{c.days}</span>
                    </div>
                    <h3 className="experience-col-title">{c.title}</h3>
                    <p className="experience-col-sub">{c.subtitle}</p>
                    <div className="experience-col-link">
                      <span>Explore Collection</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 8: CURATED ITINERARIES BY DURATION & REGION (INCREDIBLE INDIA REFERENCE)
          ========================================================================= */}
      <section className="section itineraries-discovery-section" id="itineraries">
        <div className="container">
          <div className="editorial-header">
            <div className="editorial-eyebrow">
              <Calendar size={15} />
              <span>HANDCRAFTED ITINERARIES</span>
            </div>
            <h2 className="editorial-title">
              Plan Your Journey by <span className="script-accent-red">Days & Interest.</span>
            </h2>
            <p className="editorial-subtitle">
              Carefully paced routes with transparent ₹ INR budgets, vetted stays, and local experiences.
            </p>
          </div>

          <div className="itineraries-grid">
            {CURATED_ITINERARIES.map((itin) => (
              <div key={itin.id} className="itinerary-card">
                <div className="itinerary-img-wrap">
                  <img src={itin.image} alt={itin.title} loading="lazy" />
                  <span className="itinerary-badge-duration">{itin.days}</span>
                  <span className="itinerary-badge-pace">{itin.pace}</span>
                </div>
                <div className="itinerary-body">
                  <span className="itinerary-region-label">{itin.region}</span>
                  <h3 className="itinerary-card-title">{itin.title}</h3>

                  <div className="itinerary-stops-row">
                    {itin.stops.map((stop, sIdx) => (
                      <span key={stop} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <span className="itinerary-stop-chip">{stop}</span>
                        {sIdx < itin.stops.length - 1 && <span className="itinerary-stop-arrow">→</span>}
                      </span>
                    ))}
                  </div>

                  <p className="itinerary-highlights-text">{itin.highlights}</p>

                  <div className="itinerary-footer-bar">
                    <div className="itinerary-budget-info">
                      <span className="itinerary-budget-label">Estimated Budget</span>
                      <span className="itinerary-budget-val">{itin.budget}</span>
                    </div>
                    <Link to={itin.route} className="itinerary-plan-btn">
                      <Calendar size={14} />
                      <span>Customize in Planner</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 9: HIDDEN GEMS OF INDIA (UNCROWDED HORIZONS)
          ========================================================================= */}
      <section className="section hidden-gems-discovery-section" id="hidden-gems">
        <div className="container">
          <div className="section-header-split">
            <div>
              <div className="editorial-eyebrow">
                <Sparkles size={15} />
                <span>OFF THE BEATEN TRACK</span>
              </div>
              <h2 className="editorial-title">
                Hidden Gems & <span className="script-accent-red">Quiet Horizons.</span>
              </h2>
              <p className="editorial-subtitle">
                Escape the crowds with these lesser-known sanctuaries, pine meadows, and mist-covered ridges.
              </p>
            </div>
            <Link to="/surprise" className="text-link-warm">
              <span>Try Surprise Destination</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="hidden-gems-grid">
            {HIDDEN_GEMS.map((gem) => (
              <Link key={gem.id} to={gem.route} className="hidden-gem-card">
                <div className="hidden-gem-img-wrap">
                  <img src={gem.image} alt={gem.name} loading="lazy" />
                  <span className="hidden-gem-tag-badge">{gem.tag}</span>
                </div>
                <div className="hidden-gem-body">
                  <span className="hidden-gem-state-tag">{gem.state}</span>
                  <h3 className="hidden-gem-title">{gem.name}</h3>
                  <p className="hidden-gem-desc">{gem.description}</p>
                  <span className="hidden-gem-cta-link">
                    <span>Discover Sanctuary</span>
                    <ArrowRight size={13} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 10: FESTIVALS & CULTURAL HIGHLIGHTS (INCREDIBLE INDIA REFERENCE)
          ========================================================================= */}
      <section className="section festivals-discovery-section" id="festivals">
        <div className="container">
          <div className="editorial-header">
            <div className="editorial-eyebrow">
              <Flame size={15} />
              <span>VIBRANT TRADITIONS & CELEBRATIONS</span>
            </div>
            <h2 className="editorial-title">
              Experience the Living Soul of <span className="script-accent-red">Indian Festivals.</span>
            </h2>
            <p className="editorial-subtitle">
              Plan your travel around unforgettable cultural spectacles, from floating river lamps to masked monastic dances.
            </p>
          </div>

          <div className="festivals-grid">
            {FESTIVALS.map((fest) => (
              <Link key={fest.id} to={fest.route} className="festival-card">
                <div className="festival-img-wrap">
                  <img src={fest.image} alt={fest.title} loading="lazy" />
                  <span className="festival-date-badge">{fest.date}</span>
                  <span className="festival-tag-badge">{fest.tag}</span>
                </div>
                <div className="festival-body">
                  <span className="festival-loc-pill">
                    <MapPin size={12} />
                    <span>{fest.location}</span>
                  </span>
                  <h3 className="festival-card-title">{fest.title}</h3>
                  <p className="festival-desc-text">{fest.description}</p>
                  <span className="festival-action-link">
                    <span>Plan Around Festival</span>
                    <ArrowRight size={13} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 11: HORIZONTAL VISUAL TRAVEL STORIES SECTION
          "Notes From the Road — Little Stories. Big Memories."
          ========================================================================= */}
      <section className="section travel-stories-carousel-section">
        <div className="container">
          <div className="section-header-split">
            <div>
              <div className="editorial-eyebrow">
                <BookOpen size={15} />
                <span>FIELD NOTES FOR MINDFUL TRAVELERS</span>
              </div>
              <h2 className="editorial-title">
                Little Stories. <span className="script-accent-warm">Big Memories.</span>
              </h2>
              <p className="editorial-subtitle">
                Observations, reflections, and quiet reminders for a more meaningful way of traveling.
              </p>
            </div>

            <div className="carousel-control-buttons">
              <button
                type="button"
                className="carousel-nav-btn"
                onClick={() => scrollStories("left")}
                aria-label="Scroll stories left"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className="carousel-nav-btn"
                onClick={() => scrollStories("right")}
                aria-label="Scroll stories right"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="stories-horizontal-track" ref={storiesTrackRef}>
            {TRAVEL_STORIES.map((story) => (
              <article key={story.id} className="story-carousel-card">
                <Link to={story.url} className="story-card-image-wrap">
                  <img src={story.image} alt={story.title} loading="lazy" />
                  <span className="story-card-number">{story.number}</span>
                  <span className="story-card-readtime">{story.read}</span>
                </Link>

                <div className="story-card-body">
                  <div className="story-card-meta">
                    <span className="story-tag-pill">{story.tag}</span>
                    <span className="story-place-pill">
                      <MapPin size={12} /> {story.place}
                    </span>
                  </div>

                  <h3 className="story-card-title">
                    <Link to={story.url}>{story.title}</Link>
                  </h3>

                  <p className="story-card-text">{story.text}</p>

                  <Link to={story.url} className="story-read-link">
                    <span>Read full journal</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="stories-bottom-link-row">
            <Link to="/stories" className="editorial-view-all-btn">
              <span>Visit the Roamly Field Archive</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          BOUTIQUE HAVELIS & STAYS SPOTLIGHT
          ========================================================================= */}
      <section className="section boutique-stays-section">
        <div className="container">
          <div className="section-header-split">
            <div>
              <div className="editorial-eyebrow">
                <BedDouble size={15} />
                <span>AUTHENTIC INDIAN HOSPITALITY</span>
              </div>
              <h2 className="editorial-title">
                Handpicked Havelis & <span className="script-accent-warm">Chalets.</span>
              </h2>
              <p className="editorial-subtitle">
                Stay in restored royal courtyards, high-altitude cedar cabins, and mist-covered tea estates.
              </p>
            </div>

            <Link to="/hotels" className="text-link-warm">
              <span>View all verified stays</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="boutique-stays-grid">
            {CURATED_STAYS.map((stay) => (
              <Link key={stay.id} to={stay.url} className="boutique-stay-card">
                <div className="boutique-stay-img-wrap">
                  <img src={stay.image} alt={stay.title} loading="lazy" />
                  <span className="boutique-stay-rating">
                    <Star size={12} fill="#e59840" color="#e59840" /> {stay.rating}
                  </span>
                  <span className="boutique-stay-type">{stay.type}</span>
                </div>

                <div className="boutique-stay-info">
                  <span className="boutique-stay-loc">{stay.location}</span>
                  <h3 className="boutique-stay-name">{stay.title}</h3>
                  <p className="boutique-stay-tag">{stay.tag}</p>

                  <div className="boutique-stay-footer">
                    <div className="boutique-stay-price">
                      {stay.price} <span>/ night</span>
                    </div>
                    <span className="boutique-stay-btn">
                      Book Stay <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 10: PREMIUM TRIP-PLANNING CALL TO ACTION
          "Your Next Great Story Starts Here"
          ========================================================================= */}
      <section className="trip-planning-cta-section" aria-label="Trip planning call to action">
        <div
          className="planning-cta-bg"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1920&q=85')"
          }}
        />
        <div className="planning-cta-scrim" />

        <div className="container planning-cta-content">
          <div className="planning-eyebrow">
            <Sparkles size={16} />
            <span>CUSTOMIZE YOUR EXPERIENCE</span>
          </div>

          <h2 className="planning-title">
            Your Next Great Story <span className="script-accent-gold">Starts Here.</span>
          </h2>

          <p className="planning-subtitle">
            Tell us what inspires you. Roamly helps you discover places that match your travel mood, with transparent ₹
            INR budgets and zero hidden charges.
          </p>

          <div className="planning-actions-row">
            <Link to="/planner" className="planning-btn-primary">
              <Calendar size={17} />
              <span>Build My Trip</span>
            </Link>

            <Link to="/surprise" className="planning-btn-secondary">
              <Sparkles size={16} />
              <span>Surprise Me</span>
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          TRUST GUARANTEE: ROAMLY 5-PILLAR PROMISE
          ========================================================================= */}
      <section className="section trust-pillars-section">
        <div className="container">
          <div className="trust-header-center">
            <div className="trust-rating-badge">
              <CheckCircle2 size={16} />
              <span>Rated 4.9/5 by 25,000+ Indian Travelers</span>
            </div>
            <h2 className="trust-main-heading">
              Why India Travels with <span className="script-accent-warm">Roamly.</span>
            </h2>
            <p className="trust-main-sub">
              Zero convenience fee surprises at final checkout, 100% verified boutique properties, and dedicated
              personal travel assistance whenever you need it.
            </p>
          </div>

          <div className="trust-pillars-grid">
            {TRUST_PILLARS.map((pillar) => {
              const PillarIcon = pillar.icon;
              return (
                <div key={pillar.id} className="trust-pillar-card">
                  <div className="trust-pillar-icon-box">
                    <PillarIcon size={24} />
                  </div>
                  <h3 className="trust-pillar-title">{pillar.title}</h3>
                  <p className="trust-pillar-desc">{pillar.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}