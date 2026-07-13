/**
 * validate-env.cjs
 *
 * Run before any build to ensure all required environment variables are present.
 * Add to package.json: "build": "npm run validate-env && vite build"
 */

const fs   = require("fs");
const path = require("path");
const logger = require("../utilities/logger.cjs");

// ── Required vars ─────────────────────────────────────────────────────────────
// Update this list whenever you add a new VITE_ variable to .env.example
const REQUIRED_VARS = [
  "VITE_PROXY_URL",
];

// ── Vars that must NOT point to Monday.com directly (security check) ──────────
const MUST_NOT_CONTAIN = {
  VITE_PROXY_URL: "monday.com",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs.readFileSync(filePath, "utf8")
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith("#") && line.includes("="))
      .map(line => {
        const idx = line.indexOf("=");
        return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
      })
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
function run() {
  const envPath = path.resolve(__dirname, "../../.env");

  if (!fs.existsSync(envPath)) {
    logger.error(".env file not found — run `npm run set-env` first.");
    process.exit(1);
  }

  const env     = parseEnvFile(envPath);
  let   hasError = false;

  // 1. Check required vars
  const missing = REQUIRED_VARS.filter(k => !env[k] || env[k].trim() === "");
  if (missing.length > 0) {
    missing.forEach(k => logger.error(`Missing required env var: ${k}`));
    hasError = true;
  }

  // 2. Security checks
  for (const [key, forbidden] of Object.entries(MUST_NOT_CONTAIN)) {
    if (env[key] && env[key].includes(forbidden)) {
      logger.error(`SECURITY: ${key} contains '${forbidden}' — use a server-side proxy instead.`);
      hasError = true;
    }
  }

  // 3. Warn on any VITE_ vars that look like raw API keys (heuristic: >20 chars, no http)
  const suspiciousKeys = Object.keys(env).filter(k =>
    k.startsWith("VITE_") &&
    k.toLowerCase().includes("key") &&
    env[k].length > 20 &&
    !env[k].startsWith("http")
  );
  if (suspiciousKeys.length > 0) {
    suspiciousKeys.forEach(k =>
      logger.error(`SECURITY WARNING: ${k} looks like a raw API key exposed to the browser bundle.`)
    );
    // Warn but don't fail — dev may intentionally expose during local development
  }

  if (hasError) {
    logger.error("Build aborted. Fix the issues above and retry.");
    process.exit(1);
  }

  logger.box("All env vars validated successfully");
}

run();
