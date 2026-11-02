// scripts/test-download-destination.cjs
const https = require("https");
const fs = require("fs");
const path = require("path");

function searchWikimedia(query) {
  return new Promise((resolve) => {
    const apiUrl = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=" + encodeURIComponent(query) + "&gsrnamespace=6&prop=imageinfo&iiprop=url|mime|size&gsrlimit=5&format=json";
    https.get(apiUrl, { headers: { "User-Agent": "RoamlyTravelApp/1.0 (travel@roamly.com)" } }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          const pages = Object.values(json.query?.pages || {});
          // Prefer jpg/png images > 40KB and skip maps, icons, logos, coats of arms, flags
          const imagePages = pages.filter(p => {
            const info = p.imageinfo?.[0];
            if (!info || !info.mime?.startsWith("image/")) return false;
            const title = (p.title || "").toLowerCase();
            if (title.includes("map") || title.includes("flag") || title.includes("logo") || title.includes("coat_of_arms") || title.includes("locator")) return false;
            return (info.size || 0) > 40000;
          });
          if (imagePages.length > 0) {
            resolve({ title: imagePages[0].title, url: imagePages[0].imageinfo[0].url });
          } else {
            resolve(null);
          }
        } catch (e) { resolve(null); }
      });
    }).on("error", () => resolve(null));
  });
}

function downloadImage(url, destFilePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destFilePath);
    https.get(url, { headers: { "User-Agent": "RoamlyTravelApp/1.0 (travel@roamly.com)" } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadImage(res.headers.location, destFilePath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destFilePath);
        return reject(new Error(`Failed with status code ${res.statusCode}`));
      }
      res.pipe(file);
      file.on("finish", () => {
        file.close(() => resolve(fs.statSync(destFilePath).size));
      });
    }).on("error", (err) => {
      file.close();
      if (fs.existsSync(destFilePath)) fs.unlinkSync(destFilePath);
      reject(err);
    });
  });
}

const ananthapuramQueries = [
  { q: "Veerabhadra Temple Tower Lepakshi", title: "Veerabhadra Temple Majestic Tower at Lepakshi" },
  { q: "Shiva Bull at Lepakshi Nandi", title: "Colossal Monolithic Nandi Bull of Lepakshi" },
  { q: "Nagalinga at Lepakshi", title: "Seven-Hooded Monolithic Nagalinga Serpent" },
  { q: "Hanging Pillar Veerabhadra Temple Lepakshi", title: "Legendary Architectural Hanging Pillar of Lepakshi" },
  { q: "Gooty Fort Protected Monument", title: "Gooty Fort Historic Hilltop Citadel Ramparts" },
  { q: "Chintalarayaswami Temple Tadipatri", title: "Chintala Venkataramana Temple Stone Architecture, Tadipatri" },
  { q: "Bugga Ramalingeswara temple Tadipatri", title: "Bugga Ramalingeswara Temple on Penna River, Tadipatri" },
  { q: "Gagan Mahal Sri Krishna devaraya Penukonda", title: "Penukonda Fort Gagan Mahal Royal Summer Citadel" },
  { q: "Anantapur Clock tower", title: "Historic Ananthapuram Clock Tower Monument" },
  { q: "Lepakshi Temple ceiling painting frescoes", title: "Vijayanagara Ceiling Frescoes & Artwork, Lepakshi" },
  { q: "Pillars at the Veerabhadra Temple Lepakshi", title: "Natya Mandapam Carved Granite Pillars, Lepakshi" },
  { q: "Jatayu sculpture Lepakshi", title: "Mythological Jatayu Hillside Monument overlooking Lepakshi" }
];

(async () => {
  const targetDir = path.join(__dirname, "../public/images/destinations/ananthapuram");
  fs.mkdirSync(targetDir, { recursive: true });

  console.log("Downloading 12 verified photos for Ananthapuram...");
  for (let i = 0; i < ananthapuramQueries.length; i++) {
    const item = ananthapuramQueries[i];
    const padIdx = String(i + 1).padStart(2, "0");
    const destFile = path.join(targetDir, `photo_${padIdx}.jpg`);
    const searchRes = await searchWikimedia(item.q);
    if (searchRes) {
      try {
        const size = await downloadImage(searchRes.url, destFile);
        console.log(`[OK] Photo #${padIdx}: ${item.title} (${size} bytes) <- ${searchRes.title}`);
      } catch (e) {
        console.error(`[ERR] Download failed for #${padIdx}:`, e.message);
      }
    } else {
      console.warn(`[WARN] Not found for #${padIdx}: ${item.q}`);
    }
  }
})();
