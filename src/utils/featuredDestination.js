import { destinations as defaultDestinations } from "../data/destinations.js";

export const SESSION_FEATURED_KEY = "roamly_session_featured_destination";
export const LAST_FEATURED_KEY = "roamly_last_featured_destination_id";

// Curated highlights and badges for authentic Indian and global destinations
export const DESTINATION_CURATED_HIGHLIGHTS = {
  ladakh: {
    title: "Pangong Tso, Ladakh",
    subtitle: "High-altitude stillness · 4,225m elevation",
    badge: "Featured Escape",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=85"
  },
  udaipur: {
    title: "Udaipur, Rajasthan",
    subtitle: "Royal lake palaces · Sunset across Lake Pichola",
    badge: "Romantic Escape",
    image: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=1200&q=85"
  },
  munnar: {
    title: "Munnar, Kerala",
    subtitle: "Rolling tea hills · Kolukkumalai sunrise viewpoints",
    badge: "Mountain Sanctuary",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85"
  },
  goa: {
    title: "South Goa",
    subtitle: "Golden palm shores · Historic Fontainhas heritage",
    badge: "Coastal Retreat",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=85"
  },
  gulmarg: {
    title: "Gulmarg, Kashmir",
    subtitle: "Snow pine slopes · Asia's highest cable car summit",
    badge: "Alpine Wonder",
    image: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=85"
  },
  meghalaya: {
    title: "Meghalaya, Northeast",
    subtitle: "Mist & waterfalls · Living double-decker root bridges",
    badge: "Nature Getaway",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=85"
  },
  hampi: {
    title: "Hampi, Karnataka",
    subtitle: "Vijayanagara ruins · Ancient boulder-strewn horizons",
    badge: "Cultural Journey",
    image: "https://www.holidaymonk.com/wp-content/uploads/2020/10/Vastuchitra_Stone-Chariot-Hampi.jpg"
  },
  andaman: {
    title: "Andaman & Nicobar Islands",
    subtitle: "Turquoise lagoons · Pristine Radhanagar coral shores",
    badge: "Island Sanctuary",
    image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=85"
  },
  varanasi: {
    title: "Varanasi, Uttar Pradesh",
    subtitle: "Spiritual riverfront ghats · Timeless morning serenity",
    badge: "Cultural Pilgrimage",
    image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=85"
  },
  tawang: {
    title: "Tawang, Arunachal Pradesh",
    subtitle: "Eastern Himalayan heights · 400-year-old monastery",
    badge: "Highland Retreat",
    image: "https://images.unsplash.com/photo-1571536802807-30451e3955d8?auto=format&fit=crop&w=1200&q=85"
  },
  coorg: {
    title: "Coorg, Karnataka",
    subtitle: "Verdant coffee estates · Mandalpatti viewpoint trails",
    badge: "Nature Escape",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85"
  },
  kutch: {
    title: "Rann of Kutch, Gujarat",
    subtitle: "Infinite white salt desert · Moonlight over the Great Rann",
    badge: "Desert Wonder",
    image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=85"
  },
  gokarna: {
    title: "Gokarna, Karnataka",
    subtitle: "Cliffside ocean trails · Peaceful Half Moon Beach",
    badge: "Coastal Calm",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85"
  },
  spiti: {
    title: "Spiti Valley, Himachal",
    subtitle: "Rugged Trans-Himalayan gorges · Key Monastery heights",
    badge: "Thrill & Solitude",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85"
  },
  rishikesh: {
    title: "Rishikesh, Uttarakhand",
    subtitle: "Ganga river gorge · Himalayan foothills & peaceful aartis",
    badge: "Riverside Calm",
    image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=85"
  },
  darjeeling: {
    title: "Darjeeling, West Bengal",
    subtitle: "Tea estate slopes · Panoramic Kangchenjunga views",
    badge: "Himalayan Charm",
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=85"
  },
  manali: {
    title: "Manali, Himachal Pradesh",
    subtitle: "Pine forests & snow passes · Gateway to Solang & Sissu",
    badge: "Mountain Escape",
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=85"
  },
  switzerland: {
    title: "Swiss Alps, Switzerland",
    subtitle: "Alpine peaks & glacial lakes · Postcard Lauterbrunnen",
    badge: "Global Escape",
    image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1200&q=85"
  },
  kyoto: {
    title: "Kyoto, Japan",
    subtitle: "Lantern-lit historic streets · Bamboo groves & shrines",
    badge: "Cultural Haven",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=85"
  },
  bali: {
    title: "Bali, Indonesia",
    subtitle: "Emerald rice terraces · Restorative ocean temples",
    badge: "Tropical Haven",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=85"
  }
};

/**
 * Standardizes a destination object into the full shape expected by the dashboard banner.
 */
export function formatFeaturedDestination(dest) {
  if (!dest) {
    // Default safe fallback (Pangong Tso, Ladakh)
    return {
      id: "ladakh",
      name: "Pangong Tso, Ladakh",
      title: "Pangong Tso, Ladakh",
      subtitle: "High-altitude stillness · 4,225m elevation",
      badge: "Featured Escape",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=85",
      description: "Discover high mountain passes, turquoise lakes, monasteries, and vast open landscapes.",
      state: "Ladakh, India",
      country: "India"
    };
  }

  const idKey = String(dest.id || "").toLowerCase();
  const curated = DESTINATION_CURATED_HIGHLIGHTS[idKey];

  const derivedTitle =
    curated?.title ||
    (dest.state
      ? `${dest.name}, ${dest.state.replace(", India", "")}`
      : `${dest.name}, ${dest.country || "India"}`);

  const derivedSubtitle =
    curated?.subtitle ||
    `${dest.category || "Scenic"} Escape · ${
      dest.hiddenGem ? `Hidden gem: ${dest.hiddenGem}` : dest.description || "Thoughtfully curated escape"
    }`;

  const derivedBadge =
    curated?.badge ||
    (dest.category ? `${dest.category} Escape` : "Featured Escape");

  const derivedImage =
    dest.image ||
    curated?.image ||
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=85";

  return {
    id: dest.id || idKey || "ladakh",
    name: dest.name || derivedTitle,
    title: derivedTitle,
    subtitle: derivedSubtitle,
    badge: derivedBadge,
    image: derivedImage,
    description: dest.description || "",
    state: dest.state || "",
    country: dest.country || "India"
  };
}

/**
 * Selects a fresh featured destination avoiding the immediate previous featured ID.
 * Writes to sessionStorage and updates localStorage last-featured record.
 */
export function selectFreshFeaturedDestination(availableDestinations = []) {
  const pool = Array.isArray(availableDestinations) && availableDestinations.length > 0
    ? availableDestinations
    : defaultDestinations;

  // Filter pool to valid destination objects
  const validDestinations = pool.filter((d) => d && d.id && (d.name || d.title));

  if (validDestinations.length === 0) {
    const fallback = formatFeaturedDestination(null);
    try {
      sessionStorage.setItem(SESSION_FEATURED_KEY, JSON.stringify(fallback));
    } catch {}
    return fallback;
  }

  // If only 1 destination exists, display it without error
  if (validDestinations.length === 1) {
    const formatted = formatFeaturedDestination(validDestinations[0]);
    try {
      sessionStorage.setItem(SESSION_FEATURED_KEY, JSON.stringify(formatted));
      localStorage.setItem(LAST_FEATURED_KEY, formatted.id);
    } catch {}
    return formatted;
  }

  // Retrieve last featured ID from localStorage (persists across sessions)
  let lastFeaturedId = "";
  try {
    lastFeaturedId = localStorage.getItem(LAST_FEATURED_KEY) || "";
  } catch {}

  // Filter out the immediate previous destination to guarantee variety
  const alternatives = validDestinations.filter(
    (d) => String(d.id).toLowerCase() !== String(lastFeaturedId).toLowerCase()
  );

  const candidatePool = alternatives.length > 0 ? alternatives : validDestinations;

  // Pick a random candidate from the eligible pool
  const randomIndex = Math.floor(Math.random() * candidatePool.length);
  const selectedRaw = candidatePool[randomIndex];
  const formatted = formatFeaturedDestination(selectedRaw);

  try {
    sessionStorage.setItem(SESSION_FEATURED_KEY, JSON.stringify(formatted));
    localStorage.setItem(LAST_FEATURED_KEY, formatted.id);
  } catch {}

  return formatted;
}

/**
 * Returns the stable featured destination for the current login session.
 * - If already selected in sessionStorage, reuses it (handles re-renders, navigation, and page refreshes).
 * - If not present (e.g. freshly logged in or first visit), selects a new one and caches it.
 */
export function getOrSelectSessionFeaturedDestination(availableDestinations = []) {
  try {
    const saved = sessionStorage.getItem(SESSION_FEATURED_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.id && parsed.title) {
        return parsed;
      }
    }
  } catch {
    /* Fallback to select fresh */
  }

  return selectFreshFeaturedDestination(availableDestinations);
}

/**
 * Clears the session destination cache (called on logout/new login).
 */
export function clearSessionFeaturedDestination() {
  try {
    sessionStorage.removeItem(SESSION_FEATURED_KEY);
  } catch {}
}
