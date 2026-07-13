import blades from "./blades.json";
import main_blades from "./main-blades.json";
import over_blades from "./over-blades.json";
import assist_blades from "./assist-blades.json";
import lock_chips from "./lock-chip.json";
import ratchets from "./ratchets.json";
import bits from "./bits.json";

const PARTS = {
  blade: blades,
  "main-blade": main_blades,
  "over-blade": over_blades,
  "assist-blade": assist_blades,
  "lock-chip": lock_chips,
  ratchet: ratchets,
  bit: bits,
};

export default PARTS;
