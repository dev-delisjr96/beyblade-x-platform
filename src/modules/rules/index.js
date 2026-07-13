import ibna from "./ibna/index";
import ibna_dran_gladius from "./ibna-dran-gladius/index";
import * as errors from "./errors";
import * as schema from "../schema";

export const RULE_SETS_STORED = {
  ibna: ibna,
  // "dran-gladius": ibna_dran_gladius,
};

export function validateDeck(
  ruleSet = "ibna",
  deckBuild = {
    ...schema.DECK_BUILD,
  },
) {
  const RULE_SET = RULE_SETS_STORED[ruleSet];
  const LIMITS = RULE_SET?.deck?.limits?.deck;

  if (LIMITS?.maxEntries > 0 && deckBuild.entries.length > LIMITS?.maxEntries) {
    throw { ...errors.too_many_entries };
  }
  if (LIMITS?.maxValue && deckBuild.totalValue > LIMITS?.maxValue) {
    throw { ...errors.over_cap_value };
  }
  if (
    LIMITS?.allowSameParts === false &&
    Object.keys(deckBuild.sameParts).length > 0
  ) {
    throw { ...errors.same_parts_not_allowed };
  }
}
