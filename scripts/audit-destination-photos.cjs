// scripts/audit-destination-photos.cjs
const g = require("../src/data/destinationGalleries.js");

const urlToDests = {};
for (const [dest, urls] of Object.entries(g.DESTINATION_GALLERIES)) {
  urls.forEach((u, idx) => {
    const match = u.match(/photo-([0-9a-f-]+)/);
    const id = match ? match[1] : u;
    if (!urlToDests[id]) urlToDests[id] = [];
    urlToDests[id].push({ dest, idx: idx + 1 });
  });
}

console.log("=== DESTINATION IMAGE AUDIT ===");
const summary = [];
for (const [dest, urls] of Object.entries(g.DESTINATION_GALLERIES)) {
  let uniqueCount = 0;
  let reusedCount = 0;
  const reusedDetails = [];

  urls.forEach((u, idx) => {
    const match = u.match(/photo-([0-9a-f-]+)/);
    const id = match ? match[1] : u;
    const usages = urlToDests[id];
    if (usages.length === 1) {
      uniqueCount++;
    } else {
      reusedCount++;
      const otherDests = usages.filter(x => x.dest !== dest).map(x => x.dest);
      reusedDetails.push(`Photo #${idx+1} (${id.slice(0, 10)}) shared with: ${[...new Set(otherDests)].join(", ")}`);
    }
  });

  summary.push({
    dest,
    total: urls.length,
    unique: uniqueCount,
    reused: reusedCount,
    status: reusedCount === 0 ? "100% Unique" : `Has ${reusedCount} reused photos`
  });
}

console.table(summary);
