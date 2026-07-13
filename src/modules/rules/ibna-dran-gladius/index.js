import bits from "./bit.json";
import blades from "./blade.json";
import main_blades from "./main-blade.json";
import assist_blades from "./assist-blade.json";
import ratchets from "./ratchet.json";
import lock_chips from "./lock-chip.json";
import limits from "./limits.json";

const PARTS_VALUES = {
  blade: blades,
  "lock-chip": lock_chips,
  "main-blade": main_blades,
  "assist-blade": assist_blades,
  ratchet: ratchets,
  bit: bits,
};

const RULE_SET = {
  deck: {
    values: PARTS_VALUES,
    limits: limits,
  },
};

export default RULE_SET;
