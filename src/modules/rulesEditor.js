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
 * Sets a part's base `value`, creating its entry if it doesn't exist yet.
 * Leaves any existing `rule-set` on that entry completely untouched —
 * changing the base value should never wipe out combo bonuses that were
 * already configured for it.
 *
 * @param {Object} valuesSet - the rule set's full `deck.values` object
 * @param {string} partType
 * @param {string} partName
 * @param {number} value - the base point value
 * @returns {Array} the new array for `valuesSet[partType]`
 */
export function setBaseValue(valuesSet, partType, partName, value) {
  const arr = getArray(valuesSet, partType);
  const exists = arr.some((entry) => entry.name === partName);

  if (!exists) {
    return [...arr, { part: partType, name: partName, value }];
  }

  return arr.map((entry) =>
    entry.name === partName ? { ...entry, value } : entry,
  );
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

/** Signature used to detect "is this the same rule already" — used by
 * addComboRule to update rather than duplicate. Combo-type rules (have a
 * `combo`) are matched by that combo, regardless of label, since a part
 * can only sensibly have one rule per combo target. Toggle-type rules
 * (no `combo`, e.g. bit "rubber-accel" → "Worn") have nothing else to key
 * on, so they're matched by label instead — otherwise every toggle
 * condition on the same part would collide with each other. */
function comboOnlySignature(rule) {
  if (Array.isArray(rule?.combo) && rule.combo.length > 0) {
    return `combo::${JSON.stringify(rule.combo)}`;
  }
  return `toggle::${rule?.label ?? ""}`;
}

/**
 * Adds (or updates, if the same combo already exists) one rule-set rule
 * on a part's entry, WITHOUT touching its base `value` or any of its
 * other existing rules. Creates the entry with `value: 0` if the part
 * doesn't have one yet — the combo rule is what matters here, the base
 * value is just a placeholder until someone sets it explicitly.
 *
 * This is deliberately separate from setBaseValue: a combo rule can (and
 * often should) be attached to a *different* part than the one the admin
 * was originally adding — see the "blade takes priority" rule in
 * pages/RulesPointValues.
 */
export function addComboRule(valuesSet, partType, partName, comboRule) {
  const arr = getArray(valuesSet, partType);
  const existingIndex = arr.findIndex((entry) => entry.name === partName);

  if (existingIndex === -1) {
    return [
      ...arr,
      { part: partType, name: partName, value: 0, "rule-set": [comboRule] },
    ];
  }

  const targetSignature = comboOnlySignature(comboRule);

  return arr.map((entry, index) => {
    if (index !== existingIndex) return entry;

    const existingRules = Array.isArray(entry["rule-set"])
      ? entry["rule-set"]
      : [];
    const otherRules = existingRules.filter(
      (rule) => comboOnlySignature(rule) !== targetSignature,
    );

    return { ...entry, "rule-set": [...otherRules, comboRule] };
  });
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
 * Changes just one specific rule-set rule's `newValue` (identified by
 * label + combo, same as removeComboRule) — the "+"/"-" up/down controls
 * on a combo/condition chip use this. Leaves the part's base `value` and
 * every other rule on it completely untouched; only that one rule's
 * value changes in RTDB.
 */
export function changeRuleValueTier(valuesSet, partType, partName, rule, newValue) {
  const targetSignature = comboSignature(rule);

  return getArray(valuesSet, partType).map((entry) => {
    if (entry.name !== partName) return entry;

    const updatedRules = (entry["rule-set"] || []).map((existingRule) =>
      comboSignature(existingRule) === targetSignature
        ? { ...existingRule, newValue }
        : existingRule,
    );

    return { ...entry, "rule-set": updatedRules };
  });
}
