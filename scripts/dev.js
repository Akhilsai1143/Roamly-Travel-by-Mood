// Cross-platform concurrent runner for Roamly (Frontend + Backend)
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const backendDir = path.resolve(rootDir, "backend");

const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

console.log("\x1b[36m%s\x1b[0m", "==========================================================");
console.log("\x1b[36m%s\x1b[0m", "  Starting Roamly Full-Stack Development Environment...   ");
console.log("\x1b[36m%s\x1b[0m", "==========================================================");

// 1. Start Backend Server
const backend = spawn(npmCmd, ["run", "dev"], {
  cwd: backendDir,
  shell: true,
  stdio: ["pipe", "pipe", "pipe"]
});

backend.stdout.on("data", (data) => {
  process.stdout.write(`\x1b[33m[Backend]\x1b[0m ${data}`);
});

backend.stderr.on("data", (data) => {
  process.stderr.write(`\x1b[31m[Backend Error]\x1b[0m ${data}`);
});

// 2. Start Frontend Dev Server
const frontend = spawn(npmCmd, ["run", "dev"], {
  cwd: rootDir,
  shell: true,
  stdio: ["pipe", "pipe", "pipe"]
});

frontend.stdout.on("data", (data) => {
  process.stdout.write(`\x1b[32m[Frontend]\x1b[0m ${data}`);
});

frontend.stderr.on("data", (data) => {
  process.stderr.write(`\x1b[31m[Frontend Error]\x1b[0m ${data}`);
});

function cleanup() {
  console.log("\n\x1b[33mShutting down Roamly services...\x1b[0m");
  try {
    backend.kill();
  } catch {}
  try {
    frontend.kill();
  } catch {}
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
