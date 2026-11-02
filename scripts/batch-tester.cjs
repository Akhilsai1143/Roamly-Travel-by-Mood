// scripts/batch-tester.cjs
const https = require("https");
const http = require("http");

function testUrl(url, timeoutMs = 8000) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url.trim());
      const client = parsed.protocol === "https:" ? https : http;
      const req = client.request(
        parsed,
        {
          method: "HEAD",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "image/*,*/*;q=0.8"
          },
          timeout: timeoutMs
        },
        (res) => {
          if (res.statusCode === 405 || res.statusCode === 403) {
            // Try small GET range
            const getReq = client.request(
              parsed,
              {
                method: "GET",
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                  "Range": "bytes=0-1024"
                },
                timeout: timeoutMs
              },
              (getRes) => {
                const ok = getRes.statusCode >= 200 && getRes.statusCode < 400;
                resolve({ ok, status: getRes.statusCode });
                getRes.destroy();
              }
            );
            getReq.on("error", (e) => resolve({ ok: false, error: e.message }));
            getReq.on("timeout", () => {
              getReq.destroy();
              resolve({ ok: false, error: "timeout" });
            });
            getReq.end();
            return;
          }
          const ok = res.statusCode >= 200 && res.statusCode < 400;
          resolve({ ok, status: res.statusCode });
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

module.exports = { testUrl };
