// Vercel Serverless Function Entry Point for Roamly API
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const app = require("../backend/app.js");

export default function handler(req, res) {
  return app(req, res);
}
