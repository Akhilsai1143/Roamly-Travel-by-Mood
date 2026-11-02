// scripts/test-curate-batch.cjs
const https = require("https");
const fs = require("fs");
const path = require("path");

function searchWikimedia(query) {
  return new Promise((resolve) => {
    const apiUrl =
      "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=" +
      encodeURIComponent(query) +
      "&gsrnamespace=6&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=1200&gsrlimit=8&format=json";

    https
      .get(apiUrl, { headers: { "User-Agent": "RoamlyTravelApp/2.0 (travel@roamly.com)" } }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            const pages = Object.values(json.query?.pages || {});
            const valid = pages.filter((p) => {
              const info = p.imageinfo?.[0];
              if (!info) return false;
              const mime = (info.mime || "").toLowerCase();
              if (mime !== "image/jpeg" && mime !== "image/png" && mime !== "image/webp") return false;
              const title = (p.title || "").toLowerCase();
              if (
                title.includes("map") ||
                title.includes("flag") ||
                title.includes("logo") ||
                title.includes("coat_of_arms") ||
                title.includes("locator") ||
                title.includes(".djvu") ||
                title.includes(".svg") ||
                title.includes(".pdf")
              )
                return false;
              return (info.size || 0) > 30000;
            });

            if (valid.length > 0) {
              const best = valid[0];
              const thumb = best.imageinfo[0].thumburl || best.imageinfo[0].url;
              resolve({ title: best.title, url: thumb });
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

(async () => {
  console.log("Testing search for Kadiri and Hampi...");
  const k1 = await searchWikimedia("File:Kadiri Temple North Gopuram.JPG");
  console.log("K1:", k1);
  const h1 = await searchWikimedia("File:Stone Chariot, Hampi 3.jpg");
  console.log("H1:", h1);
  const j1 = await searchWikimedia("Hawa Mahal Jaipur facade");
  console.log("J1:", j1);
})();
