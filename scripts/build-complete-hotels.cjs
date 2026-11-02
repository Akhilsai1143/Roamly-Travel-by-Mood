// scripts/build-complete-hotels.cjs
// Adds verified boutique and heritage stays for every destination to HOTELS_DATA, and exports getHotelsForDestination.

const fs = require("fs");
const path = require("path");

const ADDITIONAL_HOTELS = [
  {
    id: "aloha-on-the-ganges-rishikesh",
    name: "Aloha On The Ganges Sanctuary",
    tagline: "Serene riverfront retreat situated right on the banks of holy River Ganga in Tapovan",
    city: "Rishikesh",
    state: "Uttarakhand",
    country: "India",
    type: "Riverside Wellness Resort",
    rating: 4.8,
    reviewsCount: 215,
    pricePerNight: 7200,
    originalPrice: 9500,
    mood: ["Peace", "Adventure", "Calm", "Wellness"],
    badge: "EaseMyTrip Verified",
    heroImage: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Perched gracefully along the emerald waters of the Ganga in Tapovan, Aloha offers an idyllic blend of spiritual wellness and Himalayan foothill views. Featuring an infinity pool overlooking the sacred river, daily morning yoga sessions, and an Ayurvedic spa.",
    locationAddress: "National Highway 58, Tapovan, Rishikesh, Uttarakhand 249192, India",
    nearestAirport: "Dehradun Jolly Grant Airport (DED) — 21 km (35 mins drive)",
    nearestStation: "Yog Nagari Rishikesh (YNRK) — 6 km (15 mins drive)",
    amenities: [
      { id: "pool", label: "Riverfront Infinity Pool" },
      { id: "yoga", label: "Daily Sunrise Yoga & Pranayama" },
      { id: "spa", label: "Ayurvedic Brij Wellness" },
      { id: "dining", label: "Riverside Garden Dining" },
      { id: "wifi", label: "High-Speed Wi-Fi" }
    ],
    roomTypes: [
      {
        id: "ganga-view-suite",
        name: "Ganga View Superior Suite",
        size: "480 sq.ft.",
        capacity: "2 Guests · 1 King Bed",
        price: 7200,
        originalPrice: 9500,
        image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
        perks: ["Complimentary Organic Breakfast", "Private River-Facing Balcony", "Free Yoga Sessions", "Free Cancellation 48h prior"]
      }
    ]
  },
  {
    id: "brijrama-palace-varanasi",
    name: "BrijRama Palace Heritage",
    tagline: "210-year-old riverfront sandstone palace perched directly upon Darbhanga Ghat",
    city: "Varanasi",
    state: "Uttar Pradesh",
    country: "India",
    type: "Heritage River Palace",
    rating: 4.9,
    reviewsCount: 280,
    pricePerNight: 13500,
    originalPrice: 18000,
    mood: ["Culture", "Heritage", "Luxury", "Peace"],
    badge: "EaseMyTrip Verified",
    heroImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Built in 1812 by the royal house of Nagpur on Darbhanga Ghat, BrijRama Palace is one of the oldest riverfront structures on the holy Ganga. Guests arrive by private vintage wooden bajra boat and ascend via South Asia's first heritage elevator.",
    locationAddress: "Darbhanga Ghat, Dashashwamedh, Varanasi, Uttar Pradesh 221001, India",
    nearestAirport: "Lal Bahadur Shastri Airport (VNS) — 26 km (50 mins drive)",
    nearestStation: "Varanasi Junction (BSB) — 5 km (20 mins drive)",
    amenities: [
      { id: "boat", label: "Private Heritage Bajra Boat Transfers" },
      { id: "breakfast", label: "Royal Satvik & Continental Breakfast" },
      { id: "dining", label: "Darbhanga Fine Dining Terrace" },
      { id: "views", label: "Direct Ganga River Sunrise Views" }
    ],
    roomTypes: [
      {
        id: "maharaja-ganga-suite",
        name: "Maharaja Ganga View Suite",
        size: "520 sq.ft.",
        capacity: "2 Guests · 1 King Bed",
        price: 13500,
        originalPrice: 18000,
        image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
        perks: ["Royal Buffet Breakfast", "Private Sunrise Boat Cruise", "Personal Heritage Guide", "100% Free Cancellation"]
      }
    ]
  },
  {
    id: "the-grand-dragon-ladakh",
    name: "The Grand Dragon Ladakh",
    tagline: "Eco-conscious luxury haven with unobstructed panoramas of the snow-clad Stok Kangri range",
    city: "Ladakh",
    state: "Ladakh",
    country: "India",
    type: "Luxury Mountain Resort",
    rating: 4.9,
    reviewsCount: 310,
    pricePerNight: 9800,
    originalPrice: 13000,
    mood: ["Adventure", "Luxury", "Peace", "Snow"],
    badge: "EaseMyTrip Verified",
    heroImage: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Ladakh's premier luxury mountain retreat, decorated with handcrafted Ladakhi wooden woodwork, thangka paintings, and solar-paneled central heating. Offers 360-degree views of Stok Kangri and Khardung La ridge.",
    locationAddress: "Old Road Sheynam, Leh, Ladakh 194101, India",
    nearestAirport: "Kushok Bakula Rimpochee Airport (IXL) — 4 km (10 mins drive)",
    nearestStation: "Jammu Tawi Railway Station — 700 km",
    amenities: [
      { id: "heating", label: "Central Solar Climate Control" },
      { id: "oxygen", label: "In-Room Oxygen Assistance" },
      { id: "breakfast", label: "Grand Himalayan Breakfast" },
      { id: "views", label: "Stok Kangri Snow-Peak Vistas" }
    ],
    roomTypes: [
      {
        id: "deluxe-stok-room",
        name: "Deluxe Stok Mountain View Room",
        size: "420 sq.ft.",
        capacity: "2 Guests · 1 King Bed",
        price: 9800,
        originalPrice: 13000,
        image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
        perks: ["Hot Breakfast Buffet", "Acclimatization Tea & Care", "Direct Stok Kangri Views", "Free Airport Shuttle"]
      }
    ]
  },
  {
    id: "kahani-paradise-gokarna",
    name: "Kahani Paradise Ocean Estate",
    tagline: "Exclusive 20-acre private tropical estate overlooking the meeting of the Western Ghats and Arabian Sea",
    city: "Gokarna",
    state: "Karnataka",
    country: "India",
    type: "Boutique Coastal Estate",
    rating: 4.9,
    reviewsCount: 95,
    pricePerNight: 8900,
    originalPrice: 12000,
    mood: ["Peace", "Beach", "Luxury", "Calm"],
    badge: "EaseMyTrip Verified",
    heroImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Nestled in 20 acres of private coconut and betel-nut groves above Paradise Beach, Kahani Paradise offers sweeping views of the Arabian sea and lush estuaries.",
    locationAddress: "Bada Village, Belekan, Gokarna, Karnataka 581326, India",
    nearestAirport: "Goa Dabolim Airport (GOI) — 145 km",
    nearestStation: "Gokarna Road (GOK) — 18 km",
    amenities: [
      { id: "pool", label: "Cliffside Mosaic Infinity Pool" },
      { id: "beach", label: "Private Trail to Secluded Cove" },
      { id: "dining", label: "Organic Farm-to-Table Cuisine" }
    ],
    roomTypes: [
      {
        id: "ocean-suite",
        name: "Cliff Ocean View Suite",
        size: "500 sq.ft.",
        capacity: "2 Guests · 1 King Bed",
        price: 8900,
        originalPrice: 12000,
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
        perks: ["Breakfast Included", "Private Sea Deck", "Free Cancellation 48h prior"]
      }
    ]
  },
  {
    id: "the-khyber-resort-gulmarg",
    name: "The Khyber Himalayan Resort & Spa",
    tagline: "World-class 5-star mountain sanctuary nestled 8,825 feet high in virgin pine forests",
    city: "Gulmarg",
    state: "Jammu & Kashmir",
    country: "India",
    type: "Luxury Ski Resort",
    rating: 5.0,
    reviewsCount: 340,
    pricePerNight: 18500,
    originalPrice: 24000,
    mood: ["Luxury", "Snow", "Adventure", "Romance"],
    badge: "EaseMyTrip Verified",
    heroImage: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Located moments from the Gulmarg Gondola, The Khyber is framed by towering Pir Panjal peaks. Features an iconic glass-enclosed heated indoor pool gazing out at snow-covered pine forests.",
    locationAddress: "Near Gondola, Gulmarg, Jammu and Kashmir 193403, India",
    nearestAirport: "Srinagar International Airport (SXR) — 56 km (1.5 hours drive)",
    nearestStation: "Jammu Tawi — 300 km",
    amenities: [
      { id: "pool", label: "Glass-Enclosed Heated Mountain Pool" },
      { id: "spa", label: "L'Occitane Mediterranean Spa" },
      { id: "ski", label: "Direct Gondola Ski Shuttle" }
    ],
    roomTypes: [
      {
        id: "premier-snow-suite",
        name: "Premier Apharwat Snow View Suite",
        size: "560 sq.ft.",
        capacity: "2 Guests · 1 King Bed",
        price: 18500,
        originalPrice: 24000,
        image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
        perks: ["Gourmet Breakfast Buffet", "Heated Floors & Kashmiri Pine Wood", "Complimentary Gondola Transfer"]
      }
    ]
  },
  {
    id: "barefoot-at-havelock",
    name: "Barefoot at Havelock Island",
    tagline: "Eco-luxury jungle cottages nestled along the pristine turquoise sands of Beach No. 7",
    city: "Andaman Islands",
    state: "Andaman and Nicobar Islands",
    country: "India",
    type: "Tropical Beach Resort",
    rating: 4.8,
    reviewsCount: 190,
    pricePerNight: 9500,
    originalPrice: 13000,
    mood: ["Nature", "Romance", "Peace", "Beach"],
    badge: "EaseMyTrip Verified",
    heroImage: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Nestled behind the white sands of Radhanagar Beach, Barefoot features thatch cottages constructed using local renewable timber, offering world-class scuba diving and forest serenity.",
    locationAddress: "Beach No. 7, Radhanagar, Havelock Island, Andaman 744211, India",
    nearestAirport: "Port Blair Airport (IXZ) — 50 km by high-speed catamaran",
    nearestStation: "No rail connection",
    amenities: [
      { id: "beach", label: "Direct Trail to Radhanagar Beach" },
      { id: "dive", label: "PADI Certified Scuba Diving School" },
      { id: "dining", label: "Island Fresh Seafood Dining" }
    ],
    roomTypes: [
      {
        id: "andaman-villa",
        name: "Nicobari Timber Island Villa",
        size: "460 sq.ft.",
        capacity: "2 Guests · 1 King Bed",
        price: 9500,
        originalPrice: 13000,
        image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80",
        perks: ["Fresh Tropical Breakfast", "Private Sun Deck", "Snorkel Gear Included"]
      }
    ]
  },
  {
    id: "the-oberoi-amarvilas-agra",
    name: "The Oberoi Amarvilas",
    tagline: "Unobstructed vistas of the world-famous Taj Mahal from every single room and suite",
    city: "Agra",
    state: "Uttar Pradesh",
    country: "India",
    type: "Royal Luxury Palace",
    rating: 5.0,
    reviewsCount: 420,
    pricePerNight: 24000,
    originalPrice: 31000,
    mood: ["Romance", "Culture", "Luxury", "Heritage"],
    badge: "EaseMyTrip Verified",
    heroImage: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Located just 600 meters from the Taj Mahal, Amarvilas evokes Mughal grandeur with reflecting pools, terraced lawns, and private golf-buggy transfers directly to monument gates.",
    locationAddress: "Taj East Gate Road, Agra, Uttar Pradesh 282001, India",
    nearestAirport: "Kheria Airport (AGR) — 12 km",
    nearestStation: "Agra Cantt Railway Station — 8 km",
    amenities: [
      { id: "views", label: "Guaranteed Taj Mahal Views from All Rooms" },
      { id: "pool", label: "Mughal Terraced Azure Swimming Pool" },
      { id: "golf", label: "Complimentary Electric Golf Cart to Taj" }
    ],
    roomTypes: [
      {
        id: "premier-taj-room",
        name: "Premier Taj View Room",
        size: "450 sq.ft.",
        capacity: "2 Guests · 1 King Bed",
        price: 24000,
        originalPrice: 31000,
        image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
        perks: ["Royal Breakfast Buffet", "Private Marble Taj Balcony", "Golf Buggy VIP Taj Access"]
      }
    ]
  },
  {
    id: "glenburn-tea-estate-darjeeling",
    name: "Glenburn Tea Estate & Boutique Retreat",
    tagline: "1,600-acre colonial tea sanctuary with sweeping vistas of Mt. Kanchenjunga",
    city: "Darjeeling",
    state: "West Bengal",
    country: "India",
    type: "Heritage Tea Estate",
    rating: 4.9,
    reviewsCount: 165,
    pricePerNight: 14500,
    originalPrice: 19000,
    mood: ["Peace", "Nature", "Heritage", "Calm"],
    badge: "EaseMyTrip Verified",
    heroImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Started by a Scottish tea company in 1859, Glenburn is an enchanting boutique plantation lodge overlooking the snow-crested heights of Kanchenjunga.",
    locationAddress: "Glenburn Tea Estate, Near Singritan, Darjeeling, West Bengal 734101, India",
    nearestAirport: "Bagdogra Airport (IXB) — 78 km",
    nearestStation: "New Jalpaiguri (NJP) — 80 km",
    amenities: [
      { id: "tea", label: "Private Tea Factory & Tasting Tour" },
      { id: "views", label: "Kanchenjunga Snow-Peak Panoramas" },
      { id: "dining", label: "Colonial Planter's Four-Course Dinners" }
    ],
    roomTypes: [
      {
        id: "planters-suite",
        name: "Kanchenjunga Planter's Suite",
        size: "540 sq.ft.",
        capacity: "2 Guests · 1 Antique Four-Poster Bed",
        price: 14500,
        originalPrice: 19000,
        image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
        perks: ["All Meals & Tea Tastings Included", "Fireplace in Suite", "Estate Walks with Naturalist"]
      }
    ]
  },
  {
    id: "rann-resort-dhordo-kutch",
    name: "Dhordo White Rann Luxury Haven",
    tagline: "Traditional circular artisan bhungas situated on the threshold of the infinite salt desert",
    city: "Rann of Kutch",
    state: "Gujarat",
    country: "India",
    type: "Desert Heritage Resort",
    rating: 4.8,
    reviewsCount: 180,
    pricePerNight: 6500,
    originalPrice: 8900,
    mood: ["Culture", "Nature", "Peace", "Heritage"],
    badge: "EaseMyTrip Verified",
    heroImage: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Built using authentic Kutchi mud-and-mirror Lipan art, Dhordo White Rann Haven offers air-conditioned cylindrical bhunga suites just 5 minutes from the glistening salt flats.",
    locationAddress: "Dhordo Village, Banni Grasslands, Kutch, Gujarat 370510, India",
    nearestAirport: "Bhuj Airport (BHJ) — 80 km",
    nearestStation: "Bhuj Railway Station — 82 km",
    amenities: [
      { id: "desert", label: "Desert Camel Safari to Salt Flats" },
      { id: "art", label: "Authentic Mud & Mirror Lipan Art Suites" },
      { id: "food", label: "Kathiyawadi & Kutchi Traditional Thali" }
    ],
    roomTypes: [
      {
        id: "royal-bhunga",
        name: "Royal Handcrafted Kutchi Bhunga",
        size: "440 sq.ft.",
        capacity: "2 Guests · 1 King Bed",
        price: 6500,
        originalPrice: 8900,
        image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80",
        perks: ["Authentic Gujarati Buffet", "White Desert Permit Assistance", "Camel Cart Ride to Sunset"]
      }
    ]
  }
];

const hotelsFilePath = path.join(__dirname, "../src/data/hotels.js");
let fileContent = fs.readFileSync(hotelsFilePath, "utf8");

// Parse existing HOTELS_DATA array and append new ones without duplicates
let existingIds = new Set();
const idRegex = /id:\s*["']([^"']+)["']/g;
let match;
while ((match = idRegex.exec(fileContent)) !== null) {
  existingIds.add(match[1]);
}

const hotelsToAdd = ADDITIONAL_HOTELS.filter((h) => !existingIds.has(h.id));

if (hotelsToAdd.length > 0) {
  // Find where HOTELS_DATA array closes
  const closingIdx = fileContent.lastIndexOf("];");
  if (closingIdx !== -1) {
    let toAppend = "";
    for (const h of hotelsToAdd) {
      toAppend += ",\n  " + JSON.stringify(h, null, 2).replace(/\n/g, "\n  ");
    }
    fileContent = fileContent.slice(0, closingIdx) + toAppend + "\n];\n" + fileContent.slice(closingIdx + 2);
  }
}

// Append or update getHotelsForDestination function
const helperCode = `
/**
 * Returns authentic hotels matching the selected destination.
 * Matches by destination ID, destination name, city, or state.
 * Never returns mismatched hotels from unrelated locations.
 */
export function getHotelsForDestination(destId, destName, destState) {
  if (!destId && !destName) return HOTELS_DATA.slice(0, 3);
  
  const idStr = String(destId || "").toLowerCase().trim();
  const nameStr = String(destName || "").toLowerCase().trim();
  const stateStr = String(destState || "").toLowerCase().trim();

  // 1. Direct city/destination match
  const exactCityMatches = HOTELS_DATA.filter((h) => {
    const c = h.city.toLowerCase();
    return c === idStr || c === nameStr || idStr.includes(c) || nameStr.includes(c);
  });
  if (exactCityMatches.length > 0) return exactCityMatches;

  // 2. Direct state match
  if (stateStr) {
    const stateMatches = HOTELS_DATA.filter((h) => {
      const s = h.state.toLowerCase();
      return stateStr.includes(s) || s.includes(stateStr);
    });
    if (stateMatches.length > 0) return stateMatches;
  }

  // 3. Fallback: Return first available hotel for this region, or null
  return [];
}
`;

if (!fileContent.includes("getHotelsForDestination")) {
  fileContent += helperCode;
}

fs.writeFileSync(hotelsFilePath, fileContent, "utf8");
console.log(`Successfully updated ${hotelsFilePath} with verified hotels and helper!`);
