// scripts/build-complete-galleries.cjs
const https = require("https");

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

function testImageUrl(url, timeoutMs = 7000) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const req = https.request(
        parsed,
        {
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Range": "bytes=0-4096",
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

async function getWikiSummaryPhoto(articleTitle) {
  if (!articleTitle) return null;
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(articleTitle)}`;
  const json = await fetchJson(url);
  if (!json) return null;
  const imgUrl = json.originalimage ? json.originalimage.source : json.thumbnail ? json.thumbnail.source : null;
  if (!imgUrl) return null;
  const clean = imgUrl.split("?")[0];
  const test = await testImageUrl(clean);
  if (test.ok) {
    return {
      url: clean,
      title: json.title || articleTitle.replace(/_/g, " "),
      width: json.originalimage ? json.originalimage.width : 1200,
      height: json.originalimage ? json.originalimage.height : 800
    };
  }
  return null;
}

async function searchCommonsPhoto(query) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query + " filetype:bitmap")}&gsrlimit=8`;
  const res = await fetchJson(url);
  if (!res || !res.query || !res.query.pages) return null;
  const pages = Object.values(res.query.pages);
  for (const page of pages) {
    if (!page.imageinfo || !page.imageinfo[0] || !page.imageinfo[0].url) continue;
    const info = page.imageinfo[0];
    const cleanUrl = info.url.split("?")[0];
    if (cleanUrl.toLowerCase().endsWith(".svg") || cleanUrl.toLowerCase().endsWith(".tif") || cleanUrl.toLowerCase().endsWith(".pdf")) continue;
    const check = await testImageUrl(cleanUrl);
    if (check.ok) {
      return {
        url: cleanUrl,
        title: page.title.replace(/^File:/, "").replace(/\.[^.]+$/, "").replace(/_/g, " "),
        width: info.width,
        height: info.height
      };
    }
  }
  return null;
}

module.exports = { searchCommonsPhoto, getWikiSummaryPhoto, testImageUrl, fetchJson };
