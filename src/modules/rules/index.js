import ibna from "./ibna/index";
/* eslint-disable-next-line no-unused-vars */
import ibna_dran_gladius from "./ibna-dran-gladius/index";
import * as errors from "./errors";
import * as schema from "../schema";
import * as beyXUtilities from "../utilities";

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
 * shapes agree on `ruleSet.deck.limits` being a flat object, though not
 * every format sets every key — e.g. a non-point-buy format's limits
 * might just be `{ entries: 3, allowSameParts: false }` with no
 * `maxValue`/`values` at all, which is fine: each check below only runs
 * when its relevant limit is actually present.
 *
 * `maxEntries` and `entries` are treated as the same limit (some formats
 * only set one or the other) — whichever is present caps the deck size.
 *
 * Play-type formats (see pages/DeckBuilderPage EditLimitsModal) add two
 * more limits, both keyed off each build's play type — which, same rule
 * as everywhere else in the app, is determined by the bit only (see
 * modules/utilities.js getPartPlayType):
 *  - `allowedPlayTypes`: every build's play type must be in this list.
 *  - `allowSamePlayType: false`: no two builds may share a play type.
 * Builds with no play type at all (e.g. an empty slot, or a bit with no
 * play_type) are simply skipped by both checks.
 */
export function validateDeck(
  ruleSet = null,
  deckBuild = {
    ...schema.DECK_BUILD,
  },
) {
  const LIMITS = ruleSet?.deck?.limits;
  const maxEntries = LIMITS?.maxEntries ?? LIMITS?.entries;

  if (maxEntries > 0 && deckBuild.entries.length > maxEntries) {
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

  const playTypes = deckBuild.entries
    .map((entry) => beyXUtilities.getPartPlayType("bit", entry?.bit))
    .filter(Boolean);

  if (
    Array.isArray(LIMITS?.allowedPlayTypes) &&
    LIMITS.allowedPlayTypes.length > 0
  ) {
    const hasDisallowedPlayType = playTypes.some(
      (playType) => !LIMITS.allowedPlayTypes.includes(playType),
    );
    if (hasDisallowedPlayType) {
      throw { ...errors.play_type_not_allowed };
    }
  }

  if (LIMITS?.allowSamePlayType === false) {
    const seenPlayTypes = new Set();
    const hasDuplicatePlayType = playTypes.some((playType) => {
      if (seenPlayTypes.has(playType)) return true;
      seenPlayTypes.add(playType);
      return false;
    });
    if (hasDuplicatePlayType) {
      throw { ...errors.same_play_type_not_allowed };
    }
  }
}
