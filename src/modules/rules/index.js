import ibna from "./ibna/index";
/* eslint-disable-next-line no-unused-vars */
import ibna_dran_gladius from "./ibna-dran-gladius/index";
import * as errors from "./errors";
import * as schema from "../schema";

// Kept around as legacy/local fallback rule sets. The app's live data now
// comes from Firebase RTDB per club/date (see services/firebase/rtdb.js
// and pages/DeckBuilderPage) rather than from this static registry.
export const RULE_SETS_STORED = {
  ibna: ibna,
  // "dran-gladius": ibna_dran_gladius,
};

/**
 * Validates a deck build against a rule set's limits.
 *
 * `ruleSet` is a full rule-set object — either one of the legacy
 * RULE_SETS_STORED entries above, or (the common case now) whatever comes
 * back from subscribing to `rules/{club}/{date}` in Firebase RTDB. Both
 * shapes agree on `ruleSet.deck.limits` being a flat object of
 * { entries, maxEntries, maxValue, allowSameParts }.
 */
export function validateDeck(
  ruleSet = null,
  deckBuild = {
    ...schema.DECK_BUILD,
  },
) {
  const LIMITS = ruleSet?.deck?.limits;

  if (
    LIMITS?.maxEntries > 0 &&
    deckBuild.entries.length > LIMITS?.maxEntries
  ) {
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
