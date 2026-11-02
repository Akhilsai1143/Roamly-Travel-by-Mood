const fs = require("fs");
const path = require("path");

const content = fs.readFileSync(path.join(__dirname, "../src/data/destinationGalleries.js"), "utf8");

// Extract the DESTINATION_GALLERIES and DESTINATION_LANDMARKS objects
const galleriesMatch = content.match(/export const DESTINATION_GALLERIES = (\{[\s\S]*?\n\};)/);
const landmarksMatch = content.match(/export const DESTINATION_LANDMARKS = (\{[\s\S]*?\n\};)/);

if (!galleriesMatch) {
  console.error("Could not find DESTINATION_GALLERIES in src/data/destinationGalleries.js");
  process.exit(1);
}

// Evaluate galleries object safely
const galleriesStr = galleriesMatch[1].replace(/export const DESTINATION_GALLERIES = /, "").replace(/;$/, "");
const DESTINATION_GALLERIES = eval("(" + galleriesStr + ")");

const landmarksStr = landmarksMatch ? landmarksMatch[1].replace(/export const DESTINATION_LANDMARKS = /, "").replace(/;$/, "") : "{}";
const DESTINATION_LANDMARKS = eval("(" + landmarksStr + ")");

console.log("Found", Object.keys(DESTINATION_GALLERIES).length, "destinations in DESTINATION_GALLERIES.");

const badKeywords = [
  "monkey", "semnopithecus", "langur", "macaca", "macaque", "primate",
  "crab", "dump", "garbage", "trash",
  "map", "locator", "district", "blank", "outline",
  "elephant", "animal", "insect", "spider", "butterfly", "leaf",
  "blast", "homeless", "accident", "crash",
  "minesite", "tasmania", "geograph", "road", "highway", "rail", "metro",
  "encrypted-tbn0.gstatic.com"
];

const auditResults = {};

for (const [destId, urls] of Object.entries(DESTINATION_GALLERIES)) {
  const flags = [];
  urls.forEach((url, idx) => {
    const lower = url.toLowerCase();
    const lmk = (DESTINATION_LANDMARKS[destId] && DESTINATION_LANDMARKS[destId][idx]) || "";
    const lowerLmk = lmk.toLowerCase();

    for (const kw of badKeywords) {
      if (lower.includes(kw) || lowerLmk.includes(kw)) {
        flags.push({ idx: idx + 1, kw, url, lmk });
        break;
      }
    }
  });
  if (flags.length > 0) {
    auditResults[destId] = flags;
  }
}

console.log("Destinations with suspicious images:", Object.keys(auditResults).length);
for (const [destId, flags] of Object.entries(auditResults)) {
  console.log(`\nDestination: ${destId} (${flags.length} bad items)`);
  flags.forEach(f => console.log(`  [Photo ${f.idx}] (${f.kw}) Caption: "${f.lmk}"\n    URL: ${f.url}`));
}
