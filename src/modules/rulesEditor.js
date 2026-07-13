/**
 * Pure data-mutation helpers for the admin "edit rule values" feature.
 * These all operate on a single part-type's value array (e.g.
 * `ruleSet.deck.values.blade`) and return a brand new array — callers are
 * responsible for actually persisting it (see components/EditPartValueModal
 * and pages/RulesPointValues, which write the result via
 * services/firebase/rtdb.js's `updateData`).
 */

export const ALL_PART_TYPES = [
  "blade",
  "ratchet",
  "bit",
  "lock-chip",
  "main-blade",
  "over-blade",
  "assist-blade",
];

/** Every part type a combo rule could reference, other than its own. */
export function getComboPartnerTypes(partType) {
  return ALL_PART_TYPES.filter((type) => type !== partType);
}

function getArray(valuesSet, partType) {
  return Array.isArray(valuesSet?.[partType]) ? valuesSet[partType] : [];
}

/**
 * Sets a part's base value (and optional rule-set combo bonus), replacing
 * any existing entry for that same part name first — a part can only
 * have one entry per part type.
 *
 * @param {Object} valuesSet - the rule set's full `deck.values` object
 * @param {string} partType
 * @param {string} partName
 * @param {number} value - the base point value
 * @param {Object} [comboRule] - { label, combo: [{part, name}], newValue }
 * @returns {Array} the new array for `valuesSet[partType]`
 */
export function upsertPartValue(
  valuesSet,
  partType,
  partName,
  value,
  comboRule = undefined,
) {
  const filtered = getArray(valuesSet, partType).filter(
    (entry) => entry.name !== partName,
  );

  const newEntry = { part: partType, name: partName, value };
  if (comboRule) newEntry["rule-set"] = [comboRule];

  return [...filtered, newEntry];
}

/** Removes a part's entry entirely from its part type's array. */
export function removePartValue(valuesSet, partType, partName) {
  return getArray(valuesSet, partType).filter(
    (entry) => entry.name !== partName,
  );
}

/** Changes just the base `value` of an existing part entry. */
export function changePartValueTier(valuesSet, partType, partName, newValue) {
  return getArray(valuesSet, partType).map((entry) =>
    entry.name === partName ? { ...entry, value: newValue } : entry,
  );
}

function comboSignature(rule) {
  return `${rule?.label ?? ""}::${JSON.stringify(rule?.combo ?? null)}`;
}

/**
 * Removes one specific rule-set rule from a part's entry (identified by
 * label + combo, since a part can carry more than one rule sharing a
 * label — e.g. bit "elevate" has two alternate "left" combos). Leaves the
 * part's base value and any other rules untouched.
 */
export function removeComboRule(valuesSet, partType, partName, rule) {
  const targetSignature = comboSignature(rule);

  return getArray(valuesSet, partType).map((entry) => {
    if (entry.name !== partName) return entry;

    const remainingRules = (entry["rule-set"] || []).filter(
      (existingRule) => comboSignature(existingRule) !== targetSignature,
    );

    const updated = { ...entry };
    if (remainingRules.length > 0) {
      updated["rule-set"] = remainingRules;
    } else {
      delete updated["rule-set"];
    }
    return updated;
  });
}

/**
 * Builds a combo rule object from the "rule-set" sub-form:
 * { comboPartType, comboPartName, bonusValue }.
 */
export function buildComboRule({ comboPartType, comboPartName, bonusValue }) {
  return {
    label: `+ ${comboPartName}`,
    combo: [{ part: comboPartType, name: comboPartName }],
    newValue: Number(bonusValue),
  };
}
