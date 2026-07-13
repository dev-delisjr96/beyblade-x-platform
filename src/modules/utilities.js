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
 * Falls back to the merged "cx" value list (used by rule sets that group
 * main-blade / over-blade / assist-blade / lock-chip values together) when
 * the part type has no dedicated entry in the values set at all.
 *
 * @param {Object} valuesSet - RULE_SET.deck.values for the selected rule-set
 * @param {string} partType  - e.g. "blade", "main-blade", "ratchet", "bit"
 * @param {string} partName  - the part's id/name to look up
 * @param {Object} [context] - passed straight through to
 *   ruleConditions.isRuleSatisfied — { buildEntry, toggles }
 * @returns {number|null|undefined} undefined when the part has no rule-set
 *   entry at all; otherwise its resolved value (which may be null for
 *   explicitly unscored parts, e.g. "metal-needle").
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

  if (!entry) return undefined;

  const rules = Array.isArray(entry["rule-set"]) ? entry["rule-set"] : [];

  for (let ruleIndex = 0; ruleIndex < rules.length; ruleIndex++) {
    const rule = rules[ruleIndex];
    if (ruleConditions.isRuleSatisfied(rule, ruleIndex, partName, context)) {
      return rule.newValue;
    }
  }

  return entry.value;
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
 * Flattens a whole rule-set's values object into a list of "point list"
 * chip entries — one per part, plus one more per rule-set combo/toggle
 * bonus it carries (see modules/rules/conditions.js), each tagged with
 * the point value it's worth.
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
        }
      });
    });
  });

  return entries;
}

/**
 * Groups point-list entries (see buildPointListEntries) by their value,
 * returned as value/entries pairs already sorted highest-to-lowest, with
 * `null` (banned parts) sorted last as its own group.
 */
export function groupPointListEntriesByValue(entries = []) {
  const groups = new Map();

  entries.forEach((entry) => {
    const key = entry.value;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  });

  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    if (a === null) return 1;
    if (b === null) return -1;
    return b - a;
  });

  return sortedKeys.map((value) => ({ value, entries: groups.get(value) }));
}

/**
 * Groups point-list entries (see buildPointListEntries) by part type
 * first, then by value within each part type — used for the "by part"
 * view. Part types are ordered to match the build schema.
 */
export function groupPointListEntriesByPart(entries = []) {
  const partTypeOrder = [
    "blade",
    "lock-chip",
    "main-blade",
    "over-blade",
    "assist-blade",
    "ratchet",
    "bit",
  ];

  const groups = new Map();

  entries.forEach((entry) => {
    if (!groups.has(entry.partType)) groups.set(entry.partType, []);
    groups.get(entry.partType).push(entry);
  });

  const orderedPartTypes = Array.from(groups.keys()).sort(
    (a, b) => partTypeOrder.indexOf(a) - partTypeOrder.indexOf(b),
  );

  return orderedPartTypes.map((partType) => ({
    partType,
    valueGroups: groupPointListEntriesByValue(groups.get(partType)),
  }));
}
