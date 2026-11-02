// scripts/search-photos.cjs
const https = require("https");

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(
      url,
      {
        headers: {
          "User-Agent": "RoamlyTravelApp/1.0 (contact@roamly.com)"
        }
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ error: e.message, raw: data.slice(0, 200) });
          }
        });
      }
    ).on("error", (e) => resolve({ error: e.message }));
  });
}

async function searchCommons(query, limit = 5) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query + " filetype:bitmap")}&gsrlimit=${limit}`;
  const res = await fetchJson(url);
  if (!res || !res.query || !res.query.pages) return [];
  const pages = Object.values(res.query.pages);
  return pages
    .filter((p) => p.imageinfo && p.imageinfo[0] && p.imageinfo[0].url)
    .map((p) => ({
      title: p.title.replace(/^File:/, "").replace(/\.[^.]+$/, ""),
      url: p.imageinfo[0].url,
      width: p.imageinfo[0].width,
      height: p.imageinfo[0].height
    }));
}

async function test() {
  const results = await searchCommons("Udaipur City Palace", 5);
  console.log("Wikimedia Commons results for Udaipur City Palace:");
  console.log(JSON.stringify(results, null, 2));
}

test();
