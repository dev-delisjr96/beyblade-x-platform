/**
 * Downloads every part image referenced in src/data/*.json to a local
 * folder (public/parts/), renamed to <entry.id>.<ext>, then rewrites each
 * JSON file's "img" field to point at the local file instead of the
 * remote CDN URL.
 *
 * Why: some CDNs (looking at you, static.wikia.nocookie.net) are slow or
 * flaky enough to stall client-side screenshot/canvas code that has to
 * actually fetch the image bytes. Serving the images from our own
 * `public/` folder makes them instant, reliable, and CORS-free.
 *
 * Usage:
 *   node ./scripts/logic/download-part-images.cjs
 *   npm run download-images
 *
 * Safe to re-run: already-downloaded files are skipped, and entries whose
 * "img" is already a local path (starts with "/") are left alone.
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const ROOT = path.resolve(__dirname, "../../");
const DATA_DIR = path.resolve(ROOT, "src/data");
const OUTPUT_DIR = path.resolve(ROOT, "public/parts");
const PUBLIC_URL_PREFIX = "/parts";

const CONCURRENCY = 8;
const MAX_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 20000;

const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"];

/**
 * Wikia image URLs look like:
 *   https://static.wikia.nocookie.net/beyblade/images/a/bb/BladeDranSword.png/revision/latest?cb=...
 * The real extension sits on the filename segment right before
 * "/revision/...", not at the end of the URL — so a plain path.extname()
 * on the whole URL would grab nothing useful. Look for that segment
 * specifically, and fall back to .png if nothing recognizable is found.
 */
function getExtensionFromUrl(url) {
  try {
    const { pathname } = new URL(url);
    const segments = pathname.split("/").filter(Boolean);
    const revisionIndex = segments.indexOf("revision");
    const filenameSegment =
      revisionIndex > 0 ? segments[revisionIndex - 1] : segments.at(-1);
    const ext = path.extname(filenameSegment || "").toLowerCase();
    return ALLOWED_EXTENSIONS.includes(ext) ? ext : ".png";
  } catch {
    return ".png";
  }
}

function download(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https://") ? https : http;

    const request = client.get(url, { timeout: REQUEST_TIMEOUT_MS }, (response) => {
      // Follow redirects (wikia URLs sometimes 301/302 before the final asset).
      if (
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        response.resume();
        download(new URL(response.headers.location, url).toString(), destPath)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(destPath);
      response.pipe(fileStream);
      fileStream.on("finish", () => fileStream.close(resolve));
      fileStream.on("error", reject);
    });

    request.on("timeout", () => request.destroy(new Error("Request timed out")));
    request.on("error", reject);
  });
}

async function downloadWithRetry(url, destPath) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await download(url, destPath);
      return;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
  }

  // Clean up a partial file, if any, before giving up.
  if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
  throw lastError;
}

/** Runs `items` through `worker` with at most `limit` in flight at once. */
async function runWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function runNext() {
    const index = nextIndex++;
    if (index >= items.length) return;
    results[index] = await worker(items[index], index);
    await runNext();
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runNext));
  return results;
}

async function processFile(fileName, stats) {
  const filePath = path.join(DATA_DIR, fileName);
  const entries = JSON.parse(fs.readFileSync(filePath, "utf8"));

  if (!Array.isArray(entries)) {
    console.log(`  Skipping ${fileName} (not an array)`);
    return;
  }

  const jobs = entries.filter(
    (entry) => entry?.id && entry?.img && !entry.img.startsWith(PUBLIC_URL_PREFIX),
  );

  if (jobs.length === 0) {
    console.log(`  Nothing to download in ${fileName}`);
    return;
  }

  let changed = false;

  await runWithConcurrency(jobs, CONCURRENCY, async (entry) => {
    const ext = getExtensionFromUrl(entry.img);
    const localFileName = `${entry.id}${ext}`;
    const destPath = path.join(OUTPUT_DIR, localFileName);
    const localUrl = `${PUBLIC_URL_PREFIX}/${localFileName}`;

    if (fs.existsSync(destPath)) {
      console.log(`  ↷ ${entry.id} (already downloaded)`);
      entry.img = localUrl;
      changed = true;
      stats.skipped++;
      return;
    }

    try {
      await downloadWithRetry(entry.img, destPath);
      console.log(`  ✓ ${entry.id} -> ${localFileName}`);
      entry.img = localUrl;
      changed = true;
      stats.downloaded++;
    } catch (err) {
      console.error(`  ✗ ${entry.id} FAILED (${entry.img}): ${err.message}`);
      stats.failed++;
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
    console.log(`  Updated ${fileName}`);
  }
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const files = fs
    .readdirSync(DATA_DIR)
    .filter((file) => file.endsWith(".json"));

  const stats = { downloaded: 0, skipped: 0, failed: 0 };

  for (const file of files) {
    console.log(`\n=== ${file} ===`);
    // eslint-disable-next-line no-await-in-loop
    await processFile(file, stats);
  }

  console.log("\n----------------------------------------");
  console.log(`Downloaded: ${stats.downloaded}`);
  console.log(`Already had: ${stats.skipped}`);
  console.log(`Failed: ${stats.failed}`);
  console.log(`Images saved to: ${path.relative(ROOT, OUTPUT_DIR)}`);
  console.log("----------------------------------------\n");

  if (stats.failed > 0) {
    console.log(
      "Some images failed to download — their JSON entries were left pointing at the original remote URL, so nothing broke. Re-run this script to retry just those.",
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
