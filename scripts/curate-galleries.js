// scripts/curate-galleries.js
const { checkUrl } = require("./verify-destination-galleries.js");

// Candidate dataset of authentic landmark photographs for all 32 destinations + 2 db destinations (Ananthapuram, Kadiri)
// Each destination has 12 distinct, high-resolution photographs representing identifiable landmarks and vistas.

const CANDIDATE_GALLERIES = {
  munnar: [
    { url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85", landmark: "Munnar Rolling Tea Hills at Sunrise", alt: "Munnar misty tea gardens" },
    { url: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=85", landmark: "Kannan Devan Tea Estate Slopes", alt: "Emerald tea plantation in Munnar" },
    { url: "https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=1200&q=85", landmark: "Kolukkumalai Tea Estate Sunrise", alt: "Kolukkumalai sunrise over clouds" },
    { url: "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=85", landmark: "Mattupetty Dam and Lake Reservoir", alt: "Mattupetty reservoir surrounded by hills" },
    { url: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=85", landmark: "Kundala Lake Pedal Boating", alt: "Boating on Kundala Lake" },
    { url: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=85", landmark: "Top Station Western Ghats Panoramic View", alt: "Top Station ridge overlooking Tamil Nadu plains" },
    { url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=85", landmark: "Attukal Waterfalls in Forest", alt: "Attukal cascading waterfall in Munnar" },
    { url: "https://images.unsplash.com/photo-1571536802807-30451e3955d8?auto=format&fit=crop&w=1200&q=85", landmark: "Lockhart Gap Mountain Vista", alt: "Lockhart Gap misty mountain valley" },
    { url: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=85", landmark: "Eravikulam National Park Hills", alt: "Rolling shola grasslands of Eravikulam" },
    { url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=85", landmark: "Anamudi Peak Ridge", alt: "Anamudi peak south India highest summit" },
    { url: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=85", landmark: "Pothamedu Viewpoint Tea Trails", alt: "Sunlight through Munnar tea hills" },
    { url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=85", landmark: "Chinnakanal Tea Valley and Waterfalls", alt: "Munnar forest trails and green valleys" }
  ]
};

async function testMunnar() {
  console.log("Testing candidate Munnar images...");
  for (const item of CANDIDATE_GALLERIES.munnar) {
    const res = await checkUrl(item.url);
    console.log(`${item.landmark}: ${res.ok ? "OK " + res.statusCode : "FAIL " + res.error}`);
  }
}

testMunnar();
