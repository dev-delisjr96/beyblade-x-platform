const ERRORS_TYPE = {
  deck: {
    validation: "deck-validation",
  },
};

export const too_many_entries = {
  type: ERRORS_TYPE.deck.validation,
  message: "too_many",
};
export const not_enough_entries = {
  type: ERRORS_TYPE.deck.validation,
  message: "not_enough",
};
export const over_cap_value = {
  type: ERRORS_TYPE.deck.validation,
  message: "over_cap_value",
};
export const same_parts_not_allowed = {
  type: ERRORS_TYPE.deck.validation,
  message: "same_parts_not_allowed",
};
