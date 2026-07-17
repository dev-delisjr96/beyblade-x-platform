import { getPlayTypeIcon } from "./playType";

/**
 * Beyblade X part "stats" (see data/*.json → "stats"): attack/defense/
 * stamina/weight on almost every part, plus dash/burstResistance on bits
 * only. Any individual value can be `null` (not measured/not applicable)
 * — shown as an "x" rather than a number wherever a single part's stats
 * are displayed, and treated as 0 wherever stats get summed into a total.
 *
 * attack/defense/stamina reuse the same play-type icons used everywhere
 * else (modules/playType.js); weight/dash/burstResistance use ionicons
 * since there's no dedicated artwork for those.
 */
export const STAT_DEFINITIONS = [
  { key: "attack", iconType: "playType", icon: "attack" },
  { key: "defense", iconType: "playType", icon: "defense" },
  { key: "stamina", iconType: "playType", icon: "stamina" },
  { key: "weight", iconType: "ion", icon: "barbell-outline", unit: "g" },
  { key: "dash", iconType: "ion", icon: "flash-outline" },
  { key: "burstResistance", iconType: "ion", icon: "shield-outline" },
];

export function getStatIcon(key) {
  const definition = STAT_DEFINITIONS.find((def) => def.key === key);
  if (!definition) return undefined;
  return definition.iconType === "playType"
    ? getPlayTypeIcon(definition.icon)
    : undefined;
}

/** Parses a stat value (number, numeric string, or null) into a finite
 * number, treating null/undefined/non-numeric as 0 — used for totals. */
export function parseStatNumber(value) {
  const parsed = typeof value === "string" ? parseFloat(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : 0;
}

/** Sums every stat key across a list of raw `stats` objects (one per
 * part) at once — missing/null values count as 0. Weight totals are
 * rounded to 2 decimals to avoid float noise from summing strings. */
export function sumStats(statsList = []) {
  const totals = {};
  STAT_DEFINITIONS.forEach((definition) => {
    const total = statsList.reduce(
      (sum, stats) => sum + parseStatNumber(stats?.[definition.key]),
      0,
    );
    totals[definition.key] =
      definition.key === "weight" ? Math.round(total * 100) / 100 : total;
  });
  return totals;
}

/**
 * Every stat key actually present across a whole catalog (e.g. every
 * bit's stats) — used to build the "sort by" bar on part selectors, so
 * a part type without dash/burstResistance (anything but bit) simply
 * doesn't offer those as sort options.
 */
export function getAvailableStatKeys(catalog = []) {
  const found = new Set();
  catalog.forEach((part) => {
    Object.keys(part.stats || {}).forEach((key) => found.add(key));
  });
  return STAT_DEFINITIONS.filter((definition) => found.has(definition.key)).map(
    (definition) => definition.key,
  );
}

/**
 * Sorts a list of catalog parts by name or by a stat key (see
 * PartSearchSelect's sort bar). Ties (including every part when sorting
 * by a stat that's `null`/missing on both sides, which resolves to 0 for
 * both) fall back to a name comparison in the same direction, so the
 * list never looks arbitrarily shuffled.
 *
 * @param {Array} parts - catalog parts, each with a `.name` and `.stats`
 * @param {string} sortField - "name" or one of STAT_DEFINITIONS' keys
 * @param {"asc"|"desc"} direction
 */
export function sortParts(parts = [], sortField = "name", direction = "asc") {
  const sorted = [...parts].sort((a, b) => {
    let comparison;

    if (sortField === "name") {
      comparison = (a.name || "").localeCompare(b.name || "");
    } else {
      const aValue = parseStatNumber(a.stats?.[sortField]);
      const bValue = parseStatNumber(b.stats?.[sortField]);
      comparison =
        aValue - bValue || (a.name || "").localeCompare(b.name || "");
    }

    return direction === "desc" ? -comparison : comparison;
  });

  return sorted;
}
