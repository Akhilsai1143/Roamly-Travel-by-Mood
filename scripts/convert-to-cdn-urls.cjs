// scripts/convert-to-cdn-urls.cjs
const fs = require("fs");
const path = require("path");

function toCdnUrl(url) {
  if (typeof url !== "string") return url;
  if (url.includes("upload.wikimedia.org/wikipedia/commons/")) {
    const parts = url.split("upload.wikimedia.org/wikipedia/commons/");
    if (parts.length === 2) {
      const rel = parts[1];
      const filename = path.basename(rel);
      return `https://thumb.wikimedia.org/wikipedia/commons/thumb/${rel}/1280px-${filename}`;
    }
  }
  return url;
}

const masterPath = path.join(__dirname, "final-galleries-master.json");
const masterData = JSON.parse(fs.readFileSync(masterPath, "utf-8"));

let converted = 0;
for (const key of Object.keys(masterData.galleries)) {
  masterData.galleries[key] = masterData.galleries[key].map((u) => {
    const cdn = toCdnUrl(u);
    if (cdn !== u) converted++;
    return cdn;
  });
}

console.log(`Converted ${converted} raw Wikimedia URLs to Fastly CDN cached thumbnail URLs.`);
fs.writeFileSync(masterPath, JSON.stringify(masterData, null, 2), "utf-8");

// Re-generate src/data/destinationGalleries.js
const { generateGalleriesCode } = require("./export-galleries-code.cjs");
const code = generateGalleriesCode(masterData.galleries, masterData.landmarks);
const outPath = path.join(__dirname, "..", "src", "data", "destinationGalleries.js");
fs.writeFileSync(outPath, code, "utf-8");
console.log(`Updated ${outPath} successfully.`);
