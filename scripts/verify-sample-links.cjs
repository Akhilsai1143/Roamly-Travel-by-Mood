// scripts/verify-sample-links.cjs
const https = require("https");
const master = require("./final-galleries-master.json");

const testDests = ["udaipur", "jaipur", "munnar", "ladakh", "goa", "switzerland", "ananthapuram", "kadiri"];

function checkUrl(u) {
  return new Promise((res) => {
    try {
      const parsed = new URL(u);
      const req = https.request(
        parsed,
        {
          method: "HEAD",
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Roamly/1.0" }
        },
        (r) => {
          res(r.statusCode);
        }
      );
      req.on("error", () => res(500));
      req.setTimeout(4000, () => {
        req.destroy();
        res(408);
      });
      req.end();
    } catch {
      res(400);
    }
  });
}

async function main() {
  for (const d of testDests) {
    const urls = master.galleries[d] || [];
    const lms = master.landmarks[d] || [];
    console.log(`\n--- Destination: ${d.toUpperCase()} (${urls.length} photos) ---`);
    for (let i = 0; i < urls.length; i++) {
      const status = await checkUrl(urls[i]);
      console.log(`  [${i + 1}/12] Status: ${status} | Landmark: ${lms[i]}`);
    }
  }
}

main().catch(console.error);
