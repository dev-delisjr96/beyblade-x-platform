import blades from "../data/blades.json";
import main_blades from "../data/main-blades.json";
import over_blades from "../data/over-blades.json";
import assist_blades from "../data/assist-blades.json";
import lock_chips from "../data/lock-chip.json";
import ratchets from "../data/ratchets.json";
import bits from "../data/bits.json";

import * as utilities from "../utilities/index";
import * as ruleConditions from "./rules/conditions";
import * as beyXSchema from "./schema";
import { PLAY_TYPES } from "./playType";

export const CX_PARTS = [
  {
    id: "main-blade",
    aliases: ["main"],
  },
  {
    id: "over-blade",
    aliases: ["over"],
  },
  {
    id: "assist-blade",
    aliases: ["assist"],
  },
  {
    id: "lock-chip",
    aliases: ["lock", "chip"],
  },
];

export function getCXPart(part = "main-blade") {
  return CX_PARTS.find(
    (cxPart) => cxPart.id === part || cxPart.aliases.includes(part),
  );
}

export function formatCxPartId(cxPart, str) {
  const main_blade_prefix = "cx-main-blade";
  const over_blade_prefix = "over-blade";
  const assist_blade_prefix = "assist-blade";
  const lock_chip_prefix = "lock-chip";

  function formatId(prefix) {
    if (!str.startsWith(prefix)) return `${prefix}-${str}`;
    else return str;
  }

  switch (cxPart) {
    case "main-blade":
      return formatId(main_blade_prefix, str);
    case "main":
      return formatId(main_blade_prefix, str);
    case "over-blade":
      return formatId(over_blade_prefix, str);
    case "over":
      return formatId(over_blade_prefix, str);
    case "assist-blade":
      return formatId(assist_blade_prefix, str);
    case "assist":
      return formatId(assist_blade_prefix, str);
    case "lock-chip":
      return formatId(lock_chip_prefix, str);
    case "lock":
      return formatId(lock_chip_prefix, str);
    case "chip":
      return formatId(lock_chip_prefix, str);

    default:
      return formatId(main_blade_prefix, str);
  }
}

export function findBit(bitFile, bitSearched) {
  if (bitSearched.length === 1 || bitSearched.length === 2) {
    return bitFile.find(
      (bit) =>
        bit.name.split("(")[1].replace(")", "").toLowerCase() ===
        bitSearched.toLowerCase(),
    );
  } else {
    return bitFile.find((bit) => bit.id === bitSearched);
  }
}

/**
 * Whether a given blade id has a built-in ratchet (see data/blades.json
 * → "ratchetIntegrated"). When true, the deck builder hides the separate
 * ratchet selector for that build — there's no ratchet piece to pick.
 */
export function isRatchetIntegratedBlade(bladeId) {
  if (!bladeId) return false;
  const bladeData = blades.find((blade) => blade.id === bladeId);
  return Boolean(bladeData?.ratchetIntegrated);
}

/**
 * A blade's spin direction (see data/blades.json → "spin"). Defaults to
 * "right", which is the unmarked/default spin for every blade that doesn't
 * explicitly set `"spin": "left"`.
 *
 * @returns {"left"|"right"|undefined} undefined when no blade is selected.
 */
export function getBladeSpin(bladeId) {
  if (!bladeId) return undefined;
  const bladeData = blades.find((blade) => blade.id === bladeId);
  return bladeData?.spin === "left" ? "left" : "right";
}

/**
 * Whether a given main-blade id supports an over-blade (see
 * data/main-blades.json → "withOverBlade"). When false/absent, the deck
 * builder hides the over-blade selector for that build — it doesn't take
 * one.
 */
export function mainBladeAllowsOverBlade(mainBladeId) {
  if (!mainBladeId) return false;
  const mainBladeData = main_blades.find((blade) => blade.id === mainBladeId);
  return Boolean(mainBladeData?.withOverBlade);
}

/**
 * A part's "play type" (attack/balance/stamina/defense — see
 * modules/playType.js), if it has one. Only blade, main-blade,
 * assist-blade and bit carry this in the catalog; ratchet, lock-chip and
 * over-blade don't, so this simply returns undefined for those.
 */
export function getPartPlayType(partType, partId) {
  if (!partId) return undefined;
  const partData = findPartData(partType, partId);
  return partData?.play_type;
}

/**
 * Every distinct play type present across a part type's whole catalog
 * (e.g. every bit's play_type) — used to build the play-type filter on
 * part selectors. Returns [] for part types that don't carry play_type
 * at all (ratchet, lock-chip, over-blade), so the filter simply doesn't
 * render for them.
 */
export function getAvailablePlayTypes(catalog = []) {
  const found = new Set();
  catalog.forEach((part) => {
    if (part.play_type) found.add(part.play_type);
  });
  return PLAY_TYPES.filter((type) => found.has(type));
}

/**
 * A part's raw "stats" object (see modules/partStats.js), if it has one
 * — attack/defense/stamina/weight on almost every part, plus dash/
 * burstResistance on bits only. Individual values may be `null`.
 */
export function getPartStats(partType, partId) {
  if (!partId) return null;
  const partData = findPartData(partType, partId);
  return partData?.stats || null;
}

/**
 * Every visible part's raw stats object for a build entry, in schema
 * order — ready to pass to modules/partStats.js sumStats() for the
 * entry's total. Parts with no stats data are simply skipped.
 */
export function getEntryStatsList(entryType = "simple", entry = {}) {
  const visibleFields = getVisibleEntryFields(entryType, entry);
  return visibleFields
    .map((partType) => getPartStats(partType, entry?.[partType]))
    .filter(Boolean);
}

export function getDataFileByPart(part) {
  const globalized_part = utilities.globalizeString(part, "-");
  const isCxPart = getCXPart(globalized_part);

  if (isCxPart) {
    switch (isCxPart.id) {
      case "main-blade":
        return main_blades;
      case "over-blade":
        return over_blades;
      case "assist-blade":
        return assist_blades;
      case "lock-chip":
        return lock_chips;
      default:
        return main_blades;
    }
  } else {
    switch (part) {
      case "blade":
        return blades;
      case "ratchet":
        return ratchets;
      case "bit":
        return bits;
      default:
        return blades;
    }
  }
}

/**
 * Looks up the rule-set value assigned to a given part.
 *
 * Handles rule-set "combo" bonuses (see modules/rules/conditions.js): a
 * part's value entry always has a base `value`, plus an optional
 * `rule-set` array of bonus rules (e.g. blade "bullet-griffon" is worth 4
 * normally, 5 when paired with the "Merge" bit; bit "elevate" is worth 0
 * normally, 3 when paired with a left-spin blade). The first rule whose
 * condition is currently satisfied wins; otherwise the base value applies.
 *
 * Also handles "retools" (see data/blades.json → "retools.original"):
 * collab/recolor variants of an existing blade that don't get their own
 * entry in the rule set. If a part has no explicit value data of its own
 * but its catalog entry names an `original`, it's worth whatever that
 * original resolves to instead (recursively, in case of a retool-of-a-
 * retool chain). This is purely a client-side display rule — nothing is
 * ever written back to RTDB for it; the rule set itself is untouched.
 *
 * A part that isn't listed in the rule set's values at all (and has no
 * retool original either), or whose entry is missing a `value`, counts
 * as worth 0 points — it's simply not scored, same as an explicit
 * `"value": 0`. This is distinct from an explicit ban (`value:
 * false`/`null`, see isBannedValue), which is left exactly as-is.
 *
 * Falls back to the merged "cx" value list (used by rule sets that group
 * main-blade / over-blade / assist-blade / lock-chip values together) when
 * the part type has no dedicated entry in the values set at all.
 *
 * @param {Object} valuesSet - RULE_SET.deck.values for the selected rule-set
 * @param {string} partType  - e.g. "blade", "main-blade", "ratchet", "bit"
 * @param {string} partName  - the part's id/name to look up
 * @param {Object} [context] - passed straight through to
 *   ruleConditions.isRuleSatisfied — { buildEntry, toggles }
 * @returns {number|boolean|null|undefined} undefined only when no part is
 *   selected at all (`partName` falsy); otherwise a resolved value — 0
 *   when the part has no rule-set value, or `false`/`null` when it's
 *   explicitly banned.
 */
export function findPartValue(
  valuesSet = {},
  partType = "blade",
  partName,
  context = {},
) {
  if (!partName) return undefined;

  const direct_match = (valuesSet?.[partType] || []).find(
    (entry) => entry.name === partName,
  );
  const entry =
    direct_match || (valuesSet?.cx || []).find((item) => item.name === partName);

  if (entry) {
    const rules = Array.isArray(entry["rule-set"]) ? entry["rule-set"] : [];

    for (let ruleIndex = 0; ruleIndex < rules.length; ruleIndex++) {
      const rule = rules[ruleIndex];
      if (ruleConditions.isRuleSatisfied(rule, ruleIndex, partName, context)) {
        return rule.newValue;
      }
    }

    if (entry.value !== undefined) return entry.value;
  }

  // No usable entry — check whether this part is a retool of another one.
  const catalogPartData = findPartData(partType, partName);
  const originalId = catalogPartData?.retools?.original;
  if (originalId && originalId !== partName) {
    return findPartValue(valuesSet, partType, originalId, context);
  }

  return 0;
}

/**
 * Every distinct point value a part type can currently be worth in a
 * rule set — base values plus any rule-set combo/toggle bonus values
 * (e.g. blade "bullet-griffon" contributes both 4 and 5) — sorted
 * highest to lowest, with banned parts (see isBannedValue) merged into
 * one "ban" tier last. Used to build the value-tier filter on part
 * selectors, straight from whatever's actually in the rule set (RTDB) —
 * nothing hardcoded.
 *
 * A part with no entry at all (or an entry missing `value`) resolves to
 * 0 (see findPartValue), but a rule set normally has no *explicit*
 * `"value": 0` entry to detect that from. Passing `catalog` (the full
 * list of parts for this type, e.g. from data/index.js) lets this check
 * for that case too, so "0" still shows up as a filterable tier whenever
 * at least one catalog part would actually resolve to 0.
 *
 * @param {Object} valuesSet - RULE_SET.deck.values for the selected rule-set
 * @param {string} partType
 * @param {Array} [catalog] - every part of this type, e.g. PARTS[partType]
 * @returns {Array<number|"ban">}
 */
export function getAvailableValueTiers(
  valuesSet = {},
  partType = "blade",
  catalog = [],
) {
  const direct = Array.isArray(valuesSet?.[partType])
    ? valuesSet[partType]
    : [];
  const entries =
    direct.length > 0
      ? direct
      : (valuesSet?.cx || []).filter((entry) => entry.part === partType);

  const tiers = new Set();

  entries.forEach((entry) => {
    tiers.add(
      isBannedValue(entry.value)
        ? "ban"
        : entry.value === undefined
          ? 0
          : entry.value,
    );

    const rules = Array.isArray(entry["rule-set"]) ? entry["rule-set"] : [];
    rules.forEach((rule) =>
      tiers.add(isBannedValue(rule.newValue) ? "ban" : rule.newValue),
    );
  });

  // A part entirely missing from the rule set also resolves to 0 (see
  // findPartValue) — make sure "0" is filterable even when nothing in the
  // JSON explicitly says so.
  const hasImplicitZero = catalog.some((part) => {
    const matchedEntry = entries.find((entry) => entry.name === part.id);
    return !matchedEntry || matchedEntry.value === undefined;
  });
  if (hasImplicitZero) tiers.add(0);

  return Array.from(tiers).sort((a, b) => {
    if (a === "ban") return 1;
    if (b === "ban") return -1;
    return b - a;
  });
}

/**
 * Whether a resolved part value means "banned / explicitly unscored"
 * (e.g. bit "metal-needle"). Historically this was written to RTDB as
 * `null`; the app now writes `false` for new bans instead, but both are
 * treated identically everywhere so existing `null` data keeps working.
 */
export function isBannedValue(value) {
  return value === false || value === null;
}

export function findPartData(part = "blade", idName = "dran-sword") {
  const filePart = getDataFileByPart(part);
  const globalized_part = utilities.globalizeString(part);
  const isCxPart = getCXPart(globalized_part);

  /* eslint-disable-next-line no-useless-assignment */
  let partData = undefined;

  const globalized_name = utilities.globalizeString(idName, "-");

  let idPartName = globalized_name;

  if (isCxPart) {
    idPartName = formatCxPartId(isCxPart.id, globalized_name);
  }

  if (part === "bit") {
    partData = findBit(filePart, globalized_name);
  } else {
    partData = filePart.find((p) => p.id === idPartName);
  }

  if (!partData) {
    const name_splits = globalized_name.split("-");

    for (let i = 0; i < name_splits.length; i++) {
      const element = name_splits[i];
      partData = filePart.find((p) => p.id.includes(element));

      if (partData) {
        break;
      }
    }
  }

  return partData;
}

/**
 * The fields that should actually be rendered/filled for a build entry,
 * given its build type. Drops:
 *  - "ratchet" when the selected blade is ratchet-integrated (see
 *    isRatchetIntegratedBlade) — there's no ratchet piece to pick.
 *  - "over-blade" when the selected main-blade doesn't support one (see
 *    mainBladeAllowsOverBlade).
 */
export function getVisibleEntryFields(entryType = "simple", entry = {}) {
  const fields = beyXSchema.BUILD_TYPE_FIELDS[entryType] || [];
  const hideRatchet = isRatchetIntegratedBlade(entry?.blade);
  const hideOverBlade = !mainBladeAllowsOverBlade(entry?.["main-blade"]);

  return fields.filter((field) => {
    if (field === "ratchet" && hideRatchet) return false;
    if (field === "over-blade" && hideOverBlade) return false;
    return true;
  });
}

/** Whether every visible field of a single build entry has a value. */
export function isEntryComplete(entryType = "simple", entry = {}) {
  const fields = getVisibleEntryFields(entryType, entry);
  return fields.length > 0 && fields.every((field) => Boolean(entry?.[field]));
}

/** Whether every entry in the deck is fully filled in. */
export function isDeckComplete(entryTypes = [], entries = []) {
  if (entries.length === 0) return false;
  return entries.every((entry, index) =>
    isEntryComplete(entryTypes[index], entry),
  );
}

/**
 * The letter(s) shown in parentheses in a bit's display name, e.g.
 * "Free Flat (FF)" → "FF". Falls back to the full name if the pattern
 * isn't found.
 */
export function getBitAbbreviation(bitId) {
  if (!bitId) return "";
  const bitData = findPartData("bit", bitId);
  const match = bitData?.name?.match(/\(([^)]+)\)/);
  return match ? match[1] : bitData?.name || "";
}

/**
 * A part's short, prefix-free display name, e.g. lock-chip-dran → "Dran"
 * (as opposed to its full catalog name "Lock Chip - Dran").
 */
export function getPartShortName(partType, partId) {
  if (!partId) return "";
  const partData = findPartData(partType, partId);
  return partData?.full_name?.["takara-tomy"] || partData?.name || "";
}

/** The first letter of a part's short display name, e.g. "Slash" → "S". */
export function getPartInitial(partType, partId) {
  const shortName = getPartShortName(partType, partId);
  return shortName ? shortName.charAt(0).toUpperCase() : "";
}

/**
 * The compact title shown for a build in the deck summary popup:
 *  - simple: "{blade name} {ratchet} {bit abbreviation}"
 *  - cx: "{lock chip} {main blade} {over-blade initial} {assist-blade
 *    initial} {ratchet} {bit abbreviation}"
 */
export function buildEntryTitle(entryType = "simple", entry = {}) {
  const ratchet = entry.ratchet || "";
  const bitAbbrev = getBitAbbreviation(entry.bit);

  if (entryType === "cx") {
    const lockChip = getPartShortName("lock-chip", entry["lock-chip"]);
    const mainBlade = getPartShortName("main-blade", entry["main-blade"]);
    const overBladeInitial = mainBladeAllowsOverBlade(entry["main-blade"])
      ? getPartInitial("over-blade", entry["over-blade"])
      : "";
    const assistBladeInitial = getPartInitial(
      "assist-blade",
      entry["assist-blade"],
    );

    return [
      lockChip,
      mainBlade,
      overBladeInitial,
      assistBladeInitial,
      ratchet,
      bitAbbrev,
    ]
      .filter(Boolean)
      .join(" ");
  }

  const bladeData = findPartData("blade", entry.blade);
  const bladeName = bladeData?.name || "";

  return [bladeName, ratchet, bitAbbrev].filter(Boolean).join(" ");
}

/**
 * Recursively adds one display-only chip entry per retool variant of a
 * part (see data/blades.json → "retools.variants"), sharing the same
 * value/label/combo as the part just pushed. Purely additive for the
 * Point Values page — these never get their own RTDB entry, and editing
 * one of these synthesized chips (see pages/RulesPointValues) is
 * disabled since there's nothing real to edit.
 *
 * Recurses so a chain (e.g. phoenix-wing → tyranno-roar → ...its own
 * variants) is fully expanded, guarding against cycles with `visited`.
 */
function pushRetoolVariantEntries(
  entries,
  partType,
  partId,
  value,
  label,
  combo,
  visited = new Set(),
) {
  if (visited.has(partId)) return;
  visited.add(partId);

  const catalogPartData = findPartData(partType, partId);
  const variantIds = catalogPartData?.retools?.variants;
  if (!Array.isArray(variantIds)) return;

  variantIds.forEach((variantId) => {
    entries.push({
      partType,
      partId: variantId,
      value,
      label,
      combo,
      isRetoolVariant: true,
    });
    pushRetoolVariantEntries(
      entries,
      partType,
      variantId,
      value,
      label,
      combo,
      visited,
    );
  });
}

/**
 * Flattens a whole rule-set's values object into a list of "point list"
 * chip entries — one per part, plus one more per rule-set combo/toggle
 * bonus it carries (see modules/rules/conditions.js), each tagged with
 * the point value it's worth. Also expands each part's retool variants
 * (see pushRetoolVariantEntries) into the same row, purely for display.
 *
 * Each raw value entry already carries its own `part` field (this is what
 * lets rule sets like ibna-dran-gladius merge every CX part into one
 * "cx" array and still know which is a main-blade vs an assist-blade), so
 * this reads that instead of trusting the outer valuesSet key.
 *
 * @param {Object} valuesSet - RULE_SET.deck.values for the selected rule-set
 * @returns {Array<{partType: string, partId: string, value: number|null, label: string|null}>}
 */
export function buildPointListEntries(valuesSet = {}) {
  const entries = [];

  Object.values(valuesSet).forEach((partEntries) => {
    if (!Array.isArray(partEntries)) return;

    partEntries.forEach((partEntry) => {
      const partType = partEntry.part;
      const partId = partEntry.name;

      if (partEntry.value !== 0) {
        entries.push({
          partType,
          partId,
          value: partEntry.value,
          label: null,
        });
        pushRetoolVariantEntries(
          entries,
          partType,
          partId,
          partEntry.value,
          null,
          undefined,
        );
      }

      const rules = Array.isArray(partEntry["rule-set"])
        ? partEntry["rule-set"]
        : [];

      rules.forEach((rule) => {
        if (rule.newValue !== 0) {
          entries.push({
            partType,
            partId,
            value: rule.newValue,
            label: rule.label,
            combo: rule.combo,
          });
          pushRetoolVariantEntries(
            entries,
            partType,
            partId,
            rule.newValue,
            rule.label,
            rule.combo,
          );
        }
      });
    });
  });

  return entries;
}

// Fixed display order for part-type chips within a point-value row (see
// groupPointListEntriesByValue) and for part-type sections in the "by
// part" view (see groupPointListEntriesByPart).
const PART_TYPE_ORDER = [
  "blade",
  "lock-chip",
  "main-blade",
  "over-blade",
  "assist-blade",
  "ratchet",
  "bit",
];

/**
 * Groups point-list entries (see buildPointListEntries) by their value,
 * returned as value/entries pairs already sorted highest-to-lowest, with
 * banned parts (see isBannedValue) merged into one "ban" group sorted
 * last, regardless of whether they're stored as `null` or `false`. Within
 * each group, entries are ordered by part type (see PART_TYPE_ORDER) —
 * blade, lock-chip, main-blade, over-blade, assist-blade, ratchet, bit.
 */
export function groupPointListEntriesByValue(entries = []) {
  const groups = new Map();

  entries.forEach((entry) => {
    const key = isBannedValue(entry.value) ? "ban" : entry.value;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  });

  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    if (a === "ban") return 1;
    if (b === "ban") return -1;
    return b - a;
  });

  return sortedKeys.map((value) => ({
    value,
    entries: [...groups.get(value)].sort(
      (a, b) =>
        PART_TYPE_ORDER.indexOf(a.partType) -
        PART_TYPE_ORDER.indexOf(b.partType),
    ),
  }));
}

/**
 * Groups point-list entries (see buildPointListEntries) by part type
 * first, then by value within each part type — used for the "by part"
 * view. Part types are ordered to match the build schema (see
 * PART_TYPE_ORDER).
 */
export function groupPointListEntriesByPart(entries = []) {
  const groups = new Map();

  entries.forEach((entry) => {
    if (!groups.has(entry.partType)) groups.set(entry.partType, []);
    groups.get(entry.partType).push(entry);
  });

  const orderedPartTypes = Array.from(groups.keys()).sort(
    (a, b) => PART_TYPE_ORDER.indexOf(a) - PART_TYPE_ORDER.indexOf(b),
  );

  return orderedPartTypes.map((partType) => ({
    partType,
    valueGroups: groupPointListEntriesByValue(groups.get(partType)),
  }));
}

// Some catalog part JSONs use camelCase keys in their `builds.popular`
// combos (e.g. main-blades.json → { lockChip, assistBlade, overBlade,
// ratchet, bit }) instead of the app's normal kebab-case schema keys
// ("lock-chip", "assist-blade", "over-blade"). "ratchet"/"bit" already
// match either way.
const BUILD_COMBO_KEY_MAP = {
  lockChip: "lock-chip",
  mainBlade: "main-blade",
  overBlade: "over-blade",
  assistBlade: "assist-blade",
};

/**
 * Converts one raw `builds.popular`/`builds.family` combo entry (see
 * data/blades.json, data/main-blades.json → "builds") into the app's
 * normal kebab-case field names, ready to merge into a deck entry.
 */
export function normalizeBuildCombo(combo = {}) {
  const normalized = {};
  Object.entries(combo).forEach(([key, value]) => {
    const mappedKey = BUILD_COMBO_KEY_MAP[key] || key;
    normalized[mappedKey] = value;
  });
  return normalized;
}

/**
 * Every part slot a "pre-build" combo card should display, in schema
 * order, for a given entry type — the source part (the blade or
 * main-blade whose `builds.popular` was opened) plus whichever of the
 * combo's own fields are actually present. Fields with no value (e.g. a
 * ratchet-integrated blade's combo has no "ratchet") are simply skipped.
 *
 * @param {"simple"|"cx"} entryType
 * @param {string} sourcePartType - "blade" or "main-blade"
 * @param {string} sourcePartId
 * @param {Object} normalizedCombo - see normalizeBuildCombo
 * @returns {Array<{partType: string, partId: string}>}
 */
export function buildComboDisplayFields(
  entryType,
  sourcePartType,
  sourcePartId,
  normalizedCombo,
) {
  const order =
    entryType === "cx"
      ? ["lock-chip", "main-blade", "over-blade", "assist-blade", "ratchet", "bit"]
      : ["blade", "ratchet", "bit"];

  const merged = { ...normalizedCombo, [sourcePartType]: sourcePartId };

  return order
    .filter((partType) => Boolean(merged[partType]))
    .map((partType) => ({ partType, partId: merged[partType] }));
}
