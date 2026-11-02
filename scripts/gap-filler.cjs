// scripts/gap-filler.cjs
const https = require("https");
const { testImageUrl, fetchJson } = require("./build-complete-galleries.cjs");

async function searchBroadCommonsPhotos(query, neededCount = 10, existingUrls = new Set()) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query + " filetype:bitmap")}&gsrlimit=30`;
  const res = await fetchJson(url);
  if (!res || !res.query || !res.query.pages) return [];
  const pages = Object.values(res.query.pages);
  const results = [];

  for (const page of pages) {
    if (results.length >= neededCount) break;
    if (!page.imageinfo || !page.imageinfo[0] || !page.imageinfo[0].url) continue;
    const info = page.imageinfo[0];
    const cleanUrl = info.url.split("?")[0];
    if (existingUrls.has(cleanUrl)) continue;
    if (cleanUrl.toLowerCase().endsWith(".svg") || cleanUrl.toLowerCase().endsWith(".tif") || cleanUrl.toLowerCase().endsWith(".pdf")) continue;
    // Prefer landscape or square aspect ratio
    if (info.width && info.height && info.height > info.width * 1.5) continue;

    const check = await testImageUrl(cleanUrl);
    if (check.ok) {
      existingUrls.add(cleanUrl);
      const title = page.title.replace(/^File:/, "").replace(/\.[^.]+$/, "").replace(/_/g, " ");
      results.push({
        url: cleanUrl,
        landmark: title.length > 50 ? title.slice(0, 50) + "..." : title,
        width: info.width,
        height: info.height
      });
    }
  }

  return results;
}

module.exports = { searchBroadCommonsPhotos };
