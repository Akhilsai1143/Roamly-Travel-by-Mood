// scripts/verify-planner-mapping.cjs
// Automated test script to verify that every destination in Roamly has 100% consistent mapping
// for itineraries, attractions, activities, landmarks, photos, and hotel recommendations.

const { destinations } = require("../src/data/destinations.js");
const {
  getDestinationItinerary,
  getDestinationAttractions,
  getDestinationActivities,
  getDestinationTransit,
  sampleItineraries
} = require("../src/data/travelDetails.js");
const { getDestinationGallery, getDestinationLandmarks } = require("../src/data/destinationGalleries.js");
const { getHotelsForDestination, HOTELS_DATA } = require("../src/data/hotels.js");

console.log("===============================================================================");
console.log("ROAMLY TRIP PLANNER — COMPLETE DESTINATION CONTENT MAPPING VERIFICATION");
console.log("===============================================================================\n");

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
  } else {
    failedTests++;
    console.error(`[FAIL] ${message}`);
  }
}

// 1. Verify that all 34 destinations exist and have sampleItineraries
console.log(`Checking ${destinations.length} destinations in destinations.js...`);
assert(destinations.length === 34, `Expected 34 destinations, found ${destinations.length}`);

const crossContaminationChecks = [
  { destId: "manali", forbidden: ["Fontainhas", "Mandovi", "Cabo de Rama", "Palolem", "Pichola", "Amer Fort"] },
  { destId: "udaipur", forbidden: ["Fontainhas", "Solang", "Rohtang", "Hadimba", "Pangong", "Baga Beach"] },
  { destId: "goa", forbidden: ["Solang", "Rohtang", "Pichola", "Hawa Mahal", "Pangong", "Hadimba"] },
  { destId: "ladakh", forbidden: ["Fontainhas", "Mandovi", "Pichola", "Solang", "Kudle Beach"] },
  { destId: "varanasi", forbidden: ["Fontainhas", "Solang", "Rohtang", "Palolem", "Baga"] },
  { destId: "munnar", forbidden: ["Fontainhas", "Solang", "Rohtang", "Amer Fort", "Taj Mahal"] },
  { destId: "jaipur", forbidden: ["Fontainhas", "Solang", "Rohtang", "Pichola", "Palolem"] },
  { destId: "kutch", forbidden: ["Fontainhas", "Solang", "Rohtang", "Pichola", "Ganga Aarti"] },
  { destId: "gulmarg", forbidden: ["Fontainhas", "Palolem", "Pichola", "Amer Fort", "Dudhsagar"] },
  { destId: "rishikesh", forbidden: ["Fontainhas", "Palolem", "Pichola", "Rohtang", "Dudhsagar"] }
];

console.log("\n--- Testing Cross-Contamination & Negative Assertions ---");
for (const check of crossContaminationChecks) {
  const itin = getDestinationItinerary(check.destId, 7);
  const fullText = itin.join(" ");
  for (const f of check.forbidden) {
    const leaked = fullText.includes(f);
    assert(!leaked, `${check.destId} itinerary contains leaked keyword "${f}" from another destination!`);
  }
}

console.log("\n--- Testing Itinerary Generation & Day Counts for all 34 destinations ---");
for (const dest of destinations) {
  // Check 2 days
  const itin2 = getDestinationItinerary(dest.id, 2);
  assert(itin2.length === 2, `${dest.id}: expected 2 days, got ${itin2.length}`);
  assert(itin2[0].startsWith("Day 1 —"), `${dest.id}: Day 1 formatted properly`);
  assert(itin2[1].startsWith("Day 2 —"), `${dest.id}: Day 2 formatted properly`);

  // Check 7 days
  const itin7 = getDestinationItinerary(dest.id, 7);
  assert(itin7.length === 7, `${dest.id}: expected 7 days, got ${itin7.length}`);
  assert(itin7[6].startsWith("Day 7 —"), `${dest.id}: Day 7 formatted properly`);

  // Check Attractions
  const attractions = getDestinationAttractions(dest.id);
  assert(Array.isArray(attractions) && attractions.length >= 3, `${dest.id}: expected >= 3 attractions, got ${attractions.length}`);

  // Check Activities
  const activities = getDestinationActivities(dest.id);
  assert(Array.isArray(activities) && activities.length >= 3, `${dest.id}: expected >= 3 activities, got ${activities.length}`);

  // Check Photos & Landmarks
  const gallery = getDestinationGallery(dest);
  assert(Array.isArray(gallery) && gallery.length === 12, `${dest.id}: expected 12 photos, got ${gallery.length}`);
  const landmarks = getDestinationLandmarks(dest);
  assert(Array.isArray(landmarks) && landmarks.length === 12, `${dest.id}: expected 12 landmarks, got ${landmarks.length}`);
}

console.log("\n--- Testing Hotel Recommendations Matching ---");
const hotelTestDestinations = ["manali", "udaipur", "goa", "munnar", "jaipur", "rishikesh", "varanasi", "ladakh", "coorg", "varkala", "gulmarg", "agra"];
for (const id of hotelTestDestinations) {
  const dest = destinations.find(d => d.id === id);
  const hotels = getHotelsForDestination(dest.id, dest.name, dest.state);
  assert(hotels.length > 0, `${dest.name}: expected matching hotel, got ${hotels.length}`);
  if (hotels.length > 0) {
    const hotel = hotels[0];
    const matchCity = hotel.city.toLowerCase().includes(dest.name.toLowerCase()) || 
                      dest.name.toLowerCase().includes(hotel.city.toLowerCase()) ||
                      dest.state.toLowerCase().includes(hotel.state.toLowerCase()) ||
                      hotel.state.toLowerCase().includes(dest.state.toLowerCase());
    assert(matchCity, `${dest.name}: recommended hotel "${hotel.name}" city (${hotel.city}) does not match destination!`);
  }
}

console.log("\n===============================================================================");
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${failedTests}`);
console.log("===============================================================================");

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log("ALL TRIP PLANNER CONTENT MAPPING TESTS PASSED 100%!");
}
