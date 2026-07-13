/**
 * add-query-key.cjs
 *
 * Interactively appends a new key factory function to src/api/queryKeys.js.
 * Keeps the file as the single source of truth for all React Query cache keys.
 *
 * Usage: npm run add-key
 */

const path   = require("path");
const fs     = require("fs");
const { input, select } = require("@inquirer/prompts");
const LOGGER = require("../utilities/logger.cjs");

const KEYS_PATH = path.resolve(__dirname, "../../src/api/queryKeys.js");

async function run() {
  if (!fs.existsSync(KEYS_PATH)) {
    LOGGER.error(`queryKeys.js not found at ${KEYS_PATH}. Aborting.`);
    process.exit(1);
  }

  // 1. Key name
  const keyName = await input({
    message: "Query key name (camelCase, e.g. jobDetails):",
  });
  if (!keyName || !/^[a-z]/.test(keyName)) {
    LOGGER.error("Key name must start with a lowercase letter. Aborting.");
    process.exit(1);
  }

  // 2. Parameters
  const paramsRaw = await input({
    message: "Parameters (comma-separated, leave empty for none, e.g. boardId,itemId):",
  });
  const params = paramsRaw
    .split(",")
    .map(p => p.trim())
    .filter(Boolean);

  // 3. Description
  const desc = await input({
    message: "JSDoc description (e.g. Key for a specific job detail by id):",
  });

  // 4. Scope / tag
  const scope = await select({
    message: "Key scope:",
    choices: [
      { name: "Board-level",    value: "board" },
      { name: "Item-level",     value: "item" },
      { name: "Country-level",  value: "country" },
      { name: "Folder-level",   value: "folder" },
      { name: "Global / other", value: "global" },
    ],
  });

  // ── Build the array literal ───────────────────────────────────────────────
  const scopePrefix = scope !== "global" ? `'${scope}', ` : "";
  const paramStr    = params.join(", ");
  const arrayItems  = params.length
    ? `[${scopePrefix}'${keyName}', ${paramStr}]`
    : `[${scopePrefix}'${keyName}']`;

  const paramDocs = params.map(p => `   * @param {string|number} ${p}`).join("\n");

  const entry = [
    ``,
    `  /**`,
    `   * ${desc}`,
    ...(params.length ? [paramDocs] : []),
    `   * @returns {Array}`,
    `   */`,
    `  ${keyName}: (${paramStr}) => ${arrayItems},`,
  ].join("\n");

  // ── Insert before the closing `};` of the queryKeys object ───────────────
  let content = fs.readFileSync(KEYS_PATH, "utf8");

  // Find the last `};` that closes the exported object
  const closingPattern = /\n};(\s*)$/;
  if (!closingPattern.test(content)) {
    LOGGER.error("Could not locate closing `};` in queryKeys.js. Please add the key manually.");
    process.exit(1);
  }

  content = content.replace(closingPattern, `${entry}\n};$1`);
  fs.writeFileSync(KEYS_PATH, content, "utf8");

  LOGGER.box(`queryKeys.${keyName} added to src/api/queryKeys.js`, "Done");
}

run();
