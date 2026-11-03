import coordinatesData from "../../backend/data/destinationCoordinates.json";

export const DESTINATION_COORDINATES = coordinatesData;

/**
 * Normalizes destination keys for seamless lookup across IDs, numeric IDs, and names
 */
export function normalizeKey(idOrName) {
  if (!idOrName) return "";
  const cleaned = String(idOrName).toLowerCase().trim().replace(/[^a-z0-9]/g, "");
  
  // Direct matches
  for (const key of Object.keys(DESTINATION_COORDINATES)) {
    if (key.replace(/[^a-z0-9]/g, "") === cleaned) return key;
    if (DESTINATION_COORDINATES[key].name.toLowerCase().replace(/[^a-z0-9]/g, "") === cleaned) return key;
  }
  
  // Specific aliases and numeric mappings
  const aliases = {
    "1": "munnar",
    "2": "jaipur",
    "3": "gokarna",
    "4": "spiti",
    "spitivalley": "spiti",
    "5": "udaipur",
    "6": "meghalaya",
    "7": "kyoto",
    "8": "bali",
    "9": "queenstown",
    "10": "manali",
    "11": "ladakh",
    "12": "ooty",
    "13": "coorg",
    "14": "goa",
    "15": "varkala",
    "16": "hampi",
    "17": "varanasi",
    "18": "rishikesh",
    "19": "andaman",
    "andamanislands": "andaman",
    "20": "darjeeling",
    "21": "agra",
    "22": "maldives",
    "23": "swiss-alps",
    "swissalps": "swiss-alps",
    "swiss-alps": "swiss-alps",
    "24": "thailand",
    "25": "paris",
    "26": "singapore",
    "27": "dubai",
    "28": "istanbul",
    "29": "cape-town",
    "capetown": "cape-town",
    "cape-town": "cape-town",
    "30": "ananthapuram",
    "31": "kadiri",
    "32": "gulmarg",
    "33": "tawang",
    "34": "rann-of-kutch",
    "rannofkutch": "rann-of-kutch",
    "rann-of-kutch": "rann-of-kutch"
  };

  return aliases[cleaned] || "";
}

/**
 * Retrieve verified coordinates, bounds, and attractions for a destination
 */
export function getDestinationGeo(idOrName) {
  const key = normalizeKey(idOrName);
  if (key && DESTINATION_COORDINATES[key]) {
    return DESTINATION_COORDINATES[key];
  }
  // Default to Jaipur center if unmapped
  return {
    id: "unknown",
    name: String(idOrName || "Travel Destination"),
    lat: 26.9124,
    lng: 75.7873,
    zoom: 12,
    bounds: { minLat: 26.75, maxLat: 27.05, minLng: 75.65, maxLng: 76.00 },
    attractions: []
  };
}

/**
 * Check if a coordinate is strictly within destination bounding box (Hallucination Quarantine)
 */
export function isWithinDestinationBounds(idOrName, lat, lng) {
  const geo = getDestinationGeo(idOrName);
  if (!geo.bounds) return true;
  return (
    lat >= geo.bounds.minLat &&
    lat <= geo.bounds.maxLat &&
    lng >= geo.bounds.minLng &&
    lng <= geo.bounds.maxLng
  );
}

/**
 * Haversine formula to compute great-circle distance between two points in km
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 0;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

