import attackIcon from "../assets/attack-icon.png";
import balanceIcon from "../assets/balance-icon.png";
import staminaIcon from "../assets/stamina-icon.png";
import defenseIcon from "../assets/defense-icon.png";

/**
 * Beyblade X "play type" (attack/balance/stamina/defense) — a physical
 * attribute some parts carry (see data/blades.json, bits.json,
 * main-blades.json, assist-blades.json → "play_type"), completely
 * unrelated to rule-set point values. Works the same in every tournament
 * format.
 */
export const PLAY_TYPES = ["attack", "balance", "stamina", "defense"];

export const PLAY_TYPE_ICONS = {
  attack: attackIcon,
  balance: balanceIcon,
  stamina: staminaIcon,
  defense: defenseIcon,
};

export function getPlayTypeIcon(playType) {
  return PLAY_TYPE_ICONS[playType];
}
