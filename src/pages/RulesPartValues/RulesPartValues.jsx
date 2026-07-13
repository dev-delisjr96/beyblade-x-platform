import React, { useEffect, useState } from "react";

// Router
import { useParams } from "react-router-dom";

// Data
import PARTS from "../../data/index";

// RTDB
import { subscribeToRecord } from "../../modules/rtdb";

// Utilities
import * as beyXUtilities from "../../modules/utilities";

// Styles
import styles from "./RulesPartValues.module.scss";
import { generateClassesNames } from "styles/utilities";

/**
 * Simple, ungrouped listing of a rule set's part values — superseded by
 * RulesPointValues for everyday use, kept around as a flat reference view.
 * Subscribes live to
 * `tournaments-formats/{tournament_format}/clubs/{club}/{date}` in
 * Firebase RTDB.
 */
/* eslint-disable-next-line no-unused-vars */
const RulesPartValues = ({ additionalstyles, ...props }) => {
  const elements = ["values-page", "part", "part-row", "parts-list"];
  const classes_names = generateClassesNames(
    elements,
    styles,
    additionalstyles,
  );

  const { tournament_format, club, date } = useParams();
  const [ruleSet, setRuleSet] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToRecord(
      `tournaments-formats/${tournament_format}/clubs/${club}/${date}`,
      setRuleSet,
    );
    return unsubscribe;
  }, [tournament_format, club, date]);

  const rules_parts_values = ruleSet?.deck?.values || {};

  return (
    <div className={classes_names["values-page"]}>
      {Object.entries(rules_parts_values).map(function ([partType, parts]) {
        if (!Array.isArray(parts)) return null;

        return (
          <div
            className={classes_names["part-row"]}
            key={`value-row-${club}-${date}-${partType}`}
          >
            <p>{partType}</p>
            <div className={classes_names["parts-list"]}>
              {parts.map((pt) => {
                const partInfo = PARTS[partType]?.find(
                  (part) => part.id === pt.name,
                );
                if (!partInfo) return null;

                return (
                  <div
                    className={classes_names["part"]}
                    key={`part-card-${partType}-${partInfo.id}`}
                  >
                    <img src={partInfo.img} alt="" />
                    <p>{partInfo.name}</p>
                    <p>
                      {beyXUtilities.findPartValue(
                        rules_parts_values,
                        partType,
                        pt.name,
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RulesPartValues;
