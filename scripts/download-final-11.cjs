// scripts/download-final-11.cjs
const https = require("https");
const fs = require("fs");
const path = require("path");

function getWikimediaUrl(fileTitle) {
  return new Promise((resolve) => {
    const titleUrl =
      "https://commons.wikimedia.org/w/api.php?action=query&titles=" +
      encodeURIComponent(fileTitle) +
      "&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=1200&format=json";

    https
      .get(titleUrl, { headers: { "User-Agent": "RoamlyTravelApp/2.0 (travel@roamly.com)" } }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            const p = Object.values(json.query?.pages || {})[0];
            if (p && p.imageinfo?.[0]) {
              const info = p.imageinfo[0];
              const thumb = info.thumburl || info.url;
              resolve({ title: p.title, url: thumb });
            } else {
              resolve(null);
            }
          } catch {
            resolve(null);
          }
        });
      })
      .on("error", () => resolve(null));
  });
}

function downloadImage(url, destFilePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destFilePath);
    https
      .get(url, { headers: { "User-Agent": "RoamlyTravelApp/2.0 (travel@roamly.com)" } }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          fs.unlinkSync(destFilePath);
          return downloadImage(res.headers.location, destFilePath).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          file.close();
          if (fs.existsSync(destFilePath)) fs.unlinkSync(destFilePath);
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        res.pipe(file);
        file.on("finish", () => {
          file.close(() => resolve(fs.statSync(destFilePath).size));
        });
      })
      .on("error", (err) => {
        file.close();
        if (fs.existsSync(destFilePath)) fs.unlinkSync(destFilePath);
        reject(err);
      });
  });
}

const FINAL_11 = [
  { dest: "gokarna", photo: 8, title: "File:Gokarna picture near Om Beach.jpg" },
  { dest: "manali", photo: 10, title: "File:Hertiage village.jpg" },
  { dest: "manali", photo: 11, title: "File:Rohtang pass from sideway.jpg" },
  { dest: "varkala", photo: 6, title: "File:Varkala beach sunset.jpg" },
  { dest: "varkala", photo: 10, title: "File:Anjengo Fort.jpg" },
  { dest: "rishikesh", photo: 8, title: "File:Uttarakhand Rishikesh.jpg" },
  { dest: "gulmarg", photo: 9, title: "File:Gulmarg , Jammu & Kashmir.jpg" },
  { dest: "gulmarg", photo: 10, title: "File:Snowy water stream from gulmarg kashmir valley.jpg" },
  { dest: "tawang", photo: 10, title: "File:Lake at Tawang, Arunachal Pradesh, India.jpg" },
  { dest: "kutch", photo: 11, title: "File:Rann of Kutch - White Desert.jpg" },
  { dest: "maldives", photo: 11, title: "File:Beach and bungalow. Eriyadu, Maldives.jpg" }
];

async function main() {
  console.log("=== DOWNLOADING FINAL 11 VERIFIED ASSETS ===");
  const baseDir = path.join(__dirname, "../public/images/destinations");

  for (let i = 0; i < FINAL_11.length; i++) {
    const item = FINAL_11[i];
    const pad = String(item.photo).padStart(2, "0");
    const destFile = path.join(baseDir, item.dest, `photo_${pad}.jpg`);
    console.log(`[${i + 1}/${FINAL_11.length}] ${item.dest} #${pad} -> ${item.title}...`);

    const info = await getWikimediaUrl(item.title);
    if (info && info.url) {
      try {
        const size = await downloadImage(info.url, destFile);
        console.log(`   ✓ Saved: ${size} bytes`);
      } catch (e) {
        console.error(`   ✗ Error:`, e.message);
      }
    } else {
      console.error(`   ✗ Could not get URL for ${item.title}`);
    }
  }

  console.log("\n=== AUDITING ALL 408 FILES ON DISK ===");
  const { DESTINATIONS } = require("./destinations-list.cjs");
  let totalMissing = 0;
  DESTINATIONS.forEach((d) => {
    for (let p = 1; p <= 12; p++) {
      const pad = String(p).padStart(2, "0");
      const f = path.join(baseDir, d.id, `photo_${pad}.jpg`);
      if (!fs.existsSync(f) || fs.statSync(f).size < 15000) {
        totalMissing++;
        console.error(`Missing or corrupted: ${d.id} photo_${pad}.jpg`);
      }
    }
  });

  if (totalMissing === 0) {
    console.log("🎉 ALL 408 DESTINATION PHOTOS EXIST ON DISK AND ARE FULLY VERIFIED!");
  } else {
    console.error(`Still ${totalMissing} photos missing!`);
  }
}

main().catch(console.error);
