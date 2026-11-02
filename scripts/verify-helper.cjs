const https = require("https");
const http = require("http");

function verifyUrl(url, timeoutMs = 8000) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const client = parsed.protocol === "https:" ? https : http;
      const req = client.request(
        parsed,
        {
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Range": "bytes=0-1024"
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

module.exports = { verifyUrl };
