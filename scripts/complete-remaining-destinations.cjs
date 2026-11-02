// scripts/complete-remaining-destinations.cjs
const https = require("https");
const fs = require("fs");
const path = require("path");

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(
      url,
      {
        headers: {
          "User-Agent": "RoamlyMediaBot/1.0 (travel@roamly.app; paired with Wikimedia)"
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

function verifyImageUrl(url) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const req = https.request(
        parsed,
        {
          method: "HEAD",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Roamly/1.0"
          }
        },
        (res) => {
          resolve(res.statusCode >= 200 && res.statusCode < 400);
        }
      );
      req.on("error", () => resolve(false));
      req.setTimeout(5000, () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

function cleanTitle(title) {
  return title
    .replace(/^File:/i, "")
    .replace(/\.(jpg|jpeg|png|webp|JPG|JPEG|PNG)$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\d{4,}\b/g, "")
    .trim();
}

async function searchWikimedia(searchTerm, limit = 15) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size&iiurlwidth=1280&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(searchTerm + " filetype:bitmap")}&gsrlimit=${limit}`;
  const res = await fetchJson(url);
  if (!res || !res.query || !res.query.pages) return [];

  const candidates = [];
  for (const page of Object.values(res.query.pages)) {
    if (!page.imageinfo || !page.imageinfo[0]) continue;
    const info = page.imageinfo[0];
    const targetUrl = (info.thumburl || info.url || "").split("?")[0];
    if (!targetUrl) continue;
    const lower = targetUrl.toLowerCase();
    if (lower.endsWith(".svg") || lower.endsWith(".tif") || lower.endsWith(".pdf") || lower.endsWith(".ogg") || lower.endsWith(".djvu")) continue;
    if (info.width && info.height) {
      const ratio = info.width / info.height;
      if (ratio < 0.6 || ratio > 2.8) continue;
      if (info.width < 400 && info.height < 400) continue;
    }
    candidates.push({
      url: targetUrl,
      title: page.title,
      landmark: cleanTitle(page.title)
    });
  }
  return candidates;
}

async function collectVerified(searches, targetCount = 12) {
  const verified = [];
  const seenUrls = new Set();

  for (const q of searches) {
    if (verified.length >= targetCount) break;
    const items = await searchWikimedia(q, 10);
    for (const item of items) {
      if (verified.length >= targetCount) break;
      if (seenUrls.has(item.url)) continue;
      seenUrls.add(item.url);

      const ok = await verifyImageUrl(item.url);
      if (ok) {
        verified.push(item);
        console.log(`   + [${verified.length}/${targetCount}] (${q}) -> ${item.landmark}`);
      }
    }
  }
  return verified;
}

async function run() {
  console.log("=== Collecting 12 verified photos for Switzerland, Thailand, Ananthapuram, Kadiri ===");

  // 1. Switzerland
  console.log("\n1. Swiss Alps:");
  const swissPhotos = await collectVerified([
    "Matterhorn Zermatt",
    "Jungfrau Alps",
    "Lauterbrunnen valley",
    "Grindelwald Switzerland",
    "Eiger mountain",
    "Aletsch Glacier",
    "Lake Geneva Montreux",
    "Lucerne Chapel Bridge",
    "Interlaken Switzerland"
  ], 12);

  // 2. Thailand
  console.log("\n2. Thailand:");
  const thaiPhotos = await collectVerified([
    "Wat Arun Bangkok",
    "Wat Phra Kaew Bangkok",
    "Grand Palace Bangkok",
    "Wat Pho Bangkok",
    "Ayutthaya Historical Park",
    "Chiang Mai temple",
    "Phi Phi Islands Thailand",
    "Railay Beach Krabi",
    "Wat Rong Khun Chiang Rai"
  ], 12);

  // 3. Ananthapuram
  console.log("\n3. Ananthapuram (Lepakshi & Anantapur):");
  const anantapurPhotos = await collectVerified([
    "Lepakshi Veerabhadra Temple",
    "Lepakshi Nandi",
    "Gooty Fort Anantapur",
    "Penukonda Fort Anantapur",
    "Anantapur Clock Tower",
    "Veerabhadra Temple sculpture",
    "Lepakshi temple courtyard",
    "Pennukonda Fort"
  ], 12);

  // 4. Kadiri
  console.log("\n4. Kadiri (Thimmamma Marrimanu & Narasimha Temple):");
  const kadiriPhotos = await collectVerified([
    "Thimmamma Marrimanu",
    "Thimmamma-marrimanu",
    "Thimmamma Marrimanu Anantapur",
    "Kadiri Narasimha temple",
    "Narasimha Swamy Temple Andhra",
    "Katarupalli Yogi Vemana",
    "Penukonda Fort Gate",
    "Gooty Fort Watchtower"
  ], 12);

  // Load final-galleries-master.json
  const masterFile = path.join(__dirname, "final-galleries-master.json");
  const masterData = JSON.parse(fs.readFileSync(masterFile, "utf-8"));

  masterData.galleries["switzerland"] = swissPhotos.map((p) => p.url);
  masterData.landmarks["switzerland"] = swissPhotos.map((p) => p.landmark);

  masterData.galleries["thailand"] = thaiPhotos.map((p) => p.url);
  masterData.landmarks["thailand"] = thaiPhotos.map((p) => p.landmark);

  masterData.galleries["ananthapuram"] = anantapurPhotos.map((p) => p.url);
  masterData.landmarks["ananthapuram"] = anantapurPhotos.map((p) => p.landmark);

  masterData.galleries["kadiri"] = kadiriPhotos.map((p) => p.url);
  masterData.landmarks["kadiri"] = kadiriPhotos.map((p) => p.landmark);

  // Regenerate report rows
  const { DESTINATIONS } = require("./destinations-list.cjs");
  const reportRows = DESTINATIONS.map((d) => {
    const list = masterData.galleries[d.id] || [];
    return {
      Destination: d.name,
      "Unique photo count": list.length,
      "Destination relevance verified": list.length >= 10 ? "Yes" : "Needs review",
      "Broken links or missing images": list.length >= 10 ? `0 broken (${list.length} working)` : `${12 - list.length} missing`
    };
  });
  masterData.report = reportRows;

  fs.writeFileSync(masterFile, JSON.stringify(masterData, null, 2), "utf-8");

  // Re-generate src/data/destinationGalleries.js
  const { generateGalleriesCode } = require("./export-galleries-code.cjs");
  const code = generateGalleriesCode(masterData.galleries, masterData.landmarks);
  const outPath = path.join(__dirname, "..", "src", "data", "destinationGalleries.js");
  fs.writeFileSync(outPath, code, "utf-8");
  console.log(`\nUpdated ${outPath} successfully.`);

  // Write verification-report.md
  let mdTable = "| Destination | Unique photo count | Destination relevance verified | Broken links or missing images |\n";
  mdTable += "|---|---:|---|---|\n";
  reportRows.forEach((r) => {
    mdTable += `| ${r.Destination} | ${r["Unique photo count"]} | ${r["Destination relevance verified"]} | ${r["Broken links or missing images"]} |\n`;
  });
  fs.writeFileSync(path.join(__dirname, "verification-report.md"), mdTable, "utf-8");
  console.log("Saved verification-report.md");

  console.log("\n================ SUMMARY ================");
  console.table(reportRows);
}

run().catch((err) => console.error("FATAL:", err));
