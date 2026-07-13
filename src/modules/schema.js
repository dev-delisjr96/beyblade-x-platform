export const DECK_BUILD = {
  entries: [],
  totalValue: 0,
  sameParts: {},
};

export const BEY_BUILD = {
  blade: undefined,
  ratchet: undefined,
  bit: undefined,
};
export const BEY_BUILD_CX = {
  "lock-chip": undefined,
  "main-blade": undefined,
  "over-blade": undefined,
  "assist-blade": undefined,
  ratchet: undefined,
  bit: undefined,
};

// The field list for each build type — shared between DeckEntryCard (which
// fields to render) and the completeness/summary helpers in utilities.js.
export const BUILD_TYPE_FIELDS = {
  simple: Object.keys(BEY_BUILD),
  cx: Object.keys(BEY_BUILD_CX),
};
