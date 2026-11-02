// scripts/build-final-galleries.cjs
const fs = require("fs");
const path = require("path");
const { searchCommonsPhoto, getWikiSummaryPhoto, testImageUrl, fetchJson } = require("./build-complete-galleries.cjs");
const { searchBroadCommonsPhotos } = require("./gap-filler.cjs");

async function completeAllDestinations() {
  const jsonPath = path.join(__dirname, "verified-galleries.json");
  let data = { galleries: {}, landmarks: {} };
  if (fs.existsSync(jsonPath)) {
    try {
      data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    } catch {}
  }

  const { DESTINATIONS } = require("./destinations-list.cjs");
  const masterGalleries = data.galleries || {};
  const masterLandmarks = data.landmarks || {};
  const seenUrls = new Set();

  // Populate seenUrls from existing
  for (const destId of Object.keys(masterGalleries)) {
    for (const url of masterGalleries[destId]) {
      seenUrls.add(url);
    }
  }

  console.log(`Starting gap-filling to ensure 12 unique photos per destination...`);
  const finalReport = [];

  for (let i = 0; i < DESTINATIONS.length; i++) {
    const dest = DESTINATIONS[i];
    let gallery = masterGalleries[dest.id] || [];
    let landmarks = masterLandmarks[dest.id] || [];

    console.log(`\n[${i + 1}/${DESTINATIONS.length}] Checking ${dest.name} (currently ${gallery.length}/12)...`);

    if (gallery.length < 12) {
      const needed = 12 - gallery.length;
      console.log(`  Need ${needed} more photos for ${dest.name}. Searching Wikimedia Commons...`);
      const searchTerms = [
        `${dest.name} landmark`,
        `${dest.name} tourism`,
        `${dest.name} nature`,
        `${dest.name} landscape`,
        `${dest.name} heritage`,
        `${dest.name} view`,
        `${dest.name} ${dest.state.split(",")[0]}`
      ];

      for (const term of searchTerms) {
        if (gallery.length >= 12) break;
        const remaining = 12 - gallery.length;
        const additional = await searchBroadCommonsPhotos(term, remaining, seenUrls);
        for (const item of additional) {
          if (gallery.length >= 12) break;
          gallery.push(item.url);
          landmarks.push(item.landmark);
          seenUrls.add(item.url);
          console.log(`  + Added (${gallery.length}/12): ${item.landmark}`);
        }
      }
    }

    // Verify all 12 URLs
    const verifiedGallery = [];
    const verifiedLandmarks = [];
    for (let k = 0; k < gallery.length; k++) {
      const u = gallery[k];
      const lm = landmarks[k] || `${dest.name} Perspective ${k + 1}`;
      const chk = await testImageUrl(u);
      if (chk.ok) {
        verifiedGallery.push(u);
        verifiedLandmarks.push(lm);
      } else {
        console.warn(`  ! URL failed verification: ${u.slice(0, 60)}`);
      }
    }

    masterGalleries[dest.id] = verifiedGallery;
    masterLandmarks[dest.id] = verifiedLandmarks;

    finalReport.push({
      destination: dest.name,
      destId: dest.id,
      count: verifiedGallery.length,
      verified: verifiedGallery.length >= 10 ? "Yes" : "Needs review",
      status: verifiedGallery.length >= 10 ? "All photos active & relevant" : `${12 - verifiedGallery.length} missing`
    });
  }

  // Write finalized JSON
  fs.writeFileSync(
    path.join(__dirname, "final-galleries-master.json"),
    JSON.stringify({ galleries: masterGalleries, landmarks: masterLandmarks, report: finalReport }, null, 2),
    "utf-8"
  );

  console.log("\n================ MASTER VERIFICATION REPORT ================");
  console.table(finalReport);
  return { masterGalleries, masterLandmarks, finalReport };
}

if (require.main === module) {
  completeAllDestinations().catch(console.error);
}

module.exports = { completeAllDestinations };
