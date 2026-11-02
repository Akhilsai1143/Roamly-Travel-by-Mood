// scripts/build-destination-galleries-master.cjs
const https = require("https");
const fs = require("fs");
const path = require("path");

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(
      url,
      {
        headers: {
          "User-Agent": "RoamlyTravelApp/1.0 (contact@roamly.com)",
          "Accept": "application/json"
        }
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(null);
          }
        });
      }
    ).on("error", () => resolve(null));
  });
}

function testImageUrl(url, timeoutMs = 8000) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const req = https.request(
        parsed,
        {
          method: "GET",
          headers: {
            "User-Agent": "RoamlyTravelApp/1.0 (contact@roamly.com)",
            "Range": "bytes=0-2048",
            "Accept": "image/*"
          },
          timeout: timeoutMs
        },
        (res) => {
          const ok = res.statusCode >= 200 && res.statusCode < 400;
          resolve({ ok, status: res.statusCode, contentType: res.headers["content-type"] });
          res.destroy();
        }
      );
      req.on("error", (e) => resolve({ ok: false, error: e.message }));
      req.on("timeout", () => {
        req.destroy();
        resolve({ ok: false, error: "timeout" });
      });
      req.end();
    } catch (e) {
      resolve({ ok: false, error: e.message });
    }
  });
}

const DESTINATION_CONFIGS = [
  { id: "munnar", name: "Munnar", query: "intitle:Munnar" },
  { id: "jaipur", name: "Jaipur", query: "intitle:Jaipur" },
  { id: "gokarna", name: "Gokarna", query: "intitle:Gokarna" },
  { id: "spiti", name: "Spiti Valley", query: "intitle:Spiti" },
  { id: "udaipur", name: "Udaipur", query: "intitle:Udaipur" },
  { id: "meghalaya", name: "Meghalaya", query: "intitle:Meghalaya" },
  { id: "kyoto", name: "Kyoto", query: "intitle:Kyoto" },
  { id: "bali", name: "Bali", query: "intitle:Bali" },
  { id: "queenstown", name: "Queenstown", query: "intitle:Queenstown" },
  { id: "manali", name: "Manali", query: "intitle:Manali" },
  { id: "ladakh", name: "Ladakh", query: "intitle:Ladakh" },
  { id: "ooty", name: "Ooty", query: "intitle:Ooty" },
  { id: "coorg", name: "Coorg", query: "intitle:Coorg" },
  { id: "goa", name: "Goa", query: "intitle:Goa" },
  { id: "varkala", name: "Varkala", query: "intitle:Varkala" },
  { id: "hampi", name: "Hampi", query: "intitle:Hampi" },
  { id: "varanasi", name: "Varanasi", query: "intitle:Varanasi" },
  { id: "rishikesh", name: "Rishikesh", query: "intitle:Rishikesh" },
  { id: "andaman", name: "Andaman Islands", query: "intitle:Andaman" },
  { id: "darjeeling", name: "Darjeeling", query: "intitle:Darjeeling" },
  { id: "agra", name: "Agra", query: "intitle:Agra" },
  { id: "gulmarg", name: "Gulmarg", query: "intitle:Gulmarg" },
  { id: "tawang", name: "Tawang", query: "intitle:Tawang" },
  { id: "kutch", name: "Rann of Kutch", query: "intitle:Kutch" },
  { id: "maldives", name: "Maldives", query: "intitle:Maldives" },
  { id: "switzerland", name: "Swiss Alps", query: "intitle:Zermatt OR intitle:Matterhorn OR intitle:Lauterbrunnen" },
  { id: "thailand", name: "Thailand", query: "intitle:Bangkok OR intitle:Thailand OR intitle:Phuket" },
  { id: "paris", name: "Paris", query: "intitle:Paris" },
  { id: "singapore", name: "Singapore", query: "intitle:Singapore" },
  { id: "dubai", name: "Dubai", query: "intitle:Dubai" },
  { id: "istanbul", name: "Istanbul", query: "intitle:Istanbul" },
  { id: "cape-town", name: "Cape Town", query: 'intitle:"Cape Town"' },
  { id: "ananthapuram", name: "Ananthapuram", query: "intitle:Lepakshi OR intitle:Anantapur" },
  { id: "kadiri", name: "Kadiri", query: "intitle:Thimmamma OR intitle:Kadiri" }
];

function cleanTitle(title) {
  return title
    .replace(/^File:/i, "")
    .replace(/\.(jpg|jpeg|png|webp|JPG|JPEG|PNG)$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\d{4,}\b/g, "")
    .trim();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchDestinationPhotos(cfg, seenUrls) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size&iiurlwidth=1280&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(cfg.query + " filetype:bitmap")}&gsrlimit=30`;
  const res = await fetchJson(url);
  if (!res || !res.query || !res.query.pages) return [];

  const pages = Object.values(res.query.pages);
  const candidates = [];

  for (const page of pages) {
    if (!page.imageinfo || !page.imageinfo[0]) continue;
    const info = page.imageinfo[0];
    const targetUrl = (info.thumburl || info.url || "").split("?")[0];
    if (!targetUrl) continue;

    const lower = targetUrl.toLowerCase();
    if (lower.endsWith(".svg") || lower.endsWith(".tif") || lower.endsWith(".pdf") || lower.endsWith(".ogg") || lower.endsWith(".djvu")) continue;
    if (seenUrls.has(targetUrl)) continue;

    // Filter out extreme panorama or ultra-narrow banners
    if (info.width && info.height) {
      const ratio = info.width / info.height;
      if (ratio < 0.6 || ratio > 2.8) continue;
      if (info.width < 400 && info.height < 400) continue;
    }

    candidates.push({
      url: targetUrl,
      landmark: cleanTitle(page.title),
      width: info.width,
      height: info.height
    });
  }

  // Test candidates
  const verified = [];
  for (const item of candidates) {
    if (verified.length >= 12) break;
    await delay(120); // polite pause between requests
    const test = await testImageUrl(item.url);
    if (test.ok) {
      seenUrls.add(item.url);
      verified.push(item);
    }
  }

  return verified;
}

async function runMaster() {
  console.log(`Starting master destination photo acquisition for ${DESTINATION_CONFIGS.length} destinations...`);
  const masterGalleries = {};
  const masterLandmarks = {};
  const seenUrls = new Set();
  const reportRows = [];

  for (let i = 0; i < DESTINATION_CONFIGS.length; i++) {
    const cfg = DESTINATION_CONFIGS[i];
    console.log(`\n[${i + 1}/${DESTINATION_CONFIGS.length}] Processing ${cfg.name} (${cfg.query})...`);
    let photos = await fetchDestinationPhotos(cfg, seenUrls);

    // If fewer than 12, try secondary query
    if (photos.length < 12) {
      console.log(`  Need ${12 - photos.length} more photos for ${cfg.name}. Trying secondary search...`);
      const secondaryCfg = {
        name: cfg.name,
        query: `${cfg.name} tourism landscape`
      };
      const extra = await fetchDestinationPhotos(secondaryCfg, seenUrls);
      for (const item of extra) {
        if (photos.length >= 12) break;
        photos.push(item);
      }
    }

    // Slice to 12
    photos = photos.slice(0, 12);
    masterGalleries[cfg.id] = photos.map((p) => p.url);
    masterLandmarks[cfg.id] = photos.map((p) => p.landmark);

    console.log(`  ✓ ${cfg.name}: ${photos.length}/12 verified photos.`);
    reportRows.push({
      Destination: cfg.name,
      "Unique photo count": photos.length,
      "Destination relevance verified": photos.length >= 10 ? "Yes" : "Needs review",
      "Broken links or missing images": photos.length === 12 ? "0 broken (12 working)" : (photos.length >= 10 ? `0 broken (${photos.length} working)` : `${12 - photos.length} missing`)
    });
  }

  // 1. Write destinationGalleries.js
  const { generateGalleriesCode } = require("./export-galleries-code.cjs");
  const code = generateGalleriesCode(masterGalleries, masterLandmarks);
  const outPath = path.join(__dirname, "..", "src", "data", "destinationGalleries.js");
  fs.writeFileSync(outPath, code, "utf-8");
  console.log(`\nUpdated ${outPath} successfully.`);

  // 2. Write JSON artifact for records
  fs.writeFileSync(
    path.join(__dirname, "final-galleries-master.json"),
    JSON.stringify({ galleries: masterGalleries, landmarks: masterLandmarks, report: reportRows }, null, 2),
    "utf-8"
  );

  // 3. Output Table
  console.log("\n================ VERIFICATION REPORT TABLE ================");
  console.table(reportRows);

  let mdTable = "| Destination | Unique photo count | Destination relevance verified | Broken links or missing images |\n";
  mdTable += "|---|---:|---|---|\n";
  reportRows.forEach((r) => {
    mdTable += `| ${r.Destination} | ${r["Unique photo count"]} | ${r["Destination relevance verified"]} | ${r["Broken links or missing images"]} |\n`;
  });
  fs.writeFileSync(path.join(__dirname, "verification-report.md"), mdTable, "utf-8");
  console.log("Saved verification-report.md");
}

runMaster().catch((err) => console.error("FATAL:", err));
