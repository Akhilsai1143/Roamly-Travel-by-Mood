// scripts/verify-destination-galleries.js
// Automated verification script for all 34 destination galleries (12 photos each)
const https = require("https");
const http = require("http");

function checkUrl(url, timeoutMs = 8000) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url.trim());
      const client = parsed.protocol === "https:" ? https : http;
      const req = client.request(
        parsed,
        {
          method: "HEAD",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
          },
          timeout: timeoutMs
        },
        (res) => {
          // If HEAD returns 405 Method Not Allowed, fallback to GET with Range 0-1024
          if (res.statusCode === 405 || res.statusCode === 403) {
            const getReq = client.request(
              parsed,
              {
                method: "GET",
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                  "Range": "bytes=0-2048",
                  "Accept": "image/*"
                },
                timeout: timeoutMs
              },
              (getRes) => {
                const ok = getRes.statusCode >= 200 && getRes.statusCode < 400;
                resolve({
                  ok,
                  statusCode: getRes.statusCode,
                  contentType: getRes.headers["content-type"],
                  contentLength: getRes.headers["content-length"]
                });
                getRes.destroy();
              }
            );
            getReq.on("error", (err) => resolve({ ok: false, error: err.message }));
            getReq.on("timeout", () => {
              getReq.destroy();
              resolve({ ok: false, error: "Timeout" });
            });
            getReq.end();
            return;
          }

          const ok = res.statusCode >= 200 && res.statusCode < 400;
          resolve({
            ok,
            statusCode: res.statusCode,
            contentType: res.headers["content-type"],
            contentLength: res.headers["content-length"]
          });
          res.destroy();
        }
      );

      req.on("error", (err) => resolve({ ok: false, error: err.message }));
      req.on("timeout", () => {
        req.destroy();
        resolve({ ok: false, error: "Timeout" });
      });
      req.end();
    } catch (e) {
      resolve({ ok: false, error: e.message });
    }
  });
}

module.exports = { checkUrl };
