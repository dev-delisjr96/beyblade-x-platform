import * as bey_x_utilities from "./utilities";
import * as bey_x_schemas from "./schema";
import * as rule_validator from "./rules/index";
import * as utilities from "../utilities/index";

export function checkSameParts(deckEntries = []) {
  const valueMap = new Map(); // value -> [{ index, key }, ...]

  deckEntries.forEach((entry, index) => {
    Object.entries(entry).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      if (!valueMap.has(value)) {
        valueMap.set(value, []);
      }
      valueMap.get(value).push({ index, key });
    });
  });

  // Keep only values that show up in more than one place
  const duplicates = {};
  for (const [value, occurrences] of valueMap.entries()) {
    if (occurrences.length > 1) {
      duplicates[value] = occurrences;
    }
  }

  return duplicates;
}

/**
 * The total value of a single build entry (e.g. one Beyblade in the deck),
 * summing every part's resolved rule-set value (see
 * modules/utilities.js findPartValue for how combo bonuses factor in).
 *
 * @param {Object} entry     - a single deck entry, e.g. { blade, ratchet, bit }
 * @param {Object} valuesSet - RULE_SET.deck.values for the selected rule-set
 * @param {Object} [toggles] - that entry's checkbox state (e.g. "Worn")
 */
export function calcEntryValue(entry = {}, valuesSet = {}, toggles = {}) {
  return Object.entries(entry).reduce((buildValue, [type, partName]) => {
    if (!partName || partName === "") return buildValue + 0;

    const found_value = bey_x_utilities.findPartValue(valuesSet, type, partName, {
      buildEntry: entry,
      toggles,
    });

    return buildValue + (found_value || 0);
  }, 0);
}

export function calcDeckTotalValue(
  deckEntries = [],
  valuesSet = rule_validator.RULE_SETS_STORED.ibna.deck.values,
  entryToggles = [],
) {
  let totalValue = 0;

  if (deckEntries.length > 0) {
    totalValue = deckEntries.reduce((prevValue, actualBuild, entryIndex) => {
      const toggles = entryToggles[entryIndex] || {};
      return prevValue + calcEntryValue(actualBuild, valuesSet, toggles);
    }, 0);
  }

  return totalValue;
}

export function buildDeck(
  deck = { ...bey_x_schemas.DECK_BUILD },
  entryIndex = 0,
  newPart = {
    type: "blade",
    name: undefined,
  },
  ruleSet = "ibna",
) {
  //   rule_validator.validateDeck(ruleSet, deck);

  let updating_build = {
    ...deck.entries[entryIndex],
    [newPart.type]: newPart.name,
  };
  let deck_entries_to_calculate = utilities.replaceAtIndex(
    deck.entries,
    entryIndex,
    updating_build,
  );

  const newTotal = calcDeckTotalValue(deck_entries_to_calculate);
  const areSameParts = checkSameParts(deck_entries_to_calculate);

  const newDeck = {
    entries: deck_entries_to_calculate,
    totalValue: newTotal,
    sameParts: areSameParts,
  };

  rule_validator.validateDeck(ruleSet, newDeck);

  return newDeck;
}
