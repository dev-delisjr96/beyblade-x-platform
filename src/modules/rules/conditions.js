/**
 * Rule-set "combo" engine.
 *
 * Some parts score a different value when paired with something else in the
 * same build. This is expressed directly in the rule-set value JSON via a
 * `rule-set` array of rule objects (see modules/rules/ibna/blade.json →
 * "bullet-griffon"):
 *
 *   {
 *     "part": "blade", "name": "bullet-griffon", "value": 4,
 *     "rule-set": [
 *       {
 *         "label": "+ Merge",
 *         "combo": [{ "part": "bit", "name": "merge" }],
 *         "newValue": 5
 *       }
 *     ]
 *   }
 *
 * A rule with a `combo` is "derived" — automatically satisfied when every
 * `{ part, name }` pair in the combo matches another part already selected
 * in the same build (e.g. picking the "Merge" bit alongside Bullet Griffon).
 *
 * A rule with NO `combo` (see bit "rubber-accel" → "Worn") can't be derived
 * from another part, so the player tells us about it with a checkbox on the
 * build card instead.
 */

import * as utilities from "../../utilities/index";

/** Turns a rule's label into a stable, key-safe slug. */
export function slugifyLabel(label = "") {
  return utilities.globalizeString(String(label), "-");
}

/** Stable per-entry storage key for a toggle-type rule's checkbox state. */
export function getRuleToggleKey(partName, rule, ruleIndex = 0) {
  const labelSlug = rule?.label ? slugifyLabel(rule.label) : `rule-${ruleIndex}`;
  return `${partName}__${labelSlug}`;
}

export function isRuleCombo(rule) {
  return Array.isArray(rule?.combo) && rule.combo.length > 0;
}

/**
 * Whether a given rule currently applies.
 *
 * @param {Object} rule       - one entry from a part's `rule-set` array
 * @param {number} ruleIndex  - that rule's index (used to build a stable
 *                               toggle key when the rule has no combo)
 * @param {string} partName   - the part this rule belongs to
 * @param {Object} [context]
 * @param {Object} [context.buildEntry] - the deck entry being built, used
 *   to check combo requirements against other selected parts
 * @param {Object} [context.toggles] - per-entry checkbox state, keyed by
 *   getRuleToggleKey(...)
 */
export function isRuleSatisfied(rule, ruleIndex, partName, context = {}) {
  const { buildEntry = {}, toggles = {} } = context;

  if (isRuleCombo(rule)) {
    return rule.combo.every(
      (requirement) => buildEntry?.[requirement.part] === requirement.name,
    );
  }

  return Boolean(toggles?.[getRuleToggleKey(partName, rule, ruleIndex)]);
}

/**
 * The raw `rule-set` array attached to a specific part's value entry
 * (matched by part type + name) inside a given rule-set's values object.
 * Falls back to the merged "cx" value list when the part type has no
 * dedicated entry (see modules/utilities.js findPartValue for the same
 * fallback behaviour).
 */
export function getPartRules(valuesSet = {}, partType, partName) {
  if (!partName) return [];

  const direct = (valuesSet?.[partType] || []).find(
    (entry) => entry.name === partName,
  );
  const entry = direct || (valuesSet?.cx || []).find(
    (item) => item.name === partName,
  );

  const rules = entry?.["rule-set"];
  return Array.isArray(rules) ? rules : [];
}
