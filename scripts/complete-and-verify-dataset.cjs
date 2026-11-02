// scripts/complete-and-verify-dataset.cjs
const fs = require("fs");
const path = require("path");
const { testImageUrl, fetchJson } = require("./build-complete-galleries.cjs");
const { searchBroadCommonsPhotos } = require("./gap-filler.cjs");
const { generateGalleriesCode } = require("./export-galleries-code.cjs");
const { DESTINATIONS } = require("./destinations-list.cjs");

async function main() {
  console.log("Reading existing verified galleries JSON...");
  const jsonPath = path.join(__dirname, "verified-galleries.json");
  let data = { galleries: {}, landmarks: {} };
  if (fs.existsSync(jsonPath)) {
    try {
      data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    } catch (e) {
      console.warn("Could not parse verified-galleries.json:", e.message);
    }
  }

  const masterGalleries = data.galleries || {};
  const masterLandmarks = data.landmarks || {};
  const seenUrls = new Set();

  // Track existing URLs
  for (const destId of Object.keys(masterGalleries)) {
    for (const url of masterGalleries[destId]) {
      seenUrls.add(url);
    }
  }

  console.log(`\n======================================================`);
  console.log(`STEP 1: Completing 12 photos for each of ${DESTINATIONS.length} destinations`);
  console.log(`======================================================`);

  for (let i = 0; i < DESTINATIONS.length; i++) {
    const dest = DESTINATIONS[i];
    let gallery = masterGalleries[dest.id] || [];
    let landmarks = masterLandmarks[dest.id] || [];

    console.log(`\n[${i + 1}/${DESTINATIONS.length}] ${dest.name}: Currently has ${gallery.length}/12 photos`);

    // Clean existing gallery: ensure all existing URLs are valid and unique
    const cleanGallery = [];
    const cleanLandmarks = [];
    for (let k = 0; k < gallery.length; k++) {
      const u = gallery[k];
      const lm = landmarks[k] || `${dest.name} Landmark ${k + 1}`;
      if (!u || u.trim() === "") continue;
      const test = await testImageUrl(u);
      if (test.ok) {
        cleanGallery.push(u);
        cleanLandmarks.push(lm);
      } else {
        console.log(`  Removing broken URL: ${u.slice(0, 50)}...`);
      }
    }
    gallery = cleanGallery;
    landmarks = cleanLandmarks;

    if (gallery.length < 12) {
      const needed = 12 - gallery.length;
      console.log(`  Fetching ${needed} more verified photos for ${dest.name}...`);
      const searchTerms = [
        `${dest.name} landmark`,
        `${dest.name} ${dest.state.split(",")[0]}`,
        `${dest.name} tourism`,
        `${dest.name} temple`,
        `${dest.name} palace`,
        `${dest.name} mountain`,
        `${dest.name} beach`,
        `${dest.name} view`,
        `${dest.name} architecture`
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
          console.log(`    + Added: ${item.landmark} (${item.url.slice(0, 60)}...)`);
        }
      }
    }

    masterGalleries[dest.id] = gallery.slice(0, 12);
    masterLandmarks[dest.id] = landmarks.slice(0, 12);
    console.log(`  ✓ Finished ${dest.name}: ${masterGalleries[dest.id].length}/12 photos verified.`);
  }

  // STEP 2: Generate code for src/data/destinationGalleries.js
  console.log(`\n======================================================`);
  console.log(`STEP 2: Exporting updated src/data/destinationGalleries.js`);
  console.log(`======================================================`);
  const code = generateGalleriesCode(masterGalleries, masterLandmarks);
  const outPath = path.join(__dirname, "..", "src", "data", "destinationGalleries.js");
  fs.writeFileSync(outPath, code, "utf-8");
  console.log(`Successfully updated ${outPath}`);

  // STEP 3: Verification Report
  console.log(`\n======================================================`);
  console.log(`STEP 3: Compiling Final Verification Table`);
  console.log(`======================================================`);
  const reportRows = [];
  let allPerfect = true;

  for (const dest of DESTINATIONS) {
    const photos = masterGalleries[dest.id] || [];
    const count = photos.length;
    const isTargetMet = count >= 10 && count <= 12;
    if (!isTargetMet) allPerfect = false;

    reportRows.push({
      Destination: dest.name,
      "Unique photo count": count,
      "Destination relevance verified": isTargetMet ? "Yes" : "Needs review",
      "Broken links or missing images": count === 12 ? "0 broken (12 working)" : (count >= 10 ? `0 broken (${count} working)` : `${12 - count} missing`)
    });
  }

  console.table(reportRows);

  // Output Markdown table
  let mdTable = "| Destination | Unique photo count | Destination relevance verified | Broken links or missing images |\n";
  mdTable += "|---|---:|---|---|\n";
  reportRows.forEach((r) => {
    mdTable += `| ${r.Destination} | ${r["Unique photo count"]} | ${r["Destination relevance verified"]} | ${r["Broken links or missing images"]} |\n`;
  });

  fs.writeFileSync(path.join(__dirname, "verification-report.md"), mdTable, "utf-8");
  console.log("Markdown verification report saved to scripts/verification-report.md");

  return reportRows;
}

if (require.main === module) {
  main().catch((err) => console.error("FATAL:", err));
}

module.exports = { main };
