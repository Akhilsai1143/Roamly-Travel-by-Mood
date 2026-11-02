const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

const content = fs.readFileSync(path.join(__dirname, "../src/data/destinationGalleries.js"), "utf8");

// Extract DESTINATION_GALLERIES and DESTINATION_LANDMARKS
const galleriesMatch = content.match(/export const DESTINATION_GALLERIES = (\{[\s\S]*?\n\};)/);
const landmarksMatch = content.match(/export const DESTINATION_LANDMARKS = (\{[\s\S]*?\n\};)/);

const galleriesStr = galleriesMatch[1].replace(/export const DESTINATION_GALLERIES = /, "").replace(/;$/, "");
const DESTINATION_GALLERIES = eval("(" + galleriesStr + ")");

const landmarksStr = landmarksMatch ? landmarksMatch[1].replace(/export const DESTINATION_LANDMARKS = /, "").replace(/;$/, "") : "{}";
const DESTINATION_LANDMARKS = eval("(" + landmarksStr + ")");

console.log("Auditing", Object.keys(DESTINATION_GALLERIES).length, "destinations...");

function checkUrl(url, timeoutMs = 6000) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const client = parsed.protocol === "https:" ? https : http;
      const req = client.request(
        parsed,
        {
          method: "GET",
          headers: {
            "User-Agent": "RoamlyTravelAuditor/1.0",
            "Range": "bytes=0-1024"
          },
          timeout: timeoutMs
        },
        (res) => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 400,
            status: res.statusCode,
            type: res.headers["content-type"] || ""
          });
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

async function run() {
  const destKeys = Object.keys(DESTINATION_GALLERIES);
  const summary = [];

  for (const destId of destKeys) {
    const urls = DESTINATION_GALLERIES[destId] || [];
    const landmarks = DESTINATION_LANDMARKS[destId] || [];
    
    let broken = 0;
    let questionable = 0;
    const issues = [];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const lmk = landmarks[i] || "";
      const lower = (url + " " + lmk).toLowerCase();

      // Check keywords
      const isBad = lower.includes("monkey") || lower.includes("semnopithecus") || lower.includes("langur") ||
                    lower.includes("elephant") || lower.includes("crab") || lower.includes("dump") ||
                    lower.includes("map") || lower.includes("locator") || lower.includes("district") ||
                    lower.includes("outline") || lower.includes("blast") || lower.includes("homeless") ||
                    lower.includes("minesite") || lower.includes("tasmania") || lower.includes("encrypted-tbn0") ||
                    lower.includes("pot") || lower.includes("bow") || lower.includes("islanders fig") ||
                    lower.includes("bolton") || lower.includes("highway") || lower.includes("railway station") ||
                    lower.includes("leaf") || lower.includes("battle at lanka");

      if (isBad) {
        questionable++;
        issues.push(`Photo ${i + 1} flag: ${lmk} (${url.substring(0, 60)}...)`);
      }

      // Check HTTP status
      const res = await checkUrl(url);
      if (!res.ok) {
        broken++;
        issues.push(`Photo ${i + 1} BROKEN: HTTP ${res.status || res.error}`);
      }
    }

    summary.push({
      destination: destId,
      totalPhotos: urls.length,
      broken,
      questionable,
      issues
    });
  }

  console.log("\n=================== AUDIT SUMMARY ===================");
  summary.forEach(s => {
    console.log(`[${s.destination}] Total: ${s.totalPhotos} | Questionable: ${s.questionable} | Broken: ${s.broken}`);
    if (s.issues.length > 0) {
      s.issues.forEach(iss => console.log(`   -> ${iss}`));
    }
  });
}

run().catch(console.error);
