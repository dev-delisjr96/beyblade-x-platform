import React from "react";

// Stats definitions (icons, units)
import { STAT_DEFINITIONS, getStatIcon } from "../../modules/partStats";

// Styles
import styles from "./PartStatsBar.module.scss";
import { generateClassesNames } from "styles/utilities";

/**
 * A compact row of icon+value pairs for one part's stats (see
 * data/*.json → "stats"): attack/defense/stamina (play-type icons) and
 * weight/dash/burstResistance (ionicons), in that order — only the keys
 * actually present on this specific part are shown (e.g. no dash/
 * burstResistance row for a blade, since only bits carry those).
 *
 * A `null` value (not measured/not applicable) shows as an "x" instead
 * of a number — see modules/partStats.js sumStats for how that's treated
 * as 0 wherever stats get totaled up.
 *
 * Renders nothing if `stats` is missing or empty, so it's always safe to
 * drop this in unconditionally under a part's image.
 */
/* eslint-disable-next-line no-unused-vars */
const PartStatsBar = ({ additionalstyles, stats, size = "sm", ...props }) => {
  const elements = ["root", "large", "stat", "stat-icon", "stat-value", "null-value"];
  const classes_names = generateClassesNames(
    elements,
    styles,
    additionalstyles,
  );

  if (!stats) return null;

  const visibleDefinitions = STAT_DEFINITIONS.filter(
    (definition) => definition.key in stats,
  );
  if (visibleDefinitions.length === 0) return null;

  return (
    <div
      className={`${classes_names["root"]} ${
        size === "lg" ? classes_names["large"] : ""
      }`}
      {...props}
    >
      {visibleDefinitions.map((definition) => {
        const rawValue = stats[definition.key];
        const isNullValue = rawValue === null || rawValue === undefined;

        return (
          <div className={classes_names["stat"]} key={definition.key}>
            {definition.iconType === "playType" ? (
              <img
                className={classes_names["stat-icon"]}
                src={getStatIcon(definition.key)}
                alt={definition.key}
              />
            ) : (
              <ion-icon
                name={definition.icon}
                className={classes_names["stat-icon"]}
              ></ion-icon>
            )}

            {isNullValue ? (
              <ion-icon
                name="close-outline"
                className={classes_names["null-value"]}
              ></ion-icon>
            ) : (
              <span className={classes_names["stat-value"]}>
                {rawValue}
                {definition.unit || ""}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PartStatsBar;
